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
  return (
    <div className="flex flex-col w-full min-h-screen">
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
