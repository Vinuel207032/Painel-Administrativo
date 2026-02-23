
import React, { useState } from 'react';
import { ChevronDown, LogOut, Sun, Moon } from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';

// Função para cálculo de contraste automático (YIQ)
const getContrastColor = (hex: string) => {
  if (!hex || hex.length < 6) return 'white';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#1e293b' : 'white';
};

interface HeaderProps {
  user: any;
  theme: 'light' | 'dark';
  onLogout: () => void;
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, theme, onLogout, toggleTheme }) => {
  const { config } = useConfig();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const userRole = (user?.perfil || user?.tipo_usuario || 'LOJISTA').toUpperCase();
  const userName = user?.nome?.split(' ')[0] || 'Usuário';
  const navbarBg = config['sistema.cor_navbar'] || 'var(--primary-color, #1e293b)';
  const textColor = getContrastColor(navbarBg);
  const mutedText = textColor === 'white' ? 'rgba(255,255,255,0.6)' : 'rgba(30,41,59,0.6)';

  const avatarImage = user?.avatars?.url_imagem || user?.foto_url || user?.foto_perfil_url;
  const navbarLogo = config['sistema.logo_navbar'] || "https://i.ibb.co/S7tsNgbC/logo.png";

  return (
    <header 
      style={{ backgroundColor: navbarBg }}
      className="fixed top-0 left-0 right-0 h-16 z-[60] flex items-center justify-between px-6 shadow-lg transition-all"
    >
      <div className="flex items-center pl-2">
        <img src={navbarLogo} alt="Logo" className="h-10 w-auto object-contain filter drop-shadow-sm" />
      </div>

      <div className="flex items-center gap-4 relative">
        
        <div 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="bg-black/10 backdrop-blur-md rounded-2xl py-2 px-4 flex items-center gap-3 border border-white/10 shadow-sm cursor-pointer hover:bg-black/20 transition-all select-none"
        >
          <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/20 bg-white flex-shrink-0 shadow-inner">
            {avatarImage ? (
              <img src={avatarImage} alt="Avatar" className="w-full h-full object-contain p-0.5" />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center bg-white font-black text-sm"
                style={{ color: navbarBg }}
              >
                {user?.nome?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>

          <div className="flex flex-col leading-tight min-w-[70px]">
            <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: mutedText }}>
              {userRole}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-tight" style={{ color: textColor }}>
              {userName}
            </span>
          </div>

          <div className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} style={{ color: textColor }}>
            <ChevronDown size={16} className="opacity-70" />
          </div>
        </div>

        {isDropdownOpen && (
          <>
            <div className="fixed inset-0 z-[-1]" onClick={() => setIsDropdownOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Identidade Digital</p>
                <p className="text-xs font-bold text-slate-700 truncate">{user?.email}</p>
              </div>
              <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-5 py-4 text-sm font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                <span>Sair do Painel</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
