
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Layout } from './Layout';
import { Dashboard } from './Dashboard';
import { Registrations } from './Registrations';
import { Identidade } from './Identidade';
import { Categories } from './Categories';
import { Banners } from './Banners';
import { Avatars } from './Avatars';

interface HomeProps {
  onLogout: () => void;
  user?: any;
}

export const Home: React.FC<HomeProps> = ({ onLogout, user }) => {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(user?.preferencia_tema || 'light');

  const userRole = (user?.perfil || user?.tipo_usuario || '').toUpperCase();
  const isMaster = userRole === 'MASTER';

  const registerAuditLog = async (
    acao: string, 
    tabela: string, 
    descricao: string,
    dados_antigos?: string,
    dados_novos?: string,
    entidade_id?: number,
    entidade_tipo?: string
  ) => {
    if (!supabase || !user || !user.id) return;
    try {
      let ip = null;
      let gps = null;
      
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        ip = data.ip;
      } catch (e) {}

      try {
        if (navigator.geolocation) {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          gps = `${pos.coords.latitude}, ${pos.coords.longitude}`;
        }
      } catch (e) {}

      await supabase.from('lods').insert({
        usuario_id: user.id,
        usuario_nome: user.nome || null,
        usuario_cpf: user.cpf || null,
        tipo_usuario: user.tipo_usuario || null,
        tipo_acao: acao.toUpperCase(),
        descricao_acao: descricao,
        modulo: tabela.toUpperCase(),
        dados_antigos: dados_antigos || null,
        dados_novos: dados_novos || null,
        entidade_id: entidade_id || null,
        entidade_tipo: entidade_tipo || null,
        endereco_ip: ip,
        localizacao_gps: gps
      });
    } catch (e) {}
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') || user?.preferencia_tema;
    if (savedTheme) setTheme(savedTheme as any);
  }, []);

  const handleTabChange = (tab: string) => {
    if (tab === 'SYS_IDENTITY' && !isMaster) {
      setActiveTab('DASHBOARD');
      return;
    }
    setActiveTab(tab);
    registerAuditLog('NAVIGATE', 'SISTEMA', `Acessou aba: ${tab}`);
  };

  const renderContent = () => {
    if (activeTab === 'DASHBOARD') {
      return <Dashboard dashData={{}} theme={theme} user={user} />;
    }

    if (activeTab === 'SYS_IDENTITY') {
      return <Identidade theme={theme} />;
    }

      if (activeTab === 'REG_CATEGORIES') {
        return <Categories theme={theme} user={user} onAuditLog={registerAuditLog} />;
      }

      if (activeTab === 'REG_BANNERS') {
        return <Banners theme={theme} user={user} onAuditLog={registerAuditLog} />;
      }

      if (activeTab === 'REG_AVATARS') {
        return <Avatars theme={theme} user={user} onAuditLog={registerAuditLog} />;
      }

    return (
      <Registrations 
        activeSubTab={activeTab} 
        theme={theme} 
        user={user}
        onAuditLog={registerAuditLog}
      />
    );
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
