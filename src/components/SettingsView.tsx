import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Settings,
  Database,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Save,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, seedInitialData, works } = useApp();
  const { isAdmin } = useAuth();

  const [defaultTarget, setDefaultTarget] = useState(settings.defaultProductivityM2PerDay || 350);
  const [newRole, setNewRole] = useState('');
  const [roles, setRoles] = useState<string[]>(
    settings.jobRoles || ['Engenheiro', 'Encarregado', 'Aplicador', 'Auxiliar']
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [seeding, setSeeding] = useState(false);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <ShieldCheck className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">Acesso Restrito</h3>
        <p className="text-xs text-slate-400 mt-1">
          Apenas administradores podem modificar as configurações operacionais da empresa.
        </p>
      </div>
    );
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      defaultProductivityM2PerDay: Number(defaultTarget),
      jobRoles: roles,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddRole = () => {
    if (newRole.trim() && !roles.includes(newRole.trim())) {
      setRoles([...roles, newRole.trim()]);
      setNewRole('');
    }
  };

  const handleRemoveRole = (roleToRemove: string) => {
    setRoles(roles.filter((r) => r !== roleToRemove));
  };

  const handleSeed = async () => {
    if (confirm('Carregar dados de exemplo realistas de contrapiso autonivelante?')) {
      setSeeding(true);
      try {
        await seedInitialData();
        alert('Dados de exemplo carregados com sucesso!');
      } finally {
        setSeeding(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-orange-500" />
          <span>Configurações Operacionais</span>
        </h2>
        <p className="text-xs text-slate-400">
          Definições padrão de produtividade, cargos da equipe e administração do sistema
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Configurações atualizadas com sucesso!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5"
      >
        {/* Default Target */}
        <div>
          <label className="block text-sm font-bold text-white mb-1">
            Meta Padrão de Produtividade Diária (m²/dia)
          </label>
          <p className="text-xs text-slate-400 mb-2">
            Valor pré-preenchido ao cadastrar novas frentes de contrapiso autonivelante bombeado.
          </p>
          <div className="flex items-center gap-3 max-w-xs">
            <input
              type="number"
              min="50"
              step="10"
              required
              value={defaultTarget}
              onChange={(e) => setDefaultTarget(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white font-bold text-orange-400 focus:outline-none focus:border-orange-500"
            />
            <span className="text-xs font-semibold text-slate-400">m²/dia</span>
          </div>
        </div>

        {/* Roles */}
        <div className="pt-4 border-t border-slate-800">
          <label className="block text-sm font-bold text-white mb-1">
            Funções e Cargos da Equipe
          </label>
          <p className="text-xs text-slate-400 mb-3">
            Cargos disponíveis no cadastro de funcionários e programação das frentes.
          </p>

          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              placeholder="Ex: Operador de Bomba, Nivelador Sênior..."
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="flex-1 max-w-xs px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
            />
            <button
              type="button"
              onClick={handleAddRole}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 text-xs font-bold transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Cargo</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <div
                key={r}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 font-semibold"
              >
                <span>{r}</span>
                {roles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRole(r)}
                    className="p-0.5 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-lg shadow-orange-600/20 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Configurações</span>
          </button>
        </div>
      </form>

      {/* PWA & Install Guide Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-orange-500" />
            <span>Aplicativo Móvel Instalável (PWA)</span>
          </h3>
          <PWAInstallButton />
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mb-3">
          O Nivelar Obras foi desenvolvido para funcionar como um aplicativo nativo no celular de
          encarregados e engenheiros. Possui suporte para operação offline e sincronização
          automática ao restabelecer a conexão de dados.
        </p>
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
          <strong>Como instalar no celular:</strong>
          <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-400">
            <li>No Chrome (Android): Toque no menu (três pontos) &gt; "Instalar aplicativo"</li>
            <li>No Safari (iPhone): Toque em Compartilhar &gt; "Adicionar à Tela de Início"</li>
          </ul>
        </div>
      </div>

      {/* Database Reset / Seed Demo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
          <Database className="w-4 h-4 text-orange-500" />
          <span>Dados de Demonstração</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-3">
          Carregue obras, frentes, histórico de medições e equipes fictícias de autonivelante para
          testar e demonstrar o funcionamento dos cálculos e gráficos.
        </p>
        <button
          type="button"
          disabled={seeding}
          onClick={handleSeed}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 text-xs font-bold transition disabled:opacity-50"
        >
          <Database className="w-4 h-4" />
          <span>{seeding ? 'Carregando dados...' : 'Carregar Dados Exemplo'}</span>
        </button>
      </div>
    </div>
  );
};
