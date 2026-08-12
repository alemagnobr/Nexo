import React from 'react';
import { View } from '../types';
import { Notes } from './Notes';
import { HabitTracker } from './HabitTracker';
import { WorkGoalsView } from './WorkGoalsView';
import { PasswordManager } from './PasswordManager';
import { StickyNote, Target, TrendingUp, Key } from 'lucide-react';

interface PlanejamentoViewProps {
  currentView: View;
  onNavigate: (view: View) => void;
  data: any;
  actions: any;
  privacyMode: boolean;
  hasApiKey: boolean;
  quickActionSignal: number;
}

export const PlanejamentoView: React.FC<PlanejamentoViewProps> = ({ 
  currentView, onNavigate, data, actions, privacyMode, hasApiKey, quickActionSignal 
}) => {
  const tabs = [
    { 
      id: View.PRODUCTIVITY, 
      label: 'Hábitos', 
      icon: Target,
      iconColor: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-100/90 dark:bg-rose-950/80',
      activeBorder: 'border-rose-500/30 text-rose-700 dark:text-rose-300'
    },
    { 
      id: View.NOTES, 
      label: 'NEXO Notes', 
      icon: StickyNote,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100/90 dark:bg-amber-950/80',
      activeBorder: 'border-amber-500/30 text-amber-700 dark:text-amber-300'
    },
    { 
      id: View.WORK_GOALS, 
      label: 'Metas', 
      icon: TrendingUp,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100/90 dark:bg-emerald-950/80',
      activeBorder: 'border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
    },
    { 
      id: View.PASSWORDS, 
      label: 'Senhas', 
      icon: Key,
      iconColor: 'text-sky-600 dark:text-sky-400',
      iconBg: 'bg-sky-100/90 dark:bg-sky-950/80',
      activeBorder: 'border-sky-500/30 text-sky-700 dark:text-sky-300'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Internal Tabs Navigation - Sleek Compact Pill Control */}
      <div className="w-full overflow-x-auto scrollbar-hide pb-1">
        <div className="flex items-center gap-1 w-max min-w-full md:w-auto p-1 bg-slate-200/60 dark:bg-slate-800/50 backdrop-blur-md rounded-full mx-auto border border-slate-300/60 dark:border-slate-700/60 shadow-sm">
          {tabs.map(tab => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`
                  flex-1 shrink-0 relative flex flex-row items-center justify-center gap-1.5 py-1.5 px-3 md:px-5 rounded-full font-medium transition-all duration-200 cursor-pointer text-xs
                  ${isActive 
                    ? `bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-300/60 dark:ring-slate-600 font-semibold` 
                    : `text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/40 dark:hover:bg-slate-700/40`}
                `}
              >
                <tab.icon className={`w-3.5 h-3.5 shrink-0 ${tab.iconColor}`} />
                <span className="whitespace-nowrap truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="animate-fade-in bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl">
        {currentView === View.PLANEJAMENTO_DASHBOARD && (
          <div className="p-4 md:p-8 space-y-6">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Resumo Planejamento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-rose-300 transition-colors" onClick={() => onNavigate(View.PRODUCTIVITY)}>
                <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                  <Target className="w-8 h-8" />
                  <h3 className="text-lg font-bold">Hábitos</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Registre e acompanhe a evolução dos seus hábitos diários.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-amber-300 transition-colors" onClick={() => onNavigate(View.NOTES)}>
                <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                  <StickyNote className="w-8 h-8" />
                  <h3 className="text-lg font-bold">NEXO Notes</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Crie e organize suas anotações com facilidade.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-emerald-300 transition-colors" onClick={() => onNavigate(View.WORK_GOALS)}>
                <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-8 h-8" />
                  <h3 className="text-lg font-bold">Metas de Trabalho</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Registre trabalhos e acompanhe suas metas de horas.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-sky-300 transition-colors" onClick={() => onNavigate(View.PASSWORDS)}>
                <div className="flex items-center gap-3 text-sky-600 dark:text-sky-400">
                  <Key className="w-8 h-8" />
                  <h3 className="text-lg font-bold">Cofre de Senhas</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Suas senhas seguras dentro da sua conta pessoal.</p>
              </div>

            </div>
          </div>
        )}
        {currentView === View.WORK_GOALS && (
          <WorkGoalsView 
             projects={data.workProjects || []}
             goals={data.workGoals || []}
             onAddProject={actions.addWorkProject}
             onUpdateProject={actions.updateWorkProject}
             onDeleteProject={actions.deleteWorkProject}
             onAddGoal={actions.addWorkGoal}
             onUpdateGoal={actions.updateWorkGoal}
             onDeleteGoal={actions.deleteWorkGoal}
          />
        )}
        {currentView === View.PRODUCTIVITY && (
          <HabitTracker 
             habits={data.habits || []}
             onAdd={actions.addHabit}
             onUpdate={actions.updateHabit}
             onDelete={actions.deleteHabit}
             onToggleEntry={actions.toggleHabitEntry}
             privacyMode={privacyMode}
          />
        )}
        {currentView === View.NOTES && (
          <Notes 
             notes={data.notes || []}
             onAdd={actions.addNote}
             onUpdate={actions.updateNote}
             onDelete={actions.deleteNote}
             privacyMode={privacyMode}
          />
        )}
        {currentView === View.PASSWORDS && (
          <PasswordManager
             passwords={data.passwords || []}
             onAdd={actions.addPassword}
             onUpdate={actions.updatePassword}
             onDelete={actions.deletePassword}
             privacyMode={privacyMode}
          />
        )}
      </div>
    </div>
  );
};
