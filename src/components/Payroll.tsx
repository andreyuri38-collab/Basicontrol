import React, { useState, useEffect } from 'react';
import { 
  Banknote, 
  Plus, 
  Search, 
  Filter, 
  Download,
  FileText,
  TrendingUp,
  PieChart as PieIcon,
  LineChart as LineIcon,
  X as XIcon,
  Pencil,
  Trash2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { format } from 'date-fns';

export default function Payroll({ userRole }: { userRole?: string }) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [daysWorked, setDaysWorked] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    month: format(new Date(), 'yyyy-MM'),
    fortnight: '1',
    type: 'Salário',
    amount: '',
    description: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchPayroll();
    fetchRoles();
  }, [selectedMonth]);

  const fetchRoles = () => {
    fetch('/api/job-roles').then(res => res.json()).then(setRoles);
  };

  const fetchEmployees = () => {
    fetch('/api/employees').then(res => res.json()).then(setEmployees);
  };

  const fetchPayroll = () => {
    fetch(`/api/payroll?month=${selectedMonth}`)
      .then(res => res.json())
      .then(setPayrollData);
  };

  const handleEmployeeChange = async (employeeId: string) => {
    const employee = employees.find(e => e.id.toString() === employeeId);
    if (!employee) {
      setFormData({ ...formData, employee_id: employeeId, amount: '' });
      setDaysWorked(null);
      return;
    }

    const role = roles.find(r => r.name === employee.role);
    if (role && role.payment_type === 'daily') {
      // Fetch frequency to calculate days worked
      const res = await fetch(`/api/frequency?employee_id=${employeeId}`);
      const frequency = await res.json();
      
      // Filter by month and fortnight
      const [year, month] = formData.month.split('-');
      const days = frequency.filter((f: any) => {
        const [fYear, fMonth, fDay] = f.date.split('-');
        
        const matchesMonth = fYear === year && fMonth === month;
        const matchesFortnight = formData.fortnight === '1' ? parseInt(fDay) <= 15 : parseInt(fDay) > 15;
        
        return matchesMonth && matchesFortnight && f.status === 'Presente';
      }).length;

      setDaysWorked(days);
      setFormData({ 
        ...formData, 
        employee_id: employeeId, 
        amount: (role.salary * days).toString(),
        description: `${days} dias trabalhados (R$ ${role.salary}/dia)`
      });
    } else {
      setDaysWorked(null);
      setFormData({ 
        ...formData, 
        employee_id: employeeId, 
        amount: employee.base_salary.toString() 
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing ? `/api/payroll/${editingId}` : '/api/payroll';
    const method = isEditing ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': userRole || ''
      },
      body: JSON.stringify(formData)
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Erro ao salvar lançamento');
        return;
      }
      setIsModalOpen(false);
      setIsEditing(false);
      setEditingId(null);
      fetchPayroll();
      setFormData({ ...formData, amount: '', description: '' });
    });
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setIsEditing(true);
    setFormData({
      employee_id: item.employee_id.toString(),
      month: item.month,
      fortnight: item.fortnight.toString(),
      type: item.type,
      amount: item.amount.toString(),
      description: item.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir este lançamento?')) return;
    
    const res = await fetch(`/api/payroll/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': userRole || '' }
    });
    if (res.ok) {
      fetchPayroll();
    }
  };

  const totalBruto = payrollData.reduce((acc, curr) => acc + (curr.type !== 'Descontos' ? curr.amount : 0), 0);
  const totalDescontos = payrollData.reduce((acc, curr) => acc + (curr.type === 'Descontos' ? curr.amount : 0), 0);
  const totalLiquido = totalBruto - totalDescontos;

  const distributionData = [
    { name: 'Salário', value: payrollData.filter(p => p.type === 'Salário').reduce((a, b) => a + b.amount, 0) },
    { name: 'Produção', value: payrollData.filter(p => p.type === 'Produção').reduce((a, b) => a + b.amount, 0) },
    { name: 'Gratificação', value: payrollData.filter(p => p.type === 'Gratificação').reduce((a, b) => a + b.amount, 0) },
    { name: 'Descontos', value: totalDescontos },
  ].filter(d => d.value > 0);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Banknote size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Folha Salarial Inteligente</h3>
            <input 
              type="month" 
              className="text-sm text-slate-500 bg-transparent border-none focus:ring-0 p-0 cursor-pointer hover:text-emerald-600 transition-colors"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-medium">
            <Download size={18} />
            Exportar Consolidado
          </button>
          {userRole === 'admin' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-semibold shadow-lg shadow-emerald-500/20"
            >
              <Plus size={18} />
              Lançar Valor
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500 font-medium mb-1">Total Bruto</p>
          <h4 className="text-2xl font-bold text-slate-900">R$ {totalBruto.toLocaleString()}</h4>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500 font-medium mb-1">Total Descontos</p>
          <h4 className="text-2xl font-bold text-red-500">R$ {totalDescontos.toLocaleString()}</h4>
        </div>
        <div className="bg-emerald-500 p-6 rounded-2xl shadow-lg shadow-emerald-500/20">
          <p className="text-sm text-emerald-100 font-medium mb-1">Total Líquido</p>
          <h4 className="text-2xl font-bold text-white">R$ {totalLiquido.toLocaleString()}</h4>
        </div>
      </div>

      {/* Charts & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Lançamentos</h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase whitespace-nowrap">1ª Quin.</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase whitespace-nowrap">2ª Quin.</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Funcionário</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Quinzena</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Valor</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payrollData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-slate-900 truncate max-w-[200px]">{item.employee_name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap ${
                          item.type === 'Descontos' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{item.fortnight}ª</td>
                      <td className={`px-6 py-4 text-right font-bold whitespace-nowrap ${item.type === 'Descontos' ? 'text-red-500' : 'text-slate-900'}`}>
                        {item.type === 'Descontos' ? '-' : ''} R$ {item.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <PieIcon size={18} className="text-emerald-500" />
              Distribuição
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4">
              {distributionData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[i]}}></div>
                  <span className="text-xs text-slate-600 font-medium">{item.name}</span>
                  <span className="text-xs text-slate-400 ml-auto">R$ {item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" />
              Indicadores Inteligentes
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Custo Médio / Dia</p>
                <p className="text-lg font-bold text-slate-900">R$ {(totalBruto / 22).toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Custo Médio / Funcionário</p>
                <p className="text-lg font-bold text-slate-900">R$ {(totalBruto / (employees.length || 1)).toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-none md:rounded-3xl w-full max-w-lg h-full md:h-auto shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold">{isEditing ? 'Editar Lançamento' : 'Lançamento de Folha'}</h3>
              <button onClick={() => { setIsModalOpen(false); setIsEditing(false); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Funcionário</label>
                <select 
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  value={formData.employee_id}
                  onChange={e => handleEmployeeChange(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Quinzena</label>
                  <select 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={formData.fortnight}
                    onChange={e => {
                      const newFortnight = e.target.value;
                      setFormData({...formData, fortnight: newFortnight});
                      // Trigger recalculation if employee is already selected
                      if (formData.employee_id) {
                        // We need to pass the new state values because setFormData is async
                        setTimeout(() => handleEmployeeChange(formData.employee_id), 0);
                      }
                    }}
                  >
                    <option value="1">1ª Quinzena</option>
                    <option value="2">2ª Quinzena</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Tipo</label>
                  <select 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="Salário">Salário</option>
                    <option value="Produção">Produção</option>
                    <option value="Gratificação">Gratificação</option>
                    <option value="Descontos">Descontos</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Valor (R$)</label>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
                {daysWorked !== null && (
                  <p className="text-xs text-emerald-600 font-bold">
                    Cálculo automático: {daysWorked} dias presentes identificados.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Descrição / Observações</label>
                <textarea 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none h-20"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-8 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 font-semibold shadow-lg shadow-emerald-500/20"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
