import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarDays,
  TrendingUp,
  DollarSign,
  Settings,
  Wrench,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'works'
  | 'employees'
  | 'equipments'
  | 'schedules'
  | 'productivity'
  | 'financial'
  | 'settings';

interface NavigationProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { isAdmin } = useAuth();

  const tabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'works', label: 'Obras', icon: Building2 },
    { id: 'schedules', label: 'Programação', icon: CalendarDays },
    { id: 'equipments', label: 'Equipamentos', icon: Wrench },
    { id: 'employees', label: 'Equipe', icon: Users },
    { id: 'productivity', label: 'Produtividade', icon: TrendingUp },
    { id: 'financial', label: 'Financeiro', icon: DollarSign, adminOnly: true },
    { id: 'settings', label: 'Ajustes', icon: Settings, adminOnly: true },
  ];

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);

  return (
    <>
      {/* Desktop Top Tabs Sub-bar */}
      <div className="hidden md:block bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-1 overflow-x-auto py-2">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Sticky Bottom Navigation (Mobile-First 44px+ touch targets) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/98 backdrop-blur-lg border-t border-slate-800 px-1 py-1 safe-area-pb">
        <div className="flex items-center justify-around">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center min-w-[50px] py-1.5 px-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-orange-500 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`p-1 rounded-lg transition-all ${
                    isActive ? 'bg-orange-500/15 text-orange-500' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
