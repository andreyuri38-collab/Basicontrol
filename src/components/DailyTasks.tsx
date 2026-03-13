import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Activity, 
  Home, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ChevronRight,
  Filter,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { Pagination } from './Pagination';
import { ConfirmationModal } from './ConfirmationModal';

interface Employee {
  id: number;
  name: string;
  role: string;
}

interface Activity {
  id: number;
  nome_atividade: string;
  unidade_medida: string;
}

interface Environment {
  id: number;
  nome_ambiente: string;
  nome_pavimento: string;
}

interface Execution {
  id: number;
  data_execucao: string;
  funcionario_nome: string;
  nome_atividade: string;
  nome_ambiente: string;
  quantidade_executada: number;
  observacoes: string;
  created_at: string;
}

export default function DailyTasks() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [totalExecutions, setTotalExecutions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [formData, setFormData] = useState({
    data_execucao: format(new Date(), 'yyyy-MM-dd'),
    funcionario_id: '',
    atividade_id: '',
    ambiente_id: '',
    quantidade_executada: '',
    observacoes: ''
  });

  useEffect(() => {
    fetchData();
    fetchExecutions(currentPage);
  }, [filterDate, currentPage]);

  const fetchData = async () => {
    const [empRes, actRes, envRes] = await Promise.all([
      fetch('/api/v2/employees?status=Ativo&limit=1000'),
      fetch('/api/atividades?limit=1000'),
      fetch('/api/ambientes?limit=1000')
    ]);
    const empData = await empRes.json();
    const actData = await actRes.json();
    const envData = await envRes.json();
    setEmployees(empData.data || []);
    setActivities(actData.data || []);
    setEnvironments(envData.data || []);
  };

  const fetchExecutions = async (page: number) => {
    const res = await fetch(`/api/execucao-diaria?data=${filterDate}&page=${page}&limit=${itemsPerPage}`);
    const data = await res.json();
    setExecutions(data.data);
    setTotalExecutions(data.total);
  };

  const handleDelete = (id: number) => {
    setConfirmConfig({
      title: 'Excluir Registro de Execução?',
      message: 'Deseja realmente excluir este registro de execução? O progresso no ambiente será revertido. Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/execucao-diaria/${id}`, {
            method: 'DELETE',
            headers: { 'x-user-role': 'admin' }
          });
          if (res.ok) {
            fetchExecutions(currentPage);
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
    setIsConfirmOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/execucao-diaria', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': 'admin'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          ...formData,
          funcionario_id: '',
          atividade_id: '',
          ambiente_id: '',
          quantidade_executada: '',
          observacoes: ''
        });
        fetchExecutions(currentPage);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Execução Diária (Tarefas)</h2>
          <p className="text-slate-500">Registre a produção diária da equipe</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="date" 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-bold shadow-lg shadow-emerald-500/20"
          >
            <Plus size={20} />
            Lançar Tarefa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Execution List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-700">Registros do Dia</h3>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">
                {executions.length} Tarefas
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {executions.map(ex => (
                <div key={ex.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{ex.funcionario_nome}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                          <Activity size={12} /> {ex.nome_atividade}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                          <Home size={12} /> {ex.nome_ambiente}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">{ex.quantidade_executada}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Executado</p>
                    </div>
                    <button 
                      onClick={() => handleDelete(ex.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Excluir Registro"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {executions.length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Clock size={32} />
                  </div>
                  <p className="text-slate-400 font-medium">Nenhuma tarefa registrada para este dia</p>
                </div>
              )}
            </div>
            <Pagination 
              currentPage={currentPage}
              totalItems={totalExecutions}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        {/* Summary / Integration Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-500" /> Integrações Ativas
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-900">Parâmetros Construtivos</p>
                  <p className="text-[10px] text-emerald-700">Abatimento automático de saldo e avanço físico.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <CheckCircle2 size={16} className="text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-indigo-900">Folha Salarial</p>
                  <p className="text-[10px] text-indigo-700">Lançamento automático de produção/tarefa na folha.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 opacity-60">
                <Clock size={16} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Planejamento Futuro</p>
                  <p className="text-[10px] text-slate-700">Estrutura preparada para integração com cronograma.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold">Lançar Execução Diária</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Data</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                    value={formData.data_execucao}
                    onChange={e => setFormData({ ...formData, data_execucao: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Quantidade</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    placeholder="Ex: 10.5"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                    value={formData.quantidade_executada}
                    onChange={e => setFormData({ ...formData, quantidade_executada: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Funcionário</label>
                <select 
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                  value={formData.funcionario_id}
                  onChange={e => setFormData({ ...formData, funcionario_id: e.target.value })}
                >
                  <option value="">Selecione o funcionário...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Atividade</label>
                <select 
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                  value={formData.atividade_id}
                  onChange={e => setFormData({ ...formData, atividade_id: e.target.value })}
                >
                  <option value="">Selecione a atividade...</option>
                  {activities.map(a => (
                    <option key={a.id} value={a.id}>{a.nome_atividade} ({a.unidade_medida})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Ambiente / Local</label>
                <select 
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                  value={formData.ambiente_id}
                  onChange={e => setFormData({ ...formData, ambiente_id: e.target.value })}
                >
                  <option value="">Selecione o ambiente...</option>
                  {environments.map(env => (
                    <option key={env.id} value={env.id}>{env.nome_ambiente} - {env.nome_pavimento}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Observações</label>
                <textarea 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 h-20"
                  placeholder="Detalhes sobre a execução..."
                  value={formData.observacoes}
                  onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
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
                  disabled={loading}
                  type="submit"
                  className="px-8 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Confirmar Lançamento'}
                </button>
              </div>
            </form>
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
