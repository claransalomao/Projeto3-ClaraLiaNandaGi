from django.urls import path

from . import views

urlpatterns = [
    path('cadastro/', views.api_cadastro),
    path('login/', views.api_login),
    path('logout/', views.api_logout),
    path('me/', views.api_me),
    path('vagas/', views.api_vagas),
    path('vagas/<int:analise_id>/', views.api_vaga),
]
