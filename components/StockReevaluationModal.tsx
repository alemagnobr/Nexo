import React, { useState } from 'react';
import { StockAsset, StockReevaluationAudit, StockSnapshot } from '../types';
import { reevaluateStockThesis } from '../services/stocksGrowthService';
import {
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Layers,
  Activity,
  ArrowRight,
  Info,
} from 'lucide-react';

interface StockReevaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockAsset;
  onAuditComplete: (audit: StockReevaluationAudit) => void;
  hasApiKey: boolean;
}

export const StockReevaluationModal: React.FC<StockReevaluationModalProps> = ({
  isOpen,
  onClose,
  stock,
  onAuditComplete,
  hasApiKey,
}) => {
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<StockReevaluationAudit | null>(null);

  if (!isOpen) return null;

  const handleRunAudit = async () => {
    setLoading(true);
    try {
      const result = await reevaluateStockThesis(stock);
      setAuditResult(result);
      onAuditComplete(result);
    } catch (e) {
      console.error('Audit failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'TESE_MANTIDA':
        return {
          label: '🟢 Tese Mantida',
          bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
        };
      case 'ATENCAO':
        return {
          label: '🟡 Atenção',
          bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300',
        };
      case 'TESE_ENFRAQUECIDA':
        return {
          label: '🟠 Tese Enfraquecida',
          bg: 'bg-orange-50 dark:bg-orange-950/60 border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-300',
        };
      case 'MUDANCA_ESTRUTURAL':
        return {
          label: '🔴 Mudança Estrutural',
          bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300',
        };
      default:
        return {
          label: '🟢 Tese Mantida',
          bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-700',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/30 border border-indigo-400/30 rounded-2xl">
              <Search className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-md border border-indigo-400/30">
                  Auditoria de Tese
                </span>
                <span className="text-xs text-slate-400">
                  {stock.ticker} — {stock.name}
                </span>
              </div>
              <h3 className="text-xl font-black tracking-tight text-white mt-1">
                Reavaliação Estrutural de Fundamentos
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Intro Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800 dark:text-white mb-1">
                Sinais para reavaliar, não vender às cegas.
              </p>
              <p>
                A auditoria compara a situação original dos fundamentos com os dados operacionais mais recentes da CVM / B3. O modelo identifica se houve alteração na capacidade de geração de valor ou se é apenas volatilidade passageira de cotação.
              </p>
            </div>
          </div>

          {!auditResult ? (
            /* Ready to Run Screen */
            <div className="space-y-6">
              {/* Snapshot Preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Growth Score</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white">{stock.growthScore}/100</span>
                </div>
                <div className="p-3.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">ROIC Atual</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{stock.roic}%</span>
                </div>
                <div className="p-3.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Dív. Líq / EBITDA</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white">{stock.netDebtToEbitda}x</span>
                </div>
                <div className="p-3.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">P/L Atual</span>
                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{stock.peRatio}x</span>
                </div>
              </div>

              {/* Triggers Checklist Preview */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Gatilhos de Monitoramento Contínuo
                </h4>
                <div className="space-y-2">
                  {stock.triggers.map((tr) => (
                    <div
                      key={tr.id}
                      className="p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {tr.condition}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {tr.motive}
                        </span>
                      </div>
                      <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {tr.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleRunAudit}
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Auditando Demonstrações Financeiras B3...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-indigo-200" />
                    <span>Executar Auditoria de Tese Agora</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Audit Result Screen */
            <div className="space-y-6 animate-fade-in">
              {/* Status Header */}
              <div className="p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Conclusão do Diagnóstico
                  </span>
                  <div className="flex items-center gap-2.5">
                    <span className={`px-3 py-1 rounded-full text-xs font-black border ${getStatusBadge(auditResult.status).bg}`}>
                      {getStatusBadge(auditResult.status).label}
                    </span>
                    <span className="text-xs text-slate-500">
                      Impacto: <strong className="text-slate-700 dark:text-slate-200">{auditResult.impactLevel}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-slate-200 dark:sm:border-slate-700 sm:pl-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Novo Growth Score</span>
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {auditResult.newGrowthScore}/100
                  </span>
                </div>
              </div>

              {/* Comparison: Situação Anterior vs Atual */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  Comparativo: Situação na Compra × Situação Atual
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-slate-500">Situação Anterior</span>
                      <span className="text-[10px] text-slate-400">{auditResult.previousSnapshot.date}</span>
                    </div>
                    <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between"><span>Preço:</span> <strong>R$ {auditResult.previousSnapshot.price.toFixed(2)}</strong></div>
                      <div className="flex justify-between"><span>ROIC:</span> <strong>{auditResult.previousSnapshot.roic}%</strong></div>
                      <div className="flex justify-between"><span>Dívida/EBITDA:</span> <strong>{auditResult.previousSnapshot.netDebtToEbitda}x</strong></div>
                      <div className="flex justify-between"><span>P/L:</span> <strong>{auditResult.previousSnapshot.peRatio}x</strong></div>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-indigo-200 dark:border-indigo-800">
                      <span className="font-bold text-indigo-700 dark:text-indigo-300">Situação Atual (Hoje)</span>
                      <span className="text-[10px] text-indigo-500">{auditResult.auditDate}</span>
                    </div>
                    <div className="space-y-1.5 text-slate-800 dark:text-slate-200">
                      <div className="flex justify-between"><span>Preço:</span> <strong className="text-indigo-600 dark:text-indigo-400">R$ {stock.currentPrice.toFixed(2)}</strong></div>
                      <div className="flex justify-between"><span>ROIC:</span> <strong className="text-emerald-600 dark:text-emerald-400">{stock.roic}%</strong></div>
                      <div className="flex justify-between"><span>Dívida/EBITDA:</span> <strong>{stock.netDebtToEbitda}x</strong></div>
                      <div className="flex justify-between"><span>P/L:</span> <strong>{stock.peRatio}x</strong></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* What changed list */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  O Que Mudou nos Indicadores
                </h4>
                <div className="space-y-1.5">
                  {auditResult.whatChanged.map((change, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{change}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parecer do Analista */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-700 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold uppercase text-indigo-300">
                    Parecer Técnico do Analista
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  "{auditResult.analystConclusion}"
                </p>
              </div>

              {/* Re-run or Close */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleRunAudit}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Reexecutar Auditoria
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shadow-md transition-colors"
                >
                  Concluir e Salvar Diagnóstico
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
