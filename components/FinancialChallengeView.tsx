import React, { useState, useMemo } from 'react';
import { FinancialChallenge, FinancialChallengeEntry } from '../types';
import { 
  Trophy, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  Circle, 
  X, 
  Calendar as CalendarIcon, 
  DollarSign, 
  Sparkles, 
  Search, 
  Shuffle, 
  TrendingUp, 
  Check, 
  RotateCcw, 
  Info, 
  Clock, 
  Coins, 
  Filter, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flame,
  Award
} from 'lucide-react';

interface FinancialChallengeViewProps {
  challenges: FinancialChallenge[];
  onAddChallenge: (challenge: {
    title?: string;
    targetNumber: number;
    startDate?: string;
    deadline?: string;
    description?: string;
    color?: string;
    icon?: string;
  }) => void;
  onUpdateChallenge: (id: string, updates: Partial<FinancialChallenge>) => void;
  onDeleteChallenge: (id: string) => void;
  onToggleEntry: (id: string, num: number, completedAt?: string, note?: string) => void;
  privacyMode: boolean;
  onBackToHabits?: () => void;
}

const PRESET_TARGETS = [
  { target: 52, label: '52 Semanas', desc: 'R$ 1 a R$ 52' },
  { target: 100, label: '100 Depósitos', desc: 'R$ 1 a R$ 100' },
  { target: 200, label: '200 Depósitos', desc: 'R$ 1 a R$ 200' },
  { target: 365, label: '365 Dias (1 Ano)', desc: 'R$ 1 a R$ 365' },
  { target: 500, label: '500 Depósitos', desc: 'R$ 1 a R$ 500' },
  { target: 1000, label: '1.000 Depósitos', desc: 'R$ 1 a R$ 1.000' },
];

const THEME_COLORS = [
  { name: 'Esmeralda', hex: '#10b981', bgLight: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500' },
  { name: 'Índigo', hex: '#6366f1', bgLight: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500' },
  { name: 'Violeta', hex: '#8b5cf6', bgLight: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500' },
  { name: 'Âmbar Dourado', hex: '#f59e0b', bgLight: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500' },
  { name: 'Azul Celeste', hex: '#0284c7', bgLight: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-500' },
  { name: 'Rosa Rubi', hex: '#f43f5e', bgLight: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500' },
];

const ICONS = ['💰', '🎯', '🏆', '🐷', '💎', '🚀', '⭐', '🔥', '🏦', '✈️', '🚗', '🏠'];

export const FinancialChallengeView: React.FC<FinancialChallengeViewProps> = ({
  challenges,
  onAddChallenge,
  onUpdateChallenge,
  onDeleteChallenge,
  onToggleEntry,
  privacyMode,
  onBackToHabits,
}) => {
  // Selected challenge state
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    return challenges.length > 0 ? challenges[0].id : null;
  });

  // Keep selectedId in sync
  const activeChallenge = useMemo(() => {
    if (!challenges || challenges.length === 0) return null;
    const found = challenges.find((c) => c.id === selectedId);
    return found || challenges[0];
  }, [challenges, selectedId]);

  // Modal Create / Edit
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    targetNumber: 500,
    startDate: new Date().toISOString().split('T')[0],
    deadline: '',
    description: '',
    color: '#10b981',
    icon: '💰',
  });

  // Modal Deposit / Conclude Number
  const [depositModal, setDepositModal] = useState<{
    isOpen: boolean;
    number: number;
    challengeId: string;
    existingEntry?: FinancialChallengeEntry;
    date: string;
    note: string;
  } | null>(null);

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [pageRange, setPageRange] = useState<number>(0); // 0 = first 100, 1 = second 100, or -1 for all
  const PAGE_SIZE = 100;

  // Format currency helper
  const formatCurrency = (val: number) => {
    if (privacyMode) return '••••••';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Helper formula: Sum from 1 to N
  const calcTotalSum = (n: number) => {
    const num = Math.max(1, n || 1);
    return (num * (num + 1)) / 2;
  };

  // Calculate statistics for active challenge
  const stats = useMemo(() => {
    if (!activeChallenge) {
      return {
        totalSaved: 0,
        totalTarget: 0,
        completedCount: 0,
        targetCount: 0,
        remainingAmount: 0,
        remainingCount: 0,
        percent: 0,
        daysRemaining: null as number | null,
        dailyRateRequired: 0,
      };
    }

    const entries = activeChallenge.completedEntries || {};
    const completedNums = Object.keys(entries).map(Number);
    const completedCount = completedNums.length;
    const totalSaved = completedNums.reduce((acc, num) => acc + num, 0);
    const targetCount = activeChallenge.targetNumber || 100;
    const totalTarget = activeChallenge.totalTargetAmount || calcTotalSum(targetCount);
    const remainingAmount = Math.max(0, totalTarget - totalSaved);
    const remainingCount = Math.max(0, targetCount - completedCount);
    const percent = targetCount > 0 ? (completedCount / targetCount) * 100 : 0;

    let daysRemaining: number | null = null;
    let dailyRateRequired = 0;
    if (activeChallenge.deadline) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dl = new Date(activeChallenge.deadline + 'T12:00:00');
      dl.setHours(0, 0, 0, 0);
      const diffMs = dl.getTime() - today.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      dailyRateRequired = daysRemaining > 0 ? remainingAmount / daysRemaining : remainingAmount;
    }

    return {
      totalSaved,
      totalTarget,
      completedCount,
      targetCount,
      remainingAmount,
      remainingCount,
      percent,
      daysRemaining,
      dailyRateRequired,
    };
  }, [activeChallenge]);

  // Handle open create modal
  const handleOpenCreate = () => {
    setFormData({
      title: '',
      targetNumber: 500,
      startDate: new Date().toISOString().split('T')[0],
      deadline: '',
      description: '',
      color: '#10b981',
      icon: '💰',
    });
    setEditingChallengeId(null);
    setIsFormModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (ch: FinancialChallenge) => {
    setFormData({
      title: ch.title,
      targetNumber: ch.targetNumber,
      startDate: ch.startDate || new Date().toISOString().split('T')[0],
      deadline: ch.deadline || '',
      description: ch.description || '',
      color: ch.color || '#10b981',
      icon: ch.icon || '💰',
    });
    setEditingChallengeId(ch.id);
    setIsFormModalOpen(true);
  };

  // Handle submit form
  const handleSaveChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    const targetN = Math.max(2, Math.min(5000, Number(formData.targetNumber) || 100));

    if (editingChallengeId) {
      const totalTarget = calcTotalSum(targetN);
      onUpdateChallenge(editingChallengeId, {
        title: formData.title.trim() || `Desafio 1 a ${targetN}`,
        targetNumber: targetN,
        totalTargetAmount: totalTarget,
        startDate: formData.startDate,
        deadline: formData.deadline || undefined,
        description: formData.description.trim(),
        color: formData.color,
        icon: formData.icon,
      });
    } else {
      onAddChallenge({
        title: formData.title.trim() || `Desafio 1 a ${targetN}`,
        targetNumber: targetN,
        startDate: formData.startDate,
        deadline: formData.deadline || undefined,
        description: formData.description.trim(),
        color: formData.color,
        icon: formData.icon,
      });
    }

    setIsFormModalOpen(false);
    setEditingChallengeId(null);
  };

  // Handle open deposit modal for a specific number
  const handleOpenDeposit = (num: number) => {
    if (!activeChallenge) return;
    const existing = activeChallenge.completedEntries?.[num];
    setDepositModal({
      isOpen: true,
      number: num,
      challengeId: activeChallenge.id,
      existingEntry: existing,
      date: existing ? existing.completedAt : new Date().toISOString().split('T')[0],
      note: existing?.note || '',
    });
  };

  // Handle confirm deposit / toggle
  const handleConfirmDeposit = () => {
    if (!depositModal) return;
    onToggleEntry(
      depositModal.challengeId,
      depositModal.number,
      depositModal.date,
      depositModal.note
    );
    setDepositModal(null);
  };

  // Handle direct unmark
  const handleDirectUnmark = (num: number) => {
    if (!activeChallenge) return;
    onToggleEntry(activeChallenge.id, num);
    setDepositModal(null);
  };

  // Quick Deposit: Pick a random pending number or smallest
  const handleQuickDepositSuggestion = (type: 'smallest' | 'random' | 'largest') => {
    if (!activeChallenge) return;
    const targetN = activeChallenge.targetNumber;
    const entries = activeChallenge.completedEntries || {};
    const pendingNums: number[] = [];
    for (let i = 1; i <= targetN; i++) {
      if (!entries[i]) pendingNums.push(i);
    }

    if (pendingNums.length === 0) return;

    let chosen: number;
    if (type === 'smallest') {
      chosen = pendingNums[0];
    } else if (type === 'largest') {
      chosen = pendingNums[pendingNums.length - 1];
    } else {
      const randomIndex = Math.floor(Math.random() * pendingNums.length);
      chosen = pendingNums[randomIndex];
    }

    handleOpenDeposit(chosen);
  };

  // Filter and paginate the grid items
  const gridNumbers = useMemo(() => {
    if (!activeChallenge) return [];
    const targetN = activeChallenge.targetNumber;
    const entries = activeChallenge.completedEntries || {};

    let list: number[] = [];
    for (let i = 1; i <= targetN; i++) {
      list.push(i);
    }

    // Apply Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      list = list.filter((n) => n.toString().includes(q));
    }

    // Apply Status Filter
    if (statusFilter === 'completed') {
      list = list.filter((n) => !!entries[n]);
    } else if (statusFilter === 'pending') {
      list = list.filter((n) => !entries[n]);
    }

    return list;
  }, [activeChallenge, searchQuery, statusFilter]);

  // Paginated numbers if activeChallenge has many items and no search is active
  const totalItems = gridNumbers.length;
  const isLargeSet = (activeChallenge?.targetNumber || 0) > 100;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const displayedNumbers = useMemo(() => {
    if (!isLargeSet || pageRange === -1 || searchQuery.trim()) {
      return gridNumbers;
    }
    const start = pageRange * PAGE_SIZE;
    return gridNumbers.slice(start, start + PAGE_SIZE);
  }, [gridNumbers, isLargeSet, pageRange, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in p-3 md:p-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {onBackToHabits && (
            <button
              onClick={onBackToHabits}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              title="Voltar para Hábitos"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Coins className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                Desafio Financeiro
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                  1 a {activeChallenge ? activeChallenge.targetNumber : 'N'}
                </span>
              </h2>
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Guarde valores de R$ 1 até a sua meta final e acumule uma grande reserva.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {challenges.length > 1 && (
            <select
              value={activeChallenge?.id || ''}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setPageRange(0);
              }}
              className="flex-1 sm:flex-initial text-xs font-semibold p-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {challenges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon || '💰'} {c.title} (1 a {c.targetNumber})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all font-bold text-xs shrink-0"
          >
            <Plus className="w-4 h-4" /> Novo Desafio
          </button>
        </div>
      </div>

      {/* If No Challenges Exist */}
      {(!challenges || challenges.length === 0) && (
        <div className="p-8 md:p-12 text-center bg-white dark:bg-slate-800/60 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 max-w-2xl mx-auto space-y-5">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Coins className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Nenhum Desafio Financeiro Criado
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Crie seu primeiro desafio de economia. Escolha o número final (ex: 100, 365, 500 ou 1.000) e vá guardando e marcando os valores dia a dia!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-lg mx-auto pt-2">
            <div
              onClick={() => {
                setFormData({
                  title: 'Desafio 1 a 100 (R$ 5.050)',
                  targetNumber: 100,
                  startDate: new Date().toISOString().split('T')[0],
                  deadline: '',
                  description: 'Meta de economia inicial',
                  color: '#10b981',
                  icon: '💰',
                });
                setIsFormModalOpen(true);
              }}
              className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl cursor-pointer hover:scale-102 transition-transform"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                1 a 100
              </span>
              <p className="font-extrabold text-sm text-slate-800 dark:text-white mt-1">R$ 5.050,00</p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">100 depósitos</span>
            </div>

            <div
              onClick={() => {
                setFormData({
                  title: 'Desafio 1 a 500 (R$ 125.250)',
                  targetNumber: 500,
                  startDate: new Date().toISOString().split('T')[0],
                  deadline: '',
                  description: 'Grande reserva financeira',
                  color: '#6366f1',
                  icon: '🏆',
                });
                setIsFormModalOpen(true);
              }}
              className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 rounded-2xl cursor-pointer hover:scale-102 transition-transform"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                1 a 500
              </span>
              <p className="font-extrabold text-sm text-slate-800 dark:text-white mt-1">R$ 125.250,00</p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">500 depósitos</span>
            </div>

            <div
              onClick={() => {
                setFormData({
                  title: 'Desafio 1 a 1.000 (R$ 500.500)',
                  targetNumber: 1000,
                  startDate: new Date().toISOString().split('T')[0],
                  deadline: '',
                  description: 'Desafio mestre de enriquecimento',
                  color: '#f59e0b',
                  icon: '👑',
                });
                setIsFormModalOpen(true);
              }}
              className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl cursor-pointer hover:scale-102 transition-transform"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                1 a 1.000
              </span>
              <p className="font-extrabold text-sm text-slate-800 dark:text-white mt-1">R$ 500.500,00</p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">1.000 depósitos</span>
            </div>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 text-sm inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Configurar Desafio Personalizado
          </button>
        </div>
      )}

      {/* Active Challenge Dashboard */}
      {activeChallenge && (
        <>
          {/* Main Summary Hero Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 md:p-6 border border-slate-200/80 dark:border-slate-700 shadow-sm relative overflow-hidden">
            {/* Top Challenge Details & Action Icons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2.5 bg-slate-100 dark:bg-slate-700 rounded-2xl shadow-inner">
                  {activeChallenge.icon || '💰'}
                </span>
                <div>
                  <h3 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    {activeChallenge.title}
                    {stats.percent >= 100 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-300">
                        <Award className="w-3.5 h-3.5" /> 100% Concluído!
                      </span>
                    )}
                  </h3>
                  {activeChallenge.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activeChallenge.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  onClick={() => handleOpenEdit(activeChallenge)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200/60 dark:border-slate-600"
                  title="Editar Desafio"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteChallenge(activeChallenge.id)}
                  className="p-2 text-rose-400 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl transition-colors border border-rose-200/60 dark:border-rose-800/40"
                  title="Excluir Desafio"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5">
              {/* Total Guardado */}
              <div className="p-3.5 md:p-4 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50">
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block mb-1">
                  Total Acumulado
                </span>
                <span className="text-lg md:text-2xl font-black text-emerald-700 dark:text-emerald-300 block">
                  {formatCurrency(stats.totalSaved)}
                </span>
                <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
                  de {formatCurrency(stats.totalTarget)}
                </span>
              </div>

              {/* Concluídos */}
              <div className="p-3.5 md:p-4 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50">
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block mb-1">
                  Depósitos Feitos
                </span>
                <span className="text-lg md:text-2xl font-black text-indigo-700 dark:text-indigo-300 block">
                  {stats.completedCount} / {stats.targetCount}
                </span>
                <span className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80">
                  {stats.percent.toFixed(1)}% do desafio
                </span>
              </div>

              {/* Faltam Guardar */}
              <div className="p-3.5 md:p-4 bg-amber-50/80 dark:bg-amber-950/40 rounded-2xl border border-amber-200/80 dark:border-amber-900/50">
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block mb-1">
                  Faltam Guardar
                </span>
                <span className="text-lg md:text-2xl font-black text-amber-700 dark:text-amber-300 block">
                  {formatCurrency(stats.remainingAmount)}
                </span>
                <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80">
                  {stats.remainingCount} números restantes
                </span>
              </div>

              {/* Prazo & Ritmo */}
              <div className="p-3.5 md:p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-600">
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  {activeChallenge.deadline ? 'Prazo Final' : 'Início do Desafio'}
                </span>
                {activeChallenge.deadline ? (
                  <>
                    <span className="text-sm md:text-base font-extrabold text-slate-800 dark:text-white block">
                      {new Date(activeChallenge.deadline + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-[11px] font-semibold text-rose-500 dark:text-rose-400">
                      {stats.daysRemaining !== null
                        ? stats.daysRemaining === 0
                          ? 'Vence hoje!'
                          : `${stats.daysRemaining} dias restantes`
                        : ''}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-sm md:text-base font-extrabold text-slate-800 dark:text-white block">
                      {new Date(activeChallenge.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Sem prazo limite definido
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  Progresso do Desafio (1 a {activeChallenge.targetNumber})
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                  {stats.percent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3.5 overflow-hidden border border-slate-200 dark:border-slate-600 relative">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.min(100, Math.max(0, stats.percent))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Actions & Search Controls */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar valor (ex: 50, 100, 250)..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl shrink-0 overflow-x-auto text-xs font-semibold">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Todos ({activeChallenge.targetNumber})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    statusFilter === 'pending'
                      ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Pendentes ({stats.remainingCount})
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    statusFilter === 'completed'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Concluídos ({stats.completedCount})
                </button>
              </div>

              {/* Quick Pick Helper Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleQuickDepositSuggestion('smallest')}
                  disabled={stats.remainingCount === 0}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1"
                  title="Guardar o menor valor pendente"
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Menor
                </button>
                <button
                  onClick={() => handleQuickDepositSuggestion('random')}
                  disabled={stats.remainingCount === 0}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1"
                  title="Sortear um valor para guardar hoje"
                >
                  <Shuffle className="w-3.5 h-3.5" /> Sortear
                </button>
                <button
                  onClick={() => handleQuickDepositSuggestion('largest')}
                  disabled={stats.remainingCount === 0}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold rounded-xl border border-purple-200 dark:border-purple-800 text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1"
                  title="Guardar o maior valor pendente"
                >
                  <Flame className="w-3.5 h-3.5" /> Maior
                </button>
              </div>
            </div>

            {/* If large range (e.g. 500 or 1000): Range Selector Tabs */}
            {isLargeSet && !searchQuery.trim() && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-1 overflow-x-auto scrollbar-hide py-1 text-xs">
                <span className="text-[11px] font-bold uppercase text-slate-400 mr-1 shrink-0">
                  Faixa:
                </span>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const startNum = idx * PAGE_SIZE + 1;
                  const endNum = Math.min((idx + 1) * PAGE_SIZE, activeChallenge.targetNumber);
                  const isCurrent = pageRange === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setPageRange(idx)}
                      className={`px-3 py-1 rounded-lg shrink-0 font-bold transition-all ${
                        isCurrent
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {startNum} - {endNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPageRange(-1)}
                  className={`px-3 py-1 rounded-lg shrink-0 font-bold transition-all ${
                    pageRange === -1
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Ver Todos ({totalItems})
                </button>
              </div>
            )}
          </div>

          {/* Numbers Grid Display */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold px-1">
              <span>
                Exibindo {displayedNumbers.length} de {gridNumbers.length} números
              </span>
              <span className="text-[11px] text-slate-400">
                💡 Clique em qualquer número para guardar ou desmarcar
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
              {displayedNumbers.map((num) => {
                const entry = activeChallenge.completedEntries?.[num];
                const isCompleted = !!entry;

                // Format completed date
                let formattedDate = '';
                if (entry?.completedAt) {
                  const [y, m, d] = entry.completedAt.split('-');
                  if (y && m && d) {
                    formattedDate = `${d}/${m}/${y}`;
                  } else {
                    formattedDate = new Date(entry.completedAt).toLocaleDateString('pt-BR');
                  }
                }

                return (
                  <div
                    key={num}
                    onClick={() => handleOpenDeposit(num)}
                    className={`relative p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
                      isCompleted
                        ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/20 dark:from-emerald-950/50 dark:to-teal-950/40 border-emerald-500/80 dark:border-emerald-600/80 shadow-sm hover:border-emerald-600 hover:shadow'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs'
                    }`}
                  >
                    {/* Top Row: Number & Status Icon */}
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          #{num}
                        </span>
                        <span
                          className={`text-base md:text-lg font-black ${
                            isCompleted
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-slate-800 dark:text-white'
                          }`}
                        >
                          {formatCurrency(num)}
                        </span>
                      </div>

                      <span
                        className={`p-1 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                      </span>
                    </div>

                    {/* Bottom Row: Concluded Date Tag */}
                    {isCompleted ? (
                      <div className="mt-1 pt-1.5 border-t border-emerald-200/50 dark:border-emerald-800/40 space-y-0.5">
                        <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          Concluído em: {formattedDate}
                        </span>
                        {entry.note && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate italic">
                            "{entry.note}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                        <span>Pendente</span>
                        <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          + Guardar
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {displayedNumbers.length === 0 && (
              <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                Nenhum número encontrado com os filtros aplicados.
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT FINANCIAL CHALLENGE */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 md:p-6 space-y-5 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Trophy className="w-5 h-5" />
                </span>
                <h3 className="font-extrabold text-base md:text-lg text-slate-800 dark:text-white">
                  {editingChallengeId ? 'Editar Desafio Financeiro' : 'Configurar Desafio Financeiro'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChallenge} className="space-y-4">
              {/* Preset Buttons */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                  Escolha uma Meta Rápida ou Personalize
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_TARGETS.map((p) => {
                    const isSelected = Number(formData.targetNumber) === p.target;
                    const totalSum = calcTotalSum(p.target);
                    return (
                      <button
                        type="button"
                        key={p.target}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            targetNumber: p.target,
                            title: formData.title || `Desafio 1 a ${p.target}`,
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          1 a {p.target}
                        </span>
                        <span className="text-xs font-extrabold text-slate-800 dark:text-white block mt-0.5">
                          {formatCurrency(totalSum)}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                          {p.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Number Final Input (Always starts at 1, ends at targetNumber) */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Número Final do Desafio (1 até N) *
                </label>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold text-xs text-slate-500">
                    Inicia em 1
                  </div>
                  <span className="text-slate-400 font-bold">até</span>
                  <input
                    type="number"
                    min="2"
                    max="5000"
                    required
                    value={formData.targetNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetNumber: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
                    placeholder="Ex: 500"
                  />
                </div>
              </div>

              {/* LIVE TOTAL ACCUMULATED BANNER */}
              <div className="p-4 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/15 dark:from-emerald-950/60 dark:to-indigo-950/40 rounded-2xl border border-emerald-500/40 dark:border-emerald-700/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Total que você vai ter guardado:
                  </span>
                  <span className="text-base md:text-xl font-black text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(calcTotalSum(Number(formData.targetNumber) || 1))}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Ao completar todos os <strong>{formData.targetNumber || 0} depósitos</strong> de R$ 1 até R$ {formData.targetNumber || 0}, você terá acumulado exatamente esta quantia.
                </p>
              </div>

              {/* Title & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nome do Desafio
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={`Ex: Desafio 1 a ${formData.targetNumber || 500}`}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Prazo Limite (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Objetivo / Observação
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Reserva de emergência, viagem de fim de ano..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Ícone do Desafio
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ICONS.map((ic) => (
                    <button
                      type="button"
                      key={ic}
                      onClick={() => setFormData({ ...formData, icon: ic })}
                      className={`text-xl p-2 rounded-xl transition-transform ${
                        formData.icon === ic
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 ring-2 ring-emerald-500 scale-110'
                          : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <Trophy className="w-4 h-4" />
                  {editingChallengeId ? 'Salvar Alterações' : 'Iniciar Desafio'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONFIRM DEPOSIT / VIEW CONCLUDED NUMBER */}
      {/* ========================================================================= */}
      {depositModal && depositModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 md:p-6 space-y-4 relative">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Coins className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                    {depositModal.existingEntry ? 'Depósito Concluído' : 'Confirmar Depósito'}
                  </h3>
                  <span className="text-xs text-slate-400 font-semibold">
                    Número #{depositModal.number}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDepositModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Deposit Value Highlight */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 text-center space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                Valor a Guardar
              </span>
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 block">
                {formatCurrency(depositModal.number)}
              </span>
            </div>

            {/* Date Picker (Concluded Date) */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Data do Depósito (Concluído em) *
              </label>
              <input
                type="date"
                required
                value={depositModal.date}
                onChange={(e) => setDepositModal({ ...depositModal, date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
              />
            </div>

            {/* Optional Note */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Observação (Opcional)
              </label>
              <input
                type="text"
                value={depositModal.note}
                onChange={(e) => setDepositModal({ ...depositModal, note: e.target.value })}
                placeholder="Ex: Troco economizado, pix recebido..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white"
              />
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              {depositModal.existingEntry ? (
                <>
                  <button
                    onClick={handleConfirmDeposit}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Atualizar Data / Nota
                  </button>
                  <button
                    onClick={() => handleDirectUnmark(depositModal.number)}
                    className="w-full py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold rounded-xl text-xs border border-amber-200/80 dark:border-amber-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Desmarcar (Tornar Pendente)
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConfirmDeposit}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirmar Depósito de {formatCurrency(depositModal.number)}
                </button>
              )}

              <button
                onClick={() => setDepositModal(null)}
                className="w-full py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
