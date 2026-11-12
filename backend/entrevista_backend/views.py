from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .serializers import CadastroSerializer, LoginSerializer, UserSerializer


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
