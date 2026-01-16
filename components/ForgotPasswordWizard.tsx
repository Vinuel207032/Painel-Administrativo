
import React, { useState } from 'react';
import { Mail, ShieldCheck, Lock, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';
import { supabase } from '../lib/supabase';
import { generateHash } from '../lib/crypto';

const RESEND_API_KEY = 're_8xzXTKUj_LH1A4cidq9AkPG5Xzdok5nB2';

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
  
  // Form State
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState<number | null>(null);

  const logError = (context: string, err: any) => {
    const errorDetails = err instanceof Error ? err.message : JSON.stringify(err);
    console.error(`[Wizard Error] ${context}:`, errorDetails);
    return errorDetails;
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const codeToUse = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      if (!supabase) throw new Error("Erro de configuração do banco de dados.");

      const trimmedEmail = email.trim();
      const inputCpfClean = cpf.replace(/\D/g, '');

      const { data: user, error: dbError } = await supabase
        .from('tb_usuarios')
        .select('*')
        .eq('email', trimmedEmail)
        .single();

      if (dbError) throw dbError;
      if (!user) throw new Error("Usuário não encontrado.");

      const dbCpfClean = user.cpf ? user.cpf.replace(/\D/g, '') : '';
      if (dbCpfClean !== inputCpfClean) {
        throw new Error("Dados não conferem (CPF inválido para este e-mail).");
      }

      setUserId(user.id_usuario);
      setGeneratedCode(codeToUse);

      try {
        await sendEmailViaResend(trimmedEmail, codeToUse);
      } catch (emailErr: any) {
        console.warn("Email falhou devido a restrições de rede. Ativando modo simulação.");
      }

      setStep(2);

    } catch (err: any) {
      let msg = "Ocorreu um erro ao validar seus dados.";
      const errStr = logError("Step 1", err);

      if (errStr.includes("PGRST116") || errStr.includes("não encontrado")) {
         msg = "Usuário não encontrado. Verifique o E-mail digitado.";
      } else if (errStr.includes("CPF")) {
         msg = "O CPF informado não corresponde ao cadastro deste e-mail.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const sendEmailViaResend = async (to: string, code: string) => {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: to,
        subject: 'Recuperação de Senha - Clube Partner',
        html: `<p>Seu código de acesso é: <strong>${code}</strong></p>`
      })
    });

    if (!res.ok) throw new Error(`Resend Error: ${res.status}`);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code === generatedCode) setStep(3);
    else setError("Código incorreto. Tente novamente.");
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    try {
      if (!supabase || !userId) throw new Error("Sessão expirada. Recomece o processo.");
      
      const hash = await generateHash(newPassword.trim());
      
      // Corrigido: Removido 'senha: null' que causava erro PGRST204
      const { error: updateError } = await supabase
        .from('tb_usuarios')
        .update({ 
          senha_hash: hash
        })
        .eq('id_usuario', userId);

      if (updateError) throw updateError;

      alert("Senha redefinida com sucesso!");
      onBackToLogin();
    } catch (err: any) {
      logError("Step 3 Update", err);
      setError("Erro ao atualizar a senha no banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Recuperar Senha</h2>
        <p className="text-sm text-gray-500 mt-1">
          {step === 1 && "Confirme seus dados cadastrais"}
          {step === 2 && "Validação de segurança"}
          {step === 3 && "Defina sua nova senha de acesso"}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start">
          <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-4">
          <Input label="E-mail Corporativo" type="email" placeholder="admin@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} required icon={<Mail size={18} />} />
          <Input label="CPF Cadastrado" type="text" placeholder="000.000.000-00" value={formatCPF(cpf)} onChange={(e) => setCpf(e.target.value)} maxLength={14} required icon={<ShieldCheck size={18} />} />
          <div className="pt-2">
            <Button type="submit" isLoading={loading}>Gerar Código de Acesso</Button>
            <button type="button" onClick={onBackToLogin} className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2 font-medium">
              <ArrowLeft size={16} /> Voltar para o login
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2} className="space-y-6">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
            <p className="text-[10px] text-yellow-800 font-bold uppercase tracking-widest mb-1">CÓDIGO TEMPORÁRIO</p>
            <p className="text-3xl text-slate-900 font-mono font-bold tracking-[0.2em]">{generatedCode}</p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 text-center">Digite o código exibido acima</label>
            <input type="text" maxLength={6} className="w-full text-center text-3xl font-bold tracking-[0.5em] p-3 border-b-2 border-gray-300 focus:border-yellow-500 focus:outline-none bg-transparent" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" />
          </div>
          <Button type="submit">Validar e Continuar</Button>
          <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-gray-500 hover:text-gray-700">Tentar novamente</button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleStep3} className="space-y-5">
          <Input label="Nova Senha" type="password" placeholder="Mínimo 6 caracteres" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required icon={<Lock size={18} />} />
          <Input label="Confirmar Senha" type="password" placeholder="Repita a nova senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required icon={<CheckCircle size={18} />} />
          <Button type="submit" isLoading={loading}>Atualizar Senha</Button>
        </form>
      )}
    </div>
  );
};
