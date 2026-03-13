import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  TrendingUp, 
  Users, 
  DollarSign,
  AlertCircle,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement,
  LineElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement,
  LineElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

export default function Analytics() {
  const [loading, setLoading] = useState(true);

  // Mock data for analytics
  const costCurveData = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Custo Previsto',
        data: [10000, 25000, 45000, 70000, 100000, 135000, 170000],
        borderColor: '#94a3b8',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
      },
      {
        label: 'Custo Real',
        data: [12000, 28000, 48000, 75000, 110000],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const productivityData = {
    labels: ['Equipe A', 'Equipe B', 'Equipe C', 'Equipe D'],
    datasets: [
      {
        label: 'm²/dia',
        data: [12, 19, 15, 22],
        backgroundColor: '#10b981',
        borderRadius: 8,
      },
    ],
  };

  const progressVsPlanning = {
    labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
    datasets: [
      {
        label: 'Planejado',
        data: [20, 40, 60, 80],
        backgroundColor: '#e2e8f0',
        borderRadius: 8,
      },
      {
        label: 'Realizado',
        data: [18, 35, 55, 75],
        backgroundColor: '#3b82f6',
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analytics & Performance</h2>
          <p className="text-slate-500 text-sm">Visão analítica do progresso, custos e produtividade.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all">
            <Calendar size={20} />
          </button>
          <select className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500">
            <option>Últimos 30 dias</option>
            <option>Últimos 90 dias</option>
            <option>Todo o projeto</option>
          </select>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Progresso Geral</p>
          <div className="flex items-end gap-2">
            <h3 className="text-2xl font-bold text-slate-900">42.5%</h3>
            <span className="text-emerald-600 text-xs font-bold mb-1">+2.1%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 h-full" style={{ width: '42.5%' }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Produtividade Média</p>
          <div className="flex items-end gap-2">
            <h3 className="text-2xl font-bold text-slate-900">18.4</h3>
            <span className="text-slate-500 text-xs font-bold mb-1">m²/dia</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Dentro da meta esperada</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Índice de Custo (CPI)</p>
          <div className="flex items-end gap-2">
            <h3 className="text-2xl font-bold text-slate-900">0.92</h3>
            <span className="text-red-600 text-xs font-bold mb-1">-0.08</span>
          </div>
          <p className="text-[10px] text-red-500 mt-2">8% acima do orçamento</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Previsão de Término</p>
          <div className="flex items-end gap-2">
            <h3 className="text-2xl font-bold text-slate-900">12 Dias</h3>
            <span className="text-amber-600 text-xs font-bold mb-1">Atraso</span>
          </div>
          <p className="text-[10px] text-amber-500 mt-2">Ajuste de cronograma sugerido</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Curve */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Curva S (Custo vs Tempo)</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="h-64">
            <Line 
              data={costCurveData} 
              options={{ 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: { y: { beginAtZero: true } }
              }} 
            />
          </div>
        </div>

        {/* Progress vs Planning */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Progresso vs Planejado</h3>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="h-64">
            <Bar 
              data={progressVsPlanning} 
              options={{ 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: { y: { beginAtZero: true, max: 100 } }
              }} 
            />
          </div>
        </div>

        {/* Worker Productivity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Produtividade por Equipe</h3>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users size={18} />
            </div>
          </div>
          <div className="h-64">
            <Bar 
              data={productivityData} 
              options={{ 
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: { legend: { display: false } }
              }} 
            />
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Alertas Críticos & Sugestões</h3>
          <div className="space-y-4">
            <div className="flex gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
              <AlertCircle className="text-red-500 shrink-0" size={24} />
              <div>
                <p className="text-sm font-bold text-red-900">Atraso Crítico: Setor A</p>
                <p className="text-xs text-red-700 mt-1">A atividade de Alvenaria está 15% atrás do cronograma. Sugerido reforço de equipe.</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <AlertCircle className="text-amber-500 shrink-0" size={24} />
              <div>
                <p className="text-sm font-bold text-amber-900">Desvio de Custo: Materiais</p>
                <p className="text-xs text-amber-700 mt-1">O custo de materiais de pintura excedeu o previsto em 10% nesta quinzena.</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <TrendingUp className="text-blue-500 shrink-0" size={24} />
              <div>
                <p className="text-sm font-bold text-blue-900">Oportunidade de Melhoria</p>
                <p className="text-xs text-blue-700 mt-1">A Equipe D está com produtividade 20% acima da média. Analisar métodos aplicados.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
