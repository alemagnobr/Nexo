import React, { useState, useEffect } from 'react';
import {
  StockAsset,
  StockSemaphore,
  StockClassification,
  StockContribution,
  StockReevaluationAudit,
  StockAIEvaluationReport,
  View,
} from '../types';
import {
  getStocksList,
  getTop5Stocks,
  calculateBestAsymmetry,
  getSavedContributions,
  saveContribution,
  runStocksGrowthAIEvaluation,
  getSavedStockAIEvaluationReport,
  applyAIEvaluationToStocks,
} from '../services/stocksGrowthService';
import { CURATED_STOCKS_GROWTH } from '../services/stocksGrowthData';
import { StockReevaluationModal } from './StockReevaluationModal';
import { StocksGrowthAIModal } from './StocksGrowthAIModal';
import { StockContributionModal } from './StockContributionModal';
import {
  Rocket,
  TrendingUp,
  Award,
  ShieldCheck,
  Search,
  DollarSign,
  Layers,
  Activity,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  PieChart,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Calendar,
  History,
  Calculator,
  Flame,
  Zap,
  Info,
  Clock,
  Shield,
  Briefcase,
  Sliders,
  RefreshCw,
  Bot,
} from 'lucide-react';
import { toast } from 'sonner';

interface StocksGrowthViewProps {
  privacyMode: boolean;
  hasApiKey: boolean;
  wallets?: any[];
  onAddTransaction?: (tx: any) => void;
  onNavigate?: (view: View) => void;
}

type StockTabType =
  | 'overview'
  | 'raiox'
  | 'fundamentals'
  | 'valuation'
  | 'risks'
  | 'reevaluation'
  | 'projection'
  | 'history';

export const StocksGrowthView: React.FC<StocksGrowthViewProps> = ({
  privacyMode,
  hasApiKey,
  wallets = [],
  onAddTransaction,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<StockTabType>('overview');
  const [stocks, setStocks] = useState<StockAsset[]>(() => Object.values(CURATED_STOCKS_GROWTH));
  const [loading, setLoading] = useState(true);
  const [selectedStockTicker, setSelectedStockTicker] = useState<string>('WEGE3');
  const [aporteInput, setAporteInput] = useState<number>(1000);
  const [customAporte, setCustomAporte] = useState<string>('1000');
  const [classificationFilter, setClassificationFilter] = useState<'ALL' | StockClassification>('ALL');
  
  // Reevaluation modal state
  const [isReevalModalOpen, setIsReevalModalOpen] = useState(false);
  const [reevalStock, setReevalStock] = useState<StockAsset | null>(null);

  // AI Evaluation Search state
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiReport, setAiReport] = useState<StockAIEvaluationReport | null>(() => getSavedStockAIEvaluationReport());
  const [aiLoading, setAiLoading] = useState(false);

  // Contributions history & modal state
  const [contributions, setContributions] = useState<StockContribution[]>([]);
  const [isContribModalOpen, setIsContribModalOpen] = useState(false);
  const [contribStockTarget, setContribStockTarget] = useState<StockAsset | null>(null);
  const [contribMode, setContribMode] = useState<'single' | 'top5_basket'>('single');

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const list = await getStocksList();
        if (list && list.length > 0) {
          setStocks(list);
        }
        setContributions(getSavedContributions());
        const savedReport = getSavedStockAIEvaluationReport();
        if (savedReport) {
          setAiReport(savedReport);
        }
      } catch (e) {
        console.error('Error loading stocks:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRunAIScan = async (amount: number = aporteInput) => {
    setAiLoading(true);
    try {
      toast.info('IA iniciando busca e avaliação de assimetria dos ativos B3...');
      const report = await runStocksGrowthAIEvaluation(amount, stocks);
      setAiReport(report);
      setIsAIModalOpen(true);
      toast.success(`Avaliação da IA concluída! Top 1 eleito: ${report.topPick.ticker}`);
    } catch (err) {
      console.error('Error running AI scan:', err);
      toast.error('Erro ao executar avaliação da IA.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAIRecommendations = (report: StockAIEvaluationReport) => {
    const updated = applyAIEvaluationToStocks(report, stocks);
    setStocks(updated);
    toast.success('Semáforos e scores da IA aplicados com sucesso na carteira!');
  };

  const fallbackStock = Object.values(CURATED_STOCKS_GROWTH)[0];
  const selectedStock = (stocks && stocks.length > 0 ? stocks.find((s) => s.ticker === selectedStockTicker) || stocks[0] : null) || fallbackStock;
  const top5 = getTop5Stocks(stocks && stocks.length > 0 ? stocks : [fallbackStock]);
  const asymmetryAnalysis = calculateBestAsymmetry(stocks && stocks.length > 0 ? stocks : [fallbackStock], aporteInput);
  const top1 = asymmetryAnalysis?.top1 || selectedStock || fallbackStock;

  // Filtered stocks for tables
  const filteredStocks = stocks.filter((s) => {
    if (classificationFilter === 'ALL') return true;
    return s.classification === classificationFilter;
  });

  const handleAporteChange = (val: number) => {
    setAporteInput(val);
    setCustomAporte(String(val));
  };

  const handleConfirmContribution = (newContribs: Omit<StockContribution, 'id'>[]) => {
    newContribs.forEach((c, index) => {
      saveContribution({
        ...c,
        id: `contrib_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 4)}`,
      });
    });
    setContributions(getSavedContributions());
  };

  const handleOpenSingleContribution = (stock: StockAsset) => {
    setContribStockTarget(stock);
    setContribMode('single');
    setIsContribModalOpen(true);
  };

  const handleOpenBasketContribution = () => {
    setContribStockTarget(top1);
    setContribMode('top5_basket');
    setIsContribModalOpen(true);
  };

  const handleRegisterContribution = (stock: StockAsset, shares: number, totalAmount: number) => {
    if (shares <= 0) {
      toast.error('Informe um valor de aporte suficiente para pelo menos 1 ação.');
      return;
    }

    const newContrib: StockContribution = {
      id: `contrib_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      ticker: stock.ticker,
      sharesCount: shares,
      pricePurchased: stock.currentPrice,
      totalAmount,
      growthScoreAtPurchase: stock.growthScore,
      semaphoreAtPurchase: stock.semaphore,
      notes: `Aporte planejado pelo Motor de Crescimento (${stock.ticker}).`,
    };

    saveContribution(newContrib);
    setContributions(getSavedContributions());
    toast.success(`Aporte de ${shares} ações de ${stock.ticker} (R$ ${totalAmount.toFixed(2)}) registrado com sucesso!`);
  };

  const getSemaphoreBadge = (sem: StockSemaphore) => {
    switch (sem) {
      case 'APORTAR':
        return {
          label: '🟢 APORTAR',
          desc: 'Fundamentos fortes + valuation atrativo ou aceitável.',
          badge: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
        };
      case 'AGUARDAR':
        return {
          label: '🟡 AGUARDAR',
          desc: 'Empresa excelente, porém valuation esticado/caro no momento.',
          badge: 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300',
        };
      case 'REAVALIAR':
        return {
          label: '🟠 REAVALIAR',
          desc: 'Fundamentos começaram a apresentar deterioração relevante.',
          badge: 'bg-orange-50 dark:bg-orange-950/60 border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-300',
        };
      case 'TESE_DETERIORADA':
        return {
          label: '🔴 TESE DETERIORADA',
          desc: 'Mudança estrutural negativa grave detectada.',
          badge: 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300',
        };
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'BAIXO':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800';
      case 'MODERADO':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800';
      case 'ELEVADO':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800';
      case 'CRITICO':
        return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800';
      default:
        return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  if (!selectedStock) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Carregando Motor de Crescimento e Cotações B3...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5 text-indigo-400" />
                Motor de Crescimento
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                🟠 Camada 3: Crescimento
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Foco: Qualidade + Assimetria
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Ações de Alta Qualidade & Compounders
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Empresas excelentes com crescimento consistente de lucros, ROIC elevado, balanço protegido e valuation atrativo. O motor avalia a melhor assimetria entre risco e retorno para cada aporte.
            </p>
          </div>

          {/* Quick Stats Widget & AI Scan Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-start md:self-auto shrink-0">
            <button
              onClick={() => handleRunAIScan(aporteInput)}
              disabled={aiLoading}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white font-black text-xs shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 border border-indigo-400/30 transition-all cursor-pointer group hover:scale-[1.02] disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 text-amber-300 ${aiLoading ? 'animate-spin' : 'animate-pulse group-hover:rotate-12 transition-transform'}`} />
              <span>{aiLoading ? 'IA Avaliando B3...' : 'Nova Busca & Avaliação por IA'}</span>
            </button>

            <div className="flex items-center gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 backdrop-blur-sm">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Top 1 Assimetria</span>
                <span className="text-lg font-black text-emerald-400">{top1.ticker}</span>
                <span className="text-[10px] text-slate-400 block">Score {top1.growthScore}/100</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="w-full overflow-x-auto scrollbar-hide pb-1">
        <div className="flex items-center gap-1.5 w-max min-w-full md:w-auto p-1.5 bg-slate-200/70 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl mx-auto border border-slate-300/60 dark:border-slate-700/60 shadow-sm">
          {[
            { id: 'overview', label: 'Visão Geral', icon: Sparkles },
            { id: 'raiox', label: 'Raio-X da Nota', icon: Activity },
            { id: 'fundamentals', label: 'Fundamentos', icon: Layers },
            { id: 'valuation', label: 'Valuation', icon: DollarSign },
            { id: 'risks', label: 'Riscos', icon: AlertTriangle },
            { id: 'reevaluation', label: 'Reavaliação da Tese', icon: Search },
            { id: 'projection', label: 'Projeção de Patrimônio', icon: TrendingUp },
            { id: 'history', label: 'Histórico de Aportes', icon: History },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as StockTabType)}
                className={`
                  flex items-center gap-2 py-2 px-3.5 md:px-4 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer shrink-0
                  ${
                    isActive
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm ring-1 ring-slate-300/60 dark:ring-slate-600'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/40 dark:hover:bg-slate-700/40'
                  }
                `}
              >
                <tab.icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==========================================
          TAB 1: VISÃO GERAL
         ========================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Aporte Input Bar */}
          <div className="p-5 md:p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                  Simulador de Aporte Inteligente
                </span>
                <h3 className="text-lg font-black text-slate-800 dark:text-white">
                  Quanto você deseja aportar agora?
                </h3>
              </div>

              {/* Quick preset buttons + custom input */}
              <div className="flex flex-wrap items-center gap-2">
                {[300, 500, 1000, 2000, 5000].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleAporteChange(val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      aporteInput === val
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    R$ {val.toLocaleString('pt-BR')}
                  </button>
                ))}

                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    value={customAporte}
                    onChange={(e) => {
                      setCustomAporte(e.target.value);
                      const num = Number(e.target.value);
                      if (!isNaN(num) && num > 0) setAporteInput(num);
                    }}
                    placeholder="Outro valor"
                    className="w-28 pl-8 pr-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRunAIScan(aporteInput)}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  title="Fazer nova busca e avaliação por IA com este valor de aporte"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                  <span>{aiLoading ? 'Buscando...' : 'Avaliar por IA'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI Banner if report exists */}
          {aiReport && (
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 block">
                    Último Radar IA ({aiReport.analyzedAt}): Top 1 eleito foi {aiReport.topPick.ticker} ({aiReport.topPick.name})
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                    {aiReport.topPick.whyTopPick}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAIModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 transition-all"
              >
                <span>Ver Radar Completo da IA</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 🏆 TOP 1 — MELHOR ASSIMETRIA DO MOMENTO */}
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-indigo-950/50 border-2 border-emerald-500/40 shadow-2xl text-white relative overflow-hidden space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="p-3.5 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl text-emerald-300">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-md">
                      🏆 TOP 1 — MELHOR ASSIMETRIA DO MOMENTO
                    </span>
                    <span className="text-xs text-emerald-300 font-semibold">
                      {top1.classification === 'QUALITY_COMPOUNDER' ? '🌳 Quality Compounder' : '🚀 Growth Leader'}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
                    {top1.ticker} — {top1.name}
                  </h2>
                </div>
              </div>

              {/* Price & Score */}
              <div className="flex items-center gap-4 bg-slate-800/80 px-5 py-3 rounded-2xl border border-slate-700">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Preço B3</span>
                  <span className="text-xl font-black text-white">
                    {privacyMode ? '••••••' : `R$ ${top1.currentPrice.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-l border-slate-700 pl-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Growth Score</span>
                  <span className="text-xl font-black text-emerald-400">{top1.growthScore}/100</span>
                </div>
              </div>
            </div>

            {/* Aporte Allocation Math */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-800/70 rounded-2xl border border-slate-700/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Aporte Informado</span>
                <span className="text-lg font-black text-white">
                  {privacyMode ? '••••••' : `R$ ${aporteInput.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Capacidade de investimento</span>
              </div>

              <div className="p-4 bg-emerald-950/50 rounded-2xl border border-emerald-600/40">
                <span className="text-[10px] uppercase font-bold text-emerald-300 block">Quantidade Possível</span>
                <span className="text-2xl font-black text-emerald-400">
                  {asymmetryAnalysis.sharesCount} ações
                </span>
                <span className="text-[11px] text-emerald-200/80 block mt-0.5">
                  Total: {privacyMode ? '••••••' : `R$ ${asymmetryAnalysis.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </span>
              </div>

              <div className="p-4 bg-slate-800/70 rounded-2xl border border-slate-700/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Troco Residual</span>
                <span className="text-lg font-black text-slate-200">
                  {privacyMode ? '••••••' : `R$ ${asymmetryAnalysis.remainingCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Permanece em caixa / CDI</span>
              </div>
            </div>

            {/* Why Top 1 Won + Analyst Verdict */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Asymmetry Reason */}
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase">
                  <ShieldCheck className="w-4 h-4" />
                  Por Que Venceu as Outras Empresas?
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {top1.asymmetryReason || `Apresenta o menor risco estrutural combinado com ROIC de ${top1.roic}%, balanço sólido e valuation atual com margem de segurança atrativa.`}
                </p>
              </div>

              {/* Analyst Take */}
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase">
                  <Sparkles className="w-4 h-4" />
                  🧠 Parecer do Analista
                </div>
                <p className="text-xs text-slate-200 leading-relaxed italic">
                  "{top1.analystVerdict}"
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-black border ${getSemaphoreBadge(top1.semaphore).badge}`}>
                  {getSemaphoreBadge(top1.semaphore).label}
                </span>
                <span className="text-xs text-slate-400">
                  Principal Risco: <strong className="text-slate-200">{top1.keyRisks[0]?.name || 'Sensibilidade Macroeconômica'}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setSelectedStockTicker(top1.ticker);
                    setActiveTab('raiox');
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-slate-200 transition-colors"
                >
                  Ver Raio-X Detalhado
                </button>
                <button
                  onClick={() => handleOpenSingleContribution(top1)}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Registrar Aporte ({asymmetryAnalysis.sharesCount} ações)</span>
                </button>
              </div>
            </div>
          </div>

          {/* 🌟 TOP 5 AÇÕES DE CRESCIMENTO */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  🌟 TOP 5 Ações de Crescimento
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Classificadas pelo Growth Score auditado de 0 a 100 pontos.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleOpenBasketContribution}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Distribuir o valor de aporte entre as 5 empresas do ranking de crescimento"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Distribuir Aporte no TOP 5</span>
                </button>

                {(['ALL', 'QUALITY_COMPOUNDER', 'GROWTH'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setClassificationFilter(filter)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                      classificationFilter === filter
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {filter === 'ALL' ? 'Todas' : filter === 'QUALITY_COMPOUNDER' ? '🌳 Compounders' : '🚀 Growth'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {top5.map((stock, idx) => {
                const isTop1 = stock.ticker === top1.ticker;
                const sharesCanBuy = Math.max(1, Math.floor(aporteInput / (stock.currentPrice || 1)));
                const totalCost = sharesCanBuy * stock.currentPrice;

                return (
                  <div
                    key={stock.ticker}
                    className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 bg-white dark:bg-slate-800/90 shadow-sm hover:shadow-md ${
                      isTop1
                        ? 'border-emerald-400 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700/80 hover:border-indigo-400'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                            <span className="text-lg font-black text-slate-900 dark:text-white">
                              {stock.ticker}
                            </span>
                            {isTop1 && (
                              <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                                🏆 TOP 1
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                            {stock.name}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                            {stock.growthScore}/100
                          </span>
                          <span className="text-[10px] text-slate-400 block font-bold">Growth Score</span>
                        </div>
                      </div>

                      {/* Key Indicators Grid */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <span className="text-slate-400 block font-bold">Crescimento</span>
                          <strong className="text-slate-800 dark:text-slate-200">{stock.growthPace}</strong>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <span className="text-slate-400 block font-bold">Qualidade</span>
                          <strong className="text-slate-800 dark:text-slate-200">{stock.qualityRating}</strong>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <span className="text-slate-400 block font-bold">Valuation</span>
                          <strong className="text-indigo-600 dark:text-indigo-400">{stock.valuationStatus}</strong>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <span className="text-slate-400 block font-bold">Risco</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getRiskColor(stock.riskLevel)}`}>
                            {stock.riskLevel}
                          </span>
                        </div>
                      </div>

                      {/* Compact Fundamentals Bar */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                        <span>ROIC: <strong className="text-emerald-600 dark:text-emerald-400">{stock.roic}%</strong></span>
                        <span>Dív/EBITDA: <strong>{stock.netDebtToEbitda}x</strong></span>
                        <span>P/L: <strong>{stock.peRatio}x</strong></span>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Preço B3</span>
                          <span className="text-sm font-black text-slate-800 dark:text-white">
                            {privacyMode ? '••••••' : `R$ ${stock.currentPrice.toFixed(2)}`}
                          </span>
                        </div>

                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {sharesCanBuy} ações • R$ {totalCost.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedStockTicker(stock.ticker);
                            setActiveTab('raiox');
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                          title="Ver Raio-X dos Pilares"
                        >
                          <span>Raio-X</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenSingleContribution(stock)}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            isTop1
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                          }`}
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Registrar Aporte ({sharesCanBuy} aç.)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Semáforo do Aporte — Explicação Metodológica */}
          <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" />
              Semáforo do Aporte: Qualidade Separada do Momento de Compra
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Uma empresa pode ter <strong>Growth Score elevado (ex: 95/100) e ainda assim receber AGUARDAR</strong> se a cotação estiver excessivamente cara ou com múltiplos descolados da média histórica. Isso protege seu patrimônio contra o risco de pagar qualquer preço por uma empresa maravilhosa.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                <span className="font-black text-emerald-700 dark:text-emerald-300 block">🟢 APORTAR</span>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  Fundamentos fortes e valuation atrativo ou neutro.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1">
                <span className="font-black text-amber-700 dark:text-amber-300 block">🟡 AGUARDAR</span>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  Empresa de alta qualidade, porém preço esticado no momento.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 space-y-1">
                <span className="font-black text-orange-700 dark:text-orange-300 block">🟠 REAVALIAR</span>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  Fundamentos começaram a apresentar deterioração relevante.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 space-y-1">
                <span className="font-black text-rose-700 dark:text-rose-300 block">🔴 TESE DETERIORADA</span>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  Mudança estrutural negativa grave no modelo de negócio.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: RAIO-X DA NOTA
         ========================================== */}
      {activeTab === 'raiox' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stock Selector Pill */}
          <div className="p-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Selecione a empresa para auditar os 6 pilares:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {stocks.map((s) => (
                <button
                  key={s.ticker}
                  onClick={() => setSelectedStockTicker(s.ticker)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedStockTicker === s.ticker
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {s.ticker} ({s.growthScore} pts)
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Scorecard */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            {/* Header of the Selected Stock */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {selectedStock.classification === 'QUALITY_COMPOUNDER' ? '🌳 Quality Compounder' : '🚀 Growth'}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{selectedStock.sector}</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {selectedStock.ticker} — {selectedStock.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Fonte: {selectedStock.dataSource} | Auditado em: {selectedStock.lastAuditDate}
                </p>
              </div>

              {/* Score Badge */}
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Growth Score Total</span>
                  <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                    {selectedStock.growthScore}/100
                  </span>
                </div>
                <div className={`px-3 py-1.5 rounded-xl text-xs font-black border ${getSemaphoreBadge(selectedStock.semaphore).badge}`}>
                  {getSemaphoreBadge(selectedStock.semaphore).label}
                </div>
              </div>
            </div>

            {/* The 6 Pillars Breakdown */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                Detalhamento dos 6 Pilares Auditados (Soma = {selectedStock.growthScore} pts)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pilar 1: Crescimento */}
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
                      📈 1. Crescimento de Receita & Lucro
                    </span>
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                      {selectedStock.pillars.growth.score} / {selectedStock.pillars.growth.max} pts
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(selectedStock.pillars.growth.score / selectedStock.pillars.growth.max) * 100}%` }}
                    ></div>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    {selectedStock.pillars.growth.metrics.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-700">
                    {selectedStock.pillars.growth.justification}
                  </p>
                </div>

                {/* Pilar 2: Rentabilidade */}
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
                      💰 2. Rentabilidade (ROIC & Margens)
                    </span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {selectedStock.pillars.profitability.score} / {selectedStock.pillars.profitability.max} pts
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(selectedStock.pillars.profitability.score / selectedStock.pillars.profitability.max) * 100}%` }}
                    ></div>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    {selectedStock.pillars.profitability.metrics.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-700">
                    {selectedStock.pillars.profitability.justification}
                  </p>
                </div>

                {/* Pilar 3: Saúde Financeira */}
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
                      🏦 3. Saúde Financeira & Balanço
                    </span>
                    <span className="text-sm font-black text-sky-600 dark:text-sky-400">
                      {selectedStock.pillars.financialHealth.score} / {selectedStock.pillars.financialHealth.max} pts
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(selectedStock.pillars.financialHealth.score / selectedStock.pillars.financialHealth.max) * 100}%` }}
                    ></div>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    {selectedStock.pillars.financialHealth.metrics.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-700">
                    {selectedStock.pillars.financialHealth.justification}
                  </p>
                </div>

                {/* Pilar 4: Geração de Caixa */}
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
                      💵 4. Geração de Caixa Livre (FCF)
                    </span>
                    <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                      {selectedStock.pillars.cashGeneration.score} / {selectedStock.pillars.cashGeneration.max} pts
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(selectedStock.pillars.cashGeneration.score / selectedStock.pillars.cashGeneration.max) * 100}%` }}
                    ></div>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    {selectedStock.pillars.cashGeneration.metrics.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-700">
                    {selectedStock.pillars.cashGeneration.justification}
                  </p>
                </div>

                {/* Pilar 5: Valuation */}
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
                      🏷️ 5. Valuation & Múltiplos
                    </span>
                    <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                      {selectedStock.pillars.valuation.score} / {selectedStock.pillars.valuation.max} pts
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(selectedStock.pillars.valuation.score / selectedStock.pillars.valuation.max) * 100}%` }}
                    ></div>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    {selectedStock.pillars.valuation.metrics.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-700">
                    {selectedStock.pillars.valuation.justification}
                  </p>
                </div>

                {/* Pilar 6: Qualidade e Resiliência */}
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
                      🛡️ 6. Qualidade, Vantagens & Resiliência
                    </span>
                    <span className="text-sm font-black text-teal-600 dark:text-teal-400">
                      {selectedStock.pillars.qualityResilience.score} / {selectedStock.pillars.qualityResilience.max} pts
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(selectedStock.pillars.qualityResilience.score / selectedStock.pillars.qualityResilience.max) * 100}%` }}
                    ></div>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    {selectedStock.pillars.qualityResilience.metrics.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-700">
                    {selectedStock.pillars.qualityResilience.justification}
                  </p>
                </div>
              </div>
            </div>

            {/* Parecer do Analista Box */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-700 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  🧠 Parecer Sintético do Analista ({selectedStock.ticker})
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                "{selectedStock.analystVerdict}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: FUNDAMENTOS
         ========================================== */}
      {activeTab === 'fundamentals' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                Tabela Comparativa de Fundamentos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Auditoria de taxas de crescimento composto (CAGR), rentabilidade sobre o capital investido e alavancagem.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Empresa</th>
                    <th className="py-3 px-3">CAGR Lucro 5A</th>
                    <th className="py-3 px-3">CAGR Rec. 5A</th>
                    <th className="py-3 px-3">ROIC</th>
                    <th className="py-3 px-3">ROE</th>
                    <th className="py-3 px-3">Margem Líq.</th>
                    <th className="py-3 px-3">Dív. Líq / EBITDA</th>
                    <th className="py-3 px-3">FCF Yield</th>
                    <th className="py-3 px-3">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-semibold text-slate-700 dark:text-slate-200">
                  {filteredStocks.map((stock) => (
                    <tr
                      key={stock.ticker}
                      onClick={() => {
                        setSelectedStockTicker(stock.ticker);
                        setActiveTab('raiox');
                      }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 dark:text-white font-bold">{stock.ticker}</strong>
                          <span className="text-[10px] text-slate-400 hidden sm:inline">{stock.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400">
                        +{stock.profitCagr5y}% a.a.
                      </td>
                      <td className="py-3 px-3">+{stock.revenueCagr5y}% a.a.</td>
                      <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">{stock.roic}%</td>
                      <td className="py-3 px-3">{stock.roe}%</td>
                      <td className="py-3 px-3">{stock.netMargin}%</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          stock.netDebtToEbitda <= 0 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                        }`}>
                          {stock.netDebtToEbitda}x
                        </span>
                      </td>
                      <td className="py-3 px-3">{stock.fcfYield}%</td>
                      <td className="py-3 px-3 font-black text-indigo-600 dark:text-indigo-400">{stock.growthScore} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 4: VALUATION
         ========================================== */}
      {activeTab === 'valuation' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-500" />
                Matriz de Valuation & Margem de Segurança
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                P/L atual vs média histórica de 5 anos, PEG Ratio (relação preço/crescimento) e rendimento do fluxo de caixa livre.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStocks.map((stock) => (
                <div
                  key={stock.ticker}
                  className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-base font-black text-slate-900 dark:text-white">{stock.ticker}</span>
                      <span className="text-xs text-slate-400 block">{stock.name}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${getSemaphoreBadge(stock.semaphore).badge}`}>
                      {stock.valuationStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block font-bold">P/L Atual</span>
                      <strong className="text-indigo-600 dark:text-indigo-400 text-sm">{stock.peRatio}x</strong>
                      <span className="text-[10px] text-slate-400 block">Méd. 5A: {stock.historicalAvgPe}x</span>
                    </div>

                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block font-bold">PEG Ratio</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{stock.pegRatio}</strong>
                      <span className="text-[10px] text-slate-400 block">&lt; 1.5 = Saudável</span>
                    </div>

                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block font-bold">EV / EBITDA</span>
                      <strong className="text-slate-800 dark:text-white text-sm">{stock.evEbitda}x</strong>
                    </div>

                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block font-bold">Margem Seg.</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 text-sm">+{stock.safetyMarginPercent || 15}%</strong>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700 flex justify-between">
                    <span>Preço Justo Teórico:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      R$ {stock.fairPriceEstimated?.toFixed(2) || (stock.currentPrice * 1.2).toFixed(2)}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 5: RISCOS
         ========================================== */}
      {activeTab === 'risks' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Mapeamento de Riscos & Planos de Mitigação
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Classificação objetiva de ameaças setoriais, cambiais, regulatórias e operacionais para cada ativo aprovado.
              </p>
            </div>

            <div className="space-y-4">
              {filteredStocks.map((stock) => (
                <div
                  key={stock.ticker}
                  className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <strong className="text-base font-black text-slate-900 dark:text-white">{stock.ticker}</strong>
                      <span className="text-xs text-slate-400">— {stock.name}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRiskColor(stock.riskLevel)}`}>
                      Risco Geral: {stock.riskLevel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {stock.keyRisks.map((risk) => (
                      <div
                        key={risk.id}
                        className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{risk.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getRiskColor(risk.level)}`}>
                            {risk.level}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                          {risk.description}
                        </p>
                        <div className="pt-1 text-[11px] text-emerald-700 dark:text-emerald-400 flex items-start gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span><strong>Mitigação:</strong> {risk.mitigation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 6: REAVALIAÇÃO DA TESE
         ========================================== */}
      {activeTab === 'reevaluation' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 md:p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                  Auditoria de Gatilhos
                </span>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">
                  🔍 Reavaliação da Tese
                </h3>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                  Sinais para reavaliar, não vender às cegas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleRunAIScan(aporteInput)}
                  disabled={aiLoading}
                  className="px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 text-amber-300 ${aiLoading ? 'animate-spin' : 'animate-pulse'}`} />
                  <span>{aiLoading ? 'IA Auditando...' : '🤖 Radar Global por IA'}</span>
                </button>

                <button
                  onClick={() => {
                    setReevalStock(selectedStock);
                    setIsReevalModalOpen(true);
                  }}
                  className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>🔍 REAVALIAR TESE ({selectedStock.ticker})</span>
                </button>
              </div>
            </div>

            {/* Triggers Table for Selected Stock */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                  Gatilhos de Alarme Definidos para {selectedStock.ticker}
                </h4>
                <div className="flex items-center gap-1.5">
                  {stocks.map((s) => (
                    <button
                      key={s.ticker}
                      onClick={() => setSelectedStockTicker(s.ticker)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedStockTicker === s.ticker
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {s.ticker}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3">Condição de Disparo</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Motivo Técnico</th>
                      <th className="py-3 px-3">Análise Recomendada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium text-slate-700 dark:text-slate-200">
                    {selectedStock.triggers.map((trigger) => (
                      <tr key={trigger.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white max-w-xs">
                          {trigger.condition}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {trigger.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px] max-w-xs">
                          {trigger.motive}
                        </td>
                        <td className="py-3 px-3 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
                          {trigger.recommendedAnalysis}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Policy Reminder */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Diretriz do Modelo:</strong> Utilize sempre o comando <strong>"REAVALIAR TESE"</strong> antes de tomar decisões precipitadas. A volatilidade dos preços não altera a qualidade intrínseca do negócio quando os fundamentos operacionais permanecem intactos.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 7: PROJEÇÃO DE PATRIMÔNIO
         ========================================== */}
      {activeTab === 'projection' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Simulador de Crescimento Composto de Longo Prazo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Projeção matemática em 3 cenários considerando aportes mensais recorrentes de R$ {aporteInput.toLocaleString('pt-BR')}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Scenario 1: Conservador */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400 block">
                  🛡️ Cenário Conservador (10% a.a.)
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span>Em 5 Anos:</span> <strong>R$ {((aporteInput * 12 * 5) * 1.25).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</strong></div>
                  <div className="flex justify-between"><span>Em 10 Anos:</span> <strong>R$ {((aporteInput * 12 * 10) * 1.65).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</strong></div>
                  <div className="flex justify-between"><span>Em 20 Anos:</span> <strong className="text-indigo-600 dark:text-indigo-400">R$ {((aporteInput * 12 * 20) * 2.95).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</strong></div>
                </div>
              </div>

              {/* Scenario 2: Base */}
              <div className="p-5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-3">
                <span className="text-xs font-black uppercase text-indigo-700 dark:text-indigo-300 block">
                  📊 Cenário Base Compounders (14% a.a.)
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span>Em 5 Anos:</span> <strong>R$ {((aporteInput * 12 * 5) * 1.40).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</strong></div>
                  <div className="flex justify-between"><span>Em 10 Anos:</span> <strong>R$ {((aporteInput * 12 * 10) * 2.15).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</strong></div>
                  <div className="flex justify-between"><span>Em 20 Anos:</span> <strong className="text-emerald-600 dark:text-emerald-400">R$ {((aporteInput * 12 * 20) * 5.10).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</strong></div>
                </div>
              </div>

              {/* Scenario 3: Otimista */}
              <div className="p-5 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                <span className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-300 block">
                  🚀 Cenário Otimista / Alta Assimetria (18% a.a.)
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span>Em 5 Anos:</span> <strong>R$ {((aporteInput * 12 * 5) * 1.60).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</strong></div>
                  <div className="flex justify-between"><span>Em 10 Anos:</span> <strong>R$ {((aporteInput * 12 * 10) * 2.90).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</strong></div>
                  <div className="flex justify-between"><span>Em 20 Anos:</span> <strong className="text-emerald-500 font-black">R$ {((aporteInput * 12 * 20) * 8.80).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</strong></div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              *Disclaimer: Rentabilidade passada não é garantia de resultados futuros. As projeções são meramente ilustrativas para fins de planejamento financeiro.
            </p>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 8: HISTÓRICO DE APORTES
         ========================================== */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-500" />
                  Registro Histórico de Aportes Realizados
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Histórico com snapshot da nota e semáforo no momento de cada compra.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenBasketContribution}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Distribuir no TOP 5</span>
                </button>

                <button
                  onClick={() => handleOpenSingleContribution(top1)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+ Registrar Aporte</span>
                </button>

                <span className="text-xs font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300">
                  {contributions.length} aportes
                </span>
              </div>
            </div>

            {contributions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
                <History className="w-8 h-8 text-slate-400 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Nenhum aporte registrado ainda.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Registre compras individuais do TOP 1, de qualquer ativo do TOP 5, ou distribua na Cesta TOP 5.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => handleOpenSingleContribution(top1)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Registrar Aporte em {top1.ticker}
                  </button>
                  <button
                    onClick={handleOpenBasketContribution}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Registrar Cesta TOP 5
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3">Data</th>
                      <th className="py-3 px-3">Ativo</th>
                      <th className="py-3 px-3">Qtd. Ações</th>
                      <th className="py-3 px-3">Preço Compra</th>
                      <th className="py-3 px-3">Total Investido</th>
                      <th className="py-3 px-3">Score na Época</th>
                      <th className="py-3 px-3">Semáforo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-semibold text-slate-700 dark:text-slate-200">
                    {contributions.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                        <td className="py-3 px-3 text-slate-500">{c.date}</td>
                        <td className="py-3 px-3 font-bold text-indigo-600 dark:text-indigo-400">{c.ticker}</td>
                        <td className="py-3 px-3">{c.sharesCount} ações</td>
                        <td className="py-3 px-3">R$ {c.pricePurchased.toFixed(2)}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          R$ {c.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 font-black text-indigo-600">{c.growthScoreAtPurchase}/100</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSemaphoreBadge(c.semaphoreAtPurchase).badge}`}>
                            {c.semaphoreAtPurchase}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reevaluation Modal */}
      {reevalStock && (
        <StockReevaluationModal
          isOpen={isReevalModalOpen}
          onClose={() => setIsReevalModalOpen(false)}
          stock={reevalStock}
          hasApiKey={hasApiKey}
          onAuditComplete={(audit) => {
            toast.success(`Auditoria concluída: ${audit.status} (${audit.newGrowthScore}/100)`);
          }}
        />
      )}

      {/* AI Growth Scanner & Evaluation Modal */}
      <StocksGrowthAIModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        report={aiReport}
        loading={aiLoading}
        onRunNewScan={handleRunAIScan}
        onApplyRecommendations={handleApplyAIRecommendations}
        onSelectStockToInvest={(ticker, shares, totalCost) => {
          const matching = stocks.find((s) => s.ticker === ticker) || top1;
          handleRegisterContribution(matching, shares, totalCost);
        }}
        onSelectBasketToInvest={(amount) => {
          handleOpenBasketContribution();
        }}
        currentAporte={aporteInput}
      />

      {/* Stock Contribution Modal (Single & Top 5 Basket) */}
      <StockContributionModal
        isOpen={isContribModalOpen}
        onClose={() => setIsContribModalOpen(false)}
        stock={contribStockTarget || top1}
        top5Stocks={top5}
        mode={contribMode}
        defaultAporteAmount={aporteInput}
        onConfirmContribution={handleConfirmContribution}
      />
    </div>
  );
};
