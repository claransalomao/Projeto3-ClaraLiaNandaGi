from django.db import models
from django.conf import settings

# Os usuários usam o model padrão do Django (django.contrib.auth.models.User):
# - username = e-mail (usado no login)
# - first_name = nome
# Os models de entrevista serão adicionados nas próximas tarefas.

class AnaliseVaga(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='analises_vaga',
    )
    descricao = models.TextField()
    area = models.CharField(max_length=100, blank=True)
    nivel = models.CharField(max_length=50, blank=True)
    resultado = models.JSONField()
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-criado_em']

    def __str__(self):
        return f"{self.id}. {self.resultado.get('cargo', '')}"