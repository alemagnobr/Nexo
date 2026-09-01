import React, { useState, useEffect } from 'react';
import {
  SportsBetOperation,
  SportsBetStatus,
  SportsBettingConfig,
} from '../types';
import {
  COMMON_MARKETS,
  SPORTS_CATEGORIES,
  calculateBetOutcome,
  calculateRecommendedStake,
} from '../services/sportsBettingService';
import {
  X,
  Plus,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Percent,
  Sparkles,
  Calculator,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface SportsBettingOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (opData: any) => void;
  editingOperation?: SportsBetOperation | null;
  config: SportsBettingConfig;
}

export const SportsBettingOperationModal: React.FC<SportsBettingOperationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingOperation,
  config,
}) => {
  const recommendedStake = calculateRecommendedStake(
    config.currentBankroll,
    config.stakePercentage
  );

  const [event, setEvent] = useState('');
  const [sport, setSport] = useState('Futebol');
  const [competition, setCompetition] = useState('');
  const [market, setMarket] = useState('Over 2.5 Gols');
  const [customMarket, setCustomMarket] = useState('');
  const [odds, setOdds] = useState('1.85');
  const [stake, setStake] = useState(String(recommendedStake));
  const [status, setStatus] = useState<SportsBetStatus>('WIN');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingOperation) {
      setEvent(editingOperation.event);
      setSport(editingOperation.sport || 'Futebol');
      setCompetition(editingOperation.competition || '');
      if (COMMON_MARKETS.includes(editingOperation.market)) {
        setMarket(editingOperation.market);
        setCustomMarket('');
      } else {
        setMarket('Outro Mercado');
        setCustomMarket(editingOperation.market);
      }
      setOdds(String(editingOperation.odds));
      setStake(String(editingOperation.stake));
      setStatus(editingOperation.status);
      setDate(editingOperation.date.includes('T') ? editingOperation.date.split('T')[0] : editingOperation.date);
      setTime(editingOperation.time || new Date().toTimeString().slice(0, 5));
      setNotes(editingOperation.notes || '');
    } else {
      // Reset form with recommended stake
      setEvent('');
      setSport('Futebol');
      setCompetition('');
      setMarket('Over 2.5 Gols');
      setCustomMarket('');
      setOdds('1.85');
      setStake(String(recommendedStake));
      setStatus('WIN');
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toTimeString().slice(0, 5));
      setNotes('');
    }
  }, [editingOperation, isOpen, config.currentBankroll, config.stakePercentage]);

  if (!isOpen) return null;

  const numOdds = parseFloat(odds.replace(',', '.')) || 0;
  const numStake = parseFloat(stake.replace(',', '.')) || 0;
  const effectiveMarket = market === 'Outro Mercado' ? (customMarket.trim() || 'Outro') : market;

  const outcome = calculateBetOutcome(
    numStake,
    numOdds,
    status,
    config.compoundPercentage,
    config.protectionPercentage
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!event.trim()) {
      toast.error('Informe o jogo ou evento (ex: Real Madrid vs Barcelona)');
      return;
    }

    if (numOdds < 1.01) {
      toast.error('A odd deve ser maior ou igual a 1.01');
      return;
    }

    if (numStake <= 0) {
      toast.error('O valor da entrada (stake) deve ser maior que zero');
      return;
    }

    const payload = {
      event: event.trim(),
      sport,
      competition: competition.trim() || undefined,
      market: effectiveMarket,
      odds: numOdds,
      stake: numStake,
      stakePercentageUsed: config.currentBankroll > 0 
        ? Math.round((numStake / config.currentBankroll) * 1000) / 10 
        : config.stakePercentage,
      status,
      date,
      time,
      notes: notes.trim() || undefined,
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editingOperation ? 'Editar Operação Esportiva' : 'Nova Entrada / Operação'}
              </h3>
              <p className="text-xs text-slate-400">
                Gestão com Juros Compostos ({config.compoundPercentage}%) e Proteção de Risco ({config.protectionPercentage}%)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Quick Stake Helper Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs text-slate-300">
                Entrada Recomendada: <strong className="text-emerald-400">R$ {recommendedStake.toFixed(2)}</strong> ({config.stakePercentage}% da banca atual de R$ {config.currentBankroll.toFixed(2)})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStake(String(recommendedStake))}
              className="text-[11px] font-bold px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-sm"
            >
              Usar Recomendada
            </button>
          </div>

          {/* Event & Sport */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Jogo / Evento <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                placeholder="Ex: Real Madrid vs Barcelona, Flamengo vs Palmeiras"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Esporte</label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {SPORTS_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Competition & Market */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Competição / Torneio (Opcional)</label>
              <input
                type="text"
                value={competition}
                onChange={(e) => setCompetition(e.target.value)}
                placeholder="Ex: Champions League, Premier League, NBA"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Mercado Apostado</label>
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {COMMON_MARKETS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {market === 'Outro Mercado' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nome do Mercado Personalizado</label>
              <input
                type="text"
                value={customMarket}
                onChange={(e) => setCustomMarket(e.target.value)}
                placeholder="Digite o mercado (ex: Jogador X Over 1.5 chutes ao gol)"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Odd, Stake & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Odd (Cotação) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  value={odds}
                  onChange={(e) => setOdds(e.target.value)}
                  placeholder="1.85"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Valor da Entrada (R$) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 text-sm font-mono">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.10"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  placeholder="30.00"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Resultado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SportsBetStatus)}
                className={`w-full px-3.5 py-2.5 bg-slate-800 border rounded-xl text-sm font-bold focus:outline-none ${
                  status === 'WIN'
                    ? 'text-emerald-400 border-emerald-500/50'
                    : status === 'LOSS'
                    ? 'text-rose-400 border-rose-500/50'
                    : status === 'HALF_WIN'
                    ? 'text-teal-400 border-teal-500/50'
                    : status === 'HALF_LOSS'
                    ? 'text-orange-400 border-orange-500/50'
                    : status === 'VOID'
                    ? 'text-slate-400 border-slate-500/50'
                    : 'text-amber-400 border-amber-500/50'
                }`}
              >
                <option value="WIN">🟢 GREEN (Vitória)</option>
                <option value="LOSS">🔴 RED (Derrota)</option>
                <option value="HALF_WIN">🟢🟡 MEIO GREEN (Meia Vitória)</option>
                <option value="HALF_LOSS">🔴🟡 MEIO RED (Meia Perda)</option>
                <option value="VOID">⚪ VOID (Reembolso / Anulada)</option>
                <option value="PENDING">⏳ PENDENTE (Em Aberto)</option>
              </select>
            </div>
          </div>

          {/* Real-time Math Preview Box */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                  Divisão da Gestão de Risco em Tempo Real
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {status === 'WIN' ? 'Lucro Total: ' : 'Impacto: '}
                <strong
                  className={`font-mono ${
                    outcome.netProfit > 0
                      ? 'text-emerald-400'
                      : outcome.netProfit < 0
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {outcome.netProfit >= 0 ? '+' : ''}R$ {outcome.netProfit.toFixed(2)}
                </strong>
              </span>
            </div>

            {status === 'WIN' || status === 'HALF_WIN' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Compound Interest */}
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      Juros Compostos ({config.compoundPercentage}%)
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-mono">Banca Ativa</span>
                  </div>
                  <p className="text-base font-bold text-emerald-400 font-mono">
                    + R$ {outcome.compoundAmount.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Reinvestido diretamente para aumentar a próxima stake
                  </p>
                </div>

                {/* Risk Protection */}
                <div className="p-3 bg-sky-950/30 border border-sky-500/30 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-sky-300 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                      Proteção de Risco ({config.protectionPercentage}%)
                    </span>
                    <span className="text-[10px] text-sky-400/80 font-mono">Cofre Seguro</span>
                  </div>
                  <p className="text-base font-bold text-sky-400 font-mono">
                    + R$ {outcome.protectedAmount.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Guardado seguro e blindado, fora de qualquer risco
                  </p>
                </div>
              </div>
            ) : status === 'LOSS' || status === 'HALF_LOSS' ? (
              <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    Prejuízo da Operação
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Descontado da banca ativa. O Cofre de Proteção permanece 100% blindado e intocado!
                  </p>
                </div>
                <span className="text-base font-bold text-rose-400 font-mono">
                  - R$ {Math.abs(outcome.netProfit).toFixed(2)}
                </span>
              </div>
            ) : status === 'PENDING' ? (
              <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Operação em Aberto
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Se vencer, gerará R$ {((numStake * numOdds) - numStake).toFixed(2)} de lucro distribuído.
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-300 font-mono">
                  Retorno Potencial: R$ {(numStake * numOdds).toFixed(2)}
                </span>
              </div>
            ) : (
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
                Aposta anulada / devolvida. O saldo da banca não sofreu alteração.
              </div>
            )}
          </div>

          {/* Date, Time & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Data e Hora</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Notas / Análise Pré-Jogo (Opcional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Time da casa pressionando, desfalques defensivos..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
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
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg shadow-emerald-950 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {editingOperation ? 'Salvar Alterações' : 'Registrar Operação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
