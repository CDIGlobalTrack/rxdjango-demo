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
