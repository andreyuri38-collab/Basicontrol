import React from 'react';
import { useOnlineStatus } from '../lib/usePWAInstall';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center gap-2 rounded-xl bg-amber-600/90 backdrop-blur-md px-4 py-2.5 text-xs font-semibold text-white shadow-xl border border-amber-400/30 animate-bounce">
      <WifiOff className="w-4 h-4 flex-shrink-0 text-white" />
      <span>Modo Offline — Obras e apontamentos locais permanecem acessíveis. Reconecte para sincronizar.</span>
    </div>
  );
};
