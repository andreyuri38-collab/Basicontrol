import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Download,
  FileText,
  UserPlus,
  Eye,
  Calendar,
  DollarSign,
  X as XIcon,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Camera as CameraIcon,
  AlertTriangle,
  Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import CameraCapture from './CameraCapture';

interface EmployeesProps {
  userRole?: string;
}

export default function Employees({ userRole }: EmployeesProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [employeeAttendance, setEmployeeAttendance] = useState<any[]>([]);
  const [employeePayroll, setEmployeePayroll] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [registrationFilter, setRegistrationFilter] = useState<'all' | 'registered' | 'unregistered'>('all');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    role: '',
    document: '',
    phone: '',
    is_registered: 1,
    base_salary: '',
    admission_date: '',
    bank_name: '',
    bank_agency: '',
    bank_operation: '',
    bank_account: '',
    bank_observations: '',
    vacation_preview: '',
    photo: '',
    status: 'Ativo',
    resignation_date: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, []);

  const fetchRoles = () => {
    fetch('/api/job-roles')
      .then(res => res.json())
      .then(setRoles);
  };

  const fetchEmployees = () => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(setEmployees);
  };

  const handleViewDetails = (employee: any) => {
    setSelectedEmployee(employee);
    setIsDetailsOpen(true);
    
    // Fetch attendance history
    fetch(`/api/frequency?employee_id=${employee.id}`)
      .then(res => res.json())
      .then(setEmployeeAttendance);
      
    // Fetch payroll history
    fetch(`/api/payroll?employee_id=${employee.id}`)
      .then(res => res.json())
      .then(setEmployeePayroll);
  };

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee);
    setFormData({
      code: employee.code || '',
      name: employee.name,
      role: employee.role,
      document: employee.document || '',
      phone: employee.phone || '',
      is_registered: employee.is_registered,
      base_salary: employee.base_salary,
      admission_date: employee.admission_date,
      bank_name: employee.bank_name || '',
      bank_agency: employee.bank_agency || '',
      bank_operation: employee.bank_operation || '',
      bank_account: employee.bank_account || '',
      bank_observations: employee.bank_observations || '',
      vacation_preview: employee.vacation_preview || '',
      photo: employee.photo || '',
      status: employee.status || 'Ativo',
      resignation_date: employee.resignation_date || ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (employee: any) => {
    setEmployeeToDelete(employee);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!employeeToDelete) return;
    
    fetch(`/api/employees/${employeeToDelete.id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': userRole || '' }
    }).then(res => {
      if (res.ok) {
        fetchEmployees();
        setIsDeleteModalOpen(false);
        setEmployeeToDelete(null);
      } else {
        alert('Erro ao excluir funcionário');
      }
    });
  };

  const handleRoleChange = (roleName: string) => {
    const selectedRole = roles.find(r => r.name === roleName);
    if (selectedRole) {
      setFormData({
        ...formData,
        role: roleName,
        base_salary: selectedRole.salary.toString()
      });
    } else {
      setFormData({
        ...formData,
        role: roleName
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing ? `/api/employees/${selectedEmployee.id}` : '/api/employees';
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
        alert(err.error || 'Erro ao salvar funcionário');
        return;
      }
      setIsModalOpen(false);
      setIsEditing(false);
      setSelectedEmployee(null);
      fetchEmployees();
      setFormData({ 
        code: '', name: '', role: '', document: '', phone: '', is_registered: 1,
        base_salary: '', admission_date: '', 
        bank_name: '', bank_agency: '', bank_operation: '', bank_account: '', bank_observations: '',
        vacation_preview: '', photo: '', status: 'Ativo', resignation_date: ''
      });
    });
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(employees);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Funcionários");
    XLSX.writeFile(wb, "Funcionarios_Obra.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório Geral de Funcionários", 14, 15);
    
    autoTable(doc, {
      head: [['Nome', 'Função', 'Salário', 'Admissão', 'Banco', 'Agência', 'Conta', 'Status']],
      body: employees.map(e => [
        e.name, 
        e.role, 
        `R$ ${e.base_salary}`, 
        e.admission_date, 
        e.bank_name || '-', 
        e.bank_agency || '-', 
        e.bank_account || '-', 
        e.status
      ]),
      startY: 20,
    });
    doc.save("Funcionarios_Obra.pdf");
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Código': '001',
        'Nome': 'João da Silva',
        'Função': roles.length > 0 ? roles[0].name : 'Pedreiro',
        'Documento': '123.456.789-00',
        'Telefone': '(11) 99999-9999',
        'Registrado': 'Sim',
        'Salário Base': 2500.00,
        'Data Admissão': '2024-01-15',
        'Banco': 'Banco do Brasil',
        'Agência': '1234',
        'Operação': '001',
        'Conta': '12345-6',
        'Observações Bancárias': 'Pix: 12345678900'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Importacao_Funcionarios.xlsx");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        let successCount = 0;
        let errorCount = 0;

        for (const row of data as any[]) {
          const employeeData = {
            code: row['Código']?.toString() || '',
            name: row['Nome']?.toString() || '',
            role: row['Função']?.toString() || '',
            document: row['Documento']?.toString() || '',
            phone: row['Telefone']?.toString() || '',
            is_registered: row['Registrado']?.toString().toLowerCase() === 'sim' ? 1 : 0,
            base_salary: parseFloat(row['Salário Base']?.toString() || '0'),
            admission_date: row['Data Admissão']?.toString() || new Date().toISOString().split('T')[0],
            bank_name: row['Banco']?.toString() || '',
            bank_agency: row['Agência']?.toString() || '',
            bank_operation: row['Operação']?.toString() || '',
            bank_account: row['Conta']?.toString() || '',
            bank_observations: row['Observações Bancárias']?.toString() || '',
            status: 'Ativo'
          };

          if (!employeeData.name || !employeeData.role) {
            errorCount++;
            continue;
          }

          const res = await fetch('/api/employees', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-user-role': userRole || ''
            },
            body: JSON.stringify(employeeData)
          });

          if (res.ok) successCount++;
          else errorCount++;
        }

        alert(`Importação concluída!\nSucesso: ${successCount}\nErros/Inválidos: ${errorCount}`);
        fetchEmployees();
      } catch (err) {
        console.error(err);
        alert('Erro ao processar o arquivo Excel');
      } finally {
        setImportLoading(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredEmployees = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         e.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (e.code && e.code.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesReg = registrationFilter === 'all' || 
                      (registrationFilter === 'registered' && e.is_registered === 1) ||
                      (registrationFilter === 'unregistered' && e.is_registered === 0);
    
    return matchesSearch && matchesReg;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou função..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 shrink-0">
            <button 
              onClick={() => setRegistrationFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${registrationFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setRegistrationFilter('registered')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${registrationFilter === 'registered' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Registrados
            </button>
            <button 
              onClick={() => setRegistrationFilter('unregistered')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${registrationFilter === 'unregistered' ? 'bg-amber-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Não Registrados
            </button>
          </div>
          <button 
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-medium"
          >
            <Download size={18} />
            Excel
          </button>
          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-medium"
          >
            <FileText size={18} />
            PDF
          </button>
          {userRole === 'admin' && (
            <>
              <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-medium cursor-pointer">
                <Upload size={18} />
                {importLoading ? 'Importando...' : 'Importar Excel'}
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                  onChange={handleImportExcel}
                  disabled={importLoading}
                />
              </label>
              <button 
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-100 transition-all font-medium text-xs"
                title="Baixar Planilha Modelo"
              >
                Modelo
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-semibold shadow-lg shadow-emerald-500/20"
              >
                <UserPlus size={18} />
                Novo Funcionário
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] md:min-w-0">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Funcionário</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Função</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Registro</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Salário Base</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Admissão</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-sm text-slate-500">
                    {employee.code || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {employee.photo ? (
                        <img 
                          src={employee.photo} 
                          alt={employee.name} 
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                          {employee.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{employee.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">{employee.document || 'Sem Documento'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold whitespace-nowrap">
                      {employee.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {employee.is_registered === 1 ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                        <CheckCircle2 size={14} />
                        Registrado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-600 text-xs font-bold">
                        <XCircle size={14} />
                        Não Registrado
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700 whitespace-nowrap">
                    R$ {employee.base_salary.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                    {new Date(employee.admission_date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                      employee.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {employee.status === 'Ativo' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleViewDetails(employee)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Ver Detalhes"
                      >
                        <Eye size={18} />
                      </button>
                      {userRole === 'admin' && (
                        <>
                          <button 
                            onClick={() => handleEdit(employee)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(employee)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-none md:rounded-3xl w-full max-w-2xl h-full md:h-auto md:max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold">{isEditing ? 'Editar Funcionário' : 'Cadastrar Novo Funcionário'}</h3>
              <button onClick={() => { setIsModalOpen(false); setIsEditing(false); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="relative group">
                  {formData.photo ? (
                    <img 
                      src={formData.photo} 
                      alt="Preview" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-emerald-50 shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-4 border-slate-50 shadow-inner">
                      <CameraIcon size={40} />
                    </div>
                  )}
                  <button 
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="absolute bottom-0 right-0 p-2.5 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-all border-4 border-white"
                    title="Tirar Foto"
                  >
                    <CameraIcon size={18} />
                  </button>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Foto do Funcionário</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Código do Funcionário</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 001, ENG-01..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">RG ou CPF</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={formData.document}
                    onChange={e => setFormData({...formData, document: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Telefone</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Função</label>
                  <select 
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={formData.role}
                    onChange={e => handleRoleChange(e.target.value)}
                  >
                    <option value="">Selecione uma função...</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.name}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Opção de Registro</label>
                  <select 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={formData.is_registered}
                    onChange={e => setFormData({...formData, is_registered: parseInt(e.target.value)})}
                  >
                    <option value={1}>Registrado</option>
                    <option value={0}>Não Registrado</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Salário Base (R$)</label>
                  <input 
                    required
                    type="number" 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={formData.base_salary}
                    onChange={e => setFormData({...formData, base_salary: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Data de Admissão</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={formData.admission_date}
                    onChange={e => setFormData({...formData, admission_date: e.target.value})}
                  />
                </div>
                {isEditing && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Status</label>
                      <select 
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                      </select>
                    </div>
                    {formData.status === 'Inativo' && (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Data de Demissão</label>
                        <input 
                          type="date" 
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                          value={formData.resignation_date}
                          onChange={e => setFormData({...formData, resignation_date: e.target.value})}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Dados Bancários</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Banco</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      value={formData.bank_name}
                      onChange={e => setFormData({...formData, bank_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Agência</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      value={formData.bank_agency}
                      onChange={e => setFormData({...formData, bank_agency: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Operação</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      value={formData.bank_operation}
                      onChange={e => setFormData({...formData, bank_operation: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Conta</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      value={formData.bank_account}
                      onChange={e => setFormData({...formData, bank_account: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Observações Bancárias</label>
                  <textarea 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none h-20"
                    placeholder="Pix, CPF do titular, etc..."
                    value={formData.bank_observations}
                    onChange={e => setFormData({...formData, bank_observations: e.target.value})}
                  ></textarea>
                </div>
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
                  Salvar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-none md:rounded-3xl w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
              <div className="flex items-center gap-4">
                {selectedEmployee.photo ? (
                  <img 
                    src={selectedEmployee.photo} 
                    alt={selectedEmployee.name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xl font-bold">
                    {selectedEmployee.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedEmployee.name}</h3>
                  <p className="text-sm text-slate-500">{selectedEmployee.role} • Admissão: {new Date(selectedEmployee.admission_date).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <button onClick={() => setIsDetailsOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <XIcon size={24} />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-8">
              {/* Bank Info Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Dados Bancários</p>
                  <p className="text-sm font-semibold text-slate-700">{selectedEmployee.bank_name || 'N/A'}</p>
                  <p className="text-xs text-slate-500">Ag: {selectedEmployee.bank_agency || '-'} • Conta: {selectedEmployee.bank_account || '-'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Salário Base</p>
                  <p className="text-lg font-bold text-slate-900">R$ {selectedEmployee.base_salary.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Status Atual</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedEmployee.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {selectedEmployee.status === 'Ativo' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {selectedEmployee.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Attendance History */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Calendar size={18} className="text-emerald-500" />
                    Histórico de Frequência (Últimos Registros)
                  </h4>
                  <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Data</th>
                          <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {employeeAttendance.length > 0 ? (
                          employeeAttendance.slice(0, 10).map((record) => (
                            <tr key={record.id}>
                              <td className="px-4 py-3 text-slate-600">{new Date(record.date).toLocaleDateString('pt-BR')}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                                  record.status === 'Presente' ? 'bg-emerald-50 text-emerald-600' : 
                                  record.status === 'Falta' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                  {record.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="px-4 py-8 text-center text-slate-400 italic">Nenhum registro encontrado</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payroll History */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <DollarSign size={18} className="text-emerald-500" />
                    Lançamentos Financeiros
                  </h4>
                  <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Mês/Ref</th>
                          <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Tipo</th>
                          <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {employeePayroll.length > 0 ? (
                          employeePayroll.slice(0, 10).map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 text-slate-600">{item.month} ({item.fortnight}ªQ)</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                                  item.type === 'Descontos' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                  {item.type}
                                </span>
                              </td>
                              <td className={`px-4 py-3 text-right font-bold ${item.type === 'Descontos' ? 'text-red-500' : 'text-slate-900'}`}>
                                {item.type === 'Descontos' ? '-' : ''}R$ {item.amount.toLocaleString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">Nenhum lançamento encontrado</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button 
                onClick={() => setIsDetailsOpen(false)}
                className="px-8 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-semibold shadow-lg transition-all"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {isCameraOpen && (
        <CameraCapture 
          onCapture={(photo) => {
            setFormData({ ...formData, photo });
            setIsCameraOpen(false);
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && employeeToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Excluir Funcionário?</h3>
              <p className="text-slate-500 mb-8">
                Você está prestes a excluir <span className="font-bold text-slate-900">{employeeToDelete.name}</span>. 
                Esta ação não pode ser desfeita e removerá todos os registros associados.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setEmployeeToDelete(null);
                  }}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/25"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
