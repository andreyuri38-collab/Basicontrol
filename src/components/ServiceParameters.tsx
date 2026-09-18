import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Edit2, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  ChevronRight, 
  ArrowLeft,
  Briefcase,
  ListChecks,
  GitMerge
} from 'lucide-react';

interface ServiceItem {
  id: number;
  nome: string;
  descricao?: string;
  ordem: number;
}

export default function ServiceParameters({ userRole }: { userRole?: string }) {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ nome: '', descricao: '' });
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/parametros-servico');
      const data = await res.json();
      setItems(data.data || []);
    } catch (err) {
      console.error('Erro ao buscar serviços');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingItem ? `/api/parametros-servico/${editingItem.id}` : '/api/parametros-servico';
    const method = editingItem ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchItems();
        setViewMode('list');
        setEditingItem(null);
        setFormData({ nome: '', descricao: '' });
      }
    } catch (err) {
      console.error('Erro ao salvar serviço');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
    try {
      const res = await fetch(`/api/parametros-servico/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-role': 'admin' }
      });
      if (res.ok) fetchItems();
    } catch (err) {
      console.error('Erro ao excluir serviço');
    }
  };

  const handleCopy = async (id: number) => {
    try {
      const res = await fetch(`/api/copy/service/${id}`, {
        method: 'POST',
        headers: { 'x-user-role': 'admin' }
      });
      if (res.ok) fetchItems();
    } catch (err) {
      console.error('Erro ao copiar serviço');
    }
  };

  const handleMove = async (id: number, direction: 'up' | 'down') => {
    const index = items.findIndex(item => item.id === id);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];

    const orders = newItems.map((item, i) => ({ id: item.id, ordem: i }));

    try {
      const res = await fetch('/api/reorder/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({ orders })
      });
      if (res.ok) fetchItems();
    } catch (err) {
      console.error('Erro ao reordenar');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="text-emerald-500" /> Parâmetros de Serviço
          </h1>
          <p className="text-slate-500">Gerencie as atividades, grupos e etapas de serviço.</p>
        </div>
        {viewMode === 'list' && (
          <button 
            onClick={() => {
              setEditingItem(null);
              setFormData({ nome: '', descricao: '' });
              setViewMode('create');
            }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all font-medium shadow-lg shadow-emerald-500/20"
          >
            <Plus size={20} /> NOVO SERVIÇO
          </button>
        )}
      </div>

      {viewMode === 'list' ? (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all group shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <Briefcase size={24} />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingItem(item);
                        setFormData({ nome: item.nome, descricao: item.descricao || '' });
                        setViewMode('edit');
                      }}
                      className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleCopy(item.id)}
                      className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors"
                    >
                      <Copy size={16} />
                    </button>
                    <button 
                      onClick={() => handleMove(item.id, 'up')}
                      className="p-1.5 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button 
                      onClick={() => handleMove(item.id, 'down')}
                      className="p-1.5 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{item.nome}</h3>
                <p className="text-slate-500 text-sm line-clamp-2">{item.descricao || 'Sem descrição'}</p>
              </div>
            ))}
            {items.length === 0 && !loading && (
              <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <Settings size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">Nenhum serviço cadastrado.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setViewMode('list')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-bold">{editingItem ? 'EDITAR SERVIÇO' : 'CRIAR NOVO SERVIÇO'}</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">NOME DO SERVIÇO</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">DESCRIÇÃO</label>
              <textarea 
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={formData.descricao}
                onChange={e => setFormData({...formData, descricao: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all font-medium shadow-lg shadow-emerald-500/20">
                {editingItem ? 'Atualizar Serviço' : 'Criar Serviço'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
