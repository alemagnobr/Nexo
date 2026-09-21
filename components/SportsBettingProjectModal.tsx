import React, { useState, useEffect } from 'react';
import {
  SportsBettingProject,
  SportsBettingProjectStatus,
} from '../types';
import {
  BOOKMAKERS_LIST,
  SPORTS_CATEGORIES,
  PROJECT_COLOR_THEMES,
} from '../services/sportsBettingService';
import {
  X,
  Trophy,
  DollarSign,
  Percent,
  ShieldCheck,
  TrendingUp,
  Target,
  Sparkles,
  Layers,
  HelpCircle,
  CheckCircle2,
  Sliders,
  Flame,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface SportsBettingProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  investments?: any[];
  onSave: (projectData: {
    name: string;
    description?: string;
    bookmaker?: string;
    sportFocus?: string;
    targetGoal?: number;
    color?: string;
    status?: SportsBettingProjectStatus;
    initialBankroll: number;
    stakePercentage: number;
    compoundPercentage: number;
    protectionPercentage: number;
    protectionInvestmentId?: string;
    minimumStake?: number;
    stopLossPercentage?: number;
    stopLossDaily?: number;
    stopGainDaily?: number;
    notes?: string;
  }) => void;
  editingProject?: SportsBettingProject | null;
  onDelete?: (id: string, name: string) => void;
}

export const SportsBettingProjectModal: React.FC<SportsBettingProjectModalProps> = ({
  isOpen,
  onClose,
  investments = [],
  onSave,
  editingProject,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [bookmaker, setBookmaker] = useState('Bet365');
  const [customBookmaker, setCustomBookmaker] = useState('');
  const [sportFocus, setSportFocus] = useState('Futebol');
  const [targetGoal, setTargetGoal] = useState('');
  const [color, setColor] = useState('emerald');
  const [status, setStatus] = useState<SportsBettingProjectStatus>('ACTIVE');

  // Risk & Strategy config
  const [initialBankroll, setInitialBankroll] = useState('1000');
  const [stakePercentage, setStakePercentage] = useState('3');
  const [compoundPercentage, setCompoundPercentage] = useState(70);
  const [protectionPercentage, setProtectionPercentage] = useState(30);
  const [protectionInvestmentId, setProtectionInvestmentId] = useState('');
  const [stopLossPercentage, setStopLossPercentage] = useState('');
  const [stopLossDaily, setStopLossDaily] = useState('');
  const [stopGainDaily, setStopGainDaily] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingProject) {
        setName(editingProject.name || '');
        setDescription(editingProject.description || '');
        if (BOOKMAKERS_LIST.includes(editingProject.bookmaker || '')) {
          setBookmaker(editingProject.bookmaker || 'Bet365');
          setCustomBookmaker('');
        } else {
          setBookmaker('Outra');
          setCustomBookmaker(editingProject.bookmaker || '');
        }
        setSportFocus(editingProject.sportFocus || 'Futebol');
        setTargetGoal(editingProject.targetGoal ? String(editingProject.targetGoal) : '');
        setColor(editingProject.color || 'emerald');
        setStatus(editingProject.status || 'ACTIVE');

        setInitialBankroll(String(editingProject.config?.initialBankroll ?? 1000));
        setStakePercentage(String(editingProject.config?.stakePercentage ?? 3));
        setCompoundPercentage(editingProject.config?.compoundPercentage ?? 70);
        setProtectionPercentage(editingProject.config?.protectionPercentage ?? 30);
        setProtectionInvestmentId(editingProject.config?.protectionInvestmentId || '');
        setStopLossPercentage(editingProject.config?.stopLossPercentage ? String(editingProject.config.stopLossPercentage) : '');
        setStopLossDaily(editingProject.config?.stopLossDaily ? String(editingProject.config.stopLossDaily) : '');
        setStopGainDaily(editingProject.config?.stopGainDaily ? String(editingProject.config.stopGainDaily) : '');
        setNotes(editingProject.config?.notes || '');
      } else {
        // Reset defaults for new project
        setName('');
        setDescription('');
        setBookmaker('Bet365');
        setCustomBookmaker('');
        setSportFocus('Futebol');
        setTargetGoal('5000');
        setColor('emerald');
        setStatus('ACTIVE');

        setInitialBankroll('1000');
        setStakePercentage('3');
        setCompoundPercentage(70);
        setProtectionPercentage(30);
        setProtectionInvestmentId('');
        setStopLossPercentage('50');
        setStopLossDaily('');
        setStopGainDaily('');
        setNotes('Estratégia balanceada com reinvestimento inteligente e reserva de segurança.');
      }
    }
  }, [isOpen, editingProject]);

  if (!isOpen) return null;

  // Sincroniza os percentuais de divisão
  const handleCompoundChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setCompoundPercentage(clamped);
    setProtectionPercentage(100 - clamped);
  };

  const handleProtectionChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setProtectionPercentage(clamped);
    setCompoundPercentage(100 - clamped);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Informe um nome para o projeto.');
      return;
    }

    const initial = parseFloat(initialBankroll);
    if (isNaN(initial) || initial <= 0) {
      toast.error('Informe um capital inicial válido.');
      return;
    }

    const stakeP = parseFloat(stakePercentage);
    if (isNaN(stakeP) || stakeP <= 0 || stakeP > 100) {
      toast.error('Informe uma porcentagem de stake válida (ex: 2% a 5%).');
      return;
    }

    const finalBookmaker = bookmaker === 'Outra' && customBookmaker.trim() ? customBookmaker.trim() : bookmaker;

    onSave({
      name: name.trim(),
      description: description.trim(),
      bookmaker: finalBookmaker,
      sportFocus,
      targetGoal: targetGoal ? parseFloat(targetGoal) : undefined,
      color,
      status,
      initialBankroll: initial,
      stakePercentage: stakeP,
      compoundPercentage,
      protectionPercentage,
      protectionInvestmentId: protectionInvestmentId || undefined,
      minimumStake: 0,
      stopLossPercentage: stopLossPercentage ? parseFloat(stopLossPercentage) : undefined,
      stopLossDaily: stopLossDaily ? parseFloat(stopLossDaily) : undefined,
      stopGainDaily: stopGainDaily ? parseFloat(stopGainDaily) : undefined,
      notes: notes.trim(),
    });
  };

  // Preview simulation - Cálculo dinâmico direto da exposição sobre o capital
  const numInitial = parseFloat(initialBankroll) || 0;
  const numStake = parseFloat(stakePercentage) || 0;
  const previewStakeAmount = numInitial > 0 && numStake > 0
    ? Math.round(numInitial * (numStake / 100) * 100) / 100
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {editingProject ? 'Editar Projeto / Banca' : 'Criar Novo Projeto Esportivo'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure os parâmetros de juros compostos, metas e blindagem de risco.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {/* Seção 1: Identificação do Projeto */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-teal-500" />
              <span>Identificação do Projeto</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Projeto / Banca *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Projeto Alavancagem Premier League, Banca Bet365 70/30..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Casa de Aposta / Plataforma
                </label>
                <select
                  value={bookmaker}
                  onChange={(e) => setBookmaker(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {BOOKMAKERS_LIST.map((bk) => (
                    <option key={bk} value={bk}>
                      {bk}
                    </option>
                  ))}
                </select>
                {bookmaker === 'Outra' && (
                  <input
                    type="text"
                    value={customBookmaker}
                    onChange={(e) => setCustomBookmaker(e.target.value)}
                    placeholder="Nome da plataforma"
                    className="w-full mt-2 px-3.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Esporte / Foco
                </label>
                <select
                  value={sportFocus}
                  onChange={(e) => setSportFocus(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {SPORTS_CATEGORIES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Meta Patrimonial / Alvo (R$, opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={targetGoal}
                    onChange={(e) => setTargetGoal(e.target.value)}
                    placeholder="Ex: 5000.00"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tema / Cor de Destaque
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {PROJECT_COLOR_THEMES.map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setColor(th.id)}
                      className={`w-7 h-7 rounded-full ${th.badge} transition-transform ${
                        color === th.id ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={th.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Gestão de Risco & Juros Compostos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-teal-500" />
              <span>Parâmetros de Gestão & Risco</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Capital Inicial da Banca (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    value={initialBankroll}
                    onChange={(e) => setInitialBankroll(e.target.value)}
                    placeholder="1000.00"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Exposição por Entrada (% Stake) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    max="100"
                    value={stakePercentage}
                    onChange={(e) => setStakePercentage(e.target.value)}
                    placeholder="3"
                    className="w-full pr-8 pl-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">
                    Próxima stake calculada:
                  </span>
                  <span className="font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md border border-teal-500/20">
                    R$ {previewStakeAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Divisão Interativa do Lucro */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                    Divisão Inteligente dos Greens (Lucro Líquido)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Equilibre o crescimento exponencial com a proteção patrimonial.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    {compoundPercentage}% Compostos
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    {protectionPercentage}% Blindado
                  </span>
                </div>
              </div>

              {/* Slider de divisão */}
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={compoundPercentage}
                  onChange={(e) => handleCompoundChange(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>0% Compostos (100% Blindagem)</span>
                  <span>50% / 50%</span>
                  <span>100% Compostos (Sem Blindagem)</span>
                </div>
              </div>

              {/* Exemplo explicativo em tempo real */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 rounded-lg bg-teal-500/5 dark:bg-teal-950/20 border border-teal-500/20">
                  <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 text-xs font-bold mb-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Juros Compostos ({compoundPercentage}%)
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    A cada R$ 100 de lucro, <strong>R$ {compoundPercentage.toFixed(2)}</strong> são reinjetados na banca para aumentar o poder das próximas stakes.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/20">
                  <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Cofre Blindado ({protectionPercentage}%)
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    A cada R$ 100 de lucro, <strong>R$ {protectionPercentage.toFixed(2)}</strong> são travados no cofre sem risco para proteger contra sequências negativas.
                  </p>
                </div>
              </div>

              {/* Destino da Proteção */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Destino da Proteção (Opcional)
                </label>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 leading-tight">
                  Escolha um ativo já criado (Caixinha, FII, Ação) para vincular a esta proteção.
                </p>
                <select
                  value={protectionInvestmentId}
                  onChange={(e) => setProtectionInvestmentId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Nenhum (Manter apenas no Cofre Virtual)</option>
                  {investments.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} - {inv.type} (R$ {inv.amount.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stop Loss Móvel do Projeto */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-rose-500" />
                  Stop Loss do Projeto (% da Maior Banca)
                </label>
                {stopLossPercentage && parseFloat(stopLossPercentage) > 0 && (
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    Limite: {stopLossPercentage}% do topo
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="1"
                  max="99"
                  value={stopLossPercentage}
                  onChange={(e) => setStopLossPercentage(e.target.value)}
                  placeholder="Ex: 50 (50% de rebaixamento da maior banca)"
                  className="w-full pl-3.5 pr-12 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                <strong>Stop Loss Móvel (Trailing):</strong> O corte de risco segue sempre a <strong>maior banca ativa histórica</strong> alcançada. Se a banca cresce, o piso de segurança sobe proporcionalmente e nunca regride.
                {numInitial > 0 && parseFloat(stopLossPercentage) > 0 && (
                  <span className="block mt-1 text-slate-700 dark:text-slate-300">
                    🎯 <em>Com a banca inicial de R$ {numInitial.toFixed(2)}, o piso de corte começa em <strong>R$ {Math.max(0, numInitial * (1 - (parseFloat(stopLossPercentage) || 0) / 100)).toFixed(2)}</strong>. Ao subir a banca, o piso acompanhará o novo topo.</em>
                  </span>
                )}
              </p>
            </div>

            {/* Regras complementares (Stop Loss / Stop Gain diários) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Stop Loss Diário (R$, opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={stopLossDaily}
                    onChange={(e) => setStopLossDaily(e.target.value)}
                    placeholder="Ex: 50.00"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Stop Gain Diário (R$, opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={stopGainDaily}
                    onChange={(e) => setStopGainDaily(e.target.value)}
                    placeholder="Ex: 150.00"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Status e Descrição */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status do Projeto
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SportsBettingProjectStatus)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="ACTIVE">🟢 Ativo (Em Operação)</option>
                  <option value="PAUSED">🟡 Pausado (Aguardando)</option>
                  <option value="COMPLETED">🔵 Concluído (Meta Atingida)</option>
                  <option value="ARCHIVED">⚪ Arquivado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição & Regras da Estratégia
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Entradas focadas em Cantos Limite e Over 1.5 HT com odd mínima 1.70..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons (Fixed at bottom of modal) */}
        <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex items-center justify-between gap-3 shrink-0">
          <div>
            {editingProject && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(editingProject.id, editingProject.name);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir Projeto
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {editingProject ? 'Salvar Alterações' : 'Criar Projeto'}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
);
};
