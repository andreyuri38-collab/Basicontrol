import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  CheckSquare,
  Plus,
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import CloudSync from './CloudSync';

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeEmployees: 0,
    registeredEmployees: 0,
    notRegisteredEmployees: 0,
    currentMonthCost: 0,
    attendanceRate: 0,
    globalProgress: 0,
    dbStatus: 'Carregando...'
  });

  const [progressDetails, setProgressDetails] = useState({
    sectors: [],
    environments: []
  });

  const [extendedData, setExtendedData] = useState({
    costEvolution: [],
    distributionData: [],
    notifications: []
  });

  const [checklists, setChecklists] = useState<any[]>([]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(setStats);

    fetch('/api/progress-details')
      .then(res => res.json())
      .then(setProgressDetails);

    fetch('/api/dashboard-extended')
      .then(res => res.json())
      .then(setExtendedData);

    fetchChecklists();
  }, []);

  const fetchChecklists = () => {
    fetch('/api/checklists')
      .then(res => res.json())
      .then(setChecklists);
  };

  const addChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    fetch('/api/checklists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: newTask, category: 'Geral' })
    }).then(() => {
      setNewTask('');
      fetchChecklists();
    });
  };

  const toggleChecklist = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'Concluído' ? 'Pendente' : 'Concluído';
    fetch(`/api/checklists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    }).then(fetchChecklists);
  };

  const deleteChecklistItem = (id: number) => {
    fetch(`/api/checklists/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-role': 'admin' }
    }).then(fetchChecklists);
  };

  const costData = [
    { name: 'Jan', value: 45000 },
    { name: 'Fev', value: 52000 },
    { name: 'Mar', value: 48000 },
    { name: 'Abr', value: 61000 },
  ];

  const distributionData = [
    { name: 'Salário', value: 70 },
    { name: 'Produção', value: 15 },
    { name: 'Gratificação', value: 10 },
    { name: 'Outros', value: 5 },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  const generatePDFReport = async () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('pt-BR');
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text('Relatório de Progresso da Obra', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Gerado em: ${date}`, 14, 30);
    doc.text(`Progresso Geral: ${stats.globalProgress}%`, 14, 35);
    
    // Summary Table
    autoTable(doc, {
      startY: 45,
      head: [['Métrica', 'Valor']],
      body: [
        ['Progresso Global', `${stats.globalProgress}%`],
        ['Funcionários Ativos', stats.activeEmployees.toString()],
        ['Custo Mão de Obra (Mês)', `R$ ${stats.currentMonthCost.toLocaleString()}`],
        ['Taxa de Presença', `${stats.attendanceRate}%`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }
    });

    // Sectors Progress
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('Progresso por Setor', 14, (doc as any).lastAutoTable.finalY + 15);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Setor', 'Progresso (%)']],
      body: progressDetails.sectors.map((s: any) => [s.name, `${s.percent}%`]),
    });

    // Potential Bottlenecks (Low Progress)
    const bottlenecks = progressDetails.environments.filter((e: any) => e.percent < 30);
    if (bottlenecks.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(239, 68, 68); // red-500
      doc.text('Possíveis Gargalos (Ambientes com baixo progresso)', 14, (doc as any).lastAutoTable.finalY + 15);
      
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Ambiente', 'Progresso (%)']],
        body: bottlenecks.map((e: any) => [e.name, `${e.percent}%`]),
        headStyles: { fillColor: [239, 68, 68] }
      });
    }

    // Recent Notifications
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Alertas e Notificações Recentes', 14, (doc as any).lastAutoTable.finalY + 15);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Título', 'Mensagem', 'Data/Hora']],
      body: extendedData.notifications.map((n: any) => [n.title, n.message, n.time]),
    });

    doc.save(`Relatorio_Obra_${date.replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${stats.dbStatus.includes('Persistente') ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
            <span className="text-sm font-bold text-slate-700">Banco de Dados: <span className={stats.dbStatus.includes('Persistente') ? 'text-emerald-600' : 'text-amber-600'}>{stats.dbStatus}</span></span>
          </div>
          {!stats.dbStatus.includes('Persistente') && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase">Aviso: Dados Temporários</span>
          )}
        </div>
        
        <button 
          onClick={generatePDFReport}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-xs shadow-lg shadow-slate-900/20"
        >
          <Shield size={16} className="text-emerald-400" />
          Gerar Relatório PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Progresso da Obra" 
          value={`${stats.globalProgress}%`} 
          icon={TrendingUp} 
          trend="Avanço Físico"
          trendUp={true}
          color="emerald"
        />
        <StatCard 
          title="Funcionários Ativos" 
          value={stats.activeEmployees} 
          icon={Users} 
          trend={`${stats.registeredEmployees} reg. / ${stats.notRegisteredEmployees} não reg.`}
          trendUp={true}
        />
        <StatCard 
          title="Custo Mão de Obra (Mês)" 
          value={`R$ ${stats.currentMonthCost.toLocaleString()}`} 
          icon={DollarSign} 
          trend="+12% vs mês ant."
          trendUp={false}
        />
        <StatCard 
          title="Taxa de Presença" 
          value={`${stats.attendanceRate}%`} 
          icon={Calendar} 
          trend="Estável"
          trendUp={true}
        />
      </div>

      {/* Module Overview KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Status Estoque</p>
            <h4 className="text-lg font-bold text-slate-900">3 Itens em Alerta</h4>
          </div>
          <ArrowUpRight size={20} className="ml-auto text-amber-500" />
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Atividades Ativas</p>
            <h4 className="text-lg font-bold text-slate-900">12 em Execução</h4>
          </div>
          <ArrowUpRight size={20} className="ml-auto text-indigo-500" />
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Eficiência Financeira</p>
            <h4 className="text-lg font-bold text-slate-900">98.2% do Orçado</h4>
          </div>
          <ArrowDownRight size={20} className="ml-auto text-emerald-500" />
        </div>
      </div>

      {/* Progress Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-500" /> Progresso por Setor
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressDetails.sectors} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={100} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${value}%`, 'Progresso']}
                />
                <Bar dataKey="percent" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" /> Top Ambientes (Avanço)
          </h3>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {progressDetails.environments.map((e: any) => (
              <div key={e.name} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600 truncate">{e.name}</span>
                    <span className="text-blue-600">{e.percent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-1000" 
                      style={{ width: `${e.percent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
            {progressDetails.environments.length === 0 && (
              <p className="text-center text-slate-400 py-8 italic">Nenhum dado de ambiente disponível</p>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Evolução de Custos</h3>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              Total Mensal
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={extendedData.costEvolution}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`R$ ${value.toLocaleString()}`, 'Custo']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-6">Distribuição de Pagamentos</h3>
          <div className="h-80 flex flex-col sm:flex-row items-center gap-8">
            <div className="flex-1 w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={extendedData.distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {extendedData.distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value}%`, 'Percentual']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 w-full sm:w-auto shrink-0">
              {extendedData.distributionData.map((item: any, i: number) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                  <span className="text-sm text-slate-600 font-medium">{item.name}</span>
                  <span className="text-sm text-slate-400 ml-auto">{item.value}%</span>
                </div>
              ))}
              {extendedData.distributionData.length === 0 && (
                <p className="text-xs text-slate-400 italic">Sem dados de pagamento</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications & Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bell size={20} className="text-amber-500" /> Feed de Notificações
            </h3>
            <span className="text-xs font-medium text-slate-400">Recentes</span>
          </div>
          <div className="space-y-4">
            {extendedData.notifications.map((n: any) => (
              <div key={n.id} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  n.status === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {n.status === 'warning' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{n.title}</h4>
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <Clock size={10} /> {n.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))}
            {extendedData.notifications.length === 0 && (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell size={24} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-400 italic">Nenhuma notificação recente</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckSquare size={20} className="text-indigo-500" /> Checklist da Obra
              </h3>
            </div>
            
            <form onSubmit={addChecklistItem} className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="Nova tarefa..."
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
              />
              <button type="submit" className="p-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600">
                <Plus size={20} />
              </button>
            </form>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {checklists.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                  <button 
                    onClick={() => toggleChecklist(item.id, item.status)}
                    className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      item.status === 'Concluído' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {item.status === 'Concluído' && <CheckCircle2 size={12} />}
                  </button>
                  <span className={`flex-1 text-sm font-medium ${item.status === 'Concluído' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                    {item.task}
                  </span>
                  <button 
                    onClick={() => deleteChecklistItem(item.id)}
                    className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {checklists.length === 0 && (
                <p className="text-center text-slate-400 text-xs italic py-8">Nenhuma tarefa pendente</p>
              )}
            </div>
          </div>

          <CloudSync />
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Segurança</h3>
                <p className="text-xs text-slate-500">Dados protegidos localmente.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 mb-1">Backup Local</h4>
                <p className="text-[10px] text-slate-500">SQLite persistido no servidor.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 mb-1">Criptografia</h4>
                <p className="text-[10px] text-slate-500">Senhas com hash bcrypt.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendUp, color = 'slate' }: any) {
  const colorClasses: any = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-50 text-slate-600'
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
          trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
        }`}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
      <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
      <h4 className="text-2xl font-bold tracking-tight">{value}</h4>
    </div>
  );
}
