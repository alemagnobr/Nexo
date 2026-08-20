import React from 'react';
import { View } from '../types';
import { InvestmentList } from './InvestmentList';
import { FinancialChallengeView } from './FinancialChallengeView';
import { RetirementMachine } from './RetirementMachine';
import { LineChart, Coins, Landmark, TrendingUp, Trophy, ArrowRight, DollarSign, Target } from 'lucide-react';

interface InvestimentosViewProps {
  currentView: View;
  onNavigate: (view: View) => void;
  data: any;
  actions: any;
  privacyMode: boolean;
  hasApiKey: boolean;
  quickActionSignal: number;
}

export const InvestimentosView: React.FC<InvestimentosViewProps> = ({
  currentView,
  onNavigate,
  data,
  actions,
  privacyMode,
  hasApiKey,
  quickActionSignal,
}) => {
  const tabs = [
    {
      id: View.INVESTMENTS,
      label: 'Meus Investimentos',
      icon: LineChart,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100/90 dark:bg-emerald-950/80',
      activeBorder: 'border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
    },
    {
      id: View.FINANCIAL_CHALLENGES,
      label: 'Desafio Financeiro',
      icon: Coins,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100/90 dark:bg-amber-950/80',
      activeBorder: 'border-amber-500/30 text-amber-700 dark:text-amber-300',
    },
    {
      id: View.WEALTH_PLANNER,
      label: 'Aposentadoria',
      icon: Landmark,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-100/90 dark:bg-indigo-950/80',
      activeBorder: 'border-indigo-500/30 text-indigo-700 dark:text-indigo-300',
    },
  ];

  // Calculate summary metrics for overview
  const totalInvested = (data.investments || []).reduce((acc: number, item: any) => acc + (item.amount || 0), 0);
  const activeChallengesCount = (data.financialChallenges || []).length;
  const completedChallengesTotal = (data.financialChallenges || []).reduce((sum: number, ch: any) => {
    const entries = ch.completedEntries || {};
    const subTotal = Object.keys(entries).reduce((sub: number, k: string) => sub + Number(k), 0);
    return sum + subTotal;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Internal Tabs Navigation - Sleek Compact Pill Control */}
      <div className="w-full overflow-x-auto scrollbar-hide pb-1">
        <div className="flex items-center gap-1 w-max min-w-full md:w-auto p-1 bg-slate-200/60 dark:bg-slate-800/50 backdrop-blur-md rounded-full mx-auto border border-slate-300/60 dark:border-slate-700/60 shadow-sm">
          {tabs.map((tab) => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`
                  flex-1 shrink-0 relative flex flex-row items-center justify-center gap-2 py-1.5 px-3.5 md:px-5 rounded-full font-medium transition-all duration-200 cursor-pointer text-xs
                  ${
                    isActive
                      ? `bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-300/60 dark:ring-slate-600 font-bold`
                      : `text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/40 dark:hover:bg-slate-700/40`
                  }
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
        {currentView === View.INVESTMENTS_DASHBOARD && (
          <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2.5">
                  <TrendingUp className="w-7 h-7 text-emerald-500" />
                  Hub de Investimentos & Futuro
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Gerencie sua carteira, execute desafios de economia e planeje sua independência financeira.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Meus Investimentos */}
              <div
                className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between gap-4 cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group"
                onClick={() => onNavigate(View.INVESTMENTS)}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                      <LineChart className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                      {(data.investments || []).length} ativos
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Meus Investimentos
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                    Acompanhe sua carteira de ações, fundos imobiliários, renda fixa, cripto e caixinhas com metas.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Aplicado</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white">
                      {privacyMode ? '••••••' : `R$ ${totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Card 2: Desafios Financeiros */}
              <div
                className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between gap-4 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group"
                onClick={() => onNavigate(View.FINANCIAL_CHALLENGES)}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
                      <Coins className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200/60 dark:border-amber-800/60">
                      {activeChallengesCount} ativos
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Desafios Financeiros
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                    Economize de forma lúdica com o desafio 1 a N (1 a 500, 1 a 1.000) e marque seus depósitos com data.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Acumulado</span>
                    <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                      {privacyMode ? '••••••' : `R$ ${completedChallengesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-amber-600 group-hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Card 3: Aposentadoria */}
              <div
                className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between gap-4 cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group"
                onClick={() => onNavigate(View.WEALTH_PLANNER)}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                      <Landmark className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
                      Simulador
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Máquina de Aposentadoria
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                    Calcule o patrimônio necessário para cobrir seus custos fixos mensais com renda passiva e dividendos.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Independência Financeira</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Planejamento de Liberdade
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === View.INVESTMENTS && (
          <InvestmentList
            investments={data.investments || []}
            onAdd={actions.addInvestment}
            onUpdate={actions.updateInvestment}
            onDelete={actions.deleteInvestment}
            onNavigate={onNavigate}
            privacyMode={privacyMode}
            hasApiKey={hasApiKey}
            quickActionSignal={quickActionSignal}
            wallets={data.wallets || []}
            onAddTransaction={actions.addTransaction}
          />
        )}

        {currentView === View.FINANCIAL_CHALLENGES && (
          <FinancialChallengeView
            challenges={data.financialChallenges || []}
            onAddChallenge={actions.addFinancialChallenge}
            onUpdateChallenge={actions.updateFinancialChallenge}
            onDeleteChallenge={actions.deleteFinancialChallenge}
            onToggleEntry={actions.toggleFinancialChallengeEntry}
            privacyMode={privacyMode}
            onBackToHabits={() => onNavigate(View.INVESTMENTS)}
          />
        )}

        {currentView === View.WEALTH_PLANNER && (
          <RetirementMachine
            data={data}
            actions={actions}
            onSaveProfile={actions.saveWealthProfile}
            onNavigateToInvestments={() => onNavigate(View.INVESTMENTS)}
            privacyMode={privacyMode}
            hasApiKey={hasApiKey}
          />
        )}
      </div>
    </div>
  );
};
