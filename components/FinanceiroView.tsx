import React from 'react';
import { View } from '../types';
import { TransactionList } from './TransactionList';
import { SubscriptionManager } from './SubscriptionManager';
import { DebtManager } from './DebtManager';
import { BudgetList } from './BudgetList';
import { PixKeyManager } from './PixKeyManager';
import { Receipt, Repeat, ShieldAlert, Target, Key } from 'lucide-react';

interface FinanceiroViewProps {
  currentView: View;
  onNavigate: (view: View) => void;
  data: any;
  actions: any;
  privacyMode: boolean;
  hasApiKey: boolean;
  quickActionSignal: number;
}

export const FinanceiroView: React.FC<FinanceiroViewProps> = ({ 
  currentView, onNavigate, data, actions, privacyMode, hasApiKey, quickActionSignal 
}) => {
  return (
    <div className="space-y-6">
      {/* Content Area */}
      <div className="animate-fade-in bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl">
        {currentView === View.FINANCEIRO_DASHBOARD && (
          <div className="p-4 md:p-8 space-y-6">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Resumo Financeiro</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => onNavigate(View.TRANSACTIONS)}>
                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                  <Receipt className="w-8 h-8" />
                  <h3 className="text-lg font-bold">Transações</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie suas receitas, despesas e gastos.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-rose-300 transition-colors" onClick={() => onNavigate(View.DEBTS)}>
                <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="w-8 h-8" />
                  <h3 className="text-lg font-bold">Dívidas</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Controle parcelamentos, empréstimos e cartões.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-sky-300 transition-colors" onClick={() => onNavigate(View.BUDGETS)}>
                <div className="flex items-center gap-3 text-sky-600 dark:text-sky-400">
                  <Target className="w-8 h-8" />
                  <h3 className="text-lg font-bold">Orçamentos</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Defina limites e metas de gastos mensais.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-purple-300 transition-colors" onClick={() => onNavigate(View.SUBSCRIPTIONS)}>
                <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
                  <Repeat className="w-8 h-8" />
                  <h3 className="text-lg font-bold">Assinaturas</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Controle serviços mensais e assinaturas ativas.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 cursor-pointer hover:border-teal-300 transition-colors" onClick={() => onNavigate(View.PIX_KEYS)}>
                <div className="flex items-center gap-3 text-teal-600 dark:text-teal-400">
                  <Key className="w-8 h-8" />
                  <h3 className="text-lg font-bold">Chaves Pix</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie e copie suas chaves Pix cadastradas.</p>
              </div>
              
            </div>
          </div>
        )}
        {currentView === View.TRANSACTIONS && (
          <TransactionList 
            transactions={data.transactions}
            categories={data.categories}
            budgets={data.budgets}
            wallets={data.wallets}
            investments={data.investments}
            onAdd={actions.addTransaction}
            onUpdate={actions.updateTransaction}
            onDelete={actions.deleteTransaction}
            onToggleStatus={actions.toggleTransactionStatus}
            onAddWallet={actions.addWallet}
            onUpdateWallet={actions.updateWallet}
            onDeleteWallet={actions.deleteWallet}
            onNavigate={onNavigate}
            privacyMode={privacyMode}
            hasApiKey={hasApiKey}
            quickActionSignal={quickActionSignal}
          />
        )}
        {currentView === View.SUBSCRIPTIONS && (
          <SubscriptionManager 
            transactions={data.transactions}
            onUpdateTransaction={actions.updateTransaction}
            onDeleteTransaction={actions.deleteTransaction}
            privacyMode={privacyMode}
          />
        )}
        {currentView === View.DEBTS && (
          <DebtManager 
            debts={data.debts || []}
            onAdd={actions.addDebt}
            onUpdate={actions.updateDebt}
            onDelete={actions.deleteDebt}
            onAddTransaction={actions.addTransaction}
            privacyMode={privacyMode}
            quickActionSignal={quickActionSignal}
            scoreSerasa={data.scoreSerasa}
            scoreSerasaUpdatedAt={data.scoreSerasaUpdatedAt}
            scoreSerasaHistory={data.scoreSerasaHistory}
            onUpdateScoreSerasa={(score) => actions.updateScoreSerasa(score, new Date().toISOString())}
          />
        )}
        {currentView === View.BUDGETS && (
          <BudgetList 
            budgets={data.budgets || []} 
            transactions={data.transactions}
            investments={data.investments || []}
            onAdd={actions.addBudget} 
            onUpdate={actions.updateBudget}
            onDelete={actions.deleteBudget}
            onNavigate={onNavigate} 
            privacyMode={privacyMode} 
            quickActionSignal={quickActionSignal}
          />
        )}
        {currentView === View.PIX_KEYS && (
          <PixKeyManager
            pixKeys={data.pixKeys || []}
            onAdd={actions.addPixKey}
            onDelete={actions.deletePixKey}
          />
        )}
      </div>
    </div>
  );
};
