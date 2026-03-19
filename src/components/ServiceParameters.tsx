import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  ChevronRight,
  ChevronDown,
  Settings,
  Activity,
  Layers,
  FolderKanban,
  CheckCircle2,
  Copy,
  Download,
  Upload,
  FileSpreadsheet,
  History as HistoryIcon,
  FileText,
  FileDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Pagination } from './Pagination';
import { ConfirmationModal } from './ConfirmationModal';
import { MultiSelect } from './MultiSelect';

interface ServiceParameter {
  id: number;
  codigo: string;
  nome: string;
  unidade_medida: string;
  produtividade: number;
  produtividade_media?: number;
  unidade_tempo: string;
}

interface ServiceGroup {
  id: number;
  codigo: string;
  nome: string;
  atividades_nomes: string;
  atividades_ids: string;
  etapa_id?: number;
}

interface ServiceStage {
  id: number;
  codigo: string;
  nome: string;
  grupos_nomes: string;
  grupos_ids: string;
}

interface HistoryEntry {
  id: number;
  tipo_item: string;
  item_id: number;
  codigo: string;
  nome: string;
  descricao_alteracao: string;
  usuario_email: string;
  data_alteracao: string;
}

type Tab = 'atividades' | 'grupos' | 'etapas' | 'hierarquia' | 'historico';

interface ServiceItem {
  id: number;
  parametro_id: number;
  nome: string;
  unidade_medida: string;
  quantidade_produtividade: number;
  unidade_tempo: string;
  valor_parametro: number;
}

export default function ServiceParameters({ userRole, userEmail }: { userRole?: string, userEmail?: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('etapas');
  const [parameters, setParameters] = useState<ServiceParameter[]>([]);
  const [allParameters, setAllParameters] = useState<ServiceParameter[]>([]);
  const [groups, setGroups] = useState<ServiceGroup[]>([]);
  const [allGroups, setAllGroups] = useState<ServiceGroup[]>([]);
  const [stages, setStages] = useState<ServiceStage[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedActivityForItens, setSelectedActivityForItens] = useState<ServiceParameter | null>(null);
  const [activityItens, setActivityItens] = useState<ServiceItem[]>([]);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);
  const [itemFormData, setItemFormData] = useState({
    nome: '',
    unidade_medida: '',
    quantidade_produtividade: '',
    unidade_tempo: 'HORA',
    valor_parametro: ''
  });

  const [totalParameters, setTotalParameters] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  
  const [editingParam, setEditingParam] = useState<ServiceParameter | null>(null);
  const [editingGroup, setEditingGroup] = useState<ServiceGroup | null>(null);
  const [editingStage, setEditingStage] = useState<ServiceStage | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Selection state for groups/stages
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => 
      prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]
    );
  };

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

  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    unidade_medida: '',
    produtividade: '',
    produtividade_media: '',
    unidade_tempo: 'DIA'
  });

  const [groupName, setGroupName] = useState('');
  const [groupCodigo, setGroupCodigo] = useState('');
  const [groupEtapaId, setGroupEtapaId] = useState('');
  const [stageName, setStageName] = useState('');
  const [stageCodigo, setStageCodigo] = useState('');

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    
    // Atividades
    const wsAtividades = XLSX.utils.json_to_sheet([
      { Codigo: '01.01.001', Nome: 'Locação da Obra', UnidadeMedida: 'm2', ProdutividadeHora: 10.0, ProdutividadeMedia: 8.0 },
      { Codigo: '01.01.002', Nome: 'Escavação Manual', UnidadeMedida: 'm3', ProdutividadeHora: 0.5, ProdutividadeMedia: 0.4 },
      { Codigo: '01.02.001', Nome: 'Armação de Pilares', UnidadeMedida: 'kg', ProdutividadeHora: 5.0, ProdutividadeMedia: 4.5 },
      { Codigo: '02.01.001', Nome: 'Alvenaria de Vedação', UnidadeMedida: 'm2', ProdutividadeHora: 1.5, ProdutividadeMedia: 1.2 },
      { Codigo: '02.02.001', Nome: 'Chapisco', UnidadeMedida: 'm2', ProdutividadeHora: 15.0, ProdutividadeMedia: 12.0 }
    ]);
    XLSX.utils.book_append_sheet(wb, wsAtividades, 'Atividades');
    
    // Grupos
    const wsGrupos = XLSX.utils.json_to_sheet([
      { Codigo: '01.01', NomeGrupo: 'Infraestrutura - Terraplenagem', CodigosAtividades: '01.01.001, 01.01.002' },
      { Codigo: '01.02', NomeGrupo: 'Infraestrutura - Fundações', CodigosAtividades: '01.02.001' },
      { Codigo: '02.01', NomeGrupo: 'Supraestrutura - Alvenaria', CodigosAtividades: '02.01.001' },
      { Codigo: '02.02', NomeGrupo: 'Supraestrutura - Revestimento', CodigosAtividades: '02.02.001' }
    ]);
    XLSX.utils.book_append_sheet(wb, wsGrupos, 'Grupos');
    
    // Etapas
    const wsEtapas = XLSX.utils.json_to_sheet([
      { Codigo: '01', NomeEtapa: 'INFRAESTRUTURA', CodigosGrupos: '01.01, 01.02' },
      { Codigo: '02', NomeEtapa: 'SUPRAESTRUTURA', CodigosGrupos: '02.01, 02.02' }
    ]);
    XLSX.utils.book_append_sheet(wb, wsEtapas, 'Etapas');
    
    XLSX.writeFile(wb, 'Modelo_Importacao_Servicos.xlsx');
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        // 1. Process Atividades
        const wsAtividades = wb.Sheets['Atividades'];
        if (wsAtividades) {
          const dataAtividades = XLSX.utils.sheet_to_json(wsAtividades);
          for (const row of dataAtividades as any[]) {
            await fetch('/api/parametros-servico', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-user-role': userRole || '' },
              body: JSON.stringify({
                codigo: row.Codigo.toString(),
                nome: row.Nome,
                unidade_medida: row.UnidadeMedida,
                produtividade: row.ProdutividadeHora,
                produtividade_media: row.ProdutividadeMedia || null,
                unidade_tempo: 'HORA'
              })
            });
          }
        }
        
        // Refresh activities to get IDs
        const resAt = await fetch('/api/parametros-servico?limit=1000');
        const allAtividades = await resAt.json();
        const atMap = new Map(allAtividades.data.map((a: any) => [a.codigo.toString(), a.id]));

        // 2. Process Grupos
        const wsGrupos = wb.Sheets['Grupos'];
        if (wsGrupos) {
          const dataGrupos = XLSX.utils.sheet_to_json(wsGrupos);
          for (const row of dataGrupos as any[]) {
            const codes = row.CodigosAtividades ? row.CodigosAtividades.toString().split(',').map((c: string) => c.trim()) : [];
            const ids = codes.map((c: string) => atMap.get(c)).filter(Boolean);
            
            await fetch('/api/grupos-servico', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-user-role': userRole || '' },
              body: JSON.stringify({
                codigo: row.Codigo,
                nome: row.NomeGrupo,
                atividades_ids: ids
              })
            });
          }
        }

        // Refresh groups to get IDs
        const resGr = await fetch('/api/grupos-servico');
        const allGroups = await resGr.json();
        const grMap = new Map(allGroups.map((g: any) => [g.codigo.toString(), g.id]));

        // 3. Process Etapas
        const wsEtapas = wb.Sheets['Etapas'];
        if (wsEtapas) {
          const dataEtapas = XLSX.utils.sheet_to_json(wsEtapas);
          for (const row of dataEtapas as any[]) {
            const groupCodes = row.CodigosGrupos ? row.CodigosGrupos.toString().split(',').map((n: string) => n.trim()) : [];
            const ids = groupCodes.map((n: string) => grMap.get(n)).filter(Boolean);
            
            await fetch('/api/etapas-servico', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-user-role': userRole || '' },
              body: JSON.stringify({
                codigo: row.Codigo,
                nome: row.NomeEtapa,
                grupos_ids: ids
              })
            });
          }
        }

        fetchParameters(1);
        fetchGroups();
        fetchStages();
      } catch (error) {
        console.error('Erro na importação:', error);
      } finally {
        setLoading(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  useEffect(() => {
    if (activeTab === 'atividades') fetchParameters(currentPage);
    if (activeTab === 'grupos') fetchGroups();
    if (activeTab === 'etapas') fetchStages();
    if (activeTab === 'hierarquia') {
      fetchStages();
      fetchGroups();
      fetchParameters(1);
    }
    if (activeTab === 'historico') fetchHistory();

    // Garantir que temos etapas, grupos e atividades para os modais
    if (stages.length === 0) fetchStages();
    if (allGroups.length === 0) fetchGroups();
    if (allParameters.length === 0) fetchAllParameters();
  }, [activeTab, currentPage]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/historico-parametros');
      const data = await res.json();
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllParameters = async () => {
    try {
      const res = await fetch('/api/parametros-servico?limit=1000');
      const data = await res.json();
      setAllParameters(data.data || []);
    } catch (error) {
      console.error('Error fetching all parameters:', error);
    }
  };

  const fetchParameters = async (page: number) => {
    setLoading(true);
    try {
      const offset = (page - 1) * itemsPerPage;
      const res = await fetch(`/api/parametros-servico?limit=${itemsPerPage}&offset=${offset}`);
      const data = await res.json();
      setParameters(data.data || []);
      setTotalParameters(data.total || 0);
    } catch (error) {
      console.error('Error fetching parameters:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/grupos-servico');
      const data = await res.json();
      setGroups(data || []);
      setAllGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/etapas-servico');
      const data = await res.json();
      setStages(data || []);
    } catch (error) {
      console.error('Error fetching stages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityItens = async (activityId: number) => {
    const res = await fetch(`/api/parametros-servico/${activityId}/itens`);
    const data = await res.json();
    setActivityItens(data);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivityForItens) return;

    if (parseFloat(itemFormData.quantidade_produtividade) < 0 || parseFloat(itemFormData.valor_parametro) < 0) {
      alert('Os campos de produtividade e valor devem ser números positivos.');
      return;
    }

    const url = editingItem 
      ? `/api/parametros-servico-itens/${editingItem.id}` 
      : `/api/parametros-servico/${selectedActivityForItens.id}/itens`;
    
    const res = await fetch(url, {
      method: editingItem ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': userRole || '' },
      body: JSON.stringify({
        ...itemFormData,
        quantidade_produtividade: parseFloat(itemFormData.quantidade_produtividade),
        valor_parametro: parseFloat(itemFormData.valor_parametro)
      })
    });

    if (res.ok) {
      setIsItemModalOpen(false);
      setItemFormData({
        nome: '',
        unidade_medida: '',
        quantidade_produtividade: '',
        unidade_tempo: 'HORA',
        valor_parametro: ''
      });
      setEditingItem(null);
      fetchActivityItens(selectedActivityForItens.id);
    }
  };

  const handleItemDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
    const res = await fetch(`/api/parametros-servico-itens/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': userRole || '' }
    });
    if (res.ok && selectedActivityForItens) {
      fetchActivityItens(selectedActivityForItens.id);
    }
  };

  const fetchNextCode = async () => {
    try {
      const res = await fetch('/api/parametros-servico/next-code');
      const data = await res.json();
      setFormData(prev => ({ ...prev, codigo: data.nextCode.toString() }));
    } catch (error) {
      console.error('Error fetching next code:', error);
    }
  };

  const openModal = (param: ServiceParameter | null = null) => {
    if (param) {
      setEditingParam(param);
      const hourlyProd = param.unidade_tempo === 'DIA' ? param.produtividade / 8 : param.produtividade;
      setFormData({
        codigo: param.codigo.toString(),
        nome: param.nome,
        unidade_medida: param.unidade_medida,
        produtividade: hourlyProd.toString(),
        produtividade_media: param.produtividade_media?.toString() || '',
        unidade_tempo: 'HORA'
      });
    } else {
      setEditingParam(null);
      setFormData({
        codigo: '',
        nome: '',
        unidade_medida: '',
        produtividade: '',
        produtividade_media: '',
        unidade_tempo: 'DIA'
      });
      fetchNextCode();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingParam(null);
  };

  const openGroupModal = (group: ServiceGroup | null = null) => {
    if (group) {
      setEditingGroup(group);
      setGroupName(group.nome);
      setGroupCodigo(group.codigo || '');
      setSelectedItems(group.atividades_ids.split(',').map(id => parseInt(id)));
      setGroupEtapaId(group.etapa_id ? group.etapa_id.toString() : '');
    } else {
      setEditingGroup(null);
      setGroupName('');
      setGroupCodigo('');
      setSelectedItems([]);
      setGroupEtapaId('');
    }
    setIsGroupModalOpen(true);
  };

  const closeGroupModal = () => {
    setIsGroupModalOpen(false);
    setEditingGroup(null);
    setGroupName('');
    setGroupCodigo('');
    setSelectedItems([]);
    setGroupEtapaId('');
  };

  const openStageModal = (stage: ServiceStage | null = null) => {
    if (stage) {
      setEditingStage(stage);
      setStageName(stage.nome);
      setStageCodigo(stage.codigo || '');
      setSelectedItems(stage.grupos_ids.split(',').map(id => parseInt(id)));
    } else {
      setEditingStage(null);
      setStageName('');
      setStageCodigo('');
      setSelectedItems([]);
    }
    setIsStageModalOpen(true);
  };

  const closeStageModal = () => {
    setIsStageModalOpen(false);
    setEditingStage(null);
    setStageName('');
    setStageCodigo('');
    setSelectedItems([]);
  };

  const handleCopy = async (item: any, type: 'atividade' | 'grupo' | 'etapa') => {
    setLoading(true);
    try {
      if (type === 'atividade') {
        const resNext = await fetch('/api/parametros-servico/next-code');
        const nextData = await resNext.json();
        
        await fetch('/api/parametros-servico', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-role': userRole || '' },
          body: JSON.stringify({
            codigo: nextData.nextCode,
            nome: `${item.nome} (Cópia)`,
            unidade_medida: item.unidade_medida,
            produtividade: item.produtividade,
            unidade_tempo: item.unidade_tempo
          })
        });
        fetchParameters(currentPage);
      } else if (type === 'grupo') {
        await fetch('/api/grupos-servico', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-role': userRole || '' },
          body: JSON.stringify({
            nome: `${item.nome} (Cópia)`,
            atividades_ids: item.atividades_ids.split(',').map((id: string) => parseInt(id))
          })
        });
        fetchGroups();
      } else if (type === 'etapa') {
        await fetch('/api/etapas-servico', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-role': userRole || '' },
          body: JSON.stringify({
            nome: `${item.nome} (Cópia)`,
            grupos_ids: item.grupos_ids.split(',').map((id: string) => parseInt(id))
          })
        });
        fetchStages();
      }
    } catch (error) {
      console.error(`Error copying ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (parseFloat(formData.produtividade) <= 0 || (formData.produtividade_media && parseFloat(formData.produtividade_media) <= 0)) {
      alert('Os campos de produtividade devem ser números positivos (maiores que zero).');
      return;
    }

    setLoading(true);
    try {
      const method = editingParam ? 'PUT' : 'POST';
      const url = editingParam ? `/api/parametros-servico/${editingParam.id}` : '/api/parametros-servico';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': userRole || ''
        },
        body: JSON.stringify({
          ...formData,
          codigo: formData.codigo,
          produtividade: parseFloat(formData.produtividade),
          produtividade_media: formData.produtividade_media ? parseFloat(formData.produtividade_media) : null
        })
      });

      if (res.ok) {
        closeModal();
        fetchParameters(currentPage);
        fetchGroups();
        fetchStages();
      }
    } catch (error) {
      console.error('Error saving parameter:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number, type: 'atividade' | 'grupo' | 'etapa') => {
    setConfirmConfig({
      title: `Excluir ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      message: `Tem certeza que deseja excluir este ${type}? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        try {
          let url = '';
          if (type === 'atividade') url = `/api/parametros-servico/${id}`;
          if (type === 'grupo') url = `/api/grupos-servico/${id}`;
          if (type === 'etapa') url = `/api/etapas-servico/${id}`;

          const res = await fetch(url, { 
            method: 'DELETE',
            headers: { 
              'x-user-role': userRole || '',
              'x-user-email': userEmail || ''
            }
          });
          if (res.ok) {
            if (activeTab === 'atividades') fetchParameters(currentPage);
            if (activeTab === 'grupos') fetchGroups();
            if (activeTab === 'etapas') fetchStages();
          }
        } catch (error) {
          console.error(`Error deleting ${type}:`, error);
        }
        setIsConfirmOpen(false);
      }
    });
    setIsConfirmOpen(true);
  };

  const toggleSelection = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName || !groupCodigo || !groupEtapaId || selectedItems.length === 0) {
      alert('Por favor, preencha todos os campos obrigatórios e selecione pelo menos uma atividade.');
      return;
    }
    setLoading(true);
    try {
      const method = editingGroup ? 'PUT' : 'POST';
      const url = editingGroup ? `/api/grupos-servico/${editingGroup.id}` : '/api/grupos-servico';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': userRole || '',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify({
          codigo: groupCodigo,
          nome: groupName,
          atividades_ids: selectedItems,
          etapa_id: groupEtapaId
        })
      });
      if (res.ok) {
        setGroupName('');
        setGroupCodigo('');
        setSelectedItems([]);
        setGroupEtapaId('');
        setIsGroupModalOpen(false);
        setEditingGroup(null);
        fetchGroups();
        fetchStages();
        if (activeTab !== 'grupos') setActiveTab('grupos');
      }
    } catch (error) {
      console.error('Error saving group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStage = async () => {
    if (!stageName || !stageCodigo || selectedItems.length === 0) {
      alert('Por favor, preencha todos os campos obrigatórios e selecione pelo menos um grupo.');
      return;
    }
    setLoading(true);
    try {
      const method = editingStage ? 'PUT' : 'POST';
      const url = editingStage ? `/api/etapas-servico/${editingStage.id}` : '/api/etapas-servico';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': userRole || '',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify({
          codigo: stageCodigo,
          nome: stageName,
          grupos_ids: selectedItems
        })
      });
      if (res.ok) {
        setStageName('');
        setStageCodigo('');
        setSelectedItems([]);
        setIsStageModalOpen(false);
        setEditingStage(null);
        fetchStages();
        if (activeTab !== 'etapas') setActiveTab('etapas');
      }
    } catch (error) {
      console.error('Error saving stage:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const data: any[] = [];
    
    // Add Stages
    stages.forEach(stage => {
      data.push({
        Tipo: 'ETAPA',
        Codigo: stage.codigo,
        Nome: stage.nome,
        Relacionados: stage.grupos_nomes
      });
      
      // Add Groups for this stage
      const stageGroups = groups.filter(g => stage.grupos_ids?.split(',').includes(g.id.toString()));
      stageGroups.forEach(group => {
        data.push({
          Tipo: '  GRUPO',
          Codigo: group.codigo,
          Nome: group.nome,
          Relacionados: group.atividades_nomes
        });
        
        // Add Activities for this group
        const groupActivities = allParameters.filter(p => group.atividades_ids?.split(',').includes(p.id.toString()));
        groupActivities.forEach(activity => {
          data.push({
            Tipo: '    ATIVIDADE',
            Codigo: activity.codigo,
            Nome: activity.nome,
            Relacionados: `${activity.produtividade} ${activity.unidade_medida}/h`
          });
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório de Parâmetros");
    XLSX.writeFile(wb, "relatorio_parametros.csv");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Relatório de Parâmetros de Serviço', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 30);

    const tableData: any[] = [];
    
    stages.forEach(stage => {
      tableData.push([
        { content: `ETAPA: ${stage.codigo} - ${stage.nome}`, colSpan: 4, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }
      ]);
      
      const stageGroups = groups.filter(g => stage.grupos_ids?.split(',').includes(g.id.toString()));
      stageGroups.forEach(group => {
        tableData.push([
          '',
          { content: `GRUPO: ${group.codigo} - ${group.nome}`, colSpan: 3, styles: { fillColor: [250, 250, 250], fontStyle: 'bold' } }
        ]);
        
        const groupActivities = allParameters.filter(p => group.atividades_ids?.split(',').includes(p.id.toString()));
        groupActivities.forEach(activity => {
          tableData.push([
            '',
            '',
            activity.codigo,
            `${activity.nome} (${activity.produtividade} ${activity.unidade_medida}/h)`
          ]);
        });
      });
    });

    (doc as any).autoTable({
      startY: 40,
      head: [['', '', 'CÓDIGO', 'DESCRIÇÃO / PRODUTIVIDADE']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [71, 85, 105] }
    });

    doc.save('relatorio_parametros.pdf');
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Parâmetros de Serviço</h1>
          <p className="text-slate-500 text-sm">Gerencie atividades, grupos e etapas de serviço</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            <button 
              onClick={exportToCSV}
              className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-600 transition-all flex items-center gap-2 text-xs font-bold"
              title="Exportar CSV"
            >
              <FileDown size={16} />
              CSV
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button 
              onClick={exportToPDF}
              className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-600 transition-all flex items-center gap-2 text-xs font-bold"
              title="Exportar PDF"
            >
              <FileText size={16} />
              PDF
            </button>
          </div>
          <button 
            onClick={downloadTemplate}
            className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-all"
            title="Baixar Modelo Excel"
          >
            <Download size={20} />
            <span className="hidden sm:inline text-xs">MODELO</span>
          </button>
          <label className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-all cursor-pointer">
            <Upload size={20} />
            <span className="hidden sm:inline text-xs">IMPORTAR</span>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              className="hidden" 
              onChange={handleImportExcel}
            />
          </label>
          {activeTab === 'atividades' && (
            <button 
              onClick={() => openModal()}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-600/20"
            >
              <Plus size={20} />
              CRIAR ATIVIDADE
            </button>
          )}
          {activeTab === 'grupos' && (
            <button 
              onClick={() => openGroupModal()}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-600/20"
            >
              <Plus size={20} />
              CRIAR GRUPO
            </button>
          )}
          {activeTab === 'etapas' && (
            <button 
              onClick={() => openStageModal()}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-600/20"
            >
              <Plus size={20} />
              CRIAR ETAPA
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => { setActiveTab('etapas'); setSelectedItems([]); }}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${activeTab === 'etapas' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Etapas
        </button>
        <button 
          onClick={() => { setActiveTab('grupos'); setSelectedItems([]); }}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${activeTab === 'grupos' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Grupos de Serviço
        </button>
        <button 
          onClick={() => { setActiveTab('atividades'); setSelectedItems([]); }}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${activeTab === 'atividades' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Atividades
        </button>
        <button 
          onClick={() => { setActiveTab('hierarquia'); setSelectedItems([]); }}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${activeTab === 'hierarquia' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Hierarquia
        </button>
        <button 
          onClick={() => { setActiveTab('historico'); setSelectedItems([]); }}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${activeTab === 'historico' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Histórico
        </button>
      </div>

      {/* Selection Actions Bar Removed - Now using MultiSelect in Modals */}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={`Buscar ${activeTab}...`}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedItems.length > 0 && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-emerald-700">{selectedItems.length} itens selecionados</span>
              <button 
                onClick={() => setSelectedItems([])}
                className="text-xs text-emerald-600 hover:underline font-medium"
              >
                Limpar seleção
              </button>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'atividades' && (
                <button 
                  onClick={() => { setEditingGroup(null); setGroupCodigo(''); setGroupName(''); setIsGroupModalOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-sm"
                >
                  <FolderKanban size={14} />
                  Agrupar em Novo Grupo
                </button>
              )}
              {activeTab === 'grupos' && (
                <button 
                  onClick={() => { setEditingStage(null); setStageCodigo(''); setStageName(''); setIsStageModalOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-all shadow-sm"
                >
                  <Layers size={14} />
                  Criar Etapa com Grupos
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {activeTab === 'historico' && (
            <div className="p-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 font-bold text-slate-700 text-sm">DATA</th>
                      <th className="px-6 py-4 font-bold text-slate-700 text-sm">USUÁRIO</th>
                      <th className="px-6 py-4 font-bold text-slate-700 text-sm">ITEM</th>
                      <th className="px-6 py-4 font-bold text-slate-700 text-sm">ALTERAÇÃO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(entry.data_alteracao).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                          {entry.usuario_email}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{entry.tipo_item}</span>
                            <span className="text-sm font-bold text-slate-800">{entry.codigo} - {entry.nome}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {entry.descricao_alteracao}
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                          Nenhum registro de histórico encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'hierarquia' && (
            <div className="p-6 space-y-4">
              {stages.length === 0 && (
                <div className="text-center py-12 text-slate-400 italic">
                  <FolderKanban size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Nenhuma etapa cadastrada para exibir a hierarquia.</p>
                </div>
              )}
              {stages.map(stage => {
                const isExpanded = expandedNodes.includes(`stage-${stage.id}`);
                const stageGroups = groups.filter(g => stage.grupos_ids?.split(',').includes(g.id.toString()));
                
                return (
                  <div key={stage.id} className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <div 
                      onClick={() => toggleNode(`stage-${stage.id}`)}
                      className="bg-slate-50 p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                          <ChevronRight size={18} className="text-slate-400" />
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                          {stage.codigo}
                        </div>
                        <span className="font-bold text-slate-800">{stage.nome}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded-lg border border-slate-100">
                        {stageGroups.length} Grupos
                      </span>
                    </div>
                    
                    {isExpanded && (
                      <div className="p-4 pl-12 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        {stageGroups.length === 0 && <p className="text-xs text-slate-400 italic">Nenhum grupo associado</p>}
                        {stageGroups.map(group => {
                          const isGroupExpanded = expandedNodes.includes(`group-${group.id}`);
                          const groupActivities = allParameters.filter(p => group.atividades_ids?.split(',').includes(p.id.toString()));
                          
                          return (
                            <div key={group.id} className="space-y-2">
                              <div 
                                onClick={() => toggleNode(`group-${group.id}`)}
                                className="flex items-center justify-between group cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`transition-transform duration-200 ${isGroupExpanded ? 'rotate-90' : ''}`}>
                                    <ChevronRight size={14} className="text-slate-300" />
                                  </div>
                                  <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px]">
                                    {group.codigo}
                                  </div>
                                  <span className="text-sm font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">{group.nome}</span>
                                </div>
                                <div className="h-px flex-1 bg-slate-50 mx-4" />
                                <span className="text-[9px] font-bold text-slate-300 uppercase">
                                  {groupActivities.length} Atividades
                                </span>
                              </div>
                              
                              {isGroupExpanded && (
                                <div className="pl-8 space-y-2 border-l-2 border-slate-50 ml-1 animate-in slide-in-from-left-2 duration-200">
                                  {groupActivities.length === 0 && <p className="text-[10px] text-slate-400 italic">Nenhuma atividade associada</p>}
                                  {groupActivities.map(param => (
                                    <div key={param.id} className="flex items-center justify-between py-1 group/item">
                                      <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                        <div className="flex flex-col">
                                          <span className="text-xs text-slate-700 font-bold">{param.nome}</span>
                                          <span className="text-[10px] text-slate-400 font-mono">{param.codigo}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4 text-[10px] font-medium text-slate-400 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                        <span>{param.unidade_medida}</span>
                                        <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                          {param.produtividade} {param.unidade_medida}/h
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'atividades' && (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 text-slate-500 text-xs uppercase tracking-wider z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      onChange={(e) => {
                        if (e.target.checked) setSelectedItems(parameters.map(p => p.id));
                        else setSelectedItems([]);
                      }}
                      checked={selectedItems.length === parameters.length && parameters.length > 0}
                    />
                  </th>
                  <th className="px-6 py-4 font-semibold">Código</th>
                  <th className="px-6 py-4 font-semibold">Atividade</th>
                  <th className="px-6 py-4 font-semibold">U.M.</th>
                  <th className="px-6 py-4 font-semibold">Produtividade</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parameters.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                      Nenhuma atividade cadastrada
                    </td>
                  </tr>
                ) : (
                  parameters.map((p) => (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-slate-50/50 transition-colors group ${selectedItems.includes(p.id) ? 'bg-emerald-50/30' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          checked={selectedItems.includes(p.id)}
                          onChange={() => toggleSelection(p.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Activity size={16} />
                          </div>
                        </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                          {p.codigo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Activity size={16} />
                          </div>
                          <span className="font-medium text-slate-700">{p.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{p.unidade_medida}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                          {p.produtividade} {p.unidade_medida}/{p.unidade_tempo.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedActivityForItens(p); fetchActivityItens(p.id); }}
                            title="Gerenciar Serviços"
                            className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                          >
                            <Layers size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCopy(p, 'atividade'); }}
                            title="Copiar"
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          >
                            <Copy size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openModal(p); }}
                            title="Editar"
                            className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(p.id, 'atividade'); }}
                            title="Excluir"
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'grupos' && (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 text-slate-500 text-xs uppercase tracking-wider z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      onChange={(e) => {
                        if (e.target.checked) setSelectedItems(groups.map(g => g.id));
                        else setSelectedItems([]);
                      }}
                      checked={selectedItems.length === groups.length && groups.length > 0}
                    />
                  </th>
                  <th className="px-6 py-4 font-semibold">Código</th>
                  <th className="px-6 py-4 font-semibold">Nome do Grupo</th>
                  <th className="px-6 py-4 font-semibold">Atividades</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                      Nenhum grupo cadastrado
                    </td>
                  </tr>
                ) : (
                  groups.map((g) => (
                    <tr 
                      key={g.id} 
                      className={`hover:bg-slate-50/50 transition-colors group ${selectedItems.includes(g.id) ? 'bg-blue-50/30' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          checked={selectedItems.includes(g.id)}
                          onChange={() => toggleSelection(g.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <FolderKanban size={16} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                          {g.codigo || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <FolderKanban size={16} />
                          </div>
                          <span className="font-medium text-slate-700">{g.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {g.atividades_nomes?.split(',').map((nome, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {nome}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCopy(g, 'grupo'); }}
                            title="Copiar"
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          >
                            <Copy size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openGroupModal(g); }}
                            title="Editar"
                            className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(g.id, 'grupo'); }}
                            title="Excluir"
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'etapas' && (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 text-slate-500 text-xs uppercase tracking-wider z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Código</th>
                  <th className="px-6 py-4 font-semibold">Nome da Etapa</th>
                  <th className="px-6 py-4 font-semibold">Grupos</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                      Nenhuma etapa cadastrada
                    </td>
                  </tr>
                ) : (
                  stages.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                          {s.codigo || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Layers size={16} />
                          </div>
                          <span className="font-medium text-slate-700">{s.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {s.grupos_nomes?.split(',').map((nome, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {nome}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCopy(s, 'etapa'); }}
                            title="Copiar"
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          >
                            <Copy size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openStageModal(s); }}
                            title="Editar"
                            className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(s.id, 'etapa'); }}
                            title="Excluir"
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {activeTab === 'atividades' && (
          <div className="p-4 border-t border-slate-100">
            <Pagination 
              currentPage={currentPage}
              totalItems={totalParameters}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Modal Atividade */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingParam ? 'Editar Atividade' : 'Nova Atividade'}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Código da Atividade</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="Ex: 1.1.1"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome da Atividade</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="Ex: Alvenaria de Vedação"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unidade de Medida</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="Ex: m2, m3, kg"
                    value={formData.unidade_medida}
                    onChange={(e) => setFormData({ ...formData, unidade_medida: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Produtividade por Hora</label>
                  <input 
                    type="number" 
                    step="any"
                    min="0"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="0.00"
                    value={formData.produtividade}
                    onChange={(e) => setFormData({ ...formData, produtividade: e.target.value, unidade_tempo: 'HORA' })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Produtividade Média</label>
                <input 
                  type="number" 
                  step="any"
                  min="0"
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="Ex: 1.5 (Opcional)"
                  value={formData.produtividade_media}
                  onChange={(e) => setFormData({ ...formData, produtividade_media: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Produtividade por Dia (8h)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    readOnly
                    className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl text-slate-500 font-medium cursor-not-allowed"
                    value={formData.produtividade ? (parseFloat(formData.produtividade) * 8).toFixed(2) : '0.00'}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold uppercase">Calculado</span>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Grupo */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingGroup ? 'Editar Grupo' : 'Novo Grupo'}
              </h3>
              <button onClick={closeGroupModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Etapa <span className="text-red-500">*</span></label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                  value={groupEtapaId}
                  onChange={(e) => setGroupEtapaId(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {stages.map(s => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Código do Grupo <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="Ex: 1.1"
                  value={groupCodigo}
                  onChange={(e) => setGroupCodigo(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do Grupo <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="Ex: Infraestrutura"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <MultiSelect 
                  label="Atividades"
                  placeholder="Selecione as atividades..."
                  options={allParameters.map(p => ({ id: p.id, name: p.nome }))}
                  selectedIds={selectedItems}
                  onToggle={toggleSelection}
                />
                <p className="text-[10px] text-slate-400 mt-1">Selecione pelo menos uma atividade <span className="text-red-500">*</span></p>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={closeGroupModal}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateGroup}
                  disabled={loading || !groupName || !groupCodigo || !groupEtapaId || selectedItems.length === 0}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Etapa */}
      {isStageModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingStage ? 'Editar Etapa' : 'Nova Etapa'}
              </h3>
              <button onClick={closeStageModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Código da Etapa <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="Ex: 1"
                  value={stageCodigo}
                  onChange={(e) => setStageCodigo(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome da Etapa <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="Ex: Fundação"
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <MultiSelect 
                  label="Grupos de Serviço"
                  placeholder="Selecione os grupos..."
                  options={allGroups.map(g => ({ id: g.id, name: g.nome }))}
                  selectedIds={selectedItems}
                  onToggle={toggleSelection}
                />
                <p className="text-[10px] text-slate-400 mt-1">Selecione pelo menos um grupo <span className="text-red-500">*</span></p>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={closeStageModal}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateStage}
                  disabled={loading || !stageName || !stageCodigo || selectedItems.length === 0}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Serviços da Atividade */}
      {selectedActivityForItens && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Serviços da Atividade</h2>
                <p className="text-slate-500 text-sm mt-1">{selectedActivityForItens.codigo} - {selectedActivityForItens.nome}</p>
              </div>
              <button 
                onClick={() => setSelectedActivityForItens(null)}
                className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600 shadow-sm"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 flex gap-8">
              {/* Form de Cadastro */}
              <div className="w-1/3 space-y-4">
                <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">
                  {editingItem ? 'Editar Serviço' : 'Novo Serviço'}
                </h3>
                <form onSubmit={handleItemSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Nome do Serviço</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                      value={itemFormData.nome}
                      onChange={(e) => setItemFormData({...itemFormData, nome: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Unidade</label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                        value={itemFormData.unidade_medida}
                        onChange={(e) => setItemFormData({...itemFormData, unidade_medida: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Tempo</label>
                      <select 
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                        value={itemFormData.unidade_tempo}
                        onChange={(e) => setItemFormData({...itemFormData, unidade_tempo: e.target.value})}
                      >
                        <option value="HORA">HORA</option>
                        <option value="DIA">DIA</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Qtd Prod.</label>
                      <input 
                        type="number" 
                        step="any"
                        min="0"
                        required
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                        value={itemFormData.quantidade_produtividade}
                        onChange={(e) => setItemFormData({...itemFormData, quantidade_produtividade: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Valor Parâm.</label>
                      <input 
                        type="number" 
                        step="any"
                        min="0"
                        required
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                        value={itemFormData.valor_parametro}
                        onChange={(e) => setItemFormData({...itemFormData, valor_parametro: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      type="submit"
                      className="flex-1 bg-emerald-500 text-white py-2 rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors"
                    >
                      {editingItem ? 'Salvar' : 'Adicionar'}
                    </button>
                    {editingItem && (
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingItem(null);
                          setItemFormData({
                            nome: '',
                            unidade_medida: '',
                            quantidade_produtividade: '',
                            unidade_tempo: 'HORA',
                            valor_parametro: ''
                          });
                        }}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Lista de Itens */}
              <div className="flex-1 space-y-4">
                <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Serviços Cadastrados</h3>
                <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100/50 border-b border-slate-200">
                        <th className="px-4 py-3 font-bold text-slate-500">NOME</th>
                        <th className="px-4 py-3 font-bold text-slate-500">UNID.</th>
                        <th className="px-4 py-3 font-bold text-slate-500">PROD.</th>
                        <th className="px-4 py-3 font-bold text-slate-500">VALOR</th>
                        <th className="px-4 py-3 font-bold text-slate-500 text-right">AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {activityItens.map(item => (
                        <tr key={item.id} className="hover:bg-white transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-700">{item.nome}</td>
                          <td className="px-4 py-3 text-slate-500">{item.unidade_medida}</td>
                          <td className="px-4 py-3 text-slate-500">{item.quantidade_produtividade} / {item.unidade_tempo}</td>
                          <td className="px-4 py-3 text-slate-500">R$ {item.valor_parametro.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <button 
                                onClick={() => {
                                  setEditingItem(item);
                                  setItemFormData({
                                    nome: item.nome,
                                    unidade_medida: item.unidade_medida,
                                    quantidade_produtividade: item.quantidade_produtividade.toString(),
                                    unidade_tempo: item.unidade_tempo,
                                    valor_parametro: item.valor_parametro.toString()
                                  });
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => handleItemDelete(item.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {activityItens.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">Nenhum serviço cadastrado</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
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
