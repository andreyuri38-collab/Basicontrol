import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ProductivityLog, FrenteStats } from '../types';
import {
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Camera,
  Layers,
  Calendar,
  Users,
  Image as ImageIcon,
  X,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react';

interface ProductivityViewProps {
  initialOpenModal?: boolean;
  onModalClosed?: () => void;
}

export const ProductivityView: React.FC<ProductivityViewProps> = ({
  initialOpenModal = false,
  onModalClosed,
}) => {
  const {
    productivityLogs,
    frentes,
    works,
    employees,
    frenteStatsList,
    selectedWorkId,
    createProductivityLog,
    updateProductivityLog,
    deleteProductivityLog,
  } = useApp();
  const { profile, isAdmin } = useAuth();

  const [showModal, setShowModal] = useState(initialOpenModal);
  const [editingLog, setEditingLog] = useState<ProductivityLog | null>(null);
  const [selectedFrenteFilter, setSelectedFrenteFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'critical' | 'completion' | 'name'>('critical');

  // Form State for Daily Pointing
  const [logForm, setLogForm] = useState({
    date: new Date().toISOString().split('T')[0],
    workId: '',
    frenteId: '',
    m2Executed: 350,
    presentEmployeeIds: [] as string[],
    notes: '',
    photoUrl: '',
  });

  // Allowed frentes for Campo
  const allowedFrentes = useMemo(() => {
    if (profile?.role === 'campo' && profile.assignedFrenteIds && profile.assignedFrenteIds.length > 0) {
      return frentes.filter((f) => profile.assignedFrenteIds?.includes(f.id));
    }
    return frentes;
  }, [frentes, profile]);

  // Filtered & Sorted Frentes Stats
  const sortedFrenteStats = useMemo(() => {
    let list = frenteStatsList;
    if (selectedWorkId !== 'all') {
      list = list.filter((s) => s.frente.workId === selectedWorkId);
    }
    if (selectedFrenteFilter !== 'all') {
      list = list.filter((s) => s.frente.id === selectedFrenteFilter);
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'critical') {
        // Critical: delayed first, then behind rhythm, then completion %
        if (a.isDelayed && !b.isDelayed) return -1;
        if (!a.isDelayed && b.isDelayed) return 1;
        if (a.isBehindRhythm && !b.isBehindRhythm) return -1;
        if (!a.isBehindRhythm && b.isBehindRhythm) return 1;
        return b.delayDays - a.delayDays;
      }
      if (sortBy === 'completion') {
        return b.completionPercent - a.completionPercent;
      }
      return a.frente.name.localeCompare(b.frente.name);
    });
  }, [frenteStatsList, selectedWorkId, selectedFrenteFilter, sortBy]);

  // Productivity Logs filtered
  const filteredLogs = useMemo(() => {
    return productivityLogs.filter((l) => {
      if (selectedWorkId !== 'all' && l.workId !== selectedWorkId) return false;
      if (selectedFrenteFilter !== 'all' && l.frenteId !== selectedFrenteFilter) return false;
      if (profile?.role === 'campo' && profile.assignedFrenteIds && profile.assignedFrenteIds.length > 0) {
        return profile.assignedFrenteIds.includes(l.frenteId);
      }
      return true;
    });
  }, [productivityLogs, selectedWorkId, selectedFrenteFilter, profile]);

  const openModal = (log?: ProductivityLog) => {
    if (log) {
      setEditingLog(log);
      setLogForm({
        date: log.date,
        workId: log.workId,
        frenteId: log.frenteId,
        m2Executed: log.m2Executed,
        presentEmployeeIds: log.presentEmployeeIds || [],
        notes: log.notes || '',
        photoUrl: log.photoUrl || '',
      });
    } else {
      setEditingLog(null);
      const defaultWork = works[0]?.id || '';
      const defaultFrente = frentes.find((f) => f.workId === defaultWork)?.id || frentes[0]?.id || '';
      setLogForm({
        date: new Date().toISOString().split('T')[0],
        workId: defaultWork,
        frenteId: defaultFrente,
        m2Executed: 350,
        presentEmployeeIds: [],
        notes: '',
        photoUrl: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (onModalClosed) onModalClosed();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.workId || !logForm.frenteId) {
      alert('Selecione a obra e a frente de trabalho');
      return;
    }

    if (editingLog) {
      await updateProductivityLog(editingLog.id, logForm);
    } else {
      await createProductivityLog(logForm);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este apontamento?')) {
      await deleteProductivityLog(id);
    }
  };

  const toggleEmp = (empId: string) => {
    setLogForm((prev) => {
      const exists = prev.presentEmployeeIds.includes(empId);
      return {
        ...prev,
        presentEmployeeIds: exists
          ? prev.presentEmployeeIds.filter((id) => id !== empId)
          : [...prev.presentEmployeeIds, empId],
      };
    });
  };

  // Handle Photo selection/capture (base64 simulation or preview)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogForm((prev) => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // CSV Export for Admin
  const handleExportCSV = () => {
    const rows = [
      ['Data', 'Obra', 'Frente', 'M2 Executados', 'Colaboradores Presentes', 'Observações'],
      ...filteredLogs.map((l) => [
        l.date,
        works.find((w) => w.id === l.workId)?.name || '',
        frentes.find((f) => f.id === l.frenteId)?.name || '',
        l.m2Executed.toString(),
        l.presentEmployeeIds
          .map((id) => employees.find((e) => e.id === id)?.name || '')
          .filter(Boolean)
          .join('; '),
        `"${(l.notes || '').replace(/"/g, '""')}"`,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `apontamentos_produtividade_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <span>Produtividade e Prazos por Frente</span>
          </h2>
          <p className="text-xs text-slate-400">
            Apontamento diário, recálculo de prazo com ritmo real e alertas de atraso
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && filteredLogs.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition"
              title="Exportar CSV de apontamentos"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
          )}

          <button
            onClick={() => openModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Apontamento</span>
          </button>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-semibold">Filtrar Frente:</span>
          <select
            value={selectedFrenteFilter}
            onChange={(e) => setSelectedFrenteFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="all">Todas as Frentes ({allowedFrentes.length})</option>
            {allowedFrentes.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400 font-semibold">Ordenar por:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'critical' | 'completion' | 'name')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="critical">🚨 Mais Críticas no Topo</option>
            <option value="completion">% Conclusão (Maior)</option>
            <option value="name">Nome da Frente</option>
          </select>
        </div>
      </div>

      {/* Section 1: Dashboard de Frentes com Progresso e Recálculo de Término */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-orange-500" />
          <span>Status das Frentes e Projeção de Prazo Real</span>
        </h3>

        {sortedFrenteStats.length === 0 ? (
          <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-400">
            Nenhuma frente encontrada para os filtros selecionados.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sortedFrenteStats.map((stat) => {
              const {
                frente,
                work,
                totalExecutedM2,
                remainingM2,
                completionPercent,
                daysWithWork,
                avgProductivityM2PerDay,
                estimatedCompletionDate,
                originalEndDate,
                isDelayed,
                isBehindRhythm,
                delayDays,
              } = stat;

              return (
                <div
                  key={frente.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition shadow-sm ${
                    isDelayed
                      ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-red-950/20 border-red-900/60'
                      : isBehindRhythm
                      ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/20 border-amber-900/50'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  {/* Card Top */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[11px] font-bold text-orange-400 block truncate">
                        {work?.name || 'Obra Geral'}
                      </span>
                      <h4 className="text-base font-extrabold text-white tracking-tight">
                        {frente.name}
                      </h4>
                    </div>

                    {/* Visual Status Indicator */}
                    {isDelayed ? (
                      <span className="px-2.5 py-1 rounded-lg bg-red-950/90 border border-red-800 text-red-300 text-xs font-extrabold flex items-center gap-1.5 animate-pulse">
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span>Atraso estimado: +{delayDays} dias</span>
                      </span>
                    ) : isBehindRhythm ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-950/90 border border-amber-800 text-amber-300 text-xs font-extrabold flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span>Ritmo Abaixo da Meta</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-800 text-emerald-300 text-xs font-extrabold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>No Prazo</span>
                      </span>
                    )}
                  </div>

                  {/* Progress Metric Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-semibold">
                        {totalExecutedM2.toLocaleString('pt-BR')} m² aplicados de{' '}
                        {frente.areaM2.toLocaleString('pt-BR')} m²
                      </span>
                      <span className="text-base font-extrabold text-orange-400">
                        {completionPercent}%
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isDelayed
                            ? 'bg-gradient-to-r from-red-600 to-red-500'
                            : isBehindRhythm
                            ? 'bg-gradient-to-r from-amber-600 to-amber-500'
                            : 'bg-gradient-to-r from-orange-600 to-emerald-500'
                        }`}
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                      <span>Restam {remainingM2.toLocaleString('pt-BR')} m²</span>
                      <span>{daysWithWork} dias de aplicação registrados</span>
                    </div>
                  </div>

                  {/* Productivity Rate & Projection Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase">Meta da Frente</span>
                      <strong className="text-white text-sm">
                        {frente.targetProductivityM2PerDay}
                      </strong>{' '}
                      <span className="text-[10px] text-slate-400">m²/dia</span>
                    </div>

                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase">Ritmo Real Médio</span>
                      <strong
                        className={`text-sm ${
                          avgProductivityM2PerDay < frente.targetProductivityM2PerDay
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {avgProductivityM2PerDay}
                      </strong>{' '}
                      <span className="text-[10px] text-slate-400">m²/dia</span>
                    </div>

                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase">Prazo Contratado</span>
                      <strong className="text-slate-300 text-xs">
                        {originalEndDate ? originalEndDate.split('-').reverse().join('/') : '-'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase">Previsão Recalculada</span>
                      <strong
                        className={`text-xs ${
                          isDelayed ? 'text-red-400 font-extrabold' : 'text-emerald-400'
                        }`}
                      >
                        {estimatedCompletionDate
                          ? estimatedCompletionDate.split('-').reverse().join('/')
                          : '-'}
                      </strong>
                    </div>
                  </div>

                  {/* Quick Action */}
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => {
                        setLogForm((prev) => ({
                          ...prev,
                          workId: frente.workId,
                          frenteId: frente.id,
                        }));
                        setShowModal(true);
                      }}
                      className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Apontar Produção Nesta Frente</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Histórico de Apontamentos Diários */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span>Histórico de Apontamentos de Campo</span>
            </h3>
            <p className="text-xs text-slate-400">
              Registros diários de m² aplicados, equipes e ocorrências
            </p>
          </div>
          <span className="text-xs text-slate-400">{filteredLogs.length} registros</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            Nenhum apontamento registrado para os filtros selecionados.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const parentWork = works.find((w) => w.id === log.workId);
              const parentFrente = frentes.find((f) => f.id === log.frenteId);
              const presentEmps = employees.filter((e) => log.presentEmployeeIds?.includes(e.id));

              return (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-750 hover:border-slate-700 transition"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="px-2.5 py-1 rounded-lg bg-orange-600/20 text-orange-400 border border-orange-500/30 text-xs font-mono font-bold">
                        {log.date.split('-').reverse().join('/')}
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {parentWork?.name}
                        </span>
                        <h5 className="text-sm font-bold text-white">{parentFrente?.name}</h5>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-base font-extrabold text-emerald-400">
                          +{Number(log.m2Executed).toLocaleString('pt-BR')} m²
                        </span>
                        <span className="text-[10px] text-slate-400 block">aplicados</span>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openModal(log)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg transition"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {log.notes && (
                    <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 mb-2">
                      <strong className="text-orange-400">Ocorrência: </strong>
                      {log.notes}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1 border-t border-slate-750">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>Equipe ({presentEmps.length}): </span>
                      <span className="text-slate-300">
                        {presentEmps.map((e) => e.name).join(', ') || 'Não especificada'}
                      </span>
                    </div>

                    {log.photoUrl && (
                      <div className="flex items-center gap-1 text-orange-400 text-[11px] font-semibold">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Foto registrada</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Formulário de Apontamento Diário */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingLog ? 'Editar Apontamento de Campo' : 'Apontamento Diário de Produtividade'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Data da Aplicação *
                </label>
                <input
                  type="date"
                  required
                  value={logForm.date}
                  onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Obra *
                  </label>
                  <select
                    required
                    value={logForm.workId}
                    onChange={(e) => {
                      const newWorkId = e.target.value;
                      const nextFrente = frentes.find((f) => f.workId === newWorkId)?.id || '';
                      setLogForm({ ...logForm, workId: newWorkId, frenteId: nextFrente });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Selecione a obra...</option>
                    {works.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Frente de Trabalho *
                  </label>
                  <select
                    required
                    value={logForm.frenteId}
                    onChange={(e) => setLogForm({ ...logForm, frenteId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Selecione a frente...</option>
                    {allowedFrentes
                      .filter((f) => !logForm.workId || f.workId === logForm.workId)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.areaM2} m²)
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Área Executada */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Área Executada no Dia (m²) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ex: 380"
                    value={logForm.m2Executed || ''}
                    onChange={(e) => setLogForm({ ...logForm, m2Executed: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-base font-bold text-emerald-400 focus:outline-none focus:border-orange-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    m²
                  </span>
                </div>
              </div>

              {/* Equipe Presente */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Equipe Presente no Dia
                </label>
                {employees.filter((e) => e.status === 'ativo').length === 0 ? (
                  <p className="text-xs text-slate-500">Nenhum colaborador ativo cadastrado.</p>
                ) : (
                  <div className="max-h-32 overflow-y-auto space-y-1 rounded-xl bg-slate-950 p-2 border border-slate-800">
                    {employees
                      .filter((e) => e.status === 'ativo')
                      .map((emp) => {
                        const isSelected = logForm.presentEmployeeIds.includes(emp.id);
                        return (
                          <div
                            key={emp.id}
                            onClick={() => toggleEmp(emp.id)}
                            className={`p-1.5 px-2 rounded-lg text-xs cursor-pointer flex items-center justify-between border transition ${
                              isSelected
                                ? 'bg-orange-950/40 border-orange-500/60 text-orange-200'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span className="font-semibold text-white truncate">{emp.name}</span>
                            <span
                              className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                                isSelected ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              {isSelected ? '✓' : ''}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Ocorrências / Observações */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ocorrências / Observações (Chuva, Bomba, Falta de Material, etc.)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Aplicação no 4º andar concluída sem intercorrências. Bomba com fluxo regular."
                  value={logForm.notes}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {/* Registro Fotográfico (Câmera / Arquivo) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Registro Fotográfico do Andamento
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-300 cursor-pointer transition">
                    <Camera className="w-4 h-4 text-orange-400" />
                    <span>Tirar Foto / Galeria</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {logForm.photoUrl && (
                    <div className="flex items-center gap-2">
                      <img
                        src={logForm.photoUrl}
                        alt="Foto do dia"
                        className="w-10 h-10 rounded-lg object-cover border border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={() => setLogForm((prev) => ({ ...prev, photoUrl: '' }))}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-md shadow-orange-600/20"
                >
                  Salvar Apontamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
