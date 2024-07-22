# RxDjango Tutorial Step 0: Existing application

To start the tutorial, let's set up an existing Django + React application.
We'll also setup ASGI, so that application is ready for RxDjango.
If you want to speed up, checkout the __step-0__ tag of the repository
and you should achieve the same result.

## Prerequisites

- Python 3.10+
- Node.js 14+
- npm or yarn

## Create the demo project folder

   ```bash
   mkdir rxdjango-demo
   cd rxdjango-demo
   ```

## Backend (Django + Django REST Framework)

### 1. Create a Django Project

1. **Create a virtual environment**:

   ```bash
   python -m venv backend-env
   ```

2. **Activate the virtual environment**:

   - On Windows:

     ```bash
     backend-env\Scripts\activate
     ```

   - On macOS/Linux:

     ```bash
     source backend-env/bin/activate
     ```

3. **Install Python dependencies**:

   ```bash
   pip install django djangorestframework djangorestframework.authtoken
   ```

4. **Create a new Django project**:

   ```bash
   django-admin startproject backend
   cd backend
   ```

### 2. Create a Django App

1. **Create a new Django app**:

   ```bash
   python manage.py startapp tasks
   ```

2. **Add the app to the project settings**:

   Edit `backend/settings.py` and add all dependencies and `'tasks'` to the `INSTALLED_APPS` list.

   ```python
   INSTALLED_APPS = [
       ...
       'corsheaders',
       'rest_framework',
       'rest_framework.authtoken',
       'tasks',
       ...
   ]
   ```

   Configure Django Rest Framework (DRF):

   ```python
   REST_FRAMEWORK = {
       'DEFAULT_AUTHENTICATION_CLASSES': [
           'rest_framework.authentication.TokenAuthentication',
       ],
       'DEFAULT_PERMISSION_CLASSES': [
           'rest_framework.permissions.IsAuthenticated',
       ],
   }
   ```

   Add `CORS middleware`:

   ```python
   MIDDLEWARE = [
       ...
       'corsheaders.middleware.CorsMiddleware',
       'django.middleware.common.CommonMiddleware',
       ...
   ]
   ```

   Configure `CORS` settings:

   ```python
   CORS_ALLOWED_ORIGINS = [
       "http://localhost:3000",  # Add your React frontend URL here
   ]
   ```

3. **Create models**:

   Edit `tasks/models.py` to define your models:

   ```python
   from django.db import models
   from django.contrib.auth.models import AbstractUser

   class User(AbstractUser):
       email = models.EmailField(unique=True)

   class Project(models.Model):
       name = models.CharField(max_length=255)
       description = models.TextField(blank=True, null=True)
       user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
       created_at = models.DateTimeField(auto_now_add=True)
       updated_at = models.DateTimeField(auto_now=True)

       def __str__(self):
           return self.name

   class Participant(models.Model):
       project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='participants')
       user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='participants')
       joined_at = models.DateTimeField(auto_now_add=True)

       class Meta:
           unique_together = ('project', 'user')

       def __str__(self):
           return f'{self.user.username} - {self.project.name}'

   class Task(models.Model):
       title = models.CharField(max_length=255)
       description = models.TextField(blank=True, null=True)
       completed = models.BooleanField(default=False)
       user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
       project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
       created_at = models.DateTimeField(auto_now_add=True)
       updated_at = models.DateTimeField(auto_now=True)

       def __str__(self):
           return self.title
   ```

4. **Create serializers**:

   Create a `tasks/serializers.py` file:

   ```python
   from rest_framework import serializers
   from .models import Project, Task, Participant, User

   class UserSerializer(serializers.ModelSerializer):
       class Meta:
           model = User
           fields = ['id', 'username', 'email']

   class TaskSerializer(serializers.ModelSerializer):
       user = UserSerializer(read_only=True)

       class Meta:
           model = Task
           fields = ['id', 'title', 'description', 'completed', 'user', 'created_at', 'updated_at']

   class ParticipantSerializer(serializers.ModelSerializer):
       user = UserSerializer(read_only=True)

       class Meta:
           model = Participant
           fields = ['id', 'user', 'joined_at']

   class ProjectSerializer(serializers.ModelSerializer):
       tasks = TaskSerializer(many=True, read_only=True)
       participants = ParticipantSerializer(many=True, read_only=True)
       user = UserSerializer(read_only=True)

       class Meta:
           model = Project
           fields = ['id', 'name', 'description', 'user', 'tasks', 'participants', 'created_at', 'updated_at']
   ```

5. **Create views**:

   Create a `tasks/views.py` file:

   ```python
   from rest_framework import generics
   from rest_framework.response import Response
   from rest_framework import status
   from rest_framework.authtoken.models import Token
   from rest_framework.response import Response
   from rest_framework.views import APIView
   from rest_framework.permissions import IsAuthenticated, AllowAny
   from django.contrib.auth import authenticate
   from django.shortcuts import get_object_or_404
   from .models import Project
   from .serializers import ProjectSerializer


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


   class ProjectDetailView(generics.RetrieveAPIView):
       queryset = Project.objects.all()
       serializer_class = ProjectSerializer
       permission_classes = [IsAuthenticated]

       def get(self, request, *args, **kwargs):
           project_id = kwargs.get('id')
           project = get_object_or_404(Project, id=project_id)
           serializer = self.get_serializer(project)
           return Response(serializer.data, status=status.HTTP_200_OK)


   ```

6. **Create URL configuration**:

   Create a `tasks/urls.py` file:

   ```python
   from django.urls import path
   from .views import ProjectDetailView, LoginView

   urlpatterns = [
       path('projects/<int:id>/', ProjectDetailView.as_view(), name='project-detail'),
       path('login/', LoginView.as_view(), name='login'),
   ]
   ```

   Edit `backend/urls.py` to include the app's URLs:

   ```python
   from django.contrib import admin
   from django.urls import path, include

   urlpatterns = [
       path('admin/', admin.site.urls),
       path('api/', include('tasks.urls')),  # Include the URLs from the tasks app
   ]
   ```

7. **Run migrations**:

   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

8. **Create a superuser**:

   ```bash
   python manage.py createsuperuser
   ```

9. **Start the backend server**:

   ```bash
   python manage.py runserver
   ```

### 3. Access the Backend

Check that the backend server is running at `http://localhost:8000/`. You can access the Django admin interface at `http://localhost:8000/admin/` using the superuser credentials you created earlier.

## Frontend (Typescript + React)

Keep the backend running and open a new terminal at rxdjango-demo folder to start the frontend.

### 1. Create a React Project with TypeScript

   ```bash
   npx create-react-app frontend --template typescript
   cd frontend
   ```

### 2. Install Axios

   ```bash
   npm install axios
   ```

### 3. Create a Login Component

   Create a file named `Login.tsx` inside the `src/components` directory:

   ```tsx
   import React, { useState } from 'react';
   import axios from 'axios';

   interface LoginProps {
     onLogin: (token: string) => void;
   }

   const Login: React.FC<LoginProps> = ({ onLogin }) => {
     const [username, setUsername] = useState('');
     const [password, setPassword] = useState('');
     const [error, setError] = useState('');

     const handleLogin = async (e: React.FormEvent) => {
       e.preventDefault();
       try {
         const response = await axios.post('http://localhost:8000/api/login/', {
           username,
           password,
         });
         onLogin(response.data.token);
       } catch (err) {
         setError('Invalid credentials');
       }
     };

     return (
       <form onSubmit={handleLogin}>
         <h2>Login</h2>
         {error && <p style={{ color: 'red' }}>{error}</p>}
         <div>
           <label>Username</label>
           <input
             type="text"
             value={username}
             onChange={(e) => setUsername(e.target.value)}
             required
           />
         </div>
         <div>
           <label>Password</label>
           <input
             type="password"
             value={password}
             onChange={(e) => setPassword(e.target.value)}
             required
           />
         </div>
         <button type="submit">Login</button>
       </form>
     );
   };

   export default Login;
   ```


### 4. Create a Component to Fetch and Display Project Data

   Create a file named `ProjectDetail.tsx` inside the `src/components` directory:

   ```tsx
   import React, { useState, useEffect } from 'react';
   import axios from 'axios';

   interface User {
     id: number;
     username: string;
     email: string;
   }

   interface Task {
     id: number;
     title: string;
     description: string;
     completed: boolean;
     user: User;
     created_at: string;
     updated_at: string;
   }

   interface Participant {
     id: number;
     user: User;
     joined_at: string;
   }

   interface Project {
     id: number;
     name: string;
     description: string;
     user: User;
     tasks: Task[];
     participants: Participant[];
     created_at: string;
     updated_at: string;
   }

   interface ProjectDetailProps {
     projectId: number;
   }

   const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId }) => {
     const [project, setProject] = useState<Project | null>(null);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);

     useEffect(() => {
       const fetchProject = async () => {
         try {
           const response = await axios.get<Project>(`http://localhost:8000/api/projects/${projectId}/`);
           setProject(response.data);
           setLoading(false);
         } catch (err) {
           if (axios.isAxiosError(err)) {
             setError(err.message);
           } else {
             setError('An unexpected error occurred');
           }
           setLoading(false);
         }
       };

       fetchProject();
     }, [projectId]);

     if (loading) return <div>Loading...</div>;
     if (error) return <div>Error loading project: {error}</div>;

     return (
       <div>
         <h1>{project?.name}</h1>
         <p>{project?.description}</p>
         <h2>Tasks</h2>
         <ul>
           {project?.tasks.map(task => (
             <li key={task.id}>{task.title}</li>
           ))}
         </ul>
         <h2>Participants</h2>
         <ul>
           {project?.participants.map(participant => (
             <li key={participant.id}>{participant.user.username}</li>
           ))}
         </ul>
       </div>
     );
   };

   export default ProjectDetail;
   ```

### 5. Update App Component to Use ProjectDetail

   Edit the `src/App.tsx` file to include the `ProjectDetail` and `Login` components:

   ```tsx
   import React, { useState } from 'react';
   import Login from './components/Login';
   import ProjectDetail from './components/ProjectDetail';
   import axios from 'axios';

   const App: React.FC = () => {
     const [token, setToken] = useState<string | null>(null);

     const handleLogin = (token: string) => {
       setToken(token);
       axios.defaults.headers.common['Authorization'] = `Token ${token}`;
     };

     return (
       <div className="App">
         <header className="App-header">
           <h1>Project Management</h1>
         </header>
         <main>
           {!token ? (
             <Login onLogin={handleLogin} />
           ) : (
             <ProjectDetail projectId={1} />
           )}
         </main>
       </div>
     );
   };

   export default App;
   ```

### 6. Run the React Application

   ```bash
   npm start
   ```

### 7. Access the Frontend

The frontend development server will be running at `http://localhost:3000/`. Open this URL in your browser to see the application in action.
Ensure both the backend and frontend servers are running simultaneously to access the full functionality of the application.
