import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Layers,
  ShieldCheck,
  HardHat,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { UserRole } from '../types';

export const LoginView: React.FC = () => {
  const { login, register, signInWithGoogle, quickLoginAs } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('campo');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      console.error('Google Sign-In error:', err);
      if (err instanceof Error) {
        if (err.message.includes('popup-closed-by-user')) {
          setError('A autenticação com Google foi cancelada antes de concluir.');
        } else if (err.message.includes('popup-blocked')) {
          setError('O navegador bloqueou a janela pop-up do Google. Por favor, autorize pop-ups para este site ou abra o app em uma nova aba.');
        } else if (err.message.includes('operation-not-allowed')) {
          setError('O provedor de autenticação Google não está ativado no Firebase Console deste projeto.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Falha ao autenticar com o Google. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        if (!name.trim()) throw new Error('Por favor, informe o seu nome completo.');
        await register(email, password, name, role);
      } else {
        await login(email, password);
      }
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        if (err.message.includes('operation-not-allowed') || err.message.includes('auth/operation-not-allowed')) {
          setError(
            'O método E-mail/Senha não está ativado no Firebase Console deste projeto. Utilize o botão "Entrar com Google" acima para acesso imediato e seguro.'
          );
        } else if (err.message.includes('user-not-found') || err.message.includes('invalid-credential')) {
          setError('E-mail ou senha incorretos. Utilize o login com Google caso prefira.');
        } else if (err.message.includes('email-already-in-use')) {
          setError('Este e-mail já está cadastrado. Faça login ou utilize outro e-mail.');
        } else if (err.message.includes('weak-password')) {
          setError('A senha deve ter no mínimo 6 caracteres.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Ocorreu um erro ao autenticar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (targetRole: UserRole) => {
    setError(null);
    setLoading(true);
    try {
      await quickLoginAs(targetRole);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('operation-not-allowed') || err.message.includes('auth/operation-not-allowed')) {
          setError(
            'O provedor E-mail/Senha não está habilitado no Firebase Console. Utilize o botão "Entrar com Google" acima para autenticar com seu e-mail.'
          );
        } else {
          setError(err.message);
        }
      } else {
        setError('Falha no acesso rápido.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md">
        {/* Header / Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 shadow-xl shadow-orange-600/30 mb-3 text-white">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Space_Grotesk']">
            Nivelar<span className="text-orange-500">Obras</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gestão Operacional de Contrapiso Autonivelante
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Acesso ao Sistema</h2>
              <p className="text-xs text-slate-400">Autenticação segura via Firebase</p>
            </div>
            <PWAInstallButton />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-amber-950/70 border border-amber-700/80 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-300">Atenção</p>
                <p className="leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Primary Google Sign-In Action */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl flex items-center justify-center gap-3 active:scale-98 transition disabled:opacity-50 group"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Autenticando...' : 'Entrar com Google'}</span>
            </button>

            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2 text-[11px] text-slate-300">
              <Info className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <span>
                Recomendado: <strong>andreyuri38@gmail.com</strong> possui acesso de <strong>Admin (Sócio / Engenheiro)</strong> com controle total.
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <button
                type="button"
                onClick={() => setShowEmailForm(!showEmailForm)}
                className="px-2 bg-slate-900 text-slate-400 hover:text-slate-200 transition"
              >
                {showEmailForm ? 'Ocultar login por E-mail' : 'ou entrar com E-mail / Senha'}
              </button>
            </div>
          </div>

          {/* Optional Email/Password Form */}
          {showEmailForm && (
            <form onSubmit={handleSubmit} className="space-y-3.5 mb-5 pt-1">
              {isRegistering && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Encarregado"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="seu.email@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                  />
                </div>
              </div>

              {isRegistering && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Perfil de Acesso
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('campo')}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        role === 'campo'
                          ? 'bg-orange-600/20 border-orange-500 text-orange-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      <HardHat className="w-3.5 h-3.5" />
                      <span>Campo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        role === 'admin'
                          ? 'bg-orange-600/20 border-orange-500 text-orange-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Admin</span>
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-600/25 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                <span>{loading ? 'Aguarde...' : isRegistering ? 'Cadastrar' : 'Acessar'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError(null);
                  }}
                  className="text-xs text-orange-400 hover:text-orange-300 font-medium"
                >
                  {isRegistering
                    ? 'Já possui conta de e-mail? Fazer login'
                    : 'Não possui conta de e-mail? Cadastrar novo'}
                </button>
              </div>
            </form>
          )}

          {/* Quick 1-Click Access for Evaluation */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Acesso Rápido de Teste
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuick('admin')}
                disabled={loading}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left transition group active:scale-98"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500 group-hover:text-white transition">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Admin (Sócio)</p>
                  <p className="text-[10px] text-slate-400 truncate">Acesso total + Financeiro</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuick('campo')}
                disabled={loading}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left transition group active:scale-98"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500 group-hover:text-white transition">
                  <HardHat className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Campo (Encarregado)</p>
                  <p className="text-[10px] text-slate-400 truncate">Programação e Apontamento</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Firebase Cloud Sync & PWA Offline Pronto</span>
        </div>
      </div>
    </div>
  );
};
