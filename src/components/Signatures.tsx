import React, { useState, useRef } from 'react';
import { 
  PenTool, 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  User,
  Download,
  Trash2
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

export default function Signatures({ userRole }: { userRole?: string }) {
  const [documents, setDocuments] = useState([
    { id: 1, title: 'EPI - Fevereiro 2024', type: 'Coletivo', status: 'Pendente', signed: 12, total: 15 },
    { id: 2, title: 'Contrato de Trabalho - João Silva', type: 'Individual', status: 'Assinado', signed: 1, total: 1 },
  ]);
  const [isSigning, setIsSigning] = useState(false);
  const sigPad = useRef<any>(null);

  const clearSignature = () => {
    sigPad.current?.clear();
  };

  const saveSignature = () => {
    if (sigPad.current?.isEmpty()) return;
    const dataUrl = sigPad.current?.getTrimmedCanvas().toDataURL('image/png');
    console.log('Signature saved:', dataUrl);
    setIsSigning(false);
    // In a real app, send to API
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <PenTool size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Coleta de Assinaturas</h3>
            <p className="text-sm text-slate-500">Gestão de documentos e conformidade</p>
          </div>
        </div>
        
        {userRole === 'admin' && (
          <button className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-semibold shadow-lg shadow-emerald-500/20">
            <Upload size={18} />
            Novo Documento
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 rounded-xl transition-all">
                  <FileText size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{doc.title}</h4>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{doc.type}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                doc.status === 'Assinado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {doc.status}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">Progresso de Assinaturas</span>
                <span className="text-slate-900 font-bold">{doc.signed} / {doc.total}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${(doc.signed / doc.total) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button 
                onClick={() => setIsSigning(true)}
                className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-sm font-semibold"
              >
                Assinar Agora
              </button>
              <button className="p-2.5 border border-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all">
                <Download size={20} />
              </button>
              <button className="p-2.5 border border-slate-200 text-slate-400 hover:text-red-500 rounded-xl transition-all">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Signature Modal */}
      {isSigning && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-none md:rounded-3xl w-full max-w-lg h-full md:h-auto shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold">Assinatura Digital</h3>
                <p className="text-sm text-slate-500">Desenhe sua assinatura abaixo</p>
              </div>
              <button onClick={() => setIsSigning(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 overflow-hidden">
                <SignatureCanvas 
                  ref={sigPad}
                  penColor="#0f172a"
                  canvasProps={{
                    className: "w-full h-64 cursor-crosshair"
                  }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  {new Date().toLocaleString()}
                </div>
                <div className="flex items-center gap-1">
                  <User size={14} />
                  IP: 192.168.1.45
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button 
                  onClick={clearSignature}
                  className="w-full sm:w-auto px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold order-2 sm:order-1"
                >
                  Limpar
                </button>
                <button 
                  onClick={saveSignature}
                  className="w-full sm:w-auto px-8 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 font-semibold shadow-lg shadow-emerald-500/20 order-1 sm:order-2"
                >
                  Confirmar Assinatura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function X({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
