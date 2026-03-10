import React, { useState, useEffect } from 'react';
import { Camera, Shield, ShieldCheck, ShieldAlert, Settings, Info } from 'lucide-react';

export default function PermissionManager() {
  const [cameraStatus, setCameraStatus] = useState<PermissionState | 'unsupported'>('prompt');

  useEffect(() => {
    checkPermissions();
    
    // Listen for visibility changes to refresh status
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPermissions();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const checkPermissions = async () => {
    try {
      if (!navigator.permissions || !navigator.permissions.query) {
        setCameraStatus('unsupported');
        return;
      }

      const camera = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setCameraStatus(camera.state);

      camera.onchange = () => {
        setCameraStatus(camera.state);
      };
    } catch (err) {
      console.error("Error checking permissions:", err);
      setCameraStatus('unsupported');
    }
  };

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Immediately stop it, we just wanted the prompt
      stream.getTracks().forEach(track => track.stop());
      checkPermissions();
    } catch (err) {
      console.error("Error requesting camera:", err);
      checkPermissions();
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <Settings size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Gerenciador de Permissões</h3>
          <p className="text-sm text-slate-500">Controle o acesso aos recursos do dispositivo</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${
              cameraStatus === 'granted' ? 'bg-emerald-100 text-emerald-600' : 
              cameraStatus === 'denied' ? 'bg-red-100 text-red-600' : 
              'bg-amber-100 text-amber-600'
            }`}>
              <Camera size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Câmera</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {cameraStatus === 'granted' ? (
                  <>
                    <ShieldCheck size={12} className="text-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Acesso Permitido</span>
                  </>
                ) : cameraStatus === 'denied' ? (
                  <>
                    <ShieldAlert size={12} className="text-red-500" />
                    <span className="text-[10px] font-bold text-red-600 uppercase">Acesso Negado</span>
                  </>
                ) : cameraStatus === 'unsupported' ? (
                  <>
                    <ShieldAlert size={12} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Não Suportado</span>
                  </>
                ) : (
                  <>
                    <Shield size={12} className="text-amber-500" />
                    <span className="text-[10px] font-bold text-amber-600 uppercase">Aguardando Solicitação</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {cameraStatus !== 'granted' && cameraStatus !== 'unsupported' && (
            <button 
              onClick={requestCamera}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
              Solicitar Acesso
            </button>
          )}
          
          {cameraStatus === 'granted' && (
            <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase">
              Ativo
            </div>
          )}
        </div>

        <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex gap-3">
          <Info size={18} className="text-indigo-500 shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-700 leading-relaxed">
            As permissões são solicitadas apenas quando você tenta usar um recurso específico (como tirar uma foto de um funcionário). 
            Você pode gerenciar essas permissões a qualquer momento nas configurações do seu navegador.
          </p>
        </div>
      </div>
    </div>
  );
}
