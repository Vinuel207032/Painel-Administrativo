
import React, { useState } from 'react';
import { 
  ChevronDown, 
  LogOut, 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  Building2, 
  Layers, 
  Sun, 
  Moon, 
  Settings as SettingsIcon,
  Store
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidePanelOpen: boolean;
  setIsSidePanelOpen: (isOpen: boolean) => void;
  theme: 'light' | 'dark';
  user: any;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, isSidePanelOpen, theme, user, onLogout
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const userRole = (user?.perfil || user?.role || '').toUpperCase();
  const isLojista = userRole === 'LOJISTA';

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('app_theme', newTheme);
    window.location.reload();
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {/* Header Fixo */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-yellow-500 z-[60] shadow-md flex items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-3">
           <img src="https://i.ibb.co/JF2Gz3v8/logo.png" alt="Logo" className="h-8 w-auto" />
           <span className="hidden md:inline text-slate-900 font-black text-xs uppercase tracking-widest">Master Panel</span>
        </div>
        
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} 
             className="flex items-center gap-2 p-1 rounded-full border-2 border-transparent hover:bg-yellow-600 transition-colors"
           >
              <img src={user?.foto_perfil_url || 'https://i.ibb.co/JF2Gz3v8/logo.png'} className="w-8 h-8 rounded-full border border-white/20 object-cover" />
              <ChevronDown size={14} className="text-white" />
           </button>
           
           {isProfileMenuOpen && (
              <div className={`absolute right-6 top-16 w-52 rounded-2xl shadow-2xl p-2 z-[70] animate-fade-in border ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-100'}`}>
                 <div className="px-3 py-3 border-b border-slate-800/10 mb-1">
                    <p className="text-[9px] font-black text-slate-500 uppercase">Operador</p>
                    <p className="text-xs font-bold truncate">{user?.nome}</p>
                 </div>
                 <button onClick={onLogout} className="w-full text-left px-3 py-3 text-xs text-red-500 font-black flex items-center gap-3 hover:bg-red-500/10 rounded-xl transition-colors">
                   <LogOut size={16} /> Encerrar Sessão
                 </button>
              </div>
           )}
        </div>
      </header>

      {/* Sidebar Desktop (Lista Flat) */}
      <aside className={`hidden md:block fixed top-16 left-0 bottom-0 w-64 z-40 transition-transform duration-300 ${theme === 'dark' ? 'bg-slate-900 border-r border-slate-800' : 'bg-white border-r border-gray-200'} ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 space-y-2">
          <button 
            onClick={() => setActiveTab('DASHBOARD')} 
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'DASHBOARD' ? 'bg-yellow-500 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800/50'}`}
          >
            <LayoutDashboard size={20} /> Visão Geral
          </button>
          
          <div className="pt-4 pb-2">
            <p className="px-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Gerenciamento</p>
            
            <div className="space-y-1">
              {!isLojista ? (
                <>
                  <button onClick={() => setActiveTab('REG_USERS')} className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === 'REG_USERS' ? 'bg-yellow-500 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}>
                    <Users size={20} /> Operadores
                  </button>
                  <button onClick={() => setActiveTab('REG_AVATARS')} className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === 'REG_AVATARS' ? 'bg-yellow-500 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}>
                    <UserCircle size={20} /> Avatares
                  </button>
                  <button onClick={() => setActiveTab('REG_COMPANIES')} className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === 'REG_COMPANIES' ? 'bg-yellow-500 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}>
                    <Building2 size={20} /> Empresas
                  </button>
                  <button onClick={() => setActiveTab('REG_CATEGORIES')} className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === 'REG_CATEGORIES' ? 'bg-yellow-500 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}>
                    <Layers size={20} /> Categorias
                  </button>
                </>
              ) : (
                <button onClick={() => setActiveTab('REG_STORES')} className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === 'REG_STORES' ? 'bg-yellow-500 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}>
                  <Store size={20} /> Minhas Lojas
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Navegação Mobile (Revertida para Flat) */}
      <nav className={`fixed bottom-0 left-0 right-0 h-16 flex md:hidden items-center justify-around z-50 border-t ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        <button onClick={() => setActiveTab('DASHBOARD')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'DASHBOARD' ? 'text-yellow-500' : 'text-slate-400'}`}>
          <LayoutDashboard size={20} /><span className="text-[10px] font-bold">Início</span>
        </button>
        <button onClick={() => setActiveTab('REG_USERS')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'REG_USERS' ? 'text-yellow-500' : 'text-slate-400'}`}>
          <Users size={20} /><span className="text-[10px] font-bold uppercase">Usuários</span>
        </button>
        <button onClick={() => setActiveTab('REG_AVATARS')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'REG_AVATARS' ? 'text-yellow-500' : 'text-slate-400'}`}>
          <UserCircle size={20} /><span className="text-[10px] font-bold uppercase">Avatares</span>
        </button>
        <button onClick={toggleTheme} className="flex flex-col items-center gap-1 flex-1 text-slate-400">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}<span className="text-[10px] font-bold">Tema</span>
        </button>
      </nav>

      {/* Área de Conteúdo */}
      <main className={`pt-20 px-4 pb-24 md:px-10 md:ml-64 transition-all min-h-screen`}>
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};
