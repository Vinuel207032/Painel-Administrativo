
import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbProps {
  paths: { label: string; active?: boolean }[];
  theme: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ paths, theme }) => {
  return (
    <nav className="flex items-center gap-2 mb-5 select-none">
      <div className="flex items-center gap-2 text-slate-400">
        <Home size={12} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Home</span>
      </div>
      
      {paths?.map((path, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={12} className="text-slate-300" />
          <div 
            className={`flex items-center px-3 py-1 rounded-full transition-all ${
              path.active ? 'bg-opacity-10' : ''
            }`}
            style={path.active ? { backgroundColor: 'var(--primary-color, #1e293b)20' } : {}}
          >
            <span 
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors`}
              style={path.active ? { color: 'var(--primary-color, #1e293b)' } : { color: '#94a3b8' }}
            >
              {path.label}
            </span>
          </div>
        </React.Fragment>
      ))}
    </nav>
  );
};
