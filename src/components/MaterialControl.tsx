import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  CheckCircle2,
  Search,
  ArrowRight
} from 'lucide-react';

export default function MaterialControl() {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // This endpoint should be added to the modular routes
      const res = await fetch('/api/v2/material/requirements');
      const data = await res.json();
      setRequirements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching material requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Controle de Materiais</h2>
          <p className="text-slate-500 text-sm">Cálculo automático de necessidades e gestão de pedidos.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg shadow-blue-200">
          <ShoppingCart size={20} />
          Novo Pedido de Compra
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Requirements List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Necessidade Total do Projeto</h3>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Calculado via Composições</span>
          </div>
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Filtrar materiais..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-3">
              {requirements.map((req, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg text-slate-600">
                      <Package size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{req.name}</p>
                      <p className="text-xs text-slate-500">Total necessário: {req.quantity} {req.unit}</p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-300" />
                </div>
              ))}
              {requirements.length === 0 && !loading && (
                <p className="text-center text-slate-500 py-8 text-sm">Nenhum material calculado.</p>
              )}
            </div>
          </div>
        </div>

        {/* Inventory Alerts & Orders */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Alertas de Estoque</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
                <AlertTriangle className="text-red-500" size={24} />
                <div>
                  <p className="text-sm font-bold text-red-900">Cimento CP-II</p>
                  <p className="text-xs text-red-700">Abaixo do estoque mínimo (15 sacos restantes)</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <AlertTriangle className="text-amber-500" size={24} />
                <div>
                  <p className="text-sm font-bold text-amber-900">Areia Média</p>
                  <p className="text-xs text-amber-700">Pedido pendente há 3 dias</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Pedidos de Compra Recentes</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-slate-900">#PC-2024-001</p>
                  <p className="text-xs text-slate-500">Fornecedor: Materiais Silva</p>
                </div>
                <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg uppercase">Entregue</span>
              </div>
              <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-slate-900">#PC-2024-002</p>
                  <p className="text-xs text-slate-500">Fornecedor: Tintas & Cia</p>
                </div>
                <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg uppercase">Em Trânsito</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
