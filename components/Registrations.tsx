
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  X, 
  ChevronLeft, 
  UserCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  DatabaseZap,
  Image as ImageIcon,
  Check,
  Edit3,
  PlusCircle,
  Trash2,
  AlertCircle,
  Users,
  UserCog
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateHash } from '../lib/crypto';

interface RegistrationsProps {
  activeSubTab: string;
  theme: string;
  user: any;
  onAuditLog: (acao: string, tabela: string, desc: string) => void;
}

type ViewMode = 'LIST' | 'CREATE_WIZARD' | 'USER_PROFILE' | 'EDIT_USER';
type UserType = 'MASTER' | 'ADMIN' | 'LOJISTA';

export const Registrations: React.FC<RegistrationsProps> = ({ 
  activeSubTab, theme, user, onAuditLog 
}) => {
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableExists, setTableExists] = useState(true);
  
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [creationStep, setCreationStep] = useState(1);
  const [selectedUserType, setSelectedUserType] = useState<UserType | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // User Wizard Form
  const [userForm, setUserForm] = useState({
    nome: '', cpf: '', email: '', password: '', foto_perfil_url: ''
  });
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Avatar Management
  const [avatarsList, setAvatarsList] = useState<any[]>([]);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarFormData, setAvatarFormData] = useState({ id: null, titulo: '', url_imagem: '', ativo: true });

  useEffect(() => {
    fetchMainList();
    fetchAvatars();
    setViewMode('LIST');
    setSelectedItem(null);
  }, [activeSubTab]);

  const fetchAvatars = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('tb_avatares').select('*').eq('ativo', true);
      setAvatarsList(data || []);
    } catch (e) {
      console.error("Erro ao carregar avatares:", e);
    }
  };

  const fetchMainList = async () => {
    if (!supabase) return;
    setLoading(true);
    setTableExists(true);
    let table = '';
    switch (activeSubTab) {
      case 'REG_USERS': table = 'tb_usuarios'; break;
      case 'REG_AVATARS': table = 'tb_avatares'; break;
      case 'REG_COMPANIES': table = 'tb_empresas'; break;
      case 'REG_CATEGORIES': table = 'tb_categorias'; break;
      case 'REG_BANNERS': table = 'tb_banners'; break;
      case 'REG_NOTIFICATIONS': table = 'tb_notificacoes'; break;
      default: table = 'tb_usuarios';
    }

    try {
      let query = supabase.from(table).select('*');
      if (table === 'tb_avatares') query = query.order('id', { ascending: true });
      else if (table === 'tb_usuarios') query = query.order('id_usuario', { ascending: false });
      else query = query.order('criado_em', { ascending: false });

      const { data, error } = await query;
      
      if (error) {
        if (error.message.includes('schema cache') || error.code === 'PGRST116' || error.message.includes('not find')) {
          setTableExists(false);
          setListData([]);
        } else {
          throw error;
        }
      } else {
        setListData(data || []);
      }
    } catch (e: any) {
      console.error(`Erro crítico ao carregar ${table}:`, e.message);
      setTableExists(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 11) val = val.slice(0, 11);
    const masked = val
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setUserForm({ ...userForm, cpf: masked });
  };

  const validateCPF = (cpf: string) => {
    const clean = cpf.replace(/\D/g, "");
    if (clean.length !== 11 || /^(\d)\1+$/.test(clean)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(clean.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(clean.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(clean.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(clean.substring(10, 11))) return false;
    return true;
  };

  const validatePassword = (pw: string) => {
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    return pwRegex.test(pw);
  };

  const handleSaveNewUser = async () => {
    const { nome, cpf, email, password, foto_perfil_url } = userForm;
    
    if (nome.trim().split(' ').length < 2) return alert("Insira o nome completo.");
    if (!validateCPF(cpf)) return alert("CPF Inválido.");
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return alert("E-mail inválido.");
    if (!validatePassword(password)) return alert("A senha deve ter 6+ caracteres, letras (M/m) e números.");
    
    setLoading(true);
    try {
      const hash = await generateHash(password);
      const { error: dbError } = await supabase!.from('tb_usuarios').insert([{
        nome_completo: nome,
        email: email.trim(),
        cpf: cpf.replace(/\D/g, ""),
        senha_hash: hash,
        role: selectedUserType?.toLowerCase(),
        status_conta: 'ATIVO',
        foto_perfil_url: foto_perfil_url || null
      }]);

      if (dbError) throw dbError;

      onAuditLog('INSERT', 'tb_usuarios', `Criou operador ${selectedUserType}: ${nome}`);
      setViewMode('LIST');
      fetchMainList();
      setUserForm({ nome: '', cpf: '', email: '', password: '', foto_perfil_url: '' });
      setCreationStep(1);
    } catch (err: any) {
      alert("Erro ao cadastrar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatusInline = async (u: any) => {
    if (!supabase) return;
    const newStatus = u.status_conta === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    setListData(prev => prev.map(item => item.id_usuario === u.id_usuario ? { ...item, status_conta: newStatus } : item));
    try {
      const { error } = await supabase.from('tb_usuarios').update({ status_conta: newStatus }).eq('id_usuario', u.id_usuario);
      if (error) throw error;
      onAuditLog('UPDATE', 'tb_usuarios', `Status de ${u.nome_completo} -> ${newStatus}.`);
    } catch (e: any) {
      fetchMainList();
    }
  };

  const handleDelete = async (id: any) => {
    if (!window.confirm('Excluir este avatar?')) return;
    const { error } = await supabase!.from('tb_avatares').delete().eq('id', id);
    if (error) alert('Erro ao excluir: ' + error.message);
    else fetchMainList(); // Apenas recarregue a lista
  };

  const renderEmptyTable = () => (
    <div className={`p-20 text-center rounded-[2.5rem] border-2 border-dashed ${theme === 'dark' ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-gray-50'}`}>
       <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <DatabaseZap size={32} />
       </div>
       <h3 className={`text-xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Módulo Indisponível</h3>
       <button onClick={fetchMainList} className="text-yellow-500 font-black text-xs uppercase flex items-center gap-2 mx-auto">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Reiniciar Conexão
       </button>
    </div>
  );

  const renderUserTable = () => (
    <div className={`overflow-hidden rounded-3xl border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      <table className="w-full text-left border-collapse">
        <thead className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
          <tr>
            <th className="px-6 py-5">Operador</th>
            <th className="px-6 py-5">Nível</th>
            <th className="px-6 py-5">Status</th>
            <th className="px-6 py-5 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {listData.filter(i => JSON.stringify(i).toLowerCase().includes(searchTerm.toLowerCase())).map((u) => (
            <tr key={u.id_usuario} className="hover:bg-yellow-500/5 transition-colors group">
              <td className="px-6 py-4">
                <button onClick={() => { setSelectedItem(u); setViewMode('EDIT_USER'); }} className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-white shadow-md overflow-hidden flex-shrink-0">
                    {u.foto_perfil_url ? <img src={u.foto_perfil_url} className="w-full h-full object-cover" /> : u.nome_completo?.charAt(0)}
                  </div>
                  <div className="truncate max-w-[200px]">
                    <p className={`font-black text-sm truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{u.nome_completo}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {u.id_usuario}</p>
                  </div>
                </button>
              </td>
              <td className="px-6 py-4">
                <span className="text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-blue-100 text-blue-700">{u.role}</span>
              </td>
              <td className="px-6 py-4">
                 <button onClick={() => toggleUserStatusInline(u)} className="flex items-center gap-2 group transition-opacity hover:opacity-80">
                    <div className={`w-3 h-3 rounded-full ${(u.status_conta || '').toUpperCase() === 'ATIVO' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-300'}`}></div>
                    <span className={`text-[10px] font-black ${(u.status_conta || '').toUpperCase() === 'ATIVO' ? 'text-green-600' : 'text-slate-400'}`}>
                      {(u.status_conta || 'INATIVO').toUpperCase()}
                    </span>
                 </button>
              </td>
              <td className="px-6 py-4 text-right">
                <button onClick={() => { setSelectedItem(u); setViewMode('EDIT_USER'); }} className="p-2 text-slate-300 hover:text-yellow-500 transition-colors flex-shrink-0">
                  <ChevronRight size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAvatarTable = () => (
    <div className={`overflow-hidden rounded-3xl border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      <table className="w-full text-left border-collapse">
        <thead className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
          <tr>
            <th className="px-6 py-5">Preview</th>
            <th className="px-6 py-5">Título</th>
            <th className="px-6 py-5">Status</th>
            <th className="px-6 py-5 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {listData.filter(i => JSON.stringify(i).toLowerCase().includes(searchTerm.toLowerCase())).map((av) => (
            <tr key={av.id} className="hover:bg-yellow-500/5 transition-colors group">
              <td className="px-6 py-4">
                <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                  <img src={av.url_imagem} alt={av.titulo} className="w-full h-full object-contain" />
                </div>
              </td>
              <td className="px-6 py-4">
                <p className={`font-black text-sm uppercase truncate max-w-[250px] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{av.titulo}</p>
                <p className="text-[9px] text-slate-400 font-bold">REF: {av.id}</p>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                   <div className={`w-3 h-3 rounded-full ${av.ativo ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                   <span className={`text-[10px] font-black ${av.ativo ? 'text-green-600' : 'text-slate-400'}`}>{av.ativo ? 'ATIVO' : 'INATIVO'}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2 flex-shrink-0 min-w-[120px]">
                   <button onClick={async () => {
                     const ns = !av.ativo;
                     await supabase!.from('tb_avatares').update({ ativo: ns }).eq('id', av.id);
                     fetchMainList();
                   }} className={`transition-all hover:scale-110 ${av.ativo ? 'text-green-500' : 'text-slate-300'}`}>
                      {av.ativo ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                   </button>
                   <button onClick={() => { setAvatarFormData(av); setIsAvatarModalOpen(true); }} className="p-2 text-slate-400 hover:text-yellow-600 transition-colors">
                     <Edit3 size={18} />
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleDelete(av.id); }} 
                     className="p-2 text-slate-300 hover:text-red-500 transition-all hover:scale-125 hover:rotate-6 active:scale-90"
                     title="Excluir Avatar"
                    >
                      <Trash2 size={18} />
                   </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderUserWizard = () => (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`w-full max-w-xl rounded-[2.5rem] shadow-2xl p-8 transition-all ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black flex items-center gap-3"><PlusCircle className="text-yellow-500" /> Registrar Operador</h3>
          <button onClick={() => setViewMode('LIST')} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X /></button>
        </div>

        {creationStep === 1 ? (
          <div className="space-y-4 animate-fade-in">
            <p className="text-slate-500 font-bold mb-6 text-sm text-center uppercase tracking-widest">Nível de Acesso</p>
            <div className="grid grid-cols-1 gap-3">
              {['MASTER', 'ADMIN', 'LOJISTA'].map((type) => (
                <button key={type} onClick={() => { setSelectedUserType(type as any); setCreationStep(2); }} className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all hover:border-yellow-500 group ${theme === 'dark' ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                   <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg"><UserCircle size={24} /></div>
                   <div className="text-left font-black text-sm uppercase tracking-widest">{type}</div>
                   <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-yellow-500" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex items-center gap-2 text-yellow-500 font-black text-[10px] uppercase tracking-[0.2em] mb-4 sticky top-0 bg-inherit py-2 z-10">
              <button onClick={() => setCreationStep(1)} className="p-1 hover:bg-yellow-500/10 rounded-lg transition-colors"><ChevronLeft size={16} /></button>
              Formulário do {selectedUserType}
            </div>
            
            <div className="space-y-3 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border dark:border-slate-800">
               <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Escolher Avatar de Perfil</label>
               <div className="flex items-center gap-4 mb-3">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden border-2 border-yellow-500 shadow-sm">
                     {userForm.foto_perfil_url ? <img src={userForm.foto_perfil_url} className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-slate-300" />}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">Selecione uma identidade<br/>na galeria abaixo</p>
               </div>
               <div className="grid grid-cols-5 gap-2 pb-2">
                  {avatarsList.slice(0, 10).map(av => (
                    <button 
                      key={av.id} 
                      onClick={() => setUserForm({...userForm, foto_perfil_url: av.url_imagem})}
                      className={`aspect-square rounded-xl border-2 transition-all overflow-hidden relative ${userForm.foto_perfil_url === av.url_imagem ? 'border-yellow-500 scale-105 shadow-md' : 'border-slate-200 dark:border-slate-800'}`}
                    >
                      <img src={av.url_imagem} className="w-full h-full object-cover" />
                      {userForm.foto_perfil_url === av.url_imagem && <div className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center text-white"><Check size={16} /></div>}
                    </button>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome Completo</label>
                 <input className="w-full p-4 rounded-2xl border dark:bg-slate-800 dark:border-slate-700 font-bold text-sm" placeholder="Ex: João Silva" value={userForm.nome} onChange={e => setUserForm({...userForm, nome: e.target.value})} />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">CPF Válido</label>
                 <input className="w-full p-4 rounded-2xl border dark:bg-slate-800 dark:border-slate-700 font-bold text-sm" placeholder="000.000.000-00" value={userForm.cpf} onChange={handleCpfChange} />
               </div>
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-slate-400 ml-1">E-mail de Acesso</label>
               <input className="w-full p-4 rounded-2xl border dark:bg-slate-800 dark:border-slate-700 font-bold text-sm" placeholder="email@empresa.com" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Senha Segura</label>
               <div className="relative">
                  <input className="w-full p-4 rounded-2xl border dark:bg-slate-800 dark:border-slate-700 font-bold text-sm pr-12" type={passwordVisible ? 'text' : 'password'} placeholder="••••••" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                  <button onClick={() => setPasswordVisible(!passwordVisible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-yellow-500">{passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
               </div>
               <div className="mt-2 text-[9px] font-bold text-slate-400 flex items-center gap-1"><AlertCircle size={10} /> Mínimo 6 caracteres, letras e números.</div>
            </div>

            <button onClick={handleSaveNewUser} disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 mt-4 uppercase tracking-[0.2em] text-xs transition-all hover:bg-slate-800">
               {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} SALVAR NO BANCO
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
        <div>
           <h2 className={`text-3xl font-black flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {activeSubTab === 'REG_USERS' ? (
                 <><Users size={32} className="text-yellow-500" /> Gestão de Operadores</>
              ) : activeSubTab === 'REG_AVATARS' ? (
                 <><ImageIcon size={32} className="text-yellow-500" /> Biblioteca de Avatares</>
              ) : 'Gestão'}
           </h2>
           <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div> Sistema Administrativo
           </p>
        </div>
        <button 
          onClick={() => activeSubTab === 'REG_AVATARS' ? setAvatarFormData({id: null, titulo: '', url_imagem: '', ativo: true}) || setIsAvatarModalOpen(true) : setViewMode('CREATE_WIZARD')} 
          disabled={!tableExists && activeSubTab !== 'REG_USERS' && activeSubTab !== 'REG_AVATARS'}
          className="w-full md:w-auto bg-slate-900 text-white px-10 py-4 rounded-3xl font-black text-xs shadow-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all uppercase tracking-widest disabled:opacity-30"
        >
          <Plus size={18} /> Novo Registro
        </button>
      </div>

      <div className="relative mb-10">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300"><Search size={22} /></div>
        <input type="text" placeholder="Filtrar registros..." className="w-full pl-16 pr-6 py-5 rounded-3xl border-2 dark:bg-slate-900 dark:border-slate-800 dark:text-white outline-none focus:border-yellow-500 transition-all font-bold text-sm shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {!tableExists ? renderEmptyTable() : (
        activeSubTab === 'REG_AVATARS' ? renderAvatarTable() : renderUserTable()
      )}

      {/* Perfil Detalhado / Editar */}
      {viewMode === 'EDIT_USER' && selectedItem && (
        <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
           <div className={`w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 ${theme === 'dark' ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-2xl font-black">Ficha do Usuário</h3>
                 <button onClick={() => setViewMode('LIST')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X /></button>
              </div>
              
              <div className="space-y-6">
                 <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 rounded-3xl bg-slate-800 border-4 border-yellow-500/20 shadow-xl overflow-hidden mb-4">
                       <img src={selectedItem.foto_perfil_url || 'https://i.ibb.co/JF2Gz3v8/logo.png'} className="w-full h-full object-cover" />
                    </div>
                    <p className="font-black text-xl">{selectedItem.nome_completo}</p>
                    <p className="text-xs text-yellow-500 font-black uppercase tracking-widest">{selectedItem.role}</p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Status Atual</p>
                       <p className={`font-black ${selectedItem.status_conta === 'ATIVO' ? 'text-green-500' : 'text-red-500'}`}>{selectedItem.status_conta}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-1">ID Único</p>
                       <p className="font-black text-slate-400">#{selectedItem.id_usuario}</p>
                    </div>
                 </div>

                 <button onClick={() => setViewMode('LIST')} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg">Fechar Visualização</button>
              </div>
           </div>
        </div>
      )}

      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
           <div className={`w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 ${theme === 'dark' ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-2xl font-black">{avatarFormData.id ? 'Ajustar' : 'Novo'} Avatar</h3>
                 <button onClick={() => setIsAvatarModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors"><X /></button>
              </div>
              <div className="space-y-6">
                 {/* PREVIEW BOX */}
                 <div className="flex flex-col items-center gap-3 mb-4">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pré-visualização</p>
                    <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-slate-800 border-4 border-yellow-500/20 flex items-center justify-center overflow-hidden shadow-2xl">
                       {avatarFormData.url_imagem ? (
                          <img 
                            src={avatarFormData.url_imagem} 
                            className="w-full h-full object-contain" 
                            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=URL+Invalida')} 
                          />
                       ) : (
                          <ImageIcon size={32} className="text-slate-300" />
                       )}
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Título do Avatar</label>
                    <input className="w-full p-4 rounded-2xl border dark:bg-slate-800 dark:border-slate-700 font-bold" placeholder="Avatar Executivo" value={avatarFormData.titulo} onChange={e => setAvatarFormData({...avatarFormData, titulo: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">URL da Imagem</label>
                    <input className="w-full p-4 rounded-2xl border dark:bg-slate-800 dark:border-slate-700 font-bold" placeholder="https://dominio.com/foto.png" value={avatarFormData.url_imagem} onChange={e => setAvatarFormData({...avatarFormData, url_imagem: e.target.value})} />
                 </div>
                 <button onClick={async () => {
                    if (!avatarFormData.titulo || !avatarFormData.url_imagem) return alert("Preencha todos os campos.");
                    const payload = { titulo: avatarFormData.titulo, url_imagem: avatarFormData.url_imagem, ativo: avatarFormData.ativo };
                    if (avatarFormData.id) await supabase!.from('tb_avatares').update(payload).eq('id', avatarFormData.id);
                    else await supabase!.from('tb_avatares').insert([payload]);
                    setIsAvatarModalOpen(false);
                    fetchMainList();
                    fetchAvatars();
                    onAuditLog('UPDATE', 'tb_avatares', `Gravou avatar: ${avatarFormData.titulo}.`);
                 }} className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase shadow-2xl tracking-widest text-xs">Confirmar e Salvar</button>
              </div>
           </div>
        </div>
      )}

      {viewMode === 'CREATE_WIZARD' && renderUserWizard()}
    </div>
  );
};
