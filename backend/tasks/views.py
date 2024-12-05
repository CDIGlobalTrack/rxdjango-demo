from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from .models import Project, Task
from .serializers import ProjectSerializer, TaskSerializer


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({"token": token.key})
        else:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        project_id = self.request.data.get('project')
        project = get_object_or_404(Project, id=project_id)
        serializer.save(user=self.request.user, project=project)

    def perform_update(self, serializer):
        task = get_object_or_404(Task, id=self.kwargs['pk'])
        if not (self.request.user == task.user or self.request.user.is_superuser):
            return Response({"error": "You do not have permission to update this task."}, status=status.HTTP_403_FORBIDDEN)
        serializer.save(instance=task)

    def destroy(self, request, *args, **kwargs):
        task = get_object_or_404(Task, id=self.kwargs['pk'])
        if not (request.user == task.user or request.user.is_superuser):
            return Response({"error": "You do not have permission to delete this task."}, status=status.HTTP_403_FORBIDDEN)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
