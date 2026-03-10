import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Map, 
  Layers, 
  Home, 
  Settings, 
  ChevronRight, 
  ChevronDown,
  Activity,
  Trash2,
  Edit2,
  PieChart,
  Copy,
  Package,
  Wrench
} from 'lucide-react';

interface Sector {
  id: number;
  nome_setor: string;
  descricao: string;
}

interface Floor {
  id: number;
  setor_id: number;
  nome_pavimento: string;
  descricao: string;
}

interface Environment {
  id: number;
  setor_id: number;
  pavimento_id: number;
  nome_ambiente: string;
  tipo_ambiente: string;
  area_total: number;
  descricao: string;
}

interface Service {
  id: number;
  ambiente_id: number;
  nome_servico: string;
  grupo_servico: string;
  unidade_medida: string;
  quantidade_total_prevista: number;
  quantidade_executada: number;
  quantidade_restante: number;
  descricao?: string;
}

interface Material {
  id: number;
  tipo_item: string;
  descricao: string;
  quantidade: number;
  unidade_medida: string;
  quantidade_total: number;
}

export default function ConstructionParameters() {
  const [setores, setSetores] = useState<Sector[]>([]);
  const [pavimentos, setPavimentos] = useState<Floor[]>([]);
  const [ambientes, setAmbientes] = useState<Environment[]>([]);
  const [servicos, setServicos] = useState<Service[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  
  const [selectedSector, setSelectedSector] = useState<number | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedEnv, setSelectedEnv] = useState<number | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'sector' | 'floor' | 'env' | 'service'>('sector');
  const [copySource, setCopySource] = useState<{ type: string, id: number, name: string } | null>(null);
  const [copyDestId, setCopyDestId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedServiceId, setExpandedServiceId] = useState<number | null>(null);
  const [serviceMaterials, setServiceMaterials] = useState<Material[]>([]);
  
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchSetores();
    fetchActivities();
  }, []);

  useEffect(() => {
    if (selectedSector) fetchPavimentos(selectedSector);
    else setPavimentos([]);
  }, [selectedSector]);

  useEffect(() => {
    if (selectedFloor) fetchAmbientes(selectedFloor);
    else setAmbientes([]);
  }, [selectedFloor]);

  useEffect(() => {
    if (selectedEnv) fetchServicos(selectedEnv);
    else setServicos([]);
  }, [selectedEnv]);

  const fetchSetores = async () => {
    const res = await fetch('/api/setores');
    setSetores(await res.json());
  };

  const fetchPavimentos = async (sectorId: number) => {
    const res = await fetch(`/api/pavimentos?setor_id=${sectorId}`);
    setPavimentos(await res.json());
  };

  const fetchAmbientes = async (floorId: number) => {
    const res = await fetch(`/api/ambientes?pavimento_id=${floorId}`);
    setAmbientes(await res.json());
  };

  const fetchServicos = async (envId: number) => {
    const res = await fetch(`/api/servicos-ambiente?ambiente_id=${envId}`);
    setServicos(await res.json());
  };

  const fetchActivities = async () => {
    const res = await fetch('/api/atividades');
    setActivities(await res.json());
  };

  const fetchMaterials = async (serviceId: number) => {
    if (expandedServiceId === serviceId) {
      setExpandedServiceId(null);
      setServiceMaterials([]);
      return;
    }
    const res = await fetch(`/api/servicos-ambiente/${serviceId}/materiais`);
    setServiceMaterials(await res.json());
    setExpandedServiceId(serviceId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let url = '';
    const body = { ...formData };

    if (modalType === 'sector') url = editingId ? `/api/setores/${editingId}` : '/api/setores';
    if (modalType === 'floor') {
      url = editingId ? `/api/pavimentos/${editingId}` : '/api/pavimentos';
      if (!editingId && !body.setor_id) body.setor_id = selectedSector;
    }
    if (modalType === 'env') {
      url = editingId ? `/api/ambientes/${editingId}` : '/api/ambientes';
      if (!editingId) {
        if (!body.setor_id) body.setor_id = selectedSector;
        if (!body.pavimento_id) body.pavimento_id = selectedFloor;
      }
    }
    if (modalType === 'service') {
      url = editingId ? `/api/servicos-ambiente/${editingId}` : '/api/servicos-ambiente';
      if (!editingId) body.ambiente_id = selectedEnv;
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
      if (modalType === 'sector') fetchSetores();
      if (modalType === 'floor') fetchPavimentos(selectedSector!);
      if (modalType === 'env') fetchAmbientes(selectedFloor!);
      if (modalType === 'service') fetchServicos(selectedEnv!);
    }
  };

  const handleCopy = async () => {
    if (!copySource || !copyDestId) return;

    let url = '';
    let body: any = {};

    if (copySource.type === 'sector') {
      url = '/api/copy/floors';
      body = { fromSectorId: copySource.id, toSectorId: copyDestId };
    } else if (copySource.type === 'floor') {
      url = '/api/copy/environments';
      body = { fromFloorId: copySource.id, toFloorId: copyDestId, toSectorId: selectedSector };
    } else if (copySource.type === 'env') {
      url = '/api/copy/services';
      body = { fromEnvId: copySource.id, toEnvId: copyDestId };
    } else if (copySource.type === 'service') {
      url = '/api/copy/single-service';
      body = { fromServiceId: copySource.id, toEnvId: copyDestId };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': 'admin'
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      setIsCopyModalOpen(false);
      setCopySource(null);
      setCopyDestId(null);
      if (copySource.type === 'sector') fetchPavimentos(copyDestId);
      if (copySource.type === 'floor') fetchAmbientes(copyDestId);
      if (copySource.type === 'env' || copySource.type === 'service') fetchServicos(copyDestId);
    }
  };

  const handleDelete = async (type: string, id: number) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    
    let url = '';
    if (type === 'sector') url = `/api/setores/${id}`;
    if (type === 'floor') url = `/api/pavimentos/${id}`;
    if (type === 'env') url = `/api/ambientes/${id}`;
    if (type === 'service') url = `/api/servicos-ambiente/${id}`;

    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'x-user-role': 'admin' }
    });

    if (res.ok) {
      if (type === 'sector') { fetchSetores(); setSelectedSector(null); }
      if (type === 'floor') { fetchPavimentos(selectedSector!); setSelectedFloor(null); }
      if (type === 'env') { fetchAmbientes(selectedFloor!); setSelectedEnv(null); }
      if (type === 'service') fetchServicos(selectedEnv!);
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
          <h2 className="text-2xl font-bold text-slate-900">Parâmetros Construtivos</h2>
          <p className="text-slate-500">Defina a estrutura física e serviços da obra</p>
        </div>
        <button 
          onClick={() => { setModalType('sector'); setEditingId(null); setFormData({}); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-bold shadow-lg shadow-emerald-500/20"
        >
          <Plus size={20} />
          Novo Setor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sectors Column */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Map size={18} className="text-indigo-500" /> Setores
            </h3>
          </div>
          <div className="p-2 space-y-1">
            {setores.map(s => (
              <div key={s.id} className="group relative">
                <button
                  onClick={() => { setSelectedSector(s.id); setSelectedFloor(null); setSelectedEnv(null); }}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${selectedSector === s.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  <span className="font-medium">{s.nome_setor}</span>
                  <ChevronRight size={16} className={`transition-transform ${selectedSector === s.id ? 'rotate-90' : 'opacity-0 group-hover:opacity-100'}`} />
                </button>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setCopySource({ type: 'sector', id: s.id, name: s.nome_setor }); setIsCopyModalOpen(true); }} className="p-1.5 hover:bg-indigo-100 text-indigo-600 rounded-lg" title="Copiar pavimentos deste setor">
                    <Copy size={14} />
                  </button>
                  <button onClick={() => openEdit('sector', s)} className="p-1.5 hover:bg-indigo-100 text-indigo-600 rounded-lg">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete('sector', s.id)} className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {setores.length === 0 && <p className="p-4 text-center text-slate-400 text-sm italic">Nenhum setor cadastrado</p>}
          </div>
        </div>

        {/* Floors Column */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Layers size={18} className="text-emerald-500" /> Pavimentos
            </h3>
            <button onClick={() => { setModalType('floor'); setEditingId(null); setFormData({}); setIsModalOpen(true); }} className="p-1 hover:bg-emerald-100 text-emerald-600 rounded-lg">
              <Plus size={18} />
            </button>
          </div>
          <div className="p-2 space-y-1">
            {!selectedSector ? (
              <p className="p-8 text-center text-slate-400 text-sm italic">Selecione um setor para ver os pavimentos</p>
            ) : (
              <>
                {pavimentos.map(p => (
                  <div key={p.id} className="group relative">
                    <button
                      onClick={() => { setSelectedFloor(p.id); setSelectedEnv(null); }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${selectedFloor === p.id ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-600'}`}
                    >
                      <span className="font-medium">{p.nome_pavimento}</span>
                      <ChevronRight size={16} className={`transition-transform ${selectedFloor === p.id ? 'rotate-90' : 'opacity-0 group-hover:opacity-100'}`} />
                    </button>
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setCopySource({ type: 'floor', id: p.id, name: p.nome_pavimento }); setIsCopyModalOpen(true); }} className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded-lg" title="Copiar ambientes deste pavimento">
                        <Copy size={14} />
                      </button>
                      <button onClick={() => openEdit('floor', p)} className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded-lg">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete('floor', p.id)} className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {pavimentos.length === 0 && <p className="p-4 text-center text-slate-400 text-sm italic">Nenhum pavimento</p>}
              </>
            )}
          </div>
        </div>

        {/* Environments Column */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Home size={18} className="text-amber-500" /> Ambientes
            </h3>
            <button onClick={() => { setModalType('env'); setEditingId(null); setFormData({}); setIsModalOpen(true); }} className="p-1 hover:bg-amber-100 text-amber-600 rounded-lg">
              <Plus size={18} />
            </button>
          </div>
          <div className="p-2 space-y-1">
            {!selectedFloor ? (
              <p className="p-8 text-center text-slate-400 text-sm italic">Selecione um pavimento</p>
            ) : (
              <>
                {ambientes.map(a => (
                  <div key={a.id} className="group relative">
                    <button
                      onClick={() => setSelectedEnv(a.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${selectedEnv === a.id ? 'bg-amber-50 text-amber-700' : 'hover:bg-slate-50 text-slate-600'}`}
                    >
                      <div>
                        <span className="font-medium block">{a.nome_ambiente}</span>
                        <span className="text-[10px] uppercase font-bold opacity-60">{a.tipo_ambiente}</span>
                      </div>
                      <ChevronRight size={16} className={`transition-transform ${selectedEnv === a.id ? 'rotate-90' : 'opacity-0 group-hover:opacity-100'}`} />
                    </button>
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setCopySource({ type: 'env', id: a.id, name: a.nome_ambiente }); setIsCopyModalOpen(true); }} className="p-1.5 hover:bg-amber-100 text-amber-600 rounded-lg" title="Copiar serviços deste ambiente">
                        <Copy size={14} />
                      </button>
                      <button onClick={() => openEdit('env', a)} className="p-1.5 hover:bg-amber-100 text-amber-600 rounded-lg">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete('env', a.id)} className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {ambientes.length === 0 && <p className="p-4 text-center text-slate-400 text-sm italic">Nenhum ambiente</p>}
              </>
            )}
          </div>
        </div>

        {/* Services Column */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden lg:col-span-1">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Activity size={18} className="text-rose-500" /> Serviços
            </h3>
            {selectedEnv && (
              <button onClick={() => { setModalType('service'); setIsModalOpen(true); }} className="p-1 hover:bg-rose-100 text-rose-600 rounded-lg">
                <Plus size={18} />
              </button>
            )}
          </div>
          <div className="p-4 space-y-4">
            {!selectedEnv ? (
              <p className="p-8 text-center text-slate-400 text-sm italic">Selecione um ambiente</p>
            ) : (
              <>
                {servicos.map(s => {
                  const progress = (s.quantidade_executada / s.quantidade_total_prevista) * 100;
                  const isExpanded = expandedServiceId === s.id;
                  return (
                    <div key={s.id} className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100 group relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => fetchMaterials(s.id)}
                            className="font-bold text-slate-700 text-sm hover:text-rose-600 transition-colors flex items-center gap-1"
                          >
                            {s.nome_servico}
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                          <button 
                            onClick={() => fetchMaterials(s.id)}
                            className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full hover:bg-rose-100 transition-colors"
                          >
                            {isExpanded ? 'Fechar' : 'Detalhes'}
                          </button>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setCopySource({ type: 'service', id: s.id, name: s.nome_servico }); setIsCopyModalOpen(true); }} className="p-1 hover:bg-rose-100 text-rose-600 rounded-lg" title="Copiar este serviço para outro ambiente">
                            <Copy size={12} />
                          </button>
                          <button onClick={() => openEdit('service', s)} className="p-1 hover:bg-rose-100 text-rose-600 rounded-lg">
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => handleDelete('service', s.id)} className="p-1 hover:bg-red-100 text-red-600 rounded-lg">
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }}></div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
                        <span>{s.quantidade_executada} / {s.quantidade_total_prevista} {s.unidade_medida}</span>
                        <span className="text-rose-500">Restam: {s.quantidade_restante}</span>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 animate-in fade-in slide-in-from-top-1">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Composição de Materiais</p>
                            <span className="text-[10px] text-slate-400 italic">Baseado na atividade vinculada</span>
                          </div>
                          {serviceMaterials.length > 0 ? (
                            <div className="space-y-1.5">
                              {serviceMaterials.map(m => (
                                <div key={m.id} className="flex items-center justify-between text-[10px] bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${m.tipo_item === 'INSUMO' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                      {m.tipo_item === 'INSUMO' ? <Package size={12} /> : <Wrench size={12} />}
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase block leading-none mb-0.5">{m.tipo_item}</span>
                                      <span className="text-slate-700 font-bold">{m.descricao}</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[9px] text-slate-400 block leading-none mb-0.5 uppercase font-bold">Qtd. Necessária</span>
                                    <span className="font-bold text-slate-900 text-xs">
                                      {m.quantidade_total.toLocaleString(undefined, { maximumFractionDigits: 3 })} {m.unidade_medida}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                              <p className="text-[10px] text-slate-400 italic">Nenhum material de composição encontrado para esta atividade.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {servicos.length === 0 && <p className="text-center text-slate-400 text-sm italic py-4">Nenhum serviço</p>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold">
                {modalType === 'sector' && (editingId ? 'Editar Setor' : 'Novo Setor')}
                {modalType === 'floor' && (editingId ? 'Editar Pavimento' : 'Novo Pavimento')}
                {modalType === 'env' && (editingId ? 'Editar Ambiente' : 'Novo Ambiente')}
                {modalType === 'service' && 'Novo Serviço'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Nome / Título</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                  value={formData.nome_setor || formData.nome_pavimento || formData.nome_ambiente || formData.nome_servico || ''}
                  onChange={e => {
                    const val = e.target.value;
                    if (modalType === 'sector') setFormData({ ...formData, nome_setor: val });
                    if (modalType === 'floor') setFormData({ ...formData, nome_pavimento: val });
                    if (modalType === 'env') setFormData({ ...formData, nome_ambiente: val });
                    if (modalType === 'service') setFormData({ ...formData, nome_servico: val });
                  }}
                />
              </div>

              {modalType === 'floor' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Setor Associado</label>
                  <select 
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                    value={formData.setor_id || selectedSector || ''}
                    onChange={e => setFormData({ ...formData, setor_id: e.target.value })}
                  >
                    <option value="">Selecione um setor...</option>
                    {setores.map(s => (
                      <option key={s.id} value={s.id}>{s.nome_setor}</option>
                    ))}
                  </select>
                </div>
              )}

              {modalType === 'env' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Setor</label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                        value={formData.setor_id || selectedSector || ''}
                        onChange={e => setFormData({ ...formData, setor_id: e.target.value, pavimento_id: '' })}
                      >
                        <option value="">Selecione...</option>
                        {setores.map(s => (
                          <option key={s.id} value={s.id}>{s.nome_setor}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Pavimento</label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                        value={formData.pavimento_id || selectedFloor || ''}
                        onChange={e => setFormData({ ...formData, pavimento_id: e.target.value })}
                      >
                        <option value="">Selecione...</option>
                        {/* Filter pavimentos based on selected sector in form or global selectedSector */}
                        {pavimentos.filter(p => p.setor_id == (formData.setor_id || selectedSector)).map(p => (
                          <option key={p.id} value={p.id}>{p.nome_pavimento}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Tipo</label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                        value={formData.tipo_ambiente || ''}
                        onChange={e => setFormData({ ...formData, tipo_ambiente: e.target.value })}
                      >
                        <option value="">Selecione...</option>
                        <option value="SALA">SALA</option>
                        <option value="ÁREA TÉCNICA">ÁREA TÉCNICA</option>
                        <option value="ÁREA COMUM">ÁREA COMUM</option>
                        <option value="BANHEIRO">BANHEIRO</option>
                        <option value="CORREDOR">CORREDOR</option>
                        <option value="MACRO">MACRO</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Área (m²)</label>
                      <input 
                        required
                        type="number" 
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                        value={formData.area_total || ''}
                        onChange={e => setFormData({ ...formData, area_total: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              {modalType === 'service' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Vincular Atividade (Opcional)</label>
                    <select 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                      onChange={e => {
                        const act = activities.find(a => a.id == e.target.value);
                        if (act) {
                          setFormData({
                            ...formData,
                            nome_servico: act.nome_atividade,
                            unidade_medida: act.unidade_medida,
                            quantidade_total_prevista: act.quantidade_padrao || 1,
                            descricao: act.descricao || ''
                          });
                        }
                      }}
                    >
                      <option value="">Selecione uma atividade para preencher...</option>
                      {activities.map(a => (
                        <option key={a.id} value={a.id}>{a.nome_atividade} ({a.unidade_medida})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Unidade</label>
                      <input 
                        required
                        placeholder="m², un, kg..."
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                        value={formData.unidade_medida || ''}
                        onChange={e => setFormData({ ...formData, unidade_medida: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Qtd. Prevista</label>
                      <input 
                        required
                        type="number" 
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                        value={formData.quantidade_total_prevista || ''}
                        onChange={e => setFormData({ ...formData, quantidade_total_prevista: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Descrição</label>
                <textarea 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 h-20"
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
                  className="px-8 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 font-semibold shadow-lg shadow-emerald-500/20"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy Modal */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <Copy size={24} className="text-indigo-500" /> 
                Copiar Informações
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {copySource?.type === 'sector' && `Copiando pavimentos de: ${copySource.name}`}
                {copySource?.type === 'floor' && `Copiando ambientes de: ${copySource.name}`}
                {copySource?.type === 'env' && `Copiando serviços de: ${copySource.name}`}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Destino</label>
                <select 
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                  value={copyDestId || ''}
                  onChange={e => setCopyDestId(Number(e.target.value))}
                >
                  <option value="">Selecione o destino...</option>
                  {copySource?.type === 'sector' && setores.filter(s => s.id !== copySource.id).map(s => (
                    <option key={s.id} value={s.id}>{s.nome_setor}</option>
                  ))}
                  {copySource?.type === 'floor' && pavimentos.filter(p => p.id !== copySource.id).map(p => (
                    <option key={p.id} value={p.id}>{p.nome_pavimento}</option>
                  ))}
                  {copySource?.type === 'env' && ambientes.filter(a => a.id !== copySource.id).map(a => (
                    <option key={a.id} value={a.id}>{a.nome_ambiente} ({a.nome_pavimento})</option>
                  ))}
                  {copySource?.type === 'service' && ambientes.map(a => (
                    <option key={a.id} value={a.id}>{a.nome_ambiente} ({a.nome_pavimento})</option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                  <strong>Atenção:</strong> Esta ação irá duplicar todos os itens vinculados (sub-níveis) para o destino selecionado. Os valores de execução serão zerados nas cópias.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsCopyModalOpen(false)}
                  className="px-6 py-2.5 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCopy}
                  disabled={!copyDestId}
                  className="px-8 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar Cópia
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
