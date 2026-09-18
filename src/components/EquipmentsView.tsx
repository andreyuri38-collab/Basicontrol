import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Equipment,
  EquipmentCategory,
  EquipmentOwnership,
  EquipmentStatus,
} from '../types';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
  Truck,
  DollarSign,
  Layers,
  X,
  ShieldAlert,
} from 'lucide-react';

export const EquipmentsView: React.FC = () => {
  const { equipments, createEquipment, updateEquipment, deleteEquipment } = useApp();
  const { isAdmin } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwnership, setFilterOwnership] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [showModal, setShowModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    code: '',
    category: 'bombeamento' as EquipmentCategory,
    ownership: 'proprio' as EquipmentOwnership,
    status: 'disponivel' as EquipmentStatus,
    supplierOrRentalCompany: '',
    rentalDailyCost: '',
    costResponsibilityDefault: 'contratado' as 'contratado' | 'contratante',
    notes: '',
  });

  // Filtered equipments
  const filteredEquipments = useMemo(() => {
    return equipments.filter((eq) => {
      const matchesSearch =
        eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (eq.code && eq.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (eq.supplierOrRentalCompany &&
          eq.supplierOrRentalCompany.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesOwnership =
        filterOwnership === 'all' || eq.ownership === filterOwnership;

      const matchesCategory =
        filterCategory === 'all' || eq.category === filterCategory;

      const matchesStatus =
        filterStatus === 'all' || eq.status === filterStatus;

      return matchesSearch && matchesOwnership && matchesCategory && matchesStatus;
    });
  }, [equipments, searchTerm, filterOwnership, filterCategory, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = equipments.length;
    const proprios = equipments.filter((e) => e.ownership === 'proprio').length;
    const locados = equipments.filter((e) => e.ownership === 'locado').length;
    const terceirizados = equipments.filter((e) => e.ownership === 'terceirizado').length;
    const bombeamento = equipments.filter((e) => e.category === 'bombeamento').length;
    const emOperacao = equipments.filter((e) => e.status === 'em_uso').length;

    return { total, proprios, locados, terceirizados, bombeamento, emOperacao };
  }, [equipments]);

  const handleOpenModal = (eq?: Equipment) => {
    if (eq) {
      setEditingEquipment(eq);
      setForm({
        name: eq.name,
        code: eq.code || '',
        category: eq.category,
        ownership: eq.ownership,
        status: eq.status,
        supplierOrRentalCompany: eq.supplierOrRentalCompany || '',
        rentalDailyCost: eq.rentalDailyCost ? String(eq.rentalDailyCost) : '',
        costResponsibilityDefault: eq.costResponsibilityDefault || 'contratado',
        notes: eq.notes || '',
      });
    } else {
      setEditingEquipment(null);
      setForm({
        name: '',
        code: '',
        category: 'bombeamento',
        ownership: 'proprio',
        status: 'disponivel',
        supplierOrRentalCompany: '',
        rentalDailyCost: '',
        costResponsibilityDefault: 'contratado',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEquipment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const data: Omit<Equipment, 'id' | 'createdAt'> = {
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      category: form.category,
      ownership: form.ownership,
      status: form.status,
      supplierOrRentalCompany:
        form.ownership !== 'proprio' && form.supplierOrRentalCompany.trim()
          ? form.supplierOrRentalCompany.trim()
          : undefined,
      rentalDailyCost:
        form.rentalDailyCost && !isNaN(Number(form.rentalDailyCost))
          ? Number(form.rentalDailyCost)
          : undefined,
      costResponsibilityDefault:
        form.ownership === 'terceirizado' ? form.costResponsibilityDefault : undefined,
      notes: form.notes.trim() || undefined,
    };

    if (editingEquipment) {
      await updateEquipment(editingEquipment.id, data);
    } else {
      await createEquipment(data);
    }

    handleCloseModal();
  };

  const handleDelete = async (eq: Equipment) => {
    if (window.confirm(`Deseja realmente excluir o equipamento "${eq.name}"?`)) {
      await deleteEquipment(eq.id);
    }
  };

  // Helper Labels & Badges
  const getCategoryLabel = (cat: EquipmentCategory) => {
    switch (cat) {
      case 'bombeamento':
        return 'Equipamento de Bombeamento';
      case 'misturador':
        return 'Misturador / Turbomix';
      case 'laser_nivel':
        return 'Nível a Laser';
      case 'gerador':
        return 'Gerador de Energia';
      case 'veiculo':
        return 'Veículo / Transporte';
      default:
        return 'Outro Equipamento';
    }
  };

  const getOwnershipBadge = (own: EquipmentOwnership) => {
    switch (own) {
      case 'proprio':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            PRÓPRIO
          </span>
        );
      case 'locado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <Building className="w-3 h-3" />
            LOCADO
          </span>
        );
      case 'terceirizado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Truck className="w-3 h-3" />
            TERCEIRIZADO
          </span>
        );
    }
  };

  const getStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case 'disponivel':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
            Disponível
          </span>
        );
      case 'em_uso':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-orange-950/60 text-orange-300 border border-orange-800/80">
            Em Operação
          </span>
        );
      case 'manutencao':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-950/60 text-red-300 border border-red-800/80">
            Em Manutenção
          </span>
        );
      case 'inativo':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Inativo
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-['Space_Grotesk']">
                Equipamentos & Maquinário
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Gestão de bombas, misturadores, geradores e maquinários próprios, locados ou terceirizados
              </p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-600/25 active:scale-98 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Equipamento</span>
          </button>
        )}
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <p className="text-[11px] font-medium text-slate-400">Total Cadastrado</p>
          <p className="text-xl font-black text-white mt-1">{stats.total}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-slate-400">Próprios</p>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-400 mt-1">{stats.proprios}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-slate-400">Locados</p>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <p className="text-xl font-black text-blue-400 mt-1">{stats.locados}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-slate-400">Terceirizados</p>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-400 mt-1">{stats.terceirizados}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-slate-400">Bombas</p>
            <Layers className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <p className="text-xl font-black text-orange-400 mt-1">{stats.bombeamento}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-slate-400">Em Operação</p>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-xl font-black text-white mt-1">{stats.emOperacao}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, código patrimonial (TAG) ou locadora..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        {/* Ownership Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <select
            value={filterOwnership}
            onChange={(e) => setFilterOwnership(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="all">Propriedade: Todos</option>
            <option value="proprio">Apenas Próprios</option>
            <option value="locado">Apenas Locados</option>
            <option value="terceirizado">Apenas Terceirizados</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="all">Categoria: Todas</option>
            <option value="bombeamento">Bombas de Projeção</option>
            <option value="misturador">Misturadores</option>
            <option value="laser_nivel">Níveis a Laser</option>
            <option value="gerador">Geradores</option>
            <option value="veiculo">Veículos</option>
            <option value="outro">Outros</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="all">Status: Todos</option>
            <option value="disponivel">Disponível</option>
            <option value="em_uso">Em Operação</option>
            <option value="manutencao">Manutenção</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </div>

      {/* Equipments Grid */}
      {filteredEquipments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800">
          <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Nenhum equipamento encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {equipments.length === 0
              ? 'Nenhum equipamento foi cadastrado ainda. Adicione as bombas de projeção, misturadores ou geradores da sua empresa.'
              : 'Nenhum equipamento corresponde aos filtros aplicados.'}
          </p>
          {isAdmin && equipments.length === 0 && (
            <button
              onClick={() => handleOpenModal()}
              className="mt-4 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition"
            >
              Cadastrar Primeiro Equipamento
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipments.map((eq) => (
            <div
              key={eq.id}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-xl relative overflow-hidden group"
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getOwnershipBadge(eq.ownership)}
                    {getStatusBadge(eq.status)}
                  </div>
                  {eq.code && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold">
                      {eq.code}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white leading-snug group-hover:text-orange-400 transition">
                  {eq.name}
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  {getCategoryLabel(eq.category)}
                </p>

                {/* Specifics for Terceirizado / Locado */}
                {(eq.ownership === 'locado' || eq.ownership === 'terceirizado') && (
                  <div className="mt-3.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                    {eq.supplierOrRentalCompany && (
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-500" />
                          Fornecedor / Locadora:
                        </span>
                        <span className="font-semibold text-white">{eq.supplierOrRentalCompany}</span>
                      </div>
                    )}

                    {eq.rentalDailyCost !== undefined && (
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                          Custo Diário:
                        </span>
                        <span className="font-bold text-emerald-400">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(eq.rentalDailyCost)}
                        </span>
                      </div>
                    )}

                    {eq.ownership === 'terceirizado' && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-850 text-slate-300">
                        <span className="text-slate-400">Responsável Custo:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            eq.costResponsibilityDefault === 'contratante'
                              ? 'bg-purple-950/70 text-purple-300 border border-purple-800'
                              : 'bg-orange-950/70 text-orange-300 border border-orange-800'
                          }`}
                        >
                          {eq.costResponsibilityDefault === 'contratante'
                            ? 'CONTRATANTE (Cliente)'
                            : 'CONTRATADO (Nossa Empresa)'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {eq.notes && (
                  <p className="mt-3 text-xs text-slate-400 italic bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                    {eq.notes}
                  </p>
                )}
              </div>

              {/* Actions */}
              {isAdmin && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenModal(eq)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs font-semibold px-2.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(eq)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 transition"
                      title="Excluir equipamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick Status toggle */}
                  <select
                    value={eq.status}
                    onChange={(e) =>
                      updateEquipment(eq.id, { status: e.target.value as EquipmentStatus })
                    }
                    className="text-[11px] px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="em_uso">Em Operação</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
                  <Wrench className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-white">
                  {editingEquipment ? 'Editar Equipamento' : 'Novo Cadastro de Equipamento'}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Equipamento / Modelo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bomba de Projeção Putzmeister P13 ou Turbomix TM-200"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Código Patrimonial / TAG / Placa
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: BP-01, TM-02"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as EquipmentCategory })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="bombeamento">Equipamento de Bombeamento</option>
                    <option value="misturador">Misturador Contínuo / Turbomix</option>
                    <option value="laser_nivel">Nível a Laser / Precisão</option>
                    <option value="gerador">Gerador de Energia</option>
                    <option value="veiculo">Veículo / Caminhão</option>
                    <option value="outro">Outro Maquinário</option>
                  </select>
                </div>
              </div>

              {/* Ownership Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tipo de Propriedade *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, ownership: 'proprio' })}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      form.ownership === 'proprio'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>PRÓPRIO</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, ownership: 'locado' })}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      form.ownership === 'locado'
                        ? 'bg-blue-950/60 border-blue-500 text-blue-300 shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building className="w-4 h-4 text-blue-400" />
                    <span>LOCADO</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, ownership: 'terceirizado' })}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      form.ownership === 'terceirizado'
                        ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-amber-400" />
                    <span>TERCEIRIZADO</span>
                  </button>
                </div>
              </div>

              {/* Conditional Fields for Locado / Terceirizado */}
              {(form.ownership === 'locado' || form.ownership === 'terceirizado') && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Empresa Fornecedora / Locadora
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: MaxiBombas, LocaMáquinas"
                        value={form.supplierOrRentalCompany}
                        onChange={(e) =>
                          setForm({ ...form, supplierOrRentalCompany: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Custo Estimado (R$ / diária ou evento)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={form.rentalDailyCost}
                        onChange={(e) => setForm({ ...form, rentalDailyCost: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Terceirizado: Custo do Contratado ou Contratante */}
                  {form.ownership === 'terceirizado' && (
                    <div className="pt-2 border-t border-slate-800">
                      <label className="block text-xs font-bold text-amber-300 mb-1.5">
                        De quem é o custo do bombeamento terceirizado? *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setForm({ ...form, costResponsibilityDefault: 'contratado' })
                          }
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                            form.costResponsibilityDefault === 'contratado'
                              ? 'bg-orange-950/60 border-orange-500 text-orange-200'
                              : 'bg-slate-850 border-slate-750 text-slate-400'
                          }`}
                        >
                          <div className="font-bold">CONTRATADO</div>
                          <div className="text-[10px] text-slate-400">Nossa empresa paga</div>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setForm({ ...form, costResponsibilityDefault: 'contratante' })
                          }
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                            form.costResponsibilityDefault === 'contratante'
                              ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                              : 'bg-slate-850 border-slate-750 text-slate-400'
                          }`}
                        >
                          <div className="font-bold">CONTRATANTE</div>
                          <div className="text-[10px] text-slate-400">Cliente / Construtora paga</div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Status Operacional *
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as EquipmentStatus })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="disponivel">Disponível para Obras</option>
                  <option value="em_uso">Em Operação / Alocado em Obra</option>
                  <option value="manutencao">Em Manutenção Preventiva / Corretiva</option>
                  <option value="inativo">Inativo / Desmobilizado</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observações Técnicas / Acessórios
                </label>
                <textarea
                  rows={2}
                  placeholder="Especificações: vazão máxima m³/h, bitola de mangotes, voltagem ou combustível..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/20 active:scale-98 transition"
                >
                  {editingEquipment ? 'Salvar Alterações' : 'Cadastrar Equipamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
