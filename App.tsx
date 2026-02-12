
import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight, Building2, AlertTriangle } from 'lucide-react';
import { Input } from './components/Input';
import { Button } from './components/Button';
import { LoginStatus } from './types';
import { ForgotPasswordWizard } from './components/ForgotPasswordWizard';
import { Home } from './components/Home';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { generateHash } from './lib/crypto';

type ViewState = 'LOGIN' | 'FORGOT_PASSWORD' | 'HOME';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const savedSession = localStorage.getItem('user_session');
      return savedSession ? JSON.parse(savedSession) : null;
    } catch (e) {
      localStorage.removeItem('user_session');
      return null;
    }
  });

  const [view, setView] = useState<ViewState>(() => {
    return localStorage.getItem('user_session') ? 'HOME' : 'LOGIN';
  });
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<LoginStatus>(LoginStatus.IDLE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email || !password) return;

    if (!isSupabaseConfigured() || !supabase) {
      setErrorMessage("Erro crítico: Banco de dados não configurado.");
      return;
    }

    setStatus(LoginStatus.LOADING);

    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      const { data: user, error } = await supabase
        .from('tb_usuarios')
        .select('*')
        .eq('email', trimmedEmail)
        .single();

      if (error || !user) {
        throw new Error("Usuário não encontrado ou e-mail inválido.");
      }

      // REGRA RÍGIDA DE STATUS: Apenas 'ATIVO' pode entrar.
      // Bloqueia 'SUSPENSO', 'SOLICITOU CANCELAMENTO', 'CANCELADO' e qualquer outro.
      if (user.status_conta !== 'ATIVO') {
        const statusMsg = user.status_conta === 'SUSPENSO' ? "suspensa" : 
                         user.status_conta === 'CANCELADO' ? "cancelada" : 
                         "bloqueada por solicitação de cancelamento";
        throw new Error(`Sua conta está ${statusMsg}. Entre em contato com o suporte.`);
      }

      const inputHash = await generateHash(trimmedPassword);
      const storedHash = user.senha_hash;

      let isPasswordValid = false;
      let isMigrationNeeded = false;

      if (storedHash && storedHash.toLowerCase() === inputHash.toLowerCase()) {
         isPasswordValid = true;
      } 
      else if (storedHash && storedHash === trimmedPassword) {
         isPasswordValid = true;
         isMigrationNeeded = true;
      }

      if (!isPasswordValid) {
        throw new Error("Senha incorreta.");
      }

      if (isMigrationNeeded) {
        await supabase
          .from('tb_usuarios')
          .update({ senha_hash: inputHash })
          .eq('id', user.id);
      }

      const sessionData = {
        id: user.id,
        nome: user.nome_completo || user.nome || 'Usuário',
        email: user.email,
        role: user.role || 'admin',
        perfil: user.perfil || user.role?.toUpperCase() || 'LOJISTA',
        foto_perfil_url: user.foto_perfil_url
      };

      // Auditoria de Login
      try {
        await supabase.from('tb_logs_audit').insert({
          id_usuario: sessionData.id,
          acao: 'LOGIN',
          tabela: 'SISTEMA',
          descricao: `Usuário ${sessionData.nome} realizou login no painel.`
        });
      } catch (auditErr) {
        console.warn("[Audit Log Skip] Falha ao registrar log de login.", auditErr);
      }

      localStorage.setItem('user_session', JSON.stringify(sessionData));
      setCurrentUser(sessionData);
      setStatus(LoginStatus.SUCCESS);
      
      setTimeout(() => {
        setStatus(LoginStatus.IDLE);
        setView('HOME');
      }, 500);

    } catch (err: any) {
      console.error("Erro no login:", err.message);
      setStatus(LoginStatus.ERROR);
      setErrorMessage(err.message || "Falha na autenticação.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    setCurrentUser(null);
    setEmail('');
    setPassword('');
    setView('LOGIN');
  };

  if (view === 'HOME') {
    return <Home onLogout={handleLogout} user={currentUser} />;
  }

  return (
    <div className="relative min-h-screen w-full flex overflow-hidden">
      <div className="login-background"></div>
      <div className="absolute inset-0 bg-yellow-500/20 backdrop-blur-[1px]"></div>

      <div className="relative z-10 w-full flex flex-col lg:flex-row min-h-screen">
        <div className="w-full flex-1 lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/50">
              <div className="p-8">
                {view === 'LOGIN' ? (
                  <>
                    <div className="mb-8 text-center">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-slate-900 text-white shadow-xl mb-4">
                        <Building2 size={28} />
                      </div>
                      <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                        Acesso Administrativo
                      </h2>
                      <p className="text-sm text-gray-500 mt-2 font-medium">
                        Entre com suas credenciais de parceiro
                      </p>
                    </div>

                    {errorMessage && (
                      <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start animate-pulse">
                        <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                      <Input
                        label="E-mail de Acesso"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        icon={<Mail size={18} />}
                      />
                      
                      <div className="space-y-1">
                        <Input
                          label="Senha"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          icon={<Lock size={18} />}
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setView('FORGOT_PASSWORD')}
                            className="text-sm font-semibold text-yellow-600 hover:text-yellow-700 transition-colors"
                          >
                            Esqueceu sua senha?
                          </button>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        isLoading={status === LoginStatus.LOADING}
                        className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
                      >
                        Entrar no Painel <ArrowRight size={18} className="ml-2" />
                      </Button>
                    </form>
                  </>
                ) : (
                  <ForgotPasswordWizard onBackToLogin={() => setView('LOGIN')} />
                )}
              </div>
              
              <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                  Clube Partner &copy; 2024
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex lg:w-1/2 min-h-screen items-end justify-center relative pointer-events-none">
           <img 
             src="https://i.ibb.co/C3W3hz93/man.png" 
             alt="Parceiro Clube Partner" 
             className="w-auto h-auto max-h-[90vh] object-contain object-bottom drop-shadow-2xl"
           />
        </div>
      </div>
    </div>
  );
}
