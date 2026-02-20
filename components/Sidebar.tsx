
import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  LayoutDashboard, 
  Building2, 
  Layers, 
  Tag, 
  BarChart3, 
  ImageIcon, 
  Users,
  UserCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  ShieldCheck
} from 'lucide-react';
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

const hexToRgba = (hex: string, alpha: number) => {
  if (!hex || hex.length < 6) return `rgba(30, 41, 59, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  theme: 'light' | 'dark';
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  user, 
  isCollapsed,
  setIsCollapsed
}) => {
  const { config } = useConfig();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  
  const primaryColor = config['sistema.cor_primaria'] || 'var(--primary-color, #1e293b)';
  const sidebarBg = config['sistema.cor_sidebar'] || '#ffffff';
  const textColor = getContrastColor(sidebarBg);
  const mutedText = textColor === 'white' ? 'rgba(255,255,255,0.4)' : 'rgba(30,41,59,0.4)';

  const toggleSection = (section: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setOpenSections(prev => ({ ...prev, [section]: true }));
      return;
    }
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const userRole = (user?.perfil || user?.tipo_usuario || '').toUpperCase();
  const sectionMapping = useMemo(() => ({
    parceiros: ['REG_COMPANIES', 'REG_BENEFITS'],
    intelligence: ['INT_REPORTS'],
    config: ['REG_CATEGORIES', 'REG_BANNERS', 'REG_AVATARS'],
    sistema: ['REG_USERS', 'SYS_IDENTITY']
  }), []);

  const SubNavItem = ({ id, label, icon: Icon, roles = ['MASTER', 'ADMIN', 'LOJISTA'] }: any) => {
    if (!roles.includes(userRole)) return null;
    const isActive = activeTab === id;

    return (
      <button 
        onClick={() => setActiveTab(id)} 
        style={isActive ? { 
          backgroundColor: hexToRgba(primaryColor, 0.1),
          color: primaryColor
        } : { color: mutedText }}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-black text-[10px] uppercase tracking-wider mb-1
          ${!isActive ? 'hover:bg-black/5' : ''}
          ${isCollapsed ? 'justify-center px-0' : ''}
        `}
      >
        <Icon size={16} className={`flex-shrink-0 ${isActive ? '' : 'opacity-70'}`} /> 
        {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
      </button>
    );
  };

  const MenuAccordion = ({ section, label, isOpen, onToggle, icon: Icon, roles = ['MASTER', 'ADMIN', 'LOJISTA'], children }: any) => {
    if (!roles.includes(userRole)) return null;
    const isParentActive = sectionMapping[section as keyof typeof sectionMapping]?.includes(activeTab);

    return (
      <div className="space-y-1 mb-1">
        <button 
          onClick={onToggle}
          style={isParentActive ? { backgroundColor: primaryColor, color: getContrastColor(primaryColor) } : { color: textColor }}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group
            ${isParentActive ? 'shadow-lg' : 'hover:bg-black/5'}
            ${isCollapsed ? 'justify-center px-0' : ''}
          `}
        >
          <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'mx-auto' : ''}`}>
            <Icon size={18} className={`flex-shrink-0 ${isParentActive ? '' : 'opacity-70'}`} />
            {!isCollapsed && <span className="font-black text-[10px] uppercase tracking-widest whitespace-nowrap">{label}</span>}
          </div>
          {!isCollapsed && (
            <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
              <ChevronDown size={14} className="opacity-50" />
            </div>
          )}
        </button>
        {isOpen && !isCollapsed && (
          <div className="pl-3 pr-1 space-y-0.5 animate-in slide-in-from-top-1 duration-200">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside 
      style={{ backgroundColor: sidebarBg }}
      className={`fixed top-16 left-0 bottom-0 z-40 transition-all duration-300 ease-in-out flex flex-col border-r border-black/5 ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      <div className="flex-1 overflow-y-auto px-3 py-6 space-y-2 custom-scrollbar">
        <button 
          onClick={() => setActiveTab('DASHBOARD')} 
          style={activeTab === 'DASHBOARD' ? { backgroundColor: primaryColor, color: getContrastColor(primaryColor) } : { color: textColor }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap mb-6
            ${activeTab === 'DASHBOARD' ? 'shadow-lg' : 'hover:bg-black/5'}
            ${isCollapsed ? 'justify-center px-0' : ''}
          `}
        >
          <div className={`${isCollapsed ? 'mx-auto' : ''} flex items-center gap-3`}>
            <LayoutDashboard size={18} className="flex-shrink-0" /> 
            {!isCollapsed && <span className="font-black text-[10px] uppercase tracking-widest">Visão Geral</span>}
          </div>
        </button>

        <MenuAccordion section="parceiros" label="Parceiros" isOpen={openSections.parceiros} onToggle={() => toggleSection('parceiros')} icon={Building2}>
          <SubNavItem id="REG_COMPANIES" label="Empresas" icon={Building2} />
          <SubNavItem id="REG_BENEFITS" label="Benefícios" icon={Tag} />
        </MenuAccordion>

        <MenuAccordion section="intelligence" label="Intelligence" isOpen={openSections.intelligence} onToggle={() => toggleSection('intelligence')} icon={BarChart3} roles={['MASTER', 'ADMIN']}>
          <SubNavItem id="INT_REPORTS" label="Relatórios" icon={BarChart3} />
        </MenuAccordion>

        <MenuAccordion section="config" label="Configurações" isOpen={openSections.config} onToggle={() => toggleSection('config')} icon={Layers} roles={['MASTER']}>
          <SubNavItem id="REG_CATEGORIES" label="Categorias" icon={Layers} />
          <SubNavItem id="REG_BANNERS" label="Banners" icon={ImageIcon} />
          <SubNavItem id="REG_AVATARS" label="Avatares" icon={UserCircle} />
        </MenuAccordion>

        <MenuAccordion section="sistema" label="Sistema" isOpen={openSections.sistema} onToggle={() => toggleSection('sistema')} icon={ShieldCheck} roles={['MASTER']}>
          <SubNavItem id="REG_USERS" label="Operadores" icon={Users} />
          <SubNavItem id="SYS_IDENTITY" label="Identidade" icon={Palette} />
        </MenuAccordion>
      </div>

      <div className="p-4 border-t border-black/5 flex items-center">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          style={{ color: mutedText }}
          className={`flex items-center gap-3 hover:text-primary transition-all group ${isCollapsed ? 'mx-auto' : 'px-4'}`}
        >
          {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Ocultar Menu</span>}
        </button>
      </div>
    </aside>
  );
};
