from django.http import Http404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Note
from .serializers import NoteSerializer


@api_view(['GET', 'PUT', 'DELETE'])
def api_note(request, note_id):
    try:
        note = Note.objects.get(id=note_id)
    except Note.DoesNotExist:
        raise Http404()

    if request.method == 'PUT':
        new_note_data = request.data
        note.title = new_note_data['title']
        note.content = new_note_data['content']
        note.save()

    if request.method == 'DELETE':
        note.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serialized_note = NoteSerializer(note)
    return Response(serialized_note.data)


@api_view(['GET', 'POST'])
def api_notes(request):
    if request.method == 'POST':
        new_note_data = request.data
        Note.objects.create(
            title=new_note_data['title'],
            content=new_note_data['content'],
        )

    notes = Note.objects.all()
    serialized_notes = NoteSerializer(notes, many=True)
    return Response(serialized_notes.data)
