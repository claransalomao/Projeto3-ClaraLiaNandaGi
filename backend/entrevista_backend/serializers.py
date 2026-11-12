from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import AnaliseVaga, Entrevista, Pergunta


class UserSerializer(serializers.ModelSerializer):
    nome = serializers.CharField(source='first_name')

    class Meta:
        model = User
        fields = ['id', 'nome', 'email']


class CadastroSerializer(serializers.Serializer):
    nome = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    senha = serializers.CharField(write_only=True)

    def validate_email(self, email):
        email = email.lower().strip()
        if User.objects.filter(username=email).exists():
            raise serializers.ValidationError('Já existe uma conta com este e-mail.')
        return email

    def validate(self, data):
        # Usa os validadores de senha definidos em AUTH_PASSWORD_VALIDATORS
        usuario = User(username=data['email'], email=data['email'], first_name=data['nome'])
        try:
            validate_password(data['senha'], user=usuario)
        except Exception as erro:
            raise serializers.ValidationError({'senha': list(erro.messages)})
        return data

    def create(self, data):
        return User.objects.create_user(
            username=data['email'],
            email=data['email'],
            first_name=data['nome'],
            password=data['senha'],
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    senha = serializers.CharField(write_only=True)


class AnaliseVagaSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnaliseVaga
        fields = ['id', 'descricao', 'area', 'nivel', 'resultado', 'criado_em']


class NovaEntrevistaSerializer(serializers.Serializer):
    """Valida a configuração enviada pelo painel "Nova entrevista"."""
    area = serializers.CharField(max_length=100)
    tipos = serializers.ListField(child=serializers.CharField(max_length=50), allow_empty=False)
    entrevistador = serializers.ChoiceField(choices=[c[0] for c in Entrevista.ENTREVISTADORES])
    nivel = serializers.CharField(max_length=50)
    num_perguntas = serializers.IntegerField(min_value=3, max_value=10, default=5)
    vaga = serializers.CharField(required=False, allow_blank=True, default='')
    analise_vaga_id = serializers.IntegerField(required=False, allow_null=True, default=None)


class PerguntaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pergunta
        fields = [
            'id', 'ordem', 'tema', 'texto', 'follow_up',
            'resposta', 'pulada', 'respondida_em',
            'nota', 'pontos_fortes', 'o_que_melhorar', 'resposta_modelo',
        ]


class EntrevistaSerializer(serializers.ModelSerializer):
    perguntas = PerguntaSerializer(many=True, read_only=True)
    entrevistador_nome = serializers.CharField(source='get_entrevistador_display', read_only=True)
    nota_media = serializers.FloatField(read_only=True)

    class Meta:
        model = Entrevista
        fields = [
            'id', 'area', 'tipos', 'entrevistador', 'entrevistador_nome', 'nivel',
            'num_perguntas', 'vaga', 'analise_vaga', 'finalizada', 'criado_em',
            'finalizada_em', 'nota_media', 'perguntas',
        ]


class EntrevistaResumoSerializer(serializers.ModelSerializer):
    """Versão leve para listas (histórico), sem as perguntas."""
    entrevistador_nome = serializers.CharField(source='get_entrevistador_display', read_only=True)
    nota_media = serializers.FloatField(read_only=True)

    class Meta:
        model = Entrevista
        fields = [
            'id', 'area', 'tipos', 'entrevistador', 'entrevistador_nome', 'nivel',
            'num_perguntas', 'finalizada', 'criado_em', 'finalizada_em', 'nota_media',
        ]