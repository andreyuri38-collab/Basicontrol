import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

export default function CloudSync() {
  const [isConnected, setIsConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(localStorage.getItem('last_google_sync'));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
    
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) return;
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === 'google') {
        setIsConnected(true);
        setError(null);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/sync/google-drive/status');
      const data = await res.json();
      setIsConnected(data.connected);
    } catch (err) {
      console.error("Error checking sync status:", err);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const { url } = await res.json();
      
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        url,
        'google_auth_popup',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (err) {
      setError("Falha ao iniciar autenticação com Google");
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch('/api/sync/google-drive/backup', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        const now = new Date().toLocaleString();
        setLastSync(now);
        localStorage.setItem('last_google_sync', now);
      } else {
        setError(data.error || "Erro ao sincronizar");
      }
    } catch (err) {
      setError("Erro de conexão ao sincronizar");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isConnected ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
            <Cloud size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Sincronização em Nuvem</h3>
            <p className="text-xs text-slate-500">Backup automático no Google Drive</p>
          </div>
        </div>
        {isConnected ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase">
            <CheckCircle2 size={10} /> Conectado
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full uppercase">
            <CloudOff size={10} /> Desconectado
          </span>
        )}
      </div>

      <div className="space-y-4">
        {!isConnected ? (
          <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-600 mb-4">
              Conecte sua conta do Google para manter seus dados seguros e acessíveis em qualquer lugar.
            </p>
            <button 
              onClick={handleConnect}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
            >
              <ExternalLink size={16} />
              Conectar Google Drive
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Último Backup</span>
              <span className="font-medium text-slate-700">{lastSync || 'Nunca'}</span>
            </div>
            
            <button 
              onClick={handleSync}
              disabled={syncing}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                syncing 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
              }`}
            >
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-100">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
      </div>
      
      <div className="mt-6 pt-6 border-t border-slate-50">
        <p className="text-[10px] text-slate-400 leading-relaxed">
          * Os dados são armazenados de forma criptografada em sua conta pessoal do Google Drive. 
          O aplicativo apenas cria e atualiza o arquivo de backup.
        </p>
      </div>
    </div>
  );
}
