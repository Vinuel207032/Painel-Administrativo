
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, X, UserCircle, ToggleLeft, ToggleRight, RefreshCw, Eye, EyeOff, Save, Edit3, Users, KeyRound, Bell, Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateHash } from '../lib/crypto';

interface UserManagerProps {
  theme: string;
  user: any;
  onAuditLog: (acao: string, tabela: string, desc: string) => void;
}

export const UserManager: React.FC<UserManagerProps> = ({ theme, user, onAuditLog }) => {
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'LIST' | 'EDIT_USER'>('LIST');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Controle de Senha
  const [editNewPassword, setEditNewPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [cpfConfirmInput, setCpfConfirmInput] = useState('');
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(false);

  const [userForm, setUserForm] = useState({
    id: null, nome: '', cpf: '', email: '', perfil: 'LOJISTA', status_conta: 'ATIVO', foto_perfil_url: ''
  });

  useEffect(() => { fetchMainList(); }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMainList = async () => {
    setLoading(true);
    const { data } = await supabase!.from('tb_usuarios').select('*').order('id', { ascending: false });
    setListData(data || []);
    setLoading(false);
  };

  const handleEditUser = (u: any) => {
    setUserForm({
      id: u.id,
      nome: u.nome_completo || u.nome || "",
      email: u.email || "",
      cpf: u.cpf || "", 
      perfil: u.perfil || 'LOJISTA',
      status_conta: u.status_conta || 'ATIVO',
      foto_perfil_url: u.foto_perfil_url || ""
    });
    setEditNewPassword('');
    setCpfConfirmInput('');
    setIsPasswordUnlocked(false);
    setViewMode('EDIT_USER');
  };

  const validateCpf = () => {
    const cleanInput = cpfConfirmInput.replace(/\D/g, "");
    const cleanStored = userForm.cpf.replace(/\D/g, "");
    if (cleanInput === cleanStored && cleanInput.length > 0) {
      setIsPasswordUnlocked(true);
      showToast("Acesso liberado!", "success");
    } else {
      showToast("CPF incorreto para este registro.", "error");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const payload: any = {
      nome_completo: userForm.nome,
      email: userForm.email,
      perfil: userForm.perfil,
      status_conta: userForm.status_conta
    };
    if (isPasswordUnlocked && editNewPassword.length >= 6) {
      payload.senha_hash = await generateHash(editNewPassword);
    }
    const { error } = await supabase!.from('tb_usuarios').update(payload).eq('id', userForm.id);
    if (!error) {
      showToast("Alterações salvas!", "success");
      onAuditLog('UPDATE', 'tb_usuarios', `Editou operador ${userForm.nome}`);
      setViewMode('LIST');
      fetchMainList();
    }
    setLoading(false);
  };

  const filtered = listData.filter(i => JSON.stringify(i).toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="animate-fade-in pb-10">
      {toast && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-2 animate-bounce ${toast.type === 'success' ? 'bg-green-500 border-green-400 text-white' : 'bg-red-500 border-red-400 text-white'}`}>
           <Bell size={20} /> <span className="font-black text-sm uppercase">{toast.message}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h2 className={`text-2xl md:text-3xl font-black flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
           <Users size={32} className="text-yellow-500" /> Operadores
        </h2>
        <button className="bg-yellow-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-2">
          <Plus size={18} /> Novo
        </button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
        <input type="text" placeholder="Filtrar por nome ou e-mail..." className="w-full pl-14 pr-6 py-5 rounded-3xl border-2 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white outline-none focus:border-yellow-500 font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((u, idx) => (
          <div key={idx} className={`p-6 rounded-[2.5rem] border-2 bg-white dark:bg-slate-900 shadow-sm ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-4 mb-4">
               <div className="w-14 h-14 rounded-2xl bg-slate-800 overflow-hidden border-2 border-yellow-500/10">
                  <img src={u.foto_perfil_url || 'https://i.ibb.co/JF2Gz3v8/logo.png'} className="w-full h-full object-cover" />
               </div>
               <div className="flex-1 overflow-hidden">
                  <p className={`font-black text-sm uppercase truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{u.nome_completo || "Sem Nome"}</p>
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase truncate">{u.email}</p>
               </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t dark:border-slate-800/50">
               <span className="text-[9px] font-black uppercase px-3 py-1.5 rounded-xl bg-yellow-500/10 text-yellow-600">{u.perfil}</span>
               <button onClick={() => handleEditUser(u)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-yellow-500 transition-colors">
                  <Edit3 size={18} />
               </button>
            </div>
          </div>
        ))}
      </div>

      {viewMode === 'EDIT_USER' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className={`w-full max-w-lg rounded-[3rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh] ${theme === 'dark' ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black uppercase tracking-tighter">Ajustar Registro</h3>
                <button onClick={() => setViewMode('LIST')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X /></button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Status</label>
                      <select className="w-full p-4 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold outline-none focus:border-yellow-500 appearance-none cursor-pointer" value={userForm.status_conta} onChange={e => setUserForm({...userForm, status_conta: e.target.value})}>
                         <option value="ATIVO">ATIVO</option>
                         <option value="SUSPENSO">SUSPENSO</option>
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Perfil</label>
                      <select className="w-full p-4 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold outline-none focus:border-yellow-500 appearance-none cursor-pointer" value={userForm.perfil} onChange={e => setUserForm({...userForm, perfil: e.target.value})}>
                         <option value="MASTER">MASTER</option>
                         <option value="ADMIN">ADMIN</option>
                         <option value="LOJISTA">LOJISTA</option>
                      </select>
                   </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome Completo</label>
                  <input className="w-full p-4 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold focus:border-yellow-500 outline-none" value={userForm.nome} onChange={e => setUserForm({...userForm, nome: e.target.value})} />
                </div>

                <div className={`p-6 rounded-[2.5rem] border-2 border-dashed ${isPasswordUnlocked ? 'border-green-500 bg-green-500/5' : 'border-slate-200 bg-slate-50 dark:bg-slate-800/30 dark:border-slate-700'}`}>
                   <h4 className="flex items-center gap-2 font-black text-xs uppercase text-slate-500 mb-4">
                      <KeyRound size={16} className={isPasswordUnlocked ? 'text-green-500' : 'text-slate-400'} /> Segurança de Senha
                   </h4>
                   {!isPasswordUnlocked ? (
                     <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirme o CPF completo:</p>
                        <div className="flex gap-2">
                           <input type="text" placeholder="000.000.000-00" className="flex-1 p-3 rounded-xl border-2 bg-white dark:bg-slate-900 font-bold text-sm outline-none focus:border-yellow-500" value={cpfConfirmInput} onChange={e => setCpfConfirmInput(e.target.value)} />
                           <button onClick={validateCpf} className="bg-slate-900 text-white px-5 rounded-xl font-black text-[10px] uppercase shadow-md active:scale-95 transition-all">Liberar</button>
                        </div>
                     </div>
                   ) : (
                     <div className="relative animate-fade-in">
                        <input type={passwordVisible ? 'text' : 'password'} className="w-full p-4 rounded-xl border-2 bg-white dark:bg-slate-900 font-bold text-sm outline-none border-green-500" placeholder="Nova Senha (Mín. 6 chars)" value={editNewPassword} onChange={e => setEditNewPassword(e.target.value)} />
                        <button onClick={() => setPasswordVisible(!passwordVisible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                     </div>
                   )}
                </div>

                <button onClick={handleSave} disabled={loading} className="w-full py-5 bg-yellow-500 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-yellow-600 transition-all active:scale-95">
                   {loading ? 'Processando...' : 'Salvar Dados'}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
