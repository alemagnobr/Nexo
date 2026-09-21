
import React, { useState, useEffect, useMemo } from 'react';
import { Budget, Transaction, Investment, View, Category } from '../types';
import { Plus, Trash2, Target, AlertTriangle, CheckCircle, Edit2, AlertCircle, ChevronLeft, Calendar, ChevronRight, Repeat, CalendarClock, Info, TrendingUp, BarChart3, ArrowRight, Save, X, Ghost, Medal, LineChart, PiggyBank, Sparkles, Coins, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { CurrencyInput } from './CurrencyInput';

interface BudgetListProps {
  budgets: Budget[];
  transactions: Transaction[];
  investments: Investment[];
  onAdd: (budget: Omit<Budget, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Budget>) => void;
  onDelete: (id: string) => void;
  onNavigate: (view: View) => void;
  privacyMode: boolean;
  quickActionSignal?: number; // Prop to trigger form open
}

export const BudgetList: React.FC<BudgetListProps> = ({ budgets, transactions, investments, onAdd, onUpdate, onDelete, onNavigate, privacyMode, quickActionSignal }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Dynamic categories derived from transactions + defaults or passed as props
  const knownCategories = useMemo(() => {
      const cats = new Set<string>();
      transactions.forEach(t => cats.add(t.category));
      budgets.forEach(b => cats.add(b.category));
      // Add default if empty
      if (cats.size === 0) return ['Lazer', 'Casa', 'Alimentos'];
      return Array.from(cats).sort();
  }, [transactions, budgets]);

  // Date Navigation State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Inline Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const [newBudget, setNewBudget] = useState<{
    type: 'expense' | 'investment';
    category: string;
    targetInvestmentId: string;
    limit: string;
    isRecurring: boolean;
    month: string;
  }>({
    type: 'expense',
    category: knownCategories[0] || 'Lazer',
    targetInvestmentId: 'ALL',
    limit: '',
    isRecurring: true,
    month: new Date().toISOString().slice(0, 7) // YYYY-MM
  });

  // Effect to listen for Quick Action triggers
  useEffect(() => {
    if (quickActionSignal && Date.now() - quickActionSignal < 2000) {
        setIsFormOpen(true);
        setNewBudget({ 
            type: 'expense',
            category: knownCategories[0] || 'Lazer', 
            targetInvestmentId: 'ALL',
            limit: '', 
            isRecurring: true, 
            month: new Date().toISOString().slice(0, 7) 
        });
    }
  }, [quickActionSignal, knownCategories]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  // Format month for display (e.g., "Janeiro 2024")
  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };
  
  // Format month for key (e.g., "2024-01")
  const getCurrentMonthKey = () => {
     const y = currentDate.getFullYear();
     const m = String(currentDate.getMonth() + 1).padStart(2, '0');
     return `${y}-${m}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const budgetType = newBudget.type || 'expense';
    let categoryName = newBudget.category;

    if (budgetType === 'investment') {
      if (newBudget.targetInvestmentId && newBudget.targetInvestmentId !== 'ALL') {
        const inv = investments.find(i => i.id === newBudget.targetInvestmentId);
        categoryName = inv ? inv.name : 'Investimento';
      } else {
        categoryName = 'Investimentos (Geral)';
      }
    }

    const numLimit = parseFloat(newBudget.limit);
    if (isNaN(numLimit) || numLimit <= 0) {
      alert('Informe um valor de teto/meta maior que zero.');
      return;
    }

    // Check conflicts
    if (newBudget.isRecurring) {
        if (budgets.some(b => b.category === categoryName && b.isRecurring && (b.type || 'expense') === budgetType)) {
            alert(`Já existe um orçamento recorrente para ${categoryName}. Exclua o anterior para criar um novo.`);
            return;
        }
    } else {
        if (budgets.some(b => b.category === categoryName && b.month === newBudget.month && (b.type || 'expense') === budgetType)) {
            alert(`Já existe um orçamento de ${categoryName} para ${newBudget.month}.`);
            return;
        }
    }

    const payload: Omit<Budget, 'id'> = {
      category: categoryName,
      limit: numLimit,
      isRecurring: newBudget.isRecurring,
      type: budgetType,
      targetInvestmentId: budgetType === 'investment' ? newBudget.targetInvestmentId : undefined,
    };

    if (!newBudget.isRecurring) {
        payload.month = newBudget.month;
    }

    onAdd(payload);
    setNewBudget({
      type: 'expense',
      category: knownCategories[0] || 'Outros',
      targetInvestmentId: 'ALL',
      limit: '',
      isRecurring: true,
      month: getCurrentMonthKey()
    });
    setIsFormOpen(false);
  };

  const handleSaveEdit = (id: string) => {
      const val = parseFloat(editValue);
      if (!isNaN(val) && val > 0) {
          onUpdate(id, { limit: val });
      }
      setEditingId(null);
  };

  const startEditing = (budget: Budget) => {
      setEditingId(budget.id);
      setEditValue(budget.limit.toString());
  };

  const formatValue = (val: number) => {
    if (privacyMode) return '••••';
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const getSpentAmount = (category: string) => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return (
          t.type === 'expense' &&
          t.category === category &&
          tDate.getMonth() === m &&
          tDate.getFullYear() === y
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Helper para calcular total aportado em uma Meta de Investimento no mês selecionado
  const getInvestedAmount = (budget: Budget) => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();

    let totalFromInvestments = 0;

    if (budget.targetInvestmentId && budget.targetInvestmentId !== 'ALL') {
      const inv = investments.find(i => i.id === budget.targetInvestmentId);
      if (inv && inv.history) {
        totalFromInvestments = inv.history
          .filter(h => {
            if (h.type !== 'contribution') return false;
            const hDate = new Date(h.date);
            return hDate.getFullYear() === y && hDate.getMonth() === m;
          })
          .reduce((sum, h) => sum + h.amount, 0);
      }
    } else {
      // Todos os investimentos
      totalFromInvestments = investments.reduce((sum, inv) => {
        if (!inv.history) return sum;
        const contribs = inv.history
          .filter(h => {
            if (h.type !== 'contribution') return false;
            const hDate = new Date(h.date);
            return hDate.getFullYear() === y && hDate.getMonth() === m;
          })
          .reduce((s, h) => s + h.amount, 0);
        return sum + contribs;
      }, 0);
    }

    // Transações no mês vinculadas a aportes ou com a mesma categoria
    const matchingTransactions = transactions
      .filter(t => {
        const tDate = new Date(t.date);
        if (tDate.getFullYear() !== y || tDate.getMonth() !== m) return false;
        if (t.type !== 'expense') return false;

        if (budget.targetInvestmentId && budget.targetInvestmentId !== 'ALL') {
          const inv = investments.find(i => i.id === budget.targetInvestmentId);
          const invName = inv ? inv.name.toLowerCase() : '';
          return (
            t.category === budget.category ||
            (invName && (t.description?.toLowerCase().includes(invName) || t.observation?.toLowerCase()?.includes(invName)))
          );
        }

        const catLower = (t.category || '').toLowerCase();
        return (
          t.category === budget.category ||
          catLower === 'investimentos' ||
          catLower === 'investimento' ||
          catLower === 'aportes' ||
          catLower === 'aporte'
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    return Math.max(totalFromInvestments, matchingTransactions);
  };

  const effectiveBudgets = useMemo(() => {
     const monthKey = getCurrentMonthKey();
     const specific = budgets.filter(b => b.month === monthKey);
     const specificKeys = new Set(specific.map(b => `${b.category}_${b.type || 'expense'}`));
     const recurring = budgets.filter(b => b.isRecurring && !specificKeys.has(`${b.category}_${b.type || 'expense'}`));
     return [...specific, ...recurring].sort((a, b) => a.category.localeCompare(b.category));
  }, [budgets, currentDate]);

  const expenseBudgets = useMemo(() => {
    return effectiveBudgets.filter(b => (b.type || 'expense') === 'expense');
  }, [effectiveBudgets]);

  const investmentBudgets = useMemo(() => {
    return effectiveBudgets.filter(b => b.type === 'investment');
  }, [effectiveBudgets]);

  // Resumo consolidado das Metas de Investimento do Mês
  const investmentTotals = useMemo(() => {
    let totalTarget = 0;
    let totalInvested = 0;

    investmentBudgets.forEach(b => {
      totalTarget += b.limit;
      totalInvested += getInvestedAmount(b);
    });

    const remaining = Math.max(0, totalTarget - totalInvested);
    const percentage = totalTarget > 0 ? (totalInvested / totalTarget) * 100 : 0;
    const isCompleted = totalTarget > 0 && totalInvested >= totalTarget;

    return { totalTarget, totalInvested, remaining, percentage, isCompleted };
  }, [investmentBudgets, investments, transactions, currentDate]);

  // Goals (Investments with Target)
  const investmentGoals = useMemo(() => {
      return investments
        .filter(i => i.targetAmount > 0)
        .sort((a, b) => {
            const progressA = a.amount / a.targetAmount;
            const progressB = b.amount / b.targetAmount;
            return progressB - progressA;
        });
  }, [investments]);

  // FORECASTING HELPER
  const calculateForecast = (spent: number) => {
      const today = new Date();
      // Only forecast if looking at current month
      if (today.getMonth() !== currentDate.getMonth() || today.getFullYear() !== currentDate.getFullYear()) {
          return null;
      }
      
      const day = today.getDate();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      
      if (day === 1) return spent; // Too early
      
      const dailyAverage = spent / day;
      return dailyAverage * daysInMonth;
  };

  // --- ANALYTICS LOGIC ---
  const performanceData = useMemo(() => {
    const stats = new Map<string, { totalSpent: number, totalLimit: number, count: number }>();
    const today = new Date();
    for (let i = 0; i < 6; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;

        const activeCategories = new Set<string>(transactions
            .filter(t => {
                const tDate = new Date(t.date);
                return t.type === 'expense' && tDate.getFullYear() === y && tDate.getMonth() === m;
            })
            .map(t => t.category)
        );

        activeCategories.forEach((cat) => {
            let budget = budgets.find(b => b.category === cat && b.month === monthKey);
            if (!budget) budget = budgets.find(b => b.category === cat && b.isRecurring);

            if (budget) {
                const spent = transactions
                    .filter(t => {
                        const tDate = new Date(t.date);
                        return t.type === 'expense' && t.category === cat && tDate.getFullYear() === y && tDate.getMonth() === m;
                    })
                    .reduce((s, t) => s + t.amount, 0);
                
                const current = stats.get(cat) || { totalSpent: 0, totalLimit: 0, count: 0 };
                stats.set(cat, {
                    totalSpent: current.totalSpent + spent,
                    totalLimit: current.totalLimit + budget.limit,
                    count: current.count + 1
                });
            }
        });
    }

    const chartData = Array.from(stats.entries()).map(([cat, data]) => {
        const avgAdherence = (data.totalSpent / data.totalLimit) * 100;
        return {
            name: cat,
            adherence: avgAdherence,
            spent: data.totalSpent / data.count, 
            limit: data.totalLimit / data.count
        };
    });

    return chartData.sort((a, b) => b.adherence - a.adherence);
  }, [budgets, transactions]);


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Planejamento</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm capitalize">Defina limites e acompanhe suas metas.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
             <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`p-2.5 rounded-lg transition-colors border ${showAnalytics ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                title="Ver Análise de Performance"
             >
                <BarChart3 className="w-5 h-5" />
             </button>

             {/* Month Selector */}
            <div className="flex items-center bg-indigo-50 dark:bg-indigo-900/30 rounded-xl shadow-sm border border-indigo-200 dark:border-indigo-800 p-1 h-full">
                <button onClick={handlePrevMonth} className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-colors rounded-lg text-indigo-700 dark:text-indigo-400">
                <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="px-3 text-sm font-black text-indigo-800 dark:text-indigo-300 min-w-[90px] text-center flex items-center justify-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500 hidden md:block" />
                {currentDate.toLocaleDateString('pt-BR', { month: 'long' }).charAt(0).toUpperCase() + currentDate.toLocaleDateString('pt-BR', { month: 'long' }).slice(1)}/{currentDate.getFullYear().toString().slice(-2)}
                </div>
                <button onClick={handleNextMonth} className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-colors rounded-lg text-indigo-700 dark:text-indigo-400">
                <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            <button
            onClick={() => {
                setNewBudget(prev => ({...prev, month: getCurrentMonthKey()}));
                setIsFormOpen(!isFormOpen);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-indigo-600 text-white px-4 py-2.5 rounded-lg hover:from-pink-700 hover:to-indigo-700 transition-all shadow-sm text-sm font-medium"
            >
            <Plus className="w-4 h-4" />
            Novo Teto ou Meta
            </button>
        </div>
      </div>

      {/* ANALYTICS PANEL */}
      {showAnalytics && performanceData.length > 0 && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 animate-fade-in-down mb-6">
              <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-500" />
                      Performance Histórica (Últimos 6 Meses)
                  </h3>
              </div>
              <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={100} 
                            tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} 
                            axisLine={false}
                            tickLine={false}
                          />
                          <RechartsTooltip 
                              cursor={{fill: 'transparent'}}
                              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                              formatter={(val: number) => [`${val.toFixed(0)}%`, 'Média de Uso']}
                          />
                          <ReferenceLine x={100} stroke="#ef4444" strokeDasharray="3 3" />
                          <Bar dataKey="adherence" radius={[0, 4, 4, 0]} barSize={20}>
                              {performanceData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.adherence > 100 ? '#ef4444' : entry.adherence > 85 ? '#f59e0b' : '#10b981'} />
                              ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      )}

      {/* CARD CONSOLIDADO DE METAS DE INVESTIMENTO DO MÊS */}
      {investmentBudgets.length > 0 && (
        <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/40 dark:via-teal-950/20 border border-emerald-200 dark:border-emerald-800/60 shadow-sm animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                <PiggyBank className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Meta de Aportes do Mês
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 capitalize">
                    {formatMonth(currentDate)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {investmentTotals.isCompleted ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Parabéns! Você bateu sua meta de aportes este mês.
                    </span>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-300">
                      🎯 Faltam <strong>{formatValue(investmentTotals.remaining)}</strong> para bater a meta planejada.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6 justify-between md:justify-end">
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Aportado / Meta</p>
                <p className="text-base md:text-lg font-black text-slate-900 dark:text-white">
                  <span className="text-emerald-600 dark:text-emerald-400">{formatValue(investmentTotals.totalInvested)}</span>
                  <span className="text-slate-400 dark:text-slate-500 text-sm font-normal"> / {formatValue(investmentTotals.totalTarget)}</span>
                </p>
              </div>
              <button
                onClick={() => onNavigate(View.INVESTMENTS)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap"
              >
                Fazer Aporte <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              <span>Progresso dos Aportes</span>
              <span className={investmentTotals.isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}>
                {investmentTotals.percentage.toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  investmentTotals.isCompleted
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, investmentTotals.percentage)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-down">
          {/* Aba de seleção: Limite de Gastos vs Meta de Investimento */}
          <div className="col-span-1 md:col-span-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Tipo de Planejamento</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setNewBudget(prev => ({ ...prev, type: 'expense', category: knownCategories[0] || 'Lazer' }))}
                className={`py-2 px-3 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  newBudget.type === 'expense'
                    ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                Teto de Gastos (Despesas)
              </button>
              <button
                type="button"
                onClick={() => setNewBudget(prev => ({ ...prev, type: 'investment', targetInvestmentId: 'ALL', category: 'Investimentos (Geral)' }))}
                className={`py-2 px-3 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  newBudget.type === 'investment'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PiggyBank className="w-4 h-4" />
                Meta de Investimento (Aporte)
              </button>
            </div>
          </div>

          {newBudget.type === 'expense' ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Categoria de Despesa</label>
              <select
                value={newBudget.category}
                onChange={e => setNewBudget({ ...newBudget, category: e.target.value })}
                className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-pink-500"
              >
                {knownCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Destino do Aporte / Ativo</label>
              <select
                value={newBudget.targetInvestmentId}
                onChange={e => {
                  const targetId = e.target.value;
                  const inv = investments.find(i => i.id === targetId);
                  setNewBudget({
                    ...newBudget,
                    targetInvestmentId: targetId,
                    category: targetId === 'ALL' ? 'Investimentos (Geral)' : (inv?.name || 'Investimento')
                  });
                }}
                className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="ALL">🌟 Todos os Investimentos (Meta Geral de Aportes)</option>
                {investments.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    💼 {inv.name} - {inv.type} (Saldo: R$ {inv.amount.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
             <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
               {newBudget.type === 'expense' ? 'Valor Teto de Gastos (R$)' : 'Meta de Aporte Mensal (R$)'}
             </label>
             <CurrencyInput
                required
                placeholder={newBudget.type === 'expense' ? 'Ex: 1000.00' : 'Ex: 500.00'}
                value={newBudget.limit}
                onChangeValue={val => setNewBudget({ ...newBudget, limit: val })}
                className={`border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 ${
                  newBudget.type === 'expense' ? 'focus:ring-pink-500' : 'focus:ring-emerald-500'
                }`}
              />
          </div>

          {newBudget.type === 'investment' && (
            <div className="col-span-1 md:col-span-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <strong>Como funciona a Meta de Investimentos:</strong> O sistema acompanhará todos os aportes feitos neste mês (nas caixinhas, ativos ou via transações) e te alertará quanto ainda falta para atingir o teto estipulado!
              </p>
            </div>
          )}

          <div className="col-span-1 md:col-span-2 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
             <div className="flex items-center gap-2 mb-3">
                 <input 
                    type="checkbox" 
                    id="isRecurringBudget"
                    checked={newBudget.isRecurring}
                    onChange={(e) => setNewBudget({...newBudget, isRecurring: e.target.checked})}
                    className={`w-4 h-4 rounded ${newBudget.type === 'expense' ? 'text-pink-600' : 'text-emerald-600'}`}
                 />
                 <label htmlFor="isRecurringBudget" className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer">
                    <Repeat className="w-4 h-4" /> {newBudget.type === 'expense' ? 'Orçamento Recorrente?' : 'Meta Mensal Recorrente?'}
                 </label>
             </div>
             
             {newBudget.isRecurring ? (
                 <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Info className="w-3 h-3" /> {newBudget.type === 'expense' ? 'Este limite será aplicado automaticamente em todos os meses futuros.' : 'Esta meta de aportes será cobrada automaticamente todo mês.'}
                 </p>
             ) : (
                 <div className="animate-fade-in">
                     <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Mês de Referência</label>
                     <input 
                        type="month"
                        required={!newBudget.isRecurring}
                        value={newBudget.month}
                        onChange={(e) => setNewBudget({...newBudget, month: e.target.value})}
                        className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-2 outline-none w-full max-w-[200px]"
                     />
                 </div>
             )}
          </div>

          <div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
            <button 
              type="submit" 
              className={`px-6 py-2 text-white rounded-lg font-medium shadow-sm transition-colors ${
                newBudget.type === 'expense' ? 'bg-pink-600 hover:bg-pink-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {newBudget.type === 'expense' ? 'Salvar Teto' : 'Salvar Meta de Investimento'}
            </button>
          </div>
        </form>
      )}

      {/* --- SEÇÃO 1: METAS DE INVESTIMENTO (APORTES MENSAIS) --- */}
      <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                 <PiggyBank className="w-5 h-5 text-emerald-500" /> Metas de Investimento do Mês
              </h3>
              <button 
                onClick={() => {
                  setNewBudget({
                    type: 'investment',
                    category: 'Investimentos (Geral)',
                    targetInvestmentId: 'ALL',
                    limit: '',
                    isRecurring: true,
                    month: getCurrentMonthKey()
                  });
                  setIsFormOpen(true);
                }}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Nova Meta de Aporte
              </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {investmentBudgets.length === 0 ? (
              <div className="col-span-full py-8 text-center bg-emerald-50/30 dark:bg-emerald-950/20 rounded-xl border border-dashed border-emerald-200 dark:border-emerald-800/60">
                <PiggyBank className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">Nenhuma meta de investimento definida para este mês.</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Crie uma meta de aporte para definir quanto quer investir e receber o alerta em tempo real de quanto falta!
                </p>
                <button 
                  onClick={() => {
                    setNewBudget({
                      type: 'investment',
                      category: 'Investimentos (Geral)',
                      targetInvestmentId: 'ALL',
                      limit: '',
                      isRecurring: true,
                      month: getCurrentMonthKey()
                    });
                    setIsFormOpen(true);
                  }}
                  className="mt-3 text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 px-3.5 py-1.5 rounded-lg font-bold transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Definir Meta de Aporte
                </button>
              </div>
            ) : (
              investmentBudgets.map(budget => {
                const invested = getInvestedAmount(budget);
                const percentage = Math.min(100, budget.limit > 0 ? (invested / budget.limit) * 100 : 0);
                const isReached = invested >= budget.limit;
                const remaining = Math.max(0, budget.limit - invested);

                return (
                  <div key={budget.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 hover:shadow-md transition-all relative group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                          <PiggyBank className="w-5 h-5" />
                        </div>
                        <div>
                           <h3 className="font-bold text-slate-800 dark:text-white">{budget.category}</h3>
                           <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                               {budget.isRecurring ? <Repeat className="w-3 h-3"/> : <CalendarClock className="w-3 h-3"/>}
                               {budget.isRecurring ? 'Meta Mensal' : 'Mês Específico'}
                           </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {editingId === budget.id ? (
                            <div className="flex items-center gap-1 animate-fade-in">
                               <CurrencyInput 
                                  autoFocus
                                  className="w-20 p-1 text-sm border rounded bg-white dark:bg-slate-900 dark:text-white dark:border-slate-600"
                                  value={editValue}
                                  onChangeValue={(val) => setEditValue(val)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(budget.id)}
                               />
                               <button onClick={() => handleSaveEdit(budget.id)} className="p-1 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200"><Save className="w-3 h-3"/></button>
                               <button onClick={() => setEditingId(null)} className="p-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"><X className="w-3 h-3"/></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <button onClick={() => startEditing(budget)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Editar Meta"><Edit2 className="w-4 h-4"/></button>
                                <button onClick={() => onDelete(budget.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded" title="Excluir Meta"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 relative">
                      <div className="flex justify-between items-end text-sm">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                          Aportado: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatValue(invested)}</span>
                        </span>
                        <span className="text-xs text-slate-400">Meta: {formatValue(budget.limit)}</span>
                      </div>

                      <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${isReached ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-emerald-500'}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>

                      <div className="pt-2">
                        {isReached ? (
                          <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-center justify-between text-xs">
                            <span className="font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Meta Batida!
                            </span>
                            <span className="font-bold text-teal-700 dark:text-teal-400">
                              {invested > budget.limit ? `+ ${formatValue(invested - budget.limit)} acima 🚀` : '100% Batida 🎉'}
                            </span>
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                            <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                              <Target className="w-3.5 h-3.5 text-emerald-600" /> Faltam para a meta:
                            </span>
                            <span className="font-black text-emerald-700 dark:text-emerald-400">
                              {formatValue(remaining)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
      </div>

      {/* --- SEÇÃO 2: SPENDING LIMITS (Tetos de Gastos) --- */}
      <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                 <AlertCircle className="w-5 h-5 text-rose-500" /> Tetos de Gastos (Despesas)
              </h3>
              <button 
                onClick={() => {
                  setNewBudget({
                    type: 'expense',
                    category: knownCategories[0] || 'Lazer',
                    targetInvestmentId: 'ALL',
                    limit: '',
                    isRecurring: true,
                    month: getCurrentMonthKey()
                  });
                  setIsFormOpen(true);
                }}
                className="text-xs font-semibold text-pink-600 hover:text-pink-700 dark:text-pink-400 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Novo Teto de Gastos
              </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {expenseBudgets.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum teto de gastos definido.</p>
              </div>
            ) : (
                expenseBudgets.map(budget => {
                const spent = getSpentAmount(budget.category);
                const forecast = calculateForecast(spent);
                const percentage = Math.min(100, (spent / budget.limit) * 100);
                const forecastPercentage = forecast ? Math.min(100, (forecast / budget.limit) * 100) : 0;
                
                const isOverLimit = spent > budget.limit;
                
                // Alert Colors
                let progressColor = 'bg-emerald-500';
                let icon = <CheckCircle className="w-5 h-5 text-emerald-600" />;
                if (percentage > 100) { progressColor = 'bg-rose-500'; icon = <AlertCircle className="w-5 h-5 text-rose-600" />; }
                else if (percentage > 85) { progressColor = 'bg-rose-500'; icon = <AlertTriangle className="w-5 h-5 text-rose-500" />; }
                else if (percentage > 70) { progressColor = 'bg-amber-500'; icon = <AlertTriangle className="w-5 h-5 text-amber-500" />; }

                return (
                  <div key={budget.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all relative group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg bg-slate-100 dark:bg-slate-700`}>{icon}</div>
                        <div>
                           <h3 className="font-bold text-slate-800 dark:text-white">{budget.category}</h3>
                           <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                               {budget.isRecurring ? <Repeat className="w-3 h-3"/> : <CalendarClock className="w-3 h-3"/>}
                               {budget.isRecurring ? 'Mensal' : 'Específico'}
                           </p>
                        </div>
                      </div>
                      
                      {/* Inline Edit Trigger */}
                      {editingId === budget.id ? (
                          <div className="flex items-center gap-1 animate-fade-in">
                             <CurrencyInput 
                                autoFocus
                                className="w-20 p-1 text-sm border rounded bg-white dark:bg-slate-900 dark:text-white dark:border-slate-600"
                                value={editValue}
                                onChangeValue={(val) => setEditValue(val)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(budget.id)}
                             />
                             <button onClick={() => handleSaveEdit(budget.id)} className="p-1 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200"><Save className="w-3 h-3"/></button>
                             <button onClick={() => setEditingId(null)} className="p-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"><X className="w-3 h-3"/></button>
                          </div>
                      ) : (
                          <div className="text-right group-hover:hidden">
                             <p className="text-xs text-slate-500">Limite</p>
                             <p className="font-bold text-slate-800 dark:text-white cursor-pointer hover:text-indigo-500" onClick={() => startEditing(budget)}>
                                {formatValue(budget.limit)}
                             </p>
                          </div>
                      )}
                      
                      {/* Actions on Hover */}
                      <div className="flex md:hidden md:group-hover:flex gap-1 absolute top-4 right-4 bg-white dark:bg-slate-800 pl-2">
                          <button onClick={() => startEditing(budget)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded"><Edit2 className="w-4 h-4"/></button>
                          <button onClick={() => onDelete(budget.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>

                    <div className="space-y-2 relative">
                      <div className="flex justify-between items-end text-sm">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                          Gasto: <span className={isOverLimit ? 'text-rose-500 font-bold' : ''}>{formatValue(spent)}</span>
                        </span>
                        <span className="text-slate-400 text-xs">{percentage.toFixed(0)}%</span>
                      </div>
                      
                      <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                        {/* Ghost Bar (Forecast) */}
                        {forecast && forecast > spent && !isOverLimit && (
                             <div 
                                className="absolute top-0 left-0 h-full bg-slate-200 dark:bg-slate-600 opacity-50 border-r-2 border-slate-400 dark:border-slate-400 transition-all duration-1000"
                                style={{ width: `${forecastPercentage}%` }}
                                title={`Previsão de fechar o mês em ${formatValue(forecast)}`}
                             ></div>
                        )}
                        {/* Actual Bar */}
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${progressColor} relative z-10`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center mt-2">
                         {forecast && forecast > budget.limit && !isOverLimit && (
                             <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold animate-pulse">
                                 <Ghost className="w-3 h-3" /> Previsão de estouro: {formatValue(forecast)}
                             </p>
                         )}
                         <div className="flex-1"></div>
                         <p className="text-xs text-right font-medium">
                            {isOverLimit ? (
                            <span className="text-rose-500">Excedido: {formatValue(spent - budget.limit)}</span>
                            ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">Restam: {formatValue(budget.limit - spent)}</span>
                            )}
                         </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
      </div>

      {/* --- SECTION 2: INVESTMENT GOALS (Metas Positivas) --- */}
      <div>
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                 <Medal className="w-5 h-5 text-yellow-500" /> Objetivos de Conquista
              </h3>
              <button 
                 onClick={() => onNavigate(View.INVESTMENTS)}
                 className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 transition-colors"
              >
                 Gerenciar Carteira <ArrowRight className="w-3 h-3" />
              </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {investmentGoals.length === 0 ? (
                  <div className="col-span-full py-8 text-center bg-yellow-50/50 dark:bg-yellow-900/10 rounded-xl border border-dashed border-yellow-200 dark:border-yellow-800">
                      <Target className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
                      <p className="text-slate-600 dark:text-slate-400 text-sm">Defina uma "Meta Final" nos seus investimentos para vê-los aqui.</p>
                      <button 
                         onClick={() => onNavigate(View.INVESTMENTS)}
                         className="mt-3 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1.5 rounded-lg font-bold transition-colors"
                      >
                         Ir para Investimentos
                      </button>
                  </div>
              ) : (
                  investmentGoals.map(goal => {
                      const percentage = Math.min(100, (goal.amount / goal.targetAmount) * 100);
                      
                      return (
                          <div 
                             key={goal.id} 
                             onClick={() => onNavigate(View.INVESTMENTS)}
                             className="bg-gradient-to-br from-white to-yellow-50 dark:from-slate-800 dark:to-slate-800/50 p-6 rounded-xl shadow-sm border border-yellow-200 dark:border-yellow-900/30 relative overflow-hidden cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all group"
                          >
                              <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                  <LineChart className="w-4 h-4 text-slate-400" />
                              </div>

                              <div className="flex justify-between items-start mb-4 relative z-10">
                                  <div className="flex items-center gap-3">
                                      <div className="p-2.5 rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
                                          <TrendingUp className="w-5 h-5" />
                                      </div>
                                      <div>
                                          <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{goal.name}</h3>
                                          <p className="text-xs text-slate-500 dark:text-slate-400">Meta: {formatValue(goal.targetAmount)}</p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{percentage.toFixed(0)}%</p>
                                  </div>
                              </div>

                              <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative z-10">
                                  <div 
                                      className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                                      style={{ width: `${percentage}%` }}
                                  >
                                      {/* Shimmer effect */}
                                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                                  </div>
                              </div>
                              
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-right relative z-10">
                                  Faltam {formatValue(goal.targetAmount - goal.amount)}
                              </p>

                              {/* Decorative bg icon */}
                              <Medal className="absolute -bottom-4 -right-4 w-32 h-32 text-yellow-500/5 rotate-12 pointer-events-none" />
                          </div>
                      );
                  })
              )}
          </div>
      </div>

    </div>
  );
};
