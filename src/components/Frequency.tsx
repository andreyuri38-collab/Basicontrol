import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Coffee,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  User,
  RotateCcw,
  X,
  FileText,
  Palmtree,
  Download,
  Cloud,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { Pagination } from './Pagination';
import { ConfirmationModal } from './ConfirmationModal';
import { 
  format, 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  parseISO, 
  isSameDay, 
  startOfToday,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type FilterMode = 'day' | 'month' | 'custom';

interface FrequencyProps {
  userRole?: string;
}

export default function Frequency({ userRole }: FrequencyProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('day');
  const [monthlyViewMode, setMonthlyViewMode] = useState<'calendar' | 'grid'>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [attendanceMap, setAttendanceMap] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [isGDriveConnected, setIsGDriveConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchEmployees();
    checkGDriveStatus();
  }, []);

  const checkGDriveStatus = async () => {
    try {
      const res = await fetch('/api/sync/google-drive/status');
      const data = await res.json();
      setIsGDriveConnected(data.connected);
    } catch (err) {
      console.error("Error checking GDrive status:", err);
    }
  };

  useEffect(() => {
    fetchAttendance(currentPage);
  }, [selectedDate, startDate, endDate, filterMode, selectedEmployeeId, selectedRole, currentPage]);

  const fetchEmployees = () => {
    fetch('/api/v2/employees?status=Ativo&limit=1000') // Fetch only active for selection
      .then(res => res.json())
      .then(res => setEmployees(res.data || []));
  };

  const fetchAttendance = (page: number) => {
    setLoading(true);
    let start = '';
    let end = '';

    if (filterMode === 'day') {
      start = end = format(selectedDate, 'yyyy-MM-dd');
    } else if (filterMode === 'month') {
      const monthStart = startOfMonth(parseISO(startDate));
      const monthEnd = endOfMonth(parseISO(startDate));
      start = format(monthStart, 'yyyy-MM-dd');
      end = format(monthEnd, 'yyyy-MM-dd');
    } else {
      start = startDate;
      end = endDate;
    }

    const employeeParam = selectedEmployeeId !== 'all' ? `&employee_id=${selectedEmployeeId}` : '';
    const roleParam = selectedRole !== 'all' ? `&role=${selectedRole}` : '';
    
    fetch(`/api/frequency?start=${start}&end=${end}${employeeParam}${roleParam}&page=${page}&limit=${itemsPerPage}`)
      .then(res => res.json())
      .then(res => {
        const data = res.data || [];
        setAttendanceRecords(data);
        setTotalItems(res.total || 0);
        
        // For daily view, we need a map for easy lookup
        if (filterMode === 'day') {
          const map: any = {};
          data.forEach((item: any) => {
            map[item.employee_id] = item;
          });
          setAttendanceMap(map);
        }
        setLoading(false);
      });
  };

  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);
  
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
  const [medicalData, setMedicalData] = useState({
    employeeId: 0,
    employeeName: '',
    type: 'Atestado Médico',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    days: 1,
    returnDate: format(addDays(new Date(), 1), 'yyyy-MM-dd')
  });

  useEffect(() => {
    const start = parseISO(medicalData.startDate);
    const end = addDays(start, medicalData.days);
    setMedicalData(prev => ({ ...prev, returnDate: format(end, 'yyyy-MM-dd') }));
  }, [medicalData.startDate, medicalData.days]);

  const handleStatusChange = (employeeId: number, status: string) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    if (status === 'Atestado') {
      const emp = employees.find(e => e.id === employeeId);
      setMedicalData({
        employeeId,
        employeeName: emp?.name || '',
        type: 'Atestado Médico',
        startDate: dateStr,
        days: 1,
        returnDate: format(addDays(parseISO(dateStr), 1), 'yyyy-MM-dd')
      });
      setIsMedicalModalOpen(true);
      return;
    }

    if (status === 'Remover') {
      setConfirmConfig({
        title: 'Remover Frequência?',
        message: 'Deseja realmente remover o registro de frequência para este dia? Esta ação não pode ser desfeita.',
        onConfirm: async () => {
          try {
            const res = await fetch(`/api/frequency?employee_id=${employeeId}&date=${dateStr}`, {
              method: 'DELETE',
              headers: { 'x-user-role': userRole || '' }
            });
            if (res.ok) {
              if (filterMode === 'day') {
                const newMap = { ...attendanceMap };
                delete newMap[employeeId];
                setAttendanceMap(newMap);
              } else {
                fetchAttendance(currentPage);
              }
            }
          } catch (err) {
            console.error(err);
          }
        }
      });
      setIsConfirmOpen(true);
      return;
    }

    const payload = {
      employee_id: employeeId,
      date: dateStr,
      status,
      atestato_days: status === 'Atestado' ? 1 : 0,
      observations: ''
    };

    fetch('/api/frequency', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': userRole || ''
      },
      body: JSON.stringify(payload)
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Erro ao salvar frequência');
        return;
      }
      if (filterMode === 'day') {
        setAttendanceMap({
          ...attendanceMap,
          [employeeId]: payload
        });
      } else {
        fetchAttendance(currentPage);
      }
    });
  };
  
  const handleMarkAllPresent = async () => {
    const visibleEmployees = employees.filter(e => selectedRole === 'all' || e.role === selectedRole);
    if (visibleEmployees.length === 0) return;
    
    const isWeekend = [0, 6].includes(selectedDate.getDay());
    const defaultStatus = isWeekend ? 'Folga' : 'Presente';
    
    setConfirmConfig({
      title: 'Marcar Todos?',
      message: `Deseja marcar os ${visibleEmployees.length} funcionários como '${defaultStatus}' para o dia ${format(selectedDate, 'dd/MM/yyyy')}?`,
      onConfirm: async () => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        setLoading(true);
        
        try {
          await Promise.all(visibleEmployees.map(employee => 
            fetch('/api/frequency', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'x-user-role': userRole || ''
              },
              body: JSON.stringify({
                employee_id: employee.id,
                date: dateStr,
                status: defaultStatus,
                atestato_days: 0,
                observations: ''
              })
            })
          ));
          fetchAttendance(currentPage);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    });
    setIsConfirmOpen(true);
  };

  const handleClearDates = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setStartDate(today);
    setEndDate(today);
  };

  const handleMedicalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const start = parseISO(medicalData.startDate);
      const days = eachDayOfInterval({
        start,
        end: addDays(start, medicalData.days - 1)
      });

      await Promise.all(days.map(day => 
        fetch('/api/frequency', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-role': userRole || ''
          },
          body: JSON.stringify({
            employee_id: medicalData.employeeId,
            date: format(day, 'yyyy-MM-dd'),
            status: 'Atestado',
            atestato_days: medicalData.days,
            observations: medicalData.type
          })
        })
      ));

      // Also save to medical_certificates table if it exists (Prisma schema has it)
      await fetch('/api/v2/attendance/medical-certificate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': userRole || ''
        },
        body: JSON.stringify({
          employeeId: medicalData.employeeId,
          type: medicalData.type,
          startDate: medicalData.startDate,
          daysAway: medicalData.days,
          returnDate: medicalData.returnDate
        })
      });

      setIsMedicalModalOpen(false);
      fetchAttendance(currentPage);
    } catch (error) {
      alert('Erro ao registrar atestado');
    } finally {
      setLoading(false);
    }
  };

  const generatePDFDoc = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const now = new Date();
    const dateRange = filterMode === 'day' 
      ? format(selectedDate, 'dd/MM/yyyy')
      : `${format(parseISO(startDate), 'dd/MM/yyyy')} a ${format(parseISO(endDate), 'dd/MM/yyyy')}`;
    
    const employeeName = selectedEmployeeId === 'all' 
      ? 'Todos os Funcionários' 
      : employees.find(e => e.id.toString() === selectedEmployeeId.toString())?.name || 'Funcionário';

    const roleName = selectedRole === 'all' ? 'Todas as Funções' : selectedRole;

    // RHid Style Header
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 297, 45, 'F');
    
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text("CARTÃO DE PONTO - RELATÓRIO DE FREQUÊNCIA", 14, 15);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Empresa: CONSTRUTORA EXEMPLO LTDA`, 14, 22);
    doc.text(`Período: ${dateRange}`, 14, 27);
    doc.text(`Emissão: ${format(now, "dd/MM/yyyy HH:mm")}`, 14, 32);
    
    doc.text(`Funcionário: ${employeeName.toUpperCase()}`, 150, 22);
    doc.text(`Função: ${roleName.toUpperCase()}`, 150, 27);
    doc.text(`Página: 1 de 1`, 150, 32);

    // Data Preparation
    let head: any[] = [];
    let body: any[] = [];

    if (filterMode === 'month' && monthlyViewMode === 'grid') {
      const monthStart = startOfMonth(parseISO(startDate));
      const monthEnd = endOfMonth(monthStart);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      
      head = [['Funcionário', 'Função', ...days.map(d => format(d, 'd')), 'P', 'F', 'A', 'FE', 'FO']];
      
      const filteredEmployees = employees.filter(e => 
        (selectedEmployeeId === 'all' || e.id.toString() === selectedEmployeeId.toString()) && 
        (selectedRole === 'all' || e.role === selectedRole)
      );

      body = filteredEmployees.map(employee => {
        const employeeRecords = attendanceRecords.filter(r => r.employee_id === employee.id);
        const dayCols = days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const record = employeeRecords.find(r => r.date === dateStr);
          if (record) {
            if (record.status === 'Presente') return 'P';
            if (record.status === 'Falta') return 'F';
            if (record.status === 'Atestado') return 'A';
            if (record.status === 'Férias') return 'FE';
            if (record.status === 'Folga') return 'FO';
          }
          // Pre-select Folga for weekends if no record exists
          if ([0, 6].includes(day.getDay())) return 'FO';
          return '';
        });

        return [
          employee.name,
          employee.role,
          ...dayCols,
          employeeRecords.filter(r => r.status === 'Presente').length,
          employeeRecords.filter(r => r.status === 'Falta').length,
          employeeRecords.filter(r => r.status === 'Atestado').length,
          employeeRecords.filter(r => r.status === 'Férias').length,
          employeeRecords.filter(r => r.status === 'Folga').length + dayCols.filter((val, idx) => val === 'FO' && !employeeRecords.find(r => r.date === format(days[idx], 'yyyy-MM-dd'))).length,
        ];
      });

      // Add Totals Row
      const totalP = attendanceRecords.filter(r => r.status === 'Presente').length;
      const totalF = attendanceRecords.filter(r => r.status === 'Falta').length;
      const totalA = attendanceRecords.filter(r => r.status === 'Atestado').length;
      const totalFE = attendanceRecords.filter(r => r.status === 'Férias').length;
      const totalFO = attendanceRecords.filter(r => r.status === 'Folga').length;
      
      const dayTotals = days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return attendanceRecords.filter(r => r.date === dateStr && r.status === 'Presente').length || '';
      });

      body.push([
        { content: 'TOTAIS GERAIS', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        ...dayTotals,
        totalP,
        totalF,
        totalA,
        totalFE,
        totalFO
      ]);

    } else {
      head = isRangeView 
        ? [['Data', 'Funcionário', 'Status', 'Observações']]
        : [['Funcionário', 'Função', 'Status', 'Observações']];
        
      const data = filterMode === 'day' && selectedEmployeeId === 'all'
        ? employees.map(e => ({
            col1: e.name,
            col2: e.role,
            status: attendanceMap[e.id]?.status || 'Pendente',
            obs: attendanceMap[e.id]?.observations || '-'
          }))
        : attendanceRecords.map(r => ({
            col1: isRangeView ? format(parseISO(r.date), 'dd/MM/yyyy') : r.employee_name,
            col2: isRangeView ? r.employee_name : '-',
            status: r.status,
            obs: r.observations || '-'
          }));

      body = data.map(d => [d.col1, d.col2, d.status, d.obs]);
    }

    autoTable(doc, {
      head,
      body,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 6, cellPadding: 1.5, halign: 'center' },
      columnStyles: {
        0: { halign: 'left', cellWidth: 35 },
        1: { halign: 'left', cellWidth: 30 }
      }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable?.finalY || 150;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Legenda: P = Presente | F = Falta | A = Atestado | FE = Férias | FO = Folga", 14, finalY + 10);
    doc.text("Assinatura do Responsável: ________________________________________________", 14, finalY + 25);
    doc.text("Assinatura do Funcionário: ________________________________________________", 150, finalY + 25);

    return doc;
  };

  const generateExcelWB = () => {
    const monthStart = startOfMonth(parseISO(startDate));
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const filteredEmployees = employees.filter(e => 
      (selectedEmployeeId === 'all' || e.id.toString() === selectedEmployeeId.toString()) && 
      (selectedRole === 'all' || e.role === selectedRole)
    );

    const data = filteredEmployees.map(employee => {
      const employeeRecords = attendanceRecords.filter(r => r.employee_id === employee.id);
      const row: any = {
        'Funcionário': employee.name,
        'Função': employee.role
      };
      
      days.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const record = employeeRecords.find(r => r.date === dateStr);
        if (record) {
          row[format(day, 'd')] = record.status === 'Presente' ? 'P' : (record.status === 'Folga' ? 'FO' : record.status.charAt(0));
        } else if ([0, 6].includes(day.getDay())) {
          row[format(day, 'd')] = 'FO';
        } else {
          row[format(day, 'd')] = '';
        }
      });
      
      row['P'] = employeeRecords.filter(r => r.status === 'Presente').length;
      row['F'] = employeeRecords.filter(r => r.status === 'Falta').length;
      row['A'] = employeeRecords.filter(r => r.status === 'Atestado').length;
      row['FE'] = employeeRecords.filter(r => r.status === 'Férias').length;
      row['FO'] = employeeRecords.filter(r => r.status === 'Folga').length + days.filter(d => [0, 6].includes(d.getDay()) && !employeeRecords.find(r => r.date === format(d, 'yyyy-MM-dd'))).length;
      
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Frequência");
    return wb;
  };

  const exportPDF = () => {
    const doc = generatePDFDoc();
    const now = new Date();
    const employeeName = selectedEmployeeId === 'all' 
      ? 'Todos' 
      : employees.find(e => e.id.toString() === selectedEmployeeId.toString())?.name || 'Funcionario';
    doc.save(`Frequencia_${employeeName.replace(/\s+/g, '_')}_${format(now, 'yyyyMMdd')}.pdf`);
  };

  const exportExcel = () => {
    const wb = generateExcelWB();
    const monthStart = startOfMonth(parseISO(startDate));
    XLSX.writeFile(wb, `Frequencia_${format(monthStart, 'MMMM_yyyy', { locale: ptBR })}.xlsx`);
  };

  const saveToGDrive = async (type: 'pdf' | 'excel') => {
    if (!isGDriveConnected) {
      alert("Google Drive não conectado. Por favor, conecte no Dashboard.");
      return;
    }

    setSyncing(true);
    try {
      let fileName = "";
      let mimeType = "";
      let base64Data = "";

      const now = new Date();
      const employeeName = selectedEmployeeId === 'all' 
        ? 'Todos' 
        : employees.find(e => e.id.toString() === selectedEmployeeId.toString())?.name || 'Funcionario';

      if (type === 'pdf') {
        const doc = generatePDFDoc();
        fileName = `Frequencia_${employeeName.replace(/\s+/g, '_')}_${format(now, 'yyyyMMdd')}.pdf`;
        mimeType = "application/pdf";
        base64Data = doc.output('datauristring').split(',')[1];
      } else {
        const wb = generateExcelWB();
        fileName = `Frequencia_${format(startOfMonth(parseISO(startDate)), 'MMMM_yyyy', { locale: ptBR })}.xlsx`;
        mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
        base64Data = wbout;
      }

      const res = await fetch('/api/sync/google-drive/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, mimeType, base64Data })
      });

      const data = await res.json();
      if (data.success) {
        alert("Relatório salvo com sucesso no Google Drive!");
      } else {
        alert("Erro ao salvar no Google Drive: " + data.error);
      }
    } catch (err: any) {
      alert("Erro ao processar upload: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const statusOptions = [
    { id: 'Presente', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'Falta', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
    { id: 'Atestado', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'Férias', icon: Palmtree, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'Folga', icon: Coffee, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'Remover', icon: Trash2, color: 'text-slate-400', bg: 'bg-slate-50' },
  ];

  const isRangeView = filterMode !== 'day' || selectedEmployeeId !== 'all' || selectedRole !== 'all';
  const roles = Array.from(new Set(employees.map(e => e.role))).sort();

  return (
    <div className="space-y-6">
      {/* Header & Quick Navigation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Calendar size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Controle de Frequência</h3>
            <p className="text-sm text-slate-500 capitalize">
              {filterMode === 'day' 
                ? format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                : 'Visão por Período / Filtros'}
            </p>
          </div>
        </div>
        
        {filterMode === 'day' && (
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100 self-start md:self-center">
            <button 
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="px-4 font-semibold text-slate-700 min-w-[120px] text-center">
              {format(selectedDate, 'dd/MM/yyyy')}
            </div>
            <button 
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 self-start md:self-center">
          {filterMode === 'day' && userRole === 'admin' && (
            <button 
              onClick={handleMarkAllPresent}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all font-medium border border-emerald-100"
            >
              <CheckCircle2 size={18} />
              <span className="hidden sm:inline">Marcar Todos Presente</span>
            </button>
          )}
          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-medium"
          >
            <FileText size={18} />
            PDF
          </button>
          <button 
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-medium"
          >
            <Download size={18} />
            Excel
          </button>

          {isGDriveConnected && (
            <div className="flex items-center gap-1 bg-blue-50 p-1 rounded-xl border border-blue-100">
              <button 
                onClick={() => saveToGDrive('pdf')}
                disabled={syncing}
                title="Salvar PDF no Google Drive"
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-blue-600 disabled:opacity-50"
              >
                {syncing ? <RefreshCw size={18} className="animate-spin" /> : <Cloud size={18} />}
              </button>
              <button 
                onClick={() => saveToGDrive('excel')}
                disabled={syncing}
                title="Salvar Excel no Google Drive"
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-blue-600 disabled:opacity-50"
              >
                {syncing ? <RefreshCw size={18} className="animate-spin" /> : <FileText size={18} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 ${filterMode === 'custom' ? 'md:grid-cols-6' : 'md:grid-cols-5'} gap-6`}>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
            <Filter size={14} /> Modo
          </label>
          <select 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as FilterMode)}
          >
            <option value="day">Diário</option>
            <option value="month">Mensal</option>
            <option value="custom">Intervalo</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
            <User size={14} /> Funcionário
          </label>
          <select 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
          >
            <option value="all">Todos</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
            <Filter size={14} /> Função
          </label>
          <select 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="all">Todas</option>
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        {filterMode === 'month' && (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                <Calendar size={14} /> Selecionar Mês
              </label>
              <input 
                type="month" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={startDate.substring(0, 7)}
                onChange={(e) => setStartDate(`${e.target.value}-01`)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                Visualização
              </label>
              <div className="flex bg-slate-50 border border-slate-100 rounded-xl p-1">
                <button 
                  onClick={() => setMonthlyViewMode('calendar')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${monthlyViewMode === 'calendar' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
                >
                  Calendário
                </button>
                <button 
                  onClick={() => setMonthlyViewMode('grid')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${monthlyViewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
                >
                  Grade
                </button>
              </div>
            </div>
          </>
        )}

        {filterMode === 'custom' && (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Início</label>
              <input 
                type="date" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Fim</label>
              <input 
                type="date" 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex flex-col justify-end">
              <button 
                onClick={handleClearDates}
                className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border border-slate-200"
              >
                <RotateCcw size={16} />
                Limpar
              </button>
            </div>
          </>
        )}
      </div>

      {/* Attendance Table / Calendar */}
      <div className="table-container">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Carregando dados...</div>
        ) : filterMode === 'month' && monthlyViewMode === 'grid' ? (
          <div className="table-scroll">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead className="sticky-header">
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-3 py-3 font-bold text-slate-500 uppercase sticky left-0 bg-slate-50 z-20 border-r border-slate-100 min-w-[150px]">Funcionário</th>
                  <th className="px-3 py-3 font-bold text-slate-500 uppercase min-w-[120px]">Função</th>
                  {(() => {
                    const monthStart = startOfMonth(parseISO(startDate));
                    const monthEnd = endOfMonth(monthStart);
                    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
                    return days.map(day => (
                      <th key={day.toString()} className={`px-1 py-3 font-bold text-center min-w-[28px] border-x border-slate-100 ${[0, 6].includes(day.getDay()) ? 'bg-slate-100/50 text-slate-400' : 'text-slate-500'}`}>
                        {format(day, 'd')}
                      </th>
                    ));
                  })()}
                  <th className="px-2 py-3 font-bold text-emerald-600 text-center bg-emerald-50/50 min-w-[35px]">P</th>
                  <th className="px-2 py-3 font-bold text-red-600 text-center bg-red-50/50 min-w-[35px]">F</th>
                  <th className="px-2 py-3 font-bold text-amber-600 text-center bg-amber-50/50 min-w-[35px]">A</th>
                  <th className="px-2 py-3 font-bold text-indigo-600 text-center bg-indigo-50/50 min-w-[35px]">FE</th>
                  <th className="px-2 py-3 font-bold text-blue-600 text-center bg-blue-50/50 min-w-[35px]">FO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(() => {
                  const monthStart = startOfMonth(parseISO(startDate));
                  const monthEnd = endOfMonth(monthStart);
                  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
                  const filteredEmployees = employees.filter(e => 
                    (selectedEmployeeId === 'all' || e.id.toString() === selectedEmployeeId.toString()) && 
                    (selectedRole === 'all' || e.role === selectedRole)
                  );

                  return (
                    <>
                      {filteredEmployees.map(employee => {
                        const employeeRecords = attendanceRecords.filter(r => r.employee_id === employee.id);
                        const counts = {
                          Presente: employeeRecords.filter(r => r.status === 'Presente').length,
                          Falta: employeeRecords.filter(r => r.status === 'Falta').length,
                          Atestado: employeeRecords.filter(r => r.status === 'Atestado').length,
                          Férias: employeeRecords.filter(r => r.status === 'Férias').length,
                          Folga: employeeRecords.filter(r => r.status === 'Folga').length,
                        };

                        return (
                          <tr key={employee.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-3 py-2 font-semibold text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50/50 z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                              {employee.name}
                            </td>
                            <td className="px-3 py-2 text-slate-500 whitespace-nowrap border-r border-slate-50">{employee.role}</td>
                            {days.map(day => {
                              const dateStr = format(day, 'yyyy-MM-dd');
                              const record = employeeRecords.find(r => r.date === dateStr);
                              let display = '';
                              let color = '';
                              if (record) {
                                if (record.status === 'Presente') { display = 'P'; color = 'text-emerald-600 font-bold'; }
                                else if (record.status === 'Falta') { display = 'F'; color = 'text-red-600 font-bold'; }
                                else if (record.status === 'Atestado') { display = 'A'; color = 'text-amber-600 font-bold'; }
                                else if (record.status === 'Férias') { display = 'FE'; color = 'text-indigo-600 font-bold'; }
                                else if (record.status === 'Folga') { display = 'FO'; color = 'text-blue-600 font-bold'; }
                              } else if ([0, 6].includes(day.getDay())) {
                                display = 'FO';
                                color = 'text-blue-400 font-medium opacity-60';
                                counts.Folga++;
                              }
                              return (
                                <td key={dateStr} className={`px-1 py-2 text-center border-r border-slate-50 ${color} ${[0, 6].includes(day.getDay()) ? 'bg-slate-50/30' : ''}`}>
                                  {display}
                                </td>
                              );
                            })}
                            <td className="px-2 py-2 text-center font-bold text-emerald-600 bg-emerald-50/30 border-r border-emerald-100/50">{counts.Presente}</td>
                            <td className="px-2 py-2 text-center font-bold text-red-600 bg-red-50/30 border-r border-red-100/50">{counts.Falta}</td>
                            <td className="px-2 py-2 text-center font-bold text-amber-600 bg-amber-50/30 border-r border-amber-100/50">{counts.Atestado}</td>
                            <td className="px-2 py-2 text-center font-bold text-indigo-600 bg-indigo-50/30 border-r border-indigo-100/50">{counts.Férias}</td>
                            <td className="px-2 py-2 text-center font-bold text-blue-600 bg-blue-50/30">{counts.Folga}</td>
                          </tr>
                        );
                      })}
                      {/* Totals Row */}
                      <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-200">
                        <td className="px-3 py-3 sticky left-0 bg-slate-100 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]" colSpan={2}>
                          TOTAIS DIÁRIOS (PRESENÇA)
                        </td>
                        {days.map(day => {
                          const dateStr = format(day, 'yyyy-MM-dd');
                          const dayRecords = attendanceRecords.filter(r => r.date === dateStr);
                          const pCount = dayRecords.filter(r => r.status === 'Presente').length;
                          return (
                            <td key={dateStr} className="px-1 py-3 text-center text-emerald-600 border-r border-slate-200">
                              {pCount || '-'}
                            </td>
                          );
                        })}
                        <td className="px-2 py-3 text-center text-emerald-600 bg-emerald-100/50 border-r border-emerald-200">
                          {attendanceRecords.filter(r => r.status === 'Presente').length}
                        </td>
                        <td className="px-2 py-3 text-center text-red-600 bg-red-100/50 border-r border-red-200">
                          {attendanceRecords.filter(r => r.status === 'Falta').length}
                        </td>
                        <td className="px-2 py-3 text-center text-amber-600 bg-amber-100/50 border-r border-amber-200">
                          {attendanceRecords.filter(r => r.status === 'Atestado').length}
                        </td>
                        <td className="px-2 py-3 text-center text-indigo-600 bg-indigo-100/50 border-r border-indigo-200">
                          {attendanceRecords.filter(r => r.status === 'Férias').length}
                        </td>
                        <td className="px-2 py-3 text-center text-blue-600 bg-blue-100/50">
                          {attendanceRecords.filter(r => r.status === 'Folga').length + days.filter(d => [0, 6].includes(d.getDay())).length * filteredEmployees.length - attendanceRecords.filter(r => [0, 6].includes(parseISO(r.date).getDay())).length}
                        </td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        ) : filterMode === 'month' && monthlyViewMode === 'calendar' ? (
          <div className="p-6">
            <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-xl overflow-hidden">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="bg-slate-50 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {day}
                </div>
              ))}
              {(() => {
                const monthStart = startOfMonth(parseISO(startDate));
                const monthEnd = endOfMonth(monthStart);
                const calendarStart = startOfWeek(monthStart);
                const calendarEnd = endOfWeek(monthEnd);
                const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

                return days.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayRecords = attendanceRecords.filter(r => r.date === dateStr);
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div 
                      key={dateStr} 
                      className={`min-h-[100px] p-2 bg-white flex flex-col gap-1 transition-colors hover:bg-slate-50/50 ${!isCurrentMonth ? 'opacity-30' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${isToday ? 'w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center' : 'text-slate-400'}`}>
                          {format(day, 'd')}
                        </span>
                        {isCurrentMonth && (
                          <button 
                            onClick={() => {
                              setSelectedDate(day);
                              setFilterMode('day');
                            }}
                            className="text-[10px] text-emerald-600 font-bold hover:underline"
                          >
                            Ver Dia
                          </button>
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        {selectedEmployeeId === 'all' ? (
                          // Summary View
                          (dayRecords.length > 0 || [0, 6].includes(day.getDay())) && (
                            <div className="space-y-1">
                              {['Presente', 'Falta', 'Atestado', 'Férias', 'Folga'].map(status => {
                                let count = dayRecords.filter(r => r.status === status).length;
                                if (status === 'Folga' && [0, 6].includes(day.getDay())) {
                                  // Add employees that don't have a record for this weekend day
                                  const employeesWithRecords = new Set(dayRecords.map(r => r.employee_id));
                                  count += employees.length - employeesWithRecords.size;
                                }
                                if (count === 0) return null;
                                const opt = statusOptions.find(o => o.id === status);
                                return (
                                  <div key={status} className={`flex items-center justify-between px-1.5 py-0.5 rounded text-[9px] font-bold ${opt?.bg} ${opt?.color}`}>
                                    <span>{status}</span>
                                    <span>{count}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )
                        ) : (
                          // Individual View
                          (dayRecords.length > 0 || [0, 6].includes(day.getDay())) && (
                            <div className={`p-1.5 rounded text-[10px] font-bold text-center ${
                              dayRecords.length > 0 
                                ? `${statusOptions.find(o => o.id === dayRecords[0].status)?.bg} ${statusOptions.find(o => o.id === dayRecords[0].status)?.color}`
                                : 'bg-blue-50 text-blue-400 opacity-60'
                            }`}>
                              {dayRecords.length > 0 ? dayRecords[0].status : 'Folga'}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-left border-collapse min-w-[800px] md:min-w-0">
              <thead className="sticky-header">
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  {isRangeView && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>}
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Funcionário</th>
                  {!isRangeView && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Função</th>}
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filterMode === 'day' ? (
                  // Daily View (Editable)
                  employees
                    .filter(e => (selectedEmployeeId === 'all' || e.id.toString() === selectedEmployeeId.toString()) && (selectedRole === 'all' || e.role === selectedRole))
                    .map((employee) => {
                      const record = attendanceMap[employee.id];
                      const currentStatus = record?.status || ([0, 6].includes(selectedDate.getDay()) ? 'Folga' : undefined);
                    return (
                      <tr key={employee.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                              {employee.name.charAt(0)}
                            </div>
                            <span className="font-semibold text-slate-900 truncate">{employee.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{employee.role}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {statusOptions.map((opt) => (
                              <button
                                key={opt.id}
                                disabled={userRole !== 'admin'}
                                onClick={() => handleStatusChange(employee.id, opt.id)}
                                title={opt.id}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border whitespace-nowrap ${
                                  currentStatus === opt.id 
                                    ? `${opt.bg} ${opt.color} border-current` 
                                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                                } ${userRole !== 'admin' ? 'opacity-50 cursor-not-allowed' : ''} ${!record && currentStatus === opt.id ? 'opacity-60 border-dashed' : ''}`}
                              >
                                <opt.icon size={14} />
                                <span className="hidden sm:inline">{opt.id}</span>
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="text" 
                            placeholder="Adicionar nota..."
                            className="w-full bg-transparent border-none text-sm text-slate-500 focus:ring-0 placeholder:text-slate-300 min-w-[150px]"
                            defaultValue={record?.observations || ''}
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  // History / Filtered View
                  attendanceRecords.length > 0 ? (
                    attendanceRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-600 whitespace-nowrap">
                          {format(parseISO(record.date), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-900 truncate">{record.employee_name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold w-fit whitespace-nowrap ${
                            statusOptions.find(o => o.id === record.status)?.bg
                          } ${
                            statusOptions.find(o => o.id === record.status)?.color
                          }`}>
                            {React.createElement(statusOptions.find(o => o.id === record.status)?.icon || CheckCircle2, { size: 14 })}
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 min-w-[150px]">
                          {record.observations || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        Nenhum registro encontrado para este filtro.
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!isRangeView && (
        <Pagination 
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
      {/* Medical Certificate Modal */}
      {isMedicalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Registrar Afastamento</h3>
              <button onClick={() => setIsMedicalModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleMedicalSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 mb-4">
                <p className="text-sm text-amber-800 font-medium">Funcionário: <span className="font-bold">{medicalData.employeeName}</span></p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Tipo de Documento</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  value={medicalData.type}
                  onChange={e => setMedicalData({...medicalData, type: e.target.value})}
                >
                  <option value="Atestado Médico">Atestado Médico</option>
                  <option value="Documento de Comparecimento">Documento de Comparecimento</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Data de Início</label>
                  <input 
                    type="date"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    value={medicalData.startDate}
                    onChange={e => setMedicalData({...medicalData, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Dias</label>
                  <input 
                    type="number"
                    min="1"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    value={medicalData.days}
                    onChange={e => setMedicalData({...medicalData, days: parseInt(e.target.value) || 1})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Data de Retorno (Automático)</label>
                <input 
                  type="date"
                  readOnly
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed outline-none"
                  value={medicalData.returnDate}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsMedicalModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Confirmar'}
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
