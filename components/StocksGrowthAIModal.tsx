import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  X,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Sliders,
  DollarSign,
  ArrowRight,
  Layers,
  HelpCircle,
  Activity,
  Bot
} from 'lucide-react';
import { StockAsset, StockAIEvaluationReport, StockSemaphore } from '../types';
import { toast } from 'sonner';

interface StocksGrowthAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: StockAIEvaluationReport | null;
  loading: boolean;
  onRunNewScan: (aporteAmount: number) => Promise<void>;
  onApplyRecommendations: (report: StockAIEvaluationReport) => void;
  onSelectStockToInvest: (ticker: string, shares: number, totalCost: number) => void;
  onSelectBasketToInvest?: (aporteAmount: number) => void;
  currentAporte: number;
}

export const StocksGrowthAIModal: React.FC<StocksGrowthAIModalProps> = ({
  isOpen,
  onClose,
  report,
  loading,
  onRunNewScan,
  onApplyRecommendations,
  onSelectStockToInvest,
  onSelectBasketToInvest,
  currentAporte,
}) => {
  const [aporteVal, setAporteVal] = useState<number>(currentAporte || 1000);
  const [activeSubTab, setActiveSubTab] = useState<'top_pick' | 'radar' | 'macro' | 'tactical'>('top_pick');

  if (!isOpen) return null;

  const handleRunScan = () => {
    if (aporteVal <= 0) {
      toast.error('Informe um valor de aporte válido.');
      return;
    }
    onRunNewScan(aporteVal);
  };

  const getSemaphoreColor = (semaphore: StockSemaphore) => {
    switch (semaphore) {
      case 'APORTAR':
        return 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300';
      case 'AGUARDAR':
        return 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300';
      case 'REAVALIAR':
        return 'bg-orange-50 dark:bg-orange-950/60 border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-300';
      case 'TESE_DETERIORADA':
        return 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-scale-up my-auto">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-900/40 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                  Motor de Crescimento IA
                </span>
                {report?.isCustomAI && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Bot className="w-3 h-3" /> Gemini 3.7 Flash
                  </span>
                )}
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white">
                Radar de Avaliação & Assimetria por IA
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan Action Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Valor do Aporte para o Radar:
            </span>
            <div className="flex items-center gap-1">
              {[500, 1000, 2000, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAporteVal(val)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    aporteVal === val
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  R$ {val}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="relative w-32">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                R$
              </span>
              <input
                type="number"
                min="50"
                step="50"
                value={aporteVal}
                onChange={(e) => setAporteVal(Number(e.target.value) || 0)}
                className="w-full pl-8 pr-2.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Custom"
              />
            </div>

            <button
              onClick={handleRunScan}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Buscando e Auditando...' : 'Executar Nova Busca por IA'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin" />
                <Sparkles className="w-6 h-6 text-indigo-500 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-base font-black text-slate-800 dark:text-white">
                  Inteligência Artificial Analisando a B3
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cruzando cotações em tempo real, rentabilidade (ROIC), taxa de crescimento, múltiplos de valuation e assimetria de risco/retorno para encontrar a melhor oportunidade...
                </p>
              </div>
            </div>
          ) : report ? (
            <>
              {/* Report Sub Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                {[
                  { id: 'top_pick', label: '🏆 Top 1 Assimetria IA', icon: Award },
                  { id: 'radar', label: '📊 Radar de Ativos & Semáforos', icon: Activity },
                  { id: 'macro', label: '🧠 Cenário Macro & Setorial', icon: Layers },
                  { id: 'tactical', label: '💡 Dicas Táticas & Alertas', icon: Zap },
                ].map((tab) => {
                  const isActive = activeSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSubTab(tab.id as any)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Subtab 1: Top Pick */}
              {activeSubTab === 'top_pick' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Top 1 Highlight Card */}
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-indigo-950/90 border border-emerald-500/40 text-white shadow-xl relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-emerald-500/20">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5" />
                            TOP 1 Eleito pela IA no Aporte de R$ {report.aporteConsidered.toFixed(2)}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Score IA: {report.topPick.growthScore}/100
                          </span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black text-white">
                          {report.topPick.ticker} — {report.topPick.name}
                        </h3>
                        <p className="text-xs text-slate-300">
                          Setor: <strong className="text-white">{report.topPick.sector}</strong> • Cotação: <strong className="text-emerald-400">R$ {report.topPick.currentPrice.toFixed(2)}</strong> • Preço Justo Estimado: <strong className="text-indigo-300">R$ {report.topPick.fairPriceEstimated.toFixed(2)}</strong> (+{report.topPick.safetyMarginPercent}% de margem)
                        </p>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Simulação do Aporte
                        </span>
                        <div className="text-xl font-black text-emerald-400">
                          {report.topPick.targetSharesForAporte || Math.floor(report.aporteConsidered / report.topPick.currentPrice)} ações
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Total: R$ {((report.topPick.targetSharesForAporte || Math.floor(report.aporteConsidered / report.topPick.currentPrice)) * report.topPick.currentPrice).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="py-4 space-y-3">
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 block mb-1">
                          Justificativa Técnica da Assimetria Vencedora:
                        </span>
                        <p className="text-xs md:text-sm text-slate-200 leading-relaxed bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                          {report.topPick.whyTopPick}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300">Semáforo:</span>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${getSemaphoreColor(report.topPick.semaphore)}`}>
                          🟢 {report.topPick.semaphore}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          const shares = report.topPick.targetSharesForAporte || Math.floor(report.aporteConsidered / report.topPick.currentPrice);
                          const total = shares * report.topPick.currentPrice;
                          onSelectStockToInvest(report.topPick.ticker, shares, total);
                          onClose();
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer font-bold"
                      >
                        <span>Aportar no TOP 1 Agora</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 2: Radar & Semaphores */}
              {activeSubTab === 'radar' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white">
                        Ranking de Assimetria & Semáforo de Cada Ativo
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Classificação de todas as empresas auditadas ordenadas pela melhor relação risco x retorno.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {onSelectBasketToInvest && (
                        <button
                          onClick={() => {
                            onSelectBasketToInvest(aporteVal);
                            onClose();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Distribuir no TOP 5</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onApplyRecommendations(report);
                          toast.success('Semáforos e notas da IA aplicados na carteira!');
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Aplicar Notas na Carteira</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.rankedAssets.map((asset) => {
                      const shares = Math.max(1, Math.floor(aporteVal / (asset.currentPrice || 1)));
                      const totalCost = Number((shares * asset.currentPrice).toFixed(2));

                      return (
                        <div
                          key={asset.ticker}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-black flex items-center justify-center">
                                    #{asset.asymmetryRank}
                                  </span>
                                  <h5 className="text-sm font-black text-slate-800 dark:text-white">
                                    {asset.ticker} — {asset.name}
                                  </h5>
                                </div>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {asset.sector} • R$ {asset.currentPrice.toFixed(2)}
                                </span>
                              </div>

                              <div className="flex flex-col items-end">
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${getSemaphoreColor(asset.semaphore)}`}>
                                  {asset.semaphore}
                                </span>
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                                  Score IA: {asset.aiGrowthScore}/100
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                              {asset.highlightRationale}
                            </p>

                            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                              <span>Vetor: <strong className="text-slate-700 dark:text-slate-300">{asset.growthDriver}</strong></span>
                              <span>Risco: <strong className="text-amber-600 dark:text-amber-400">{asset.mainRiskAlert}</strong></span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Com R$ {aporteVal}: <strong className="text-slate-800 dark:text-white">{shares} ações (R$ {totalCost.toFixed(2)})</strong>
                            </span>

                            <button
                              onClick={() => {
                                onSelectStockToInvest(asset.ticker, shares, totalCost);
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span>Registrar Aporte</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Subtab 3: Macro & Sectoral */}
              {activeSubTab === 'macro' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4" />
                      Veredito Executivo do Momento
                    </span>
                    <p className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed">
                      {report.macroContext.summaryVerdict}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
                      <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                        Impacto dos Juros (Selic) & Custo de Capital
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {report.macroContext.interestRateScenario}
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
                      <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                        Perspectivas Setoriais (Compounders B3)
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {report.macroContext.sectorOutlook}
                      </p>
                    </div>
                  </div>

                  {/* Sources if present */}
                  {report.sources && report.sources.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                      <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block">
                        Fontes & Notícias B3 Coletadas pela IA:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {report.sources.map((src, i) => (
                          <a
                            key={i}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>{src.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subtab 4: Tactical Advice & Risk */}
              {activeSubTab === 'tactical' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Conselhos Táticos para os Próximos Aportes
                    </h4>
                    <ul className="space-y-2">
                      {report.tacticalAdvice.map((adv, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{adv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-3">
                    <h4 className="text-sm font-black text-rose-800 dark:text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      Gatilhos de Risco & Alertas no Radar
                    </h4>
                    <ul className="space-y-2">
                      {report.riskAlerts.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
                          <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-indigo-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Nenhuma avaliação executada recentemente
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Clique no botão abaixo para que o Gemini 3.7 analise em tempo real os ativos de crescimento da B3.
              </p>
              <button
                onClick={handleRunScan}
                className="px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
              >
                Iniciar Avaliação por IA
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {report?.analyzedAt ? `Última auditoria da IA: ${report.analyzedAt}` : 'Avaliação assistida por IA'}
          </span>

          <div className="flex items-center gap-2">
            {report && (
              <button
                onClick={() => {
                  onApplyRecommendations(report);
                  toast.success('Semáforos da IA aplicados na carteira!');
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                Aplicar e Fechar
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
