import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar, { ViewType } from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import PatientProfile from './PatientProfile';
import MedicationsPanel from './MedicationsPanel';
import LabTestsPanel from './LabTestsPanel';
import RadiologyPanel from './RadiologyPanel';
import DiagnosesPanel from './DiagnosesPanel';
import SurgeriesPanel from './SurgeriesPanel';
import TimelineView from './TimelineView';
import SharePanel from './SharePanel';
import AuthModal from './AuthModal';
import LandingPage from './LandingPage';

const AppLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LandingPage onOpenAuth={() => setAuthModalOpen(true)} />
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentView} />;
      case 'profile': return <PatientProfile />;
      case 'medications': return <MedicationsPanel />;
      case 'lab_tests': return <LabTestsPanel />;
      case 'radiology': return <RadiologyPanel />;
      case 'diagnoses': return <DiagnosesPanel />;
      case 'surgeries': return <SurgeriesPanel />;
      case 'timeline': return <TimelineView />;
      case 'share': return <SharePanel />;
      default: return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
          onOpenAuth={() => setAuthModalOpen(true)}
        />
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {renderView()}
        </main>
      </div>
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};

export default AppLayout;
