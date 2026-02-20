
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ConfigContextType {
  config: Record<string, string>;
  loading: boolean;
  refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const applyConfigs = (data: any[]) => {
    const configMap: Record<string, string> = {};
    data.forEach((item) => {
      configMap[item.chave] = item.valor;
    });

    // Injeção de Variáveis CSS Globais
    const root = document.documentElement;
    if (configMap['sistema.cor_primaria']) root.style.setProperty('--primary-color', configMap['sistema.cor_primaria']);
    if (configMap['sistema.cor_navbar']) root.style.setProperty('--navbar-bg', configMap['sistema.cor_navbar']);
    if (configMap['sistema.cor_sidebar']) root.style.setProperty('--sidebar-bg', configMap['sistema.cor_sidebar']);
    if (configMap['sistema.cor_fundo_paginas']) root.style.setProperty('--page-bg', configMap['sistema.cor_fundo_paginas']);
    if (configMap['sistema.cor_texto_header']) root.style.setProperty('--header-text', configMap['sistema.cor_texto_header']);

    // Atualização de Meta Tags (SEO / WhatsApp) - Protegido
    if (configMap['meta.titulo']) {
      document.title = configMap['meta.titulo'];
      updateMetaTag('og:title', configMap['meta.titulo']);
    }
    if (configMap['meta.descricao']) {
      updateMetaTag('description', configMap['meta.descricao']);
      updateMetaTag('og:description', configMap['meta.descricao']);
    }
    if (configMap['meta.imagem_preview']) {
      updateMetaTag('og:image', configMap['meta.imagem_preview']);
    }
    if (configMap['sistema.favicon']) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = configMap['sistema.favicon'];
    }

    setConfig(configMap);
  };

  const updateMetaTag = (name: string, content: string) => {
    let tag = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      if (name.startsWith('og:')) tag.setAttribute('property', name);
      else tag.setAttribute('name', name);
      document.getElementsByTagName('head')[0].appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  const refreshConfig = async () => {
    try {
      const { data, error } = await supabase.from('configuracoes_sistema').select('*');
      if (!error && data) {
        applyConfigs(data);
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading, refreshConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error('useConfig deve ser usado dentro de um ConfigProvider');
  return context;
};
