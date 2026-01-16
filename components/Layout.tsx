
import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight,
  LogOut, 
  LayoutDashboard,
  Users,
  Building2,
  Layers,
  Image as ImageIcon,
  BellRing,
  X,
  User,
  Settings as SettingsIcon,
  MessageSquare,
  Lock,
  Check,
  UserCircle,
  Sun,
  Moon,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidePanelOpen: boolean;
  setIsSidePanelOpen: (isOpen: boolean) => void;
  theme: 'light' | 'dark';
  user: any;
  onLogout: () => void;
  onAuditLog?: (acao: string, tabela: string, desc: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  isSidePanelOpen, 
  setIsSidePanelOpen, 
  theme, 
  user,
  onLogout,
  onAuditLog
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isCadastrosOpen, setIsCadastrosOpen] = useState(activeTab.startsWith('REG_'));
  
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'DATA' | 'PREFERENCES' | 'SECURITY'>('DATA');
  const [avatars, setAvatars] = useState<any[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.foto_perfil_url);

  const navGroups = [
    {
      title: 'Acesso',
      items: [
        { id: 'REG_USERS', label: 'Usuários', icon: User },
        { id: 'REG_AVATARS', label: 'Avatares', icon: UserCircle },
      ]
    },
    {
      title: 'Parceiros',
      items: [
        { id: 'REG_COMPANIES', label: 'Empresas', icon: Building2 },
        { id: 'REG_CATEGORIES', label: 'Categorias', icon: Layers },
      ]
    },
    {
      title: 'App',
      items: [
        { id: 'REG_BANNERS', label: 'Banners', icon: ImageIcon },
        { id: 'REG_NOTIFICATIONS', label: 'Notificações', icon: BellRing },
      ]
    }
  ];

  useEffect(() => {
    if (showSettings) fetchAvatars();
  }, [showSettings]);

  const fetchAvatars = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('tb_avatares').select('*').eq('ativo', true);
    setAvatars(data || []);
  };

  const updateAvatarAutoSave = async (url: string) => {
    if (!supabase || !user) return;
    try {
      const { error } = await supabase
        .from('tb_usuarios')
        .update({ foto_perfil_url: url })
        .eq('id_usuario', user.id);
      
      if (!error) {
        setSelectedAvatar(url);
        setShowSettings(false);
        if (onAuditLog) onAuditLog('UPDATE', 'TB_USUARIOS', 'Alterou avatar de perfil via auto-save.');
        const session = JSON.parse(localStorage.getItem('user_session') || '{}');
        session.foto_perfil_url = url;
        localStorage.setItem('user_session', JSON.stringify(session));
      } else {
        throw error;
      }
    } catch (e: any) {
      console.error("Erro no auto-save do avatar:", e.message);
    }
  };

  const updateThemeAutoSave = async (newTheme: 'light' | 'dark') => {
    if (!supabase || !user) return;
    try {
      localStorage.setItem('app_theme', newTheme);
      await supabase.from('tb_usuarios').update({ preferencia_tema: newTheme }).eq('id_usuario', user.id);
      if (onAuditLog) onAuditLog('UPDATE', 'TB_USUARIOS', `Alterou preferência de tema para: ${newTheme}.`);
      window.location.reload();
    } catch (e: any) {
      console.error("Erro no auto-save do tema:", e.message);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col ${theme === 'dark' ? 'bg-slate-950' : 'bg-gray-50'}`}>
      <header className="flex fixed top-0 left-0 right-0 h-16 bg-yellow-500 z-[60] shadow-md items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-2">
           <img src="https://i.ibb.co/JF2Gz3v8/logo.png" alt="Logo" className="h-8 w-auto" />
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} 
              className={`flex items-center gap-2 p-1 rounded-full border-2 ${isProfileMenuOpen ? 'bg-yellow-600 border-white/40' : 'hover:bg-yellow-600 border-transparent'}`}
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-white/20 flex items-center justify-center text-white font-bold text-xs overflow-hidden shadow-sm">
                {selectedAvatar ? <img src={selectedAvatar} className="w-full h-full object-cover rounded-full" /> : user?.nome?.charAt(0)}
              </div>
              <ChevronDown size={14} className="text-white" />
            </button>

            {isProfileMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)}></div>
                <div className={`absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl border p-2 z-50 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100'}`}>
                  <div className="px-3 py-3 border-b mb-1">
                    <p className="text-[10px] font-black uppercase text-slate-500">Operador</p>
                    <p className="text-sm font-bold truncate">{user?.nome}</p>
                  </div>
                  <button onClick={() => { setShowSettings(true); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm font-bold rounded-xl flex items-center gap-3 hover:bg-yellow-500/10 transition-colors">
                    <SettingsIcon size={18} className="text-yellow-600" /> Configurações
                  </button>
                  <div className="border-t mt-1 pt-1">
                    <button onClick={onLogout} className="w-full text-left px-3 py-3 text-sm text-red-500 font-black flex items-center gap-3 hover:bg-red-50 transition-colors">
                      <LogOut size={18} /> Sair
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white'}`}>
             <div className="w-full md:w-64 p-6 border-r border-gray-100 bg-gray-50 dark:bg-slate-800/50">
                <h3 className="text-xl font-black mb-8">Preferências</h3>
                <div className="space-y-2">
                   <button onClick={() => setSettingsTab('DATA')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${settingsTab === 'DATA' ? 'bg-yellow-500 text-white shadow-lg' : 'text-slate-500 hover:bg-yellow-500/10'}`}>
                      <UserCircle size={18} /> Avatar
                   </button>
                   <button onClick={() => setSettingsTab('PREFERENCES')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${settingsTab === 'PREFERENCES' ? 'bg-yellow-500 text-white shadow-lg' : 'text-slate-500 hover:bg-yellow-500/10'}`}>
                      <Sun size={18} /> Tema
                   </button>
                   <button onClick={() => setSettingsTab('SECURITY')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${settingsTab === 'SECURITY' ? 'bg-yellow-500 text-white shadow-lg' : 'text-slate-500 hover:bg-yellow-500/10'}`}>
                      <Lock size={18} /> Segurança
                   </button>
                </div>
             </div>
             <div className="flex-1 p-8 overflow-y-auto max-h-[70vh]">
                <div className="flex justify-between items-center mb-8">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-yellow-500">{settingsTab === 'DATA' ? 'Toque para mudar' : settingsTab === 'SECURITY' ? 'Dados de Acesso' : 'Personalização'}</h4>
                   <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
                </div>

                {settingsTab === 'DATA' && (
                  <div className="grid grid-cols-4 gap-4 animate-fade-in">
                    {avatars.map(av => (
                      <button key={av.id} onClick={() => updateAvatarAutoSave(av.url_imagem)} className={`aspect-square rounded-full border-4 transition-all relative group ${selectedAvatar === av.url_imagem ? 'border-yellow-500 scale-105 shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                        <img src={av.url_imagem} className="w-full h-full object-cover rounded-full" />
                        {selectedAvatar === av.url_imagem && <div className="absolute inset-0 bg-yellow-500/20 rounded-full flex items-center justify-center text-white"><Check size={20} /></div>}
                      </button>
                    ))}
                  </div>
                )}

                {settingsTab === 'PREFERENCES' && (
                  <div className="space-y-4 animate-fade-in">
                    <button onClick={() => updateThemeAutoSave('light')} className={`w-full p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${theme === 'light' ? 'border-yellow-500 bg-yellow-50' : 'border-slate-100 hover:border-yellow-200'}`}>
                      <div className="flex items-center gap-4"><Sun className="text-yellow-600" size={24} /> <span className="font-black text-xs uppercase tracking-widest">Modo Claro</span></div>
                      {theme === 'light' && <Check size={20} className="text-yellow-600" />}
                    </button>
                    <button onClick={() => updateThemeAutoSave('dark')} className={`w-full p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${theme === 'dark' ? 'border-yellow-500 bg-slate-800' : 'border-slate-100 hover:border-yellow-200'}`}>
                      <div className="flex items-center gap-4"><Moon className="text-yellow-600" size={24} /> <span className="font-black text-xs uppercase tracking-widest">Modo Escuro</span></div>
                      {theme === 'dark' && <Check size={20} className="text-yellow-600" />}
                    </button>
                  </div>
                )}

                {settingsTab === 'SECURITY' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Atual</label>
                      <input className="w-full p-4 rounded-2xl border dark:bg-slate-800 dark:border-slate-700 font-bold" type="password" placeholder="••••••••" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
                      <input className="w-full p-4 rounded-2xl border dark:bg-slate-800 dark:border-slate-700 font-bold" type="password" placeholder="••••••••" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                      <input className="w-full p-4 rounded-2xl border dark:bg-slate-800 dark:border-slate-700 font-bold" type="password" placeholder="••••••••" />
                    </div>
                    <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black mt-4 uppercase tracking-widest text-xs shadow-xl hover:bg-slate-800 transition-colors">
                       Atualizar Senha
                    </button>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      <aside className={`hidden md:block fixed top-16 left-0 bottom-0 w-64 shadow-xl z-40 transition-transform duration-300 ${theme === 'dark' ? 'bg-slate-900 border-r border-slate-800 text-white' : 'bg-white border-r border-gray-200'} ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 space-y-2">
          <button onClick={() => setActiveTab('DASHBOARD')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'DASHBOARD' ? 'bg-yellow-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard size={20} /> Visão Geral
          </button>
          <div className="space-y-1">
            <button onClick={() => setIsCadastrosOpen(!isCadastrosOpen)} className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab.startsWith('REG_') ? 'text-yellow-500' : 'text-slate-400 hover:bg-slate-800'}`}>
              <div className="flex items-center gap-3"><Users size={20} /> Cadastros</div>
              <ChevronRight size={16} className={isCadastrosOpen ? 'rotate-90 text-yellow-500' : ''} />
            </button>
            {isCadastrosOpen && (
              <div className="ml-4 pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-1 py-1">
                {navGroups.map(group => (
                  <div key={group.title} className="py-2">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-2 px-2">{group.title}</p>
                    {group.items.map(item => (
                      <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${activeTab === item.id ? 'bg-yellow-500/10 text-yellow-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <item.icon size={16} /> {item.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Bottom Navigation for Mobile */}
      <nav className={`fixed bottom-0 left-0 right-0 h-16 flex md:hidden items-center justify-around z-50 border-t transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]'}`}>
        <button onClick={() => setActiveTab('DASHBOARD')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'DASHBOARD' ? 'text-yellow-500' : 'text-slate-400'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-bold">Início</span>
        </button>
        <button onClick={() => setActiveTab('REG_USERS')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'REG_USERS' ? 'text-yellow-500' : 'text-slate-400'}`}>
          <Users size={20} />
          <span className="text-[10px] font-bold">Usuários</span>
        </button>
        <button onClick={() => setActiveTab('REG_AVATARS')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'REG_AVATARS' ? 'text-yellow-500' : 'text-slate-400'}`}>
          <UserCircle size={20} />
          <span className="text-[10px] font-bold">Avatares</span>
        </button>
        <button onClick={() => setActiveTab('REG_COMPANIES')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'REG_COMPANIES' ? 'text-yellow-500' : 'text-slate-400'}`}>
          <Building2 size={20} />
          <span className="text-[10px] font-bold">Parceiros</span>
        </button>
      </nav>

      <main className={`pt-20 px-4 pb-24 md:px-8 transition-all duration-300 min-h-screen ${isSidePanelOpen ? 'md:ml-64' : ''}`}>
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};
