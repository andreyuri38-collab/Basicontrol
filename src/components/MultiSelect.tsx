import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface MultiSelectProps {
  options: { id: number; name: string }[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  label: string;
  placeholder: string;
}

export const MultiSelect = ({ 
  options, 
  selectedIds, 
  onToggle, 
  label, 
  placeholder 
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-1 relative">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label} ({selectedIds.length})</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer flex flex-wrap gap-2 min-h-[50px] items-center"
      >
        {selectedIds.length === 0 && <span className="text-slate-400 text-sm">{placeholder}</span>}
        {selectedIds.map(id => {
          const opt = options.find(o => o.id === id);
          return (
            <span key={id} className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
              {opt?.name}
              <button 
                onClick={(e) => { e.stopPropagation(); onToggle(id); }}
                className="hover:text-emerald-900"
              >
                <X size={12} />
              </button>
            </span>
          );
        })}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              autoFocus
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-auto space-y-1 custom-scrollbar">
            {filteredOptions.map(opt => (
              <div 
                key={opt.id}
                onClick={(e) => { e.stopPropagation(); onToggle(opt.id); }}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                  selectedIds.includes(opt.id) 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <span className="text-sm font-medium">{opt.name}</span>
                {selectedIds.includes(opt.id) && <X size={14} className="opacity-50" />}
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <p className="text-center py-4 text-slate-400 text-sm">Nenhum resultado encontrado</p>
            )}
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              Concluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
