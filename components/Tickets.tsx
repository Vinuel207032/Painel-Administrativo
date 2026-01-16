import React from 'react';
import { Plus, X } from 'lucide-react';

interface TicketsProps {
  ticketsList: any[];
  theme: string;
  showTicketModal: boolean;
  setShowTicketModal: (show: boolean) => void;
  selectedTicket: any;
  setSelectedTicket: (ticket: any) => void;
}

export const Tickets: React.FC<TicketsProps> = ({ ticketsList, theme, showTicketModal, setShowTicketModal, selectedTicket, setSelectedTicket }) => {
  return (
    <div className="animate-fade-in space-y-6">
       <div className="flex justify-between items-center">
          <div>
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Central de Chamados (Master)</h2>
            <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Gerencie, responda e transfira solicitações de suporte.</p>
          </div>
          <button onClick={() => setShowTicketModal(true)} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 shadow-sm transition-all font-bold">
             <Plus size={18} /> Novo Chamado
          </button>
       </div>

       <div className={`rounded-xl shadow-sm border overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <table className={`w-full text-sm text-left ${theme === 'dark' ? 'text-slate-300' : 'text-gray-500'}`}>
             <thead className={`text-xs uppercase ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-gray-50 text-gray-700'}`}>
                <tr>
                   <th className="px-6 py-3">ID</th>
                   <th className="px-6 py-3">Assunto</th>
                   <th className="px-6 py-3">Prioridade</th>
                   <th className="px-6 py-3">Status</th>
                   <th className="px-6 py-3 text-right">Ações</th>
                </tr>
             </thead>
             <tbody>
                {ticketsList.length === 0 ? (
                   <tr><td colSpan={5} className="px-6 py-8 text-center">Nenhum chamado encontrado.</td></tr>
                ) : (
                   ticketsList.map((t, i) => (
                      <tr key={i} className="border-b dark:border-slate-700">
                         <td className="px-6 py-4">#{t.id}</td>
                         <td className="px-6 py-4 font-bold">{t.assunto}</td>
                         <td className="px-6 py-4">
                            <span className={`text-xs px-2 py-1 rounded font-bold ${t.prioridade === 'CRITICA' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{t.prioridade}</span>
                         </td>
                         <td className="px-6 py-4">{t.status}</td>
                         <td className="px-6 py-4 text-right">
                            <button onClick={() => setSelectedTicket(t)} className="text-blue-600 hover:underline text-xs mr-3">Ver Detalhes</button>
                         </td>
                      </tr>
                   ))
                )}
             </tbody>
          </table>
       </div>

       {/* NEW TICKET MODAL */}
       {showTicketModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
           <div className={`rounded-xl shadow-2xl w-full max-w-lg p-6 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
              <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Novo Chamado Interno</h3>
              <form className="space-y-4">
                 <div>
                    <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Assunto</label>
                    <input type="text" className="w-full p-2 border rounded bg-transparent" required />
                 </div>
                 <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowTicketModal(false)} className="px-4 py-2 text-sm text-slate-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-yellow-500 text-white rounded font-bold text-sm">Abrir Chamado</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};