import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Search, X, Bell, Filter, Printer, ChevronLeft, ChevronRight, Layers, AlertCircle, Edit3, Trash2, Save, ToggleLeft, ToggleRight, Check, Bot, Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Breadcrumb } from './Breadcrumb';
import { useConfig } from '../contexts/ConfigContext';

// Props do Componente
interface BannersProps {
  theme: string;
  user: any;
  onAuditLog: (acao: string, tabela: string, desc: string, dados_antigos?: string, dados_novos?: string, entidade_id?: number, entidade_tipo?: string) => void;
}

// Funções Utilitárias de Cor
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

// Componente Principal
export const Banners: React.FC<BannersProps> = ({ theme, user, onAuditLog }) => {
  // Hooks de Estado e Contexto
  const { config } = useConfig();
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'LIST' | 'EDIT' | 'CREATE'>('LIST');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const filterPopupRef = useRef<HTMLDivElement>(null);

  // Cores Dinâmicas
  const primaryColor = config['sistema.cor_primaria'] || '#1e293b';
  const contrastText = getContrastColor(primaryColor);

  // Efeitos
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterPopupRef.current && !filterPopupRef.current.contains(event.target as Node)) {
        setIsFilterPopupOpen(false);
      }
    }
    if (isFilterPopupOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterPopupOpen]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      setListData(data || []);
    } catch (err: any) {
      showToast('Erro ao carregar banners: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Estado do Formulário
  const [bannerForm, setBannerForm] = useState<any>({
    id: null,
    titulo: '',
    subtitulo: '',
    link_externo: '',
    imagem_fundo_url: '',
    ativo: true,
    ordem: 0,
  });

  const filtered = useMemo(() => {
    return listData.filter(i => {
      const searchStr = `${i.titulo} ${i.subtitulo}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    });
  }, [listData, searchTerm]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

  const handleEdit = (b: any) => {
    setBannerForm(b);
    setViewMode('EDIT');
  };

  const handleOpenCreate = () => {
    setBannerForm({
      id: null,
      titulo: '',
      subtitulo: '',
      link_externo: '',
      imagem_fundo_url: '',
      ativo: true,
      ordem: listData.length + 1,
    });
    setViewMode('CREATE');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { id, ...payload } = bannerForm;

      if (viewMode === 'EDIT') {
        const { error } = await supabase.from('banners').update(payload).eq('id', id);
        if (error) throw error;
        onAuditLog('UPDATE', 'BANNERS', `Atualizou banner ${payload.titulo}`, JSON.stringify(listData.find(b => b.id === id)), JSON.stringify(bannerForm), id, 'BANNER');
      } else { // CREATE
        const { error } = await supabase.from('banners').insert([payload]).select();
        if (error) throw error;
        onAuditLog('INSERT', 'BANNERS', `Criou banner ${payload.titulo}`, undefined, JSON.stringify(bannerForm));
      }
      
      showToast('Banner salvo com sucesso!', 'success');
      setViewMode('LIST');
      fetchData();
    } catch (err: any) {
      showToast('Erro ao salvar banner: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    showToast('Funcionalidade de excluir em implementação.', 'error');
  };

  const handlePrint = () => {
    // Lógica de impressão adaptada para banners
  };

  return (
    <>
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 z-[200] flex items-center justify-center animate-fade-in">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-sm font-bold text-slate-500 dark:text-slate-400">Carregando dados...</p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
         <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-2 animate-bounce ${toast.type === 'success' ? 'bg-green-500 border-green-400 text-white' : 'bg-red-500 border-red-400 text-white'}`}>
           <Bell size={20} /> <span className="font-black text-sm uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      {/* MODAL DE EDIÇÃO/CRIAÇÃO */}
      {(viewMode === 'EDIT' || viewMode === 'CREATE') && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewMode('LIST')}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider" style={{color: primaryColor}}>{viewMode === 'CREATE' ? 'Novo Banner' : 'Editar Banner'}</h3>
                <p className="text-xs font-bold text-slate-400">Preencha os dados abaixo para continuar</p>
              </div>
              <button onClick={() => setViewMode('LIST')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 flex-1 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Título</label>
                  <input
                    type="text"
                    value={bannerForm.titulo}
                    onChange={(e) => setBannerForm({ ...bannerForm, titulo: e.target.value })}
                    className="w-full mt-2 p-3 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Subtítulo</label>
                  <input
                    type="text"
                    value={bannerForm.subtitulo}
                    onChange={(e) => setBannerForm({ ...bannerForm, subtitulo: e.target.value })}
                    className="w-full mt-2 p-3 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">URL da Imagem de Fundo</label>
                  <input
                    type="text"
                    value={bannerForm.imagem_fundo_url}
                    onChange={(e) => setBannerForm({ ...bannerForm, imagem_fundo_url: e.target.value })}
                    className="w-full mt-2 p-3 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Link Externo (Opcional)</label>
                  <input
                    type="text"
                    value={bannerForm.link_externo}
                    onChange={(e) => setBannerForm({ ...bannerForm, link_externo: e.target.value })}
                    className="w-full mt-2 p-3 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Ordem</label>
                  <input
                    type="number"
                    value={bannerForm.ordem}
                    onChange={(e) => setBannerForm({ ...bannerForm, ordem: parseInt(e.target.value) })}
                    className="w-full mt-2 p-3 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Status</label>
                  <button onClick={() => setBannerForm({ ...bannerForm, ativo: !bannerForm.ativo })} className={`w-full mt-2 p-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${bannerForm.ativo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {bannerForm.ativo ? <ToggleRight size={20}/> : <ToggleLeft size={20} />}
                    {bannerForm.ativo ? 'ATIVO' : 'INATIVO'}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-b-3xl">
              <button onClick={() => handleDelete(bannerForm.id)} className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                <Trash2 size={16} className="inline mr-2"/> Excluir
              </button>
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

      {/* Main Content */}
      <div className="animate-fade-in pb-10">
        <Breadcrumb theme={theme} paths={[{ label: 'Marketing' }, { label: 'Banners', active: true }]} />

        <div className="mt-10">
          {/* Page Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-6">
              <div style={{ backgroundColor: primaryColor }} className="w-16 h-16 text-white rounded-[1.25rem] shadow-2xl flex items-center justify-center transition-transform hover:scale-105">
                <ImageIcon size={32} />
              </div>
              <div>
                <h1 className={`text-3xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Banners
                </h1>
                <p className={`font-bold text-[10px] uppercase tracking-widest mt-1 opacity-60 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  Gerenciar os banners de destaque do aplicativo.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <button style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }} className="w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-105 transition-all shadow-sm">
                <Bot size={20}/>
              </button>
              <button onClick={handlePrint} className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm">
                <Printer size={20}/>
              </button>
              <button onClick={handleOpenCreate} style={{ backgroundColor: primaryColor, color: contrastText }} className="w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 transition-all">
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Auxiliary Text Card */}
          <div className="mt-8 mb-10 p-8 rounded-[2rem] border" style={{ backgroundColor: hexToRgba(primaryColor, 0.05), borderColor: hexToRgba(primaryColor, 0.1) }}>
            <div className="flex items-center gap-6">
              <AlertCircle size={40} style={{ color: primaryColor }} className="flex-shrink-0" />
              <p className={`text-xs font-bold leading-relaxed ${theme === 'dark' ? 'text-white/80' : 'text-slate-900/80'}`}>
                Banners são a principal forma de comunicação visual na tela inicial do aplicativo. Use imagens de alta qualidade e textos concisos para atrair a atenção do usuário.
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={20} />
              <input 
                type="text" 
                placeholder="Pesquisar por título..." 
                className="w-full pl-16 pr-6 py-5 rounded-full border-2 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white outline-none focus:border-opacity-100 font-bold shadow-sm transition-all"
                style={{ borderColor: hexToRgba(primaryColor, 0.2) }}
                value={searchTerm} 
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
              />
            </div>
            <div className="relative">
              <button onClick={() => setIsFilterPopupOpen(!isFilterPopupOpen)} className="p-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm">
                <Filter size={20}/>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className={`overflow-hidden rounded-[2rem] border shadow-2xl ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800 text-white' : 'bg-white border-slate-100'} flex flex-col`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black uppercase bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 sticky top-0">
                  <tr>
                    <th className="px-6 py-6 border-b border-slate-100 dark:border-slate-800">Título</th>
                    <th className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 text-center">Status</th>
                    <th className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 text-right w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedData?.length > 0 ? paginatedData.map((b) => (
                    <tr key={b.id} className="transition-colors group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-5 flex items-center gap-4">
                        <img src={b.imagem_fundo_url || 'https://via.placeholder.com/150'} alt={b.titulo} className="w-24 h-12 object-cover rounded-lg" />
                        <div>
                          <p className={`font-black text-sm uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{b.titulo}</p>
                          <p className="text-[10px] text-slate-400 font-bold tracking-tight truncate">{b.subtitulo}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${b.ativo ? 'border-green-200 text-green-600 bg-green-50 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400' : 'border-red-200 text-red-600 bg-red-50 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'}`}>{b.ativo ? 'ATIVO' : 'INATIVO'}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button onClick={() => handleEdit(b)} className="p-3 rounded-xl transition-all text-slate-400 hover:text-yellow-500 dark:hover:text-yellow-400"><Edit3 size={16} /></button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center justify-center opacity-30">
                        <Search size={64} className="mx-auto mb-4" />
                        <p className="font-black uppercase tracking-[0.4em] text-sm">Nenhum banner encontrado</p>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="px-6 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Itens por página:</span>
                  <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))} className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm text-xs font-bold focus:outline-none" style={{'--tw-ring-color': primaryColor} as React.CSSProperties}>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Exibindo <span className="text-slate-600 dark:text-white">{(currentPage-1)*rowsPerPage+1}-{Math.min(currentPage*rowsPerPage, filtered.length)}</span> de <span className="text-slate-600 dark:text-white">{filtered.length}</span>
                </p>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 text-slate-400 disabled:opacity-20 hover:text-primary transition-all">
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${page === currentPage ? 'shadow-md scale-110' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                      style={page === currentPage ? { backgroundColor: primaryColor, color: contrastText } : {}}
                    >
                      {page}
                    </button>
                  ))}
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 text-slate-400 disabled:opacity-20 hover:text-primary transition-all">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
