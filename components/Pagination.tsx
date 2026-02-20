
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  theme: string;
}

const getContrastColor = (hex: string) => {
  if (!hex || hex.length < 6) return 'white';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#1e293b' : 'white';
};

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  theme
}) => {
  const { config } = useConfig();
  const primaryColor = config['sistema.cor_primaria'] || 'var(--primary-color, #1e293b)';
  const contrastText = getContrastColor(primaryColor);
  
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startItem = (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalItems);

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-10 px-4">
      {/* Informação de Registros */}
      <div className="flex items-center gap-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Operadores <span className="text-slate-600 dark:text-white">{startItem}-{endItem}</span> de <span className="text-slate-600 dark:text-white">{totalItems}</span>
        </p>
        
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Mostrar:</span>
          <select 
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
            className="bg-transparent text-[11px] font-black text-slate-500 uppercase outline-none cursor-pointer transition-colors"
            style={{ '--hover-color': primaryColor } as any}
            onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
          >
            <option value={10}>10 linhas</option>
            <option value={20}>20 linhas</option>
            <option value={50}>50 linhas</option>
            <option value={100}>100 linhas</option>
          </select>
        </div>
      </div>

      {/* Navegação */}
      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2.5 text-slate-400 transition-all disabled:opacity-30"
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.color = primaryColor)}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <ChevronLeft size={20} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          const isActive = currentPage === page;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              style={isActive ? { backgroundColor: primaryColor, color: contrastText } : {}}
              className={`w-10 h-10 rounded-xl text-[11px] font-black transition-all ${
                isActive 
                  ? 'shadow-lg scale-110' 
                  : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              onMouseEnter={(e) => !isActive && (e.currentTarget.style.color = primaryColor)}
              onMouseLeave={(e) => !isActive && (e.currentTarget.style.color = '#94a3b8')}
            >
              {page}
            </button>
          );
        })}

        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2.5 text-slate-400 transition-all disabled:opacity-30"
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.color = primaryColor)}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};
