import React from 'react';
import ProjectDetail from './components/ProjectDetail';

const App: React.FC = () => {
  const projectId = 1; // Example project ID, update with an actual ID

  return (
    <div className="App">
      <header className="App-header">
        <h1>Project Details</h1>
      </header>
      <main>
        <ProjectDetail projectId={projectId} />
      </main>
    </div>
  );
};

export default App;
