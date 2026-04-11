import React from 'react';
import { Settings } from 'lucide-react';

export default function ServiceParameters({ userRole, userEmail }: { userRole?: string, userEmail?: string }) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="text-emerald-500" /> Parâmetros de Serviço
          </h1>
          <p className="text-slate-500">Gerencie as atividades, grupos e etapas de serviço.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
          <Settings size={32} />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Módulo em Branco</h3>
        <p className="text-slate-500 max-w-md mx-auto mt-2">
          Este módulo foi resetado e está pronto para ser recriado do zero conforme as novas especificações.
        </p>
      </div>
    </div>
  );
}
