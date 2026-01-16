
import React from 'react';
import { DollarSign, FileText, Building, Activity, Printer, X } from 'lucide-react';

interface ReportsProps {
  theme: string;
  openReport: (type: any) => void;
  showReportModal: boolean;
  setShowReportModal: (show: boolean) => void;
  currentReportType: string;
}

export const Reports: React.FC<ReportsProps> = ({ theme, openReport, showReportModal, setShowReportModal, currentReportType }) => {
  
  const ReportCard = ({ title, desc, icon: Icon, onClick }: any) => (
    <button 
      onClick={onClick}
      className={`p-6 rounded-xl border text-left transition-all hover:shadow-lg group ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-yellow-500' : 'bg-white border-slate-200 hover:border-yellow-500'}`}
    >
      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600 mb-4 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
         <Icon size={24} />
      </div>
      <h3 className={`font-bold text-lg mb-2 group-hover:text-yellow-600 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
      <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</p>
    </button>
  );

  return (
    <div className="animate-fade-in space-y-6">
       <div>
         <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Central de Relatórios</h2>
         <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Gere relatórios detalhados para impressão ou análise.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ReportCard title="Relatório Financeiro" desc="Receita, Faturamento B2B e Previsões." icon={DollarSign} onClick={() => openReport('FINANCIAL')} />
          <ReportCard title="Relatório Contábil" desc="Dados fiscais e tributários para contabilidade." icon={FileText} onClick={() => openReport('ACCOUNTING')} />
          <ReportCard title="Clientes Faturados" desc="Lista de empresas e contratos ativos." icon={Building} onClick={() => openReport('INVOICED_CLIENTS')} />
          <ReportCard title="Relatório Geral" desc="Visão 360 do sistema e performance." icon={Activity} onClick={() => openReport('GENERAL')} />
       </div>

       {/* PREVIEW MODAL */}
       {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:block">
          <div id="report-modal" className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none print:w-full print:max-w-none print:h-auto print:overflow-visible print:m-0">
             
             {/* HEADER FOR MODAL (HIDDEN IN PRINT) */}
             <div className="flex justify-between items-center p-6 border-b print:hidden no-print">
                <h3 className="text-xl font-bold text-slate-900">Pré-visualização do Relatório</h3>
                <div className="flex gap-2">
                   <button onClick={() => window.print()} className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-yellow-600 transition-colors">
                      <Printer size={16} /> Imprimir / Salvar PDF
                   </button>
                   <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                      <X size={20} />
                   </button>
                </div>
             </div>
             
             {/* A4 PAPER SIMULATION */}
             {/* Added ID printable-content for targeted printing CSS */}
             <div className="p-8 md:p-12 print:p-0 bg-gray-50 print:bg-white min-h-[500px]">
                <div id="printable-content" className="bg-white shadow-lg p-10 mx-auto max-w-[210mm] min-h-[297mm] print:shadow-none print:m-0 print:w-full relative">
                   
                   {/* CONTENT */}
                   <div>
                     <div className="text-center border-b pb-6 mb-8">
                        <img src="https://i.ibb.co/JF2Gz3v8/logo.png" alt="Logo" className="h-12 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">Relatório {currentReportType}</h1>
                        <p className="text-sm text-slate-500 mt-2">Gerado em: {new Date().toLocaleDateString()} às {new Date().toLocaleTimeString()}</p>
                     </div>

                     <div className="space-y-6">
                        <p className="text-sm text-slate-600">Este é um relatório detalhado gerado pelo sistema administrativo Clube Partner.</p>
                        
                        <table className="w-full text-sm text-left border border-slate-200">
                           <thead className="bg-slate-100 text-slate-900 font-bold">
                              <tr>
                                 <th className="px-4 py-2 border">Item</th>
                                 <th className="px-4 py-2 border">Descrição</th>
                                 <th className="px-4 py-2 border text-right">Valor</th>
                              </tr>
                           </thead>
                           <tbody>
                              <tr>
                                 <td className="px-4 py-2 border">01</td>
                                 <td className="px-4 py-2 border">Registro Financeiro Teste</td>
                                 <td className="px-4 py-2 border text-right">R$ 1.250,00</td>
                              </tr>
                              <tr>
                                 <td className="px-4 py-2 border">02</td>
                                 <td className="px-4 py-2 border">Taxa de Adesão Parceiro</td>
                                 <td className="px-4 py-2 border text-right">R$ 300,00</td>
                              </tr>
                           </tbody>
                        </table>
                     </div>
                   </div>

                   {/* SECURITY FOOTER (FIXED AT BOTTOM FOR PRINT) */}
                   <div className="report-footer mt-12 pt-6 border-t text-center print:fixed print:bottom-10 print:left-0 print:right-0">
                      <p className="font-bold text-red-600 mb-1">CONFIDENCIAL & SEGURA</p>
                      <p>Este relatório foi gerado de forma segura e detalhada pelo sistema administrativo.</p>
                      <p className="font-bold">É proibido compartilhar este relatório sem autorização prévia da gerência.</p>
                      <div className="page-number mt-2">Página </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
