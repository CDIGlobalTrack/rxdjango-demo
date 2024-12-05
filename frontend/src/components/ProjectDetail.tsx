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
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [editingTask, setEditingTask] = useState('');
  const [isEditing, setIsEditing] = useState<number>();
  const [error, setError] = useState<string | null>(null);

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
