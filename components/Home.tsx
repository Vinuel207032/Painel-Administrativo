
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Layout } from './Layout';
import { Dashboard } from './Dashboard';
import { Registrations } from './Registrations';

interface HomeProps {
  onLogout: () => void;
  user?: any;
}

export const Home: React.FC<HomeProps> = ({ onLogout, user }) => {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(user?.preferencia_tema || 'light');

  const registerAuditLog = async (acao: string, tabela: string, descricao: string) => {
    if (!supabase || !user || !user.id) return;
    try {
      await supabase.from('tb_logs_audit').insert({
        id_usuario: user.id,
        acao: acao.toUpperCase(),
        tabela: tabela.toUpperCase(),
        descricao: descricao
      });
    } catch (e) {}
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') || user?.preferencia_tema;
    if (savedTheme) setTheme(savedTheme as any);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    registerAuditLog('NAVIGATE', 'SISTEMA', `Acessou aba: ${tab}`);
  };

  const renderContent = () => {
    if (activeTab === 'DASHBOARD') {
      return <Dashboard dashData={{}} theme={theme} user={user} />;
    }

    if (activeTab.startsWith('REG_') || activeTab.startsWith('MY_')) {
      return (
        <Registrations 
          activeSubTab={activeTab} 
          theme={theme} 
          user={user}
          onAuditLog={registerAuditLog}
        />
      );
    }

    return <Dashboard dashData={{}} theme={theme} user={user} />;
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={handleTabChange} 
      isSidePanelOpen={isSidePanelOpen} 
      setIsSidePanelOpen={setIsSidePanelOpen}
      theme={theme}
      user={user}
      onLogout={onLogout}
      onAuditLog={registerAuditLog}
    >
      {renderContent()}
    </Layout>
  );
};
