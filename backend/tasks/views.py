from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Project
from .serializers import ProjectSerializer

class ProjectDetailView(generics.RetrieveAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def get(self, request, *args, **kwargs):
        project_id = kwargs.get('id')
        project = get_object_or_404(Project, id=project_id)
        serializer = self.get_serializer(project)
        return Response(serializer.data, status=status.HTTP_200_OK)
