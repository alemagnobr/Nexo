import React from 'react';
import { View } from '../types';
import { Activity, Dumbbell, Apple, LayoutDashboard } from 'lucide-react';
import { TreinoView } from './TreinoView';

interface SaudeViewProps {
  currentView: View;
  onNavigate: (view: View) => void;
  data: any;
  actions: any;
}

export const SaudeView: React.FC<SaudeViewProps> = ({ currentView, onNavigate, data, actions }) => {
  const tabs = [
    { 
      id: View.TREINO, 
      label: 'Gestão de Treinos', 
      icon: Dumbbell,
      iconColor: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-100/90 dark:bg-orange-950/80',
      activeBorder: 'border-orange-500/30 text-orange-700 dark:text-orange-300'
    }
  ];

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Sub-navigation Header */}
      <div className="mb-6">
        <div className="pb-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl shadow-sm">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">Saúde e Bem-estar</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Acompanhe seu corpo, treinos e rotina física.</p>
            </div>
          </div>
          
          {/* Internal Tabs Navigation - Sleek Compact Pill Control */}
          <div className="w-full overflow-x-auto scrollbar-hide pb-1">
            <div className="flex items-center gap-1 w-max min-w-full md:w-auto p-1 bg-slate-200/60 dark:bg-slate-800/50 backdrop-blur-md rounded-full mx-auto border border-slate-300/60 dark:border-slate-700/60 shadow-sm">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = currentView === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => onNavigate(tab.id as View)}
                    className={`
                      flex-1 shrink-0 relative flex flex-row items-center justify-center gap-1.5 py-1.5 px-3 md:px-5 rounded-full font-medium transition-all duration-200 cursor-pointer text-xs
                      ${isActive 
                        ? `bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-300/60 dark:ring-slate-600 font-semibold` 
                        : `text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/40 dark:hover:bg-slate-700/40`}
                    `}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${tab.iconColor}`} />
                    <span className="whitespace-nowrap truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full bg-slate-50/50 dark:bg-slate-900">
        {currentView === View.SAUDE_DASHBOARD && (
          <div className="p-4 md:p-8 animate-fade-in">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Módulos de Saúde</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-orange-300 transition-colors" onClick={() => onNavigate(View.TREINO)}>
                <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400">
                  <Dumbbell className="w-8 h-8" />
                  <h3 className="text-lg font-bold">Gestão de Treinos e Projetos</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Registre seus projetos, fichas de treino, dietas e acompanhe as progressões de carga.</p>
              </div>

            </div>
          </div>
        )}

        {currentView === View.TREINO && (
          <TreinoView data={data} actions={actions} />
        )}
      </div>
    </div>
  );
};
