from django.urls import path

from . import views

urlpatterns = [
    path('cadastro/', views.api_cadastro),
    path('login/', views.api_login),
    path('logout/', views.api_logout),
    path('me/', views.api_me),
    path('vagas/', views.api_vagas),
    path('vagas/<int:analise_id>/', views.api_vaga),
    path('entrevistas/', views.api_entrevistas),
    path('entrevistas/<int:entrevista_id>/', views.api_entrevista),
    path('entrevistas/<int:entrevista_id>/responder/', views.api_responder),
    path('entrevistas/<int:entrevista_id>/pular/', views.api_pular),
    path('entrevistas/<int:entrevista_id>/proxima/', views.api_proxima),
    path('entrevistas/<int:entrevista_id>/encerrar/', views.api_encerrar),
]
