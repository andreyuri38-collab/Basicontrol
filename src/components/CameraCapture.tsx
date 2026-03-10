import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPermitted, setIsPermitted] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    checkPermission();
    return () => {
      stopCamera();
    };
  }, []);

  const checkPermission = async () => {
    try {
      const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setIsPermitted(status.state === 'granted');
      
      status.onchange = () => {
        setIsPermitted(status.state === 'granted');
      };
    } catch (err) {
      console.error("Permissions API not supported or error:", err);
    }
  };

  const startCamera = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsPermitted(true);
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      if (err.name === 'NotAllowedError') {
        setError("Acesso à câmera negado. Por favor, permita o acesso nas configurações do seu navegador.");
      } else {
        setError("Não foi possível acessar a câmera. Verifique se ela está sendo usada por outro aplicativo.");
      }
      setIsPermitted(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl);
        stopCamera();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Capturar Foto</h3>
            <p className="text-sm text-slate-500">Use a câmera para tirar uma foto</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="relative aspect-video bg-slate-900 flex items-center justify-center">
          {stream ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-8">
              {error ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle size={32} />
                  </div>
                  <p className="text-white text-sm max-w-xs mx-auto">{error}</p>
                  <button 
                    onClick={startCamera}
                    className="px-6 py-2 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all"
                  >
                    Tentar Novamente
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                    <Camera size={32} />
                  </div>
                  <p className="text-slate-400 text-sm">A câmera está desligada</p>
                  <button 
                    onClick={startCamera}
                    className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Ativar Câmera
                  </button>
                </div>
              )}
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-6 bg-slate-50 flex items-center justify-center gap-4">
          {stream ? (
            <>
              <button 
                onClick={stopCamera}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-all font-semibold text-sm"
              >
                <X size={18} />
                Cancelar
              </button>
              <button 
                onClick={capturePhoto}
                className="flex items-center gap-2 px-8 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-semibold text-sm shadow-lg shadow-emerald-500/20"
              >
                <Camera size={18} />
                Tirar Foto
              </button>
            </>
          ) : (
            <button 
              onClick={onClose}
              className="px-8 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold text-sm"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
