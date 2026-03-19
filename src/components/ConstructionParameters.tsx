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
  X,
  PieChart,
  Copy,
  Package,
  Wrench,
  AlertTriangle,
  GitGraph,
  List,
  Upload,
  Download,
  SortAsc,
  SortDesc,
  GripVertical,
  MoveHorizontal,
  Bed,
  Bath,
  Coffee,
  Utensils,
  Tv,
  Briefcase,
  Warehouse,
  Car,
  Trees,
  Wind,
  Zap,
  Droplets,
  Box,
  DoorOpen,
  Square
} from 'lucide-react';

const IconList = {
  Home, Bed, Bath, Coffee, Utensils, Tv, Briefcase, Warehouse, Car, Trees, Wind, Zap, Droplets, Box, DoorOpen, Square
};
import * as XLSX from 'xlsx';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import dagre from 'dagre';
import '@xyflow/react/dist/style.css';
import { Pagination } from './Pagination';
import { MultiSelect } from './MultiSelect';

interface Sector {
  id: number;
  nome_setor: string;
  descricao: string;
}

interface TipoAmbiente {
  id: number;
  nome: string;
  descricao: string;
  icone?: string;
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
  const [allActivities, setAllActivities] = useState<{ id: number, name: string }[]>([]);

  const itemsPerPage = 20;
  const [activities, setActivities] = useState<any[]>([]);
  
  const [selectedSector, setSelectedSector] = useState<number | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedEnv, setSelectedEnv] = useState<number | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'sector' | 'floor' | 'env'>('sector');
  const [copySource, setCopySource] = useState<{ type: string, id: number, name: string } | null>(null);
  const [transferItem, setTransferItem] = useState<{ type: 'floor' | 'env', id: number, name: string, currentParentId: number } | null>(null);
  const [copyDestId, setCopyDestId] = useState<number | null>(null);
  const [transferTargetId, setTransferTargetId] = useState<number | null>(null);
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
  const [allHierarchy, setAllHierarchy] = useState<{setores: Sector[], pavimentos: Floor[], ambientes: Environment[]}>({
    setores: [],
    pavimentos: [],
    ambientes: []
  });
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedSectorName, setSelectedSectorName] = useState<string>('');
  const [selectedFloorName, setSelectedFloorName] = useState<string>('');
  const [selectedEnvName, setSelectedEnvName] = useState<string>('');
  const [tiposAmbiente, setTiposAmbiente] = useState<TipoAmbiente[]>([]);
  const [isTipoModalOpen, setIsTipoModalOpen] = useState(false);
  const [editingTipoId, setEditingTipoId] = useState<number | null>(null);
  const [tipoFormData, setTipoFormData] = useState({ nome: '', descricao: '', icone: 'Home' });
  const [importLoading, setImportLoading] = useState(false);

  const [sectorSort, setSectorSort] = useState<{ field: string, order: 'ASC' | 'DESC' }>({ field: 'ordem', order: 'ASC' });
  const [floorSort, setFloorSort] = useState<{ field: string, order: 'ASC' | 'DESC' }>({ field: 'ordem', order: 'ASC' });
  const [envSort, setEnvSort] = useState<{ field: string, order: 'ASC' | 'DESC' }>({ field: 'ordem', order: 'ASC' });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onLayout = (direction = 'LR', layoutNodes?: any[], layoutEdges?: any[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 100 });

    const targetNodes = layoutNodes || nodes;
    const targetEdges = layoutEdges || edges;

    if (targetNodes.length === 0) return;

    targetNodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 180, height: 50 });
    });

    targetEdges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = targetNodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        targetPosition: isHorizontal ? 'left' : 'top',
        sourcePosition: isHorizontal ? 'right' : 'bottom',
        position: {
          x: nodeWithPosition.x - 90,
          y: nodeWithPosition.y - 25,
        },
      };
    });

    setNodes(newNodes);
  };

  const [alvenariaCalc, setAlvenariaCalc] = useState({
    enabled: false,
    perimetro: 0,
    altura: 0,
    descontos: 0
  });

  useEffect(() => {
    if (alvenariaCalc.enabled) {
      const result = (Number(alvenariaCalc.perimetro) * Number(alvenariaCalc.altura)) - Number(alvenariaCalc.descontos);
      setFormData((prev: any) => ({ ...prev, area_parede: result > 0 ? result.toFixed(2) : 0 }));
    }
  }, [alvenariaCalc]);

  useEffect(() => {
    if (selectedSector) {
      fetch(`/api/setores/${selectedSector}`)
        .then(res => res.json())
        .then(data => setSelectedSectorName(data.nome_setor))
        .catch(() => setSelectedSectorName('Setor Selecionado'));
    } else {
      setSelectedSectorName('');
    }
  }, [selectedSector]);

  useEffect(() => {
    if (selectedFloor) {
      fetch(`/api/pavimentos/${selectedFloor}`)
        .then(res => res.json())
        .then(data => setSelectedFloorName(data.nome_pavimento))
        .catch(() => setSelectedFloorName('Pavimento Selecionado'));
    } else {
      setSelectedFloorName('');
    }
  }, [selectedFloor]);

  useEffect(() => {
    if (selectedEnv) {
      fetch(`/api/ambientes/${selectedEnv}`)
        .then(res => res.json())
        .then(data => setSelectedEnvName(data.nome_ambiente))
        .catch(() => setSelectedEnvName('Ambiente Selecionado'));
    } else {
      setSelectedEnvName('');
    }
  }, [selectedEnv]);

  useEffect(() => {
    if (viewMode === 'flow') {
      fetchFullHierarchy();
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === 'flow') {
      generateFlowData();
    }
  }, [viewMode, allHierarchy]);

  useEffect(() => {
    if (isTransferModalOpen) {
      fetchFullHierarchy();
    }
  }, [isTransferModalOpen]);

  const fetchFullHierarchy = async () => {
    try {
      const [sRes, pRes, aRes] = await Promise.all([
        fetch('/api/setores?limit=1000'),
        fetch('/api/pavimentos?limit=1000'),
        fetch('/api/ambientes?limit=1000')
      ]);
      const sData = await sRes.json();
      const pData = await pRes.json();
      const aData = await aRes.json();
      
      setAllHierarchy({
        setores: sData.data || [],
        pavimentos: pData.data || [],
        ambientes: aData.data || []
      });
    } catch (error) {
      console.error('Error fetching full hierarchy:', error);
    }
  };

  const generateFlowData = () => {
    const newNodes: any[] = [];
    const newEdges: any[] = [];
    
    const { setores: allS, pavimentos: allP, ambientes: allA } = allHierarchy;

    allS.forEach((sector, sIdx) => {
      const sectorId = `sector-${sector.id}`;
      newNodes.push({
        id: sectorId,
        data: { label: sector.nome_setor },
        position: { x: 0, y: sIdx * 300 },
        style: { background: '#6366f1', color: '#fff', borderRadius: '12px', padding: '10px', width: 180, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
      });

      const sectorFloors = allP.filter(p => p.setor_id === sector.id);
      sectorFloors.forEach((floor, fIdx) => {
        const floorId = `floor-${floor.id}`;
        newNodes.push({
          id: floorId,
          data: { label: floor.nome_pavimento },
          position: { x: 250, y: (sIdx * 300) + (fIdx * 100) },
          style: { background: '#10b981', color: '#fff', borderRadius: '12px', padding: '10px', width: 180, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
        });

        newEdges.push({
          id: `e-${sectorId}-${floorId}`,
          source: sectorId,
          target: floorId,
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed },
        });

        const floorEnvs = allA.filter(a => a.pavimento_id === floor.id);
        floorEnvs.forEach((env, eIdx) => {
          const envId = `env-${env.id}`;
          newNodes.push({
            id: envId,
            data: { label: env.nome_ambiente },
            position: { x: 500, y: (sIdx * 300) + (fIdx * 100) + (eIdx * 50) },
            style: { background: '#f59e0b', color: '#fff', borderRadius: '12px', padding: '10px', width: 180, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
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
    
    // Apply layout immediately with the new data
    onLayout('LR', newNodes, newEdges);
  };

  const onNodeClick = (_: any, node: any) => {
    const [type, id] = node.id.split('-');
    const numericId = parseInt(id);
    
    if (type === 'sector') {
      setSelectedSector(numericId);
      setSelectedFloor(null);
      setSelectedEnv(null);
      setViewMode('list');
    } else if (type === 'floor') {
      const floor = allHierarchy.pavimentos.find(p => p.id === numericId);
      if (floor) {
        setSelectedSector(floor.setor_id);
        setSelectedFloor(numericId);
        setSelectedEnv(null);
        setViewMode('list');
      }
    } else if (type === 'env') {
      const env = allHierarchy.ambientes.find(a => a.id === numericId);
      if (env) {
        setSelectedSector(env.setor_id);
        setSelectedFloor(env.pavimento_id);
        setSelectedEnv(numericId);
        setViewMode('list');
      }
    }
  };

  useEffect(() => {
    fetchSetores(currentSetorPage);
    fetchActivities();
    fetchAtividades();
    fetchStockAlerts();
    fetchTiposAmbiente();
  }, [currentSetorPage, sectorSort]);

  const fetchTiposAmbiente = async () => {
    try {
      const res = await fetch('/api/tipos-ambiente');
      const data = await res.json();
      setTiposAmbiente(data);
    } catch (error) {
      console.error('Error fetching types:', error);
    }
  };

  useEffect(() => {
    if (selectedSector) fetchPavimentos(selectedSector, currentPavimentoPage);
    else {
      setPavimentos([]);
      setTotalPavimentos(0);
    }
  }, [selectedSector, currentPavimentoPage, floorSort]);

  useEffect(() => {
    if (selectedFloor) fetchAmbientes(selectedFloor, currentAmbientePage);
    else {
      setAmbientes([]);
      setTotalAmbientes(0);
    }
  }, [selectedFloor, currentAmbientePage, envSort]);

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/all-parametros-servico-itens');
      const data = await res.json();
      setAllActivities(data.map((a: any) => ({ id: a.id, name: a.nome })) || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchSetores = async (page: number) => {
    const res = await fetch(`/api/setores?page=${page}&limit=${itemsPerPage}&sortField=${sectorSort.field}&sortOrder=${sectorSort.order}`);
    const data = await res.json();
    setSetores(data.data);
    setTotalSetores(data.total);
  };

  const fetchPavimentos = async (sectorId: number, page: number) => {
    const res = await fetch(`/api/pavimentos?setor_id=${sectorId}&page=${page}&limit=${itemsPerPage}&sortField=${floorSort.field}&sortOrder=${floorSort.order}`);
    const data = await res.json();
    setPavimentos(data.data);
    setTotalPavimentos(data.total);
  };

  const fetchAmbientes = async (floorId: number, page: number) => {
    const res = await fetch(`/api/ambientes?pavimento_id=${floorId}&page=${page}&limit=${itemsPerPage}&sortField=${envSort.field}&sortOrder=${envSort.order}`);
    const data = await res.json();
    setAmbientes(data.data);
    setTotalAmbientes(data.total);
  };

  const handleDragEnd = async (event: DragEndEvent, type: 'sector' | 'floor' | 'env') => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    let items: any[] = [];
    let setItems: React.Dispatch<React.SetStateAction<any[]>> = () => {};
    
    if (type === 'sector') { items = setores; setItems = setSetores; }
    else if (type === 'floor') { items = pavimentos; setItems = setPavimentos; }
    else if (type === 'env') { items = ambientes; setItems = setAmbientes; }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);

    // Save new order to backend
    const orders = newItems.map((item, index) => ({ id: item.id, ordem: index }));
    try {
      await fetch(`/api/reorder/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
        body: JSON.stringify({ orders })
      });
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const toggleSort = (type: 'sector' | 'floor' | 'env') => {
    if (type === 'sector') {
      setSectorSort(prev => ({
        field: prev.field === 'ordem' ? 'nome_setor' : 'ordem',
        order: prev.order === 'ASC' ? 'DESC' : 'ASC'
      }));
    } else if (type === 'floor') {
      setFloorSort(prev => ({
        field: prev.field === 'ordem' ? 'nome_pavimento' : 'ordem',
        order: prev.order === 'ASC' ? 'DESC' : 'ASC'
      }));
    } else if (type === 'env') {
      setEnvSort(prev => ({
        field: prev.field === 'ordem' ? 'nome_ambiente' : 'ordem',
        order: prev.order === 'ASC' ? 'DESC' : 'ASC'
      }));
    }
  };

  const SortableItem = ({ id, children, className }: { id: number, children: React.ReactNode, className?: string }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 10 : 1,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style} className={`${className} relative group`}>
        <div {...attributes} {...listeners} className="absolute left-1 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <GripVertical size={14} />
        </div>
        {children}
      </div>
    );
  };

  const fetchAtividades = async () => {
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

  const handleTransfer = async () => {
    if (!transferItem || !transferTargetId) return;

    try {
      let url = '';
      let body: any = {};

      if (transferItem.type === 'floor') {
        url = `/api/pavimentos/${transferItem.id}`;
        const res = await fetch(`/api/pavimentos/${transferItem.id}`);
        const floorData = await res.json();
        body = { ...floorData, setor_id: transferTargetId };
      } else if (transferItem.type === 'env') {
        url = `/api/ambientes/${transferItem.id}`;
        const res = await fetch(`/api/ambientes/${transferItem.id}`);
        const envData = await res.json();
        
        const targetFloor = allHierarchy.pavimentos.find(p => p.id === transferTargetId);
        if (!targetFloor) throw new Error("Pavimento de destino não encontrado");
        
        body = { ...envData, pavimento_id: transferTargetId, setor_id: targetFloor.setor_id };
      }

      const res = await fetch(url, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': 'admin'
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setIsTransferModalOpen(false);
        setTransferItem(null);
        setTransferTargetId(null);
        
        fetchSetores(currentSetorPage);
        if (selectedSector) fetchPavimentos(selectedSector, currentPavimentoPage);
        if (selectedFloor) fetchAmbientes(selectedFloor, currentAmbientePage);
        fetchFullHierarchy();
      }
    } catch (error) {
      console.error('Error transferring item:', error);
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

  const openEdit = async (type: any, item: any) => {
    setModalType(type);
    setEditingId(item.id);
    
    if (type === 'env') {
      setAlvenariaCalc({ enabled: false, perimetro: 0, altura: 0, descontos: 0 });
      try {
        const res = await fetch(`/api/servicos-ambiente?ambiente_id=${item.id}`);
        const services = await res.json();
        // We need to map these back to the original service item IDs if possible, 
        // but servicos_ambiente stores names. 
        // Actually, the backend should probably return the original service item ID if we store it.
        // For now, let's assume we can find them by name in allActivities.
        const servicos_ids = services.data
          .map((s: any) => allActivities.find(a => a.name === s.nome_servico)?.id)
          .filter(Boolean);
        setFormData({ ...item, servicos_ids });
      } catch (error) {
        console.error('Error fetching environment services:', error);
        setFormData(item);
      }
    } else {
      setFormData(item);
    }
    setIsModalOpen(true);
  };

  const handleTipoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingTipoId ? `/api/tipos-ambiente/${editingTipoId}` : '/api/tipos-ambiente';
    const res = await fetch(url, {
      method: editingTipoId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify(tipoFormData)
    });
    if (res.ok) {
      setIsTipoModalOpen(false);
      setTipoFormData({ nome: '', descricao: '', icone: 'Home' });
      setEditingTipoId(null);
      fetchTiposAmbiente();
    }
  };

  const deleteTipo = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este tipo de ambiente?')) {
      const res = await fetch(`/api/tipos-ambiente/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-role': 'admin' }
      });
      if (res.ok) fetchTiposAmbiente();
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Setor': 'Bloco A',
        'Pavimento': 'Térreo',
        'Ambiente': 'Sala 101',
        'Tipo': 'SALA',
        'Área Piso': 25.50,
        'Área Teto': '25.50',
        'Área Parede': '45.00',
        'Descrição': 'Sala de aula padrão'
      },
      {
        'Setor': 'Bloco A',
        'Pavimento': '1º Andar',
        'Ambiente': 'Banheiro Masc',
        'Tipo': 'BANHEIRO',
        'Área Piso': 12.00,
        'Área Teto': '12.00',
        'Área Parede': '35.00',
        'Descrição': 'Banheiro coletivo'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Importacao_Parametros.xlsx");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const res = await fetch('/api/construction/import', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-role': 'admin'
          },
          body: JSON.stringify({ data })
        });

        const result = await res.json();
        if (res.ok) {
          alert(`Importação concluída!\nSucesso: ${result.count} registros`);
          fetchSetores(currentSetorPage);
          if (selectedSector) fetchPavimentos(selectedSector, currentPavimentoPage);
          if (selectedFloor) fetchAmbientes(selectedFloor, currentAmbientePage);
        } else {
          alert(result.error || 'Erro na importação');
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao processar o arquivo Excel');
      } finally {
        setImportLoading(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
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
          <h2 className="text-2xl font-bold text-slate-900">Parâmetros de Projeto</h2>
          <p className="text-slate-500">Defina a estrutura física e parâmetros de obra</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm"
            title="Baixar Planilha Modelo"
          >
            <Download size={18} />
            Modelo
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm cursor-pointer">
            <Upload size={18} />
            {importLoading ? 'Importando...' : 'Importar Excel'}
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              className="hidden" 
              onChange={handleImportExcel}
              disabled={importLoading}
            />
          </label>
          <button 
            onClick={() => setIsTipoModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition-all font-bold"
          >
            <Settings size={20} />
            Tipos de Ambiente
          </button>
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

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-slate-500 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
        <button 
          onClick={() => { setSelectedSector(null); setSelectedFloor(null); setSelectedEnv(null); }}
          className={`hover:text-indigo-600 transition-colors ${!selectedSector ? 'font-bold text-indigo-600' : 'font-medium'}`}
        >
          Obra
        </button>
        {selectedSector && (
          <>
            <ChevronRight size={14} className="text-slate-300" />
            <button 
              onClick={() => { setSelectedFloor(null); setSelectedEnv(null); }}
              className={`hover:text-indigo-600 transition-colors ${selectedSector && !selectedFloor ? 'font-bold text-indigo-600' : 'font-medium'}`}
            >
              {selectedSectorName || 'Carregando...'}
            </button>
          </>
        )}
        {selectedFloor && (
          <>
            <ChevronRight size={14} className="text-slate-300" />
            <button 
              onClick={() => { setSelectedEnv(null); }}
              className={`hover:text-emerald-600 transition-colors ${selectedFloor && !selectedEnv ? 'font-bold text-emerald-600' : 'font-medium'}`}
            >
              {selectedFloorName || 'Carregando...'}
            </button>
          </>
        )}
        {selectedEnv && (
          <>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-amber-600 font-bold">
              {selectedEnvName || 'Carregando...'}
            </span>
          </>
        )}
      </div>

      {viewMode === 'flow' ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm h-[600px] overflow-hidden relative">
          <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2 gap-4">
              <h4 className="font-bold text-slate-800 text-sm">Legenda do Fluxo</h4>
              <button 
                onClick={() => onLayout('LR')}
                className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-600 transition-all shadow-sm"
              >
                <Activity size={12} />
                REORGANIZAR
              </button>
            </div>
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
            onNodeClick={onNodeClick}
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
            <button 
              onClick={() => toggleSort('sector')}
              className="p-1.5 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
              title={sectorSort.order === 'ASC' ? 'Ordem Crescente' : 'Ordem Decrescente'}
            >
              {sectorSort.order === 'ASC' ? <SortAsc size={18} /> : <SortDesc size={18} />}
            </button>
          </div>
          <div className="p-2 space-y-1">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'sector')}>
              <SortableContext items={setores.map(s => s.id)} strategy={verticalListSortingStrategy}>
                {setores.map(s => (
                  <SortableItem key={s.id} id={s.id}>
                    <div className="group relative">
                      <button
                        onClick={() => { setSelectedSector(s.id); setSelectedFloor(null); setSelectedEnv(null); }}
                        className={`w-full text-left px-6 py-3 rounded-xl transition-all flex items-center justify-between ${selectedSector === s.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
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
                  </SortableItem>
                ))}
              </SortableContext>
            </DndContext>
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
            <div className="flex items-center gap-1">
              <button 
                onClick={() => toggleSort('floor')}
                className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                title={floorSort.order === 'ASC' ? 'Ordem Crescente' : 'Ordem Decrescente'}
              >
                {floorSort.order === 'ASC' ? <SortAsc size={18} /> : <SortDesc size={18} />}
              </button>
              <button onClick={() => { setModalType('floor'); setEditingId(null); setFormData({}); setIsModalOpen(true); }} className="p-1 hover:bg-emerald-100 text-emerald-600 rounded-lg">
                <Plus size={18} />
              </button>
            </div>
          </div>
          <div className="p-2 space-y-1">
            {!selectedSector ? (
              <p className="p-8 text-center text-slate-400 text-sm italic">Selecione um setor para ver os pavimentos</p>
            ) : (
              <>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'floor')}>
                  <SortableContext items={pavimentos.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    {pavimentos.map(p => (
                      <SortableItem key={p.id} id={p.id}>
                        <div className="group relative">
                          <button
                            onClick={() => { setSelectedFloor(p.id); setSelectedEnv(null); }}
                            className={`w-full text-left px-6 py-3 rounded-xl transition-all flex items-center justify-between ${selectedFloor === p.id ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-600'}`}
                          >
                            <span className="font-medium">{p.nome_pavimento}</span>
                            <ChevronRight size={16} className={`transition-transform ${selectedFloor === p.id ? 'rotate-90' : 'opacity-0 group-hover:opacity-100'}`} />
                          </button>
                          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setTransferItem({ type: 'floor', id: p.id, name: p.nome_pavimento, currentParentId: p.setor_id }); setIsTransferModalOpen(true); }} className="p-1.5 hover:bg-emerald-100 text-emerald-600 rounded-lg" title="Transferir para outro setor">
                              <MoveHorizontal size={14} />
                            </button>
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
                      </SortableItem>
                    ))}
                  </SortableContext>
                </DndContext>
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
            <div className="flex items-center gap-1">
              <button 
                onClick={() => toggleSort('env')}
                className="p-1.5 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors"
                title={envSort.order === 'ASC' ? 'Ordem Crescente' : 'Ordem Decrescente'}
              >
                {envSort.order === 'ASC' ? <SortAsc size={18} /> : <SortDesc size={18} />}
              </button>
              <button onClick={() => { setModalType('env'); setEditingId(null); setFormData({}); setIsModalOpen(true); }} className="p-1 hover:bg-amber-100 text-amber-600 rounded-lg">
                <Plus size={18} />
              </button>
            </div>
          </div>
          <div className="p-2 space-y-1">
            {!selectedFloor ? (
              <p className="p-8 text-center text-slate-400 text-sm italic">Selecione um pavimento</p>
            ) : (
              <>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'env')}>
                  <SortableContext items={ambientes.map(a => a.id)} strategy={verticalListSortingStrategy}>
                    {ambientes.map(a => (
                      <SortableItem key={a.id} id={a.id}>
                        <div className="group relative">
                          <button
                            onClick={() => setSelectedEnv(a.id)}
                            className={`w-full text-left px-6 py-3 rounded-xl transition-all flex items-center justify-between ${selectedEnv === a.id ? 'bg-amber-50 text-amber-700' : 'hover:bg-slate-50 text-slate-600'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                                {(() => {
                                  const tipo = tiposAmbiente.find(t => t.nome === a.tipo_ambiente);
                                  const IconComponent = (IconList as any)[tipo?.icone || 'Home'] || Home;
                                  return <IconComponent size={16} />;
                                })()}
                              </div>
                              <div>
                                <span className="font-medium block">{a.nome_ambiente}</span>
                                <span className="text-[10px] uppercase font-bold opacity-60">{a.tipo_ambiente}</span>
                              </div>
                            </div>
                            <ChevronRight size={16} className={`transition-transform ${selectedEnv === a.id ? 'rotate-90' : 'opacity-0 group-hover:opacity-100'}`} />
                          </button>
                          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setTransferItem({ type: 'env', id: a.id, name: a.nome_ambiente, currentParentId: a.pavimento_id }); setIsTransferModalOpen(true); }} className="p-1.5 hover:bg-amber-100 text-amber-600 rounded-lg" title="Transferir para outro pavimento">
                              <MoveHorizontal size={14} />
                            </button>
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
                      </SortableItem>
                    ))}
                  </SortableContext>
                </DndContext>
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
                        {tiposAmbiente.map(t => (
                          <option key={t.id} value={t.nome}>{t.nome}</option>
                        ))}
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
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-700">Área de Parede (m²)</label>
                        <button 
                          type="button"
                          onClick={() => setAlvenariaCalc({ ...alvenariaCalc, enabled: !alvenariaCalc.enabled })}
                          className={`text-[10px] font-bold px-2 py-1 rounded ${alvenariaCalc.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {alvenariaCalc.enabled ? 'DIGITAR MANUALMENTE' : 'INSERIR VALORES'}
                        </button>
                      </div>
                      <input 
                        type="number" 
                        step="0.01"
                        readOnly={alvenariaCalc.enabled}
                        className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 ${alvenariaCalc.enabled ? 'bg-slate-50 text-slate-500' : ''}`}
                        value={formData.area_parede || ''}
                        onChange={e => setFormData({ ...formData, area_parede: e.target.value })}
                      />
                    </div>
                  </div>

                  {alvenariaCalc.enabled && (
                    <div className="grid grid-cols-3 gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-emerald-700 uppercase">Perímetro</label>
                        <input 
                          type="number" 
                          step="0.01"
                          className="w-full px-2 py-1.5 text-xs border border-emerald-200 rounded-lg outline-none focus:border-emerald-500"
                          value={alvenariaCalc.perimetro}
                          onChange={e => setAlvenariaCalc({ ...alvenariaCalc, perimetro: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-emerald-700 uppercase">Altura</label>
                        <input 
                          type="number" 
                          step="0.01"
                          className="w-full px-2 py-1.5 text-xs border border-emerald-200 rounded-lg outline-none focus:border-emerald-500"
                          value={alvenariaCalc.altura}
                          onChange={e => setAlvenariaCalc({ ...alvenariaCalc, altura: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-emerald-700 uppercase">Descontos</label>
                        <input 
                          type="number" 
                          step="0.01"
                          className="w-full px-2 py-1.5 text-xs border border-emerald-200 rounded-lg outline-none focus:border-emerald-500"
                          value={alvenariaCalc.descontos}
                          onChange={e => setAlvenariaCalc({ ...alvenariaCalc, descontos: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  )}

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
                          <div className="space-y-2">
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
                            <div className="flex gap-4 px-1">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Largura</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase ml-6">Altura</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase ml-8">Quantidade</span>
                            </div>
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
                          <div className="space-y-2">
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
                            <div className="flex gap-4 px-1">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Largura</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase ml-4">Altura</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase ml-5">Peitoril</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase ml-4">Quantidade</span>
                            </div>
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

                      {/* Serviços */}
                      <div className="space-y-3 pt-4 border-t border-slate-100">
                        <MultiSelect 
                          label="Serviços Associados"
                          placeholder="Selecionar serviços..."
                          options={allActivities}
                          selectedIds={formData.servicos_ids || []}
                          onToggle={(id) => {
                            const current = formData.servicos_ids || [];
                            const updated = current.includes(id) 
                              ? current.filter((i: number) => i !== id)
                              : [...current, id];
                            setFormData({ ...formData, servicos_ids: updated });
                          }}
                        />
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

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <MoveHorizontal size={24} /> Transferir {transferItem?.type === 'floor' ? 'Pavimento' : 'Ambiente'}
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-sm text-indigo-600 font-medium mb-1">Item a ser transferido:</p>
                <p className="text-lg font-bold text-indigo-900">{transferItem?.name}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {transferItem?.type === 'floor' ? 'Selecionar Setor de Destino' : 'Selecionar Pavimento de Destino'}
                </label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  value={transferTargetId || ''}
                  onChange={(e) => setTransferTargetId(Number(e.target.value))}
                >
                  <option value="">Selecione o destino...</option>
                  {transferItem?.type === 'floor' ? (
                    allHierarchy.setores
                      .filter(s => s.id !== transferItem.currentParentId)
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.nome_setor}</option>
                      ))
                  ) : (
                    allHierarchy.pavimentos
                      .filter(p => p.id !== transferItem.currentParentId)
                      .map(p => {
                        const sector = allHierarchy.setores.find(s => s.id === p.setor_id);
                        return (
                          <option key={p.id} value={p.id}>
                            {sector?.nome_setor} - {p.nome_pavimento}
                          </option>
                        );
                      })
                  )}
                </select>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleTransfer}
                disabled={!transferTargetId}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 transition-all"
              >
                Confirmar Transferência
              </button>
            </div>
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

      {/* Environment Types Modal */}
      {isTipoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold">Gestão de Tipos de Ambiente</h3>
              <button onClick={() => setIsTipoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <form onSubmit={handleTipoSubmit} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="font-bold text-slate-700">{editingTipoId ? 'Editar Tipo' : 'Novo Tipo'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nome</label>
                    <input 
                      required
                      type="text"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                      value={tipoFormData.nome}
                      onChange={e => setTipoFormData({ ...tipoFormData, nome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Descrição</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                      value={tipoFormData.descricao}
                      onChange={e => setTipoFormData({ ...tipoFormData, descricao: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Ícone</label>
                    <select
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                      value={tipoFormData.icone}
                      onChange={e => setTipoFormData({ ...tipoFormData, icone: e.target.value })}
                    >
                      <option value="Home">Casa</option>
                      <option value="Bed">Quarto</option>
                      <option value="Bath">Banheiro</option>
                      <option value="Coffee">Cozinha/Café</option>
                      <option value="Utensils">Refeitório</option>
                      <option value="Tv">Sala Estar</option>
                      <option value="Briefcase">Escritório</option>
                      <option value="Warehouse">Depósito</option>
                      <option value="Car">Garagem</option>
                      <option value="Trees">Área Externa</option>
                      <option value="Wind">Ventilação</option>
                      <option value="Zap">Elétrica</option>
                      <option value="Droplets">Hidráulica</option>
                      <option value="Box">Geral</option>
                      <option value="DoorOpen">Acesso</option>
                      <option value="Square">Área Livre</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  {editingTipoId && (
                    <button 
                      type="button" 
                      onClick={() => { setEditingTipoId(null); setTipoFormData({ nome: '', descricao: '', icone: 'Home' }); }}
                      className="px-4 py-2 text-slate-500 font-bold text-sm"
                    >
                      Cancelar
                    </button>
                  )}
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20"
                  >
                    {editingTipoId ? 'Atualizar' : 'Salvar Tipo'}
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-700">Tipos Cadastrados</h4>
                <div className="grid grid-cols-1 gap-2">
                  {tiposAmbiente.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                          {(() => {
                            const IconComponent = (IconList as any)[t.icone || 'Home'] || Home;
                            return <IconComponent size={20} />;
                          })()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{t.nome}</p>
                          <p className="text-xs text-slate-500">{t.descricao || 'Sem descrição'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingTipoId(t.id); setTipoFormData({ nome: t.nome, descricao: t.descricao || '', icone: t.icone || 'Home' }); }} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => deleteTipo(t.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {tiposAmbiente.length === 0 && (
                    <p className="text-center py-8 text-slate-400 italic">Nenhum tipo cadastrado</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
