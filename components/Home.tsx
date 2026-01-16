
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
      const { error } = await supabase.from('tb_logs_audit').insert({
        id_usuario: user.id,
        acao: acao.toUpperCase(),
        tabela: tabela.toUpperCase(),
        descricao: descricao
      });

      if (error) {
        console.warn(`[Audit WARN] ${error.message}`);
        // Não relançamos o erro para não quebrar a UI
      } else {
        console.log(`[Audit SUCCESS] ${acao} -> ${tabela}`);
      }
    } catch (e: any) {
      // Captura erros de rede como "Failed to fetch" sem interromper o usuário
      if (e.message?.includes('fetch')) {
        console.warn("[Audit Network Error] Supabase inacessível no momento.");
      } else {
        console.error("[Audit System Error]", e.message || e);
      }
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') || user?.preferencia_tema;
    if (savedTheme) setTheme(savedTheme as any);
    
    registerAuditLog('ACCESS', 'SISTEMA', `Sessão ativa para o operador: ${user?.nome}.`);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    registerAuditLog('NAVIGATE', 'SISTEMA', `Navegou para a aba: ${tab}`);
  };

  const renderContent = () => {
    if (activeTab === 'DASHBOARD') {
      return <Dashboard dashData={{}} theme={theme} user={user} />;
    }

    if (activeTab.startsWith('REG_')) {
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
      onLogout={() => {
        registerAuditLog('LOGOUT', 'SISTEMA', 'Operador encerrou a sessão.');
        onLogout();
      }}
      onAuditLog={registerAuditLog}
    >
      {renderContent()}
    </Layout>
  );
};
