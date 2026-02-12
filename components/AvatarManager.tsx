
import React, { useState, useEffect } from 'react';
import { Plus, X, Edit3, Image as ImageIcon, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const AvatarManager: React.FC<{theme: string}> = ({ theme }) => {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, titulo: '', url_imagem: '', ativo: true });

  useEffect(() => { fetchList(); }, []);

  const fetchList = async () => {
    setLoading(true);
    const { data } = await supabase!.from('tb_avatares').select('*').order('id', { ascending: false });
    setList(data || []);
    setLoading(false);
  };

  const handleToggle = async (av: any) => {
    const { error } = await supabase!.from('tb_avatares').update({ ativo: !av.ativo }).eq('id', av.id);
    if (!error) fetchList();
  };

  const handleSave = async () => {
    const payload = { titulo: formData.titulo, url_imagem: formData.url_imagem, ativo: formData.ativo };
    const { error } = formData.id 
      ? await supabase!.from('tb_avatares').update(payload).eq('id', formData.id)
      : await supabase!.from('tb_avatares').insert([payload]);
    if (!error) { setIsModalOpen(false); fetchList(); }
  };

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex justify-between items-center mb-8">
        <h2 className={`text-2xl md:text-3xl font-black flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
           <ImageIcon size={32} className="text-yellow-500" /> Avatares
        </h2>
        <button onClick={() => { setFormData({id: null, titulo: '', url_imagem: '', ativo: true}); setIsModalOpen(true); }} className="bg-yellow-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-2">
          <Plus size={18} /> Novo
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {list.map((av, idx) => (
          <div key={idx} className={`p-4 rounded-[2rem] border-2 bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center gap-3 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'} ${!av.ativo ? 'opacity-40 grayscale' : ''}`}>
            <div className="w-full aspect-square rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-yellow-500/10">
               <img src={av.url_imagem} className="w-full h-full object-contain" />
            </div>
            <div className="flex gap-2">
               <button onClick={() => handleToggle(av)} className={`transition-all ${av.ativo ? 'text-green-500' : 'text-slate-400'}`}>
                  {av.ativo ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
               </button>
               <button onClick={() => { setFormData(av); setIsModalOpen(true); }} className="text-slate-400 hover:text-yellow-500 transition-colors">
                  <Edit3 size={18} />
               </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className={`w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 ${theme === 'dark' ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-black uppercase">Configurar Avatar</h3>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X /></button>
              </div>
              <div className="space-y-4">
                 <div className="w-32 h-32 mx-auto rounded-3xl bg-slate-50 dark:bg-slate-800 mb-6 flex items-center justify-center border-2 border-yellow-500/10 overflow-hidden shadow-inner">
                    {formData.url_imagem ? <img src={formData.url_imagem} className="w-full h-full object-contain" /> : <ImageIcon className="text-slate-300" size={40} />}
                 </div>
                 <input className="w-full p-4 rounded-2xl border-2 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 font-bold focus:border-yellow-500 outline-none" placeholder="Título do Avatar" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} />
                 <input className="w-full p-4 rounded-2xl border-2 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 font-bold focus:border-yellow-500 outline-none" placeholder="URL da Imagem (Link Direto)" value={formData.url_imagem} onChange={e => setFormData({...formData, url_imagem: e.target.value})} />
                 <button onClick={handleSave} className="w-full py-5 bg-yellow-500 text-white rounded-3xl font-black uppercase shadow-xl transition-all active:scale-95">Salvar Registro</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
