import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

export default function SystemSettings() {
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleFactoryReset = async () => {
    setIsResetting(true);
    setMessage(null);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch('/api/factory-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role || ''
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        // Logout user after reset since their account might have been deleted/recreated
        setTimeout(() => {
          localStorage.removeItem('user');
          window.location.reload();
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao resetar o sistema.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro de conexão com o servidor.' });
    } finally {
      setIsResetting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Configurações do Sistema</h3>
            <p className="text-slate-500">Gerencie as configurações críticas e manutenção do banco de dados.</p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex-1">
              <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <RefreshCw size={20} className="text-red-500" />
                Reset de Fábrica
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                Esta ação apagará <strong>todos os dados</strong> do sistema, incluindo funcionários, 
                atividades, parâmetros, estoque e históricos. O sistema voltará ao estado inicial 
                com apenas o usuário administrador padrão.
              </p>
              <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                <AlertTriangle size={18} className="shrink-0" />
                <span className="text-xs font-medium">Atenção: Esta ação é irreversível!</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isResetting}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={20} className={isResetting ? 'animate-spin' : ''} />
              {isResetting ? 'Resetando...' : 'Resetar Sistema'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            <span className="font-medium">{message.text}</span>
            {message.type === 'success' && <span className="text-sm ml-auto">Reiniciando...</span>}
          </div>
        )}
      </div>

      <ConfirmationModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleFactoryReset}
        title="Confirmar Reset Total?"
        message="Você tem certeza que deseja apagar todos os dados do sistema? Esta ação não pode ser desfeita e você será deslogado imediatamente."
        confirmText="Sim, Resetar Tudo"
      />
    </div>
  );
}
