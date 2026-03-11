import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Folder, 
  CheckCircle2, 
  Package, 
  Wrench, 
  Clock, 
  Users, 
  DollarSign,
  ChevronRight,
  ChevronDown,
  Trash2,
  Edit2,
  Info
} from 'lucide-react';

interface ActivityGroup {
  id: number;
  nome_grupo: string;
  descricao: string;
}

interface Activity {
  id: number;
  grupo_atividade_id: number;
  nome_atividade: string;
  unidade_medida: string;
  prazo_execucao: number;
  produtividade_profissional: number;
  valor_parametro: number;
  tipo_pagamento: string;
  descricao?: string;
  quantidade_padrao?: number;
  nome_grupo?: string;
}

interface Composition {
  id: number;
  atividade_id: number;
  tipo_item: string;
  descricao: string;
  quantidade: number;
  unidade_medida: string;
}

export default function Activities() {
  const [groups, setGroups] = useState<ActivityGroup[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [compositions, setCompositions] = useState<Composition[]>([]);
  
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPrazo, setFilterPrazo] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'group' | 'activity' | 'composition'>('group');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchActivities(selectedGroup, filterStatus, filterPrazo);
    setSelectedActivity(null);
  }, [selectedGroup, filterStatus, filterPrazo]);

  useEffect(() => {
    if (selectedActivity) fetchCompositions(selectedActivity);
    else setCompositions([]);
  }, [selectedActivity]);

  const fetchGroups = async () => {
    const res = await fetch('/api/grupos-atividade');
    setGroups(await res.json());
  };

  const fetchActivities = async (groupId: number | null, status: string, prazo: string) => {
    let url = '/api/atividades?';
    if (groupId) url += `grupo_id=${groupId}&`;
    if (status) url += `status=${status}&`;
    if (prazo) url += `prazo_max=${prazo}&`;
    const res = await fetch(url);
    setActivities(await res.json());
  };

  const fetchCompositions = async (activityId: number) => {
    const res = await fetch(`/api/composicao-atividade?atividade_id=${activityId}`);
    setCompositions(await res.json());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let url = '';
    const body = { ...formData };

    if (modalType === 'group') url = editingId ? `/api/grupos-atividade/${editingId}` : '/api/grupos-atividade';
    if (modalType === 'activity') {
      url = editingId ? `/api/atividades/${editingId}` : '/api/atividades';
      if (!editingId) body.grupo_atividade_id = selectedGroup;
    }
    if (modalType === 'composition') {
      url = editingId ? `/api/composicao-atividade/${editingId}` : '/api/composicao-atividade';
      if (!editingId) body.atividade_id = selectedActivity;
    }

    const res = await fetch(url, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': 'admin'
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      setIsModalOpen(false);
      setFormData({});
      setEditingId(null);
      if (modalType === 'group') fetchGroups();
      if (modalType === 'activity') fetchActivities(selectedGroup, filterStatus, filterPrazo);
      if (modalType === 'composition') fetchCompositions(selectedActivity!);
    }
  };

  const handleDelete = async (type: string, id: number) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    
    let url = '';
    if (type === 'group') url = `/api/grupos-atividade/${id}`;
    if (type === 'activity') url = `/api/atividades/${id}`;
    if (type === 'composition') url = `/api/composicao-atividade/${id}`;

    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'x-user-role': 'admin' }
    });

    if (res.ok) {
      if (type === 'group') { fetchGroups(); setSelectedGroup(null); }
      if (type === 'activity') { fetchActivities(selectedGroup, filterStatus, filterPrazo); setSelectedActivity(null); }
      if (type === 'composition') { fetchCompositions(selectedActivity!); }
    }
  };

  const openEdit = (type: any, item: any) => {
    setModalType(type);
    setEditingId(item.id);
    setFormData(item);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestão de Atividades</h2>
          <p className="text-slate-500">Cadastre grupos, atividades e composições</p>
        </div>
        <button 
          onClick={() => { setModalType('group'); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all font-bold shadow-lg shadow-indigo-500/20"
        >
          <Plus size={20} />
          Novo Grupo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups Column */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Folder size={18} className="text-indigo-500" /> Grupos
            </h3>
          </div>
          <div className="p-2 space-y-1">
            <button
              onClick={() => setSelectedGroup(null)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${selectedGroup === null ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
            >
              <span className="font-medium">Todos os Grupos</span>
              <ChevronRight size={16} className={`transition-transform ${selectedGroup === null ? 'rotate-90' : 'opacity-0 group-hover:opacity-100'}`} />
            </button>
            {groups.map(g => (
              <div key={g.id} className="group relative">
                <button
                  onClick={() => setSelectedGroup(g.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${selectedGroup === g.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  <span className="font-medium">{g.nome_grupo}</span>
                  <ChevronRight size={16} className={`transition-transform ${selectedGroup === g.id ? 'rotate-90' : 'opacity-0 group-hover:opacity-100'}`} />
                </button>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit('group', g)} className="p-1.5 hover:bg-indigo-100 text-indigo-600 rounded-lg">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete('group', g.id)} className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activities Column */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" /> Atividades
              </h3>
              {selectedGroup && (
                <button onClick={() => { setModalType('activity'); setIsModalOpen(true); }} className="p-1 hover:bg-emerald-100 text-emerald-600 rounded-lg">
                  <Plus size={18} />
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <select 
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-emerald-500 bg-white"
                value={selectedGroup || ''}
                onChange={(e) => setSelectedGroup(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Todos os Grupos</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.nome_grupo}</option>
                ))}
              </select>
              
              <div className="grid grid-cols-2 gap-2">
                <select 
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-emerald-500 bg-white"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Todos Status</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Pendente">Pendente</option>
                </select>
                <input 
                  type="number"
                  placeholder="Prazo máx."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  value={filterPrazo}
                  onChange={(e) => setFilterPrazo(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="p-2 space-y-1">
            {activities.map(a => (
              <div key={a.id} className="group relative">
                <button
                  onClick={() => setSelectedActivity(a.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${selectedActivity === a.id ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium block">{a.nome_atividade}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${a.status === 'Ativo' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {a.status || 'Ativo'}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold opacity-60">{a.tipo_pagamento} - {a.unidade_medida} - {a.prazo_execucao}d</span>
                  </div>
                  <ChevronRight size={16} className={`transition-transform ${selectedActivity === a.id ? 'rotate-90' : 'opacity-0 group-hover:opacity-100'}`} />
                </button>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit('activity', a)} className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded-lg">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete('activity', a.id)} className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {activities.length === 0 && <p className="p-8 text-center text-slate-400 text-sm italic">Nenhuma atividade encontrada</p>}
          </div>
        </div>

        {/* Composition Column */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Package size={18} className="text-amber-500" /> Composição
            </h3>
            {selectedActivity && (
              <button onClick={() => { setModalType('composition'); setIsModalOpen(true); }} className="p-1 hover:bg-amber-100 text-amber-600 rounded-lg">
                <Plus size={18} />
              </button>
            )}
          </div>
          <div className="p-4 space-y-4">
            {!selectedActivity ? (
              <p className="p-8 text-center text-slate-400 text-sm italic">Selecione uma atividade para ver a composição</p>
            ) : (
              <>
                {/* Productivity Info */}
                {activities.find(a => a.id === selectedActivity) && (
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase">
                      <Info size={14} /> Parâmetros de Produtividade
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-indigo-500 font-bold uppercase">Prazo</span>
                        <p className="text-sm font-bold text-indigo-900">{activities.find(a => a.id === selectedActivity)?.prazo_execucao} dias</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-indigo-500 font-bold uppercase">Produtividade</span>
                        <p className="text-sm font-bold text-indigo-900">{activities.find(a => a.id === selectedActivity)?.produtividade_profissional} / dia</p>
                      </div>
                    </div>
                  </div>
                )}

                {compositions.map(c => {
                  const activity = activities.find(a => a.id === selectedActivity);
                  const totalCalculated = (c.quantidade * (activity?.quantidade_padrao || 1)).toFixed(3);
                  
                  return (
                    <div key={c.id} className="group relative flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${c.tipo_item === 'INSUMO' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                          {c.tipo_item === 'INSUMO' ? <Package size={16} /> : <Wrench size={16} />}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">{c.tipo_item}</span>
                          <span className="font-medium text-slate-700">{c.descricao}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-bold text-slate-900">{c.quantidade}</span>
                            <span className="text-[10px] text-slate-500 uppercase">{c.unidade_medida}</span>
                          </div>
                          <div className="text-[10px] font-bold text-indigo-600 uppercase">
                            Total: {totalCalculated} {c.unidade_medida}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit('composition', c)} className="p-1 hover:bg-amber-100 text-amber-600 rounded-lg">
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => handleDelete('composition', c.id)} className="p-1 hover:bg-red-100 text-red-600 rounded-lg">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {compositions.length === 0 && <p className="text-center text-slate-400 text-sm italic py-4">Nenhum item na composição</p>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold">
                {modalType === 'group' && (editingId ? 'Editar Grupo' : 'Novo Grupo')}
                {modalType === 'activity' && (editingId ? 'Editar Atividade' : 'Nova Atividade')}
                {modalType === 'composition' && (editingId ? 'Editar Item' : 'Novo Item')}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {modalType === 'group' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Nome do Grupo</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                      value={formData.nome_grupo || ''}
                      onChange={e => setFormData({ ...formData, nome_grupo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Descrição</label>
                    <textarea 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 h-24"
                      value={formData.descricao || ''}
                      onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Descreva o propósito deste grupo de atividades..."
                    />
                  </div>
                </>
              )}

              {modalType === 'activity' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Nome da Atividade</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                      value={formData.nome_atividade || ''}
                      onChange={e => setFormData({ ...formData, nome_atividade: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Unidade</label>
                      <input 
                        required
                        placeholder="m², un, kg..."
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                        value={formData.unidade_medida || ''}
                        onChange={e => setFormData({ ...formData, unidade_medida: e.target.value })}
                      />
                    </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Tipo Pagamento</label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                        value={formData.tipo_pagamento || ''}
                        onChange={e => setFormData({ ...formData, tipo_pagamento: e.target.value })}
                      >
                        <option value="">Selecione...</option>
                        <option value="PRODUÇÃO">PRODUÇÃO</option>
                        <option value="GRATIFICAÇÃO">GRATIFICAÇÃO</option>
                        <option value="TAREFA">TAREFA</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Status</label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                        value={formData.status || 'Ativo'}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                        <option value="Pendente">Pendente</option>
                      </select>
                    </div>
                  </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Prazo (dias)</label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                        value={formData.prazo_execucao || ''}
                        onChange={e => setFormData({ ...formData, prazo_execucao: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Produtividade</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                        value={formData.produtividade_profissional || ''}
                        onChange={e => setFormData({ ...formData, produtividade_profissional: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Valor (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                        value={formData.valor_parametro || ''}
                        onChange={e => setFormData({ ...formData, valor_parametro: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Quantidade Padrão (Opcional)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                      value={formData.quantidade_padrao || ''}
                      onChange={e => setFormData({ ...formData, quantidade_padrao: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Descrição Técnica</label>
                    <textarea 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 h-20"
                      value={formData.descricao || ''}
                      onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                    />
                  </div>
                </>
              )}

              {modalType === 'composition' && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Tipo</label>
                    <select 
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                      value={formData.tipo_item || ''}
                      onChange={e => setFormData({ ...formData, tipo_item: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="INSUMO">INSUMO</option>
                      <option value="FERRAMENTA">FERRAMENTA</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Qtd.</label>
                    <input 
                      required
                      type="number" 
                      step="0.001"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                      value={formData.quantidade || ''}
                      onChange={e => setFormData({ ...formData, quantidade: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Unidade</label>
                    <input 
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                      value={formData.unidade_medida || ''}
                      onChange={e => setFormData({ ...formData, unidade_medida: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Observações</label>
                <textarea 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 h-20"
                  value={formData.descricao || ''}
                  onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                />
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
                  className="px-8 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 font-semibold shadow-lg shadow-indigo-500/20"
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
