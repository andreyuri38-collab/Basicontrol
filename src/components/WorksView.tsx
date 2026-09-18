import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Work, Frente, WorkStatus, FrenteStatus } from '../types';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';

export const WorksView: React.FC = () => {
  const {
    works,
    frentes,
    createWork,
    updateWork,
    deleteWork,
    createFrente,
    updateFrente,
    deleteFrente,
    settings,
  } = useApp();
  const { isAdmin } = useAuth();

  const [expandedWorkId, setExpandedWorkId] = useState<string | null>(null);
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | null>(null);

  const [showFrenteModal, setShowFrenteModal] = useState(false);
  const [frenteWorkId, setFrenteWorkId] = useState<string | null>(null);
  const [editingFrente, setEditingFrente] = useState<Frente | null>(null);

  // Work Form State
  const [workForm, setWorkForm] = useState({
    name: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    address: '',
    totalAreaM2: 0,
    contractValue: 0,
    startDate: '',
    endDate: '',
    status: 'em_andamento' as WorkStatus,
    notes: '',
  });

  // Frente Form State
  const [frenteForm, setFrenteForm] = useState({
    name: '',
    areaM2: 0,
    targetProductivityM2PerDay: settings.defaultProductivityM2PerDay || 350,
    startDate: '',
    endDate: '',
    status: 'nao_iniciada' as FrenteStatus,
  });

  const openWorkModal = (work?: Work) => {
    if (work) {
      setEditingWork(work);
      setWorkForm({
        name: work.name,
        clientName: work.clientName,
        clientPhone: work.clientPhone || '',
        clientEmail: work.clientEmail || '',
        address: work.address || '',
        totalAreaM2: work.totalAreaM2,
        contractValue: work.contractValue || 0,
        startDate: work.startDate || '',
        endDate: work.endDate || '',
        status: work.status,
        notes: work.notes || '',
      });
    } else {
      setEditingWork(null);
      const today = new Date().toISOString().split('T')[0];
      setWorkForm({
        name: '',
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        address: '',
        totalAreaM2: 1000,
        contractValue: 45000,
        startDate: today,
        endDate: '',
        status: 'em_andamento',
        notes: '',
      });
    }
    setShowWorkModal(true);
  };

  const handleSaveWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWork) {
      await updateWork(editingWork.id, workForm);
    } else {
      await createWork(workForm);
    }
    setShowWorkModal(false);
  };

  const handleDeleteWork = async (id: string, name: string) => {
    if (confirm(`Deseja realmente excluir ou arquivar a obra "${name}"?`)) {
      await deleteWork(id);
    }
  };

  const openFrenteModal = (workId: string, frente?: Frente) => {
    setFrenteWorkId(workId);
    if (frente) {
      setEditingFrente(frente);
      setFrenteForm({
        name: frente.name,
        areaM2: frente.areaM2,
        targetProductivityM2PerDay: frente.targetProductivityM2PerDay,
        startDate: frente.startDate,
        endDate: frente.endDate,
        status: frente.status,
      });
    } else {
      setEditingFrente(null);
      const today = new Date().toISOString().split('T')[0];
      setFrenteForm({
        name: '',
        areaM2: 500,
        targetProductivityM2PerDay: settings.defaultProductivityM2PerDay || 350,
        startDate: today,
        endDate: '',
        status: 'em_andamento',
      });
    }
    setShowFrenteModal(true);
  };

  const handleSaveFrente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frenteWorkId) return;

    if (editingFrente) {
      await updateFrente(editingFrente.id, frenteForm);
    } else {
      await createFrente({
        ...frenteForm,
        workId: frenteWorkId,
      });
    }
    setShowFrenteModal(false);
  };

  const handleDeleteFrente = async (id: string, name: string) => {
    if (confirm(`Excluir a frente de trabalho "${name}"?`)) {
      await deleteFrente(id);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-500" />
            <span>Cadastro de Clientes e Obras</span>
          </h2>
          <p className="text-xs text-slate-400">
            Gerenciamento de contratos, empreendimentos e frentes de serviço
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => openWorkModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Obra</span>
          </button>
        )}
      </div>

      {/* Works List */}
      {works.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Nenhuma obra cadastrada</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Cadastre a primeira obra ou utilize o botão "Carregar Dados Exemplo" na barra superior.
          </p>
          {isAdmin && (
            <button
              onClick={() => openWorkModal()}
              className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-500 transition"
            >
              Cadastrar Obra Agora
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {works.map((work) => {
            const isExpanded = expandedWorkId === work.id;
            const workFrentes = frentes.filter((f) => f.workId === work.id);
            const totalFrenteArea = workFrentes.reduce((s, f) => s + (Number(f.areaM2) || 0), 0);

            return (
              <div
                key={work.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm transition hover:border-slate-700"
              >
                {/* Main Obra Card Header */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                          {work.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            work.status === 'em_andamento'
                              ? 'bg-blue-500/20 text-blue-300'
                              : work.status === 'concluida'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : work.status === 'orcamento'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {work.status === 'em_andamento'
                            ? 'Em andamento'
                            : work.status === 'concluida'
                            ? 'Concluída'
                            : work.status === 'orcamento'
                            ? 'Orçamento'
                            : 'Cancelada'}
                        </span>
                      </div>

                      <p className="text-xs text-orange-400 font-semibold mb-2">
                        Cliente: {work.clientName}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        {work.address && (
                          <span className="flex items-center gap-1 truncate max-w-xs">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span className="truncate">{work.address}</span>
                          </span>
                        )}
                        {work.clientPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span>{work.clientPhone}</span>
                          </span>
                        )}
                        {work.clientEmail && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span>{work.clientEmail}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Financial and Area Metrics */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Área Contratada</div>
                        <div className="text-base sm:text-lg font-bold text-white">
                          {work.totalAreaM2.toLocaleString('pt-BR')} m²
                        </div>
                        {isAdmin && (
                          <div className="text-xs font-semibold text-emerald-400">
                            {formatCurrency(work.contractValue || 0)}
                          </div>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openWorkModal(work)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Editar Obra"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteWork(work.id, work.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                            title="Excluir Obra"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dates and Notes */}
                  <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Início: {work.startDate ? work.startDate.split('-').reverse().join('/') : '-'}</span>
                      </span>
                      <span>•</span>
                      <span>Término: {work.endDate ? work.endDate.split('-').reverse().join('/') : '-'}</span>
                    </div>

                    <button
                      onClick={() => setExpandedWorkId(isExpanded ? null : work.id)}
                      className="flex items-center gap-1 text-orange-400 hover:text-orange-300 font-semibold transition"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{workFrentes.length} Frentes de Trabalho</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Frentes Sub-section */}
                {isExpanded && (
                  <div className="bg-slate-950/70 border-t border-slate-800 p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Frentes de Trabalho da Obra
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Total alocado nas frentes: {totalFrenteArea.toLocaleString('pt-BR')} m² de{' '}
                          {work.totalAreaM2.toLocaleString('pt-BR')} m²
                        </p>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => openFrenteModal(work.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 text-xs font-semibold transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar Frente</span>
                        </button>
                      )}
                    </div>

                    {workFrentes.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-xs">
                        Nenhuma frente de trabalho cadastrada para esta obra (ex: Torre A, Pav 1-5).
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {workFrentes.map((frente) => (
                          <div
                            key={frente.id}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
                          >
                            <div className="flex items-start justify-between gap-1 mb-1.5">
                              <h5 className="text-sm font-bold text-white truncate">
                                {frente.name}
                              </h5>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  frente.status === 'em_andamento'
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : frente.status === 'concluida'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {frente.status === 'em_andamento'
                                  ? 'Em andamento'
                                  : frente.status === 'concluida'
                                  ? 'Concluída'
                                  : 'Não iniciada'}
                              </span>
                            </div>

                            <div className="space-y-1 text-xs text-slate-300">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Área:</span>
                                <span className="font-semibold">{frente.areaM2} m²</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Meta:</span>
                                <span className="font-semibold text-orange-400">
                                  {frente.targetProductivityM2PerDay} m²/dia
                                </span>
                              </div>
                              <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                                <span>Previsão:</span>
                                <span>
                                  {frente.endDate ? frente.endDate.split('-').reverse().join('/') : '-'}
                                </span>
                              </div>
                            </div>

                            {isAdmin && (
                              <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-slate-800">
                                <button
                                  onClick={() => openFrenteModal(work.id, frente)}
                                  className="p-1 text-slate-400 hover:text-white transition"
                                  title="Editar frente"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFrente(frente.id, frente.name)}
                                  className="p-1 text-slate-400 hover:text-red-400 transition"
                                  title="Excluir frente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Nova / Editar Obra */}
      {showWorkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingWork ? 'Editar Obra / Contrato' : 'Cadastrar Nova Obra'}
              </h3>
              <button
                onClick={() => setShowWorkModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWork} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome da Obra / Empreendimento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Residencial Jardins, Edifício Horizonte"
                  value={workForm.name}
                  onChange={(e) => setWorkForm({ ...workForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cliente / Contratante *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome da construtora ou cliente"
                    value={workForm.clientName}
                    onChange={(e) => setWorkForm({ ...workForm, clientName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Telefone do Cliente
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={workForm.clientPhone}
                    onChange={(e) => setWorkForm({ ...workForm, clientPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-mail do Cliente
                  </label>
                  <input
                    type="email"
                    placeholder="contato@cliente.com"
                    value={workForm.clientEmail}
                    onChange={(e) => setWorkForm({ ...workForm, clientEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status da Obra
                  </label>
                  <select
                    value={workForm.status}
                    onChange={(e) => setWorkForm({ ...workForm, status: e.target.value as WorkStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="orcamento">Orçamento</option>
                    <option value="em_andamento">Em andamento</option>
                    <option value="concluida">Concluída</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Endereço / Localização
                </label>
                <input
                  type="text"
                  placeholder="Rua, Número, Bairro, Cidade - UF"
                  value={workForm.address}
                  onChange={(e) => setWorkForm({ ...workForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Área Total Contratada (m²) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={workForm.totalAreaM2 || ''}
                    onChange={(e) => setWorkForm({ ...workForm, totalAreaM2: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor Total Contrato (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={workForm.contractValue || ''}
                    onChange={(e) => setWorkForm({ ...workForm, contractValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data Início Prevista
                  </label>
                  <input
                    type="date"
                    value={workForm.startDate}
                    onChange={(e) => setWorkForm({ ...workForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data Término Prevista
                  </label>
                  <input
                    type="date"
                    value={workForm.endDate}
                    onChange={(e) => setWorkForm({ ...workForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observações / Especificações
                </label>
                <textarea
                  rows={2}
                  placeholder="Espessura média de autonivelante, bombeamento, tipo de argamassa..."
                  value={workForm.notes}
                  onChange={(e) => setWorkForm({ ...workForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowWorkModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-md shadow-orange-600/20"
                >
                  {editingWork ? 'Salvar Alterações' : 'Cadastrar Obra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nova / Editar Frente */}
      {showFrenteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingFrente ? 'Editar Frente de Trabalho' : 'Nova Frente de Trabalho'}
              </h3>
              <button
                onClick={() => setShowFrenteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFrente} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Identificação da Frente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Torre A - Pav 1 ao 5, Bloco B - Laje 3"
                  value={frenteForm.name}
                  onChange={(e) => setFrenteForm({ ...frenteForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Área da Frente (m²) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={frenteForm.areaM2 || ''}
                    onChange={(e) => setFrenteForm({ ...frenteForm, areaM2: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Meta (m²/dia) *
                  </label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={frenteForm.targetProductivityM2PerDay || ''}
                    onChange={(e) =>
                      setFrenteForm({ ...frenteForm, targetProductivityM2PerDay: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={frenteForm.startDate}
                    onChange={(e) => setFrenteForm({ ...frenteForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Previsão Término *
                  </label>
                  <input
                    type="date"
                    required
                    value={frenteForm.endDate}
                    onChange={(e) => setFrenteForm({ ...frenteForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Status da Frente
                </label>
                <select
                  value={frenteForm.status}
                  onChange={(e) => setFrenteForm({ ...frenteForm, status: e.target.value as FrenteStatus })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="nao_iniciada">Não iniciada</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="concluida">Concluída</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFrenteModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition"
                >
                  Salvar Frente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
