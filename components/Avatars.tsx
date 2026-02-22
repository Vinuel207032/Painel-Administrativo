import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, X, Edit3, Bell, ChevronLeft, ChevronRight, UserCircle, AlertCircle, Bot, Printer, Filter, Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Breadcrumb } from './Breadcrumb';
import { useConfig } from '../contexts/ConfigContext';

interface AvatarsProps {
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

export const Avatars: React.FC<AvatarsProps> = ({ 
  theme, user, onAuditLog 
}) => {
  const { config } = useConfig();
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'EDIT' | 'CREATE'>('LIST');
  const [avatarForm, setAvatarForm] = useState<any>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const primaryColor = config['sistema.cor_primaria'] || '#1e293b';
  const contrastText = getContrastColor(primaryColor);

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
      const { data, error } = await supabase.from('avatars').select('*').order('ordem', { ascending: true });
      if (error) throw error;
      setListData(data || []);
    } catch (err: any) {
      showToast('Erro ao carregar avatares: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return listData.filter(i => {
      const searchStr = `${i.nome}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    });
  }, [listData, searchTerm]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

  const handleEdit = (a: any) => {
    setAvatarForm(a);
    setViewMode('EDIT');
  };

  const handleOpenCreate = () => {
    setAvatarForm({
      id: null,
      nome: '',
      url_imagem: null,
      ordem: listData.length + 1,
      ativo: true,
    });
    setViewMode('CREATE');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { id, ...payload } = avatarForm;
      if (viewMode === 'EDIT') {
        const { error } = await supabase.from('avatars').update(payload).eq('id', id);
        if (error) throw error;
        onAuditLog('UPDATE', 'AVATARS', `Atualizou avatar ${payload.nome}`, JSON.stringify(listData.find(a => a.id === id)), JSON.stringify(avatarForm), id, 'AVATAR');
      } else {
        const { error } = await supabase.from('avatars').insert([payload]).select();
        if (error) throw error;
        onAuditLog('INSERT', 'AVATARS', `Criou avatar ${payload.nome}`, undefined, JSON.stringify(avatarForm));
      }
      showToast('Avatar salvo com sucesso!', 'success');
      setViewMode('LIST');
      fetchData();
    } catch (err: any) {
      showToast('Erro ao salvar avatar: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este avatar?')) return;
    try {
      const { error } = await supabase.from('avatars').delete().eq('id', id);
      if (error) throw error;
      onAuditLog('DELETE', 'AVATARS', `Excluiu avatar ID ${id}`, JSON.stringify(listData.find(a => a.id === id)), undefined, id, 'AVATAR');
      showToast('Avatar excluído com sucesso!', 'success');
      setViewMode('LIST');
      fetchData();
    } catch (err: any) {
      showToast('Erro ao excluir avatar: ' + err.message, 'error');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(`avatars/${fileName}`, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(`avatars/${fileName}`);
      setAvatarForm({ ...avatarForm, url_imagem: publicUrl });
      showToast('Imagem enviada com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro no upload da imagem: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentUserName = user?.nome || 'Operador do Sistema';
    const currentUserType = (user?.perfil || user?.tipo_usuario || 'USUÁRIO').toUpperCase();
    const now = new Date();
    const formattedDate = now.toLocaleDateString();
    const formattedTime = now.toLocaleTimeString();

    const rows = filtered.map(a => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
          <img src="${a.url_imagem}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; font-size: 11px; text-transform: uppercase;">${a.nome}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; font-size: 10px; text-align: center;">${a.ordem}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; font-size: 10px; font-weight: 800; text-align: center;">${a.ativo ? 'ATIVO' : 'INATIVO'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Avatares</title>
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
            <h1>Relatório de Avatares</h1>
            <p class="operator-info">Gerado por: ${currentUserName} (${currentUserType}) em ${formattedDate} às ${formattedTime}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: center;">Preview</th>
                <th>Nome</th>
                <th style="text-align: center;">Ordem</th>
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
      {(viewMode === 'CREATE' || viewMode === 'EDIT') && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewMode('LIST')}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider" style={{color: primaryColor}}>{viewMode === 'CREATE' ? 'Novo Avatar' : 'Editar Avatar'}</h3>
                <p className="text-xs font-bold text-slate-400">Anexe a imagem e defina um nome</p>
              </div>
              <button onClick={() => setViewMode('LIST')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 flex-1 overflow-y-auto space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div 
                  className="w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center text-center relative overflow-hidden cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <div className="text-xs font-bold text-slate-500">Enviando...</div>
                  ) : avatarForm.url_imagem ? (
                    <img src={avatarForm.url_imagem} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-xs font-bold text-slate-400 p-2">
                      <ImageIcon size={24} className="mx-auto mb-1 opacity-50"/>
                      Enviar
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Nome do Avatar</label>
                <input type="text" value={avatarForm.nome || ''} onChange={e => setAvatarForm({...avatarForm, nome: e.target.value})} className="w-full mt-2 p-3 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-sm" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-b-3xl">
              <button onClick={() => handleDelete(avatarForm.id)} className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                <Plus size={16} className="inline mr-2 rotate-45"/> Excluir
              </button>
              <div className="flex items-center gap-3">
                <button onClick={() => setViewMode('LIST')} className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Cancelar</button>
                <button onClick={handleSave} style={{ backgroundColor: primaryColor, color: contrastText }} className="px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                  <Plus size={16}/> Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="animate-fade-in pb-10 h-full flex flex-col">
      <Breadcrumb theme={theme} paths={[{ label: 'Configurações' }, { label: 'Avatares', active: true }]} />

      {toast && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-2 animate-bounce ${toast.type === 'success' ? 'bg-green-500 border-green-400 text-white' : 'bg-red-500 border-red-400 text-white'}`}>
           <Bell size={20} /> <span className="font-black text-sm uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-row justify-between items-start mb-8">
        <div className="flex items-center gap-6">
          <div style={{ backgroundColor: primaryColor }} className="w-16 h-16 text-white rounded-[1.25rem] shadow-2xl flex items-center justify-center transition-transform hover:scale-105">
             <UserCircle size={32} />
          </div>
          <div>
            <h2 className={`text-3xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Avatares</h2>
            <p className="font-bold text-[10px] uppercase tracking-widest mt-1 opacity-60" style={{ color: theme === 'dark' ? '#fff' : '#1e293b' }}>Perfis de Usuário</p>
            <div className="mt-4 p-4 rounded-2xl border flex items-center gap-4" style={{ backgroundColor: hexToRgba(primaryColor, 0.05), borderColor: hexToRgba(primaryColor, 0.1) }}>
              <AlertCircle size={24} style={{ color: primaryColor }} className="flex-shrink-0" />
              <p className="text-xs font-bold leading-relaxed opacity-80" style={{ color: theme === 'dark' ? '#fff' : '#1e293b' }}>
                Gerencie os avatares que os usuários podem escolher para personalizar seus perfis. Adicione novas opções ou desative as existentes.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }} className="w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-105 transition-all">
            <Bot size={20}/>
          </button>
          <button onClick={handlePrint} className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
            <Printer size={20}/>
          </button>
          <button onClick={handleOpenCreate} style={{ backgroundColor: primaryColor, color: contrastText }} className="w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 transition-all">
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* BARRA DE PESQUISA */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome do avatar..." 
            className="w-full pl-16 pr-6 py-5 rounded-full border-2 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white outline-none focus:border-opacity-100 font-bold shadow-sm transition-all"
            style={{ borderColor: hexToRgba(primaryColor, 0.1) }}
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
          />
        </div>
        <button className="p-5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
          <Filter size={20}/>
        </button>
      </div>

      {/* TABELA */}
      <div className={`flex-1 overflow-hidden rounded-[2.5rem] border shadow-2xl ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100'} flex flex-col`}>
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left table-fixed">
            <thead className="text-[10px] font-black uppercase bg-slate-50 dark:bg-slate-800/50 text-slate-500 sticky top-0">
              <tr>
                <th className="w-24 px-6 py-6 border-b border-slate-100 dark:border-slate-800 text-center">Preview</th>
                <th className="px-6 py-6 w-1/2 border-b border-slate-100 dark:border-slate-800">Nome</th>
                <th className="px-6 py-6 text-center border-b border-slate-100 dark:border-slate-800">Status</th>
                <th className="px-6 py-6 text-right w-24 border-b border-slate-100 dark:border-slate-800">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedData?.length > 0 ? paginatedData.map((a) => (
                <tr key={a.id} className="transition-colors group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-5 text-center">
                    <img src={a.url_imagem} alt={a.nome} className="w-12 h-12 rounded-full object-cover inline-block" />
                  </td>
                  <td className="px-6 py-5">
                    <p className={`font-black text-sm uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{a.nome}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg border ${a.ativo ? 'border-green-100 text-green-600 bg-green-50' : 'border-red-100 text-red-600 bg-red-50'}`}>{a.ativo ? 'Ativo' : 'Inativo'}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button onClick={() => handleEdit(a)} className="p-3 rounded-xl transition-all text-slate-400 hover:text-yellow-500"><Edit3 size={20} /></button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-6 py-24 text-center opacity-20"><Search size={64} className="mx-auto mb-4" /><p className="font-black uppercase tracking-[0.4em] text-sm">Nenhum avatar encontrado</p></td></tr>
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
                <ChevronLeft size={18} />
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
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
