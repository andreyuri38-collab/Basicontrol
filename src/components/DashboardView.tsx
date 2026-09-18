import React, { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { NavTab } from './Navigation';
import {
  TrendingUp,
  AlertTriangle,
  Building2,
  CalendarDays,
  DollarSign,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  Wrench,
  Truck,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenNewProductivity: () => void;
  onOpenNewSchedule: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenNewProductivity,
  onOpenNewSchedule,
}) => {
  const {
    works,
    frentes,
    equipments,
    productivityLogs,
    financialEntries,
    frenteStatsList,
    selectedWorkId,
  } = useApp();
  const { isAdmin } = useAuth();

  // Filter stats by selectedWorkId
  const filteredFrenteStats = useMemo(() => {
    if (selectedWorkId === 'all') return frenteStatsList;
    return frenteStatsList.filter((s) => s.frente.workId === selectedWorkId);
  }, [frenteStatsList, selectedWorkId]);

  // Weekly productivity calculation (last 7 days)
  const weeklyM2 = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const minDateStr = sevenDaysAgo.toISOString().split('T')[0];

    return productivityLogs
      .filter((l) => {
        if (selectedWorkId !== 'all' && l.workId !== selectedWorkId) return false;
        return l.date >= minDateStr;
      })
      .reduce((sum, l) => sum + (Number(l.m2Executed) || 0), 0);
  }, [productivityLogs, selectedWorkId]);

  // Active frentes count
  const activeFrentesCount = useMemo(() => {
    return filteredFrenteStats.filter((s) => s.frente.status === 'em_andamento').length;
  }, [filteredFrenteStats]);

  // Delayed or behind rhythm frentes
  const criticalFrentes = useMemo(() => {
    return filteredFrenteStats.filter((s) => s.isDelayed || s.isBehindRhythm);
  }, [filteredFrenteStats]);

  // Financial 30 days summary (for Admin)
  const financialSummary = useMemo(() => {
    if (!isAdmin) return null;

    const todayStr = new Date().toISOString().split('T')[0];
    const next30Date = new Date();
    next30Date.setDate(next30Date.getDate() + 30);
    const max30Str = next30Date.toISOString().split('T')[0];

    const toReceive = financialEntries
      .filter((f) => f.type === 'receber' && f.status !== 'recebido' && f.dueDate <= max30Str)
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    const toPay = financialEntries
      .filter((f) => f.type === 'pagar' && f.status !== 'pago' && f.dueDate <= max30Str)
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    const overdueCount = financialEntries.filter((f) => f.status === 'atrasado').length;

    return {
      toReceive,
      toPay,
      projectedBalance: toReceive - toPay,
      overdueCount,
    };
  }, [financialEntries, isAdmin]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-5">
      {/* Mobile Quick Action Floating / Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-xl shadow-orange-700/20">
        <div>
          <h2 className="text-base sm:text-lg font-bold">Apontamento Rápido em Campo</h2>
          <p className="text-xs text-orange-100">
            Lance m² executados, equipe presente e fotos em poucos toques
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewProductivity}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-orange-700 font-bold text-xs shadow hover:bg-orange-50 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Apontar Produção</span>
          </button>
          <button
            onClick={onOpenNewSchedule}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-800/60 hover:bg-orange-800 text-white font-medium text-xs border border-white/20 active:scale-95 transition"
          >
            <CalendarDays className="w-4 h-4" />
            <span>Programar</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Frentes Ativas */}
        <div
          onClick={() => onNavigate('works')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Frentes Ativas</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {activeFrentesCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            de {filteredFrenteStats.length} frentes cadastradas
          </p>
        </div>

        {/* Card 2: Produtividade da Semana */}
        <div
          onClick={() => onNavigate('productivity')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Produção da Semana</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
            {weeklyM2.toLocaleString('pt-BR')}{' '}
            <span className="text-sm font-normal text-slate-400">m²</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">últimos 7 dias executados</p>
        </div>

        {/* Card 3: Alertas de Atraso / Ritmo */}
        <div
          onClick={() => onNavigate('productivity')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Alertas de Ritmo</span>
            <div
              className={`p-2 rounded-xl ${
                criticalFrentes.length > 0
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold ${
              criticalFrentes.length > 0 ? 'text-amber-400' : 'text-slate-100'
            }`}
          >
            {criticalFrentes.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {criticalFrentes.length === 0
              ? 'Todas as frentes no prazo'
              : 'frentes exigem atenção'}
          </p>
        </div>

        {/* Card 4: Financeiro Projetado (Admin Only) or Programação Hoje */}
        {isAdmin && financialSummary ? (
          <div
            onClick={() => onNavigate('financial')}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Saldo 30 Dias</span>
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-xl sm:text-2xl font-extrabold truncate ${
                financialSummary.projectedBalance >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {formatCurrency(financialSummary.projectedBalance)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              +{formatCurrency(financialSummary.toReceive)} / -{formatCurrency(financialSummary.toPay)}
            </p>
          </div>
        ) : (
          <div
            onClick={() => onNavigate('schedules')}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Obras Ativas</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {works.filter((w) => w.status === 'em_andamento').length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">em execução contínua</p>
          </div>
        )}
      </div>

      {/* Main Content Sections: Active Frentes Status Table + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Frentes em Andamento com % e Alertas */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-500" />
                <span>Andamento das Frentes de Trabalho</span>
              </h3>
              <p className="text-xs text-slate-400">
                Acompanhamento de avanço em m² e recálculo de prazo real
              </p>
            </div>
            <button
              onClick={() => onNavigate('productivity')}
              className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
            >
              <span>Ver Gráficos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {filteredFrenteStats.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Nenhuma frente de trabalho cadastrada ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFrenteStats.map((stat) => {
                const {
                  frente,
                  work,
                  totalExecutedM2,
                  completionPercent,
                  isDelayed,
                  isBehindRhythm,
                  avgProductivityM2PerDay,
                  estimatedCompletionDate,
                  delayDays,
                } = stat;

                return (
                  <div
                    key={frente.id}
                    className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-750 hover:border-slate-700 transition"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 block">
                          {work?.name || 'Obra Geral'}
                        </span>
                        <h4 className="text-sm font-bold text-white">{frente.name}</h4>
                      </div>

                      {/* Status & Alert Badge */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isDelayed ? (
                          <span className="px-2 py-0.5 rounded-md bg-red-950/80 border border-red-800/80 text-red-300 text-[11px] font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-400" />
                            <span>Atraso estimado: +{delayDays}d</span>
                          </span>
                        ) : isBehindRhythm ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-800/80 text-amber-300 text-[11px] font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>Ritmo abaixo da meta</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>No prazo</span>
                          </span>
                        )}

                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            frente.status === 'em_andamento'
                              ? 'bg-blue-500/20 text-blue-300'
                              : frente.status === 'concluida'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {frente.status === 'em_andamento'
                            ? 'Em andamento'
                            : frente.status === 'concluida'
                            ? 'Concluída'
                            : 'Não iniciada'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2.5">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">
                          {totalExecutedM2.toLocaleString('pt-BR')} m² de{' '}
                          {frente.areaM2.toLocaleString('pt-BR')} m²
                        </span>
                        <span className="font-bold text-orange-400">{completionPercent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isDelayed
                              ? 'bg-red-500'
                              : isBehindRhythm
                              ? 'bg-amber-500'
                              : 'bg-orange-500'
                          }`}
                          style={{ width: `${completionPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Productivity Rate & Projection Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-700/60">
                      <div>
                        <span>Meta Diária: </span>
                        <strong className="text-slate-200">
                          {frente.targetProductivityM2PerDay} m²/dia
                        </strong>
                      </div>
                      <div>
                        <span>Ritmo Real Médio: </span>
                        <strong
                          className={
                            avgProductivityM2PerDay < frente.targetProductivityM2PerDay
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }
                        >
                          {avgProductivityM2PerDay} m²/dia
                        </strong>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span>Previsão Recalculada: </span>
                        <strong className={isDelayed ? 'text-red-400' : 'text-slate-200'}>
                          {estimatedCompletionDate
                            ? estimatedCompletionDate.split('-').reverse().join('/')
                            : '-'}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Info & Alerts */}
        <div className="space-y-4">
          {/* Financial Highlights if Admin */}
          {isAdmin && financialSummary && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Fluxo Financeiro (30 dias)</span>
                </h3>
                <button
                  onClick={() => onNavigate('financial')}
                  className="text-xs text-orange-400 hover:text-orange-300 font-semibold"
                >
                  Ver Tudo
                </button>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-750">
                  <span className="text-xs text-slate-300">A Receber</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {formatCurrency(financialSummary.toReceive)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-750">
                  <span className="text-xs text-slate-300">A Pagar</span>
                  <span className="text-sm font-bold text-red-400">
                    {formatCurrency(financialSummary.toPay)}
                  </span>
                </div>

                {financialSummary.overdueCount > 0 && (
                  <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/70 text-red-300 text-xs flex items-center justify-between font-medium">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span>Itens Atrasados</span>
                    </span>
                    <span className="font-bold px-2 py-0.5 rounded bg-red-900 text-red-200">
                      {financialSummary.overdueCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Equipment Quick Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-orange-400" />
                <span>Equipamentos & Bombeamento</span>
              </h3>
              <button
                onClick={() => onNavigate('equipments')}
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
              >
                <span>Gerenciar</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-750">
                <span className="text-[10px] text-slate-400 block font-medium">Próprios</span>
                <span className="text-sm font-bold text-emerald-400">
                  {equipments.filter((e) => e.ownership === 'proprio').length}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-750">
                <span className="text-[10px] text-slate-400 block font-medium">Locados</span>
                <span className="text-sm font-bold text-blue-400">
                  {equipments.filter((e) => e.ownership === 'locado').length}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-750">
                <span className="text-[10px] text-slate-400 block font-medium">Terceirizados</span>
                <span className="text-sm font-bold text-amber-400">
                  {equipments.filter((e) => e.ownership === 'terceirizado').length}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Bombas de projeção e contrapiso autonivelante registradas com controle de propriedade e custos.
            </p>
          </div>

          {/* Guidelines / Operational Quick Guide */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-2.5">
              <CalendarDays className="w-4 h-4 text-orange-500" />
              <span>Controle Operacional</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Mantenha o apontamento de produtividade diário atualizado para que o cálculo de
              previsão de término seja recalculado em tempo real com base no ritmo efetivo da
              equipe em campo.
            </p>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Meta padrão: 350 m²/dia bombeado</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Alerta visual quando ritmo &lt; meta</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Alerta crítico quando previsão &gt; contrato</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
