
import React, { useState, useEffect } from 'react';
// Added Building2 to the list of icons imported from lucide-react
import { 
  Plus, Search, X, UserCircle, ToggleLeft, ToggleRight, RefreshCw, Eye, EyeOff, Save, Image as ImageIcon, 
  Check, Edit3, Users, KeyRound, Bell, Filter, ChevronRight, Building2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateHash } from '../lib/crypto';

interface RegistrationsProps {
  activeSubTab: string;
  theme: string;
  user: any;
  onAuditLog: (acao: string, tabela: string, desc: string) => void;
}

type UserType = 'MASTER' | 'ADMIN' | 'LOJISTA';
type UserStatus = 'ATIVO' | 'SUSPENSO';

const toTitleCase = (str: string) => {
  if (!str) return "";
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export const Registrations: React.FC<RegistrationsProps> = ({ 
  activeSubTab, theme, user, onAuditLog 
}) => {
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'LIST' | 'EDIT_USER' | 'CREATE_WIZARD'>('LIST');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Controle de Senha
  const [editNewPassword, setEditNewPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [cpfConfirmInput, setCpfConfirmInput] = useState('');
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(false);

  // Form states
  const [userForm, setUserForm] = useState({
    id: null, nome: '', cpf: '', email: '', password: '', perfil: 'LOJISTA' as UserType, status_conta: 'ATIVO' as UserStatus, foto_perfil_url: ''
  });

  useEffect(() => {
    fetchData();
    setViewMode('LIST');
  }, [activeSubTab]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    let table = 'tb_usuarios';
    if (activeSubTab === 'REG_AVATARS') table = 'tb_avatares';
    if (activeSubTab === 'REG_COMPANIES') table = 'tb_empresas';
    if (activeSubTab === 'REG_CATEGORIES') table = 'tb_categorias';

    try {
      const { data, error } = await supabase!.from(table).select('*').order('id', { ascending: false });
      if (!error) setListData(data || []);
    } finally { setLoading(false); }
  };

  const handleEditUser = (u: any) => {
    setUserForm({
      id: u.id,
      nome: toTitleCase(u.nome_completo || u.nome || ""),
      email: u.email || "",
      cpf: u.cpf || "", 
      password: '',
      perfil: (u.perfil || 'LOJISTA') as UserType,
      status_conta: (u.status_conta || 'ATIVO') as UserStatus,
      foto_perfil_url: u.foto_perfil_url || u.url_imagem || ""
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
      showToast("Verificado! Campo de senha liberado.", "success");
    } else {
      showToast("O CPF digitado não confere.", "error");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    let table = activeSubTab === 'REG_AVATARS' ? 'tb_avatares' : 'tb_usuarios';
    const payload: any = {
      nome_completo: userForm.nome,
      email: userForm.email,
      perfil: userForm.perfil,
      status_conta: userForm.status_conta
    };

    if (activeSubTab === 'REG_AVATARS') {
      payload.titulo = userForm.nome;
      payload.url_imagem = userForm.foto_perfil_url;
    }

    if (isPasswordUnlocked && editNewPassword.length >= 6) {
      payload.senha_hash = await generateHash(editNewPassword);
    }

    try {
      const { error } = await supabase!.from(table).update(payload).eq('id', userForm.id);
      if (!error) {
        showToast("Dados atualizados com sucesso!", "success");
        setViewMode('LIST');
        fetchData();
      }
    } finally { setLoading(false); }
  };

  const filtered = listData.filter(i => JSON.stringify(i).toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="animate-fade-in pb-10">
      {toast && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-2 animate-bounce ${toast.type === 'success' ? 'bg-green-500 border-green-400 text-white' : 'bg-red-500 border-red-400 text-white'}`}>
           <Bell size={20} /> <span className="font-black text-sm uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      {/* Cabeçalho de Página */}
      <div className="flex flex-row justify-between items-center mb-10">
        <h2 className={`text-2xl md:text-3xl font-black flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
           {activeSubTab === 'REG_USERS' && <><Users size={32} className="text-yellow-500" /> Operadores</>}
           {activeSubTab === 'REG_AVATARS' && <><ImageIcon size={32} className="text-yellow-500" /> Avatares</>}
           {activeSubTab === 'REG_COMPANIES' && <><Building2 size={32} className="text-yellow-500" /> Empresas</>}
        </h2>
        <button onClick={() => setViewMode('CREATE_WIZARD')} className="bg-yellow-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-2">
          <Plus size={18} /> Novo
        </button>
      </div>

      {/* Busca */}
      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
        <input 
          type="text" 
          placeholder="Pesquisar registro..." 
          className="w-full pl-14 pr-6 py-5 rounded-[2rem] border-2 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white outline-none focus:border-yellow-500 font-bold shadow-sm"
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      {/* Grid Mobile */}
      <div className="md:hidden space-y-4">
        {filtered.map((u, idx) => (
          <div key={idx} className={`p-5 rounded-[2.5rem] border-2 bg-white dark:bg-slate-900 shadow-sm ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-4 mb-4">
               <div className="w-14 h-14 rounded-2xl bg-slate-800 overflow-hidden border-2 border-yellow-500/10">
                  <img src={u.foto_perfil_url || u.url_imagem || 'https://i.ibb.co/JF2Gz3v8/logo.png'} className="w-full h-full object-cover" />
               </div>
               <div className="flex-1 overflow-hidden">
                  <p className={`font-black text-sm uppercase truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{u.nome_completo || u.nome || u.razao_social || "Sem Nome"}</p>
                  <p className="text-[10px] text-slate-400 font-bold truncate tracking-widest uppercase">{u.email || u.cnpj || u.status_conta}</p>
               </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t dark:border-slate-800/50">
               <button onClick={() => handleEditUser(u)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400"><Edit3 size={18} /></button>
               {u.status_conta && (
                 <button className={`p-3 ${u.status_conta === 'ATIVO' ? 'text-green-500' : 'text-slate-300'}`}>
                    {u.status_conta === 'ATIVO' ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                 </button>
               )}
            </div>
          </div>
        ))}
      </div>

      {/* Tabela Desktop */}
      <div className={`hidden md:block overflow-hidden rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100'}`}>
        <table className="w-full text-left">
          <thead className="text-[10px] font-black uppercase bg-slate-50 dark:bg-slate-800/50 text-slate-500">
            <tr>
              <th className="px-6 py-5">Identidade</th>
              <th className="px-6 py-5">Nome / Razão</th>
              <th className="px-6 py-5 text-center">Status</th>
              <th className="px-6 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((u, idx) => (
              <tr key={idx} className="hover:bg-yellow-500/5 transition-colors">
                <td className="px-6 py-4">
                  <img src={u.foto_perfil_url || u.url_imagem || 'https://i.ibb.co/JF2Gz3v8/logo.png'} className="w-10 h-10 rounded-xl object-cover" />
                </td>
                <td className="px-6 py-4">
                  <p className="font-black text-sm uppercase">{u.nome_completo || u.nome || u.razao_social}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{u.email || u.cnpj}</p>
                </td>
                <td className="px-6 py-4 text-center">
                   {u.status_conta ? (
                     <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg border ${u.status_conta === 'ATIVO' ? 'border-green-100 text-green-600 bg-green-50' : 'border-red-100 text-red-600 bg-red-50'}`}>{u.status_conta}</span>
                   ) : '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEditUser(u)} className="p-2 text-slate-300 hover:text-yellow-500 transition-colors"><Edit3 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Edição (Corrigido com CPF Security) */}
      {viewMode === 'EDIT_USER' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className={`w-full max-w-lg rounded-[3rem] shadow-2xl p-8 md:p-10 overflow-y-auto max-h-[90vh] ${theme === 'dark' ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-black uppercase tracking-tight">Ajustar Registro</h3>
                <button onClick={() => setViewMode('LIST')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X /></button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Status da Conta</label>
                      <select 
                        className="w-full p-4 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold focus:border-yellow-500 outline-none cursor-pointer"
                        value={userForm.status_conta} 
                        onChange={e => setUserForm({...userForm, status_conta: e.target.value as any})}
                      >
                         <option value="ATIVO">ATIVO</option>
                         <option value="SUSPENSO">SUSPENSO</option>
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Perfil de Acesso</label>
                      <select 
                        className="w-full p-4 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold focus:border-yellow-500 outline-none cursor-pointer"
                        value={userForm.perfil} 
                        onChange={e => setUserForm({...userForm, perfil: e.target.value as any})}
                      >
                         <option value="MASTER">MASTER</option>
                         <option value="ADMIN">ADMIN</option>
                         <option value="LOJISTA">LOJISTA</option>
                      </select>
                   </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome Completo</label>
                  <input 
                    className="w-full p-4 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold focus:border-yellow-500 outline-none transition-all" 
                    value={userForm.nome} 
                    onChange={e => setUserForm({...userForm, nome: e.target.value})} 
                  />
                </div>

                {/* Trava de Segurança por CPF para Senha */}
                <div className={`p-6 rounded-[2.5rem] border-2 border-dashed transition-all ${isPasswordUnlocked ? 'border-green-500 bg-green-500/5' : 'border-slate-200 bg-slate-50 dark:bg-slate-800/30 dark:border-slate-700'}`}>
                   <h4 className="flex items-center gap-2 font-black text-xs uppercase text-slate-500 mb-4">
                      <KeyRound size={16} className={isPasswordUnlocked ? 'text-green-500' : 'text-slate-400'} /> Segurança de Acesso
                   </h4>
                   
                   {!isPasswordUnlocked ? (
                     <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirme o CPF completo do registro:</p>
                        <div className="flex gap-2">
                           <input 
                              type="text" 
                              placeholder="000.000.000-00" 
                              className="flex-1 p-3 rounded-xl border-2 bg-white dark:bg-slate-900 font-bold text-sm outline-none focus:border-yellow-500" 
                              value={cpfConfirmInput} 
                              onChange={e => setCpfConfirmInput(e.target.value)} 
                           />
                           <button onClick={validateCpf} className="bg-slate-900 text-white px-5 rounded-xl font-black text-[10px] uppercase shadow-md active:scale-95 transition-all">Validar</button>
                        </div>
                     </div>
                   ) : (
                     <div className="relative animate-fade-in">
                        <input 
                          type={passwordVisible ? 'text' : 'password'} 
                          className="w-full p-4 rounded-xl border-2 bg-white dark:bg-slate-900 font-bold text-sm outline-none border-green-500 focus:border-green-600" 
                          placeholder="Digite a nova senha (Mín. 6 chars)" 
                          value={editNewPassword} 
                          onChange={e => setEditNewPassword(e.target.value)} 
                        />
                        <button onClick={() => setPasswordVisible(!passwordVisible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                           {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                     </div>
                   )}
                </div>

                <button 
                  onClick={handleSave} 
                  disabled={loading} 
                  className="w-full py-5 bg-yellow-500 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-yellow-600 transition-all active:scale-95"
                >
                   {loading ? 'Processando...' : 'Salvar Alterações'}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
