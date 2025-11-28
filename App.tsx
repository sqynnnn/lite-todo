
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Daily } from './pages/Daily';
import { Review } from './pages/Review';
import { ModularPage } from './components/ModularPage';
import { StorageService } from './services/storage';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/daily" element={<Daily />} />
          <Route path="/review" element={<Review />} />
          
          <Route path="/self" element={
            <ModularPage 
              storageKey={StorageService.KEYS.SELF_OBS_PAGES}
              title="Self Observation"
              icon={Eye}
              color="pink-500"
            />
          } />

          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
