
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useConfig } from '../contexts/ConfigContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidePanelOpen: boolean; 
  setIsSidePanelOpen: (isOpen: boolean) => void;
  theme: 'light' | 'dark';
  user: any;
  onLogout: () => void;
  onAuditLog?: (acao: string, tabela: string, descricao: string) => void | Promise<void>;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  theme, 
  user,
  onLogout
}) => {
  const { config } = useConfig();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const pageBg = config['sistema.cor_fundo_paginas'] || '#f8fafc';

  return (
    <div 
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{ backgroundColor: pageBg }}
    >
      {/* Header Fixo */}
      <Header user={user} theme={theme} onLogout={onLogout} />

      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          theme={theme}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        <div 
          className={`flex flex-col flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}
          style={{ backgroundColor: pageBg }}
        >
          {/* Área de Conteúdo - Removido bg-gray-50/30 para evitar a borda branca */}
          <main className="p-6 md:p-10 flex-1">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>

          <footer className="p-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-300/50">
             &copy; {new Date().getFullYear()} Clube da Gente Brasil
          </footer>
        </div>
      </div>
    </div>
  );
};
