import React, { useState, useEffect, useMemo } from 'react';
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
  Upload,
  ArrowUpDown,
  Stethoscope,
  UserMinus,
  RefreshCw,
  Users
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import CameraCapture from './CameraCapture';
import { Pagination } from './Pagination';
import { ConfirmationModal } from './ConfirmationModal';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  SortingState, 
  flexRender,
  createColumnHelper
} from '@tanstack/react-table';
import { format } from 'date-fns';

interface EmployeesProps {
  userRole?: string;
}

export default function Employees({ userRole }: EmployeesProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
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
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [employeeAttendance, setEmployeeAttendance] = useState<any[]>([]);
  const [employeePayroll, setEmployeePayroll] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [registrationFilter, setRegistrationFilter] = useState<'all' | 'registered' | 'unregistered'>('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
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

  const [terminationData, setTerminationData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    reason: ''
  });

  const [medicalData, setMedicalData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    days: 1,
    description: ''
  });

  useEffect(() => {
    fetchEmployees(currentPage);
    fetchRoles();
  }, [currentPage, searchTerm, registrationFilter, roleFilter, statusFilter, sorting]);

  const fetchNextCode = async () => {
    try {
      const res = await fetch('/api/v2/employees/next-code');
      const data = await res.json();
      if (data.nextCode) {
        setFormData(prev => ({ ...prev, code: data.nextCode }));
      }
    } catch (err) {
      console.error('Error fetching next code:', err);
    }
  };

  useEffect(() => {
    if (isModalOpen && !isEditing) {
      fetchNextCode();
    }
  }, [isModalOpen, isEditing]);

  const fetchRoles = () => {
    fetch('/api/job-roles')
      .then(res => res.json())
      .then(data => setRoles(Array.isArray(data) ? data : data.data || []));
  };

  const fetchEmployees = (page: number) => {
    const sortBy = sorting.length > 0 ? sorting[0].id : undefined;
    const sortOrder = sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : undefined;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: itemsPerPage.toString(),
      search: searchTerm,
      registration: registrationFilter,
      role: roleFilter,
      status: statusFilter
    });

    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);

    setLoading(true);
    fetch(`/api/v2/employees?${params.toString()}`)
      .then(res => res.json())
      .then(res => {
        setEmployees(res.data || []);
        setTotalItems(res.total || 0);
      })
      .catch(err => {
        console.error('Error fetching employees:', err);
        setEmployees([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleViewDetails = (employee: any) => {
    setSelectedEmployee(employee);
    setIsDetailsOpen(true);
    
    // Fetch attendance history
    fetch(`/api/frequency?employee_id=${employee.id}`)
      .then(res => res.json())
      .then(res => setEmployeeAttendance(res.data || []));
      
    // Fetch payroll history
    fetch(`/api/payroll?employee_id=${employee.id}`)
      .then(res => res.json())
      .then(res => setEmployeePayroll(res.data || []));
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
    }).then(async (res) => {
      if (res.ok) {
        fetchEmployees(currentPage);
        setIsDeleteModalOpen(false);
        setEmployeeToDelete(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao excluir funcionário');
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

  const handleTerminate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      const res = await fetch(`/api/v2/employees/${selectedEmployee.id}/terminate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': userRole || ''
        },
        body: JSON.stringify(terminationData)
      });

      if (res.ok) {
        setIsTerminateModalOpen(false);
        setSelectedEmployee(null);
        fetchEmployees(currentPage);
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao demitir funcionário');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão');
    }
  };

  const handleMedicalCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      const res = await fetch('/api/v2/attendance/medical-certificate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': userRole || ''
        },
        body: JSON.stringify({
          employeeId: selectedEmployee.id,
          ...medicalData
        })
      });

      if (res.ok) {
        setIsMedicalModalOpen(false);
        setSelectedEmployee(null);
        alert('Atestado registrado com sucesso!');
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao registrar atestado');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão');
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
      fetchEmployees(currentPage);
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

        const res = await fetch('/api/v2/employees/import', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-role': userRole || ''
          },
          body: JSON.stringify({ employees: data })
        });

        const result = await res.json();
        if (res.ok) {
          alert(`Importação concluída!\nSucesso: ${result.count}`);
          fetchEmployees(currentPage);
        } else {
          alert(result.error || 'Erro na importação');
        }
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

  const columnHelper = createColumnHelper<any>();

  const columns = useMemo(() => [
    columnHelper.accessor('code', {
      header: 'Código',
      cell: info => <span className="font-mono text-sm text-slate-500">{info.getValue() || '-'}</span>,
    }),
    columnHelper.accessor('name', {
      header: 'Funcionário',
      cell: info => {
        const employee = info.row.original;
        const isTerminated = employee.status === 'TERMINATED';
        return (
          <div className={`flex items-center gap-3 ${isTerminated ? 'text-red-600' : ''}`}>
            {employee.photo ? (
              <img 
                src={employee.photo} 
                alt={employee.name} 
                className={`w-9 h-9 rounded-full object-cover border border-slate-200 ${isTerminated ? 'grayscale opacity-50' : ''}`}
              />
            ) : (
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isTerminated ? 'bg-red-50 text-red-400' : 'bg-slate-100 text-slate-600'}`}>
                {employee.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className={`font-semibold truncate ${isTerminated ? 'line-through' : 'text-slate-900'}`}>{employee.name}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">{employee.document || 'Sem Documento'}</p>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('role', {
      header: 'Função',
      cell: info => (
        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold whitespace-nowrap">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('is_registered', {
      header: 'Registro',
      cell: info => (
        info.getValue() === 1 ? (
          <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
            <CheckCircle2 size={14} />
            Registrado
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-amber-600 text-xs font-bold">
            <XCircle size={14} />
            Não Registrado
          </span>
        )
      ),
    }),
    columnHelper.accessor('base_salary', {
      header: 'Salário Base',
      cell: info => <span className="font-medium text-slate-700 whitespace-nowrap">R$ {info.getValue().toLocaleString()}</span>,
    }),
    columnHelper.accessor('admission_date', {
      header: 'Admissão',
      cell: info => <span className="text-slate-500 text-sm whitespace-nowrap">{format(new Date(info.getValue()), 'dd/MM/yyyy')}</span>,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const status = info.getValue();
        const isTerminated = status === 'TERMINATED';
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
            status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}>
            {status === 'Ativo' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {isTerminated ? 'Demitido' : status}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Ações</div>,
      cell: info => {
        const employee = info.row.original;
        return (
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
                  onClick={() => {
                    setSelectedEmployee(employee);
                    setIsMedicalModalOpen(true);
                  }}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Registrar Atestado"
                >
                  <Stethoscope size={18} />
                </button>
                {employee.status === 'Ativo' && (
                  <button 
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setIsTerminateModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                    title="Demitir"
                  >
                    <UserMinus size={18} />
                  </button>
                )}
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
        );
      },
    }),
  ], [userRole]);

  const table = useReactTable({
    data: employees,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
  });

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
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
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all font-medium ${showFilters ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <Filter size={18} />
            Filtros
            {(roleFilter !== 'all' || statusFilter !== 'Ativo' || registrationFilter !== 'all') && (
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            )}
          </button>

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

      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-6 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Função</label>
            <select 
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Todas as Funções</option>
              {roles.map(role => (
                <option key={role.id} value={role.name}>{role.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
            <div className="flex bg-slate-100 rounded-lg p-1">
              {['Ativo', 'Afastado', 'Desligado', 'Todos'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status === 'Todos' ? 'all' : status)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    (status === 'Todos' ? statusFilter === 'all' : statusFilter === status)
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registro</label>
            <div className="flex bg-slate-100 rounded-lg p-1">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'registered', label: 'Registrados' },
                { id: 'unregistered', label: 'Não Registrados' }
              ].map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => setRegistrationFilter(reg.id as any)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    registrationFilter === reg.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {reg.label}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => {
              setRoleFilter('all');
              setStatusFilter('Ativo');
              setRegistrationFilter('all');
              setSearchTerm('');
            }}
            className="mt-auto mb-1 flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-all text-sm font-bold"
          >
            <XIcon size={16} />
            Limpar Filtros
          </button>
        </div>
      )}

      <div className="table-container flex-1">
        <div className="table-scroll">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className="sticky-header">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th 
                      key={header.id} 
                      className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <ArrowUpDown size={14} className={header.column.getIsSorted() ? 'text-emerald-500' : 'text-slate-300'} />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <RefreshCw size={48} className="animate-spin opacity-20" />
                      <p className="font-medium">Carregando funcionários...</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-6 py-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                          <Users size={48} className="opacity-20" />
                          <p className="font-medium">Nenhum funcionário encontrado</p>
                          <p className="text-xs">Tente ajustar seus filtros ou busca</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
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

      {/* Terminate Modal */}
      {isTerminateModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Demitir Funcionário</h3>
              <button onClick={() => setIsTerminateModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleTerminate} className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                <p className="text-xs text-amber-700">
                  Atenção: A demissão de <span className="font-bold">{selectedEmployee.name}</span> alterará seu status para "Demitido" e ele não aparecerá mais nas listas de frequência futuras ou dashboards ativos.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Data de Demissão</label>
                <input 
                  required
                  type="date" 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  value={terminationData.date}
                  onChange={e => setTerminationData({...terminationData, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Motivo (Opcional)</label>
                <textarea 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none h-24"
                  placeholder="Descreva o motivo da demissão..."
                  value={terminationData.reason}
                  onChange={e => setTerminationData({...terminationData, reason: e.target.value})}
                ></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsTerminateModalOpen(false)}
                  className="flex-1 px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-semibold shadow-lg shadow-amber-500/20"
                >
                  Confirmar Demissão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Medical Certificate Modal */}
      {isMedicalModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Registrar Atestado</h3>
              <button onClick={() => setIsMedicalModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleMedicalCertificate} className="p-6 space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                <Stethoscope className="text-blue-500 shrink-0" size={20} />
                <p className="text-xs text-blue-700">
                  Registrando atestado para <span className="font-bold">{selectedEmployee.name}</span>. O sistema preencherá automaticamente a frequência como "ATESTADO" para o período.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Data de Início</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={medicalData.startDate}
                    onChange={e => setMedicalData({...medicalData, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Dias de Afastamento</label>
                  <input 
                    required
                    type="number" 
                    min="1"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={medicalData.days}
                    onChange={e => setMedicalData({...medicalData, days: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Descrição/CID (Opcional)</label>
                <textarea 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none h-24"
                  placeholder="Informações adicionais do atestado..."
                  value={medicalData.description}
                  onChange={e => setMedicalData({...medicalData, description: e.target.value})}
                ></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsMedicalModalOpen(false)}
                  className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-semibold shadow-lg shadow-blue-500/20"
                >
                  Registrar Atestado
                </button>
              </div>
            </form>
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

      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setEmployeeToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Excluir Funcionário?"
        message={employeeToDelete ? `Você está prestes a excluir ${employeeToDelete.name}. Esta ação não pode ser desfeita e removerá todos os registros associados.` : ''}
      />
    </div>
  );
}
