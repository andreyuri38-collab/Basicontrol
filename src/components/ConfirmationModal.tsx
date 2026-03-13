import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: <AlertTriangle className="text-red-500" size={24} />,
      button: 'bg-red-600 hover:bg-red-700 shadow-red-200',
      bg: 'bg-red-50'
    },
    warning: {
      icon: <AlertTriangle className="text-amber-500" size={24} />,
      button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200',
      bg: 'bg-amber-50'
    },
    info: {
      icon: <AlertTriangle className="text-blue-500" size={24} />,
      button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
      bg: 'bg-blue-50'
    }
  };

  const styles = typeStyles[type];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 flex items-start gap-4">
          <div className={`p-3 rounded-2xl ${styles.bg}`}>
            {styles.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-slate-500 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="p-6 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-8 py-2.5 text-white rounded-xl font-semibold shadow-lg transition-all active:scale-95 ${styles.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
