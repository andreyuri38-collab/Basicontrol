import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Schedule,
  PumpingEquipmentType,
  PumpingCostResponsibility,
} from '../types';
import {
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Users,
  Layers,
  Clock,
  Building2,
  X,
  Wrench,
  Truck,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';

interface ScheduleViewProps {
  initialOpenModal?: boolean;
  onModalClosed?: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  initialOpenModal = false,
  onModalClosed,
}) => {
  const {
    schedules,
    frentes,
    works,
    employees,
    equipments,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    selectedWorkId,
  } = useApp();
  const { profile } = useAuth();

  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('weekly');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showModal, setShowModal] = useState(initialOpenModal);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Form State
  const [schForm, setSchForm] = useState({
    date: new Date().toISOString().split('T')[0],
    workId: '',
    frenteId: '',
    activity: 'Aplicação de autonivelante bombeado',
    assignedEmployeeIds: [] as string[],
    pumpingEquipmentType: 'proprio' as PumpingEquipmentType,
    pumpingEquipmentId: '',
    pumpingCostResponsibility: 'contratado' as PumpingCostResponsibility,
    pumpingSupplier: '',
    pumpingCost: '',
    notes: '',
  });

  // Allowed frentes for Campo
  const allowedFrentes = useMemo(() => {
    if (profile?.role === 'campo' && profile.assignedFrenteIds && profile.assignedFrenteIds.length > 0) {
      return frentes.filter((f) => profile.assignedFrenteIds?.includes(f.id));
    }
    return frentes;
  }, [frentes, profile]);

  // Current Date String
  const currentDateStr = useMemo(() => {
    return currentDate.toISOString().split('T')[0];
  }, [currentDate]);

  // Week days calculation (Monday to Saturday)
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startOfWeek.setDate(diff);

    const days: Date[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  const weekDayStrings = useMemo(() => {
    return weekDays.map((d) => d.toISOString().split('T')[0]);
  }, [weekDays]);

  // Schedules filtered by selected work
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (selectedWorkId !== 'all' && s.workId !== selectedWorkId) return false;
      if (profile?.role === 'campo' && profile.assignedFrenteIds && profile.assignedFrenteIds.length > 0) {
        return profile.assignedFrenteIds.includes(s.frenteId);
      }
      return true;
    });
  }, [schedules, selectedWorkId, profile]);

  // Conflict detection: Same employee assigned to more than 1 schedule on the same day!
  const employeeConflicts = useMemo(() => {
    const conflictsByDateAndEmp: { [key: string]: string[] } = {}; // "date_empId" -> [scheduleId, ...]

    schedules.forEach((sch) => {
      sch.assignedEmployeeIds.forEach((empId) => {
        const key = `${sch.date}_${empId}`;
        if (!conflictsByDateAndEmp[key]) {
          conflictsByDateAndEmp[key] = [];
        }
        conflictsByDateAndEmp[key].push(sch.id);
      });
    });

    const conflictSet = new Set<string>(); // Set of scheduleIds with conflicts
    Object.entries(conflictsByDateAndEmp).forEach(([_, schIds]) => {
      if (schIds.length > 1) {
        schIds.forEach((id) => conflictSet.add(id));
      }
    });

    return conflictSet;
  }, [schedules]);

  // Navigation handlers
  const handlePrev = () => {
    const newD = new Date(currentDate);
    if (viewMode === 'daily') {
      newD.setDate(newD.getDate() - 1);
    } else {
      newD.setDate(newD.getDate() - 7);
    }
    setCurrentDate(newD);
  };

  const handleNext = () => {
    const newD = new Date(currentDate);
    if (viewMode === 'daily') {
      newD.setDate(newD.getDate() + 1);
    } else {
      newD.setDate(newD.getDate() + 7);
    }
    setCurrentDate(newD);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const openModal = (sch?: Schedule, prefillDate?: string) => {
    if (sch) {
      setEditingSchedule(sch);
      setSchForm({
        date: sch.date,
        workId: sch.workId,
        frenteId: sch.frenteId,
        activity: sch.activity,
        assignedEmployeeIds: sch.assignedEmployeeIds || [],
        pumpingEquipmentType: sch.pumpingEquipmentType || 'proprio',
        pumpingEquipmentId: sch.pumpingEquipmentId || '',
        pumpingCostResponsibility: sch.pumpingCostResponsibility || 'contratado',
        pumpingSupplier: sch.pumpingSupplier || '',
        pumpingCost: sch.pumpingCost ? String(sch.pumpingCost) : '',
        notes: sch.notes || '',
      });
    } else {
      setEditingSchedule(null);
      const defaultWork = works[0]?.id || '';
      const defaultFrente = frentes.find((f) => f.workId === defaultWork)?.id || frentes[0]?.id || '';
      const defaultOwnPump = equipments.find(
        (e) => e.category === 'bombeamento' && e.ownership === 'proprio'
      );
      setSchForm({
        date: prefillDate || currentDateStr,
        workId: defaultWork,
        frenteId: defaultFrente,
        activity: 'Aplicação de autonivelante bombeado',
        assignedEmployeeIds: [],
        pumpingEquipmentType: defaultOwnPump ? 'proprio' : 'nenhum',
        pumpingEquipmentId: defaultOwnPump?.id || '',
        pumpingCostResponsibility: 'contratado',
        pumpingSupplier: '',
        pumpingCost: '',
        notes: '',
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
    if (!schForm.workId || !schForm.frenteId) {
      alert('Selecione a obra e a frente de trabalho');
      return;
    }

    const payload = {
      date: schForm.date,
      workId: schForm.workId,
      frenteId: schForm.frenteId,
      activity: schForm.activity,
      assignedEmployeeIds: schForm.assignedEmployeeIds,
      pumpingEquipmentType: schForm.pumpingEquipmentType,
      pumpingEquipmentId:
        schForm.pumpingEquipmentType !== 'nenhum' && schForm.pumpingEquipmentId
          ? schForm.pumpingEquipmentId
          : undefined,
      pumpingCostResponsibility:
        schForm.pumpingEquipmentType === 'terceirizado'
          ? schForm.pumpingCostResponsibility
          : undefined,
      pumpingSupplier:
        schForm.pumpingEquipmentType === 'terceirizado' && schForm.pumpingSupplier.trim()
          ? schForm.pumpingSupplier.trim()
          : undefined,
      pumpingCost:
        schForm.pumpingEquipmentType === 'terceirizado' &&
        schForm.pumpingCost &&
        !isNaN(Number(schForm.pumpingCost))
          ? Number(schForm.pumpingCost)
          : undefined,
      notes: schForm.notes.trim() || undefined,
    };

    if (editingSchedule) {
      await updateSchedule(editingSchedule.id, payload);
    } else {
      await createSchedule(payload);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este item da programação?')) {
      await deleteSchedule(id);
    }
  };

  const toggleEmp = (empId: string) => {
    setSchForm((prev) => {
      const exists = prev.assignedEmployeeIds.includes(empId);
      return {
        ...prev,
        assignedEmployeeIds: exists
          ? prev.assignedEmployeeIds.filter((id) => id !== empId)
          : [...prev.assignedEmployeeIds, empId],
      };
    });
  };

  // Activity Presets for self-leveling screed
  const activityPresets = [
    'Aplicação de primer e selador acrílico',
    'Aplicação de autonivelante bombeado',
    'Cura e liberação de tráfego leve',
    'Lixamento e acabamento superficial',
    'Locação de níveis a laser e tripés',
    'Instalação de junta de dilatação e manta acústica',
  ];

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-orange-500" />
            <span>Programação Operacional</span>
          </h2>
          <p className="text-xs text-slate-400">
            Cronograma diário e semanal por frentes com detecção de conflito de equipes
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Daily / Weekly View Switcher */}
          <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1 rounded-lg transition ${
                viewMode === 'weekly' ? 'bg-orange-600 text-white' : 'text-slate-400'
              }`}
            >
              Semanal (Grade)
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1 rounded-lg transition ${
                viewMode === 'daily' ? 'bg-orange-600 text-white' : 'text-slate-400'
              }`}
            >
              Diário
            </button>
          </div>

          {/* New Schedule Button */}
          <button
            onClick={() => openModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Programação</span>
          </button>
        </div>
      </div>

      {/* Date Navigator Bar */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            Hoje
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center font-bold text-xs sm:text-sm text-white">
          {viewMode === 'daily' ? (
            <span>
              {currentDate.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          ) : (
            <span>
              Semana de {weekDays[0]?.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}{' '}
              a {weekDays[5]?.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="hidden sm:inline">
            {filteredSchedules.length} atividades cadastradas
          </span>
        </div>
      </div>

      {/* Weekly Grid View */}
      {viewMode === 'weekly' && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {weekDays.map((dayDate, idx) => {
            const dayStr = dayDate.toISOString().split('T')[0];
            const isToday = dayStr === new Date().toISOString().split('T')[0];
            const daySchedules = filteredSchedules.filter((s) => s.date === dayStr);

            return (
              <div
                key={dayStr}
                className={`flex flex-col rounded-2xl border p-3 min-h-[360px] transition ${
                  isToday
                    ? 'bg-slate-900/90 border-orange-500/50 ring-1 ring-orange-500/20'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      {dayDate.toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </span>
                    <span className={`text-sm font-extrabold ${isToday ? 'text-orange-400' : 'text-white'}`}>
                      {dayDate.getDate()} {dayDate.toLocaleDateString('pt-BR', { month: 'short' })}
                    </span>
                  </div>
                  <button
                    onClick={() => openModal(undefined, dayStr)}
                    className="p-1 rounded-lg text-slate-500 hover:text-orange-400 hover:bg-slate-800 transition"
                    title={`Adicionar em ${dayStr}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Day Schedules Cards */}
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {daySchedules.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center p-4 text-[11px] text-slate-600">
                      Sem programação
                    </div>
                  ) : (
                    daySchedules.map((sch) => {
                      const parentWork = works.find((w) => w.id === sch.workId);
                      const parentFrente = frentes.find((f) => f.id === sch.frenteId);
                      const assignedEmps = employees.filter((e) =>
                        sch.assignedEmployeeIds.includes(e.id)
                      );
                      const hasConflict = employeeConflicts.has(sch.id);

                      return (
                        <div
                          key={sch.id}
                          className={`p-2.5 rounded-xl border text-left transition group relative ${
                            hasConflict
                              ? 'bg-red-950/40 border-red-800/80 shadow-sm shadow-red-900/20'
                              : 'bg-slate-800/80 border-slate-750 hover:border-slate-700'
                          }`}
                        >
                          {/* Conflict Alert Banner */}
                          {hasConflict && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-red-400 mb-1.5 pb-1 border-b border-red-800/50">
                              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                              <span>Conflito: Equipe duplicada hoje!</span>
                            </div>
                          )}

                          <div className="flex items-start justify-between gap-1 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 truncate">
                              {parentWork?.name || 'Obra'}
                            </span>
                            <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                              <button
                                onClick={() => openModal(sch)}
                                className="p-0.5 text-slate-400 hover:text-white"
                                title="Editar"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(sch.id)}
                                className="p-0.5 text-slate-400 hover:text-red-400"
                                title="Excluir"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <h5 className="text-xs font-bold text-white mb-1">
                            {parentFrente?.name || 'Frente Geral'}
                          </h5>

                          <p className="text-[11px] text-slate-300 leading-snug line-clamp-2 mb-2">
                            {sch.activity}
                          </p>

                          {/* Pumping Equipment Badge in Weekly Card */}
                          <div className="mb-2">
                            {sch.pumpingEquipmentType === 'proprio' && (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800/80">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                <span>Bomba Própria</span>
                                {(() => {
                                  const eq = equipments.find((e) => e.id === sch.pumpingEquipmentId);
                                  return eq ? <span className="text-emerald-400 font-mono">({eq.code || eq.name})</span> : null;
                                })()}
                              </div>
                            )}

                            {sch.pumpingEquipmentType === 'terceirizado' && (
                              <div className="space-y-1">
                                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950/70 text-amber-300 border border-amber-800/80">
                                  <Truck className="w-2.5 h-2.5 text-amber-400" />
                                  <span>Bomba Terceirizada</span>
                                </div>
                                <div
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded inline-block ${
                                    sch.pumpingCostResponsibility === 'contratante'
                                      ? 'bg-purple-950/80 text-purple-300 border border-purple-800/70'
                                      : 'bg-orange-950/80 text-orange-300 border border-orange-800/70'
                                  }`}
                                >
                                  Custo: {sch.pumpingCostResponsibility === 'contratante' ? 'CONTRATANTE' : 'CONTRATADO'}
                                </div>
                              </div>
                            )}

                            {sch.pumpingEquipmentType === 'nenhum' && (
                              <span className="text-[9px] text-slate-500 italic block">
                                Sem bombeamento
                              </span>
                            )}
                          </div>

                          {/* Team assigned */}
                          <div className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-700/60 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-500" />
                              <span>{assignedEmps.length} colaboradores</span>
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Daily Detailed View */}
      {viewMode === 'daily' && (
        <div className="space-y-3">
          {filteredSchedules.filter((s) => s.date === currentDateStr).length === 0 ? (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <CalendarDays className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                Nenhuma atividade programada para este dia.
              </p>
              <button
                onClick={() => openModal(undefined, currentDateStr)}
                className="mt-3 px-3.5 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-500 transition"
              >
                Adicionar Programação
              </button>
            </div>
          ) : (
            filteredSchedules
              .filter((s) => s.date === currentDateStr)
              .map((sch) => {
                const parentWork = works.find((w) => w.id === sch.workId);
                const parentFrente = frentes.find((f) => f.id === sch.frenteId);
                const assignedEmps = employees.filter((e) => sch.assignedEmployeeIds.includes(e.id));
                const hasConflict = employeeConflicts.has(sch.id);

                return (
                  <div
                    key={sch.id}
                    className={`p-4 rounded-2xl border transition ${
                      hasConflict
                        ? 'bg-red-950/30 border-red-800/80'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div>
                        {hasConflict && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-900/60 border border-red-700 text-red-300 text-xs font-bold mb-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                            <span>Atenção: Conflito de escalação de equipe nesta data!</span>
                          </div>
                        )}
                        <span className="text-xs font-bold text-orange-400 block">
                          {parentWork?.name}
                        </span>
                        <h4 className="text-base font-bold text-white">{parentFrente?.name}</h4>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openModal(sch)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sch.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-750 text-sm text-slate-200 mb-3">
                      <strong>Atividade: </strong>
                      {sch.activity}
                    </div>

                    {/* Equipamento de Bombeamento no Card Diário */}
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-orange-400" />
                          Equipamento de Bombeamento:
                        </span>
                        {sch.pumpingEquipmentType === 'proprio' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            PRÓPRIO
                          </span>
                        )}
                        {sch.pumpingEquipmentType === 'terceirizado' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700 flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            TERCEIRIZADO
                          </span>
                        )}
                        {sch.pumpingEquipmentType === 'nenhum' && (
                          <span className="text-[10px] text-slate-500 italic">
                            Não se aplica (sem bomba)
                          </span>
                        )}
                      </div>

                      {sch.pumpingEquipmentType === 'proprio' && (
                        <p className="text-xs text-slate-300 font-medium mt-1">
                          {(() => {
                            const eq = equipments.find((e) => e.id === sch.pumpingEquipmentId);
                            return eq ? (
                              <span>
                                Bomba: <strong className="text-white">{eq.name}</strong> {eq.code ? `[TAG: ${eq.code}]` : ''}
                              </span>
                            ) : (
                              <span className="text-slate-400">Bomba Própria Operacional</span>
                            );
                          })()}
                        </p>
                      )}

                      {sch.pumpingEquipmentType === 'terceirizado' && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="text-slate-400">Fornecedor: </span>
                            <strong className="text-white">
                              {sch.pumpingSupplier || 'Não informado'}
                            </strong>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Responsável Custo:</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                sch.pumpingCostResponsibility === 'contratante'
                                  ? 'bg-purple-900/80 text-purple-200 border border-purple-700'
                                  : 'bg-orange-900/80 text-orange-200 border border-orange-700'
                              }`}
                            >
                              {sch.pumpingCostResponsibility === 'contratante'
                                ? 'CONTRATANTE (Cliente / Construtora)'
                                : 'CONTRATADO (Nossa Empresa)'}
                            </span>
                            {sch.pumpingCost !== undefined && (
                              <span className="font-bold text-emerald-400 text-xs">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(sch.pumpingCost)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {sch.notes && (
                      <p className="text-xs text-slate-400 mb-3 italic">
                        <strong>Obs: </strong>
                        {sch.notes}
                      </p>
                    )}

                    {/* Team Members */}
                    <div>
                      <div className="text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-orange-500" />
                        <span>Equipe Escalada ({assignedEmps.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {assignedEmps.map((emp) => (
                          <div
                            key={emp.id}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            <span>{emp.name}</span>
                            <span className="text-[10px] text-slate-500">({emp.role})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Modal: Programação Diária */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingSchedule ? 'Editar Programação' : 'Nova Programação de Trabalho'}
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
                  Data da Atividade *
                </label>
                <input
                  type="date"
                  required
                  value={schForm.date}
                  onChange={(e) => setSchForm({ ...schForm, date: e.target.value })}
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
                    value={schForm.workId}
                    onChange={(e) => {
                      const newWorkId = e.target.value;
                      const nextFrente = frentes.find((f) => f.workId === newWorkId)?.id || '';
                      setSchForm({ ...schForm, workId: newWorkId, frenteId: nextFrente });
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
                    value={schForm.frenteId}
                    onChange={(e) => setSchForm({ ...schForm, frenteId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Selecione a frente...</option>
                    {allowedFrentes
                      .filter((f) => !schForm.workId || f.workId === schForm.workId)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.areaM2} m²)
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Atividade */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Atividade Programada *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aplicação de autonivelante bombeado"
                  value={schForm.activity}
                  onChange={(e) => setSchForm({ ...schForm, activity: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500 mb-1.5"
                />
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1">
                  {activityPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSchForm({ ...schForm, activity: preset })}
                      className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 hover:border-orange-500 text-[10px] text-slate-400 hover:text-white transition"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Funcionários Escalados */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Escalar Colaboradores para esta Frente
                </label>
                {employees.filter((e) => e.status === 'ativo').length === 0 ? (
                  <p className="text-xs text-slate-500">Nenhum colaborador ativo cadastrado.</p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 rounded-xl bg-slate-950 p-2.5 border border-slate-800">
                    {employees
                      .filter((e) => e.status === 'ativo')
                      .map((emp) => {
                        const isSelected = schForm.assignedEmployeeIds.includes(emp.id);
                        return (
                          <div
                            key={emp.id}
                            onClick={() => toggleEmp(emp.id)}
                            className={`p-2 rounded-lg text-xs cursor-pointer flex items-center justify-between border transition ${
                              isSelected
                                ? 'bg-orange-950/40 border-orange-500/60 text-orange-200'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div>
                              <span className="font-semibold text-white block">{emp.name}</span>
                              <span className="text-[10px] text-slate-400">{emp.role}</span>
                            </div>
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

              {/* Equipamento de Bombeamento (Próprio vs Terceirizado) */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-orange-400" />
                      Equipamento de Bombeamento *
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Argamassa / Contrapiso Autonivelante
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSchForm({
                          ...schForm,
                          pumpingEquipmentType: 'proprio',
                          pumpingEquipmentId:
                            equipments.find(
                              (e) => e.category === 'bombeamento' && e.ownership === 'proprio'
                            )?.id || '',
                        })
                      }
                      className={`py-2 px-2 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                        schForm.pumpingEquipmentType === 'proprio'
                          ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>PRÓPRIO</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSchForm({
                          ...schForm,
                          pumpingEquipmentType: 'terceirizado',
                          pumpingCostResponsibility: schForm.pumpingCostResponsibility || 'contratante',
                        })
                      }
                      className={`py-2 px-2 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                        schForm.pumpingEquipmentType === 'terceirizado'
                          ? 'bg-amber-950/70 border-amber-500 text-amber-300 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5 text-amber-400" />
                      <span>TERCEIRIZADO</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSchForm({
                          ...schForm,
                          pumpingEquipmentType: 'nenhum',
                          pumpingEquipmentId: '',
                        })
                      }
                      className={`py-2 px-2 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                        schForm.pumpingEquipmentType === 'nenhum'
                          ? 'bg-slate-800 border-slate-600 text-slate-200 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>NÃO APLICA</span>
                    </button>
                  </div>
                </div>

                {/* Sub-form: PRÓPRIO */}
                {schForm.pumpingEquipmentType === 'proprio' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Selecionar Bomba Própria da Empresa
                    </label>
                    <select
                      value={schForm.pumpingEquipmentId}
                      onChange={(e) =>
                        setSchForm({ ...schForm, pumpingEquipmentId: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="">Selecione um equipamento próprio...</option>
                      {equipments
                        .filter((e) => e.ownership === 'proprio')
                        .map((eq) => (
                          <option key={eq.id} value={eq.id}>
                            {eq.name} {eq.code ? `[${eq.code}]` : ''} - {eq.status.toUpperCase()}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Sub-form: TERCEIRIZADO */}
                {schForm.pumpingEquipmentType === 'terceirizado' && (
                  <div className="space-y-3 pt-2 border-t border-slate-850">
                    <div>
                      <label className="block text-xs font-bold text-amber-300 mb-1.5">
                        Responsabilidade do Custo do Bombeamento: *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSchForm({ ...schForm, pumpingCostResponsibility: 'contratado' })
                          }
                          className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                            schForm.pumpingCostResponsibility === 'contratado'
                              ? 'bg-orange-950/70 border-orange-500 text-orange-200'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>CONTRATADO</span>
                            {schForm.pumpingCostResponsibility === 'contratado' && (
                              <span className="w-2 h-2 rounded-full bg-orange-400" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Custo por conta da nossa empresa
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setSchForm({ ...schForm, pumpingCostResponsibility: 'contratante' })
                          }
                          className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                            schForm.pumpingCostResponsibility === 'contratante'
                              ? 'bg-purple-950/70 border-purple-500 text-purple-200'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>CONTRATANTE</span>
                            {schForm.pumpingCostResponsibility === 'contratante' && (
                              <span className="w-2 h-2 rounded-full bg-purple-400" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Faturado para o cliente / construtora
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Empresa Terceirizada / Bombeadora
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: MaxiBombas Concreto & Argamassa"
                          value={schForm.pumpingSupplier}
                          onChange={(e) =>
                            setSchForm({ ...schForm, pumpingSupplier: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Valor Estimado / Custo (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 3200.00"
                          value={schForm.pumpingCost}
                          onChange={(e) =>
                            setSchForm({ ...schForm, pumpingCost: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observações / Recomendações
                </label>
                <textarea
                  rows={2}
                  placeholder="Instruções para o caminhão betoneira, estacionamento da bomba..."
                  value={schForm.notes}
                  onChange={(e) => setSchForm({ ...schForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500 resize-none"
                />
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
                  Salvar Programação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
