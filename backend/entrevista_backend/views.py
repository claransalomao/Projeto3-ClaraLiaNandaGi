from django.contrib.auth import authenticate
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .analise_vaga import analisar_vaga
from .entrevista_ia import avaliar_resposta, gerar_pergunta
from .gemini import GeminiError
from .models import AnaliseVaga, Entrevista, Pergunta
from .serializers import (
    AnaliseVagaSerializer, CadastroSerializer, EntrevistaResumoSerializer,
    EntrevistaSerializer, LoginSerializer, NovaEntrevistaSerializer,
    PerguntaSerializer, UserSerializer,
)


def resposta_com_token(user, status_code=status.HTTP_200_OK):
    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {'token': token.key, 'user': UserSerializer(user).data},
        status=status_code,
    )


# Endpoints públicos: ignoram o header Authorization (um token antigo salvo
# no navegador não pode impedir o login/cadastro)
@api_view(['POST'])
@authentication_classes([])
def api_cadastro(request):
    serializer = CadastroSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    user = serializer.save()
    return resposta_com_token(user, status.HTTP_201_CREATED)


@api_view(['POST'])
@authentication_classes([])
def api_login(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(
        username=serializer.validated_data['email'].lower().strip(),
        password=serializer.validated_data['senha'],
    )
    if user is None:
        return Response(
            {'detail': 'E-mail ou senha incorretos.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    return resposta_com_token(user)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_logout(request):
    request.user.auth_token.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_me(request):
    return Response(UserSerializer(request.user).data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def api_vagas(request):
    # GET: lista as análises do usuário logado
    if request.method == 'GET':
        analises = AnaliseVaga.objects.filter(usuario=request.user)
        return Response(AnaliseVagaSerializer(analises, many=True).data)

    # POST: analisa uma vaga nova com o Gemini
    descricao = request.data.get('descricao', '').strip()
    area = request.data.get('area', '')
    nivel = request.data.get('nivel', '')

    if len(descricao) < 80:
        return Response({'detail': 'Cole a descrição completa da vaga.'},
                        status=status.HTTP_400_BAD_REQUEST)

    try:
        resultado = analisar_vaga(descricao, area, nivel)
    except GeminiError as e:
        return Response({'detail': str(e)}, status=e.status)

    analise = AnaliseVaga.objects.create(
        usuario=request.user, descricao=descricao, area=area, nivel=nivel, resultado=resultado,
    )
    return Response(AnaliseVagaSerializer(analise).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_vaga(request, analise_id):
    analise = get_object_or_404(AnaliseVaga, id=analise_id, usuario=request.user)
    return Response(AnaliseVagaSerializer(analise).data)


# ---------------------------------------------------------------------------
# Entrevista com IA
# ---------------------------------------------------------------------------

def _criar_proxima_pergunta(entrevista):
    """Pede a próxima pergunta à IA e salva. Não faz nada se a entrevista já acabou."""
    if entrevista.perguntas.count() >= entrevista.num_perguntas:
        return None
    gerada = gerar_pergunta(entrevista)
    return Pergunta.objects.create(
        entrevista=entrevista,
        ordem=entrevista.perguntas.count() + 1,
        tema=gerada['tema'][:100],
        texto=gerada['pergunta'],
        follow_up=bool(gerada.get('follow_up')),
    )


def _finalizar_se_acabou(entrevista):
    acabou = (entrevista.perguntas.count() >= entrevista.num_perguntas
              and entrevista.pergunta_atual() is None)
    if acabou and not entrevista.finalizada:
        entrevista.finalizada = True
        entrevista.finalizada_em = timezone.now()
        entrevista.save()


def _entrevista_do_usuario(request, entrevista_id):
    return get_object_or_404(Entrevista, id=entrevista_id, usuario=request.user)


def _entrevista_ativa(entrevista):
    """Retorna (pergunta_atual, erro). erro é um Response se não dá para continuar."""
    if entrevista.finalizada:
        return None, Response({'detail': 'Esta entrevista já foi finalizada.'},
                              status=status.HTTP_400_BAD_REQUEST)
    pergunta = entrevista.pergunta_atual()
    if pergunta is None:
        return None, Response({'detail': 'Não há pergunta aguardando resposta.'},
                              status=status.HTTP_400_BAD_REQUEST)
    return pergunta, None


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def api_entrevistas(request):
    # GET: histórico do usuário logado (sem as perguntas)
    if request.method == 'GET':
        entrevistas = Entrevista.objects.filter(usuario=request.user).prefetch_related('perguntas')
        return Response(EntrevistaResumoSerializer(entrevistas, many=True).data)

    # POST: cria a entrevista e gera a primeira pergunta
    serializer = NovaEntrevistaSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    dados = serializer.validated_data

    analise = None
    if dados['analise_vaga_id']:
        analise = get_object_or_404(AnaliseVaga, id=dados['analise_vaga_id'], usuario=request.user)

    try:
        with transaction.atomic():
            entrevista = Entrevista.objects.create(
                usuario=request.user,
                area=dados['area'],
                tipos=dados['tipos'],
                entrevistador=dados['entrevistador'],
                nivel=dados['nivel'],
                num_perguntas=dados['num_perguntas'],
                vaga=dados['vaga'].strip(),
                analise_vaga=analise,
            )
            _criar_proxima_pergunta(entrevista)
    except GeminiError as e:
        # Se a IA falhar, a entrevista não fica salva pela metade
        return Response({'detail': str(e)}, status=e.status)

    return Response(EntrevistaSerializer(entrevista).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def api_entrevista(request, entrevista_id):
    entrevista = _entrevista_do_usuario(request, entrevista_id)
    if request.method == 'DELETE':
        entrevista.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    return Response(EntrevistaSerializer(entrevista).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_responder(request, entrevista_id):
    """Recebe a resposta da pergunta atual, devolve o feedback e a próxima pergunta."""
    entrevista = _entrevista_do_usuario(request, entrevista_id)
    pergunta, erro = _entrevista_ativa(entrevista)
    if erro:
        return erro

    resposta = request.data.get('resposta', '').strip()
    if not resposta:
        return Response({'detail': 'Escreva uma resposta ou pule a pergunta.'},
                        status=status.HTTP_400_BAD_REQUEST)

    try:
        feedback = avaliar_resposta(entrevista, pergunta, resposta)
    except GeminiError as e:
        return Response({'detail': str(e)}, status=e.status)

    pergunta.resposta = resposta
    pergunta.respondida_em = timezone.now()
    pergunta.nota = feedback['nota']
    pergunta.pontos_fortes = feedback['pontos_fortes']
    pergunta.o_que_melhorar = feedback['o_que_melhorar']
    pergunta.resposta_modelo = feedback['resposta_modelo']
    pergunta.save()

    return _continuar(entrevista, pergunta)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_pular(request, entrevista_id):
    """Pula a pergunta atual (sem nota) e devolve a próxima."""
    entrevista = _entrevista_do_usuario(request, entrevista_id)
    pergunta, erro = _entrevista_ativa(entrevista)
    if erro:
        return erro

    pergunta.pulada = True
    pergunta.save()
    return _continuar(entrevista, pergunta)


def _continuar(entrevista, pergunta_respondida):
    """Gera a próxima pergunta (ou finaliza) e monta a resposta da API."""
    proxima = None
    aviso = None
    try:
        proxima = _criar_proxima_pergunta(entrevista)
    except GeminiError as e:
        # A resposta já foi salva; o front pode pedir a próxima depois em /proxima/
        aviso = str(e)

    _finalizar_se_acabou(entrevista)
    return Response({
        'pergunta_respondida': PerguntaSerializer(pergunta_respondida).data,
        'proxima_pergunta': PerguntaSerializer(proxima).data if proxima else None,
        'finalizada': entrevista.finalizada,
        'aviso': aviso,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_proxima(request, entrevista_id):
    """Gera a próxima pergunta de novo, caso a IA tenha falhado em /responder/ ou /pular/."""
    entrevista = _entrevista_do_usuario(request, entrevista_id)
    if entrevista.finalizada:
        return Response({'detail': 'Esta entrevista já foi finalizada.'},
                        status=status.HTTP_400_BAD_REQUEST)
    atual = entrevista.pergunta_atual()
    if atual:
        return Response(PerguntaSerializer(atual).data)
    try:
        proxima = _criar_proxima_pergunta(entrevista)
    except GeminiError as e:
        return Response({'detail': str(e)}, status=e.status)
    if proxima is None:
        _finalizar_se_acabou(entrevista)
        return Response({'detail': 'A entrevista não tem mais perguntas.'},
                        status=status.HTTP_400_BAD_REQUEST)
    return Response(PerguntaSerializer(proxima).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_encerrar(request, entrevista_id):
    """Botão "Encerrar": finaliza antes do fim. Perguntas sem resposta são descartadas."""
    entrevista = _entrevista_do_usuario(request, entrevista_id)
    if not entrevista.finalizada:
        entrevista.perguntas.filter(respondida_em__isnull=True, pulada=False).delete()
        entrevista.finalizada = True
        entrevista.finalizada_em = timezone.now()
        entrevista.save()
    return Response(EntrevistaSerializer(entrevista).data)