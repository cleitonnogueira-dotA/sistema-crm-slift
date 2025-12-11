import React from 'react';
import { ViewState } from '../types';
import { getSettings } from '../services/storageService';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const settings = getSettings();
  
  const navItems: { id: ViewState; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'trips', label: 'Viagens & Fretes', icon: '🚚' },
    { id: 'freights', label: 'Fretes Motoristas', icon: '⛽' }, 
    { id: 'staff', label: 'Gestão de Equipe', icon: '👥' },
    { id: 'bonuses', label: 'Prêmios FDS', icon: '🎁' },
    { id: 'settings', label: 'Configurações', icon: '⚙️' },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-full shadow-2xl">
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
         <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden bg-white shadow-inner border border-blue-500 shrink-0">
            {settings.logo ? (
                <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center font-bold text-xl text-white">
                    SL
                </div>
            )}
         </div>
         <div className="overflow-hidden">
            <h1 className="font-bold text-lg tracking-wide whitespace-nowrap">Slift Logística</h1>
            <span className="text-xs text-slate-400 font-medium block whitespace-nowrap">Painel de Controle</span>
         </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              currentView === item.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400">
          <p className="font-semibold text-slate-300 mb-1">Status do Sistema</p>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>Online • v2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;