
import React, { useState, useEffect } from 'react';
import { Mail, ShieldCheck, Lock, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';
import { supabase } from '../lib/supabase';
import { generateHash } from '../lib/crypto';
import { useConfig } from '../contexts/ConfigContext';

const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

interface ForgotPasswordWizardProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordWizard: React.FC<ForgotPasswordWizardProps> = ({ onBackToLogin }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  
  // Form State
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState<any>(null);

  const { config } = useConfig();
  const primaryColor = config['sistema.cor_primaria'] || 'var(--primary-color, #1e293b)';

  // Efeito para o contador de reenvio
  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleStep1 = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    // 1. Gerar código aleatório de 6 dígitos
    const codeToUse = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      if (!supabase) throw new Error("Erro de configuração do banco de dados.");

      const trimmedEmail = email.trim();
      const inputCpfClean = cpf.replace(/\D/g, '');

      // 2. Validar se o usuário existe na tabela 'usuarios'
      const { data: user, error: dbError } = await supabase
        .from('usuarios')
        .select('id, nome, email, cpf')
        .eq('email', trimmedEmail)
        .single();

      if (dbError || !user) throw new Error("Usuário não encontrado.");

      // Validar CPF correspondente
      const dbCpfClean = user.cpf ? user.cpf.replace(/\D/g, '') : '';
      if (dbCpfClean !== inputCpfClean) {
        throw new Error("Dados não conferem (CPF inválido para este e-mail).");
      }

      // 3. Salvar o código no Supabase na tabela 'recuperacao_senhas'
      const { error: recoveryError } = await supabase
        .from('recuperacao_senhas')
        .insert([{ 
          email: trimmedEmail, 
          codigo: codeToUse 
        }]);

      if (recoveryError) {
        console.error("[Wizard] Erro ao salvar na tabela recuperacao_senhas:", recoveryError);
      }

      // 4. Chamar a Edge Function 'enviar-codigo-recuperacao'
      const { data, error: funcError } = await supabase.functions.invoke('enviar-codigo-recuperacao', {
        body: { 
          email: trimmedEmail, 
          token: codeToUse,
          nomeUsuario: user.nome 
        }
      });
      
      if (funcError) {
        console.error("[Wizard] Erro na Edge Function:", funcError);
        throw new Error("Falha ao disparar e-mail de recuperação. Verifique sua conexão.");
      }

      // 5. Sucesso: Aviso e transição de tela
      if (!e) {
          // Se for reenvio (chamada sem evento de form)
          alert("Código reenviado com sucesso para seu e-mail.");
      } else {
          alert("O e-mail foi enviado para suporte@clubedagentebrasil.com com o seu código de acesso.");
      }
      
      setUserId(user.id);
      setGeneratedCode(codeToUse);
      setStep(2);
      setTimer(60); // Inicia cooldown de 60 segundos

    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao processar sua solicitação.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code === generatedCode) setStep(3);
    else setError("Código incorreto. Verifique seu e-mail.");
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    try {
      if (!supabase || !userId) throw new Error("Sessão de recuperação expirada.");
      
      const hash = await generateHash(newPassword.trim());
      
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ senha_hash: hash })
        .eq('id', userId);

      if (updateError) throw updateError;

      alert("Senha redefinida com sucesso! Faça login com suas novas credenciais.");
      onBackToLogin();
    } catch (err: any) {
      setError("Erro técnico ao atualizar senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Recuperar Senha</h2>
        <p className="text-sm text-gray-500 mt-1 font-medium">
          {step === 1 && "Informe seu e-mail e CPF cadastrado"}
          {step === 2 && "Validação de segurança de 6 dígitos"}
          {step === 3 && "Crie uma senha forte e segura"}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-2xl flex items-start border border-red-100">
          <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-4">
          <Input label="E-mail Corporativo" type="email" placeholder="admin@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} required icon={<Mail size={18} />} className="rounded-2xl" />
          <Input label="CPF Cadastrado" type="text" placeholder="000.000.000-00" value={formatCPF(cpf)} onChange={(e) => setCpf(e.target.value)} maxLength={14} required icon={<ShieldCheck size={18} />} className="rounded-2xl" />
          <div className="pt-2">
            <Button type="submit" isLoading={loading} className="py-4 rounded-2xl uppercase font-black text-xs tracking-widest bg-slate-900 shadow-xl active:scale-95 transition-all">Solicitar Código</Button>
            <button type="button" onClick={onBackToLogin} className="mt-6 w-full text-sm text-slate-500 hover:text-slate-900 flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-colors">
              <ArrowLeft size={16} /> Voltar para o login
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest text-center">Digite o código enviado ao seu e-mail</label>
            <input 
              type="text" 
              maxLength={6} 
              className="w-full text-center text-4xl font-black tracking-[0.4em] p-4 border-b-4 border-slate-100 focus:outline-none bg-transparent text-slate-900 transition-all" 
              style={{ borderBottomColor: code ? primaryColor : '#f1f5f9' }}
              value={code} 
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} 
              placeholder="000000" 
            />
          </div>
          
          <div className="space-y-4">
            <Button type="submit" className="py-4 rounded-2xl uppercase font-black tracking-widest bg-slate-900 shadow-xl active:scale-95">Validar Código</Button>
            
            <div className="flex flex-col gap-3">
              <button 
                type="button" 
                disabled={timer > 0 || loading}
                onClick={() => handleStep1()} 
                className={`w-full text-xs font-bold uppercase tracking-widest transition-all ${timer > 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {timer > 0 ? `Reenviar código em ${timer}s` : "Reenviar código"}
              </button>
              
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="w-full text-[10px] font-bold text-slate-300 hover:text-slate-400 uppercase tracking-widest"
              >
                Corrigir e-mail ou CPF
              </button>
            </div>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleStep3} className="space-y-5">
          <Input label="Nova Senha" type="password" placeholder="Mínimo 6 caracteres" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required icon={<Lock size={18} />} className="rounded-2xl" />
          <Input label="Confirmar Senha" type="password" placeholder="Repita a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required icon={<CheckCircle size={18} />} className="rounded-2xl" />
          <Button type="submit" isLoading={loading} className="py-4 rounded-2xl uppercase font-black tracking-widest bg-slate-900 shadow-xl active:scale-95">Definir Nova Senha</Button>
        </form>
      )}
    </div>
  );
};
