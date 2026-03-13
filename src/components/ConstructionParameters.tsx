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
  Wrench,
  AlertTriangle,
  GitGraph,
  List
} from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Pagination } from './Pagination';

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
  area_teto?: number;
  area_parede?: number;
  descricao: string;
  piso?: string;
  parede?: string;
  teto?: string;
  esquadrias?: string;
  metais?: string;
  loucas?: string;
  nome_pavimento?: string;
  tem_portas: boolean;
  tem_janelas: boolean;
  tem_pontos_eletricos: boolean;
  tem_pontos_sanitarios: boolean;
  tem_pontos_hidraulicos: boolean;
  portas?: any[];
  janelas?: any[];
  pontos_eletricos?: any[];
  pontos_sanitarios?: any[];
  pontos_hidraulicos?: any[];
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
  const [totalSetores, setTotalSetores] = useState(0);
  const [currentSetorPage, setCurrentSetorPage] = useState(1);
  
  const [pavimentos, setPavimentos] = useState<Floor[]>([]);
  const [totalPavimentos, setTotalPavimentos] = useState(0);
  const [currentPavimentoPage, setCurrentPavimentoPage] = useState(1);

  const [ambientes, setAmbientes] = useState<Environment[]>([]);
  const [totalAmbientes, setTotalAmbientes] = useState(0);
  const [currentAmbientePage, setCurrentAmbientePage] = useState(1);

  const itemsPerPage = 20;
  const [activities, setActivities] = useState<any[]>([]);
  
  const [selectedSector, setSelectedSector] = useState<number | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedEnv, setSelectedEnv] = useState<number | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'sector' | 'floor' | 'env'>('sector');
  const [copySource, setCopySource] = useState<{ type: string, id: number, name: string } | null>(null);
  const [copyDestId, setCopyDestId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [expandedServiceId, setExpandedServiceId] = useState<number | null>(null);
  const [serviceMaterials, setServiceMaterials] = useState<Material[]>([]);
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<any>({});
  const [viewMode, setViewMode] = useState<'list' | 'flow'>('list');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (viewMode === 'flow') {
      generateFlowData();
    }
  }, [viewMode, setores, pavimentos, ambientes]);

  const generateFlowData = () => {
    const newNodes: any[] = [];
    const newEdges: any[] = [];
    let yOffset = 0;

    setores.forEach((sector, sIdx) => {
      const sectorId = `sector-${sector.id}`;
      newNodes.push({
        id: sectorId,
        data: { label: sector.nome_setor },
        position: { x: 0, y: sIdx * 300 },
        style: { background: '#6366f1', color: '#fff', borderRadius: '12px', padding: '10px', width: 150 },
      });

      // For simplicity in the flowchart, we'll only show children if they are loaded
      // In a real app, we might want to fetch all hierarchy for the flow view
      const sectorFloors = pavimentos.filter(p => p.setor_id === sector.id);
      sectorFloors.forEach((floor, fIdx) => {
        const floorId = `floor-${floor.id}`;
        newNodes.push({
          id: floorId,
          data: { label: floor.nome_pavimento },
          position: { x: 250, y: (sIdx * 300) + (fIdx * 100) },
          style: { background: '#10b981', color: '#fff', borderRadius: '12px', padding: '10px', width: 150 },
        });

        newEdges.push({
          id: `e-${sectorId}-${floorId}`,
          source: sectorId,
          target: floorId,
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed },
        });

        const floorEnvs = ambientes.filter(a => a.pavimento_id === floor.id);
        floorEnvs.forEach((env, eIdx) => {
          const envId = `env-${env.id}`;
          newNodes.push({
            id: envId,
            data: { label: env.nome_ambiente },
            position: { x: 500, y: (sIdx * 300) + (fIdx * 100) + (eIdx * 50) },
            style: { background: '#f59e0b', color: '#fff', borderRadius: '12px', padding: '10px', width: 150 },
          });

          newEdges.push({
            id: `e-${floorId}-${envId}`,
            source: floorId,
            target: envId,
            markerEnd: { type: MarkerType.ArrowClosed },
          });
        });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  useEffect(() => {
    fetchSetores(currentSetorPage);
    fetchActivities();
    fetchStockAlerts();
  }, [currentSetorPage]);

  useEffect(() => {
    if (selectedSector) fetchPavimentos(selectedSector, currentPavimentoPage);
    else {
      setPavimentos([]);
      setTotalPavimentos(0);
    }
  }, [selectedSector, currentPavimentoPage]);

  useEffect(() => {
    if (selectedFloor) fetchAmbientes(selectedFloor, currentAmbientePage);
    else {
      setAmbientes([]);
      setTotalAmbientes(0);
    }
  }, [selectedFloor, currentAmbientePage]);

  const fetchSetores = async (page: number) => {
    const res = await fetch(`/api/setores?page=${page}&limit=${itemsPerPage}`);
    const data = await res.json();
    setSetores(data.data);
    setTotalSetores(data.total);
  };

  const fetchPavimentos = async (sectorId: number, page: number) => {
    const res = await fetch(`/api/pavimentos?setor_id=${sectorId}&page=${page}&limit=${itemsPerPage}`);
    const data = await res.json();
    setPavimentos(data.data);
    setTotalPavimentos(data.total);
  };

  const fetchAmbientes = async (floorId: number, page: number) => {
    const res = await fetch(`/api/ambientes?pavimento_id=${floorId}&page=${page}&limit=${itemsPerPage}`);
    const data = await res.json();
    setAmbientes(data.data);
    setTotalAmbientes(data.total);
  };

  const fetchActivities = async () => {
    const res = await fetch('/api/atividades?limit=1000');
    const data = await res.json();
    setActivities(data.data || []);
  };

  const fetchStockAlerts = async () => {
    const res = await fetch('/api/estoque/alertas');
    setStockAlerts(await res.json());
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
      if (modalType === 'sector') fetchSetores(currentSetorPage);
      if (modalType === 'floor') fetchPavimentos(selectedSector!, currentPavimentoPage);
      if (modalType === 'env') fetchAmbientes(selectedFloor!, currentAmbientePage);
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
      if (copySource.type === 'sector') fetchPavimentos(copyDestId, 1);
      if (copySource.type === 'floor') fetchAmbientes(copyDestId, 1);
    }
  };

  const handleDelete = (type: string, id: number) => {
    const itemType = type === 'sector' ? 'Setor' : type === 'floor' ? 'Pavimento' : 'Ambiente';
    
    setConfirmConfig({
      title: `Excluir ${itemType}?`,
      message: `Tem certeza que deseja excluir este ${itemType.toLowerCase()}? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        let url = '';
        if (type === 'sector') url = `/api/setores/${id}`;
        if (type === 'floor') url = `/api/pavimentos/${id}`;
        if (type === 'env') url = `/api/ambientes/${id}`;

        try {
          const res = await fetch(url, {
            method: 'DELETE',
            headers: { 'x-user-role': 'admin' }
          });

          if (res.ok) {
            if (type === 'sector') { fetchSetores(currentSetorPage); setSelectedSector(null); }
            if (type === 'floor') { fetchPavimentos(selectedSector!, currentPavimentoPage); setSelectedFloor(null); }
            if (type === 'env') { fetchAmbientes(selectedFloor!, currentAmbientePage); setSelectedEnv(null); }
          } else {
            const err = await res.json();
            console.error(err.error || 'Erro ao excluir item');
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
    setIsConfirmOpen(true);
  };

  const openEdit = (type: any, item: any) => {
    setModalType(type);
    setEditingId(item.id);
    setFormData(item);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {stockAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="p-2 bg-red-100 text-red-600 rounded-xl">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-red-900">Alertas de Estoque</h4>
            <p className="text-sm text-red-700 mb-2">Os seguintes itens estão abaixo da quantidade mínima recomendada:</p>
            <div className="flex flex-wrap gap-2">
              {stockAlerts.map(alert => (
                <span key={alert.id} className="text-[10px] font-bold bg-white border border-red-200 text-red-600 px-2 py-1 rounded-lg uppercase">
                  {alert.descricao}: {alert.quantidade_atual} {alert.unidade_medida} (Mín: {alert.quantidade_minima})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Parâmetros Construtivos</h2>
          <p className="text-slate-500">Defina a estrutura física e serviços da obra</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center shadow-sm">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
              title="Visualização em Lista"
            >
              <List size={20} />
            </button>
            <button 
              onClick={() => setViewMode('flow')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'flow' ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
              title="Visualização em Fluxograma"
            >
              <GitGraph size={20} />
            </button>
          </div>
          <button 
            onClick={() => { setModalType('sector'); setEditingId(null); setFormData({}); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-bold shadow-lg shadow-emerald-500/20"
          >
            <Plus size={20} />
            Novo Setor
          </button>
        </div>
      </div>

      {viewMode === 'flow' ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm h-[600px] overflow-hidden relative">
          <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-800 text-sm mb-1">Legenda do Fluxo</h4>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Setor</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Pavimento</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Ambiente</span>
              </div>
            </div>
          </div>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
          <Pagination 
            currentPage={currentSetorPage}
            totalItems={totalSetores}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentSetorPage}
            compact
          />
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
          {selectedSector && (
            <Pagination 
              currentPage={currentPavimentoPage}
              totalItems={totalPavimentos}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPavimentoPage}
              compact
            />
          )}
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
            {selectedFloor && (
            <Pagination 
              currentPage={currentAmbientePage}
              totalItems={totalAmbientes}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentAmbientePage}
              compact
            />
          )}
        </div>
      </div>
    </div>
    )}

    {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold">
                {modalType === 'sector' && (editingId ? 'Editar Setor' : 'Novo Setor')}
                {modalType === 'floor' && (editingId ? 'Editar Pavimento' : 'Novo Pavimento')}
                {modalType === 'env' && (editingId ? 'Editar Ambiente' : 'Novo Ambiente')}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {modalType === 'env' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Localização</p>
                  <div className="flex gap-4 mt-1">
                    <p className="text-sm text-slate-700">Setor: <span className="font-bold">{setores.find(s => s.id == (formData.setor_id || selectedSector))?.nome_setor || '-'}</span></p>
                    <p className="text-sm text-slate-700">Pavimento: <span className="font-bold">{pavimentos.find(p => p.id == (formData.pavimento_id || selectedFloor))?.nome_pavimento || '-'}</span></p>
                  </div>
                </div>
              )}

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
                      <label className="text-sm font-semibold text-slate-700">Área de Piso (m²)</label>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Área de Teto (m²)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                        value={formData.area_teto || ''}
                        onChange={e => setFormData({ ...formData, area_teto: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Área de Alvenaria (m²)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                        value={formData.area_parede || ''}
                        onChange={e => setFormData({ ...formData, area_parede: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Especificações Técnicas</h4>
                    
                    <div className="space-y-4">
                      {/* Portas */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold text-slate-700">Portas?</label>
                          <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button 
                              type="button"
                              onClick={() => setFormData({...formData, tem_portas: true, portas: formData.portas || [{width: 0.8, height: 2.1, quantity: 1}]})}
                              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${formData.tem_portas ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                            >SIM</button>
                            <button 
                              type="button"
                              onClick={() => setFormData({...formData, tem_portas: false})}
                              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${!formData.tem_portas ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
                            >NÃO</button>
                          </div>
                        </div>
                        {formData.tem_portas && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                            {formData.portas?.map((door: any, idx: number) => (
                              <div key={idx} className="grid grid-cols-3 gap-2">
                                <input type="number" step="0.01" placeholder="Larg." className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg" value={door.width} onChange={e => {
                                  const newPortas = [...formData.portas];
                                  newPortas[idx].width = e.target.value;
                                  setFormData({...formData, portas: newPortas});
                                }} />
                                <input type="number" step="0.01" placeholder="Alt." className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg" value={door.height} onChange={e => {
                                  const newPortas = [...formData.portas];
                                  newPortas[idx].height = e.target.value;
                                  setFormData({...formData, portas: newPortas});
                                }} />
                                <input type="number" placeholder="Qtd." className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg" value={door.quantity} onChange={e => {
                                  const newPortas = [...formData.portas];
                                  newPortas[idx].quantity = e.target.value;
                                  setFormData({...formData, portas: newPortas});
                                }} />
                              </div>
                            ))}
                            <button type="button" onClick={() => setFormData({...formData, portas: [...(formData.portas || []), {width: 0.8, height: 2.1, quantity: 1}]})} className="text-[10px] font-bold text-emerald-600 hover:underline">+ Adicionar Porta</button>
                          </div>
                        )}
                      </div>

                      {/* Janelas */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold text-slate-700">Janelas?</label>
                          <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button 
                              type="button"
                              onClick={() => setFormData({...formData, tem_janelas: true, janelas: formData.janelas || [{width: 1.2, height: 1.0, peitoril: 1.1, quantity: 1}]})}
                              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${formData.tem_janelas ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                            >SIM</button>
                            <button 
                              type="button"
                              onClick={() => setFormData({...formData, tem_janelas: false})}
                              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${!formData.tem_janelas ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
                            >NÃO</button>
                          </div>
                        </div>
                        {formData.tem_janelas && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                            {formData.janelas?.map((win: any, idx: number) => (
                              <div key={idx} className="grid grid-cols-4 gap-2">
                                <input type="number" step="0.01" placeholder="Larg." className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg" value={win.width} onChange={e => {
                                  const newJanelas = [...formData.janelas];
                                  newJanelas[idx].width = e.target.value;
                                  setFormData({...formData, janelas: newJanelas});
                                }} />
                                <input type="number" step="0.01" placeholder="Alt." className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg" value={win.height} onChange={e => {
                                  const newJanelas = [...formData.janelas];
                                  newJanelas[idx].height = e.target.value;
                                  setFormData({...formData, janelas: newJanelas});
                                }} />
                                <input type="number" step="0.01" placeholder="Peit." className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg" value={win.peitoril} onChange={e => {
                                  const newJanelas = [...formData.janelas];
                                  newJanelas[idx].peitoril = e.target.value;
                                  setFormData({...formData, janelas: newJanelas});
                                }} />
                                <input type="number" placeholder="Qtd." className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg" value={win.quantity} onChange={e => {
                                  const newJanelas = [...formData.janelas];
                                  newJanelas[idx].quantity = e.target.value;
                                  setFormData({...formData, janelas: newJanelas});
                                }} />
                              </div>
                            ))}
                            <button type="button" onClick={() => setFormData({...formData, janelas: [...(formData.janelas || []), {width: 1.2, height: 1.0, peitoril: 1.1, quantity: 1}]})} className="text-[10px] font-bold text-emerald-600 hover:underline">+ Adicionar Janela</button>
                          </div>
                        )}
                      </div>

                      {/* Pontos Elétricos */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold text-slate-700">Pontos Elétricos?</label>
                          <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button 
                              type="button"
                              onClick={() => setFormData({...formData, tem_pontos_eletricos: true, pontos_eletricos: formData.pontos_eletricos || [{type: 'Tomada', quantity: 1}]})}
                              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${formData.tem_pontos_eletricos ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                            >SIM</button>
                            <button 
                              type="button"
                              onClick={() => setFormData({...formData, tem_pontos_eletricos: false})}
                              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${!formData.tem_pontos_eletricos ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
                            >NÃO</button>
                          </div>
                        </div>
                        {formData.tem_pontos_eletricos && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                            {formData.pontos_eletricos?.map((p: any, idx: number) => (
                              <div key={idx} className="grid grid-cols-2 gap-2">
                                <select className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg" value={p.type} onChange={e => {
                                  const newPoints = [...formData.pontos_eletricos];
                                  newPoints[idx].type = e.target.value;
                                  setFormData({...formData, pontos_eletricos: newPoints});
                                }}>
                                  <option value="Tomada">Tomada</option>
                                  <option value="Interruptor">Interruptor</option>
                                  <option value="Interruptor + Tomada">Interruptor + Tomada</option>
                                  <option value="Luminária">Luminária</option>
                                  <option value="Ar Condicionado">Ar Condicionado</option>
                                </select>
                                <input type="number" placeholder="Qtd." className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg" value={p.quantity} onChange={e => {
                                  const newPoints = [...formData.pontos_eletricos];
                                  newPoints[idx].quantity = e.target.value;
                                  setFormData({...formData, pontos_eletricos: newPoints});
                                }} />
                              </div>
                            ))}
                            <button type="button" onClick={() => setFormData({...formData, pontos_eletricos: [...(formData.pontos_eletricos || []), {type: 'Tomada', quantity: 1}]})} className="text-[10px] font-bold text-emerald-600 hover:underline">+ Adicionar Ponto</button>
                          </div>
                        )}
                      </div>

                      {/* Pontos Sanitários */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold text-slate-700">Pontos Sanitários?</label>
                          <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button 
                              type="button"
                              onClick={() => setFormData({...formData, tem_pontos_sanitarios: true, pontos_sanitarios: formData.pontos_sanitarios || [{type: 'Piso', quantity: 1}]})}
                              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${formData.tem_pontos_sanitarios ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                            >SIM</button>
                            <button 
                              type="button"
                              onClick={() => setFormData({...formData, tem_pontos_sanitarios: false})}
                              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${!formData.tem_pontos_sanitarios ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
                            >NÃO</button>
                          </div>
                        </div>
                        {formData.tem_pontos_sanitarios && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                            {formData.pontos_sanitarios?.map((p: any, idx: number) => (
                              <div key={idx} className="grid grid-cols-2 gap-2">
                                <select className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg" value={p.type} onChange={e => {
                                  const newPoints = [...formData.pontos_sanitarios];
                                  newPoints[idx].type = e.target.value;
                                  setFormData({...formData, pontos_sanitarios: newPoints});
                                }}>
                                  <option value="Piso">Piso</option>
                                  <option value="Parede">Parede</option>
                                </select>
                                <input type="number" placeholder="Qtd." className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg" value={p.quantity} onChange={e => {
                                  const newPoints = [...formData.pontos_sanitarios];
                                  newPoints[idx].quantity = e.target.value;
                                  setFormData({...formData, pontos_sanitarios: newPoints});
                                }} />
                              </div>
                            ))}
                            <button type="button" onClick={() => setFormData({...formData, pontos_sanitarios: [...(formData.pontos_sanitarios || []), {type: 'Piso', quantity: 1}]})} className="text-[10px] font-bold text-emerald-600 hover:underline">+ Adicionar Ponto</button>
                          </div>
                        )}
                      </div>

                      {/* Pontos Hidráulicos */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold text-slate-700">Pontos Hidráulicos?</label>
                          <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button 
                              type="button"
                              onClick={() => setFormData({...formData, tem_pontos_hidraulicos: true, pontos_hidraulicos: formData.pontos_hidraulicos || [{type: 'Parede', quantity: 1}]})}
                              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${formData.tem_pontos_hidraulicos ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                            >SIM</button>
                            <button 
                              type="button"
                              onClick={() => setFormData({...formData, tem_pontos_hidraulicos: false})}
                              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${!formData.tem_pontos_hidraulicos ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
                            >NÃO</button>
                          </div>
                        </div>
                        {formData.tem_pontos_hidraulicos && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                            {formData.pontos_hidraulicos?.map((p: any, idx: number) => (
                              <div key={idx} className="grid grid-cols-2 gap-2">
                                <select className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg" value={p.type} onChange={e => {
                                  const newPoints = [...formData.pontos_hidraulicos];
                                  newPoints[idx].type = e.target.value;
                                  setFormData({...formData, pontos_hidraulicos: newPoints});
                                }}>
                                  <option value="Parede">Parede</option>
                                  <option value="Piso">Piso</option>
                                </select>
                                <input type="number" placeholder="Qtd." className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg" value={p.quantity} onChange={e => {
                                  const newPoints = [...formData.pontos_hidraulicos];
                                  newPoints[idx].quantity = e.target.value;
                                  setFormData({...formData, pontos_hidraulicos: newPoints});
                                }} />
                              </div>
                            ))}
                            <button type="button" onClick={() => setFormData({...formData, pontos_hidraulicos: [...(formData.pontos_hidraulicos || []), {type: 'Parede', quantity: 1}]})} className="text-[10px] font-bold text-emerald-600 hover:underline">+ Adicionar Ponto</button>
                          </div>
                        )}
                      </div>
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

      <ConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
      />
    </div>
  );
}
