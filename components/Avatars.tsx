import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Search, X, UserCircle, ToggleLeft, ToggleRight, RefreshCw, Eye, EyeOff, Save, Image as ImageIcon, 
  Check, Edit3, Users, KeyRound, Bell, Filter, ChevronRight, Building2, Layers, AlertCircle, Printer, ChevronLeft,
  ShieldCheck, Briefcase, Store, ArrowRight, Calendar, Phone, User as UserIcon, ChevronDown, Trash2, Ban, Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateHash } from '../lib/crypto';
import { Breadcrumb } from './Breadcrumb';
import { useConfig } from '../contexts/ConfigContext';

interface AvatarsProps {
  theme: string;
  user: any;
  onAuditLog: (acao: string, tabela: string, desc: string, dados_antigos?: string, dados_novos?: string, entidade_id?: number, entidade_tipo?: string) => void;
}

export const Avatars: React.FC<AvatarsProps> = ({ 
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

  const primaryColor = config['sistema.cor_primaria'] || 'var(--primary-color, #1e293b)';
  const contrastText = getContrastColor(primaryColor);

  const [avatarForm, setAvatarForm] = useState({ id: null, nome: '', url_imagem: '', ativo: true });

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
    setAvatarForm({ id: null, nome: '', url_imagem: '', ativo: true });
    setViewMode('CREATE');
  };

  const handleSave = async () => {
    // ... Save logic for avatars
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentUserName = user?.nome || 'Operador do Sistema';
    const now = new Date();
    const formattedDate = now.toLocaleDateString();
    const formattedTime = now.toLocaleTimeString();

    const rows = filtered.map(a => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;"><img src="${a.url_imagem}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" /></td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; font-size: 11px; text-transform: uppercase;">${a.nome}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; font-size: 10px; font-weight: 800; color: #000;">${a.ativo ? 'ATIVO' : 'INATIVO'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Avatares da Empresa</title>
          <style>
            body { font-family: 'Inter', sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
            th { background-color: #f8f8f8; }
            .header { text-align: center; margin-bottom: 20px; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #888; }
            .watermark-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; pointer-events: none; display: flex; flex-direction: column; justify-content: space-around; align-items: center; overflow: hidden; }
            .watermark-text { font-size: 40px; color: rgba(0, 0, 0, 0.015); font-weight: 900; text-transform: uppercase; transform: rotate(-45deg); white-space: nowrap; user-select: none; }
          </style>
        </head>
        <body>
          <div class="watermark-container">
            <div class="watermark-text">${currentUserName} - ${formattedDate} ${formattedTime}</div>
          </div>
          <div class="header">
            <h1>Relatório de Avatares da Empresa</h1>
            <p>Gerado em: ${formattedDate} às ${formattedTime} por ${currentUserName}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Imagem</th>
                <th>Nome</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="footer">
            <p>Termo de Responsabilidade: É de total responsabilidade do emissor o não compartilhamento dos dados sensíveis do usuário.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };
  
  const getContrastColor = (hex: string) => {
    if (!hex || hex.length < 6) return 'white';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#1e293b' : 'white';
  };

  return (
    <div className="p-6 bg-white rounded-3xl shadow-lg">
      <Breadcrumb items={[{ icon: Layers, label: 'Configurações', link: '#' }, { label: 'Avatares' }]} />
      <div className="flex justify-between items-center mt-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Avatares</h1>
          <p className="text-sm text-slate-500">Gerencie os avatares disponíveis para os usuários.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200">
            <Printer size={20} />
          </button>
          <button onClick={handleOpenCreate} className="h-12 w-12 flex items-center justify-center rounded-2xl" style={{ backgroundColor: primaryColor, color: contrastText }}>
            <Plus size={20} />
          </button>
        </div>
      </div>
      
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Pesquisar por nome do avatar..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full h-12 pl-12 pr-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3">Imagem</th>
              <th scope="col" className="px-6 py-3">Nome</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData?.map(a => (
              <tr key={a.id} className="bg-white border-b hover:bg-slate-50">
                <td className="px-6 py-4">
                  <img src={a.url_imagem} alt={a.nome} className="w-10 h-10 rounded-full object-cover" />
                </td>
                <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{a.nome}</td>
                <td className="px-6 py-4">
                  <div className={`w-3 h-3 rounded-full ${a.ativo ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEdit(a)} className="font-medium text-blue-600 hover:underline">
                    <Edit3 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
