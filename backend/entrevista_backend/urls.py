from django.urls import path

from . import views

urlpatterns = [
    path('cadastro/', views.api_cadastro),
    path('login/', views.api_login),
    path('logout/', views.api_logout),
    path('me/', views.api_me),
]
