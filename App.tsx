
import React, { useState, useMemo } from 'react';
import { Mail, Lock, ArrowRight, AlertTriangle } from 'lucide-react';
import { Input } from './components/Input';
import { Button } from './components/Button';
import { LoginStatus } from './types';
import { ForgotPasswordWizard } from './components/ForgotPasswordWizard';
import { Home } from './components/Home';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { generateHash } from './lib/crypto';
import { useConfig } from './contexts/ConfigContext';

type ViewState = 'LOGIN' | 'FORGOT_PASSWORD' | 'HOME';

const FallingCoupons = () => {
  const { config } = useConfig();
  const particleImg = config['login.imagem_particula'] || "https://cdn-icons-png.flaticon.com/512/8830/8830682.png";
  
  const coupons = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: `${8 + Math.random() * 12}s`,
      delay: `${Math.random() * 15}s`,
      size: `${35 + Math.random() * 45}px`,
      opacity: 0.15 + Math.random() * 0.3,
      rotation: `${Math.random() * 360}deg`
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-15vh) rotate(0deg); opacity: 0; }
          15% { opacity: var(--target-opacity); }
          85% { opacity: var(--target-opacity); }
          100% { transform: translateY(115vh) rotate(var(--target-rotation)); opacity: 0; }
        }
        @keyframes sway {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(40px); }
        }
        .coupon-item {
          position: absolute;
          top: -15%;
          animation: fall linear infinite;
        }
        .coupon-inner {
          animation: sway ease-in-out infinite;
        }
      `}</style>
      {coupons.map((c) => (
        <div
          key={c.id}
          className="coupon-item"
          style={{
            left: c.left,
            animationDuration: c.duration,
            animationDelay: c.delay,
            '--target-opacity': c.opacity,
            '--target-rotation': c.rotation
          } as any}
        >
          <img
            src={particleImg}
            alt="particula"
            className="coupon-inner"
            style={{
              width: c.size,
              height: 'auto',
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default function App() {
  const { config } = useConfig();
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const savedSession = localStorage.getItem('user_session') || sessionStorage.getItem('user_session');
      return savedSession ? JSON.parse(savedSession) : null;
    } catch (e) {
      localStorage.removeItem('user_session');
      sessionStorage.removeItem('user_session');
      return null;
    }
  });

  const [view, setView] = useState<ViewState>(() => {
    const session = localStorage.getItem('user_session') || sessionStorage.getItem('user_session');
    return session ? 'HOME' : 'LOGIN';
  });
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
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
        .from('usuarios')
        .select(`id, uuid, nome, email, senha_hash, tipo_usuario, status, foto_url, avatars (url_imagem)`)
        .or(`email.eq.${trimmedEmail},cpf.eq.${trimmedEmail}`)
        .single();

      if (error || !user) throw new Error("Usuário não encontrado ou credenciais inválidas.");
      if (user.tipo_usuario === 'CLIENTE') throw new Error("Painel restrito.");
      if (user.status !== 'ATIVO') throw new Error("Acesso não permitido.");

      const inputHash = await generateHash(trimmedPassword);
      if (user.senha_hash.toLowerCase() !== inputHash.toLowerCase()) throw new Error("Senha incorreta.");

      const sessionData = { ...user, perfil: user.tipo_usuario || 'LOJISTA' };
      delete sessionData.senha_hash;
      if (rememberMe) localStorage.setItem('user_session', JSON.stringify(sessionData));
      else sessionStorage.setItem('user_session', JSON.stringify(sessionData));

      setCurrentUser(sessionData);
      setStatus(LoginStatus.SUCCESS);
      setTimeout(() => { setStatus(LoginStatus.IDLE); setView('HOME'); }, 500);
    } catch (err: any) {
      setStatus(LoginStatus.ERROR);
      setErrorMessage(err.message || "Falha na autenticação.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    sessionStorage.removeItem('user_session');
    setCurrentUser(null);
    setView('LOGIN');
  };

  if (view === 'HOME') return <Home onLogout={handleLogout} user={currentUser} />;

  const primaryColor = config['sistema.cor_primaria'] || 'var(--primary-color, #1e293b)';
  const loginBgPattern = config['login.imagem_fundo'] || "https://i.ibb.co/mFPg5vf2/Sem-nome-512-x-512-px-3.png";
  const loginHero = config['login.imagem_hero'] || "https://i.ibb.co/C3W3hz93/man.png";
  const loginLogo = config['login.logo_url'] || "https://i.ibb.co/rRRxMR96/Design-sem-nome-2.png";

  return (
    <div 
      className="relative min-h-screen w-full flex overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: primaryColor }}
    >
      {/* Camada de Background Image com Opacidade */}
      <div 
        className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none z-0"
        style={{ 
          backgroundImage: `url('${loginBgPattern}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>

      <FallingCoupons />
      
      <div className="relative z-10 w-full flex flex-col lg:flex-row min-h-screen">
        <div className="w-full flex-1 lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md animate-fade-in">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_80px_-15px_rgba(0,0,0,0.5)] overflow-hidden border border-white/60">
              <div className="p-8 md:p-12">
                {view === 'LOGIN' ? (
                  <>
                    <div className="mb-10 text-center">
                      <img src={loginLogo} alt="Logo" className="h-20 mx-auto mb-6 object-contain" />
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Painel de Acesso</h2>
                      <p className="text-[10px] text-gray-400 mt-2 font-black uppercase tracking-[0.2em]">Portal Administrativo</p>
                    </div>
                    {errorMessage && (
                      <div className="mb-6 p-4 bg-red-50 text-red-700 text-xs rounded-xl flex items-start border border-red-100">
                        <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                        <span className="font-bold">{errorMessage}</span>
                      </div>
                    )}
                    <form onSubmit={handleLogin} className="space-y-6">
                      <Input label="E-mail ou CPF" type="text" placeholder="admin@clube.com" value={email} onChange={(e) => setEmail(e.target.value)} required icon={<Mail size={18} />} className="rounded-xl" />
                      <div className="space-y-3">
                        <Input label="Senha" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required icon={<Lock size={18} />} className="rounded-xl" />
                        <div className="flex items-center justify-between px-1">
                          <label className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest cursor-pointer select-none">
                            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-gray-300" style={{ color: primaryColor }} />
                            <span>Manter conectado</span>
                          </label>
                          <button 
                            type="button" 
                            onClick={() => setView('FORGOT_PASSWORD')} 
                            style={{ color: primaryColor }}
                            className="text-[10px] font-black uppercase tracking-widest hover:brightness-75"
                          >
                            Esqueceu sua senha?
                          </button>
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        isLoading={status === LoginStatus.LOADING} 
                        style={{ backgroundColor: primaryColor }}
                        className="text-white shadow-xl py-5 rounded-xl text-xs uppercase tracking-[0.2em] font-black transition-all hover:brightness-110"
                      >
                        Acessar Sistema <ArrowRight size={18} className="ml-2" />
                      </Button>
                    </form>
                  </>
                ) : <ForgotPasswordWizard onBackToLogin={() => setView('LOGIN')} />}
              </div>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex lg:w-1/2 min-h-screen items-end justify-center relative pointer-events-none">
           <img src={loginHero} alt="Hero" className="w-auto h-auto max-h-[85vh] object-contain object-bottom drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-20 duration-1000" />
        </div>
      </div>
    </div>
  );
}
