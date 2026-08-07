
import React, { useState, useEffect, useMemo } from 'react';
import { AppData, Badge, Budget, View, WalletType } from '../types';
import { Wallet, TrendingUp, AlertCircle, Target, Download, Trophy, CheckCheck, Layers, Crown, TrendingDown, Calendar, BarChart3, ShieldAlert, BadgeAlert, Scale, ArrowRight, ArrowLeft, Settings2, CalendarClock, DollarSign, PieChart as PieChartIcon, ChevronDown, Bell, X, Activity, Clock, ArrowDownCircle, StickyNote, CheckCircle2, Circle, Grid, Edit2, Timer, Play, Dumbbell, Apple, Key, ShoppingCart, KeyRound, QrCode, FileText, CheckSquare, CreditCard, Briefcase, Receipt, Repeat, LineChart, Landmark, Package, Sparkles, MessageSquareMore, Settings, LayoutDashboard } from 'lucide-react';

interface DashboardProps {
  data: AppData;
  privacyMode: boolean;
  onUnlockBadge: (id: string) => void;
  onNavigate: (view: View) => void;
  onToggleHabitEntry: (id: string, dayIndex: number, status: 'done' | 'missed', dateStr: string) => void;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

// Gamification Definitions with Progress Logic
const AVAILABLE_BADGES: Badge[] = [
  {
    id: 'first_invest',
    name: 'Investidor Iniciante',
    description: 'Realizou o primeiro investimento.',
    icon: '🌱',
    condition: (d) => d.investments.length > 0,
    getProgress: (d) => d.investments.length > 0 ? 100 : 0
  },
  {
    id: 'controlled',
    name: 'No Controle',
    description: 'Tem mais receitas que despesas no mês.',
    icon: '⚖️',
    condition: (d) => {
      const inc = d.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = d.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return inc > exp && inc > 0;
    },
    getProgress: (d) => {
       const inc = d.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
       const exp = d.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
       if (inc === 0) return 0;
       if (inc > exp) return 100;
       return Math.min(99, (inc / exp) * 100); // Inverse logic purely for progress visual roughly
    }
  },
  {
    id: 'saver',
    name: 'Poupador',
    description: 'Acumulou mais de R$ 5.000 em investimentos.',
    icon: '💰',
    condition: (d) => d.investments.reduce((acc, i) => acc + i.amount, 0) >= 5000,
    getProgress: (d) => Math.min(100, (d.investments.reduce((acc, i) => acc + i.amount, 0) / 5000) * 100)
  },
  {
    id: 'diversified',
    name: 'Mente Diversificada',
    description: 'Investiu em 3 ou mais categorias diferentes.',
    icon: '🎨',
    condition: (d) => {
      const uniqueTypes = new Set(d.investments.map(i => i.type));
      return uniqueTypes.size >= 3;
    },
    getProgress: (d) => {
        const uniqueTypes = new Set(d.investments.map(i => i.type));
        return Math.min(100, (uniqueTypes.size / 3) * 100);
    }
  },
  {
    id: 'debt_free',
    name: 'Zero Pendências',
    description: 'Não possui nenhuma conta pendente.',
    icon: '✅',
    condition: (d) => {
      const hasExpenses = d.transactions.some(t => t.type === 'expense');
      const pending = d.transactions.filter(t => t.type === 'expense' && t.status === 'pending');
      return hasExpenses && pending.length === 0;
    },
    getProgress: (d) => {
        const expenses = d.transactions.filter(t => t.type === 'expense');
        if (expenses.length === 0) return 0;
        const paid = expenses.filter(t => t.status === 'paid').length;
        return Math.min(100, (paid / expenses.length) * 100);
    }
  },
  {
    id: 'goal_hitter',
    name: 'Na Mosca',
    description: 'Atingiu 100% da meta de um investimento.',
    icon: '🎯',
    condition: (d) => d.investments.some(i => i.targetAmount > 0 && i.amount >= i.targetAmount),
    getProgress: (d) => {
        const progresses = d.investments.map(i => i.targetAmount > 0 ? (i.amount / i.targetAmount) * 100 : 0);
        return Math.min(100, Math.max(0, ...progresses));
    }
  },
  {
    id: 'club_10k',
    name: 'Clube dos 10k',
    description: 'Seu montante para aposentadoria superou R$ 10.000.',
    icon: '💎',
    condition: (d) => {
      const totalInvest = d.investments.reduce((acc, i) => acc + i.amount, 0);
      const totalBalance = d.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) -
                           d.transactions.filter(t => t.type === 'expense' && t.status === 'paid').reduce((s, t) => s + t.amount, 0);
      return (totalInvest + totalBalance) >= 10000;
    },
    getProgress: (d) => {
      const totalInvest = d.investments.reduce((acc, i) => acc + i.amount, 0);
      const totalBalance = d.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) -
                           d.transactions.filter(t => t.type === 'expense' && t.status === 'paid').reduce((s, t) => s + t.amount, 0);
      return Math.min(100, ((totalInvest + totalBalance) / 10000) * 100);
    }
  }
];

// Helper to get effective budget for current month
const getEffectiveBudget = (budgets: Budget[], category: string, date: Date) => {
  const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
  // 1. Specific monthly budget
  const specific = budgets.find(b => b.category === category && b.month === monthStr);
  if (specific) return specific;
  // 2. Recurring budget
  return budgets.find(b => b.category === category && b.isRecurring);
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  data, 
  privacyMode, 
  onUnlockBadge, 
  onNavigate, 
  onToggleHabitEntry,
}) => {
  const [activeAppCategory, setActiveAppCategory] = useState<string>('todos');

  const ALL_APPS = useMemo(() => [
    // Financeiro
    { id: View.FINANCEIRO_DASHBOARD, icon: BarChart3, label: 'Visão Geral Financeira', category: 'financeiro', iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', desc: 'Resumo & Gráficos' },
    { id: View.TRANSACTIONS, icon: Receipt, label: 'Transações', category: 'financeiro', iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', desc: 'Extrato e Contas' },
    { id: View.WALLETS, icon: Wallet, label: 'Carteiras & Bancos', category: 'financeiro', iconBg: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400', desc: 'Saldos e Cartões' },
    { id: View.SUBSCRIPTIONS, icon: Repeat, label: 'Assinaturas', category: 'financeiro', iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', desc: 'Contas Recorrentes' },
    { id: View.DEBTS, icon: ShieldAlert, label: 'Dívidas', category: 'financeiro', iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400', desc: 'Negociações' },
    { id: View.INVESTMENTS, icon: LineChart, label: 'Investimentos', category: 'financeiro', iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', desc: 'Carteira & Caixinhas' },
    { id: View.BUDGETS, icon: Target, label: 'Orçamentos', category: 'financeiro', iconBg: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400', desc: 'Limites por Categoria' },
    { id: View.WEALTH_PLANNER, icon: Landmark, label: 'Aposentadoria', category: 'financeiro', iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', desc: 'Simulador Futuro' },
    { id: View.PIX_KEYS, icon: QrCode, label: 'Chaves Pix', category: 'financeiro', iconBg: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400', desc: 'Gerenciar Chaves' },

    // Compras & Casa
    { id: View.SHOPPING_LIST, icon: ShoppingCart, label: 'Lista de Compras', category: 'compras', iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400', desc: 'Mercado & Feira' },
    { id: View.INVENTORY, icon: Package, label: 'Estoque & Despensa', category: 'compras', iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', desc: 'Despensa & Produtos' },
    { id: View.KANBAN, icon: Sparkles, label: 'Sonhos de Consumo', category: 'compras', iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', desc: 'Desejos & Projetos' },

    // Planejamento & Produtividade
    { id: View.PLANEJAMENTO_DASHBOARD, icon: LayoutDashboard, label: 'Visão Geral Planejamento', category: 'planejamento', iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', desc: 'Produtividade' },
    { id: View.CALENDAR, icon: CalendarClock, label: 'Agenda', category: 'planejamento', iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', desc: 'Eventos & Lembretes' },
    { id: View.PRODUCTIVITY, icon: CheckSquare, label: 'Hábitos', category: 'planejamento', iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400', desc: 'Rastreio Diário' },
    { id: View.DAILY_ROUTINES, icon: Clock, label: 'Rotinas Diárias', category: 'planejamento', iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', desc: 'Checklists' },
    { id: View.NOTES, icon: StickyNote, label: 'NEXO Notes', category: 'planejamento', iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', desc: 'Bloco de Anotações' },
    { id: View.WORK_GOALS, icon: Briefcase, label: 'Metas de Trabalho', category: 'planejamento', iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', desc: 'Horas & Progresso' },
    { id: View.PASSWORDS, icon: KeyRound, label: 'Cofre de Senhas', category: 'planejamento', iconBg: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300', desc: 'Segurança' },

    // Saúde & IA
    { id: View.SAUDE_DASHBOARD, icon: Activity, label: 'Visão Geral Saúde', category: 'saude', iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400', desc: 'Resumo de Saúde' },
    { id: View.TREINO, icon: Dumbbell, label: 'Treino & Saúde', category: 'saude', iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', desc: 'Exercícios & Ficha' },
    { id: View.AI_ASSISTANT, icon: MessageSquareMore, label: 'Assistente IA', category: 'saude', iconBg: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400', desc: 'Inteligência Nexo' },

    // Configurações
    { id: View.SETTINGS, icon: Settings, label: 'Configurações', category: 'todos', iconBg: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300', desc: 'Preferências & Dados' },
  ], []);

  const filteredApps = useMemo(() => {
    if (activeAppCategory === 'todos') return ALL_APPS;
    return ALL_APPS.filter(app => app.category === activeAppCategory);
  }, [ALL_APPS, activeAppCategory]);
  
  // Greeting Logic
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  // Check Badges Effect
  useEffect(() => {
    AVAILABLE_BADGES.forEach(badge => {
      if (!data.unlockedBadges.includes(badge.id) && badge.condition(data)) {
        onUnlockBadge(badge.id);
      }
    });
  }, [data, onUnlockBadge]);

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Late bills (Contas atrasadas - estritamente antes de hoje)
  const lateBills = useMemo(() => {
    return (data.transactions || []).filter(t => t.status === 'pending' && t.date < todayStr);
  }, [data.transactions, todayStr]);

  // Today bills (Contas a vencer/receber hoje)
  const todayBills = useMemo(() => {
    return (data.transactions || []).filter(t => t.status === 'pending' && t.date === todayStr);
  }, [data.transactions, todayStr]);

  // --- NUDGES LOGIC ---
  const nudges = useMemo(() => {
    const alerts: { title: string; message: string; type: 'warning' | 'info' }[] = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Unique categories present in budgets
    const budgetCategories = Array.from(new Set<string>(data.budgets.map((b: Budget) => b.category)));

    // Only check if before the 25th to be a useful "mid-month" warning
    if (today.getDate() <= 25) {
        budgetCategories.forEach(cat => {
            const budget = getEffectiveBudget(data.budgets, cat, today);
            if (!budget) return;

            const spent = data.transactions
                .filter(t => 
                    t.type === 'expense' && 
                    t.category === cat && 
                    new Date(t.date).getMonth() === currentMonth &&
                    new Date(t.date).getFullYear() === currentYear
                )
                .reduce((sum, t) => sum + t.amount, 0);
            
            if (spent >= budget.limit * 0.8 && spent < budget.limit) {
                alerts.push({
                    title: `Atenção: ${cat}`,
                    message: `Você já usou ${(spent/budget.limit*100).toFixed(0)}% do orçamento e ainda é dia ${today.getDate()}. Cuidado!`,
                    type: 'warning'
                });
            } else if (spent >= budget.limit) {
                 alerts.push({
                    title: `Limite Excedido: ${cat}`,
                    message: `Você estourou o teto definido para esta categoria.`,
                    type: 'warning'
                });
            }
        });
    }

    return alerts;
  }, [data.budgets, data.transactions]);

  // --- NOTES WIDGET LOGIC ---
  const pinnedNotes = useMemo(() => {
      return data.notes
        .sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        })
        .slice(0, 3); // Increased from 2 to 3 to fill space
  }, [data.notes]);

  // Helper to mask values
  const formatValue = (val: number) => {
    if (privacyMode) return '••••';
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  // Calculations
  const creditWalletIds = useMemo(() => new Set((data.wallets || []).filter(w => w.type === WalletType.CREDIT_CARD).map(w => w.id)), [data.wallets]);
  const mealWalletIds = useMemo(() => new Set((data.wallets || []).filter(w => w.type === WalletType.MEAL_TICKET).map(w => w.id)), [data.wallets]);
  const dashboardTxs = useMemo(() => data.transactions.filter(t => !t.walletId || !mealWalletIds.has(t.walletId)), [data.transactions, mealWalletIds]);

  const totalIncome = dashboardTxs.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = dashboardTxs.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = dashboardTxs.filter(t => t.type === 'expense' && t.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
  
  const currentMonthPendingExpense = dashboardTxs
      .filter(t => {
          if (t.status !== 'pending' || t.type !== 'expense') return false;
          const tDate = new Date(t.date);
          const today = new Date();
          return tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
      })
      .reduce((acc, t) => acc + t.amount, 0);
  
  // Saldo real e unificado
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
  
  // 3. Calcula APENAS a SOMA das ENTRADAS pendentes (conforme solicitado)
  const pendingIncome = dashboardTxs
      .filter(t => t.status === 'pending' && t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

  const currentMonthPendingIncome = dashboardTxs
      .filter(t => {
          if (t.status !== 'pending' || t.type !== 'income') return false;
          const tDate = new Date(t.date);
          const today = new Date();
          return tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
      })
      .reduce((acc, t) => acc + t.amount, 0);

  // 4. Calcula Total Pago (Total Despesas - Total Pendente)
  const totalPaidExpenses = totalExpense - totalPending;

  const totalInvested = data.investments.reduce((acc, curr) => acc + curr.amount, 0);

  // --- RESUMO DO DIA LOGIC ---
  const dailySummary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);

    // 1. Contas de Hoje
    const pendingToday = data.transactions.filter(t => {
      if (t.type !== 'expense' || t.status !== 'pending') return false;
      const tDate = new Date(t.date);
      tDate.setHours(0, 0, 0, 0);
      return tDate.getTime() === today.getTime();
    });
    
    // 2. Contas de Amanhã
    const pendingTomorrow = data.transactions.filter(t => {
      if (t.type !== 'expense' || t.status !== 'pending') return false;
      const tDate = new Date(t.date);
      tDate.setHours(0, 0, 0, 0);
      return tDate.getTime() === tomorrow.getTime();
    });

    // 3. Hábitos Pendentes Hoje
    let pendingHabitsCount = 0;
    if (data.habits) {
        data.habits.forEach(h => {
             if (!h.startDate) return;
             const start = new Date(h.startDate);
             start.setHours(0,0,0,0);
             const diffTime = today.getTime() - start.getTime();
             const dayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24));
             if (dayIndex >= 0 && dayIndex < h.targetDays) {
                 const entry = h.entries ? h.entries[dayIndex] : undefined;
                 if (!entry || entry.status !== 'done') {
                     pendingHabitsCount++;
                 }
             }
        });
    }

    // 4. Workflow / Kanban
    let delayedTasks = 0;
    let dueTodayTasks = 0;
    if (data.kanbanBoards) {
        data.kanbanBoards.forEach(board => {
            board.columns.forEach(col => {
                if (!col.isConclusion) {
                    col.cards.forEach(card => {
                        if (card.dueDate) {
                            const due = new Date(card.dueDate);
                            due.setHours(0,0,0,0);
                            if (due.getTime() < today.getTime()) delayedTasks++;
                            else if (due.getTime() === today.getTime()) dueTodayTasks++;
                        }
                    });
                }
            });
        });
    }

    // 5. Metas de Trabalho
    const workGoalsList = data.workGoals || [];
    const pendingWorkGoalsCount = workGoalsList.filter(g => g.completedHours < g.targetHours).length;

    return {
       pendingToday,
       totalPendingToday: pendingToday.reduce((acc, t) => acc + t.amount, 0),
       pendingTomorrow,
       pendingHabitsCount,
       delayedTasks,
       dueTodayTasks,
       pendingWorkGoalsCount
    };
  }, [data.transactions, data.habits, data.kanbanBoards, data.workGoals]);

  // --- NEW: Detailed Metrics for Cards ---

  // 1. Upcoming Bills (Next 3)
  const upcomingBills = useMemo(() => {
    const pending = data.transactions.filter(t => t.type === 'expense' && t.status === 'pending');
    // Sort by date (asc)
    return pending.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3);
  }, [data.transactions]);

  const lateBillsCount = useMemo(() => {
    return data.transactions.filter(t => t.status === 'pending' && t.date < todayStr).length;
  }, [data.transactions, todayStr]);

  // 2. Top Investments (Top 3 by Amount)
  const topInvestments = useMemo(() => {
    return [...data.investments].sort((a, b) => b.amount - a.amount).slice(0, 3);
  }, [data.investments]);

  // 3. Runway (Months of Survival)
  const financialRunway = useMemo(() => {
     const monthlyBurn = totalExpense > 0 ? totalExpense : (totalIncome * 0.5) || 1000; 
     return currentBalance / monthlyBurn;
  }, [currentBalance, totalExpense, totalIncome]);


  // --- COMPLEX HEALTH SCORE ALGORITHM ---
  const { healthScore, scoreLabel, scoreColor, factors } = useMemo(() => {
    let score = 0;
    const factorsList: { text: string; type: 'good' | 'bad' | 'neutral' }[] = [];
    
    // 1. Debt Check
    const isPrescribed = (dueDateStr: string) => {
        const due = new Date(dueDateStr);
        const now = new Date();
        const diffYears = (now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        return diffYears >= 5;
    };
    const activeDebts = data.debts.filter(d => (d.status === 'open' || d.status === 'negotiating') && !isPrescribed(d.dueDate));
    const hasDirtyName = activeDebts.length > 0;
    
    if (hasDirtyName) {
        score += 200;
        factorsList.push({ text: `Negativado: ${activeDebts.length} dívidas`, type: 'bad' });
    } else {
        score += 350;
        factorsList.push({ text: "Nome Limpo", type: 'good' });
    }

    // 2. Liquidity
    const monthlyBurnRate = totalExpense > 0 ? totalExpense : 1000;
    const monthsCoverage = totalInvested / monthlyBurnRate;

    if (monthsCoverage >= 6) { score += 200; factorsList.push({ text: "Reserva Robusta", type: 'good' }); }
    else if (monthsCoverage >= 1) { score += 100; factorsList.push({ text: "Reserva Iniciada", type: 'neutral' }); }
    else { factorsList.push({ text: "Sem Reserva", type: 'bad' }); }

    // 3. Savings Rate
    const cashFlow = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? cashFlow / totalIncome : 0;
    if (savingsRate >= 0.20) { score += 150; factorsList.push({ text: "Poupador (20%+)", type: 'good' }); }
    else if (savingsRate < 0) { score -= 50; factorsList.push({ text: "Déficit Mensal", type: 'bad' }); }

    // 4. Solvency
    if (currentBalance >= totalPending) score += 150;
    else { score -= 100; factorsList.push({ text: "Risco de Calote", type: 'bad' }); }

    // Caps
    if (hasDirtyName) score = Math.min(score, 550);
    score = Math.max(0, Math.min(1000, Math.round(score)));

    let sLabel = '', sColor = '';
    if (score >= 850) { sLabel = 'Elite'; sColor = 'text-emerald-500'; }
    else if (score >= 700) { sLabel = 'Excelente'; sColor = 'text-emerald-600'; }
    else if (score >= 500) { sLabel = 'Regular'; sColor = 'text-amber-500'; }
    else if (score >= 300) { sLabel = 'Ruim'; sColor = 'text-orange-500'; }
    else { sLabel = 'Crítico'; sColor = 'text-rose-600'; }

    return { healthScore: score, scoreLabel: sLabel, scoreColor: sColor, factors: factorsList };
  }, [data.debts, totalIncome, totalExpense, totalPending, currentBalance, totalInvested]);

  const priorityDebts = useMemo(() => {
    const agreements = data.debts.filter(d => d.status === 'agreement');
    const others = data.debts.filter(d => d.status !== 'agreement' && d.status !== 'paid');
    return [...agreements, ...others].slice(0, 2);
  }, [data.debts]);

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Data,Descricao,Categoria,Tipo,Valor,Status\n"
      + data.transactions.map(e => `${e.date},${e.description},${e.category},${e.type},${e.amount},${e.status}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "finansmart_relatorio.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="space-y-6 animate-fade-in">
      {/* LATE BILLS ALERT BANNER */}
      {lateBills.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-rose-800 dark:text-rose-300 text-sm">Atenção: Contas Atrasadas</h3>
              <p className="text-rose-700 dark:text-rose-400/80 text-xs mt-0.5 font-medium">
                Você possui {lateBills.length} {lateBills.length === 1 ? 'conta atrasada' : 'contas atrasadas'} pendentes de pagamento.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate(View.TRANSACTIONS)}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/20"
          >
            <span>Ver Contas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TODAY BILLS ALERT BANNER */}
      {todayBills.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-amber-800 dark:text-amber-300 text-sm">Atenção: Contas para Hoje</h3>
              <p className="text-amber-700 dark:text-amber-400/80 text-xs mt-0.5 font-medium">
                Você possui {todayBills.length} {todayBills.length === 1 ? 'conta' : 'contas'} a pagar ou receber hoje.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate(View.TRANSACTIONS)}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-600/20"
          >
            <span>Ver Contas de Hoje</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* NUDGES / ALERTS AREA */}
      {nudges.length > 0 && (
         <div className="space-y-2">
            {nudges.map((nudge, idx) => (
               <div key={idx} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-start gap-3 animate-fade-in-down">
                  <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded-full flex-shrink-0">
                     <Bell className="w-5 h-5 text-amber-600 dark:text-amber-300" />
                  </div>
                  <div>
                     <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm">{nudge.title}</h4>
                     <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">{nudge.message}</p>
                  </div>
               </div>
            ))}
         </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
         <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:flex-1 min-w-0">
             <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white whitespace-nowrap">{greeting}!</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Visão geral das suas finanças.</p>
             </div>

             {/* Badge Strip (Header) */}
             <div className="flex-1 flex items-center gap-2 px-4 py-2 sm:border-l sm:border-slate-300 dark:sm:border-slate-600 overflow-x-auto no-scrollbar mask-gradient w-full">
                {AVAILABLE_BADGES.map(badge => {
                   const isUnlocked = data.unlockedBadges.includes(badge.id);
                   const progress = badge.getProgress(data);
                   return (
                      <div 
                        key={badge.id} 
                        className="group relative flex-shrink-0 cursor-help"
                      >
                         {/* Badge Icon */}
                         <div className="relative">
                            <span 
                                className={`text-xl md:text-2xl transition-all duration-300 block ${isUnlocked ? 'filter-none opacity-100 scale-100' : 'grayscale opacity-30 scale-90'}`}
                            >
                                {badge.icon}
                            </span>
                            
                            {/* Mini Progress Bar for Locked Badges */}
                            {!isUnlocked && progress > 0 && (
                                <div className="absolute -bottom-1 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-500 rounded-full" 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            )}
                         </div>
                         
                         {/* Visual Tooltip */}
                         <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-max max-w-[180px] hidden group-hover:block z-50 pointer-events-none animate-fade-in">
                            <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-xl text-center border border-slate-700">
                               <p className="font-bold mb-0.5">{badge.name}</p>
                               <p className="opacity-80 mb-2">{badge.description}</p>
                               
                               <div className="flex items-center justify-between text-[10px] uppercase font-semibold">
                                  <span className={isUnlocked ? 'text-emerald-400' : 'text-slate-400'}>
                                     {isUnlocked ? 'Desbloqueado' : `${progress.toFixed(0)}% Concluído`}
                                  </span>
                               </div>
                               {!isUnlocked && (
                                   <div className="w-full h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                       <div className="h-full bg-indigo-500 transition-all duration-500" style={{width: `${progress}%`}}></div>
                                   </div>
                               )}
                            </div>
                            {/* Arrow */}
                            <div className="w-2 h-2 bg-slate-800 rotate-45 absolute -top-1 left-1/2 -translate-x-1/2 border-t border-l border-slate-700"></div>
                         </div>
                      </div>
                   )
                })}
             </div>
         </div>

        <div className="flex items-center gap-3 self-end md:self-auto flex-shrink-0">
          <button 
            onClick={exportData}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* --- Credit Cards removed for space --- */}

      {/* --- RESUMO DE HOJE --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {/* Contas de Hoje */}
          <div 
             onClick={() => onNavigate(View.TRANSACTIONS)}
             className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all flex items-center gap-3"
          >
             <div className={`p-2 rounded-lg ${dailySummary.pendingToday.length > 0 ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                <AlertCircle className="w-5 h-5" />
             </div>
             <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contas Hoje</p>
                <p className="text-lg font-black text-slate-800 dark:text-white truncate">
                   {dailySummary.pendingToday.length > 0 ? formatValue(dailySummary.totalPendingToday) : 'Em dia'}
                </p>
             </div>
          </div>
          
          {/* Faltando Hábitos */}
          <div 
             onClick={() => onNavigate(View.PRODUCTIVITY)}
             className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all flex items-center gap-3"
          >
             <div className={`p-2 rounded-lg ${dailySummary.pendingHabitsCount > 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                <Target className="w-5 h-5" />
             </div>
             <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Hábitos</p>
                <p className="text-lg font-black text-slate-800 dark:text-white truncate">
                   {dailySummary.pendingHabitsCount > 0 ? `${dailySummary.pendingHabitsCount} pendentes` : 'Concluído'}
                </p>
             </div>
          </div>

          {/* Amanhã */}
          <div
             onClick={() => onNavigate(View.TRANSACTIONS)}
             className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all flex items-center gap-3"
          >
             <div className={`p-2 rounded-lg ${dailySummary.pendingTomorrow.length > 0 ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                <Clock className="w-5 h-5" />
             </div>
             <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Amanhã</p>
                <p className="text-lg font-black text-slate-800 dark:text-white truncate">
                   {dailySummary.pendingTomorrow.length > 0 ? `${dailySummary.pendingTomorrow.length} contas` : 'Livre'}
                </p>
             </div>
          </div>

          {/* Tarefas */}
          <div
             onClick={() => onNavigate(View.KANBAN)}
             className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all flex items-center gap-3"
          >
             <div className={`p-2 rounded-lg ${(dailySummary.delayedTasks > 0 || dailySummary.dueTodayTasks > 0) ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                <CheckSquare className="w-5 h-5" />
             </div>
             <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tarefas</p>
                <p className="text-lg font-black text-slate-800 dark:text-white truncate">
                   {dailySummary.delayedTasks > 0 ? `${dailySummary.delayedTasks} atrasadas` : dailySummary.dueTodayTasks > 0 ? `${dailySummary.dueTodayTasks} hoje` : 'Em dia'}
                </p>
             </div>
          </div>

          {/* Metas de Trabalho */}
          <div
             onClick={() => onNavigate(View.WORK_GOALS)}
             className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all flex items-center gap-3"
          >
             <div className={`p-2 rounded-lg ${dailySummary.pendingWorkGoalsCount > 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                <Briefcase className="w-5 h-5" />
             </div>
             <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Metas Trabalho</p>
                <p className="text-lg font-black text-slate-800 dark:text-white truncate">
                   {dailySummary.pendingWorkGoalsCount > 0 ? `${dailySummary.pendingWorkGoalsCount} ativas` : 'Concluídas'}
                </p>
             </div>
          </div>
      </div>

      {/* --- MEUS APLICATIVOS --- */}
      <div className="space-y-4 pt-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Meus Aplicativos</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Acesso rápido a todos os módulos do NEXO Smart Life Planner.</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
                  {[
                      { id: 'todos', label: 'Todos', count: ALL_APPS.length },
                      { id: 'financeiro', label: 'Financeiro', count: ALL_APPS.filter(a => a.category === 'financeiro').length },
                      { id: 'compras', label: 'Compras', count: ALL_APPS.filter(a => a.category === 'compras').length },
                      { id: 'planejamento', label: 'Planejamento', count: ALL_APPS.filter(a => a.category === 'planejamento').length },
                      { id: 'saude', label: 'Saúde & IA', count: ALL_APPS.filter(a => a.category === 'saude').length },
                  ].map(cat => (
                      <button
                          key={cat.id}
                          onClick={() => setActiveAppCategory(cat.id)}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                              activeAppCategory === cat.id
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
                          }`}
                      >
                          <span>{cat.label}</span>
                          <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                              activeAppCategory === cat.id ? 'bg-indigo-500/80 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                          }`}>
                              {cat.count}
                          </span>
                      </button>
                  ))}
              </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredApps.map(app => (
                  <div 
                      key={app.id} 
                      onClick={() => onNavigate(app.id as View)}
                      className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80 cursor-pointer hover:shadow-md hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all flex items-center gap-3 group"
                  >
                      <div className={`p-2.5 rounded-xl ${app.iconBg} group-hover:scale-110 transition-transform shrink-0`}>
                          <app.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{app.label}</p>
                          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">{app.desc}</p>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};