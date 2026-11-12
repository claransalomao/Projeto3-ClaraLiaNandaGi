from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import AnaliseVaga


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