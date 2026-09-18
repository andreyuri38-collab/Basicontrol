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
  Copy,
  ArrowUp,
  ArrowDown,
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

interface Unidade {
  id: number;
  local_id?: number;
  name: string;
  descricao?: string;
  perimetroAlvenaria?: number;
  alturaAlvenaria?: number;
  areaAlvenaria?: number;
  descontosAlvenaria?: number;
  areaAlvenariaTotal?: number;
  areaPiso?: number;
  descontosPiso?: number;
  areaPisoTotal?: number;
  alturaContrapiso?: number;
  revestimentoPisoJson?: string;
  perimetroRevestimentoParede?: number;
  alturaRevestimentoParede?: number;
  areaRevestimentoParede?: number;
  descontosRevestimentoParede?: number;
  areaRevestimentoParedeTotal?: number;
  revestimentoParedeJson?: string;
  hasDoors?: boolean;
  doorsJson?: string;
  hasWindows?: boolean;
  windowsJson?: string;
  hasBancada?: boolean;
  bancadaJson?: string;
  hasDivisoria?: boolean;
  divisoriaJson?: string;
  hasSoleira?: boolean;
  soleiraJson?: string;
  hasDivbox?: boolean;
  divboxJson?: string;
  hasHidrossanitario?: boolean;
  hidrossanitarioJson?: string;
  hasEletrico?: boolean;
  eletricoJson?: string;
  hasComunicacao?: boolean;
  comunicacaoJson?: string;
  hasGuardaCorpo?: boolean;
  guardaCorpoQty?: number;
  hasArCondicionado?: boolean;
  arCondicionadoQty?: number;
}

type ViewMode = 'list-obras' | 'create-obra' | 'view-obra' | 'create-setor' | 'view-setor' | 'create-local' | 'view-local' | 'create-unidade';

const NumericInput = ({ 
  label, 
  value, 
  onChange, 
  unit, 
  placeholder = "0,00", 
  disabled = false,
  allowManual = false,
  isManual = false,
  onManualToggle = () => {}
}: { 
  label: string, 
  value: string, 
  onChange: (val: string) => void, 
  unit: string,
  placeholder?: string,
  disabled?: boolean,
  allowManual?: boolean,
  isManual?: boolean,
  onManualToggle?: (val: boolean) => void
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Only allow numbers and comma
    val = val.replace(/[^0-9,]/g, '');
    onChange(val);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">{label}</label>
        {allowManual && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={isManual} 
              onChange={e => onManualToggle(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manual</span>
          </label>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input 
            type="text"
            value={value}
            onChange={handleChange}
            disabled={disabled && !isManual}
            placeholder={placeholder}
            className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${disabled && !isManual ? 'bg-slate-50 text-slate-500' : 'bg-white'}`}
          />
        </div>
        <span className="font-bold text-slate-900 min-w-[2rem]">{unit}</span>
      </div>
    </div>
  );
};

export default function ConstructionParameters() {
  const [viewMode, setViewMode] = useState<ViewMode>('list-obras');
  const [obras, setObras] = useState<Obra[]>([]);
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [selectedSetor, setSelectedSetor] = useState<Setor | null>(null);
  const [locais, setLocais] = useState<Local[]>([]);
  const [selectedLocal, setSelectedLocal] = useState<Local | null>(null);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number, type: string, name: string } | null>(null);

  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [editingSetor, setEditingSetor] = useState<Setor | null>(null);
  const [editingLocal, setEditingLocal] = useState<Local | null>(null);
  const [editingUnidade, setEditingUnidade] = useState<Unidade | null>(null);

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
  const [unidadeForm, setUnidadeForm] = useState({ 
    name: '', 
    descricao: '',
    perimetroAlvenaria: '',
    alturaAlvenaria: '',
    areaAlvenaria: '',
    descontosAlvenaria: '',
    areaAlvenariaTotal: '',
    areaPiso: '',
    descontosPiso: '',
    areaPisoTotal: '',
    alturaContrapiso: '',
    revestimentoPisoJson: '[]',
    perimetroRevestimentoParede: '',
    alturaRevestimentoParede: '',
    areaRevestimentoParede: '',
    descontosRevestimentoParede: '',
    areaRevestimentoParedeTotal: '',
    revestimentoParedeJson: '[]',
    hasDoors: false,
    doorsJson: '[]',
    hasWindows: false,
    windowsJson: '[]',
    hasBancada: false,
    bancadaJson: '{}',
    hasDivisoria: false,
    divisoriaJson: '{}',
    hasSoleira: false,
    soleiraJson: '{}',
    hasDivbox: false,
    divboxJson: '{}',
    hasHidrossanitario: false,
    hidrossanitarioJson: JSON.stringify({
      vaso: { has: false, qty: 0 },
      pia: { has: false, qty: 0 },
      lavatorio: { has: false, qty: 0 },
      ralo: { has: false, qty: 0 },
      chuveiro: { has: false, qty: 0 },
      maquina: { has: false, qty: 0 },
      tanque: { has: false, qty: 0 }
    }),
    hasEletrico: false,
    eletricoJson: JSON.stringify({
      tomadas: { has: false, qty: 0, modules: [] },
      quadro: { has: false },
      luminarias: { has: false, qty: 0 }
    }),
    hasComunicacao: false,
    comunicacaoJson: JSON.stringify({
      campainha: { has: false, qty: 0 },
      internet: { has: false, qty: 0 },
      antena: { has: false, qty: 0 }
    }),
    hasGuardaCorpo: false,
    guardaCorpoQty: '',
    hasArCondicionado: false,
    arCondicionadoQty: ''
  });

  const [isManualAreaAlvenaria, setIsManualAreaAlvenaria] = useState(false);
  const [isManualAreaPiso, setIsManualAreaPiso] = useState(false);
  const [isManualAreaRevestimentoParede, setIsManualAreaRevestimentoParede] = useState(false);

  // Auto-calculations for Unidade
  useEffect(() => {
    const parseNum = (val: string | undefined) => parseFloat((val || '0').replace(',', '.')) || 0;
    const formatNum = (val: number) => val.toFixed(2).replace('.', ',');

    // Alvenaria
    if (!isManualAreaAlvenaria) {
      const perimetro = parseNum(unidadeForm.perimetroAlvenaria);
      const altura = parseNum(unidadeForm.alturaAlvenaria);
      const area = perimetro * altura;
      const descontos = parseNum(unidadeForm.descontosAlvenaria);
      const total = Math.max(0, area - descontos);
      
      setUnidadeForm(prev => ({
        ...prev,
        areaAlvenaria: formatNum(area),
        areaAlvenariaTotal: formatNum(total)
      }));
    }

    // Piso
    if (!isManualAreaPiso) {
      const area = parseNum(unidadeForm.areaPiso);
      const descontos = parseNum(unidadeForm.descontosPiso);
      const total = Math.max(0, area - descontos);
      
      setUnidadeForm(prev => ({
        ...prev,
        areaPisoTotal: formatNum(total)
      }));
    }

    // Revestimento Parede
    if (!isManualAreaRevestimentoParede) {
      const perimetro = parseNum(unidadeForm.perimetroRevestimentoParede);
      const altura = parseNum(unidadeForm.alturaRevestimentoParede);
      const area = perimetro * altura;
      const descontos = parseNum(unidadeForm.descontosRevestimentoParede);
      const total = Math.max(0, area - descontos);
      
      setUnidadeForm(prev => ({
        ...prev,
        areaRevestimentoParede: formatNum(area),
        areaRevestimentoParedeTotal: formatNum(total)
      }));
    }
  }, [
    unidadeForm.perimetroAlvenaria, 
    unidadeForm.alturaAlvenaria, 
    unidadeForm.descontosAlvenaria,
    unidadeForm.areaPiso,
    unidadeForm.descontosPiso,
    unidadeForm.perimetroRevestimentoParede,
    unidadeForm.alturaRevestimentoParede,
    unidadeForm.descontosRevestimentoParede,
    isManualAreaAlvenaria,
    isManualAreaPiso,
    isManualAreaRevestimentoParede
  ]);

  useEffect(() => {
    fetchObras();
  }, []);


  const fetchObras = async () => {
    try {
      const res = await fetch('/api/obras');
      const data = await res.json();
      if (res.ok) {
        setObras(Array.isArray(data.data) ? data.data : []);
      } else {
        console.error('Erro ao buscar obras:', data.error);
      }
    } catch (err) {
      console.error('Erro de conexão ao buscar obras');
    }
  };

  const fetchSetores = async (obraId: number) => {
    const res = await fetch(`/api/setores?obra_id=${obraId}`);
    const data = await res.json();
    setSetores(Array.isArray(data.data) ? data.data : []);
  };

  const fetchLocais = async (setorId: number) => {
    const res = await fetch(`/api/locais?setor_id=${setorId}`);
    const data = await res.json();
    setLocais(Array.isArray(data) ? data : []);
  };

  const fetchUnidades = async (localId: number) => {
    const res = await fetch(`/api/unidades?local_id=${localId}`);
    const data = await res.json();
    setUnidades(Array.isArray(data) ? data : []);
  };


  const handleCreateObra = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(editingObra ? `/api/obras/${editingObra.id}` : '/api/obras', {
        method: editingObra ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify(obraForm)
      });
      const data = await res.json();
      if (res.ok) {
        fetchObras();
        setViewMode('list-obras');
        setEditingObra(null);
        setObraForm({ nome_obra: '', descricao: '' });
      } else {
        setError(data.error || 'Erro ao salvar obra');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSetor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedObra) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(editingSetor ? `/api/setores/${editingSetor.id}` : '/api/setores', {
        method: editingSetor ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({ ...setorForm, obra_id: selectedObra.id })
      });
      const data = await res.json();
      if (res.ok) {
        fetchSetores(selectedObra.id);
        setViewMode('view-obra');
        setEditingSetor(null);
        setSetorForm({ nome_setor: '', tipo: 'Torre', descricao: '' });
      } else {
        setError(data.error || 'Erro ao salvar setor');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSetor) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/locais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({ 
          ...localForm, 
          setor_id: selectedSetor.id,
          area_total: localForm.area_total ? parseFloat(localForm.area_total) : null
        })
      });
      const data = await res.json();
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
      } else {
        setError(data.error || 'Erro ao criar local');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUnidade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocal) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(editingUnidade ? `/api/unidades/${editingUnidade.id}` : '/api/unidades', {
        method: editingUnidade ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({ ...unidadeForm, local_id: selectedLocal.id })
      });
      const data = await res.json();
      if (res.ok) {
        fetchUnidades(selectedLocal.id);
        setViewMode('view-local');
        setEditingUnidade(null);
        setUnidadeForm({ 
          name: '', 
          descricao: '',
          perimetroAlvenaria: '',
          alturaAlvenaria: '',
          areaAlvenaria: '',
          descontosAlvenaria: '',
          areaAlvenariaTotal: '',
          areaPiso: '',
          descontosPiso: '',
          areaPisoTotal: '',
          alturaContrapiso: '',
          revestimentoPisoJson: '[]',
          perimetroRevestimentoParede: '',
          alturaRevestimentoParede: '',
          areaRevestimentoParede: '',
          descontosRevestimentoParede: '',
          areaRevestimentoParedeTotal: '',
          revestimentoParedeJson: '[]',
          hasDoors: false,
          doorsJson: '[]',
          hasWindows: false,
          windowsJson: '[]',
          hasBancada: false,
          bancadaJson: '{}',
          hasDivisoria: false,
          divisoriaJson: '{}',
          hasSoleira: false,
          soleiraJson: '{}',
          hasDivbox: false,
          divboxJson: '{}',
          hasHidrossanitario: false,
          hidrossanitarioJson: JSON.stringify({
            vaso: { has: false, qty: 0 },
            pia: { has: false, qty: 0 },
            lavatorio: { has: false, qty: 0 },
            ralo: { has: false, qty: 0 },
            chuveiro: { has: false, qty: 0 },
            maquina: { has: false, qty: 0 },
            tanque: { has: false, qty: 0 }
          }),
          hasEletrico: false,
          eletricoJson: JSON.stringify({
            tomadas: { has: false, qty: 0, modules: [] },
            quadro: { has: false },
            luminarias: { has: false, qty: 0 }
          }),
          hasComunicacao: false,
          comunicacaoJson: JSON.stringify({
            campainha: { has: false, qty: 0 },
            internet: { has: false, qty: 0 },
            antena: { has: false, qty: 0 }
          }),
          hasGuardaCorpo: false,
          guardaCorpoQty: '',
          hasArCondicionado: false,
          arCondicionadoQty: ''
        });
      } else {
        setError(data.error || 'Erro ao salvar unidade');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
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


  const handleCopy = async (type: string, id: number) => {
    try {
      const res = await fetch(`/api/copy/${type}/${id}`, {
        method: 'POST',
        headers: { 'x-user-role': 'admin' }
      });
      if (res.ok) {
        if (type === 'obra') fetchObras();
        if (type === 'sector' && selectedObra) fetchSetores(selectedObra.id);
        if (type === 'local' && selectedSetor) fetchLocais(selectedSetor.id);
        if (type === 'unit' && selectedLocal) fetchUnidades(selectedLocal.id);
      }
    } catch (err) {
      console.error('Erro ao copiar item');
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(`/api/${itemToDelete.type === 'sector' ? 'setores' : itemToDelete.type === 'unit' ? 'unidades' : itemToDelete.type === 'local' ? 'locais' : 'obras'}/${itemToDelete.id}`, {
        method: 'DELETE',
        headers: { 'x-user-role': 'admin' }
      });
      if (res.ok) {
        if (itemToDelete.type === 'obra') fetchObras();
        if (itemToDelete.type === 'sector' && selectedObra) fetchSetores(selectedObra.id);
        if (itemToDelete.type === 'local' && selectedSetor) fetchLocais(selectedSetor.id);
        if (itemToDelete.type === 'unit' && selectedLocal) fetchUnidades(selectedLocal.id);
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
      }
    } catch (err) {
      console.error('Erro ao deletar item');
    }
  };

  const handleMove = async (type: string, id: number, direction: 'up' | 'down', items: any[]) => {
    const index = items.findIndex(item => item.id === id);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];

    const orders = newItems.map((item, i) => ({ id: item.id, ordem: i }));

    try {
      const res = await fetch(`/api/reorder/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({ orders })
      });
      if (res.ok) {
        if (type === 'obra') fetchObras();
        if (type === 'sector' && selectedObra) fetchSetores(selectedObra.id);
        if (type === 'local' && selectedSetor) fetchLocais(selectedSetor.id);
        if (type === 'unit' && selectedLocal) fetchUnidades(selectedLocal.id);
      }
    } catch (err) {
      console.error('Erro ao reordenar');
    }
  };

  const ActionButtons = ({ type, id, name, onEdit, items }: { type: string, id: number, name: string, onEdit: () => void, items: any[] }) => (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
      <button 
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
        title="Editar"
      >
        <Edit2 size={16} />
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); handleCopy(type, id); }}
        className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors"
        title="Copiar"
      >
        <Copy size={16} />
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); handleMove(type, id, 'up', items); }}
        className="p-1.5 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
        title="Mover para cima"
      >
        <ArrowUp size={16} />
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); handleMove(type, id, 'down', items); }}
        className="p-1.5 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
        title="Mover para baixo"
      >
        <ArrowDown size={16} />
      </button>
      <button 
        onClick={(e) => { 
          e.stopPropagation(); 
          setItemToDelete({ id, type, name });
          setIsDeleteModalOpen(true);
        }}
        className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
        title="Excluir"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

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
                  <ActionButtons 
                    type="obra" 
                    id={obra.id} 
                    name={obra.nome_obra} 
                    items={obras}
                    onEdit={() => {
                      setEditingObra(obra);
                      setObraForm({ nome_obra: obra.nome_obra, descricao: obra.descricao });
                      setViewMode('create-obra');
                    }} 
                  />
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
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}
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
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all font-medium shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Salvando...' : 'Salvar Obra'}
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
                    <ActionButtons 
                      type="sector" 
                      id={setor.id} 
                      name={setor.nome_setor} 
                      items={setores}
                      onEdit={() => {
                        setEditingSetor(setor);
                        setSetorForm({ nome_setor: setor.nome_setor, tipo: setor.tipo, descricao: setor.descricao });
                        setViewMode('create-setor');
                      }} 
                    />
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
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}
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
                <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all font-medium shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                  {loading ? 'Salvando...' : 'Salvar Setor'}
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
                    setViewMode('view-local');
                  }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${local.tipo === 'Individual' ? 'bg-purple-50 text-purple-600' : 'bg-teal-50 text-teal-600'}`}>
                      {local.tipo === 'Individual' ? <Box size={20} /> : <Layers size={20} />}
                    </div>
                    <ActionButtons 
                      type="local" 
                      id={local.id} 
                      name={local.nome_local} 
                      items={locais}
                      onEdit={() => {
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
                    />
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
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}
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
                <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all font-medium shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                  {loading ? 'Salvando...' : (editingLocal ? 'Atualizar Local' : 'Salvar Local')}
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
              <h2 className="text-xl font-bold text-slate-800">Unidades em {selectedLocal.nome_local}</h2>
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
                    setEditingUnidade(unidade);
                    setUnidadeForm({ 
                      name: unidade.name, 
                      descricao: unidade.descricao || '',
                      perimetroAlvenaria: unidade.perimetroAlvenaria?.toString() || '',
                      alturaAlvenaria: unidade.alturaAlvenaria?.toString() || '',
                      areaAlvenaria: unidade.areaAlvenaria?.toString() || '',
                      descontosAlvenaria: unidade.descontosAlvenaria?.toString() || '',
                      areaAlvenariaTotal: unidade.areaAlvenariaTotal?.toString() || '',
                      areaPiso: unidade.areaPiso?.toString() || '',
                      descontosPiso: unidade.descontosPiso?.toString() || '',
                      areaPisoTotal: unidade.areaPisoTotal?.toString() || '',
                      alturaContrapiso: unidade.alturaContrapiso?.toString() || '',
                      revestimentoPisoJson: unidade.revestimentoPisoJson || '[]',
                      perimetroRevestimentoParede: unidade.perimetroRevestimentoParede?.toString() || '',
                      alturaRevestimentoParede: unidade.alturaRevestimentoParede?.toString() || '',
                      areaRevestimentoParede: unidade.areaRevestimentoParede?.toString() || '',
                      descontosRevestimentoParede: unidade.descontosRevestimentoParede?.toString() || '',
                      areaRevestimentoParedeTotal: unidade.areaRevestimentoParedeTotal?.toString() || '',
                      revestimentoParedeJson: unidade.revestimentoParedeJson || '[]',
                      hasDoors: unidade.hasDoors || false,
                      doorsJson: unidade.doorsJson || '[]',
                      hasWindows: unidade.hasWindows || false,
                      windowsJson: unidade.windowsJson || '[]',
                      hasBancada: unidade.hasBancada || false,
                      bancadaJson: unidade.bancadaJson || '{}',
                      hasDivisoria: unidade.hasDivisoria || false,
                      divisoriaJson: unidade.divisoriaJson || '{}',
                      hasSoleira: unidade.hasSoleira || false,
                      soleiraJson: unidade.soleiraJson || '{}',
                      hasDivbox: unidade.hasDivbox || false,
                      divboxJson: unidade.divboxJson || '{}',
                      hasHidrossanitario: unidade.hasHidrossanitario || false,
                      hidrossanitarioJson: unidade.hidrossanitarioJson || JSON.stringify({
                        vaso: { has: false, qty: 0 },
                        pia: { has: false, qty: 0 },
                        lavatorio: { has: false, qty: 0 },
                        ralo: { has: false, qty: 0 },
                        chuveiro: { has: false, qty: 0 },
                        maquina: { has: false, qty: 0 },
                        tanque: { has: false, qty: 0 }
                      }),
                      hasEletrico: unidade.hasEletrico || false,
                      eletricoJson: unidade.eletricoJson || JSON.stringify({
                        tomadas: { has: false, qty: 0, modules: [] },
                        quadro: { has: false },
                        luminarias: { has: false, qty: 0 }
                      }),
                      hasComunicacao: unidade.hasComunicacao || false,
                      comunicacaoJson: unidade.comunicacaoJson || JSON.stringify({
                        campainha: { has: false, qty: 0 },
                        internet: { has: false, qty: 0 },
                        antena: { has: false, qty: 0 }
                      }),
                      hasGuardaCorpo: unidade.hasGuardaCorpo || false,
                      guardaCorpoQty: unidade.guardaCorpoQty?.toString() || '',
                      hasArCondicionado: unidade.hasArCondicionado || false,
                      arCondicionadoQty: unidade.arCondicionadoQty?.toString() || ''
                    });
                    setViewMode('create-unidade');
                  }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center">
                      <Square size={20} />
                    </div>
                    <ActionButtons 
                      type="unit" 
                      id={unidade.id} 
                      name={unidade.name} 
                      items={unidades}
                      onEdit={() => {
                        setEditingUnidade(unidade);
                        setUnidadeForm({ 
                          name: unidade.name, 
                          descricao: unidade.descricao || '',
                          perimetroAlvenaria: unidade.perimetroAlvenaria?.toString() || '',
                          alturaAlvenaria: unidade.alturaAlvenaria?.toString() || '',
                          areaAlvenaria: unidade.areaAlvenaria?.toString() || '',
                          descontosAlvenaria: unidade.descontosAlvenaria?.toString() || '',
                          areaAlvenariaTotal: unidade.areaAlvenariaTotal?.toString() || '',
                          areaPiso: unidade.areaPiso?.toString() || '',
                          descontosPiso: unidade.descontosPiso?.toString() || '',
                          areaPisoTotal: unidade.areaPisoTotal?.toString() || '',
                          alturaContrapiso: unidade.alturaContrapiso?.toString() || '',
                          revestimentoPisoJson: unidade.revestimentoPisoJson || '[]',
                          perimetroRevestimentoParede: unidade.perimetroRevestimentoParede?.toString() || '',
                          alturaRevestimentoParede: unidade.alturaRevestimentoParede?.toString() || '',
                          areaRevestimentoParede: unidade.areaRevestimentoParede?.toString() || '',
                          descontosRevestimentoParede: unidade.descontosRevestimentoParede?.toString() || '',
                          areaRevestimentoParedeTotal: unidade.areaRevestimentoParedeTotal?.toString() || '',
                          revestimentoParedeJson: unidade.revestimentoParedeJson || '[]',
                          hasDoors: unidade.hasDoors || false,
                          doorsJson: unidade.doorsJson || '[]',
                          hasWindows: unidade.hasWindows || false,
                          windowsJson: unidade.windowsJson || '[]',
                          hasBancada: unidade.hasBancada || false,
                          bancadaJson: unidade.bancadaJson || '{}',
                          hasDivisoria: unidade.hasDivisoria || false,
                          divisoriaJson: unidade.divisoriaJson || '{}',
                          hasSoleira: unidade.hasSoleira || false,
                          soleiraJson: unidade.soleiraJson || '{}',
                          hasDivbox: unidade.hasDivbox || false,
                          divboxJson: unidade.divboxJson || '{}',
                          hasHidrossanitario: unidade.hasHidrossanitario || false,
                          hidrossanitarioJson: unidade.hidrossanitarioJson || JSON.stringify({
                            vaso: { has: false, qty: 0 },
                            pia: { has: false, qty: 0 },
                            lavatorio: { has: false, qty: 0 },
                            ralo: { has: false, qty: 0 },
                            chuveiro: { has: false, qty: 0 },
                            maquina: { has: false, qty: 0 },
                            tanque: { has: false, qty: 0 }
                          }),
                          hasEletrico: unidade.hasEletrico || false,
                          eletricoJson: unidade.eletricoJson || JSON.stringify({
                            tomadas: { has: false, qty: 0, modules: [] },
                            quadro: { has: false },
                            luminarias: { has: false, qty: 0 }
                          }),
                          hasComunicacao: unidade.hasComunicacao || false,
                          comunicacaoJson: unidade.comunicacaoJson || JSON.stringify({
                            campainha: { has: false, qty: 0 },
                            internet: { has: false, qty: 0 },
                            antena: { has: false, qty: 0 }
                          }),
                          hasGuardaCorpo: unidade.hasGuardaCorpo || false,
                          guardaCorpoQty: unidade.guardaCorpoQty?.toString() || '',
                          hasArCondicionado: unidade.hasArCondicionado || false,
                          arCondicionadoQty: unidade.arCondicionadoQty?.toString() || ''
                        });
                        setViewMode('create-unidade');
                      }} 
                    />
                  </div>
                  <h3 className="font-bold text-slate-900">{unidade.name}</h3>
                </div>
              ))}
            </div>
          </div>
        )}


        {viewMode === 'create-unidade' && (
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => {
                setViewMode('view-local');
                setEditingUnidade(null);
                setUnidadeForm({
                  name: '',
                  descricao: '',
                  perimetroAlvenaria: '',
                  alturaAlvenaria: '',
                  areaAlvenaria: '',
                  descontosAlvenaria: '',
                  areaAlvenariaTotal: '',
                  areaPiso: '',
                  descontosPiso: '',
                  areaPisoTotal: '',
                  alturaContrapiso: '',
                  revestimentoPisoJson: '[]',
                  perimetroRevestimentoParede: '',
                  alturaRevestimentoParede: '',
                  areaRevestimentoParede: '',
                  descontosRevestimentoParede: '',
                  areaRevestimentoParedeTotal: '',
                  revestimentoParedeJson: '[]',
                  hasDoors: false,
                  doorsJson: '[]',
                  hasWindows: false,
                  windowsJson: '[]',
                  hasBancada: false,
                  bancadaJson: '{}',
                  hasDivisoria: false,
                  divisoriaJson: '{}',
                  hasSoleira: false,
                  soleiraJson: '{}',
                  hasDivbox: false,
                  divboxJson: '{}',
                  hasHidrossanitario: false,
                  hidrossanitarioJson: JSON.stringify({
                    vaso: { has: false, qty: 0 },
                    pia: { has: false, qty: 0 },
                    lavatorio: { has: false, qty: 0 },
                    ralo: { has: false, qty: 0 },
                    chuveiro: { has: false, qty: 0 },
                    maquina: { has: false, qty: 0 },
                    tanque: { has: false, qty: 0 }
                  }),
                  hasEletrico: false,
                  eletricoJson: JSON.stringify({
                    tomadas: { has: false, qty: 0, modules: [] },
                    quadro: { has: false },
                    luminarias: { has: false, qty: 0 }
                  }),
                  hasComunicacao: false,
                  comunicacaoJson: JSON.stringify({
                    campainha: { has: false, qty: 0 },
                    internet: { has: false, qty: 0 },
                    antena: { has: false, qty: 0 }
                  }),
                  hasGuardaCorpo: false,
                  guardaCorpoQty: '',
                  hasArCondicionado: false,
                  arCondicionadoQty: ''
                });
              }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-xl font-bold">{editingUnidade ? 'EDITAR UNIDADE' : 'ADICIONAR UNIDADE'}</h2>
            </div>

            <form onSubmit={handleCreateUnidade} className="space-y-10">
              {/* Informações Básicas */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">INFORMAÇÕES BÁSICAS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">NOME DA UNIDADE</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Apto 101, Pano 01, Sala 05"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={unidadeForm.name}
                      onChange={e => setUnidadeForm({...unidadeForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">DESCRIÇÃO</label>
                    <input 
                      type="text" 
                      placeholder="Opcional"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={unidadeForm.descricao}
                      onChange={e => setUnidadeForm({...unidadeForm, descricao: e.target.value})}
                    />
                  </div>
                </div>
              </section>

              {/* Alvenaria */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">ALVENARIA</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <NumericInput 
                    label="PERÍMETRO DA ALVENARIA" 
                    value={unidadeForm.perimetroAlvenaria} 
                    onChange={val => setUnidadeForm({...unidadeForm, perimetroAlvenaria: val})} 
                    unit="m" 
                  />
                  <NumericInput 
                    label="ALTURA DA ALVENARIA" 
                    value={unidadeForm.alturaAlvenaria} 
                    onChange={val => setUnidadeForm({...unidadeForm, alturaAlvenaria: val})} 
                    unit="m" 
                  />
                  <NumericInput 
                    label="ÁREA DA ALVENARIA" 
                    value={unidadeForm.areaAlvenaria} 
                    onChange={val => setUnidadeForm({...unidadeForm, areaAlvenaria: val})} 
                    unit="m²" 
                    disabled
                  />
                  <NumericInput 
                    label="DESCONTOS DA ALVENARIA" 
                    value={unidadeForm.descontosAlvenaria} 
                    onChange={val => setUnidadeForm({...unidadeForm, descontosAlvenaria: val})} 
                    unit="m²" 
                  />
                  <NumericInput 
                    label="ÁREA DA ALVENARIA TOTAL" 
                    value={unidadeForm.areaAlvenariaTotal} 
                    onChange={val => setUnidadeForm({...unidadeForm, areaAlvenariaTotal: val})} 
                    unit="m²" 
                    allowManual
                    isManual={isManualAreaAlvenaria}
                    onManualToggle={setIsManualAreaAlvenaria}
                  />
                </div>
              </section>

              {/* Piso */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">PISO</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <NumericInput 
                    label="ÁREA DO PISO" 
                    value={unidadeForm.areaPiso} 
                    onChange={val => setUnidadeForm({...unidadeForm, areaPiso: val})} 
                    unit="m²" 
                  />
                  <NumericInput 
                    label="DESCONTOS DO PISO" 
                    value={unidadeForm.descontosPiso} 
                    onChange={val => setUnidadeForm({...unidadeForm, descontosPiso: val})} 
                    unit="m²" 
                  />
                  <NumericInput 
                    label="ÁREA DO PISO TOTAL" 
                    value={unidadeForm.areaPisoTotal} 
                    onChange={val => setUnidadeForm({...unidadeForm, areaPisoTotal: val})} 
                    unit="m²" 
                    allowManual
                    isManual={isManualAreaPiso}
                    onManualToggle={setIsManualAreaPiso}
                  />
                  <NumericInput 
                    label="ALTURA DO CONTRAPISO" 
                    value={unidadeForm.alturaContrapiso} 
                    onChange={val => setUnidadeForm({...unidadeForm, alturaContrapiso: val})} 
                    unit="m" 
                  />
                </div>
                {/* Revestimento de Piso (JSON) - Simplified for now */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500 italic">Acabamentos de piso podem ser detalhados aqui (Funcionalidade em desenvolvimento)</p>
                </div>
              </section>

              {/* Revestimento de Parede */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">REVESTIMENTO DE PAREDE</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <NumericInput 
                    label="PERÍMETRO" 
                    value={unidadeForm.perimetroRevestimentoParede} 
                    onChange={val => setUnidadeForm({...unidadeForm, perimetroRevestimentoParede: val})} 
                    unit="m" 
                  />
                  <NumericInput 
                    label="ALTURA" 
                    value={unidadeForm.alturaRevestimentoParede} 
                    onChange={val => setUnidadeForm({...unidadeForm, alturaRevestimentoParede: val})} 
                    unit="m" 
                  />
                  <NumericInput 
                    label="ÁREA" 
                    value={unidadeForm.areaRevestimentoParede} 
                    onChange={val => setUnidadeForm({...unidadeForm, areaRevestimentoParede: val})} 
                    unit="m²" 
                    disabled
                  />
                  <NumericInput 
                    label="DESCONTOS" 
                    value={unidadeForm.descontosRevestimentoParede} 
                    onChange={val => setUnidadeForm({...unidadeForm, descontosRevestimentoParede: val})} 
                    unit="m²" 
                  />
                  <NumericInput 
                    label="ÁREA TOTAL" 
                    value={unidadeForm.areaRevestimentoParedeTotal} 
                    onChange={val => setUnidadeForm({...unidadeForm, areaRevestimentoParedeTotal: val})} 
                    unit="m²" 
                    allowManual
                    isManual={isManualAreaRevestimentoParede}
                    onManualToggle={setIsManualAreaRevestimentoParede}
                  />
                </div>
              </section>

              {/* Portas e Janelas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <section className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-bold text-slate-800 uppercase">Portas</h3>
                    <input 
                      type="checkbox" 
                      checked={unidadeForm.hasDoors} 
                      onChange={e => setUnidadeForm({...unidadeForm, hasDoors: e.target.checked})}
                      className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500"
                    />
                  </div>
                  {unidadeForm.hasDoors && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500 italic">Detalhes das portas (Funcionalidade em desenvolvimento)</p>
                    </div>
                  )}
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-bold text-slate-800 uppercase">Janelas</h3>
                    <input 
                      type="checkbox" 
                      checked={unidadeForm.hasWindows} 
                      onChange={e => setUnidadeForm({...unidadeForm, hasWindows: e.target.checked})}
                      className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500"
                    />
                  </div>
                  {unidadeForm.hasWindows && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500 italic">Detalhes das janelas (Funcionalidade em desenvolvimento)</p>
                    </div>
                  )}
                </section>
              </div>

              {/* Granito */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">GRANITO</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={unidadeForm.hasBancada} onChange={e => setUnidadeForm({...unidadeForm, hasBancada: e.target.checked})} />
                    <span className="text-sm font-medium">Bancada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={unidadeForm.hasDivisoria} onChange={e => setUnidadeForm({...unidadeForm, hasDivisoria: e.target.checked})} />
                    <span className="text-sm font-medium">Divisória</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={unidadeForm.hasSoleira} onChange={e => setUnidadeForm({...unidadeForm, hasSoleira: e.target.checked})} />
                    <span className="text-sm font-medium">Soleira</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={unidadeForm.hasDivbox} onChange={e => setUnidadeForm({...unidadeForm, hasDivbox: e.target.checked})} />
                    <span className="text-sm font-medium">Div. Box</span>
                  </div>
                </div>
              </section>

              {/* Instalações */}
              <section className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">INSTALAÇÕES</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Hidrossanitárias</h4>
                    <input type="checkbox" checked={unidadeForm.hasHidrossanitario} onChange={e => setUnidadeForm({...unidadeForm, hasHidrossanitario: e.target.checked})} className="w-4 h-4" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Elétricas</h4>
                    <input type="checkbox" checked={unidadeForm.hasEletrico} onChange={e => setUnidadeForm({...unidadeForm, hasEletrico: e.target.checked})} className="w-4 h-4" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Comunicação</h4>
                    <input type="checkbox" checked={unidadeForm.hasComunicacao} onChange={e => setUnidadeForm({...unidadeForm, hasComunicacao: e.target.checked})} className="w-4 h-4" />
                  </div>
                </div>
              </section>

              {/* Outros */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <section className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-bold text-slate-800 uppercase">Guarda Corpo</h3>
                    <input type="checkbox" checked={unidadeForm.hasGuardaCorpo} onChange={e => setUnidadeForm({...unidadeForm, hasGuardaCorpo: e.target.checked})} className="w-5 h-5" />
                  </div>
                  {unidadeForm.hasGuardaCorpo && (
                    <NumericInput label="Quantidade" value={unidadeForm.guardaCorpoQty} onChange={val => setUnidadeForm({...unidadeForm, guardaCorpoQty: val})} unit="un" />
                  )}
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-bold text-slate-800 uppercase">Ar Condicionado</h3>
                    <input type="checkbox" checked={unidadeForm.hasArCondicionado} onChange={e => setUnidadeForm({...unidadeForm, hasArCondicionado: e.target.checked})} className="w-5 h-5" />
                  </div>
                  {unidadeForm.hasArCondicionado && (
                    <NumericInput label="Quantidade" value={unidadeForm.arCondicionadoQty} onChange={val => setUnidadeForm({...unidadeForm, arCondicionadoQty: val})} unit="un" />
                  )}
                </section>
              </div>

              <div className="flex justify-end gap-3 pt-8 border-t">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-8 py-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : (editingUnidade ? 'Atualizar Unidade' : 'Salvar Unidade')}
                </button>
              </div>
            </form>
          </div>
        )}


      </div>

      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-6 text-red-600">
              <div className="p-3 bg-red-50 rounded-xl">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Confirmar Exclusão</h3>
                <p className="text-sm text-slate-500">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            
            <p className="text-slate-600 mb-8">
              Tem certeza que deseja excluir <strong>{itemToDelete.name}</strong>? 
              Todos os itens vinculados a este também serão removidos.
            </p>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="px-6 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
              >
                Excluir Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
