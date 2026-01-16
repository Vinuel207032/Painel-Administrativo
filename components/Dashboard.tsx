
import React from 'react';
import { Sparkles } from 'lucide-react';

interface DashboardProps {
  dashData: any;
  theme: string;
  user: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ theme, user }) => {
  return (
    <div className="animate-fade-in py-12 flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6 text-yellow-500 animate-pulse">
        <Sparkles size={40} />
      </div>
      
      <h1 className={`text-3xl md:text-5xl font-black tracking-tight mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
        Bem-vindo ao Painel, <span className="text-yellow-500">{user?.nome?.split(' ')[0]}</span>
      </h1>
      
      <p className={`text-lg max-w-lg leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
        Seu centro de operações está pronto. Use o menu lateral ou a navegação inferior para gerenciar seus parceiros e usuários.
      </p>

      {/* Placeholder for future widgets */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 w-full opacity-30 grayscale pointer-events-none">
         <div className="h-32 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl"></div>
         <div className="h-32 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl"></div>
         <div className="h-32 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl"></div>
      </div>
    </div>
  );
};
