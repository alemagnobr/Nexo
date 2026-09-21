import React, { useState, useMemo } from 'react';
import { AppData, View, WalletType, Habit, Task, ShoppingItem, InventoryItem, AgendaEvent, WorkGoal, Note, Debt, Investment } from '../types';
import { 
  BarChart3, 
  Receipt, 
  Wallet, 
  Repeat, 
  ShieldAlert, 
  LineChart, 
  Target, 
  ShoppingCart, 
  Package, 
  Sparkles, 
  CalendarClock, 
  CheckSquare, 
  Clock, 
  StickyNote, 
  Briefcase, 
  KeyRound, 
  Activity, 
  Dumbbell, 
  Plus, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Sliders, 
  Layers,
  Flame,
  Calendar,
  Sparkle
} from 'lucide-react';

export interface WidgetDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: 'financeiro' | 'planejamento' | 'compras' | 'saude';
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  targetView: View;
  colSpan?: 'full' | 'half'; // Se ocupa largura total ou meia coluna
}

export const AVAILABLE_WIDGETS: WidgetDefinition[] = [
  {
    id: 'financeiro_resumo',
    title: 'Visão Geral Financeira',
    subtitle: 'Saldo, Entradas, Saídas e Investimentos',
    description: 'Acompanhe seu fluxo de caixa consolidado, contas pendentes e patrimônio do mês em tempo real.',
    category: 'financeiro',
    icon: BarChart3,
    iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    targetView: View.TRANSACTIONS,
    colSpan: 'full'
  },
  {
    id: 'habitos',
    title: 'Hábitos do Dia',
    subtitle: 'Rotina e consistência diária',
    description: 'Veja seus hábitos de hoje e marque como concluído diretamente pela tela inicial.',
    category: 'planejamento',
    icon: CheckSquare,
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    targetView: View.PRODUCTIVITY,
    colSpan: 'half'
  },
  {
    id: 'tarefas',
    title: 'Tarefas & Pendências',
    subtitle: 'Entregas e prazos urgentes',
    description: 'Acompanhe tarefas atrasadas, entregas de hoje e principais prioridades das suas listas.',
    category: 'planejamento',
    icon: Target,
    iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    targetView: View.KANBAN,
    colSpan: 'half'
  },
  {
    id: 'compras',
    title: 'Lista de Compras',
    subtitle: 'Mercado, feira e carrinho',
    description: 'Itens pendentes para comprar, contagem do carrinho e previsão total de gastos.',
    category: 'compras',
    icon: ShoppingCart,
    iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    targetView: View.SHOPPING_LIST,
    colSpan: 'half'
  },
  {
    id: 'estoque',
    title: 'Estoque & Despensa',
    subtitle: 'Alerta de itens acabando',
    description: 'Produtos abaixo do estoque mínimo que necessitam de reposição imediata na casa.',
    category: 'compras',
    icon: Package,
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    targetView: View.INVENTORY,
    colSpan: 'half'
  },
  {
    id: 'agenda',
    title: 'Próximos Compromissos',
    subtitle: 'Agenda e eventos futuros',
    description: 'Seus próximos compromissos e horários agendados para hoje e os próximos dias.',
    category: 'planejamento',
    icon: CalendarClock,
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    targetView: View.CALENDAR,
    colSpan: 'half'
  },
  {
    id: 'metas_trabalho',
    title: 'Metas de Trabalho',
    subtitle: 'Horas e progresso de projetos',
    description: 'Acompanhe suas metas de horas trabalhadas no ciclo e status de entrega.',
    category: 'planejamento',
    icon: Briefcase,
    iconBg: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    targetView: View.WORK_GOALS,
    colSpan: 'half'
  },
  {
    id: 'sonhos',
    title: 'Sonhos de Consumo',
    subtitle: 'Desejos e metas de aquisição',
    description: 'Seus maiores objetivos de compra e o progresso financeiro acumulado para cada um.',
    category: 'compras',
    icon: Sparkles,
    iconBg: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
    targetView: View.KANBAN,
    colSpan: 'half'
  },
  {
    id: 'notas',
    title: 'Notas Rápidas (NEXO Notes)',
    subtitle: 'Anotações e lembretes fixados',
    description: 'Últimas anotações e lembretes importantes para fácil consulta visual.',
    category: 'planejamento',
    icon: StickyNote,
    iconBg: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    targetView: View.NOTES,
    colSpan: 'half'
  },
  {
    id: 'cartoes',
    title: 'Cartões & Bancos',
    subtitle: 'Faturas e limites disponíveis',
    description: 'Visão dos cartões cadastrados, faturas em aberto e limite disponível.',
    category: 'financeiro',
    icon: Wallet,
    iconBg: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    targetView: View.WALLETS,
    colSpan: 'half'
  },
  {
    id: 'investimentos',
    title: 'Investimentos & Caixinhas',
    subtitle: 'Patrimônio aplicado',
    description: 'Suas principais aplicações financeiras e distribuição de ativos.',
    category: 'financeiro',
    icon: LineChart,
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    targetView: View.INVESTMENTS,
    colSpan: 'half'
  },
  {
    id: 'dividas',
    title: 'Dívidas & Acordos',
    subtitle: 'Status de negociações',
    description: 'Acompanhamento de dívidas ativas, acordos firmados e desconto obtido.',
    category: 'financeiro',
    icon: ShieldAlert,
    iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    targetView: View.DEBTS,
    colSpan: 'half'
  },
  {
    id: 'treino',
    title: 'Treino & Saúde',
    subtitle: 'Exercícios e rotinas ativas',
    description: 'Acompanhe seu ritmo de treinos e rotinas de atividades físicas da semana.',
    category: 'saude',
    icon: Dumbbell,
    iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    targetView: View.TREINO,
    colSpan: 'half'
  }
];

export const DEFAULT_ACTIVE_WIDGET_IDS = [
  'financeiro_resumo',
  'habitos',
  'tarefas',
  'compras',
  'estoque',
  'metas_trabalho'
];

interface WidgetCardProps {
  data: AppData;
  privacyMode: boolean;
  onNavigate: (view: View) => void;
  onRemove: () => void;
  onToggleHabitEntry: (id: string, dayIndex: number, status: 'done' | 'missed', dateStr: string) => void;
  formatValue: (val: number) => string;
}

/* =========================================================================
   1. WIDGET: FINANCEIRO RESUMO (Completo)
   ========================================================================= */
export const FinanceiroWidget: React.FC<WidgetCardProps> = ({
  data,
  privacyMode,
  onNavigate,
  onRemove,
  formatValue
}) => {
  const mealWalletIds = useMemo(() => new Set((data.wallets || []).filter(w => w.type === WalletType.MEAL_TICKET).map(w => w.id)), [data.wallets]);
  const dashboardTxs = useMemo(() => data.transactions.filter(t => !t.walletId || !mealWalletIds.has(t.walletId)), [data.transactions, mealWalletIds]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Transações do mês atual
  const currentMonthTxs = useMemo(() => {
    return dashboardTxs.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [dashboardTxs, currentMonth, currentYear]);

  const monthIncome = currentMonthTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const monthExpense = currentMonthTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const monthPending = currentMonthTxs.filter(t => t.type === 'expense' && t.status === 'pending').reduce((acc, t) => acc + t.amount, 0);

  const totalInvested = useMemo(() => (data.investments || []).reduce((acc, i) => acc + i.amount, 0), [data.investments]);

  // Saldo em conta
  const realTimeBalance = dashboardTxs
    .filter(t => t.status === 'paid')
    .reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);

  const bankWalletsSum = (data.wallets || [])
    .filter(w => w.type !== WalletType.MEAL_TICKET)
    .reduce((acc, w) => acc + w.balance, 0);

  const currentBalance = (data.transactions.length === 0) 
    ? 0 
    : (data.transactions.length < 300) 
      ? realTimeBalance 
      : (data.walletBalance !== undefined ? bankWalletsSum : realTimeBalance);

  // Próximas contas pendentes a pagar
  const upcomingBills = useMemo(() => {
    return dashboardTxs
      .filter(t => t.type === 'expense' && t.status === 'pending')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 2);
  }, [dashboardTxs]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Visão Geral Financeira</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                Ao Vivo
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Fluxo de caixa consolidado do mês</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onNavigate(View.TRANSACTIONS)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
            title="Abrir Extrato e Contas"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Ocultar este card"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Saldo em Caixa</p>
          <p className={`text-base font-black truncate mt-0.5 ${currentBalance >= 0 ? 'text-slate-800 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatValue(currentBalance)}
          </p>
        </div>

        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Entradas Mês</p>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-base font-black text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
            {formatValue(monthIncome)}
          </p>
        </div>

        <div className="bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Saídas Mês</p>
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <p className="text-base font-black text-rose-600 dark:text-rose-400 truncate mt-0.5">
            {formatValue(monthExpense)}
          </p>
        </div>

        <div className="bg-teal-50/50 dark:bg-teal-950/20 p-3 rounded-xl border border-teal-100 dark:border-teal-900/30">
          <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Total Investido</p>
          <p className="text-base font-black text-teal-700 dark:text-teal-300 truncate mt-0.5">
            {formatValue(totalInvested)}
          </p>
        </div>
      </div>

      {/* Sub-info: Contas pendentes a pagar */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Pendente no mês:</span>
          <span className="font-bold text-rose-600 dark:text-rose-400">{formatValue(monthPending)}</span>
          {upcomingBills.length > 0 && (
            <span className="text-slate-400 dark:text-slate-500 hidden md:inline">• Próxima: {upcomingBills[0].description} ({formatValue(upcomingBills[0].amount)})</span>
          )}
        </div>

        <button
          onClick={() => onNavigate(View.TRANSACTIONS)}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 self-end sm:self-auto cursor-pointer"
        >
          <span>Acessar Extrato</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
   2. WIDGET: HÁBITOS DO DIA (Interativo)
   ========================================================================= */
export const HabitosWidget: React.FC<WidgetCardProps> = ({
  data,
  onNavigate,
  onRemove,
  onToggleHabitEntry
}) => {
  const habitsList = data.habits || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  const habitItems = useMemo(() => {
    return habitsList.map(h => {
      let dayIndex = 0;
      if (h.startDate) {
        const start = new Date(h.startDate);
        start.setHours(0, 0, 0, 0);
        const diff = today.getTime() - start.getTime();
        dayIndex = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
      }
      const entry = h.entries ? h.entries[dayIndex] : undefined;
      const isDone = entry?.status === 'done';
      return {
        habit: h,
        dayIndex,
        isDone,
        targetDays: h.targetDays || 21
      };
    });
  }, [habitsList, today]);

  const completedCount = habitItems.filter(item => item.isDone).length;
  const progress = habitItems.length > 0 ? Math.round((completedCount / habitItems.length) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Hábitos de Hoje</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  completedCount === habitItems.length && habitItems.length > 0
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                }`}>
                  {completedCount}/{habitItems.length} Feito{completedCount === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Marque diretamente para registrar</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigate(View.PRODUCTIVITY)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
              title="Abrir Rastreador de Hábitos"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Ocultar este card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3.5">
          <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <span>Progresso de hoje</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* List of Habits */}
        <div className="space-y-2">
          {habitItems.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-400">
              Nenhum hábito cadastrado ainda. Clique em abrir para criar seu primeiro hábito!
            </div>
          ) : (
            habitItems.slice(0, 4).map(({ habit, dayIndex, isDone, targetDays }) => (
              <div 
                key={habit.id}
                onClick={() => onToggleHabitEntry(habit.id, dayIndex, isDone ? 'missed' : 'done', todayStr)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isDone 
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-slate-800 dark:text-slate-200' 
                    : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-700/60 hover:border-indigo-400'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-lg shrink-0">{habit.icon || '🎯'}</span>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-white'}`}>
                      {habit.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">Dia {dayIndex + 1} de {targetDays}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-emerald-500 transition-colors" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {habitItems.length > 4 && (
        <div className="pt-2 text-center text-[11px] font-semibold text-slate-400">
          +{habitItems.length - 4} outros hábitos na lista completa
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   3. WIDGET: TAREFAS & PENDÊNCIAS
   ========================================================================= */
export const TarefasWidget: React.FC<WidgetCardProps> = ({
  data,
  onNavigate,
  onRemove
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Coleta tarefas de data.tasks e data.kanbanBoards
  const allTasks = useMemo(() => {
    const list: { id: string; title: string; dueDate?: string; isDelayed: boolean; isToday: boolean; isUrgent?: boolean }[] = [];

    // Tarefas normais
    (data.tasks || []).forEach(t => {
      if (t.completed) return;
      let isDelayed = false;
      let isToday = false;
      if (t.dueDate) {
        const d = new Date(t.dueDate);
        d.setHours(0, 0, 0, 0);
        if (d.getTime() < today.getTime()) isDelayed = true;
        else if (d.getTime() === today.getTime()) isToday = true;
      }
      list.push({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        isDelayed,
        isToday,
        isUrgent: t.urgent
      });
    });

    // Tarefas do Kanban (cards que não estão na coluna de conclusão)
    (data.kanbanBoards || []).forEach(board => {
      board.columns.forEach(col => {
        if (!col.isConclusion) {
          col.cards.forEach(card => {
            let isDelayed = false;
            let isToday = false;
            if (card.dueDate) {
              const d = new Date(card.dueDate);
              d.setHours(0, 0, 0, 0);
              if (d.getTime() < today.getTime()) isDelayed = true;
              else if (d.getTime() === today.getTime()) isToday = true;
            }
            list.push({
              id: card.id,
              title: card.title,
              dueDate: card.dueDate,
              isDelayed,
              isToday
            });
          });
        }
      });
    });

    // Ordena: atrasadas primeiro, depois hoje, depois as outras
    return list.sort((a, b) => {
      if (a.isDelayed && !b.isDelayed) return -1;
      if (!a.isDelayed && b.isDelayed) return 1;
      if (a.isToday && !b.isToday) return -1;
      if (!a.isToday && b.isToday) return 1;
      return 0;
    });
  }, [data.tasks, data.kanbanBoards, today]);

  const delayedCount = allTasks.filter(t => t.isDelayed).length;
  const todayCount = allTasks.filter(t => t.isToday).length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Tarefas & Prazos</h3>
                {delayedCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                    {delayedCount} atrasada{delayedCount === 1 ? '' : 's'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                    {allTasks.length} pendente{allTasks.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Entregas e pendências prioritárias</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigate(View.KANBAN)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
              title="Abrir Tarefas e Kanban"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Ocultar este card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Task Preview Items */}
        <div className="space-y-2 mt-2">
          {allTasks.length === 0 ? (
            <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-900/30 text-xs text-slate-400">
              🎉 Todas as suas tarefas estão em dia!
            </div>
          ) : (
            allTasks.slice(0, 4).map(task => (
              <div 
                key={task.id}
                onClick={() => onNavigate(View.KANBAN)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  task.isDelayed
                    ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                    : task.isToday
                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                    : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/50'
                }`}
              >
                <div className="min-w-0 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${task.isDelayed ? 'bg-rose-500' : task.isToday ? 'bg-amber-500' : 'bg-slate-400'}`} />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{task.title}</p>
                </div>

                <div className="shrink-0 text-right">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    task.isDelayed
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400'
                      : task.isToday
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                      : 'text-slate-400'
                  }`}>
                    {task.isDelayed ? 'Atrasada' : task.isToday ? 'Hoje' : task.dueDate || 'Sem prazo'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          {delayedCount > 0 ? `${delayedCount} atrasada(s), ${todayCount} para hoje` : `${allTasks.length} tarefas pendentes`}
        </span>
        <button
          onClick={() => onNavigate(View.KANBAN)}
          className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
        >
          <span>Abrir Tarefas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
   4. WIDGET: LISTA DE COMPRAS
   ========================================================================= */
export const ComprasWidget: React.FC<WidgetCardProps> = ({
  data,
  onNavigate,
  onRemove,
  formatValue
}) => {
  const pendingItems = useMemo(() => {
    return (data.shoppingList || []).filter(item => !item.isChecked);
  }, [data.shoppingList]);

  const estimatedTotal = useMemo(() => {
    return pendingItems.reduce((acc, item) => {
      const price = item.actualPrice || item.referencePrice || 0;
      return acc + (price * (item.quantity || 1));
    }, 0);
  }, [pendingItems]);

  const checkedCount = useMemo(() => {
    return (data.shoppingList || []).filter(item => item.isChecked).length;
  }, [data.shoppingList]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Lista de Compras</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                  {pendingItems.length} a comprar
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Itens pendentes e carrinho de mercado</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigate(View.SHOPPING_LIST)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
              title="Abrir Lista de Compras"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Ocultar este card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Resumo da Compra */}
        <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Estimado</p>
            <p className="text-sm font-black text-slate-800 dark:text-white truncate">
              {formatValue(estimatedTotal)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No Carrinho</p>
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 truncate">
              {checkedCount} itens pegos
            </p>
          </div>
        </div>

        {/* Itens a Comprar */}
        <div className="space-y-1.5">
          {pendingItems.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400">
              Carrinho completo! Todos os itens já foram comprados.
            </div>
          ) : (
            pendingItems.slice(0, 3).map(item => (
              <div 
                key={item.id}
                onClick={() => onNavigate(View.SHOPPING_LIST)}
                className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between text-xs cursor-pointer hover:border-indigo-400 transition-colors"
              >
                <div className="min-w-0 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {item.quantity} {item.unit || 'un'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          {pendingItems.length > 3 ? `+${pendingItems.length - 3} outros itens na lista` : 'Tudo pronto para ir às compras'}
        </span>
        <button
          onClick={() => onNavigate(View.SHOPPING_LIST)}
          className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
        >
          <span>Ir às Compras</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
   5. WIDGET: ESTOQUE & DESPENSA
   ========================================================================= */
export const EstoqueWidget: React.FC<WidgetCardProps> = ({
  data,
  onNavigate,
  onRemove
}) => {
  const inventoryList = data.inventoryList || [];

  const lowStockItems = useMemo(() => {
    return inventoryList.filter(item => {
      const min = item.minQuantity !== undefined ? item.minQuantity : 1;
      return item.quantity <= min;
    });
  }, [inventoryList]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Estoque & Despensa</h3>
                {lowStockItems.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                    {lowStockItems.length} acabando
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    Abastecido
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Itens essenciais abaixo da cota mínima</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigate(View.INVENTORY)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
              title="Abrir Estoque"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Ocultar este card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Low stock list */}
        <div className="space-y-2 mt-2">
          {lowStockItems.length === 0 ? (
            <div className="p-4 text-center rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-xs text-emerald-700 dark:text-emerald-400">
              ✨ Sua despensa está em ordem! Nenhum item crítico no momento.
            </div>
          ) : (
            lowStockItems.slice(0, 3).map(item => (
              <div 
                key={item.id}
                onClick={() => onNavigate(View.INVENTORY)}
                className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 flex items-center justify-between text-xs cursor-pointer hover:border-amber-400 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 dark:text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Mínimo ideal: {item.minQuantity || 1} {item.unit}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 font-black text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[11px]">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          Total de {inventoryList.length} itens cadastrados
        </span>
        <button
          onClick={() => onNavigate(View.INVENTORY)}
          className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
        >
          <span>Conferir Despensa</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
   6. WIDGET: AGENDA & COMPROMISSOS
   ========================================================================= */
export const AgendaWidget: React.FC<WidgetCardProps> = ({
  data,
  onNavigate,
  onRemove
}) => {
  const events = data.agendaEvents || [];
  const todayStr = new Date().toISOString().slice(0, 10);

  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter(ev => ev.startDate >= todayStr)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 3);
  }, [events, todayStr]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Próximos Compromissos</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  {upcomingEvents.length} eventos
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Eventos e compromissos marcados</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigate(View.CALENDAR)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
              title="Abrir Agenda"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Ocultar este card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 mt-2">
          {upcomingEvents.length === 0 ? (
            <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-900/30 text-xs text-slate-400">
              Nenhum evento agendado para os próximos dias.
            </div>
          ) : (
            upcomingEvents.map(event => (
              <div 
                key={event.id}
                onClick={() => onNavigate(View.CALENDAR)}
                className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between text-xs cursor-pointer hover:border-indigo-400 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{event.title}</p>
                  <p className="text-[10px] text-slate-400">{event.allDay ? 'Dia inteiro' : event.startDate.split('T')[1] || 'Horário marcado'}</p>
                </div>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md shrink-0">
                  {event.startDate.split('T')[0]}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Sincronizado com NEXO Calendar</span>
        <button
          onClick={() => onNavigate(View.CALENDAR)}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
        >
          <span>Ver Agenda</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
   7. WIDGET: METAS DE TRABALHO
   ========================================================================= */
export const MetasTrabalhoWidget: React.FC<WidgetCardProps> = ({
  data,
  onNavigate,
  onRemove
}) => {
  const goals = data.workGoals || [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Metas de Trabalho</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
                  {goals.length} ativas
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Horas cumpridas e entregas do ciclo</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigate(View.WORK_GOALS)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
              title="Abrir Metas de Trabalho"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Ocultar este card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2.5 mt-2">
          {goals.length === 0 ? (
            <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-900/30 text-xs text-slate-400">
              Nenhuma meta de trabalho definida. Clique para configurar seus objetivos!
            </div>
          ) : (
            goals.slice(0, 3).map(goal => {
              const pct = goal.targetHours > 0 ? Math.min(100, Math.round((goal.completedHours / goal.targetHours) * 100)) : 0;
              return (
                <div key={goal.id} className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/50">
                  <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    <span className="truncate">{goal.title}</span>
                    <span className="text-teal-600 dark:text-teal-400 shrink-0 ml-2">{goal.completedHours}h / {goal.targetHours}h ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Horas e projetos do ciclo</span>
        <button
          onClick={() => onNavigate(View.WORK_GOALS)}
          className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
        >
          <span>Ver Metas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
   8. WIDGET: SONHOS DE CONSUMO
   ========================================================================= */
export const SonhosWidget: React.FC<WidgetCardProps> = ({
  data,
  onNavigate,
  onRemove,
  formatValue
}) => {
  // Pega cards de sonhos / kanban com valores
  const dreams = useMemo(() => {
    const list: { id: string; title: string; amount: number }[] = [];
    (data.kanbanBoards || []).forEach(board => {
      board.columns.forEach(col => {
        col.cards.forEach(card => {
          if (card.amount && card.amount > 0) {
            list.push({
              id: card.id,
              title: card.title,
              amount: card.amount
            });
          }
        });
      });
    });
    return list.slice(0, 3);
  }, [data.kanbanBoards]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-600 dark:text-fuchsia-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Sonhos de Consumo</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/60 dark:text-fuchsia-400">
                  Desejos
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Objetivos e aquisições planejadas</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigate(View.KANBAN)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
              title="Abrir Sonhos"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Ocultar este card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 mt-2">
          {dreams.length === 0 ? (
            <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-900/30 text-xs text-slate-400">
              Nenhum sonho com valor cadastrado. Defina suas metas no Kanban!
            </div>
          ) : (
            dreams.map(dream => (
              <div key={dream.id} className="p-2.5 rounded-xl bg-fuchsia-50/40 dark:bg-fuchsia-950/20 border border-fuchsia-100 dark:border-fuchsia-900/30 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{dream.title}</span>
                <span className="text-xs font-black text-fuchsia-600 dark:text-fuchsia-400 shrink-0">{formatValue(dream.amount)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Metas de conquista</span>
        <button
          onClick={() => onNavigate(View.KANBAN)}
          className="text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 hover:text-fuchsia-700 flex items-center gap-1 cursor-pointer"
        >
          <span>Ver Sonhos</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
   9. WIDGET: NEXO NOTES (Anotações)
   ========================================================================= */
export const NotasWidget: React.FC<WidgetCardProps> = ({
  data,
  onNavigate,
  onRemove
}) => {
  const notes = data.notes || [];
  const pinnedOrRecent = useMemo(() => {
    return [...notes]
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .slice(0, 3);
  }, [notes]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400">
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">NEXO Notes</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-600 dark:bg-yellow-950/60 dark:text-yellow-400">
                  {notes.length} notas
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Lembretes e anotações rápidas</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigate(View.NOTES)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
              title="Abrir Notas"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Ocultar este card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 mt-2">
          {pinnedOrRecent.length === 0 ? (
            <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-900/30 text-xs text-slate-400">
              Nenhuma anotação salva ainda.
            </div>
          ) : (
            pinnedOrRecent.map(note => (
              <div 
                key={note.id} 
                onClick={() => onNavigate(View.NOTES)}
                className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/50 cursor-pointer hover:border-yellow-400 transition-colors"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{note.title || 'Sem título'}</span>
                  {note.isPinned && <span className="text-[10px] text-amber-500 font-bold">📌 Fixada</span>}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">{note.content || 'Nota vazia'}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Bloco de notas pessoal</span>
        <button
          onClick={() => onNavigate(View.NOTES)}
          className="text-xs font-bold text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 flex items-center gap-1 cursor-pointer"
        >
          <span>Abrir Bloco</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
   10. WIDGET: CARTÕES & BANCOS
   ========================================================================= */
export const CartoesWidget: React.FC<WidgetCardProps> = ({
  data,
  onNavigate,
  onRemove,
  formatValue
}) => {
  const cards = useMemo(() => {
    return (data.wallets || []).filter(w => w.type === WalletType.CREDIT_CARD);
  }, [data.wallets]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Cartões de Crédito</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400">
                  {cards.length} cartões
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Faturas e limites disponíveis</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigate(View.WALLETS)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
              title="Abrir Carteiras"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Ocultar este card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 mt-2">
          {cards.length === 0 ? (
            <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-900/30 text-xs text-slate-400">
              Nenhum cartão de crédito cadastrado em Carteiras.
            </div>
          ) : (
            cards.slice(0, 3).map(card => (
              <div key={card.id} className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{card.name}</p>
                  <p className="text-[10px] text-slate-400">Limite: {formatValue(card.creditLimit || 0)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-rose-600 dark:text-rose-400">{formatValue(card.balance)}</p>
                  <p className="text-[10px] text-slate-400">Fatura Atual</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Gestão de cartões e contas</span>
        <button
          onClick={() => onNavigate(View.WALLETS)}
          className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 flex items-center gap-1 cursor-pointer"
        >
          <span>Ver Cartões</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
   11. WIDGET: INVESTIMENTOS & CAIXINHAS
   ========================================================================= */
export const InvestimentosWidget: React.FC<WidgetCardProps> = ({
  data,
  onNavigate,
  onRemove,
  formatValue
}) => {
  const investments = data.investments || [];
  const total = useMemo(() => investments.reduce((acc, i) => acc + i.amount, 0), [investments]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <LineChart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Investimentos</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  {formatValue(total)}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Patrimônio e caixinhas ativas</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigate(View.INVESTMENTS)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
              title="Abrir Investimentos"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Ocultar este card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 mt-2">
          {investments.length === 0 ? (
            <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-900/30 text-xs text-slate-400">
              Nenhum investimento cadastrado. Crie suas primeiras caixinhas!
            </div>
          ) : (
            investments.slice(0, 3).map(inv => (
              <div key={inv.id} className="p-2 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{inv.name}</p>
                  <p className="text-[10px] text-slate-400">{inv.type}</p>
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatValue(inv.amount)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">{investments.length} caixinhas cadastradas</span>
        <button
          onClick={() => onNavigate(View.INVESTMENTS)}
          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
        >
          <span>Ver Carteira</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
   12. WIDGET: DÍVIDAS & ACORDOS
   ========================================================================= */
export const DividasWidget: React.FC<WidgetCardProps> = ({
  data,
  onNavigate,
  onRemove,
  formatValue
}) => {
  const debts = data.debts || [];
  const openDebts = debts.filter(d => d.status !== 'paid');

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Dívidas & Acordos</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                  {openDebts.length} em aberto
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Negociações e acordos firmados</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigate(View.DEBTS)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
              title="Abrir Dívidas"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Ocultar este card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 mt-2">
          {openDebts.length === 0 ? (
            <div className="p-4 text-center rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-xs text-emerald-700 dark:text-emerald-400">
              🎉 Nenhuma dívida pendente! Nome e finanças em dia.
            </div>
          ) : (
            openDebts.slice(0, 3).map(debt => (
              <div key={debt.id} className="p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{debt.creditor}</p>
                  <p className="text-[10px] text-slate-400">Status: {debt.status === 'agreement' ? 'Acordo Fechado' : 'Em Negociação'}</p>
                </div>
                <span className="font-bold text-rose-600 dark:text-rose-400">{formatValue(debt.agreedAmount || debt.targetAmount || debt.currentAmount)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Gestão de acordos</span>
        <button
          onClick={() => onNavigate(View.DEBTS)}
          className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
        >
          <span>Ver Dívidas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
   13. WIDGET: TREINO & SAÚDE
   ========================================================================= */
export const TreinoWidget: React.FC<WidgetCardProps> = ({
  data,
  onNavigate,
  onRemove
}) => {
  const projects = data.workoutProjects || [];
  const routines = data.workoutRoutines || [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Treino & Saúde</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
                  Foco Ativo
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Fichas e projetos de treino da semana</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onNavigate(View.TREINO)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
              title="Abrir Treino"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Ocultar este card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 mt-2">
          {projects.length === 0 && routines.length === 0 ? (
            <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-900/30 text-xs text-slate-400">
              Nenhuma rotina ou projeto de treino ativo. Crie sua ficha de exercícios!
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/30">
              <p className="text-xs font-bold text-slate-800 dark:text-white">
                {projects[0]?.name || routines[0]?.name || 'Treino Ativo'}
              </p>
              <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-0.5">
                {projects[0]?.objective || 'Acompanhamento de séries e repetições'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Fichas e cronômetro</span>
        <button
          onClick={() => onNavigate(View.TREINO)}
          className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
        >
          <span>Abrir Treino</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
   MODAL DE PERSONALIZAÇÃO / ADICIONAR CARDS COM O '+'
   ========================================================================= */
interface DashboardCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWidgetIds: string[];
  onToggleWidget: (id: string) => void;
  onResetToDefault: () => void;
}

export const DashboardCustomizerModal: React.FC<DashboardCustomizerModalProps> = ({
  isOpen,
  onClose,
  activeWidgetIds,
  onToggleWidget,
  onResetToDefault
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('todos');

  if (!isOpen) return null;

  const filtered = filterCategory === 'todos' 
    ? AVAILABLE_WIDGETS 
    : AVAILABLE_WIDGETS.filter(w => w.category === filterCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Personalizar Painel Inicial</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Escolha quais cards você quer ver na tela inicial com dados em tempo real.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-5 pt-3 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-slate-700/60">
          {[
            { id: 'todos', label: 'Todos os Cards' },
            { id: 'financeiro', label: 'Financeiro' },
            { id: 'planejamento', label: 'Produtividade' },
            { id: 'compras', label: 'Compras & Casa' },
            { id: 'saude', label: 'Saúde' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                filterCategory === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Widget Grid / List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {filtered.map(widget => {
            const isActive = activeWidgetIds.includes(widget.id);
            const IconComponent = widget.icon;

            return (
              <div
                key={widget.id}
                onClick={() => onToggleWidget(widget.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isActive
                    ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`p-2.5 rounded-xl ${widget.iconBg} shrink-0`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">{widget.title}</h4>
                      {isActive && (
                        <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-indigo-600 text-white">
                          Ativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{widget.description}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWidget(widget.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 hover:bg-rose-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm shadow-indigo-600/20'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <X className="w-3.5 h-3.5" />
                        <span>Remover</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
          <button
            onClick={onResetToDefault}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Restaurar Padrão
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            Concluir ({activeWidgetIds.length} cards ativos)
          </button>
        </div>
      </div>
    </div>
  );
};
