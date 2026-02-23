import React, { useState, useEffect, useMemo, useRef } from 'react';

import { Sparkles, Filter, Search, Plus, Layers, AlertCircle, Bell, Edit3, Trash2, Save, X, ChevronLeft, ChevronRight, Printer, ChevronDown, Eye, Check } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { supabase } from '../lib/supabase';
import { Breadcrumb } from './Breadcrumb';
import { useConfig } from '../contexts/ConfigContext';

interface CategoriesProps {
  theme: string;
  user: any;
  onAuditLog: (acao: string, tabela: string, desc: string, dados_antigos?: string, dados_novos?: string, entidade_id?: number, entidade_tipo?: string) => void;
}

const hexToRgba = (hex: string, alpha: number) => {
  if (!hex || hex.length < 6) return `rgba(30, 41, 59, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getContrastColor = (hex: string) => {
  if (!hex || hex.length < 6) return 'white';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#1e293b' : 'white';
};

export const Categories: React.FC<CategoriesProps> = ({ 
  theme, user, onAuditLog 
}) => {
  const { config } = useConfig();
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'LIST' | 'EDIT' | 'CREATE'>('LIST');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const filterPopupRef = useRef<HTMLDivElement>(null);
  const [isSortOpen, setIsSortOpen] = useState(true);
  const [isStatusOpen, setIsStatusOpen] = useState(true);
  const [activeStatuses, setActiveStatuses] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'id', direction: 'asc' });
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiCategoryName, setAiCategoryName] = useState('');
  const [aiGeneratedData, setAiGeneratedData] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [iconQuery, setIconQuery] = useState('');
  const [iconResults, setIconResults] = useState<any[]>([]);
  const [isSearchingIcons, setIsSearchingIcons] = useState(false);
  const [iconSearchResponse, setIconSearchResponse] = useState<any>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const primaryColor = config['sistema.cor_primaria'] || '#1e293b';
  const contrastText = getContrastColor(primaryColor);

  const [categoryForm, setCategoryForm] = useState({
    id: null, 
    nome: '', 
    descricao: '', 
    icone_url: '', 
    cor_hexadecimal: '#000000', 
    ordem: 0,
    is_gastronomy: false,
    status: 'ATIVO'
  });

  useEffect(() => {
    fetchData();

    const handleClickOutside = (event: MouseEvent) => {
      if (filterPopupRef.current && !filterPopupRef.current.contains(event.target as Node)) {
        setIsFilterPopupOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*, empresas(count)')
        .order('ordem', { ascending: true });

      if (error) throw error;
      setListData(data || []);
    } catch (err: any) {
      showToast('Erro ao carregar categorias: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let data = [...listData];

    // Passo 1: Busca
    if (searchTerm) {
      data = data.filter(i => {
        const searchStr = `${i.nome} ${i.descricao}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
      });
    }

    // Passo 2: Filtro de Status
    if (activeStatuses.length > 0) {
      data = data.filter(i => activeStatuses.includes(i.status));
    }

    // Passo 3: Ordenação
    data.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'empresas_count') {
        aValue = a.empresas[0]?.count || 0;
        bValue = b.empresas[0]?.count || 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return data;
  }, [listData, searchTerm, activeStatuses, sortConfig]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

  const handleEdit = (c: any) => {
    setCategoryForm(c);
    setViewMode('EDIT');
  };

  const handleOpenCreate = () => {
    setCategoryForm({
      id: null, 
      nome: '', 
      descricao: '', 
      icone_url: '', 
      cor_hexadecimal: '#000000', 
      ordem: listData.length + 1,
      is_gastronomy: false,
      status: 'ATIVO'
    });
    setIsAiGenerated(false);
    setViewMode('CREATE');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { id, empresas, ...payload } = categoryForm;

      if (viewMode === 'EDIT') {
        const { error } = await supabase.from('categorias').update(payload).eq('id', id);
        if (error) throw error;
        onAuditLog('UPDATE', 'CATEGORIAS', `Atualizou categoria ${payload.nome}`, JSON.stringify(listData.find(c => c.id === id)), JSON.stringify(categoryForm), id, 'CATEGORIA');
      } else { // CREATE
        const { error } = await supabase.from('categorias').insert([payload]).select();
        if (error) throw error;
        onAuditLog('INSERT', 'CATEGORIAS', `Criou categoria ${payload.nome}`, undefined, JSON.stringify(categoryForm));
      }
      
      showToast('Categoria salva com sucesso!', 'success');
      setViewMode('LIST');
      fetchData();
    } catch (err: any) {
      showToast('Erro ao salvar categoria: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    // ... (logic will be added in subsequent steps)
    showToast('Funcionalidade de excluir em implementação.', 'error');
  };

  const handleStatusToggle = (status: string) => {
    setActiveStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const handleSortChange = (key: string, direction: 'asc' | 'desc') => {
    setSortConfig({ key, direction });
  };

  const renderSortButton = (label: string, key: string, direction: 'asc' | 'desc') => {
    const isActive = sortConfig.key === key && sortConfig.direction === direction;
    return (
      <button 
        onClick={() => handleSortChange(key, direction)}
        style={isActive ? { backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor } : {}}
        className={`w-full text-left text-[10px] font-black tracking-wider p-2 rounded-lg transition-colors ${isActive ? '' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
        {label}
      </button>
    );
  };

  const renderStatusButton = (status: string) => {
    const isActive = activeStatuses.includes(status);
    return (
      <button 
        onClick={() => handleStatusToggle(status)}
        style={isActive ? { backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor, borderColor: hexToRgba(primaryColor, 0.2) } : {}}
        className={`w-full text-left text-xs font-bold p-3 rounded-xl border transition-colors ${isActive ? '' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
        {status}
      </button>
    );
  };

  const handleAiGenerate = async () => {
    if (!aiCategoryName.trim()) {
      showToast('Por favor, insira um nome para a categoria.', 'error');
      return;
    }
    setIsAiLoading(true);
    setAiGeneratedData(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `Gere os detalhes para uma categoria de aplicativo chamada "${aiCategoryName}". Retorne um JSON com os seguintes campos:
      - "descricao": Uma descrição curta e informativa (máximo 100 caracteres).
      - "cor_hexadecimal": Uma cor hexadecimal vibrante e apropriada.
      - "icone_url": O código SVG de um ícone do Lucide Icons (https://lucide.dev/) que represente bem a categoria. O SVG deve ter 'width="100%" height="100%"' e 'stroke-width="1.5"'. Exemplo: <svg...></svg>.
      O JSON deve ser limpo, sem markdown ou caracteres de escape.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });
      
      const text = response.text;
      if (text) {
        const jsonData = JSON.parse(text);
        setAiGeneratedData(jsonData);
      } else {
        throw new Error("Empty response from AI");
      }
    } catch (error) { 
      console.error(error);
      showToast('Ocorreu um erro ao gerar os dados.', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };
  const handleViewAiResult = () => {
    if (!aiGeneratedData) return;
    setCategoryForm({
      id: null,
      nome: aiCategoryName,
      descricao: aiGeneratedData.descricao,
      icone_url: aiGeneratedData.icone_url,
      cor_hexadecimal: aiGeneratedData.cor_hexadecimal,
      ordem: listData.length + 1,
      is_gastronomy: false,
      status: 'ATIVO'
    });
    setIsAiGenerated(true);
    setIsAiModalOpen(false);
    setViewMode('CREATE');
  };

  const handleIconSearch = async () => {
    if (!iconQuery.trim()) return;
    setIsSearchingIcons(true);
    setIconResults([]);
    setIconSearchResponse(null);
    try {
      const url = `https://api.iconify.design/search?query=${iconQuery}&limit=30`;
      alert(`Buscando em: ${url}`);
      const response = await fetch(url);
      const data = await response.json();
      setIconSearchResponse(data); // Salva a resposta JSON crua
      setIconResults(data.icons || []);
    } catch (error) {
      console.error('Error searching icons:', error);
      showToast('Erro ao buscar ícones.', 'error');
    } finally {
      setIsSearchingIcons(false);
    }
  };

  const handleIconSelect = async (icon: { prefix: string, name: string }) => {
    try {
      const url = `https://api.iconify.design/${icon.prefix}/${icon.name}.svg`;
      alert(`Buscando SVG em: ${url}`);
      const response = await fetch(url);
      const svgText = await response.text();
      alert(`SVG Recebido:\n\n${svgText}`);
      setCategoryForm({ ...categoryForm, icone_url: svgText });
      setIconQuery('');
      setIconResults([]);
    } catch (error) {
      console.error('Error fetching SVG:', error);
      showToast('Erro ao carregar SVG do ícone.', 'error');
    }
  };
  const handleStatusChange = (newStatus: 'ATIVO' | 'INATIVO') => { setCategoryForm({ ...categoryForm, status: newStatus }); };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentUserName = user?.nome || 'Operador do Sistema';
    const currentUserType = (user?.perfil || user?.tipo_usuario || 'USUÁRIO').toUpperCase();
    const now = new Date();
    const formattedDate = now.toLocaleDateString();
    const formattedTime = now.toLocaleTimeString();

    const rows = filtered.map(c => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background-color: ${hexToRgba(c.cor_hexadecimal, 0.1)}; color: ${c.cor_hexadecimal}; display: inline-flex; align-items: center; justify-content: center;">
            ${c.icone_url}
          </div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; font-size: 11px; text-transform: uppercase;">${c.nome}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; font-size: 10px; text-align: center;">${c.empresas[0]?.count || 0}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; font-size: 10px; font-weight: 800; text-align: center;">${c.status}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Categorias</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: white; margin: 0; position: relative; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; position: relative; z-index: 10; }
            .logo { height: 60px; margin-bottom: 15px; filter: grayscale(100%) brightness(0); }
            .operator-info { font-size: 11px; font-weight: bold; color: #64748b; margin-top: 5px; }
            h1 { text-transform: uppercase; font-size: 20px; font-weight: 900; letter-spacing: 1px; color: #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; position: relative; z-index: 10; }
            th { text-align: left; background: #f8fafc; padding: 12px; font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #000; border-bottom: 2px solid #000; }
            .footer { font-size: 9px; margin-top: 60px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; }
            .watermark-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; pointer-events: none; display: flex; flex-direction: column; justify-content: space-around; align-items: center; overflow: hidden; }
            .watermark-text { font-size: 40px; color: rgba(0, 0, 0, 0.015); font-weight: 900; text-transform: uppercase; transform: rotate(-45deg); white-space: nowrap; user-select: none; }
          </style>
        </head>
        <body>
          <div class="watermark-container">
            <div class="watermark-text">${currentUserName} - ${formattedDate} ${formattedTime}</div>
          </div>
          <div class="header">
            <img src="${config['sistema.logo_navbar']}" class="logo" />
            <h1>Relatório de Categorias</h1>
            <p class="operator-info">Gerado por: ${currentUserName} (${currentUserType}) em ${formattedDate} às ${formattedTime}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: center;">Ícone</th>
                <th>Nome</th>
                <th style="text-align: center;">Empresas</th>
                <th style="text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="footer">
            <p>Termo de Responsabilidade: É de total responsabilidade do emissor o não compartilhamento dos dados sensíveis.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

    

  return (
    <>
      {/* MODAL DE IA */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsAiModalOpen(false)}>
          <div className="relative p-[2px] group rounded-3xl overflow-hidden shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 bg-[conic-gradient(from_var(--shimmer-angle),#fbbf24,#ec4899,#3b82f6,#fbbf24)] animate-[shimmer_4s_linear_infinite]" />
            <div className="relative bg-slate-900 text-white rounded-[22px] p-8 space-y-6">
              <div className="text-center">
                <Sparkles size={32} className="mx-auto mb-4 text-yellow-400 animate-sparkle" />
                <h3 className="text-lg font-black uppercase tracking-wider text-white">Criação Rápida com IA</h3>
                <p className="text-xs font-bold text-slate-400 mt-1">Me diga o nome da categoria e eu crio o resto para você.</p>
              </div>

              {!aiGeneratedData ? (
                <div className='space-y-4'>
                  <input
                    type="text"
                    value={aiCategoryName}
                    onChange={(e) => setAiCategoryName(e.target.value)}
                    placeholder="Ex: Restaurantes, Academias..."
                    className="w-full p-4 rounded-xl border-2 bg-slate-800 border-slate-700 text-white font-bold text-sm text-center"
                    disabled={isAiLoading}
                  />
                  <button 
                    onClick={handleAiGenerate} 
                    disabled={isAiLoading}
                    className="w-full px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest bg-white text-slate-900 shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {isAiLoading ? 'Gerando...' : 'Gerar Detalhes'}
                  </button>
                </div>
              ) : (
                <div className='text-center space-y-4 p-4 bg-slate-800 rounded-xl'>
                   <p className='font-bold text-green-400'>Estamos prontos!</p>
                   <p className='text-sm text-slate-300'>Gerei uma descrição, cor e ícone para \"{aiCategoryName}\".</p>
                   <button onClick={handleViewAiResult} className='w-full px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest bg-green-500 text-white shadow-lg hover:scale-105 transition-all'>
                     Ver como ficou
                   </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO/CRIAÇÃO */}

      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-[101] flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsPreviewModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black uppercase tracking-wider mb-4" style={{color: primaryColor}}>Pré-visualização</h3>
            <div className="w-40 h-40 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: hexToRgba(categoryForm.cor_hexadecimal, 0.1) }}>
              <div className="w-24 h-24" style={{ color: categoryForm.cor_hexadecimal }} dangerouslySetInnerHTML={{ __html: categoryForm.icone_url }} />
            </div>
            <h4 className="mt-6 font-black text-2xl uppercase">{categoryForm.nome}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{categoryForm.descricao}</p>
            <button onClick={() => setIsPreviewModalOpen(false)} className="mt-8 w-full px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
              Fechar
            </button>
          </div>
        </div>
      )}

      {(viewMode === 'EDIT' || viewMode === 'CREATE') && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewMode('LIST')}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div style={{ backgroundColor: primaryColor }} className="w-12 h-12 text-white rounded-lg flex items-center justify-center">
                  <Layers size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider" style={{color: primaryColor}}>{viewMode === 'CREATE' ? 'Nova Categoria' : 'Editar Categoria'}</h3>
                  <p className="text-xs font-bold text-slate-400">Preencha os dados abaixo para continuar</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsPreviewModalOpen(true)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Eye size={20} />
                </button>
                <button onClick={() => setViewMode('LIST')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-8 flex-1 overflow-y-auto space-y-6">
              {isAiGenerated && (
                <div className="p-4 mb-6 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800 flex items-center gap-3">
                  <AlertCircle size={20} />
                  <p className="text-xs font-bold">Estes dados foram gerados com IA. Verifique todas as informações antes de salvar.</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Nome</label>
                  <input
                    type="text"
                    value={categoryForm.nome}
                    onChange={(e) => setCategoryForm({ ...categoryForm, nome: e.target.value })}
                    className="w-full mt-2 p-3 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Cor</label>
                  <div className="relative mt-2 h-12">
                     <input
                      type="text"
                      value={categoryForm.cor_hexadecimal}
                      onChange={(e) => setCategoryForm({ ...categoryForm, cor_hexadecimal: e.target.value })}
                      className="w-full h-full px-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm text-center"
                    />
                    <input
                      type="color"
                      value={categoryForm.cor_hexadecimal}
                      onChange={(e) => setCategoryForm({ ...categoryForm, cor_hexadecimal: e.target.value })}
                      className="absolute inset-0 w-full h-full p-0 border-none rounded-xl cursor-pointer opacity-0"
                    />
                     <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg pointer-events-none border-2 border-white/20" style={{ backgroundColor: categoryForm.cor_hexadecimal }}/>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Descrição</label>
                <textarea
                  value={categoryForm.descricao}
                  onChange={(e) => setCategoryForm({ ...categoryForm, descricao: e.target.value })}
                  className="w-full mt-2 p-3 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm h-20"
                  placeholder="Descrição da categoria..." />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Opções</label>
                 <div className="mt-2 flex items-center gap-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 p-3">
                    <input 
                      type="checkbox" 
                      id="gastronomy-toggle" 
                      className="sr-only" 
                      checked={categoryForm.is_gastronomy}
                      onChange={(e) => setCategoryForm({ ...categoryForm, is_gastronomy: e.target.checked })}
                    />
                    <label 
                      htmlFor="gastronomy-toggle"
                      className={`w-5 h-5 rounded-md flex items-center justify-center cursor-pointer border-2 ${categoryForm.is_gastronomy ? 'border-transparent' : 'border-slate-300 dark:border-slate-600'}`}
                      style={{ backgroundColor: categoryForm.is_gastronomy ? primaryColor : 'transparent' }}
                    >
                      {categoryForm.is_gastronomy && <Check size={12} color={contrastText} />}
                    </label>
                    <label htmlFor="gastronomy-toggle" className="font-bold text-sm select-none cursor-pointer">É Gastronomia?</label>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Ícone (SVG)</label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <textarea
                    value={categoryForm.icone_url}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icone_url: e.target.value })}
                    className="w-full p-3 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-mono text-xs h-40"
                    placeholder="<svg>..." />
                  <div className="flex flex-col h-40">
                    <div className="relative">
                      <input
                        type="text"
                        value={iconQuery}
                        onChange={(e) => setIconQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleIconSearch()}
                        placeholder="Pesquisar ícone..."
                        className="w-full p-3 pl-4 pr-12 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm"
                      />
                      <button onClick={handleIconSearch} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                        <Search size={16} />
                      </button>
                    </div>
                    <p className='text-[10px] text-slate-400 font-bold mt-2 px-1'>Dica: Pesquise em inglês (ex: car, home).</p>
                    <div className="flex-1 mt-2 overflow-y-auto bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 border-2 dark:border-slate-700/50 space-y-2">
                      {isSearchingIcons ? (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-xs font-bold text-slate-400">Buscando...</p>
                        </div>
                      ) : iconResults.length > 0 ? (
                        <div className="grid grid-cols-5 gap-2">
                          {iconResults.map(icon => (
                            <div key={icon.name} onClick={() => handleIconSelect(icon)} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center aspect-square bg-slate-100 dark:bg-slate-700/50">
                              <img src={`https://api.iconify.design/${icon.prefix}/${icon.name}.svg?color=${theme === 'dark' ? 'white' : 'black'}`} className="w-8 h-8 object-contain" />
                            </div>
                          ))}
                        </div>
                      ) : (
                         <div className="flex items-center justify-center h-full">
                          <p className="text-xs font-bold text-slate-400">Nenhum resultado.</p>
                        </div>
                      )}
                      {iconSearchResponse && (
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Resposta da API (JSON):</label>
                          <pre className="mt-1 p-2 bg-slate-100 dark:bg-slate-900 rounded-md text-xs overflow-auto max-h-40">
                            {JSON.stringify(iconSearchResponse, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-b-3xl">
              <div>
                {viewMode === 'EDIT' && (
                  <div className="flex items-center gap-3">
                    <label htmlFor="status-toggle" className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Status</label>
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        id="status-toggle" 
                        className="sr-only" 
                        checked={categoryForm.status === 'ATIVO'}
                        onChange={() => handleStatusChange(categoryForm.status === 'ATIVO' ? 'INATIVO' : 'ATIVO')}
                      />
                      <label 
                        htmlFor="status-toggle"
                        className={`block w-12 h-6 rounded-full cursor-pointer transition-colors`}
                        style={{ backgroundColor: categoryForm.status === 'ATIVO' ? primaryColor : (theme === 'dark' ? '#334155' : '#e2e8f0') }}
                      >
                        <span 
                          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${categoryForm.status === 'ATIVO' ? 'translate-x-6' : 'translate-x-0'}`}>
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setViewMode('LIST')} className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Cancelar</button>
                <button onClick={handleSave} style={{ backgroundColor: primaryColor, color: contrastText }} className="px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                  <Save size={16}/> Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="animate-fade-in pb-10">
      <style>{`
        @property --shimmer-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
        @keyframes shimmer { from { --shimmer-angle: 0deg; } to { --shimmer-angle: 360deg; } }
        @keyframes sparkle-glow { 0%, 100% { filter: drop-shadow(0 0 2px #fff) brightness(1); } 50% { filter: drop-shadow(0 0 8px #fff) brightness(1.3); } }
        .animate-sparkle { animation: sparkle-glow 2s ease-in-out infinite; }
      `}</style>
      <Breadcrumb theme={theme} paths={[{ label: 'Configurações' }, { label: 'Categorias', active: true }]} />

      {toast && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-2 animate-bounce ${toast.type === 'success' ? 'bg-green-500 border-green-400 text-white' : 'bg-red-500 border-red-400 text-white'}`}>
           <Bell size={20} /> <span className="font-black text-sm uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-row justify-between items-center mb-10">
        <div className="flex items-center gap-6">
          <div style={{ backgroundColor: primaryColor }} className="w-16 h-16 text-white rounded-[1.25rem] shadow-2xl flex items-center justify-center transition-transform hover:scale-105">
             <Layers size={32} />
          </div>
          <div>
            <h2 className={`text-3xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Categorias</h2>
            <p className="font-bold text-[10px] uppercase tracking-widest mt-1 opacity-60" style={{ color: theme === 'dark' ? '#fff' : '#1e293b' }}>Organização de Parceiros</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint} 
            style={{'--primary-color': primaryColor, '--primary-color-light': hexToRgba(primaryColor, 0.1)} as React.CSSProperties}
            className="group w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 text-slate-400 hover:bg-[var(--primary-color-light)] hover:text-[var(--primary-color)] transition-all flex items-center justify-center shadow-lg border-2 border-slate-100 dark:border-slate-800">
            <Printer size={20}/>
          </button>
          <button 
            onClick={handleOpenCreate} 
            style={{ backgroundColor: primaryColor, color: contrastText }}
            className="w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center hover:scale-105 transition-all">
            <Plus size={20} />
          </button>
          <div onClick={() => setIsAiModalOpen(true)} className="relative p-[2px] group rounded-2xl overflow-hidden shadow-lg active:scale-95 transition-all cursor-pointer">
            <div className="absolute inset-0 bg-[conic-gradient(from_var(--shimmer-angle),#fbbf24,#ec4899,#3b82f6,#fbbf24)] animate-[shimmer_4s_linear_infinite]" />
            <button className="relative w-14 h-14 bg-zinc-950 text-white rounded-[15px] border border-white/10 flex items-center justify-center">
              <div className="absolute inset-0 bg-white/10 rounded-xl blur-2xl animate-pulse" />
              <Sparkles size={20} className="relative z-10 animate-sparkle" />
            </button>
          </div>
        </div>
      </div>

      {/* TEXTO AUXILIAR E BARRA DE PESQUISA */}
      <div className="mb-10 p-8 rounded-[2rem] border transition-all flex flex-col md:flex-row items-start md:items-center gap-6" 
           style={{ backgroundColor: hexToRgba(primaryColor, 0.05), borderColor: hexToRgba(primaryColor, 0.1) }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
          <AlertCircle size={28} className="animate-pulse" />
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="font-black uppercase text-xs tracking-[0.2em]" style={{ color: primaryColor }}>Gestão de Categorias</h4>
          <p className="text-sm font-bold leading-relaxed opacity-90" style={{ color: theme === 'dark' ? '#fff' : '#1e293b' }}>
            Gerencie as categorias para organizar seus parceiros e benefícios. Ícones e cores ajudam na identificação visual no aplicativo.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome da categoria..." 
            className="w-full pl-16 pr-6 py-5 rounded-[2.5rem] border-2 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white outline-none focus:border-opacity-100 font-bold shadow-sm transition-all"
            style={{ borderColor: hexToRgba(primaryColor, 0.1) }}
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
          />
        </div>
        <div className="relative">
          <button 
            onClick={() => setIsFilterPopupOpen(!isFilterPopupOpen)}
            className="p-5 rounded-full border-2 bg-white dark:bg-slate-900 shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 relative"
            style={{ borderColor: hexToRgba(primaryColor, 0.1) }}
          >
            <Filter size={24} className="text-slate-300" />
          </button>
          {isFilterPopupOpen && (
            <div ref={filterPopupRef} className="absolute top-full right-0 mt-2 z-50 w-64 bg-white dark:bg-slate-900 shadow-2xl rounded-3xl border dark:border-slate-800 p-4 space-y-2">
              {/* Accordion de Ordenação */}
              <div>
                <button onClick={() => setIsSortOpen(!isSortOpen)} className="w-full flex justify-between items-center py-2">
                  <span className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Ordenar Por</span>
                  <ChevronDown size={16} className={`transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                </button>
                {isSortOpen && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {renderSortButton('Nome: A-Z', 'nome', 'asc')}
                    {renderSortButton('Nome: Z-A', 'nome', 'desc')}
                    {renderSortButton('Empresas: Menor > Maior', 'empresas_count', 'asc')}
                    {renderSortButton('Empresas: Maior > Menor', 'empresas_count', 'desc')}
                    {renderSortButton('Criação: Mais Antigos', 'id', 'asc')}
                    {renderSortButton('Criação: Mais Recentes', 'id', 'desc')}
                  </div>
                )}
              </div>

              {/* Accordion de Status */}
              <div>
                <button onClick={() => setIsStatusOpen(!isStatusOpen)} className="w-full flex justify-between items-center py-2">
                  <span className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Status da Categoria</span>
                  <ChevronDown size={16} className={`transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
                </button>
                {isStatusOpen && (
                  <div className="flex flex-col gap-2 pt-2">
                    {renderStatusButton('ATIVO')}
                    {renderStatusButton('INATIVO')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TABELA */}
      <div className={`overflow-hidden rounded-[2.5rem] border shadow-2xl ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100'}`}>
          <div>
          <table className="w-full text-left table-fixed">
            <thead className="text-[10px] font-black uppercase bg-slate-50 dark:bg-slate-800/50 text-slate-500 sticky top-0">
              <tr>
                <th className="w-24 px-6 py-6 border-b border-slate-100 dark:border-slate-800 text-center">Ícone</th>
                <th className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 w-2/5">Nome da Categoria</th>
                <th className="px-6 py-6 text-center border-b border-slate-100 dark:border-slate-800 w-32">Empresas</th>
                <th className="px-6 py-6 text-center border-b border-slate-100 dark:border-slate-800 w-28">Status</th>
                <th className="px-6 py-6 text-center w-20 border-b border-slate-100 dark:border-slate-800">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800/50">
              {paginatedData?.length > 0 ? paginatedData.map((c) => (
                <tr key={c.id} className="transition-colors group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-5 align-middle">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto" 
                      style={{ 
                        backgroundColor: hexToRgba(c.cor_hexadecimal, 0.1), 
                        color: c.cor_hexadecimal 
                      }}
                    >
                      <div className="w-full h-full flex items-center justify-center scale-75" dangerouslySetInnerHTML={{ __html: c.icone_url }} />
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <p className={`font-black text-sm uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{c.nome}</p>
                    <p className="text-[13px] text-slate-400 font-bold tracking-tight truncate">{c.descricao}</p>
                  </td>
                  <td className="px-6 py-5 text-center align-middle">
                    <span className="text-[10px] font-black uppercase px-3 py-1 rounded-lg border bg-slate-50 border-slate-100 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">{c.empresas[0]?.count || 0}</span>
                  </td>
                  <td className="px-6 py-5 text-center align-middle">
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg border ${c.status === 'ATIVO' ? 'border-green-100 text-green-600 bg-green-50' : 'border-red-100 text-red-600 bg-red-50'}`}>{c.status}</span>
                  </td>
                  <td className="px-6 py-5 text-center align-middle">
                    <button onClick={() => handleEdit(c)} style={{'--primary-color': primaryColor} as React.CSSProperties} className="p-2 rounded-xl bg-transparent text-slate-400 hover:text-[var(--primary-color)] transition-all"><Edit3 size={16}/></button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-6 py-24 text-center opacity-20"><Search size={64} className="mx-auto mb-4" /><p className="font-black uppercase tracking-[0.4em] text-sm">Nenhuma categoria encontrada</p></td></tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50/50 dark:bg-slate-800/30">
              <tr>
                <td colSpan={5} className="px-6 py-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-6">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Exibindo <span className="text-slate-600 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filtered.length)}</span> de <span className="text-slate-600 dark:text-white">{filtered.length}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Itens por página</span>
                        <select
                          value={rowsPerPage}
                          onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                          className="bg-transparent text-[10px] font-black text-slate-500 uppercase outline-none cursor-pointer hover:text-primary transition-colors"
                          style={{ color: '#64748b' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                          <option value={filtered.length}>Mostrar Tudo</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="p-2 text-slate-400 disabled:opacity-20 hover:text-primary transition-all"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        const active = page === currentPage;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${active ? 'shadow-md scale-110' : 'text-slate-400 hover:bg-slate-50'}`}
                            style={active ? { backgroundColor: primaryColor, color: contrastText } : {}}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="p-2 text-slate-400 disabled:opacity-20 hover:text-primary transition-all"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
    </>
  );
};
