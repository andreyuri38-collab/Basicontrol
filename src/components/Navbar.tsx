import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Layers,
  LogOut,
  ShieldCheck,
  HardHat,
  Database,
  Building2,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { profile, isAdmin, logout, switchActiveRole } = useAuth();
  const { works, selectedWorkId, setSelectedWorkId, seedInitialData } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white shadow-lg shadow-orange-600/30 flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white font-['Space_Grotesk']">
                Nivelar<span className="text-orange-500">Obras</span>
              </span>
              <span className="hidden xs:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Autonivelante
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate hidden sm:block">
              Gestão Operacional de Contrapiso
            </p>
          </div>
        </div>

        {/* Global Work Filter */}
        <div className="flex-1 max-w-xs hidden md:block">
          <div className="relative">
            <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedWorkId}
              onChange={(e) => setSelectedWorkId(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800/90 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:border-orange-500 transition"
            >
              <option value="all">Todas as Obras ({works.length})</option>
              {works.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-2">
          {/* Seed demo data button if database has 0 works */}
          {works.length === 0 && (
            <button
              onClick={seedInitialData}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-600/30 transition active:scale-95"
              title="Carregar obras, frentes e apontamentos de exemplo"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Carregar Dados Exemplo</span>
              <span className="sm:hidden">Exemplos</span>
            </button>
          )}

          {/* PWA Install */}
          <PWAInstallButton />

          {/* Role Badge / Switcher for fast testing */}
          <div className="flex items-center">
            {isAdmin ? (
              <button
                type="button"
                onClick={() => switchActiveRole('campo')}
                className="cursor-pointer flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 border border-orange-500/30 text-orange-400 text-xs font-semibold hover:bg-slate-700/60 transition"
                title="Clique para alternar para o perfil Campo (para testar restrições)"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                <span className="hidden sm:inline">Admin (Sócio)</span>
                <span className="sm:hidden">Admin</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchActiveRole('admin')}
                className="cursor-pointer flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-slate-700/60 transition"
                title="Clique para alternar para o perfil Admin (acesso total)"
              >
                <HardHat className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Campo (Encarregado)</span>
                <span className="sm:hidden">Campo</span>
              </button>
            )}
          </div>

          {/* User Name & Logout */}
          <div className="flex items-center gap-1 text-slate-300">
            <span className="text-xs font-medium text-slate-300 hidden lg:inline max-w-[120px] truncate">
              {profile?.name}
            </span>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
              title="Sair da conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
