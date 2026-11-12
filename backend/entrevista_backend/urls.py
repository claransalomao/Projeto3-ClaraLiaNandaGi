from django.urls import path

from . import views

urlpatterns = [
    path('notes/', views.api_notes),
    path('notes/<int:note_id>/', views.api_note),
]
