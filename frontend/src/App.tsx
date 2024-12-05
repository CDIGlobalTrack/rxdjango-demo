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
