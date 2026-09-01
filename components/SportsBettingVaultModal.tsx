import React, { useState } from 'react';
import {
  SportsBettingConfig,
  SportsBettingVaultTransfer,
} from '../types';
import {
  X,
  ShieldCheck,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Calendar,
  History,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';

interface SportsBettingVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SportsBettingConfig;
  vaultTransfers: SportsBettingVaultTransfer[];
  onTransfer: (type: 'WITHDRAWAL' | 'REINJECT_TO_BANKROLL', amount: number, notes?: string) => void;
}

export const SportsBettingVaultModal: React.FC<SportsBettingVaultModalProps> = ({
  isOpen,
  onClose,
  config,
  vaultTransfers = [],
  onTransfer,
}) => {
  const [transferType, setTransferType] = useState<'WITHDRAWAL' | 'REINJECT_TO_BANKROLL'>('WITHDRAWAL');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const numAmount = parseFloat(amount.replace(',', '.')) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (numAmount <= 0) {
      toast.error('Informe um valor maior que zero');
      return;
    }

    if (numAmount > config.protectedVault) {
      toast.error(`Saldo insuficiente no cofre. Disponível: R$ ${config.protectedVault.toFixed(2)}`);
      return;
    }

    onTransfer(transferType, numAmount, notes.trim() || undefined);
    toast.success(
      transferType === 'WITHDRAWAL'
        ? `Resgate de R$ ${numAmount.toFixed(2)} registrado com sucesso!`
        : `R$ ${numAmount.toFixed(2)} reinjetados na banca ativa!`
    );
    setAmount('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cofre de Proteção & Reserva Segura</h3>
              <p className="text-xs text-slate-400">Lucros blindados e acumulados fora do risco de mercado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Vault Balance Card */}
          <div className="p-5 bg-gradient-to-br from-sky-950/40 via-slate-900 to-indigo-950/40 border border-sky-500/30 rounded-2xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-sky-300 uppercase tracking-wide">
                  Saldo Protegido no Cofre
                </span>
              </div>
              <p className="text-2xl font-black text-white font-mono mt-1">
                R$ {config.protectedVault.toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Alimentado com {config.protectionPercentage}% de cada aposta vencedora
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Banca Ativa Atual</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                R$ {config.currentBankroll.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Transfer Form */}
          <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide block">
              Movimentar Recursos do Cofre
            </span>

            {/* Type selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTransferType('WITHDRAWAL')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  transferType === 'WITHDRAWAL'
                    ? 'bg-emerald-950/30 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold">Realizar Saque</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Sacar do cofre para sua conta bancária (Lucro realizado).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTransferType('REINJECT_TO_BANKROLL')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  transferType === 'REINJECT_TO_BANKROLL'
                    ? 'bg-indigo-950/30 border-indigo-500 text-indigo-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold">Injetar na Banca</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Transferir do cofre para a banca ativa para alavancar apostas.
                </p>
              </button>
            </div>

            {/* Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Valor (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-mono">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.10"
                    max={config.protectedVault}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Observação / Destino</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Saque Pix Nubank, Aporte especial..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Quick % buttons */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-500">Atalhos:</span>
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setAmount(((config.protectedVault * pct) / 100).toFixed(2))}
                  className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  {pct}%
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={config.protectedVault <= 0}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-sky-950 flex items-center justify-center gap-2 mt-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar Movimentação
            </button>
          </form>

          {/* Transfers Log */}
          {vaultTransfers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wide">
                <History className="w-4 h-4 text-slate-400" />
                Histórico de Movimentações do Cofre
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {vaultTransfers.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 bg-slate-950/40 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1 rounded-lg ${
                          t.type === 'WITHDRAWAL'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-indigo-500/10 text-indigo-400'
                        }`}
                      >
                        {t.type === 'WITHDRAWAL' ? (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white">
                          {t.type === 'WITHDRAWAL' ? 'Saque / Lucro Realizado' : 'Reinjeção na Banca'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(t.date).toLocaleDateString('pt-BR')} • {t.notes || 'Sem notas'}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold font-mono text-sky-400">
                      R$ {t.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
