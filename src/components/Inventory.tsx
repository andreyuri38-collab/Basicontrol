import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit2, 
  AlertTriangle, 
  Search,
  Filter,
  ArrowUpDown
} from 'lucide-react';

interface StockItem {
  id: number;
  descricao: string;
  quantidade_atual: number;
  quantidade_minima: number;
  unidade_medida: string;
  tipo_item: 'INSUMO' | 'FERRAMENTA';
}

export default function Inventory() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<StockItem>>({
    tipo_item: 'INSUMO'
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const res = await fetch('/api/estoque');
    setItems(await res.json());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/estoque/${editingId}` : '/api/estoque';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': 'admin'
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setIsModalOpen(false);
      setFormData({ tipo_item: 'INSUMO' });
      setEditingId(null);
      fetchItems();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir este item do estoque?')) return;
    const res = await fetch(`/api/estoque/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': 'admin' }
    });
    if (res.ok) fetchItems();
  };

  const filteredItems = items.filter(item => 
    item.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestão de Estoque</h2>
          <p className="text-slate-500">Controle de insumos e ferramentas da obra</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setFormData({ tipo_item: 'INSUMO' }); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-600/20"
        >
          <Plus size={20} />
          Novo Item
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar por descrição..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Total: {filteredItems.length} itens</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="px-6 py-4">Item / Descrição</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Qtd. Atual</th>
                <th className="px-6 py-4">Qtd. Mínima</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => {
                const isLow = item.quantidade_atual < item.quantidade_minima;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${item.tipo_item === 'INSUMO' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                          <Package size={18} />
                        </div>
                        <div>
                          <span className="font-bold text-slate-700 block">{item.descricao}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">{item.unidade_medida}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${item.tipo_item === 'INSUMO' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {item.tipo_item}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700">{item.quantidade_atual}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {item.quantidade_minima}
                    </td>
                    <td className="px-6 py-4">
                      {isLow ? (
                        <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-1 rounded-full w-fit">
                          <AlertTriangle size={14} />
                          <span className="text-[10px] font-bold uppercase">Estoque Baixo</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                          <Package size={14} />
                          <span className="text-[10px] font-bold uppercase">Normal</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setEditingId(item.id); setFormData(item); setIsModalOpen(true); }}
                          className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhum item encontrado no estoque
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold">{editingId ? 'Editar Item' : 'Novo Item no Estoque'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Descrição do Item</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                  value={formData.descricao || ''}
                  onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Tipo</label>
                  <select 
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    value={formData.tipo_item}
                    onChange={e => setFormData({ ...formData, tipo_item: e.target.value as any })}
                  >
                    <option value="INSUMO">INSUMO</option>
                    <option value="FERRAMENTA">FERRAMENTA</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Unidade</label>
                  <input 
                    required
                    placeholder="kg, m, un..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    value={formData.unidade_medida || ''}
                    onChange={e => setFormData({ ...formData, unidade_medida: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Qtd. Atual</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    value={formData.quantidade_atual || ''}
                    onChange={e => setFormData({ ...formData, quantidade_atual: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Qtd. Mínima</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    value={formData.quantidade_minima || ''}
                    onChange={e => setFormData({ ...formData, quantidade_minima: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-600/20"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
