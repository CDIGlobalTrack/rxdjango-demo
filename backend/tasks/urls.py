from django.urls import path
from .views import ProjectDetailView, LoginView

urlpatterns = [
    path('projects/<int:id>/', ProjectDetailView.as_view(), name='project-detail'),
    path('login/', LoginView.as_view(), name='login'),
]
