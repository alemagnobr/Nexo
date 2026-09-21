import React, { useState, useEffect } from 'react';
import { SportsBettingConfig } from '../types';
import {
  X,
  Sliders,
  DollarSign,
  Percent,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';

interface SportsBettingConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SportsBettingConfig;
  investments?: any[];
  onSaveConfig: (newConfig: Partial<SportsBettingConfig>, reapplyToHistory: boolean) => void;
  onResetCycle: (initialBankroll: number, clearHistory: boolean) => void;
}

export const SportsBettingConfigModal: React.FC<SportsBettingConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  investments = [],
  onSaveConfig,
  onResetCycle,
}) => {
  const [initialBankroll, setInitialBankroll] = useState(String(config.initialBankroll));
  const [stakePercentage, setStakePercentage] = useState(String(config.stakePercentage));
  const [compoundPercentage, setCompoundPercentage] = useState(String(config.compoundPercentage));
  const [protectionPercentage, setProtectionPercentage] = useState(String(config.protectionPercentage));
  const [protectionInvestmentId, setProtectionInvestmentId] = useState(config.protectionInvestmentId || '');
  const [stopLossPercentage, setStopLossPercentage] = useState(config.stopLossPercentage ? String(config.stopLossPercentage) : '');
  const [stopLossDaily, setStopLossDaily] = useState(config.stopLossDaily ? String(config.stopLossDaily) : '');
  const [stopGainDaily, setStopGainDaily] = useState(config.stopGainDaily ? String(config.stopGainDaily) : '');
  const [strategyName, setStrategyName] = useState(config.strategyName || '');
  const [notes, setNotes] = useState(config.notes || '');
  const [reapplyToHistory, setReapplyToHistory] = useState(false);

  // Tab: Config vs Reset
  const [activeSubTab, setActiveSubTab] = useState<'CONFIG' | 'RESET'>('CONFIG');
  const [resetInitial, setResetInitial] = useState(String(config.initialBankroll));
  const [clearHistoryOnReset, setClearHistoryOnReset] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInitialBankroll(String(config.initialBankroll));
      setStakePercentage(String(config.stakePercentage));
      setCompoundPercentage(String(config.compoundPercentage));
      setProtectionPercentage(String(config.protectionPercentage));
      setProtectionInvestmentId(config.protectionInvestmentId || '');
      setStopLossPercentage(config.stopLossPercentage ? String(config.stopLossPercentage) : '');
      setStopLossDaily(config.stopLossDaily ? String(config.stopLossDaily) : '');
      setStopGainDaily(config.stopGainDaily ? String(config.stopGainDaily) : '');
      setStrategyName(config.strategyName || '');
      setNotes(config.notes || '');
      setReapplyToHistory(false);
      setResetInitial(String(config.initialBankroll));
      setClearHistoryOnReset(false);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  // Auto balance compound + protection if user tweaks sliders
  const handleCompoundChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setCompoundPercentage(String(clamped));
    setProtectionPercentage(String(100 - clamped));
  };

  const handleProtectionChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setProtectionPercentage(String(clamped));
    setCompoundPercentage(String(100 - clamped));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const numInitial = parseFloat(initialBankroll.replace(',', '.')) || 0;
    const numStakePct = parseFloat(stakePercentage.replace(',', '.')) || 0;
    const numCompPct = parseFloat(compoundPercentage.replace(',', '.')) || 0;
    const numProtPct = parseFloat(protectionPercentage.replace(',', '.')) || 0;

    if (numInitial <= 0) {
      toast.error('O capital inicial deve ser maior que zero');
      return;
    }

    if (numStakePct <= 0 || numStakePct > 100) {
      toast.error('A exposição por entrada deve estar entre 0.1% e 100%');
      return;
    }

    const numStopLossPct = stopLossPercentage ? (parseFloat(stopLossPercentage.replace(',', '.')) || undefined) : undefined;

    onSaveConfig(
      {
        initialBankroll: numInitial,
        stakePercentage: numStakePct,
        compoundPercentage: numCompPct,
        protectionPercentage: numProtPct,
        protectionInvestmentId: protectionInvestmentId || undefined,
        stopLossPercentage: numStopLossPct,
        minimumStake: 0,
        strategyName: strategyName.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      reapplyToHistory
    );

    toast.success('Configurações de gestão de risco salvas com sucesso!');
    onClose();
  };

  const handleExecuteReset = () => {
    const numReset = parseFloat(resetInitial.replace(',', '.')) || 0;
    if (numReset <= 0) {
      toast.error('Informe um valor de banca válido para reiniciar o ciclo');
      return;
    }

    if (
      confirm(
        clearHistoryOnReset
          ? 'Tem certeza que deseja REINICIAR a banca e APAGAR todo o histórico de operações?'
          : 'Deseja reiniciar a banca para o valor inicial especificado mantendo o histórico para consultas?'
      )
    ) {
      onResetCycle(numReset, clearHistoryOnReset);
      toast.success('Ciclo de banca reiniciado com sucesso!');
      onClose();
    }
  };

  const numInitialParsed = parseFloat(initialBankroll.replace(',', '.')) || 0;
  const numStakePctParsed = parseFloat(stakePercentage.replace(',', '.')) || 0;
  const recommendedCalculated = (numInitialParsed * (numStakePctParsed / 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Configurações de Gestão de Risco</h3>
              <p className="text-xs text-slate-400">Personalize sua estratégia de Juros Compostos e Proteção</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs for Config vs Reset */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('CONFIG')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeSubTab === 'CONFIG'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Parâmetros de Gestão
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('RESET')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeSubTab === 'RESET'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Reiniciar Ciclo / Rebase
          </button>
        </div>

        {activeSubTab === 'CONFIG' ? (
          <form onSubmit={handleSave} className="p-6 space-y-5">
            {/* Initial Bankroll & Stake Percentage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Capital Inicial (R$)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={initialBankroll}
                  onChange={(e) => setInitialBankroll(e.target.value)}
                  placeholder="1000"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
                <span className="text-[10px] text-slate-500">Ponto de partida da banca base</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-indigo-400" />
                  Exposição por Entrada (% Stake)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    max="50"
                    value={stakePercentage}
                    onChange={(e) => setStakePercentage(e.target.value)}
                    placeholder="3.0"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-mono">%</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Próxima entrada base: <strong className="text-emerald-400">R$ {recommendedCalculated.toFixed(2)}</strong>
                </span>
              </div>
            </div>

            {/* Split Sliders: Compound vs Protection */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Divisão Automática dos Lucros (A cada Vitória / Green)
                </span>
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {compoundPercentage}% / {protectionPercentage}%
                </span>
              </div>

              {/* Compound Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" /> Juros Compostos (Crescimento da Banca Ativa)
                  </span>
                  <strong className="text-emerald-400 font-mono">{compoundPercentage}%</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={compoundPercentage}
                  onChange={(e) => handleCompoundChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <p className="text-[10px] text-slate-400">
                  Essa porcentagem do lucro é somada à banca ativa para aumentar o valor das próximas apostas (efeito bola de neve).
                </p>
              </div>

              {/* Protection Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-sky-400 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Proteção de Risco (Cofre Seguro Blindado)
                  </span>
                  <strong className="text-sky-400 font-mono">{protectionPercentage}%</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={protectionPercentage}
                  onChange={(e) => handleProtectionChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <p className="text-[10px] text-slate-400">
                  Essa porcentagem do lucro é retirada do risco e guardada num cofre seguro, blindando seus ganhos contra eventuais sequências ruins (downswings).
                </p>
              </div>
              
              {/* Destino da Proteção */}
              <div className="pt-2 border-t border-slate-700/80">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Destino da Proteção (Opcional)
                </label>
                <p className="text-[10px] text-slate-400 mb-2 leading-tight">
                  Escolha um ativo já criado (Caixinha, FII, Ação) para vincular a esta proteção.
                </p>
                <select
                  value={protectionInvestmentId}
                  onChange={(e) => setProtectionInvestmentId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

            {/* Trailing Stop Loss Dinâmico */}
            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  Trailing Stop Loss do Projeto (%)
                </label>
                <span className="text-[10px] text-rose-400/90 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-medium">
                  Proteção Móvel de Topo
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={stopLossPercentage}
                  onChange={(e) => setStopLossPercentage(e.target.value)}
                  placeholder="Ex: 20 (Protege 80% do topo atingido)"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500 pr-10"
                />
                <span className="absolute right-3.5 top-2.5 text-sm text-slate-400 font-bold">%</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Calculado sobre o <strong>valor mais alto alcançado</strong> pela banca ativa. Se você começou com R$ 2,00 e subiu para R$ 2,30, um Stop Loss de 20% garantirá que a banca nunca caia abaixo de R$ 1,84 (80% de R$ 2,30).
              </p>
            </div>

            {/* Strategy Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nome / Identificação da Estratégia</label>
              <input
                type="text"
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                placeholder="Ex: Gestão Conservadora 70/30"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Checkbox: Reapply retroactively */}
            <div className="flex items-start gap-3 p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
              <input
                type="checkbox"
                id="reapplyRetro"
                checked={reapplyToHistory}
                onChange={(e) => setReapplyToHistory(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="reapplyRetro" className="text-xs text-slate-300 cursor-pointer">
                <strong>Recalcular todo o histórico de operações com os novos parâmetros</strong>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Se marcado, reprocessará todas as entradas passadas desde o início com essa nova proporção de juros e proteção.
                </p>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-950 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Salvar Parâmetros
              </button>
            </div>
          </form>
        ) : (
          /* Reset Tab */
          <div className="p-6 space-y-5">
            <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                Atenção ao Reiniciar o Ciclo de Banca
              </div>
              <p className="text-xs text-slate-300">
                Esta ação redefinirá a banca ativa e o cofre de proteção para o novo valor inicial estabelecido.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Novo Capital Inicial (R$)</label>
              <input
                type="number"
                step="1"
                min="1"
                value={resetInitial}
                onChange={(e) => setResetInitial(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
              <input
                type="checkbox"
                id="clearHistoryCheck"
                checked={clearHistoryOnReset}
                onChange={(e) => setClearHistoryOnReset(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded bg-slate-800 border-slate-700 text-rose-600 focus:ring-rose-500"
              />
              <label htmlFor="clearHistoryCheck" className="text-xs text-slate-300 cursor-pointer">
                <strong>Limpar e apagar todo o histórico de operações anteriores</strong>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Se desmarcado, as operações passadas continuarão salvas para relatórios e análises.
                </p>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                className="px-6 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-950 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Confirmar Reinício de Ciclo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
