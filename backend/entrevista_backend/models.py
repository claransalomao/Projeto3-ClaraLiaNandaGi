from django.db import models
from django.conf import settings

# Os usuários usam o model padrão do Django (django.contrib.auth.models.User):
# - username = e-mail (usado no login)
# - first_name = nome


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


class Entrevista(models.Model):
    ENTREVISTADORES = [
        ('rh', 'RH amigável'),
        ('gestor', 'Gestor técnico'),
        ('case', 'Case / banco'),
    ]

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='entrevistas',
    )
    area = models.CharField(max_length=100)
    tipos = models.JSONField(default=list)  # ex.: ["Comportamental", "Técnica"]
    entrevistador = models.CharField(max_length=20, choices=ENTREVISTADORES)
    nivel = models.CharField(max_length=50)
    num_perguntas = models.PositiveSmallIntegerField(default=5)
    vaga = models.TextField(blank=True)  # descrição da vaga colada (opcional)
    analise_vaga = models.ForeignKey(
        AnaliseVaga, on_delete=models.SET_NULL, null=True, blank=True, related_name='entrevistas',
    )
    finalizada = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)
    finalizada_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-criado_em']

    def __str__(self):
        return f'{self.id}. {self.area} · {self.get_entrevistador_display()}'

    @property
    def nota_media(self):
        notas = [p.nota for p in self.perguntas.all() if p.nota is not None]
        if not notas:
            return None
        return round(sum(notas) / len(notas), 1)

    def pergunta_atual(self):
        """Primeira pergunta ainda sem resposta (e não pulada)."""
        return self.perguntas.filter(respondida_em__isnull=True, pulada=False).first()


class Pergunta(models.Model):
    entrevista = models.ForeignKey(Entrevista, on_delete=models.CASCADE, related_name='perguntas')
    ordem = models.PositiveSmallIntegerField()
    tema = models.CharField(max_length=100)  # título curto, ex.: "Decisão técnica"
    texto = models.TextField()
    follow_up = models.BooleanField(default=False)  # gerada a partir da resposta anterior

    resposta = models.TextField(blank=True)
    pulada = models.BooleanField(default=False)
    respondida_em = models.DateTimeField(null=True, blank=True)

    # Feedback da IA
    nota = models.FloatField(null=True, blank=True)
    pontos_fortes = models.TextField(blank=True)
    o_que_melhorar = models.TextField(blank=True)
    resposta_modelo = models.TextField(blank=True)

    class Meta:
        ordering = ['ordem']

    def __str__(self):
        return f'{self.ordem}. {self.tema}'