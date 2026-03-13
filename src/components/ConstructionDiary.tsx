import React, { useState, useEffect } from 'react';
import { 
  Book, 
  Sun, 
  Cloud, 
  CloudRain, 
  Plus,
  Camera,
  Users,
  Activity,
  ChevronRight,
  Calendar
} from 'lucide-react';

export default function ConstructionDiary() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/v2/diary');
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching diary entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'Ensolarado': return <Sun className="text-amber-500" size={20} />;
      case 'Nublado': return <Cloud className="text-slate-400" size={20} />;
      case 'Chuvoso': return <CloudRain className="text-blue-500" size={20} />;
      default: return <Sun size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Diário de Obra</h2>
          <p className="text-slate-500 text-sm">Registro diário de atividades, clima e ocorrências.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg shadow-blue-200">
          <Plus size={20} />
          Novo Registro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Timeline of entries */}
        <div className="md:col-span-2 space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{entry.date}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getWeatherIcon(entry.weather)}
                      <span className="text-sm text-slate-500">{entry.weather}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>

              <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                {entry.observations || "Nenhuma observação registrada para este dia."}
              </p>

              <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-slate-500">
                  <Users size={16} />
                  <span className="text-xs font-medium">{entry.workers?.length || 0} Equipes</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Activity size={16} />
                  <span className="text-xs font-medium">{entry.activities?.length || 0} Atividades</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Camera size={16} />
                  <span className="text-xs font-medium">0 Fotos</span>
                </div>
              </div>
            </div>
          ))}

          {entries.length === 0 && !loading && (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200">
              <Book className="mx-auto text-slate-300 mb-4" size={48} />
              <h3 className="text-lg font-bold text-slate-900">Nenhum registro</h3>
              <p className="text-slate-500 text-sm">Comece a registrar o dia a dia da sua obra.</p>
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-200">
            <h3 className="text-lg font-bold mb-2">Resumo da Semana</h3>
            <p className="text-blue-100 text-sm mb-4">Você registrou 5 de 7 dias nesta semana.</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map(d => (
                <div key={d} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${d <= 5 ? 'bg-white text-blue-600' : 'bg-blue-500 text-blue-200'}`}>
                  {d}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Clima Previsto</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sun className="text-amber-500" size={20} />
                  <span className="text-sm font-medium text-slate-700">Amanhã</span>
                </div>
                <span className="text-sm text-slate-500">28°C / 18°C</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CloudRain className="text-blue-500" size={20} />
                  <span className="text-sm font-medium text-slate-700">Sábado</span>
                </div>
                <span className="text-sm text-slate-500">22°C / 15°C</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
