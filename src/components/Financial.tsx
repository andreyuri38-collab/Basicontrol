import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  Calendar,
  Filter,
  Download,
  TrendingUp
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title 
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title
);

export default function Financial() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expRes, dashRes] = await Promise.all([
        fetch('/api/v2/financial/expenses'),
        fetch('/api/v2/financial/dashboard')
      ]);
      const expData = await expRes.json();
      const dashData = await dashRes.json();
      setExpenses(Array.isArray(expData) ? expData : []);
      setDashboardData(dashData && !dashData.error ? dashData : null);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = {
    labels: dashboardData ? Object.keys(dashboardData.byCategory) : [],
    datasets: [
      {
        data: dashboardData ? Object.values(dashboardData.byCategory) : [],
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Controle Financeiro</h2>
          <p className="text-slate-500 text-sm">Acompanhe custos, despesas e fluxo de caixa da obra.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium hover:bg-slate-50 transition-all">
            <Download size={18} />
            Exportar
          </button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg shadow-blue-200">
            <Plus size={20} />
            Nova Despesa
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500 font-medium">Custo Total</p>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            R$ {dashboardData?.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs font-bold">
            <ArrowUpRight size={14} />
            <span>12% vs mês anterior</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500 font-medium">Mão de Obra</p>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Plus size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            R$ {dashboardData?.byCategory['Mão de Obra']?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
          </h3>
          <p className="text-xs text-slate-400 mt-2">Pagamentos realizados</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500 font-medium">Materiais</p>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Plus size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            R$ {dashboardData?.byCategory['Material']?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
          </h3>
          <p className="text-xs text-slate-400 mt-2">Compras e suprimentos</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500 font-medium">Progresso Físico</p>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            {dashboardData?.progressPercent.toFixed(1)}%
          </h3>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-600 h-full" style={{ width: `${dashboardData?.progressPercent}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Distribuição de Custos</h3>
          <div className="aspect-square flex items-center justify-center">
            {dashboardData && <Pie data={pieData} options={{ maintainAspectRatio: false }} />}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Últimas Despesas</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-bold">Ver tudo</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.slice(0, 5).map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">{exp.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        exp.category === 'Mão de Obra' ? 'bg-blue-50 text-blue-600' :
                        exp.category === 'Material' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{exp.description}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      R$ {exp.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
