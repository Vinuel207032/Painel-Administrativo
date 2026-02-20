
import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Palette, Monitor, Globe, Image as ImageIcon, 
  CheckCircle2, RefreshCw, Sparkles, Brush, X, Info, Hash, Sun, Moon, Contrast, AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useConfig } from '../contexts/ConfigContext';
import { Breadcrumb } from './Breadcrumb';
import { GoogleGenAI, Type } from "@google/genai";

// Função para cálculo de contraste automático (YIQ)
const getContrastColor = (hex: string) => {
  if (!hex || hex.length < 6) return 'white';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#1e293b' : 'white'; // Retorna azul ardósia escuro ou branco
};

// Gera cor para as seções (cards) adaptada ao fundo com profundidade
const getSectionStyles = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  // Se for claro, escurece um pouco. Se for escuro, clareia.
  const diff = yiq >= 128 ? -5 : 10;
  const bg = `rgb(${Math.max(0, Math.min(255, r + diff))}, ${Math.max(0, Math.min(255, g + diff))}, ${Math.max(0, Math.min(255, b + diff))})`;
  
  return {
    backgroundColor: bg,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    borderColor: 'rgba(0,0,0,0.05)'
  };
};

export const Identidade: React.FC<{ theme: string }> = ({ theme }) => {
  const { config, refreshConfig } = useConfig();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isIAModalOpen, setIsIAModalOpen] = useState(false);
  const [iaPrompt, setIaPrompt] = useState('');
  const [iaLoading, setIaLoading] = useState(false);
  const [previewsContrast, setPreviewsContrast] = useState<Record<string, 'light' | 'dark' | 'gray'>>({});
  
  const [form, setForm] = useState({
    'sistema.cor_primaria': '',
    'sistema.cor_navbar': '',
    'sistema.cor_sidebar': '',
    'sistema.cor_fundo_paginas': '',
    'sistema.cor_texto_header': '',
    'sistema.favicon': '',
    'sistema.logo_navbar': '',
    'login.imagem_fundo': '',
    'login.imagem_hero': '',
    'login.logo_url': '',
    'login.imagem_particula': '',
    'meta.titulo': '',
    'meta.descricao': '',
    'meta.imagem_preview': ''
  });

  useEffect(() => {
    if (config) {
      setForm({
        'sistema.cor_primaria': config['sistema.cor_primaria'] || '#1e293b',
        'sistema.cor_navbar': config['sistema.cor_navbar'] || '#1e293b',
        'sistema.cor_sidebar': config['sistema.cor_sidebar'] || '#ffffff',
        'sistema.cor_fundo_paginas': config['sistema.cor_fundo_paginas'] || '#f8fafc',
        'sistema.cor_texto_header': config['sistema.cor_texto_header'] || '#ffffff',
        'sistema.favicon': config['sistema.favicon'] || '',
        'sistema.logo_navbar': config['sistema.logo_navbar'] || '',
        'login.imagem_fundo': config['login.imagem_fundo'] || '',
        'login.imagem_hero': config['login.imagem_hero'] || '',
        'login.logo_url': config['login.logo_url'] || '',
        'login.imagem_particula': config['login.imagem_particula'] || '',
        'meta.titulo': config['meta.titulo'] || '',
        'meta.descricao': config['meta.descricao'] || '',
        'meta.imagem_preview': config['meta.imagem_preview'] || ''
      });
    }
  }, [config]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates = Object.entries(form).map(([key, val]) => ({
        chave: key,
        valor: val,
        tipo: key.includes('cor') ? 'COR' : 'TEXTO'
      }));
      for (const item of updates) {
        await supabase.from('configuracoes_sistema').upsert(item, { onConflict: 'chave' });
      }
      await refreshConfig();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleIASuggestion = async () => {
    if (!iaPrompt) return;
    setIaLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Como um designer premium, sugira cores e imagens para: "${iaPrompt}".`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              'sistema.cor_primaria': { type: Type.STRING },
              'sistema.cor_navbar': { type: Type.STRING },
              'sistema.cor_sidebar': { type: Type.STRING },
              'sistema.cor_fundo_paginas': { type: Type.STRING },
              'sistema.cor_texto_header': { type: Type.STRING },
              'login.imagem_fundo': { type: Type.STRING },
              'login.imagem_hero': { type: Type.STRING }
            }
          }
        }
      });
      const suggestion = JSON.parse(response.text || '{}');
      setForm(prev => ({ ...prev, ...suggestion }));
      setIsIAModalOpen(false);
      setSuccess(true);
    } catch (err) { console.error(err); } finally { setIaLoading(false); }
  };

  const primaryColor = form['sistema.cor_primaria'];
  const pageBg = form['sistema.cor_fundo_paginas'];
  const textColor = getContrastColor(pageBg);
  const mutedText = textColor === 'white' ? 'rgba(255,255,255,0.5)' : 'rgba(30,41,59,0.5)';
  const sectionStyles = getSectionStyles(pageBg);

  const ColorInput = ({ label, keyName, helper }: { label: string, keyName: string, helper: string }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: mutedText }}>{label}</label>
        <div className="flex items-center gap-3 h-12">
          <div 
            className="relative w-12 h-12 rounded-xl border-2 shadow-inner overflow-hidden flex-shrink-0 cursor-pointer"
            style={{ backgroundColor: form[keyName as keyof typeof form], borderColor: 'rgba(0,0,0,0.1)' }}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="color" value={form[keyName as keyof typeof form]} onChange={(e) => setForm({ ...form, [keyName]: e.target.value })} className="absolute inset-0 opacity-0 scale-150 cursor-pointer" />
          </div>
          <div className="flex-1 flex items-center gap-2 px-4 rounded-xl border h-full transition-all" style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderColor: 'rgba(0,0,0,0.05)' }}>
            <Hash size={14} style={{ color: mutedText }} />
            <input type="text" value={form[keyName as keyof typeof form]} onChange={(e) => setForm({ ...form, [keyName]: e.target.value })} className="w-full bg-transparent border-none outline-none font-black text-xs uppercase tracking-widest" style={{ color: textColor }} />
          </div>
        </div>
        <p className="text-[9px] ml-1 italic opacity-60" style={{ color: textColor }}>{helper}</p>
      </div>
    );
  };

  const TextInput = ({ label, keyName, helper, isUrl = false }: { label: string, keyName: string, helper: string, isUrl?: boolean }) => {
    const contrast = previewsContrast[keyName] || 'light';
    const bgPreview = contrast === 'light' ? 'bg-white' : contrast === 'dark' ? 'bg-slate-950' : 'bg-slate-300';
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: mutedText }}>{label}</label>
        <div className="flex items-center gap-3 px-4 rounded-xl border h-12 transition-all mb-1" style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderColor: 'rgba(0,0,0,0.05)' }}>
          {isUrl ? <ImageIcon size={16} style={{ color: mutedText }} /> : <Info size={16} style={{ color: mutedText }} />}
          <input type="text" value={form[keyName as keyof typeof form]} onChange={(e) => setForm({ ...form, [keyName]: e.target.value })} className="flex-1 bg-transparent border-none outline-none font-bold text-xs" style={{ color: textColor }} />
        </div>
        <p className="text-[9px] ml-1 italic opacity-60 mb-2" style={{ color: textColor }}>{helper}</p>
        {isUrl && form[keyName as keyof typeof form] && (
          <div className="w-full flex items-center gap-4 mb-4">
            <div className={`relative h-24 flex-1 rounded-2xl overflow-hidden border p-2 flex items-center justify-center shadow-inner ${bgPreview}`} style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
              <img src={form[keyName as keyof typeof form]} alt="Preview" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex flex-col gap-1 p-1.5 rounded-xl border" style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderColor: 'rgba(0,0,0,0.05)' }}>
              <button onClick={() => setPreviewsContrast(p => ({...p, [keyName]: 'light'}))} className={`p-1.5 rounded-lg transition-all ${contrast === 'light' ? 'bg-black/5' : 'text-slate-400'}`}><Sun size={14} /></button>
              <button onClick={() => setPreviewsContrast(p => ({...p, [keyName]: 'gray'}))} className={`p-1.5 rounded-lg transition-all ${contrast === 'gray' ? 'bg-black/5' : 'text-slate-400'}`}><Contrast size={14} /></button>
              <button onClick={() => setPreviewsContrast(p => ({...p, [keyName]: 'dark'}))} className={`p-1.5 rounded-lg transition-all ${contrast === 'dark' ? 'bg-black/5' : 'text-slate-400'}`}><Moon size={14} /></button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in transition-colors duration-500 pb-20">
      <style>{`
        @property --shimmer-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
        @keyframes shimmer { from { --shimmer-angle: 0deg; } to { --shimmer-angle: 360deg; } }
        @keyframes sparkle-glow { 0%, 100% { filter: drop-shadow(0 0 2px #fff) brightness(1); } 50% { filter: drop-shadow(0 0 8px #fff) brightness(1.3); } }
        .animate-sparkle { animation: sparkle-glow 2s ease-in-out infinite; }
      `}</style>
      
      <div className="max-w-5xl mx-auto pt-4">
        <Breadcrumb theme={theme} paths={[{ label: 'Sistema' }, { label: 'Identidade Visual', active: true }]} />

        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex items-center gap-6">
            <div style={{ backgroundColor: primaryColor }} className="w-16 h-16 text-white rounded-[1.25rem] shadow-2xl flex items-center justify-center transition-transform hover:scale-105">
              <Palette size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight" style={{ color: textColor }}>Identidade Visual</h2>
              <p className="font-bold text-[10px] uppercase tracking-widest mt-1 opacity-60" style={{ color: textColor }}>Camaleão: Adaptativo & Inteligente</p>
            </div>
          </div>
          <div className="relative p-[2px] group rounded-2xl overflow-hidden shadow-2xl active:scale-95 transition-all">
            <div className="absolute inset-0 bg-[conic-gradient(from_var(--shimmer-angle),#fbbf24,#ec4899,#3b82f6,#fbbf24)] animate-[shimmer_4s_linear_infinite]" />
            <button onClick={() => setIsIAModalOpen(true)} className="relative px-8 py-4 bg-zinc-950 text-white rounded-[14px] border border-white/10 font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3">
              <Sparkles size={16} className="animate-sparkle" /> Iluminar Design
            </button>
          </div>
        </header>

        {/* SEÇÃO INFORMATIVA E DE SEGURANÇA */}
        <div className="mb-10 p-8 rounded-[2rem] border transition-all flex flex-col md:flex-row items-start md:items-center gap-6" style={sectionStyles}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
            <AlertTriangle size={28} className="animate-pulse" />
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="font-black uppercase text-xs tracking-[0.2em]" style={{ color: primaryColor }}>Central de Governança Visual</h4>
            <p className="text-sm font-bold leading-relaxed opacity-90" style={{ color: textColor }}>
              Esta interface controla a alma visual do ecossistema. Alterações feitas aqui são propagadas em tempo real para todos os operadores e parceiros. 
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: textColor }}>
              Atenção: Recomendamos que ajustes profundos de Branding sejam realizados em horários de baixa atividade operacional para evitar flutuações na experiência do usuário.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-10">
          <div className="p-10 rounded-[2.5rem] border transition-all" style={sectionStyles}>
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-black/5">
              <Brush size={18} style={{ color: primaryColor }} />
              <h3 className="font-black uppercase text-xs tracking-[0.2em]" style={{ color: mutedText }}>Paleta Operacional</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <ColorInput label="Destaque Principal" keyName="sistema.cor_primaria" helper="Botões e ícones." />
              <ColorInput label="Base Navbar" keyName="sistema.cor_navbar" helper="Topo do sistema." />
              <ColorInput label="Menu Lateral" keyName="sistema.cor_sidebar" helper="Fundo da navegação." />
              <ColorInput label="Fundo de Páginas" keyName="sistema.cor_fundo_paginas" helper="Base global de conteúdo." />
              <ColorInput label="Textos Navbar" keyName="sistema.cor_texto_header" helper="Fontes do cabeçalho." />
            </div>
          </div>

          <div className="p-10 rounded-[2.5rem] border transition-all" style={sectionStyles}>
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-black/5">
              <Monitor size={18} style={{ color: primaryColor }} />
              <h3 className="font-black uppercase text-xs tracking-[0.2em]" style={{ color: mutedText }}>Imagens de Marca</h3>
            </div>
            <div className="grid grid-cols-1 gap-10">
              <TextInput label="Fundo do Login" keyName="login.imagem_fundo" helper="Wallpaper do portal de acesso." isUrl />
              <TextInput label="Imagem Destaque" keyName="login.imagem_hero" helper="Imagem lateral do login." isUrl />
              <TextInput label="Logo Login" keyName="login.logo_url" helper="Sua marca no portal." isUrl />
              <TextInput label="Logo Interna" keyName="sistema.logo_navbar" helper="Sua marca na barra de topo." isUrl />
              <TextInput label="Favicon" keyName="sistema.favicon" helper="Ícone da aba do navegador." isUrl />
            </div>
          </div>

          <div className="p-10 rounded-[2.5rem] border transition-all" style={sectionStyles}>
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-black/5">
              <Globe size={18} style={{ color: primaryColor }} />
              <h3 className="font-black uppercase text-xs tracking-[0.2em]" style={{ color: mutedText }}>SEO & Metadados</h3>
            </div>
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: mutedText }}>Título Global</label>
                <input type="text" value={form['meta.titulo']} onChange={e => setForm({...form, 'meta.titulo': e.target.value})} className="w-full h-12 px-5 rounded-xl border font-bold outline-none" style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderColor: 'rgba(0,0,0,0.05)', color: textColor }} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: mutedText }}>Descrição Estratégica</label>
                <textarea rows={3} value={form['meta.descricao']} onChange={e => setForm({...form, 'meta.descricao': e.target.value})} className="w-full p-5 rounded-xl border font-bold outline-none resize-none" style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderColor: 'rgba(0,0,0,0.05)', color: textColor }} />
              </div>
              <TextInput label="Capa de Social" keyName="meta.imagem_preview" helper="Preview em links (WhatsApp/Google)." isUrl />
              
              <div className="mt-8 p-8 rounded-[2rem] border-2 border-dashed transition-all" style={{ borderColor: 'rgba(0,0,0,0.1)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-6 text-center" style={{ color: mutedText }}>Simulação de Visualização de Link</p>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border overflow-hidden mx-auto max-w-sm transition-all transform hover:scale-[1.02]" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                  <img src={form['meta.imagem_preview'] || 'https://i.ibb.co/JF2Gz3v8/logo.png'} className="w-full h-44 object-cover border-b dark:border-slate-800" onError={(e) => e.currentTarget.src = 'https://i.ibb.co/JF2Gz3v8/logo.png'} />
                  <div className="p-6">
                    <p className="font-black text-sm truncate mb-1" style={{ color: primaryColor }}>{form['meta.titulo'] || 'Título do Sistema'}</p>
                    <p className="text-[11px] font-semibold line-clamp-2 leading-relaxed opacity-60" style={{ color: textColor }}>{form['meta.descricao'] || 'Defina uma descrição clara para melhorar seu SEO e presença digital nos compartilhamentos.'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button onClick={handleSave} disabled={loading} style={{ backgroundColor: primaryColor, color: getContrastColor(primaryColor) }} className="flex items-center gap-5 px-16 py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">
              {loading ? <RefreshCw className="animate-spin" size={20} /> : success ? <CheckCircle2 size={20} /> : <Save size={20} />}
              <span>{loading ? 'Sincronizando...' : success ? 'Sincronizado!' : 'Confirmar Visual'}</span>
            </button>
          </div>
        </div>
      </div>

      {isIAModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative p-[6px] w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 bg-[conic-gradient(from_var(--shimmer-angle),#fbbf24,#ec4899,#3b82f6,#fbbf24)] animate-[shimmer_4s_linear_infinite]" />
            <div className="relative bg-white dark:bg-slate-900 rounded-[2.25rem] p-12 overflow-hidden">
              {iaLoading && (
                <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md z-20 flex flex-col items-center justify-center">
                   <div className="w-16 h-16 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: primaryColor }}></div>
                   <p className="mt-6 font-black uppercase text-[10px] tracking-[0.4em] text-slate-600 dark:text-slate-300">REDEFININDO ESTÉTICA...</p>
                </div>
              )}
              <div className="flex justify-between items-center mb-10">
                 <div className="flex items-center gap-4">
                   <div className="p-4 text-white rounded-2xl shadow-lg" style={{ backgroundColor: primaryColor }}>
                      <Sparkles size={24} className="animate-sparkle" />
                   </div>
                   <div>
                     <h3 className="text-2xl font-black uppercase tracking-tight dark:text-white">Motor IA</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estética Futurista</p>
                   </div>
                 </div>
                 <button onClick={() => setIsIAModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><X size={20} style={{ color: primaryColor }} /></button>
              </div>
              <div className="space-y-8">
                <textarea rows={4} placeholder="Ex: 'Um visual corporativo clean em tons de azul glaciar'..." value={iaPrompt} onChange={(e) => setIaPrompt(e.target.value)} className="w-full p-6 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold text-sm outline-none shadow-inner resize-none focus:border-opacity-100 transition-all" style={{ borderColor: `${primaryColor}30` }} />
                <button onClick={handleIASuggestion} style={{ backgroundColor: primaryColor, color: getContrastColor(primaryColor) }} className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3">
                  <Sparkles size={18} className="animate-sparkle" /> Iluminar Agora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
