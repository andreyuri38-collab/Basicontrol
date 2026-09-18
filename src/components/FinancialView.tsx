import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { FinancialEntry, FinancialType, FinancialStatus } from '../types';
import {
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Calendar,
  Building2,
  Filter,
  CheckCircle2,
  Clock,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export const FinancialView: React.FC = () => {
  const {
    financialEntries,
    works,
    selectedWorkId,
    createFinancialEntry,
    updateFinancialEntry,
    deleteFinancialEntry,
  } = useApp();
  const { isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'all' | 'receber' | 'pagar'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | FinancialStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null);

  // Form State
  const [finForm, setFinForm] = useState({
    type: 'receber' as FinancialType,
    workId: '',
    category: 'Medição',
    description: '',
    amount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    paymentDate: '',
    status: 'pendente' as FinancialStatus,
    partyName: '',
  });

  // Guard: Admin only
  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">Acesso Restrito</h3>
        <p className="text-xs text-slate-400 mt-1">
          O módulo financeiro é reservado exclusivamente para engenheiros e sócios administradores.
        </p>
      </div>
    );
  }

  // Filtered Financial Entries
  const filteredEntries = useMemo(() => {
    return financialEntries.filter((e) => {
      if (activeTab !== 'all' && e.type !== activeTab) return false;
      if (selectedWorkId !== 'all' && e.workId !== selectedWorkId) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      return true;
    });
  }, [financialEntries, activeTab, selectedWorkId, statusFilter, categoryFilter]);

  // Financial KPI Calculations
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const max30 = new Date();
    max30.setDate(max30.getDate() + 30);
    const max30Str = max30.toISOString().split('T')[0];

    let toReceiveNext30 = 0;
    let toPayNext30 = 0;
    let totalReceived = 0;
    let totalPaid = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    financialEntries.forEach((e) => {
      if (selectedWorkId !== 'all' && e.workId && e.workId !== selectedWorkId) return;

      const amt = Number(e.amount) || 0;

      if (e.type === 'receber') {
        if (e.status === 'recebido') {
          totalReceived += amt;
        } else if (e.dueDate <= max30Str) {
          toReceiveNext30 += amt;
        }
      } else {
        if (e.status === 'pago') {
          totalPaid += amt;
        } else if (e.dueDate <= max30Str) {
          toPayNext30 += amt;
        }
      }

      if (e.status === 'atrasado') {
        overdueCount += 1;
        overdueAmount += amt;
      }
    });

    return {
      toReceiveNext30,
      toPayNext30,
      projectedBalance: toReceiveNext30 - toPayNext30,
      totalReceived,
      totalPaid,
      overdueCount,
      overdueAmount,
    };
  }, [financialEntries, selectedWorkId]);

  const openModal = (entry?: FinancialEntry, defaultType?: FinancialType) => {
    if (entry) {
      setEditingEntry(entry);
      setFinForm({
        type: entry.type,
        workId: entry.workId || '',
        category: entry.category,
        description: entry.description,
        amount: entry.amount,
        dueDate: entry.dueDate,
        paymentDate: entry.paymentDate || '',
        status: entry.status,
        partyName: entry.partyName || '',
      });
    } else {
      setEditingEntry(null);
      const type = defaultType || 'receber';
      setFinForm({
        type,
        workId: selectedWorkId !== 'all' ? selectedWorkId : '',
        category: type === 'receber' ? 'Medição' : 'Material',
        description: '',
        amount: 5000,
        dueDate: new Date().toISOString().split('T')[0],
        paymentDate: '',
        status: 'pendente',
        partyName: '',
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEntry) {
      await updateFinancialEntry(editingEntry.id, finForm);
    } else {
      await createFinancialEntry(finForm);
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este lançamento financeiro?')) {
      await deleteFinancialEntry(id);
    }
  };

  const handleMarkAsDone = async (entry: FinancialEntry) => {
    const isReceber = entry.type === 'receber';
    const newStatus: FinancialStatus = isReceber ? 'recebido' : 'pago';
    const today = new Date().toISOString().split('T')[0];
    await updateFinancialEntry(entry.id, {
      status: newStatus,
      paymentDate: today,
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const categoriesReceber = ['Medição', 'Sinal Contratual', 'Aditivo de Área', 'Outro'];
  const categoriesPagar = [
    'Material (Argamassa/Primer)',
    'Diária de Equipe',
    'Salário / Folha',
    'Manutenção de Bomba',
    'Combustível / Transporte',
    'Equipamentos / EPI',
    'Outro',
  ];

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span>Gestão Financeira e Fluxo de Caixa</span>
          </h2>
          <p className="text-xs text-slate-400">
            Controle de medições de clientes, diárias, materiais e projeção para 30 dias
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openModal(undefined, 'receber')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition active:scale-95 shadow-lg shadow-emerald-600/20"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Novo A Receber</span>
          </button>
          <button
            onClick={() => openModal(undefined, 'pagar')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition active:scale-95 shadow-lg shadow-red-600/20"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Novo A Pagar</span>
          </button>
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* A Receber 30d */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400">A Receber (30 dias)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-400">
            {formatCurrency(metrics.toReceiveNext30)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">medições e parcelas pendentes</p>
        </div>

        {/* A Pagar 30d */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400">A Pagar (30 dias)</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-red-400">
            {formatCurrency(metrics.toPayNext30)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">materiais, diárias e custos</p>
        </div>

        {/* Saldo Projetado */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400">Saldo Projetado</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-extrabold ${
              metrics.projectedBalance >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(metrics.projectedBalance)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">resultado líquido previsto</p>
        </div>

        {/* Itens Atrasados */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400">Títulos Atrasados</span>
            <div
              className={`p-2 rounded-xl ${
                metrics.overdueCount > 0
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-extrabold ${
              metrics.overdueCount > 0 ? 'text-amber-400' : 'text-slate-300'
            }`}
          >
            {metrics.overdueCount} itens
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.overdueCount > 0 ? formatCurrency(metrics.overdueAmount) : 'Nenhum atraso'}
          </p>
        </div>
      </div>

      {/* Filter and Tab Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
        {/* Type Tabs */}
        <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg transition ${
              activeTab === 'all' ? 'bg-orange-600 text-white' : 'text-slate-400'
            }`}
          >
            Todos ({financialEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('receber')}
            className={`px-3 py-1 rounded-lg transition ${
              activeTab === 'receber' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            A Receber ({financialEntries.filter((f) => f.type === 'receber').length})
          </button>
          <button
            onClick={() => setActiveTab('pagar')}
            className={`px-3 py-1 rounded-lg transition ${
              activeTab === 'pagar' ? 'bg-red-600 text-white' : 'text-slate-400'
            }`}
          >
            A Pagar ({financialEntries.filter((f) => f.type === 'pagar').length})
          </button>
        </div>

        {/* Status and Category Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | FinancialStatus)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-orange-500"
            >
              <option value="all">Status: Todos</option>
              <option value="pendente">Pendente</option>
              <option value="atrasado">Atrasado</option>
              <option value="recebido">Recebido</option>
              <option value="pago">Pago</option>
            </select>
          </div>
        </div>
      </div>

      {/* Financial Table / Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            Nenhum lançamento financeiro encontrado com os filtros atuais.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredEntries.map((entry) => {
              const parentWork = works.find((w) => w.id === entry.workId);
              const isReceber = entry.type === 'receber';
              const isSettled = entry.status === 'recebido' || entry.status === 'pago';

              return (
                <div
                  key={entry.id}
                  className="p-4 hover:bg-slate-800/40 transition flex flex-wrap items-center justify-between gap-3"
                >
                  {/* Left info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isReceber
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      {isReceber ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isReceber
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-red-500/15 text-red-400'
                          }`}
                        >
                          {entry.category}
                        </span>
                        <h4 className="text-sm font-bold text-white tracking-tight truncate">
                          {entry.description}
                        </h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
                        {entry.partyName && (
                          <span className="text-slate-300 font-medium">
                            {isReceber ? 'Cliente: ' : 'Favorecido: '}
                            {entry.partyName}
                          </span>
                        )}
                        {parentWork && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Building2 className="w-3 h-3 text-slate-500" />
                            <span>{parentWork.name}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>Vencimento: {entry.dueDate.split('-').reverse().join('/')}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Amount & Status */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div
                        className={`text-base font-extrabold ${
                          isReceber ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isReceber ? '+' : '-'}
                        {formatCurrency(entry.amount)}
                      </div>

                      {/* Status Tag */}
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mt-0.5 ${
                          entry.status === 'atrasado'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : entry.status === 'recebido' || entry.status === 'pago'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-amber-300 border border-slate-700'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {!isSettled && (
                        <button
                          onClick={() => handleMarkAsDone(entry)}
                          className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-950/60 transition"
                          title={isReceber ? 'Marcar como Recebido' : 'Marcar como Pago'}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openModal(entry)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Editar lançamento"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Lançamento Financeiro */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingEntry
                  ? 'Editar Lançamento Financeiro'
                  : finForm.type === 'receber'
                  ? 'Novo Conta a Receber'
                  : 'Novo Conta a Pagar'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFinForm({ ...finForm, type: 'receber', category: 'Medição' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    finForm.type === 'receber'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>A Receber (Cliente)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFinForm({ ...finForm, type: 'pagar', category: 'Material' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    finForm.type === 'pagar'
                      ? 'bg-red-950/60 border-red-500 text-red-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>A Pagar (Despesa/Equipe)</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrição do Lançamento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 1ª Medição Torre A, Diárias Semana 38, Carga de Argamassa..."
                  value={finForm.description}
                  onChange={(e) => setFinForm({ ...finForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={finForm.amount || ''}
                    onChange={(e) => setFinForm({ ...finForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={finForm.category}
                    onChange={(e) => setFinForm({ ...finForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    {(finForm.type === 'receber' ? categoriesReceber : categoriesPagar).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {finForm.type === 'receber' ? 'Cliente / Contratante' : 'Favorecido / Fornecedor'}
                  </label>
                  <input
                    type="text"
                    placeholder="Nome da empresa ou prestador"
                    value={finForm.partyName}
                    onChange={(e) => setFinForm({ ...finForm, partyName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Obra Vinculada (opcional)
                  </label>
                  <select
                    value={finForm.workId}
                    onChange={(e) => setFinForm({ ...finForm, workId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Nenhuma / Despesa Geral</option>
                    {works.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data de Vencimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={finForm.dueDate}
                    onChange={(e) => setFinForm({ ...finForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={finForm.status}
                    onChange={(e) => setFinForm({ ...finForm, status: e.target.value as FinancialStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="atrasado">Atrasado</option>
                    <option value="recebido">Recebido</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>
              </div>

              {(finForm.status === 'recebido' || finForm.status === 'pago') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data Efetiva do Pagamento / Recebimento
                  </label>
                  <input
                    type="date"
                    value={finForm.paymentDate}
                    onChange={(e) => setFinForm({ ...finForm, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-md shadow-orange-600/20"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
