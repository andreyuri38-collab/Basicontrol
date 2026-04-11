import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Map, 
  Layers, 
  Home, 
  Settings, 
  ChevronRight, 
  ChevronDown,
  Trash2,
  Edit2,
  X,
  ArrowLeft,
  Building2,
  Layout,
  Box,
  Square,
  MoreVertical,
  FolderDown
} from 'lucide-react';

interface Obra {
  id: number;
  nome_obra: string;
  descricao: string;
}

interface Setor {
  id: number;
  obra_id: number;
  nome_setor: string;
  tipo: 'Torre' | 'Area Comum';
  descricao: string;
}

interface Local {
  id: number;
  setor_id: number;
  nome_local: string;
  tipo: 'Individual' | 'Comum';
  area_total?: number;
  piso?: string;
  parede?: string;
  teto?: string;
  esquadrias?: string;
  metais?: string;
  loucas?: string;
  descricao?: string;
}

interface Categoria {
  id: number;
  local_id: number;
  nome_categoria: string;
}

interface Unidade {
  id: number;
  categoria_id: number;
  nome_unidade: string;
  descricao: string;
}

interface Ambiente {
  id: number;
  unidade_id: number;
  tipo_ambiente_id: number;
  nome_ambiente: string;
  area_total?: number;
  piso?: string;
  parede?: string;
  teto?: string;
  esquadrias?: string;
  metais?: string;
  loucas?: string;
  descricao?: string;
}

type ViewMode = 'list-obras' | 'create-obra' | 'view-obra' | 'create-setor' | 'view-setor' | 'create-local' | 'view-local' | 'create-categoria' | 'view-categoria' | 'create-unidade' | 'view-unidade' | 'create-ambiente';

export default function ConstructionParameters() {
  const [viewMode, setViewMode] = useState<ViewMode>('list-obras');
  const [obras, setObras] = useState<Obra[]>([]);
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [selectedSetor, setSelectedSetor] = useState<Setor | null>(null);
  const [locais, setLocais] = useState<Local[]>([]);
  const [selectedLocal, setSelectedLocal] = useState<Local | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [tiposAmbiente, setTiposAmbiente] = useState<any[]>([]);

  const [editingLocal, setEditingLocal] = useState<Local | null>(null);
  const [editingAmbiente, setEditingAmbiente] = useState<Ambiente | null>(null);

  const [obraForm, setObraForm] = useState({ nome_obra: '', descricao: '' });
  const [setorForm, setSetorForm] = useState({ nome_setor: '', tipo: 'Torre' as 'Torre' | 'Area Comum', descricao: '' });
  const [localForm, setLocalForm] = useState({ 
    nome_local: '', 
    tipo: 'Individual' as 'Individual' | 'Comum',
    area_total: '',
    piso: '',
    parede: '',
    teto: '',
    esquadrias: '',
    metais: '',
    loucas: '',
    descricao: ''
  });
  const [categoriaForm, setCategoriaForm] = useState({ nome_categoria: '' });
  const [unidadeForm, setUnidadeForm] = useState({ nome_unidade: '', descricao: '' });
  const [ambienteForm, setAmbienteForm] = useState({ 
    nome_ambiente: '', 
    tipo_ambiente_id: '',
    area_total: '',
    piso: '',
    parede: '',
    teto: '',
    esquadrias: '',
    metais: '',
    loucas: '',
    descricao: ''
  });

  useEffect(() => {
    fetchObras();
    fetchTiposAmbiente();
  }, []);

  const fetchTiposAmbiente = async () => {
    const res = await fetch('/api/tipos-ambiente');
    const data = await res.json();
    setTiposAmbiente(data || []);
  };

  const fetchObras = async () => {
    const res = await fetch('/api/obras');
    const data = await res.json();
    setObras(data.data || []);
  };

  const fetchSetores = async (obraId: number) => {
    const res = await fetch(`/api/setores?obra_id=${obraId}`);
    const data = await res.json();
    setSetores(data.data || []);
  };

  const fetchLocais = async (setorId: number) => {
    const res = await fetch(`/api/locais?setor_id=${setorId}`);
    const data = await res.json();
    setLocais(data || []);
  };

  const fetchCategorias = async (localId: number) => {
    const res = await fetch(`/api/categorias?local_id=${localId}`);
    const data = await res.json();
    setCategorias(data || []);
  };

  const fetchUnidades = async (categoriaId: number) => {
    const res = await fetch(`/api/unidades?categoria_id=${categoriaId}`);
    const data = await res.json();
    setUnidades(data || []);
  };

  const fetchAmbientes = async (unidadeId: number) => {
    const res = await fetch(`/api/ambientes?unidade_id=${unidadeId}`);
    const data = await res.json();
    setAmbientes(data || []);
  };

  const handleCreateObra = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/obras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify(obraForm)
    });
    if (res.ok) {
      fetchObras();
      setViewMode('list-obras');
      setObraForm({ nome_obra: '', descricao: '' });
    }
  };

  const handleCreateSetor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedObra) return;
    const res = await fetch('/api/setores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ ...setorForm, obra_id: selectedObra.id })
    });
    if (res.ok) {
      fetchSetores(selectedObra.id);
      setViewMode('view-obra');
      setSetorForm({ nome_setor: '', tipo: 'Torre', descricao: '' });
    }
  };

  const handleCreateLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSetor) return;
    const res = await fetch('/api/locais', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ 
        ...localForm, 
        setor_id: selectedSetor.id,
        area_total: localForm.area_total ? parseFloat(localForm.area_total) : null
      })
    });
    if (res.ok) {
      fetchLocais(selectedSetor.id);
      setViewMode('view-setor');
      setLocalForm({ 
        nome_local: '', 
        tipo: 'Individual',
        area_total: '',
        piso: '',
        parede: '',
        teto: '',
        esquadrias: '',
        metais: '',
        loucas: '',
        descricao: ''
      });
    }
  };

  const handleCreateCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocal) return;
    const res = await fetch('/api/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ ...categoriaForm, local_id: selectedLocal.id })
    });
    if (res.ok) {
      fetchCategorias(selectedLocal.id);
      setViewMode('view-local');
      setCategoriaForm({ nome_categoria: '' });
    }
  };

  const handleCreateUnidade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoria) return;
    const res = await fetch('/api/unidades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ ...unidadeForm, categoria_id: selectedCategoria.id })
    });
    if (res.ok) {
      fetchUnidades(selectedCategoria.id);
      setViewMode('view-categoria');
      setUnidadeForm({ nome_unidade: '', descricao: '' });
    }
  };

  const handleUpdateLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocal || !selectedSetor) return;
    const res = await fetch(`/api/locais/${editingLocal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ 
        ...localForm,
        area_total: localForm.area_total ? parseFloat(localForm.area_total) : null
      })
    });
    if (res.ok) {
      fetchLocais(selectedSetor.id);
      setViewMode('view-setor');
      setEditingLocal(null);
      setLocalForm({ 
        nome_local: '', 
        tipo: 'Individual',
        area_total: '',
        piso: '',
        parede: '',
        teto: '',
        esquadrias: '',
        metais: '',
        loucas: '',
        descricao: ''
      });
    }
  };

  const handleCreateAmbiente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnidade) return;
    const selectedTipo = tiposAmbiente.find(t => t.id === parseInt(ambienteForm.tipo_ambiente_id));
    const res = await fetch('/api/ambientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ 
        ...ambienteForm, 
        unidade_id: selectedUnidade.id,
        tipo_ambiente: selectedTipo?.nome || 'SALA',
        area_total: ambienteForm.area_total ? parseFloat(ambienteForm.area_total) : null
      })
    });
    if (res.ok) {
      fetchAmbientes(selectedUnidade.id);
      setViewMode('view-unidade');
      setAmbienteForm({ 
        nome_ambiente: '', 
        tipo_ambiente_id: '',
        area_total: '',
        piso: '',
        parede: '',
        teto: '',
        esquadrias: '',
        metais: '',
        loucas: '',
        descricao: ''
      });
    }
  };

  const handleUpdateAmbiente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAmbiente || !selectedUnidade) return;
    const selectedTipo = tiposAmbiente.find(t => t.id === parseInt(ambienteForm.tipo_ambiente_id));
    const res = await fetch(`/api/ambientes/${editingAmbiente.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ 
        ...ambienteForm,
        unidade_id: selectedUnidade.id,
        tipo_ambiente: selectedTipo?.nome || 'SALA',
        area_total: ambienteForm.area_total ? parseFloat(ambienteForm.area_total) : null
      })
    });
    if (res.ok) {
      fetchAmbientes(selectedUnidade.id);
      setViewMode('view-unidade');
      setEditingAmbiente(null);
      setAmbienteForm({ 
        nome_ambiente: '', 
        tipo_ambiente_id: '',
        area_total: '',
        piso: '',
        parede: '',
        teto: '',
        esquadrias: '',
        metais: '',
        loucas: '',
        descricao: ''
      });
    }
  };

  const Breadcrumbs = () => (
    <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 overflow-x-auto pb-2 scrollbar-hide">
      <button onClick={() => setViewMode('list-obras')} className="hover:text-emerald-600 whitespace-nowrap font-medium">Obras</button>
      {selectedObra && (
        <>
          <ChevronRight size={14} />
          <button onClick={() => setViewMode('view-obra')} className="hover:text-emerald-600 whitespace-nowrap font-medium">{selectedObra.nome_obra}</button>
        </>
      )}
      {selectedSetor && (
        <>
          <ChevronRight size={14} />
          <button onClick={() => setViewMode('view-setor')} className="hover:text-emerald-600 whitespace-nowrap font-medium">{selectedSetor.nome_setor}</button>
        </>
      )}
      {selectedLocal && (
        <>
          <ChevronRight size={14} />
          <button onClick={() => setViewMode('view-local')} className="hover:text-emerald-600 whitespace-nowrap font-medium">{selectedLocal.nome_local}</button>
        </>
      )}
      {selectedCategoria && (
        <>
          <ChevronRight size={14} />
          <button onClick={() => setViewMode('view-categoria')} className="hover:text-emerald-600 whitespace-nowrap font-medium">{selectedCategoria.nome_categoria}</button>
        </>
      )}
      {selectedUnidade && (
        <>
          <ChevronRight size={14} />
          <button onClick={() => setViewMode('view-unidade')} className="hover:text-emerald-600 whitespace-nowrap font-medium">{selectedUnidade.nome_unidade}</button>
        </>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <Map size={24} />
            </div>
            Parâmetros de Projeto
          </h1>
          <p className="text-slate-500">Hierarquia de organização da obra.</p>
        </div>
        {viewMode === 'list-obras' && (
          <button 
            onClick={() => setViewMode('create-obra')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 font-medium"
          >
            <Plus size={20} /> CRIAR OBRA
          </button>
        )}
      </div>

      <Breadcrumbs />

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {viewMode === 'list-obras' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {obras.map(obra => (
              <div 
                key={obra.id}
                onClick={() => {
                  setSelectedObra(obra);
                  fetchSetores(obra.id);
                  setViewMode('view-obra');
                }}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all cursor-pointer group shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <Building2 size={24} />
                  </div>
                  <button className="text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{obra.nome_obra}</h3>
                <p className="text-slate-500 text-sm line-clamp-2">{obra.descricao || 'Sem observações'}</p>
              </div>
            ))}
            {obras.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">Nenhuma obra cadastrada.</p>
                <button onClick={() => setViewMode('create-obra')} className="text-emerald-500 font-medium mt-2 hover:underline">Criar primeira obra</button>
              </div>
            )}
          </div>
        )}

        {viewMode === 'create-obra' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setViewMode('list-obras')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-xl font-bold">CRIAR OBRA</h2>
            </div>
            <form onSubmit={handleCreateObra} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">NOME</label>
                <input 
                  type="text" 
                  required
                  placeholder="insira o nome da obra"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  value={obraForm.nome_obra}
                  onChange={e => setObraForm({...obraForm, nome_obra: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">OBSERVAÇÕES</label>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  value={obraForm.descricao}
                  onChange={e => setObraForm({...obraForm, descricao: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setViewMode('list-obras')}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all font-medium shadow-lg shadow-emerald-500/20"
                >
                  Salvar Obra
                </button>
              </div>
            </form>
          </div>
        )}

        {viewMode === 'view-obra' && selectedObra && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Setores da Obra</h2>
              <button 
                onClick={() => setViewMode('create-setor')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-medium"
              >
                <Plus size={20} /> ADICIONAR SETOR
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {setores.map(setor => (
                <div 
                  key={setor.id}
                  onClick={() => {
                    setSelectedSetor(setor);
                    fetchLocais(setor.id);
                    setViewMode('view-setor');
                  }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${setor.tipo === 'Torre' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                      {setor.tipo === 'Torre' ? <Building2 size={20} /> : <Layout size={20} />}
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${setor.tipo === 'Torre' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                      {setor.tipo}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900">{setor.nome_setor}</h3>
                  <p className="text-slate-500 text-sm mt-1">{setor.descricao || 'Sem descrição'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'create-setor' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setViewMode('view-obra')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-xl font-bold">ADICIONAR SETOR</h2>
            </div>
            <form onSubmit={handleCreateSetor} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">TIPO DE SETOR</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setSetorForm({...setorForm, tipo: 'Torre'})}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${setorForm.tipo === 'Torre' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}
                  >
                    <Building2 size={24} />
                    <span className="font-bold">Torre</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSetorForm({...setorForm, tipo: 'Area Comum'})}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${setorForm.tipo === 'Area Comum' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}
                  >
                    <Layout size={24} />
                    <span className="font-bold">Área Comum</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">NOME DO SETOR</label>
                <input 
                  type="text" 
                  required
                  placeholder={setorForm.tipo === 'Torre' ? "Ex: Torre A, Torre B" : "Ex: Salão de Festas, Piscina"}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={setorForm.nome_setor}
                  onChange={e => setSetorForm({...setorForm, nome_setor: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">DESCRIÇÃO</label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={setorForm.descricao}
                  onChange={e => setSetorForm({...setorForm, descricao: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all font-medium shadow-lg shadow-emerald-500/20">
                  Salvar Setor
                </button>
              </div>
            </form>
          </div>
        )}

        {viewMode === 'view-setor' && selectedSetor && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Locais do Setor: {selectedSetor.nome_setor}</h2>
              <button 
                onClick={() => setViewMode('create-local')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-medium"
              >
                <Plus size={20} /> ADICIONAR LOCAL
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locais.map(local => (
                <div 
                  key={local.id}
                  onClick={() => {
                    setSelectedLocal(local);
                    fetchCategorias(local.id);
                    setViewMode('view-local');
                  }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${local.tipo === 'Individual' ? 'bg-purple-50 text-purple-600' : 'bg-teal-50 text-teal-600'}`}>
                      {local.tipo === 'Individual' ? <Box size={20} /> : <Layers size={20} />}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingLocal(local);
                          setLocalForm({
                            nome_local: local.nome_local,
                            tipo: local.tipo,
                            area_total: local.area_total?.toString() || '',
                            piso: local.piso || '',
                            parede: local.parede || '',
                            teto: local.teto || '',
                            esquadrias: local.esquadrias || '',
                            metais: local.metais || '',
                            loucas: local.loucas || '',
                            descricao: local.descricao || ''
                          });
                          setViewMode('create-local');
                        }}
                        className="p-1.5 text-slate-400 hover:text-emerald-500 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${local.tipo === 'Individual' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                        {local.tipo}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900">{local.nome_local}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'create-local' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => {
                setViewMode('view-setor');
                setEditingLocal(null);
                setLocalForm({
                  nome_local: '',
                  tipo: 'Individual',
                  area_total: '',
                  piso: '',
                  parede: '',
                  teto: '',
                  esquadrias: '',
                  metais: '',
                  loucas: '',
                  descricao: ''
                });
              }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-xl font-bold">{editingLocal ? 'EDITAR LOCAL' : 'ADICIONAR LOCAL'}</h2>
            </div>
            <form onSubmit={editingLocal ? handleUpdateLocal : handleCreateLocal} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">TIPO DE LOCAL</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setLocalForm({...localForm, tipo: 'Individual'})}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${localForm.tipo === 'Individual' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}
                  >
                    <Box size={24} />
                    <span className="font-bold">Individual</span>
                    <span className="text-xs text-center opacity-70">Ex: Pavimentos</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setLocalForm({...localForm, tipo: 'Comum'})}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${localForm.tipo === 'Comum' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}
                  >
                    <Layers size={24} />
                    <span className="font-bold">Comum</span>
                    <span className="text-xs text-center opacity-70">Ex: Fachada, Escada, Elevadores</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">NOME DO LOCAL</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Pavimento Tipo, Fachada Norte, Escadaria"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={localForm.nome_local}
                  onChange={e => setLocalForm({...localForm, nome_local: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ÁREA TOTAL (m²)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={localForm.area_total}
                    onChange={e => setLocalForm({...localForm, area_total: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">PISO</label>
                  <input 
                    type="text" 
                    placeholder="Tipo de acabamento do piso"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={localForm.piso}
                    onChange={e => setLocalForm({...localForm, piso: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">PAREDE</label>
                  <input 
                    type="text" 
                    placeholder="Tipo de acabamento da parede"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={localForm.parede}
                    onChange={e => setLocalForm({...localForm, parede: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">TETO</label>
                  <input 
                    type="text" 
                    placeholder="Tipo de acabamento do teto"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={localForm.teto}
                    onChange={e => setLocalForm({...localForm, teto: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ESQUADRIAS</label>
                  <input 
                    type="text" 
                    placeholder="Informações sobre esquadrias"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={localForm.esquadrias}
                    onChange={e => setLocalForm({...localForm, esquadrias: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">METAIS</label>
                  <input 
                    type="text" 
                    placeholder="Informações sobre metais"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={localForm.metais}
                    onChange={e => setLocalForm({...localForm, metais: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">LOUÇAS</label>
                  <input 
                    type="text" 
                    placeholder="Informações sobre louças"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={localForm.loucas}
                    onChange={e => setLocalForm({...localForm, loucas: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">DESCRIÇÃO / OBSERVAÇÕES</label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={localForm.descricao}
                  onChange={e => setLocalForm({...localForm, descricao: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all font-medium shadow-lg shadow-emerald-500/20">
                  Salvar Local
                </button>
              </div>
            </form>
          </div>
        )}

        {viewMode === 'view-local' && selectedLocal && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Layers size={20} className="text-teal-500" />
                  Detalhes do Local: {selectedLocal.nome_local}
                </h2>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${selectedLocal.tipo === 'Individual' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                  {selectedLocal.tipo}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Área Total</div>
                    <div className="text-slate-900 font-medium">{selectedLocal.area_total ? `${selectedLocal.area_total.toFixed(2)} m²` : '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Descrição</div>
                    <div className="text-slate-600 text-sm">{selectedLocal.descricao || 'Sem descrição'}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Acabamentos</div>
                  <div className="text-sm">
                    <span className="text-slate-500">Piso:</span> <span className="text-slate-900 font-medium">{selectedLocal.piso || '-'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500">Parede:</span> <span className="text-slate-900 font-medium">{selectedLocal.parede || '-'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500">Teto:</span> <span className="text-slate-900 font-medium">{selectedLocal.teto || '-'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Instalações</div>
                  <div className="text-sm">
                    <span className="text-slate-500">Esquadrias:</span> <span className="text-slate-900 font-medium">{selectedLocal.esquadrias || '-'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500">Metais:</span> <span className="text-slate-900 font-medium">{selectedLocal.metais || '-'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500">Louças:</span> <span className="text-slate-900 font-medium">{selectedLocal.loucas || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Categorias de {selectedLocal.nome_local}</h2>
              <button 
                onClick={() => setViewMode('create-categoria')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-medium"
              >
                <Plus size={20} /> NOVA CATEGORIA
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categorias.map(cat => (
                <div 
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategoria(cat);
                    fetchUnidades(cat.id);
                    setViewMode('view-categoria');
                  }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all cursor-pointer group shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                      <FolderDown size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900">{cat.nome_categoria}</h3>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'create-categoria' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setViewMode('view-local')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-xl font-bold">NOMEAR NOVA CATEGORIA</h2>
            </div>
            <form onSubmit={handleCreateCategoria} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">NOME DA CATEGORIA</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Apartamentos, Panos de Fachada, Áreas Técnicas"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={categoriaForm.nome_categoria}
                  onChange={e => setCategoriaForm({...categoriaForm, nome_categoria: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all font-medium shadow-lg shadow-emerald-500/20">
                  Criar Categoria
                </button>
              </div>
            </form>
          </div>
        )}

        {viewMode === 'view-categoria' && selectedCategoria && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Unidades em {selectedCategoria.nome_categoria}</h2>
              <button 
                onClick={() => setViewMode('create-unidade')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-medium"
              >
                <Plus size={20} /> ADICIONAR UNIDADE
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unidades.map(unidade => (
                <div 
                  key={unidade.id}
                  onClick={() => {
                    setSelectedUnidade(unidade);
                    fetchAmbientes(unidade.id);
                    setViewMode('view-unidade');
                  }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center">
                      <Square size={20} />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900">{unidade.nome_unidade}</h3>
                  <p className="text-slate-500 text-sm mt-1">{unidade.descricao || 'Sem observações'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'create-unidade' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setViewMode('view-categoria')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-xl font-bold">ADICIONAR UNIDADE</h2>
            </div>
            <form onSubmit={handleCreateUnidade} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">NOME DA UNIDADE</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Apto 101, Pano 01, Sala 05"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={unidadeForm.nome_unidade}
                  onChange={e => setUnidadeForm({...unidadeForm, nome_unidade: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">OBSERVAÇÕES</label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={unidadeForm.descricao}
                  onChange={e => setUnidadeForm({...unidadeForm, descricao: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all font-medium shadow-lg shadow-emerald-500/20">
                  Salvar Unidade
                </button>
              </div>
            </form>
          </div>
        )}

        {viewMode === 'view-unidade' && selectedUnidade && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Ambientes de {selectedUnidade.nome_unidade}</h2>
              <button 
                onClick={() => setViewMode('create-ambiente')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-medium"
              >
                <Plus size={20} /> ADICIONAR AMBIENTE
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase tracking-wider">Nome do Ambiente</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase tracking-wider">Área (m²)</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase tracking-wider">Acabamentos</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ambientes.map(amb => (
                    <tr key={amb.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{amb.nome_ambiente}</div>
                        {amb.descricao && <div className="text-xs text-slate-500 mt-0.5">{amb.descricao}</div>}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{amb.area_total ? `${amb.area_total.toFixed(2)} m²` : '-'}</td>
                      <td className="px-6 py-4">
                        <div className="text-xs space-y-1">
                          {amb.piso && <div><span className="text-slate-400 font-medium">Piso:</span> {amb.piso}</div>}
                          {amb.parede && <div><span className="text-slate-400 font-medium">Parede:</span> {amb.parede}</div>}
                          {amb.teto && <div><span className="text-slate-400 font-medium">Teto:</span> {amb.teto}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => {
                              setEditingAmbiente(amb);
                              setAmbienteForm({
                                nome_ambiente: amb.nome_ambiente,
                                tipo_ambiente_id: amb.tipo_ambiente_id.toString(),
                                area_total: amb.area_total?.toString() || '',
                                piso: amb.piso || '',
                                parede: amb.parede || '',
                                teto: amb.teto || '',
                                esquadrias: amb.esquadrias || '',
                                metais: amb.metais || '',
                                loucas: amb.loucas || '',
                                descricao: amb.descricao || ''
                              });
                              setViewMode('create-ambiente');
                            }}
                            className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {ambientes.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-6 py-12 text-center text-slate-500">Nenhum ambiente cadastrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === 'create-ambiente' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => {
                setViewMode('view-unidade');
                setEditingAmbiente(null);
                setAmbienteForm({
                  nome_ambiente: '',
                  tipo_ambiente_id: '',
                  area_total: '',
                  piso: '',
                  parede: '',
                  teto: '',
                  esquadrias: '',
                  metais: '',
                  loucas: '',
                  descricao: ''
                });
              }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-xl font-bold">{editingAmbiente ? 'EDITAR AMBIENTE' : 'ADICIONAR AMBIENTE'}</h2>
            </div>
            <form onSubmit={editingAmbiente ? handleUpdateAmbiente : handleCreateAmbiente} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">TIPO DE AMBIENTE</label>
                <select 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={ambienteForm.tipo_ambiente_id}
                  onChange={e => setAmbienteForm({...ambienteForm, tipo_ambiente_id: e.target.value})}
                >
                  <option value="">Selecione um tipo...</option>
                  {tiposAmbiente.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">NOME DO AMBIENTE</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Sala de Estar, Cozinha, Quarto 01"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={ambienteForm.nome_ambiente}
                  onChange={e => setAmbienteForm({...ambienteForm, nome_ambiente: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ÁREA TOTAL (m²)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={ambienteForm.area_total}
                    onChange={e => setAmbienteForm({...ambienteForm, area_total: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">PISO</label>
                  <input 
                    type="text" 
                    placeholder="Tipo de acabamento do piso"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={ambienteForm.piso}
                    onChange={e => setAmbienteForm({...ambienteForm, piso: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">PAREDE</label>
                  <input 
                    type="text" 
                    placeholder="Tipo de acabamento da parede"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={ambienteForm.parede}
                    onChange={e => setAmbienteForm({...ambienteForm, parede: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">TETO</label>
                  <input 
                    type="text" 
                    placeholder="Tipo de acabamento do teto"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={ambienteForm.teto}
                    onChange={e => setAmbienteForm({...ambienteForm, teto: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ESQUADRIAS</label>
                  <input 
                    type="text" 
                    placeholder="Informações sobre esquadrias"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={ambienteForm.esquadrias}
                    onChange={e => setAmbienteForm({...ambienteForm, esquadrias: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">METAIS</label>
                  <input 
                    type="text" 
                    placeholder="Informações sobre metais"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={ambienteForm.metais}
                    onChange={e => setAmbienteForm({...ambienteForm, metais: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">LOUÇAS</label>
                  <input 
                    type="text" 
                    placeholder="Informações sobre louças"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={ambienteForm.loucas}
                    onChange={e => setAmbienteForm({...ambienteForm, loucas: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">DESCRIÇÃO / OBSERVAÇÕES</label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={ambienteForm.descricao}
                  onChange={e => setAmbienteForm({...ambienteForm, descricao: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all font-medium shadow-lg shadow-emerald-500/20">
                  Salvar Ambiente
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
