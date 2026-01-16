import React from 'react';
import { Sun, Moon, Database, X } from 'lucide-react';

interface SettingsProps {
  theme: string;
  toggleTheme: () => void;
  showSqlModal: boolean;
  setShowSqlModal: (show: boolean) => void;
}

export const Settings: React.FC<SettingsProps> = ({ theme, toggleTheme, showSqlModal, setShowSqlModal }) => {
  return (
    <div className="animate-fade-in max-w-2xl">
      <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Configurações do Sistema</h2>
      
      <div className={`p-6 rounded-xl border shadow-sm mb-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Aparência</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Tema da Interface</p>
            <p className="text-sm text-gray-500">Alterne entre modo claro e escuro. (Salvo no banco)</p>
          </div>
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-all ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-yellow-400' : 'bg-gray-100 border-gray-200 text-slate-600'}`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      <div className={`p-6 rounded-xl border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Banco de Dados</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Tabelas e Estrutura</p>
            <p className="text-sm text-gray-500">Visualize o código SQL para criar as tabelas necessárias.</p>
          </div>
          <button 
            onClick={() => setShowSqlModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold"
          >
            <Database size={16} /> Ver SQL
          </button>
        </div>
      </div>
    </div>
  );
};