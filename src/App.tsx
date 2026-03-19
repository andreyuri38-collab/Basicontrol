/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  Banknote, 
  PenTool, 
  Menu, 
  X,
  ChevronRight,
  ChevronDown,
  Bell,
  LogOut,
  ShieldCheck,
  Briefcase,
  Map,
  Package,
  Calendar,
  DollarSign,
  BookOpen,
  BarChart,
  Settings
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import Employees from './components/Employees';
import Frequency from './components/Frequency';
import Payroll from './components/Payroll';
import Signatures from './components/Signatures';
import Permissions from './components/Permissions';
import Roles from './components/Roles';
import Login from './components/Login';
import ConstructionParameters from './components/ConstructionParameters';
import ServiceParameters from './components/ServiceParameters';
import DailyTasks from './components/DailyTasks';
import Inventory from './components/Inventory';
import Planning from './components/Planning';
import Financial from './components/Financial';
import ConstructionDiary from './components/ConstructionDiary';
import MaterialControl from './components/MaterialControl';
import Analytics from './components/Analytics';
import SystemSettings from './components/SystemSettings';

type Module = 'dashboard' | 'employees' | 'frequency' | 'payroll' | 'signatures' | 'permissions' | 'roles' | 'parameters' | 'service-parameters' | 'tasks' | 'inventory' | 'planning' | 'financial' | 'diary' | 'materials' | 'analytics' | 'system';

export default function App() {
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dp', 'analises', 'parametros', 'almoxarifado', 'planejamento', 'diario', 'config']);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Mock alerts for the "Intelligent Differential"
    const alerts = [
      "Funcionário João Silva próximo das férias",
      "Pagamento pendente: 2ª Quinzena de Fevereiro",
      "Documento 'EPI - Fevereiro' não assinado por 3 funcionários"
    ];
    setNotifications(alerts);
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setActiveModule('dashboard');
  };

  const menuItems = [
    { 
      id: 'analises', 
      label: 'Análises', 
      icon: BarChart,
      subItems: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'analytics', label: 'Analytics', icon: BarChart },
      ]
    },
    { 
      id: 'dp', 
      label: 'Departamento Pessoal', 
      icon: Users,
      subItems: [
        { id: 'employees', label: 'Funcionários', icon: Users },
        { id: 'roles', label: 'Cargos', icon: Briefcase },
        { id: 'frequency', label: 'Frequência', icon: CalendarCheck },
        { id: 'payroll', label: 'Folha Salarial', icon: Banknote },
        { id: 'signatures', label: 'Assinaturas', icon: PenTool },
      ]
    },
    { 
      id: 'parametros_group', 
      label: 'Parâmetros', 
      icon: Settings,
      subItems: [
        { id: 'parameters', label: 'Parâmetros de Projeto', icon: Map },
        { id: 'service-parameters', label: 'Parâmetros de Serviço', icon: Settings },
      ]
    },
    { 
      id: 'almoxarifado', 
      label: 'Almoxarifado', 
      icon: Package,
      subItems: [
        { id: 'inventory', label: 'Estoque', icon: Package },
        { id: 'materials', label: 'Materiais', icon: Package },
      ]
    },
    { 
      id: 'planejamento_group', 
      label: 'Planejamento', 
      icon: Calendar,
      subItems: [
        { id: 'planning', label: 'Planejamento', icon: Calendar },
      ]
    },
    { 
      id: 'diario_group', 
      label: 'Diário', 
      icon: BookOpen,
      subItems: [
        { id: 'diary', label: 'Diário de Obra', icon: BookOpen },
        { id: 'tasks', label: 'Tarefa', icon: CalendarCheck },
      ]
    },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ 
      id: 'config', 
      label: 'Configurações', 
      icon: ShieldCheck,
      subItems: [
        { id: 'permissions', label: 'Usuários', icon: ShieldCheck },
        { id: 'system', label: 'Sistema', icon: Settings },
      ]
    });
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const handleModuleChange = (id: Module) => {
    setActiveModule(id);
    if (window.innerWidth <= 1024) {
      setIsSidebarOpen(false);
    }
  };

  const toggleMenu = (id: string) => {
    setExpandedMenus(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex font-sans text-slate-900">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && window.innerWidth <= 1024 && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`bg-slate-900 text-white flex flex-col fixed lg:sticky top-0 h-screen z-[70] overflow-hidden transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-72' : (window.innerWidth <= 1024 ? 'w-0 -translate-x-full' : 'w-20')
        } ${!isSidebarOpen && window.innerWidth <= 1024 ? 'pointer-events-none' : ''}`}
      >
        <div className="p-6 flex items-center justify-between">
          {(isSidebarOpen || window.innerWidth > 1024) && (
            <h1 className="text-xl font-bold tracking-tight text-emerald-400 whitespace-nowrap">
              OBRA CONTROL
            </h1>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors lg:flex hidden"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors lg:hidden flex"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto min-h-0">
          {menuItems.map((item) => (
            <div key={item.id} className="space-y-1">
              {item.subItems ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all hover:bg-slate-800 text-slate-400`}
                  >
                    <item.icon size={22} className="shrink-0" />
                    {(isSidebarOpen || window.innerWidth <= 1024) && (
                      <>
                        <span className="font-medium whitespace-nowrap">{item.label}</span>
                        {expandedMenus.includes(item.id) ? (
                          <ChevronDown size={16} className="ml-auto" />
                        ) : (
                          <ChevronRight size={16} className="ml-auto" />
                        )}
                      </>
                    )}
                  </button>
                  {expandedMenus.includes(item.id) && (isSidebarOpen || window.innerWidth <= 1024) && (
                    <div className="ml-4 pl-4 border-l border-slate-800 space-y-1">
                      {item.subItems.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => handleModuleChange(subItem.id as Module)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                            activeModule === subItem.id 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'hover:bg-slate-800 text-slate-500'
                          }`}
                        >
                          <subItem.icon size={18} className="shrink-0" />
                          <span className="text-sm font-medium whitespace-nowrap">{subItem.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => handleModuleChange(item.id as Module)}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                    activeModule === item.id 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                      : 'hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <item.icon size={22} className="shrink-0" />
                  {(isSidebarOpen || window.innerWidth <= 1024) && (
                    <span className="font-medium whitespace-nowrap">{item.label}</span>
                  )}
                  {(isSidebarOpen || window.innerWidth <= 1024) && activeModule === item.id && (
                    <ChevronRight size={16} className="ml-auto" />
                  )}
                </button>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-3 text-slate-400 hover:text-white transition-colors"
          >
            <LogOut size={22} className="shrink-0" />
            {(isSidebarOpen || window.innerWidth <= 1024) && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 w-full">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 md:h-20 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors lg:hidden flex"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl md:text-2xl font-semibold capitalize truncate">
              {menuItems.flatMap(i => i.subItems ? [i, ...i.subItems] : [i]).find(i => i.id === activeModule)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div className="relative">
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
                <Bell size={22} />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
            </div>
            <div className="flex items-center gap-3 md:pl-6 md:border-l md:border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-slate-500">{user.role === 'admin' ? 'Gestor de Obra' : 'Visualizador'}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold shrink-0">
                {user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Module Container */}
        <div className="p-3 md:p-8 w-full flex-1 overflow-hidden">
          <div className="max-w-[1600px] mx-auto h-full flex flex-col">
            {activeModule === 'dashboard' && <Dashboard />}
            {activeModule === 'employees' && <Employees userRole={user.role} />}
            {activeModule === 'roles' && <Roles userRole={user.role} />}
            {activeModule === 'parameters' && <ConstructionParameters />}
            {activeModule === 'service-parameters' && <ServiceParameters userRole={user.role} userEmail={user.username} />}
            {activeModule === 'inventory' && <Inventory />}
            {activeModule === 'planning' && <Planning />}
            {activeModule === 'financial' && <Financial />}
            {activeModule === 'diary' && <ConstructionDiary />}
            {activeModule === 'materials' && <MaterialControl />}
            {activeModule === 'analytics' && <Analytics />}
            {activeModule === 'tasks' && <DailyTasks />}
            {activeModule === 'frequency' && <Frequency userRole={user.role} />}
            {activeModule === 'payroll' && <Payroll userRole={user.role} />}
            {activeModule === 'signatures' && <Signatures userRole={user.role} />}
            {activeModule === 'permissions' && <Permissions />}
            {activeModule === 'system' && <SystemSettings />}
          </div>
        </div>
      </main>
    </div>
  );
}
