import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import { Bot, Printer } from 'lucide-react';
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
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const primaryColor = config['sistema.cor_primaria'] || '#1e293b';
  const contrastText = getContrastColor(primaryColor);

  const [categoryForm, setCategoryForm] = useState({
    id: null, 
    nome: '', 
    descricao: '', 
    icone_url: 'Layers', 
    cor_hexadecimal: '#000000', 
    ordem: 0,
    is_gastronomy: false,
    status: 'ATIVO'
  });

  useEffect(() => {
    fetchData();
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
    return listData.filter(i => {
      const searchStr = `${i.nome} ${i.descricao}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    });
  }, [listData, searchTerm]);

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
      icone_url: 'Layers', 
      cor_hexadecimal: '#000000', 
      ordem: listData.length + 1,
      is_gastronomy: false,
      status: 'ATIVO'
    });
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
            .logo { height: 60px; margin-bottom: 15px; }
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
      {/* MODAL DE EDIÇÃO/CRIAÇÃO */}
      {(viewMode === 'EDIT' || viewMode === 'CREATE') && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewMode('LIST')}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider" style={{color: primaryColor}}>{viewMode === 'CREATE' ? 'Nova Categoria' : 'Editar Categoria'}</h3>
                <p className="text-xs font-bold text-slate-400">Preencha os dados abaixo para continuar</p>
              </div>
              <button onClick={() => setViewMode('LIST')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <LucideIcons.X size={20} />
              </button>
            </div>
            <div className="p-8 flex-1 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Nome</label>
                  <input
                    type="text"
                    value={categoryForm.nome}
                    onChange={(e) => setCategoryForm({ ...categoryForm, nome: e.target.value })}
                    className="w-full mt-2 p-3 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Ícone (SVG)</label>
                  <textarea
                    value={categoryForm.icone_url}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icone_url: e.target.value })}
                    className="w-full mt-2 p-3 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-mono text-xs h-24"
                    placeholder='<svg>...' />
                </div>
                <div className="md:col-span-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Cor (Hex)</label>
                  <div className="relative mt-2">
                    <input
                      type="text"
                      value={categoryForm.cor_hexadecimal}
                      onChange={(e) => setCategoryForm({ ...categoryForm, cor_hexadecimal: e.target.value })}
                      className="w-full p-3 pl-12 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm"
                    />
                    <input
                      type="color"
                      value={categoryForm.cor_hexadecimal}
                      onChange={(e) => setCategoryForm({ ...categoryForm, cor_hexadecimal: e.target.value })}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 p-0 border-none rounded-lg cursor-pointer bg-transparent"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Descrição</label>
                <textarea
                  value={categoryForm.descricao}
                  onChange={(e) => setCategoryForm({ ...categoryForm, descricao: e.target.value })}
                  className="w-full mt-2 p-3 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm h-24"
                  placeholder="Descrição da categoria..." />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-b-3xl">
              <button onClick={() => handleDelete(categoryForm.id)} className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                <LucideIcons.Trash2 size={16} className="inline mr-2"/> Excluir
              </button>
              <div className="flex items-center gap-3">
                <button onClick={() => setViewMode('LIST')} className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Cancelar</button>
                <button onClick={handleSave} style={{ backgroundColor: primaryColor, color: contrastText }} className="px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                  <LucideIcons.Save size={16}/> Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="animate-fade-in pb-10 h-full flex flex-col">
      <Breadcrumb theme={theme} paths={[{ label: 'Configurações' }, { label: 'Categorias', active: true }]} />

      {toast && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-2 animate-bounce ${toast.type === 'success' ? 'bg-green-500 border-green-400 text-white' : 'bg-red-500 border-red-400 text-white'}`}>
           <LucideIcons.Bell size={20} /> <span className="font-black text-sm uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-row justify-between items-start mb-8">
        <div className="flex items-center gap-6">
          <div style={{ backgroundColor: primaryColor }} className="w-16 h-16 text-white rounded-[1.25rem] shadow-2xl flex items-center justify-center transition-transform hover:scale-105">
             <LucideIcons.Layers size={32} />
          </div>
          <div>
            <h2 className={`text-3xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Categorias</h2>
            <p className="font-bold text-[10px] uppercase tracking-widest mt-1 opacity-60" style={{ color: theme === 'dark' ? '#fff' : '#1e293b' }}>Organização de Parceiros</p>
            <div className="mt-4 p-4 rounded-2xl border flex items-center gap-4" style={{ backgroundColor: hexToRgba(primaryColor, 0.05), borderColor: hexToRgba(primaryColor, 0.1) }}>
              <LucideIcons.AlertCircle size={24} style={{ color: primaryColor }} className="flex-shrink-0" />
              <p className="text-xs font-bold leading-relaxed opacity-80" style={{ color: theme === 'dark' ? '#fff' : '#1e293b' }}>
                Gerencie as categorias para organizar seus parceiros e benefícios. Ícones e cores ajudam na identificação visual no aplicativo.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }} className="w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-105 transition-all">
            <LucideIcons.Bot size={20}/>
          </button>
          <button onClick={handlePrint} className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
            <LucideIcons.Printer size={20}/>
          </button>
          <button onClick={handleOpenCreate} style={{ backgroundColor: primaryColor, color: contrastText }} className="w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 transition-all">
            <LucideIcons.Plus size={20} />
          </button>
        </div>
      </div>

      {/* BARRA DE PESQUISA */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1">
          <LucideIcons.Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome da categoria..." 
            className="w-full pl-16 pr-6 py-5 rounded-full border-2 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white outline-none focus:border-opacity-100 font-bold shadow-sm transition-all"
            style={{ borderColor: hexToRgba(primaryColor, 0.1) }}
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
          />
        </div>
        <button className="p-5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
          <LucideIcons.Filter size={20}/>
        </button>
      </div>

      {/* TABELA */}
      <div className={`flex-1 overflow-hidden rounded-[2.5rem] border shadow-2xl ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100'} flex flex-col`}>
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left table-fixed">
            <thead className="text-[10px] font-black uppercase bg-slate-50 dark:bg-slate-800/50 text-slate-500 sticky top-0">
              <tr>
                <th className="w-24 px-6 py-6 border-b border-slate-100 dark:border-slate-800 text-center">Ícone</th>
                <th className="px-6 py-6 w-1/3 border-b border-slate-100 dark:border-slate-800">Nome da Categoria</th>
                <th className="px-6 py-6 text-center border-b border-slate-100 dark:border-slate-800">Empresas</th>
                <th className="px-6 py-6 text-center border-b border-slate-100 dark:border-slate-800">Status</th>
                <th className="px-6 py-6 text-right w-24 border-b border-slate-100 dark:border-slate-800">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedData?.length > 0 ? paginatedData.map((c) => (
                <tr key={c.id} className="transition-colors group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-5 text-center">
                    <div 
                      className="w-10 h-10 rounded-lg inline-flex items-center justify-center" 
                      style={{ 
                        backgroundColor: hexToRgba(c.cor_hexadecimal, 0.1), 
                        color: c.cor_hexadecimal 
                      }}
                    >
                      <div className="w-5 h-5" dangerouslySetInnerHTML={{ __html: c.icone_url }} />
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className={`font-black text-sm uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{c.nome}</p>
                    <p className="text-[10px] text-slate-400 font-bold tracking-tight truncate">{c.descricao}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-sm font-black text-slate-600 dark:text-white">{c.empresas[0]?.count || 0}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg border ${c.status === 'ATIVO' ? 'border-green-100 text-green-600 bg-green-50' : 'border-red-100 text-red-600 bg-red-50'}`}>{c.status}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button onClick={() => handleEdit(c)} className="p-3 rounded-xl transition-all text-slate-400 hover:text-yellow-500"><LucideIcons.Edit3 size={20} /></button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-6 py-24 text-center opacity-20"><LucideIcons.Search size={64} className="mx-auto mb-4" /><p className="font-black uppercase tracking-[0.4em] text-sm">Nenhuma categoria encontrada</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* PAGINAÇÃO */}
        <div className="px-6 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Itens por página:</span>
              <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))} className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm text-xs font-bold">
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
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 text-slate-400 disabled:opacity-20 hover:text-primary transition-all">
                <LucideIcons.ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${page === currentPage ? 'shadow-md scale-110' : 'text-slate-400 hover:bg-slate-50'}`}
                  style={page === currentPage ? { backgroundColor: primaryColor, color: contrastText } : {}}
                >
                  {page}
                </button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 text-slate-400 disabled:opacity-20 hover:text-primary transition-all">
                <LucideIcons.ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
