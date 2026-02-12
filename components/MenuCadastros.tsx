
import React from 'react';
import { 
  Users, UserCircle, Building2, Layers, Image as ImageIcon, BellRing, ArrowLeft, Store
} from 'lucide-react';

interface MenuCadastrosProps {
  theme: string;
  setActiveTab: (tab: string) => void;
  userRole: string;
}

export const MenuCadastros: React.FC<MenuCadastrosProps> = ({ theme, setActiveTab, userRole }) => {
  const isLojista = userRole === 'LOJISTA';

  const items = isLojista ? [
    { id: 'MY_STORES', label: 'Minhas Lojas', icon: Store, color: 'bg-yellow-500' },
  ] : [
    { id: 'REG_USERS', label: 'Operadores', icon: Users, color: 'bg-yellow-500' },
    { id: 'REG_AVATARS', label: 'Avatares', icon: UserCircle, color: 'bg-purple-500' },
    { id: 'REG_COMPANIES', label: 'Empresas', icon: Building2, color: 'bg-blue-500' },
    { id: 'REG_CATEGORIES', label: 'Categorias', icon: Layers, color: 'bg-green-500' },
    { id: 'REG_BANNERS', label: 'Banners', icon: ImageIcon, color: 'bg-pink-500' },
    { id: 'REG_NOTIFICATIONS', label: 'Notificações', icon: BellRing, color: 'bg-orange-500' },
  ];

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('DASHBOARD')}
          className={`p-3 rounded-2xl border ${theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Cadastros</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center p-8 rounded-[2.5rem] border shadow-sm transition-all active:scale-95 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl ${item.color} text-white flex items-center justify-center mb-4 shadow-lg`}>
              <item.icon size={28} />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest text-center ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
