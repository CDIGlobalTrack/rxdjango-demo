# RxDjango Tutorial Step 0: Existing application

To start the tutorial, let's create a Django + React application.
At this step our goal is to setup a demo application without RxDjango
We'll also setup ASGI, so that application is ready for RxDjango.
If you want to speed up, checkout the __step-0__ tag of the repository
and you should achieve the same result.

## Prerequisites

- Python 3.10+
- Node.js 14+
- npm or yarn

## Create the demo project folder

   ```bash
   mkdir rxdjango-tutorial
   cd rxdjango-tutorial
   ```

## Backend (Django + Django REST Framework)

### 1. Create a Django Project

1. **Create a virtual environment**:

   ```bash
   python -m venv backend-env
   ```

2. **Activate the virtual environment**:

   - On Linux/macOS:

     ```bash
     source backend-env/bin/activate
     ```

   - On Windows:

     ```bash
     backend-env\Scripts\activate
     ```

3. **Install Python dependencies**:

   ```bash
   pip install django djangorestframework django-cors-headers
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

   Add `CORS middleware`, before CommonMiddleware:

   ```python
   MIDDLEWARE = [
       ...
       'corsheaders.middleware.CorsMiddleware',
       'django.middleware.common.CommonMiddleware',
       ...
   ]
   ```

   Configure the user model (we'll define it in next step):
   ```python
   AUTH_USER_MODEL = "tasks.User"
   ```

   Configure `CORS` settings:

   ```python
   CORS_ALLOWED_ORIGINS = [
       "http://localhost:3000",
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
   from .models import Project, Task, User

   class UserSerializer(serializers.ModelSerializer):
       class Meta:
           model = User
           fields = ['id', 'username', 'email']

   class TaskSerializer(serializers.ModelSerializer):
       user = UserSerializer(read_only=True)

       class Meta:
           model = Task
           fields = ['id', 'title', 'description', 'completed', 'user', 'created_at', 'updated_at']


   class ProjectSerializer(serializers.ModelSerializer):
       tasks = TaskSerializer(many=True, read_only=True)
       user = UserSerializer(read_only=True)

       class Meta:
           model = Project
           fields = ['id', 'name', 'description', 'user', 'tasks', 'created_at', 'updated_at']
   ```

5. **Create views**:

   Create a `tasks/views.py` file:

   ```python
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

   ```

6. **Create URL configuration**:

   Create a `tasks/urls.py` file:

   ```python
   from django.urls import path, include
   from rest_framework.routers import DefaultRouter
   from .views import ProjectViewSet, TaskViewSet, LoginView

   router = DefaultRouter()
   router.register(r'projects', ProjectViewSet, basename='project')
   router.register(r'tasks', TaskViewSet, basename='task')

   urlpatterns = [
       path('login/', LoginView.as_view(), name='login'),
       path('', include(router.urls)),
   ]
   ```

   Edit `backend/urls.py` file to include tasks.urls:

   ```python
   from django.contrib import admin
   from django.urls import path, include

   urlpatterns = [
       path('admin/', admin.site.urls),
       path('api/', include('tasks.urls')),
   ]
   ```

7. **Create initial migrations**:

   ```bash
   python manage.py makemigrations
   ```

8. **Populate database with fixture data**

   To make things easier, edit `tasks/migrations/0002_populate_demo_data.py` and fill with these fixtures:

   ```python
   from django.db import migrations
   from django.contrib.auth.hashers import make_password

   def populate_demo_data(apps, schema_editor):
       Project = apps.get_model('tasks', 'Project')
       Task = apps.get_model('tasks', 'Task')
       User = apps.get_model('tasks', 'User')

       # Create demo users
       user1, created = User.objects.get_or_create(
           username='demo_user1',
           email='demo1@example.com',
           defaults={'password': make_password('password123')}
       )

       user2, created = User.objects.get_or_create(
           username='demo_user2',
           email='demo2@example.com',
           defaults={'password': make_password('password123')}
       )

       # Create demo projects
       project1 = Project.objects.create(name='Demo Project 1', description='This is a demo project 1', user=user1)
       project2 = Project.objects.create(name='Demo Project 2', description='This is a demo project 2', user=user2)

       # Create demo tasks
       Task.objects.create(title='Demo Task 1', description='This is a demo task 1', completed=False, user=user1, project=project1)
       Task.objects.create(title='Demo Task 2', description='This is a demo task 2', completed=False, user=user1, project=project1)
       Task.objects.create(title='Demo Task 3', description='This is a demo task 3', completed=True, user=user2, project=project2)
       Task.objects.create(title='Demo Task 4', description='This is a demo task 4', completed=True, user=user2, project=project2)


   class Migration(migrations.Migration):

       dependencies = [
           ('tasks', '0001_initial'),
       ]

       operations = [
           migrations.RunPython(populate_demo_data),
       ]
   ```

9. **Run migrations**:

   ```bash
   python manage.py migrate
   ```

10. **Create a superuser (optional)**:

   ```bash
   python manage.py createsuperuser
   ```

11. **Start the backend server**:

   ```bash
   python manage.py runserver
   ```

### 3. Access the Backend

Check that the backend server is running at `http://localhost:8000/`. You can access the Django admin interface at `http://localhost:8000/admin/` using the superuser credentials you created earlier.

## Frontend (Typescript + React)

Keep the backend running and open a new terminal at rxdjango-tutorial folder to start the frontend.

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
   import './ProjectDetail.css';

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
     token: string;
   }

   const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, token }) => {
     const [project, setProject] = useState<Project | null>(null);
     const [loading, setLoading] = useState(true);
     const [newTask, setNewTask] = useState('');
     const [editingTask, setEditingTask] = useState('');
     const [isEditing, setIsEditing] = useState<number>();
     const [error, setError] = useState<string | null>(null);

     useEffect(() => {
       axios.defaults.headers.common['Authorization'] = `Token ${token}`;
     }, [token]);

     useEffect(() => {
       const fetchProject = async () => {
         try {
           // Get project by id
           const response = await axios.get<Project>(`http://localhost:8000/api/projects/${projectId}/`);

           // Set complete project on state
           setProject(response.data);

           // Stop loading
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

     const addTask = async () => {
       try {
         // Create a new task
         const response = await axios.post<Task>(`http://localhost:8000/api/tasks/`, {
           title: newTask,
           project: projectId,
         });

         // Update project with new task locally
         setProject({
           ...project!,
           tasks: [...project!.tasks, response.data],
         });

         // Reset input
         setNewTask('');
       } catch (err) {
         alert('Error to create a task');
       }
     };

     const deleteTask = async (taskId: number) => {
       try {
         // Delete a task
         await axios.delete<Task>(`http://localhost:8000/api/tasks/${taskId}/`);

         // Update project to delete task locally
         setProject({
           ...project!,
           tasks: project!.tasks.filter((t: Task) => t.id !== taskId),
         });

         // Reset input
         setNewTask('');
       } catch (err) {
         alert('Error to delete task');
       }
     };

     const updateTask = async () => {
       try {
         // Update a task
         const response = await axios.put<Task>(`http://localhost:8000/api/tasks/${isEditing}/`, {
           title: editingTask,
           project: projectId,
         });

         // Update project to update task locally
         setProject({
           ...project!,
           tasks: project!.tasks.map((t: Task) => t.id !== isEditing ? t : response.data),
         });

         // Reset input
         setNewTask('');
       } catch (err) {
         alert('Error to update task');
       }
     };

     if (loading) return <div>Loading...</div>;
     if (error) return <div>Error loading project: {error}</div>;

     return (
       <div className='wrapper'>
         <div className='container'>
           <h1>{project?.name}</h1>
           <p>{project?.description}</p>
           <div>
             <input
               onKeyDown={(e) => e.key === 'Enter' && addTask()}
               onChange={({ target }) => setNewTask(target.value)}
               value={newTask}
             />
             <button onClick={addTask}>Add Task</button>
           </div>
           <h2>Tasks</h2>
           <ul>
             {project?.tasks.map(task => (
               <li key={task.id}>
                 {
                   isEditing === task.id ?
                     <input
                       onKeyDown={(e) => {
                         if (e.key === 'Enter') {
                           setIsEditing(undefined)
                           updateTask()
                         }
                       }}
                       value={editingTask}
                       onChange={({ target }) => setEditingTask(target.value)}
                     />
                     : task.title
                 }
                 <button onClick={() => deleteTask(task!.id)}>delete</button>
                 <button
                   onClick={() => {
                     setEditingTask(task!.title);
                     isEditing === task.id ? setIsEditing(undefined) : setIsEditing(task.id);
                   }}
                 >
                   edit
                 </button>
               </li>
             ))}
           </ul>
         </div>
       </div>
     );
   };

   export default ProjectDetail;
   ```

### 5. Some minimal css for ProjectDetail

   Let's have a minimal css for out project page. Edit src/components/ProjectDetail.css:

   ```css
   .wrapper {
     display: flex;
     justify-content: center;
     align-items: center;
   }
   .wrapper > .container {
     display: flex;
     max-width: 900px;
     flex-direction: column;
   }

   .container > ul {
     width: 500px;
     margin: 0;
     padding: 0;
   }
   .container > ul > li {
     display: grid;
     grid-template-columns: 1fr 70px 70px;
     border: 1px solid #ccc;
     padding: 3px 5px;
     :hover {
       background-color: #f9f9f9;
     }
   }
   .container > ul > li:hover {
       background-color: #f9f9f9;
   }
   ```

### 6. Update App Component to Use ProjectDetail

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
             <ProjectDetail projectId={1} token={token} />
           )}
         </main>
       </div>
     );
   };

   export default App;
   ```

### 7. Run the React Application

   ```bash
   npm start
   ```

### 8. Access the Frontend

The frontend development server will be running at `http://localhost:3000/`. Open this URL in your browser to see the application in action.
Ensure both the backend and frontend servers are running simultaneously to access the full functionality of the application.
