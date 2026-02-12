
import React, { useState, useEffect } from 'react';
import { Plus, Layers, Edit3 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const CategoryManager: React.FC<{theme: string}> = ({ theme }) => {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase!.from('tb_categorias').select('*').order('id', { ascending: false });
      setList(data || []);
    };
    fetch();
  }, []);

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex justify-between items-center mb-8">
        <h2 className={`text-2xl md:text-3xl font-black flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
           <Layers size={32} className="text-yellow-500" /> Categorias
        </h2>
        <button className="bg-yellow-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl"><Plus size={18} /> Novo</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {list.map((cat, idx) => (
          <div key={idx} className={`p-8 rounded-[2.5rem] border-2 bg-white dark:bg-slate-900 text-center flex flex-col items-center gap-4 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="w-14 h-14 bg-green-500/10 text-green-600 rounded-2xl flex items-center justify-center"><Layers size={24} /></div>
            <p className="font-black text-xs uppercase tracking-widest">{cat.nome}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
