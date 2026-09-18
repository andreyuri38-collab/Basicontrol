import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { Navbar } from './components/Navbar';
import { Navigation, NavTab } from './components/Navigation';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { WorksView } from './components/WorksView';
import { EmployeesView } from './components/EmployeesView';
import { EquipmentsView } from './components/EquipmentsView';
import { ScheduleView } from './components/ScheduleView';
import { ProductivityView } from './components/ProductivityView';
import { FinancialView } from './components/FinancialView';
import { SettingsView } from './components/SettingsView';
import { OfflineIndicator } from './components/OfflineIndicator';

const MainApp: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [showQuickProd, setShowQuickProd] = useState(false);
  const [showQuickSch, setShowQuickSch] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-300">Carregando Nivelar Obras...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <Navbar />

      {/* Sub Navigation (Desktop & Tabs) */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-24 md:pb-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigate={setActiveTab}
            onOpenNewProductivity={() => {
              setActiveTab('productivity');
              setShowQuickProd(true);
            }}
            onOpenNewSchedule={() => {
              setActiveTab('schedules');
              setShowQuickSch(true);
            }}
          />
        )}

        {activeTab === 'works' && <WorksView />}

        {activeTab === 'equipments' && <EquipmentsView />}

        {activeTab === 'employees' && <EmployeesView />}

        {activeTab === 'schedules' && (
          <ScheduleView
            initialOpenModal={showQuickSch}
            onModalClosed={() => setShowQuickSch(false)}
          />
        )}

        {activeTab === 'productivity' && (
          <ProductivityView
            initialOpenModal={showQuickProd}
            onModalClosed={() => setShowQuickProd(false)}
          />
        )}

        {activeTab === 'financial' && <FinancialView />}

        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Offline Alert Badge */}
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </AuthProvider>
  );
}
