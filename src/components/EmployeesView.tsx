import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Employee, EmployeeRole, EmployeeStatus } from '../types';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Calendar,
  Layers,
  HardHat,
  CheckCircle2,
  XCircle,
  X,
  Mail,
} from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const { employees, frentes, works, createEmployee, updateEmployee, deleteEmployee, settings } =
    useApp();
  const { isAdmin } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  const [empForm, setEmpForm] = useState({
    name: '',
    role: 'Aplicador' as EmployeeRole,
    phone: '',
    hireDate: '',
    status: 'ativo' as EmployeeStatus,
    assignedFrenteIds: [] as string[],
    accessEmail: '',
  });

  const filteredEmployees = employees.filter((e) => {
    if (statusFilter === 'todos') return true;
    return e.status === statusFilter;
  });

  const openModal = (emp?: Employee) => {
    if (emp) {
      setEditingEmp(emp);
      setEmpForm({
        name: emp.name,
        role: emp.role,
        phone: emp.phone || '',
        hireDate: emp.hireDate || '',
        status: emp.status,
        assignedFrenteIds: emp.assignedFrenteIds || [],
        accessEmail: emp.accessEmail || '',
      });
    } else {
      setEditingEmp(null);
      const today = new Date().toISOString().split('T')[0];
      setEmpForm({
        name: '',
        role: 'Aplicador',
        phone: '',
        hireDate: today,
        status: 'ativo',
        assignedFrenteIds: [],
        accessEmail: '',
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmp) {
      await updateEmployee(editingEmp.id, empForm);
    } else {
      await createEmployee(empForm);
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Deseja inativar/remover o colaborador "${name}"?`)) {
      await deleteEmployee(id);
    }
  };

  const toggleFrenteAssignment = (frenteId: string) => {
    setEmpForm((prev) => {
      const exists = prev.assignedFrenteIds.includes(frenteId);
      if (exists) {
        return {
          ...prev,
          assignedFrenteIds: prev.assignedFrenteIds.filter((id) => id !== frenteId),
        };
      } else {
        return {
          ...prev,
          assignedFrenteIds: [...prev.assignedFrenteIds, frenteId],
        };
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            <span>Equipe e Funcionários</span>
          </h2>
          <p className="text-xs text-slate-400">
            Alocação por frentes de trabalho, encarregados e aplicadores
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-2.5 py-1 rounded-lg transition ${
                statusFilter === 'todos' ? 'bg-orange-600 text-white' : 'text-slate-400'
              }`}
            >
              Todos ({employees.length})
            </button>
            <button
              onClick={() => setStatusFilter('ativo')}
              className={`px-2.5 py-1 rounded-lg transition ${
                statusFilter === 'ativo' ? 'bg-orange-600 text-white' : 'text-slate-400'
              }`}
            >
              Ativos ({employees.filter((e) => e.status === 'ativo').length})
            </button>
            <button
              onClick={() => setStatusFilter('inativo')}
              className={`px-2.5 py-1 rounded-lg transition ${
                statusFilter === 'inativo' ? 'bg-orange-600 text-white' : 'text-slate-400'
              }`}
            >
              Inativos ({employees.filter((e) => e.status === 'inativo').length})
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Colaborador</span>
            </button>
          )}
        </div>
      </div>

      {/* Employees Grid */}
      {filteredEmployees.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Nenhum funcionário encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Cadastre os encarregados e equipe de aplicação de contrapiso.
          </p>
          {isAdmin && (
            <button
              onClick={() => openModal()}
              className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-500 transition"
            >
              Cadastrar Colaborador
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredEmployees.map((emp) => {
            const assignedFrentes = frentes.filter((f) => emp.assignedFrenteIds?.includes(f.id));

            return (
              <div
                key={emp.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-orange-400 font-bold text-sm flex-shrink-0">
                        {emp.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{emp.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 font-bold text-[10px] border border-orange-500/20">
                            {emp.role}
                          </span>
                          <span
                            className={`flex items-center gap-1 text-[10px] font-semibold ${
                              emp.status === 'ativo' ? 'text-emerald-400' : 'text-slate-500'
                            }`}
                          >
                            {emp.status === 'ativo' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {emp.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openModal(emp)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id, emp.name)}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1 my-3 text-xs text-slate-400 border-y border-slate-800/80 py-2">
                    {emp.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="text-slate-300 font-mono">{emp.phone}</span>
                      </div>
                    )}
                    {emp.accessEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="text-slate-300 truncate">{emp.accessEmail}</span>
                      </div>
                    )}
                    {emp.hireDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span>Admissão: {emp.hireDate.split('-').reverse().join('/')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assigned Frentes Tags */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-orange-500" />
                    <span>Frentes Alocadas ({assignedFrentes.length}):</span>
                  </div>
                  {assignedFrentes.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic">
                      Nenhuma frente vinculada
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {assignedFrentes.map((f) => {
                        const parentWork = works.find((w) => w.id === f.workId);
                        return (
                          <span
                            key={f.id}
                            className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-medium truncate max-w-[180px]"
                            title={`${parentWork?.name || ''} - ${f.name}`}
                          >
                            {f.name}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Cadastro / Edição de Funcionário */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingEmp ? 'Editar Funcionário' : 'Cadastrar Colaborador'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Alberto da Silva"
                  value={empForm.name}
                  onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Função *
                  </label>
                  <select
                    value={empForm.role}
                    onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    {settings.jobRoles?.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={empForm.status}
                    onChange={(e) => setEmpForm({ ...empForm, status: e.target.value as EmployeeStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={empForm.phone}
                    onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data de Admissão
                  </label>
                  <input
                    type="date"
                    value={empForm.hireDate}
                    onChange={(e) => setEmpForm({ ...empForm, hireDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  E-mail de Acesso ao App (opcional para encarregados)
                </label>
                <input
                  type="email"
                  placeholder="encarregado@empresa.com"
                  value={empForm.accessEmail}
                  onChange={(e) => setEmpForm({ ...empForm, accessEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Frentes de Trabalho Alocadas */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Vincular às Frentes de Trabalho Ativas
                </label>
                {frentes.length === 0 ? (
                  <p className="text-xs text-slate-500">Nenhuma frente cadastrada ainda.</p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 rounded-xl bg-slate-950 p-2.5 border border-slate-800">
                    {frentes.map((f) => {
                      const parentWork = works.find((w) => w.id === f.workId);
                      const isSelected = empForm.assignedFrenteIds.includes(f.id);
                      return (
                        <div
                          key={f.id}
                          onClick={() => toggleFrenteAssignment(f.id)}
                          className={`p-2 rounded-lg text-xs cursor-pointer flex items-center justify-between border transition ${
                            isSelected
                              ? 'bg-orange-950/40 border-orange-500/60 text-orange-200'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className="font-semibold text-white block truncate">
                              {f.name}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">
                              {parentWork?.name}
                            </span>
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
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
