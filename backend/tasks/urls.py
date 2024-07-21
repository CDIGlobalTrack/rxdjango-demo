from django.urls import path
from .views import ProjectDetailView

urlpatterns = [
    path('projects/<int:id>/', ProjectDetailView.as_view(), name='project-detail'),
]
