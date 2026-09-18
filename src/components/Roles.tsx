import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  Pencil, 
  Trash2, 
  Copy,
  X, 
  DollarSign, 
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Pagination } from './Pagination';
import { ConfirmationModal } from './ConfirmationModal';

interface JobRole {
  id: number;
  name: string;
  salary: number;
  payment_type: 'monthly' | 'daily';
}

export default function Roles({ userRole }: { userRole?: string }) {
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<JobRole | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<JobRole | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    salary: '',
    payment_type: 'monthly' as 'monthly' | 'daily'
  });

  useEffect(() => {
    fetchRoles(currentPage);
  }, [currentPage]);

  const fetchRoles = (page: number) => {
    fetch(`/api/job-roles?page=${page}&limit=${itemsPerPage}`)
      .then(res => res.json())
      .then(res => {
        setRoles(res.data);
        setTotalItems(res.total);
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing ? `/api/job-roles/${selectedRole?.id}` : '/api/job-roles';
    const method = isEditing ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': userRole || ''
      },
      body: JSON.stringify({
        ...formData,
        salary: parseFloat(formData.salary)
      })
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Erro ao salvar função');
        return;
      }
      setIsModalOpen(false);
      setIsEditing(false);
      setSelectedRole(null);
      fetchRoles(currentPage);
      setFormData({ name: '', salary: '', payment_type: 'monthly' });
    });
  };

  const handleEdit = (role: JobRole) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      salary: role.salary.toString(),
      payment_type: role.payment_type
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (role: JobRole) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  const handleCopy = (role: JobRole) => {
    fetch(`/api/copy/role/${role.id}`, {
      method: 'POST',
      headers: { 'x-user-role': userRole || '' }
    }).then(res => {
      if (res.ok) fetchRoles(currentPage);
    });
  };

  const confirmDelete = () => {
    if (!roleToDelete) return;
    fetch(`/api/job-roles/${roleToDelete.id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': userRole || '' }
    }).then(async (res) => {
      if (res.ok) {
        fetchRoles(currentPage);
        setIsDeleteModalOpen(false);
        setRoleToDelete(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao excluir função');
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Briefcase size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Cargos e Salários</h3>
            <p className="text-sm text-slate-500">Gerencie as funções e bases salariais da obra</p>
          </div>
        </div>
        
        {userRole === 'admin' && (
          <button 
            onClick={() => {
              setIsEditing(false);
              setFormData({ name: '', salary: '', payment_type: 'monthly' });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-semibold shadow-lg shadow-emerald-500/20"
          >
            <Plus size={18} />
            Nova Função
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 rounded-xl transition-all">
                <Briefcase size={24} />
              </div>
              <div className="flex items-center gap-2">
                {userRole === 'admin' && (
                  <>
                    <button 
                      onClick={() => handleEdit(role)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Editar"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => handleCopy(role)}
                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                      title="Copiar"
                    >
                      <Copy size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(role)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <h4 className="text-lg font-bold text-slate-900 mb-1">{role.name}</h4>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                role.payment_type === 'monthly' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {role.payment_type === 'monthly' ? 'Mensal' : 'Diária'}
              </span>
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">Base Salarial</span>
              <span className="text-lg font-bold text-emerald-600">
                R$ {role.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                <span className="text-[10px] text-slate-400 ml-1">
                  {role.payment_type === 'monthly' ? '/mês' : '/dia'}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>

      <Pagination 
        currentPage={currentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

      {/* Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold">{isEditing ? 'Editar Função' : 'Cadastrar Função'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Nome da Função</label>
                <input 
                  required
                  type="text" 
                  placeholder="Ex: Pedreiro, Servente, Engenheiro..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Tipo de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, payment_type: 'monthly'})}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      formData.payment_type === 'monthly' 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                        : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <Calendar size={18} />
                    <span className="font-bold text-sm">Mensal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, payment_type: 'daily'})}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      formData.payment_type === 'daily' 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                        : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <DollarSign size={18} />
                    <span className="font-bold text-sm">Diária</span>
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  {formData.payment_type === 'monthly' ? 'Salário Mensal (R$)' : 'Valor da Diária (R$)'}
                </label>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  placeholder="0,00"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                  value={formData.salary}
                  onChange={e => setFormData({...formData, salary: e.target.value})}
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
                  {isEditing ? 'Salvar Alterações' : 'Criar Função'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setRoleToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Excluir Função?"
        message={roleToDelete ? `Você está prestes a excluir a função ${roleToDelete.name}. Isso não afetará os salários já cadastrados nos funcionários, mas a função não estará mais disponível para novos cadastros.` : ''}
      />
    </div>
  );
}
