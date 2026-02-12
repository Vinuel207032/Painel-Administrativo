
import React, { useState, useEffect } from 'react';
import { Plus, Building2, Search, Edit3 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const CompanyManager: React.FC<{theme: string}> = ({ theme }) => {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase!.from('tb_empresas').select('*').order('id', { ascending: false });
      setList(data || []);
    };
    fetch();
  }, []);

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex justify-between items-center mb-8">
        <h2 className={`text-2xl md:text-3xl font-black flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
           <Building2 size={32} className="text-yellow-500" /> Empresas
        </h2>
        <button className="bg-yellow-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl"><Plus size={18} /> Novo</button>
      </div>

      <div className="space-y-4">
        {list.map((co, idx) => (
          <div key={idx} className={`p-6 rounded-[2rem] border-2 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-5 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center"><Building2 size={24} /></div>
            <div className="flex-1">
               <p className="font-black text-sm uppercase">{co.razao_social || co.nome}</p>
               <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">CNPJ: {co.cnpj}</p>
            </div>
            <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400"><Edit3 size={18} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};
