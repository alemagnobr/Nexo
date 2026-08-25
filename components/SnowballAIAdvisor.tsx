import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Zap,
  TrendingUp,
  Snowflake,
  RefreshCw,
  Target,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Award,
  Plus,
  Filter,
  ArrowUpDown,
  Search,
  Building2,
  Wheat,
  Coins,
  Info,
  ExternalLink,
  ChevronRight,
  Flame,
  Shield,
  Clock,
  DollarSign,
  BarChart3,
  HelpCircle,
  AlertOctagon,
  UserCheck,
  FileText,
  Sliders,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Save,
  Check
} from 'lucide-react';
import {
  analyzeSnowballRecommendation,
  SnowballAIRecommendation,
  FiiRecommendationItem,
  hasCustomApiKey
} from '../services/geminiService';
import { Investment, PersistedSnowballAIAnalysis } from '../types';
import { fetchB3Quote, B3QuoteResult, CURATED_FII_DATA, FiiCuratedProfile, FiiScoreBreakdown } from '../services/brapiService';
import { saveSnowballAIAnalysis, loadSnowballAIAnalysisLocal } from '../services/storageService';
import { auth } from '../services/firebase';
import { toast } from 'sonner';

interface SnowballAIAdvisorProps {
  currentAssets: Investment[];
  onSelectAssetToInvest: (assetData: {
    ticker: string;
    name: string;
    price: number;
    dividend: number;
    segment: string;
  }) => void;
  monthlySavingsEstimated?: number;
}

type CategoryFilter = 'all' | 'anti_crise' | 'momento' | 'cabe_no_aporte' | 'base_10' | 'fiagro' | 'tijolo' | 'papel';
type SortOption = 'stability' | 'profitability' | 'magic_cost' | 'pvp_discount' | 'price_asc' | 'alphabetical';
type ModalTab = 'overview' | 'score_breakdown' | 'risks' | 'exit_triggers';

export const SnowballAIAdvisor: React.FC<SnowballAIAdvisorProps> = ({
  currentAssets,
  onSelectAssetToInvest,
  monthlySavingsEstimated = 20,
}) => {
  const [loading, setLoading] = useState(false);

  // Check initial persisted AI analysis from storage
  const initialSavedAnalysis = useMemo(() => {
    return loadSnowballAIAnalysisLocal(auth.currentUser?.uid);
  }, []);

  const [contributionInput, setContributionInput] = useState<number>(() => {
    if (initialSavedAnalysis?.contributionAmount) {
      return initialSavedAnalysis.contributionAmount;
    }
    return monthlySavingsEstimated > 0 ? monthlySavingsEstimated : 20;
  });

  const [recommendation, setRecommendation] = useState<SnowballAIRecommendation | null>(() => {
    if (initialSavedAnalysis?.recommendation) {
      return initialSavedAnalysis.recommendation;
    }
    return null;
  });

  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<string | null>(() => {
    return initialSavedAnalysis?.lastAnalyzedAt || null;
  });

  const [isPersistedAI, setIsPersistedAI] = useState<boolean>(() => {
    return !!initialSavedAnalysis?.isCustomAI;
  });

  const [realtimeQuotes, setRealtimeQuotes] = useState<Record<string, B3QuoteResult>>({});
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter & Sort States
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('anti_crise');
  const [sortBy, setSortBy] = useState<SortOption>('stability');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal & Expandable states
  const [selectedAssetModal, setSelectedAssetModal] = useState<FiiRecommendationItem | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<ModalTab>('overview');
  const [expandedCardTicker, setExpandedCardTicker] = useState<string | null>(null);

  const featuredTickers = useMemo(() => Object.keys(CURATED_FII_DATA), []);

  // Fetch real-time market quotes on component mount
  useEffect(() => {
    loadRealtimeQuotes();
    // Only initialize default curated data if NO saved recommendation exists
    if (!initialSavedAnalysis?.recommendation) {
      initializeDefaultRecommendation(contributionInput);
    }
  }, []);

  const loadRealtimeQuotes = async () => {
    setLoadingQuotes(true);
    const quotesMap: Record<string, B3QuoteResult> = {};
    try {
      await Promise.all(
        featuredTickers.map(async (t) => {
          quotesMap[t] = await fetchB3Quote(t);
        })
      );
      setRealtimeQuotes(quotesMap);
    } catch (err) {
      console.warn('Erro ao atualizar cotações da B3:', err);
    } finally {
      setLoadingQuotes(false);
    }
  };

  // Convert Curated Data to structured items for immediate display
  const buildCuratedRecommendation = (customContribution: number = 20): SnowballAIRecommendation => {
    const allItems: FiiRecommendationItem[] = Object.entries(CURATED_FII_DATA).map(([ticker, data], idx) => {
      const quote = realtimeQuotes[ticker];
      const price = quote?.price || data.price;
      const dividend = quote?.lastDividend || data.lastDividend;
      const monthlyDY = Number(((dividend / price) * 100).toFixed(2));
      const annualDY = Number((monthlyDY * 12).toFixed(1));
      const magicNumber = Math.ceil(price / dividend);
      const costToSnowball = magicNumber * price;

      return {
        rank: idx + 1,
        ticker,
        name: quote?.name || data.name,
        segment: data.segment,
        manager: data.manager,
        currentPrice: price,
        dividend,
        monthlyDY,
        annualDY,
        pvp: data.pvp,
        stabilityScore: data.stabilityScore,
        riskLevel: data.riskLevel,
        magicNumber,
        costToSnowball,
        whyChosen: data.keyHighlight,
        crisisResilienceReason: data.crisisResilience,
        category: data.category,
        scoreBreakdown: data.scoreBreakdown,
        riskAlerts: data.riskAlerts,
        exitTriggers: data.exitTriggers,
        analystTake: data.analystTake,
      };
    });

    const isSmallContribution = customContribution <= 60;

    // Crisis items (Anti-Crise)
    let crisisItems = allItems.filter((i) => i.category === 'anti_crise');
    if (isSmallContribution) {
      // Prioritize assets where price <= customContribution or Base R$ 10 (e.g. SNAG11, GARE11, MXRF11)
      crisisItems.sort((a, b) => {
        const aFits = a.currentPrice <= customContribution;
        const bFits = b.currentPrice <= customContribution;
        if (aFits && !bFits) return -1;
        if (!aFits && bFits) return 1;

        const aBase10 = a.currentPrice < 25;
        const bBase10 = b.currentPrice < 25;
        if (aBase10 && !bBase10) return -1;
        if (!aBase10 && bBase10) return 1;

        return b.stabilityScore - a.stabilityScore;
      });
    } else {
      crisisItems.sort((a, b) => b.stabilityScore - a.stabilityScore);
    }
    crisisItems = crisisItems.slice(0, 6);

    // Momentum items (Alto Yield / Oportunidade)
    let momentumItems = allItems.filter((i) => i.category === 'momento');
    if (isSmallContribution) {
      // Prioritize accessible price assets like VGIA11, CPTS11, VGHF11
      momentumItems.sort((a, b) => {
        const aFits = a.currentPrice <= customContribution;
        const bFits = b.currentPrice <= customContribution;
        if (aFits && !bFits) return -1;
        if (!aFits && bFits) return 1;

        const aBase10 = a.currentPrice < 25;
        const bBase10 = b.currentPrice < 25;
        if (aBase10 && !bBase10) return -1;
        if (!aBase10 && bBase10) return 1;

        return b.monthlyDY - a.monthlyDY;
      });
    } else {
      momentumItems.sort((a, b) => b.monthlyDY - a.monthlyDY);
    }
    momentumItems = momentumItems.slice(0, 6);

    // Pick top candidate
    let topPickCandidate = crisisItems.find((i) => i.currentPrice <= customContribution) ||
      momentumItems.find((i) => i.currentPrice <= customContribution) ||
      crisisItems.find((i) => i.currentPrice < 25) ||
      crisisItems[0] ||
      allItems[0];

    const sharesPerAporte = customContribution >= topPickCandidate.currentPrice 
      ? Math.floor(customContribution / topPickCandidate.currentPrice)
      : 1;

    const whyTopText = customContribution >= topPickCandidate.currentPrice
      ? `Ideal para seu aporte individual de R$ ${customContribution.toFixed(2)}: com cotação de R$ ${topPickCandidate.currentPrice.toFixed(2)}, você adquire ${sharesPerAporte} cota${sharesPerAporte > 1 ? 's' : ''} inteira${sharesPerAporte > 1 ? 's' : ''} a cada aporte sem dinheiro parado na corretora!`
      : `Ativo de altíssima resiliência. Sua cotação é de R$ ${topPickCandidate.currentPrice.toFixed(2)} (${topPickCandidate.currentPrice < 25 ? 'Base R$ 10' : 'Base R$ 100'}).`;

    return {
      topPick: {
        ticker: topPickCandidate.ticker,
        name: topPickCandidate.name,
        segment: topPickCandidate.segment,
        currentPrice: topPickCandidate.currentPrice,
        dividend: topPickCandidate.dividend,
        monthlyDY: topPickCandidate.monthlyDY,
        magicNumber: topPickCandidate.magicNumber,
        costToSnowball: topPickCandidate.costToSnowball,
        whyTop: whyTopText,
      },
      topCrisisResilient: crisisItems,
      topMomentum: momentumItems,
      ranking: allItems.slice(0, 4).map((item, index) => ({
        rank: index + 1,
        ticker: item.ticker,
        name: item.name,
        segment: item.segment,
        score: item.stabilityScore,
        highlight: item.whyChosen,
        magicNumber: item.magicNumber,
        monthlyDividend: item.dividend,
      })),
      verdict: isSmallContribution
        ? `Para aportes individuais de R$ ${customContribution.toFixed(2)}, priorize ativos com cotação abaixo de R$ ${customContribution.toFixed(2)} (ou fundos de Base R$ 10 como SNAG11, MXRF11, GARE11 e VGIA11). Isso garante que 100% do seu dinheiro compre cotas inteiras geradoras de renda imediata a cada aporte.`
        : 'Para construir uma renda passiva sólida e duradoura, comece focando em ativos de alta estabilidade e gestão AAA para atingir sua primeira cota auto-sustentável. Em seguida, aproveite ativos com alto yield do momento para acelerar a velocidade da bola de neve.',
      tacticalAdvice: [
        isSmallContribution
          ? `Compre ${Math.max(1, Math.floor(customContribution / topPickCandidate.currentPrice))} cota(s) de ${topPickCandidate.ticker} a cada aporte para colocar o dinheiro para trabalhar de imediato.`
          : 'Concentre 100% do aporte no ativo escolhido até atingir o Número Mágico (1 cota/mês de dividendo).',
        'Reinvista todo dividendo no mesmo dia em que cair na conta para potencializar os juros compostos.',
        'Diversifique entre Papel High Grade, Galpões AAA e Fiagro para blindar sua renda contra qualquer ciclo econômico.',
      ],
    };
  };

  const initializeDefaultRecommendation = (val: number = contributionInput) => {
    setRecommendation(buildCuratedRecommendation(val));
  };

  // Run dynamic Gemini AI analysis and persist results
  const handleRunAIAnalysis = async () => {
    setLoading(true);
    setErrorMsg(null);

    const formattedAssets = currentAssets.map((a) => {
      const shares = a.sharesCount || (a.sharePrice ? Math.floor(a.amount / a.sharePrice) : 1);
      const price = a.sharePrice || (shares > 0 ? a.amount / shares : 10);
      const dividend = a.dividendPerShare || 0.09;
      return {
        ticker: a.ticker || a.name.split('-')[0].trim().toUpperCase(),
        shares,
        price,
        dividend,
        segment: a.fiiSegment || a.type || 'FII',
      };
    });

    try {
      const result = await analyzeSnowballRecommendation(formattedAssets, contributionInput);
      let finalRecommendation: SnowballAIRecommendation;

      if (result && result.topCrisisResilient && result.topCrisisResilient.length > 0) {
        // Enforce score breakdown, risk alerts, and exit triggers fallbacks from curated intelligence if AI returns partial fields
        const enrichedCrisis = result.topCrisisResilient.map((item) => {
          const curated = CURATED_FII_DATA[item.ticker];
          return {
            ...item,
            scoreBreakdown: item.scoreBreakdown || curated?.scoreBreakdown,
            riskAlerts: item.riskAlerts || curated?.riskAlerts || ['Monitoramento de taxa de juros e inadimplência.'],
            exitTriggers: item.exitTriggers || curated?.exitTriggers || ['⚠️ P/VP ultrapassar 1.08 → Reavaliar tese → Motivo: redução da margem de segurança.', '⚠️ Queda de proventos por 3 meses seguidos → Reavaliar tese → Motivo: checagem de fluxo de caixa.'],
            analystTake: item.analystTake || curated?.analystTake || item.whyChosen,
          };
        });

        const enrichedMomentum = (result.topMomentum || []).map((item) => {
          const curated = CURATED_FII_DATA[item.ticker];
          return {
            ...item,
            scoreBreakdown: item.scoreBreakdown || curated?.scoreBreakdown,
            riskAlerts: item.riskAlerts || curated?.riskAlerts || ['Risco de mercado e oscilação de spread.'],
            exitTriggers: item.exitTriggers || curated?.exitTriggers || ['⚠️ P/VP subir acima de 1.05 → Reavaliar tese → Motivo: prêmio de risco reduzido.', '⚠️ Queda de proventos por 3 meses seguidos → Reavaliar tese → Motivo: sustentabilidade.'],
            analystTake: item.analystTake || curated?.analystTake || item.whyChosen,
          };
        });

        finalRecommendation = {
          ...result,
          topCrisisResilient: enrichedCrisis,
          topMomentum: enrichedMomentum,
        };
      } else {
        finalRecommendation = buildCuratedRecommendation(contributionInput);
      }

      const now = new Date().toISOString();
      const payload: PersistedSnowballAIAnalysis = {
        recommendation: finalRecommendation,
        contributionAmount: contributionInput,
        lastAnalyzedAt: now,
        isCustomAI: true,
      };

      // Persist to storage (localStorage + Firestore)
      await saveSnowballAIAnalysis(payload, auth.currentUser?.uid);

      setRecommendation(finalRecommendation);
      setLastAnalyzedAt(now);
      setIsPersistedAI(true);

      toast.success('Análise da IA gravada com sucesso!', {
        description: 'Fundos, scores, pareceres e gatilhos de reavaliação foram persistidos.',
      });
    } catch (err: any) {
      console.warn('AI analysis fallback used:', err);
      const fallbackRec = buildCuratedRecommendation(contributionInput);
      setRecommendation(fallbackRec);
    } finally {
      setLoading(false);
    }
  };

  // Combined and filtered list of assets based on current tab and search
  const displayedAssets: FiiRecommendationItem[] = useMemo(() => {
    if (!recommendation) return [];

    let list: FiiRecommendationItem[] = [];

    const map = new Map<string, FiiRecommendationItem>();
    (recommendation.topCrisisResilient || []).forEach((item) => map.set(item.ticker, item));
    (recommendation.topMomentum || []).forEach((item) => map.set(item.ticker, item));
    // Also include any curated FIIs not yet in the map
    Object.keys(CURATED_FII_DATA).forEach((ticker) => {
      if (!map.has(ticker)) {
        const curated = CURATED_FII_DATA[ticker];
        const quote = realtimeQuotes[ticker];
        const price = quote?.price || curated.price;
        const dividend = quote?.lastDividend || curated.lastDividend;
        const monthlyDY = Number(((dividend / price) * 100).toFixed(2));
        const magicNumber = Math.ceil(price / dividend);
        map.set(ticker, {
          rank: map.size + 1,
          ticker,
          name: quote?.name || curated.name,
          segment: curated.segment,
          manager: curated.manager,
          currentPrice: price,
          dividend,
          monthlyDY,
          annualDY: Number((monthlyDY * 12).toFixed(1)),
          pvp: curated.pvp,
          stabilityScore: curated.stabilityScore,
          riskLevel: curated.riskLevel,
          magicNumber,
          costToSnowball: magicNumber * price,
          whyChosen: curated.keyHighlight,
          crisisResilienceReason: curated.crisisResilience,
          category: curated.category,
          scoreBreakdown: curated.scoreBreakdown,
          riskAlerts: curated.riskAlerts,
          exitTriggers: curated.exitTriggers,
          analystTake: curated.analystTake,
        });
      }
    });

    const allList = Array.from(map.values());

    if (categoryFilter === 'anti_crise') {
      list = recommendation.topCrisisResilient || [];
    } else if (categoryFilter === 'momento') {
      list = recommendation.topMomentum || [];
    } else if (categoryFilter === 'cabe_no_aporte') {
      list = allList.filter((i) => i.currentPrice <= contributionInput);
    } else if (categoryFilter === 'base_10') {
      list = allList.filter((i) => i.currentPrice < 25);
    } else if (categoryFilter === 'fiagro') {
      list = allList.filter((i) => i.segment.toLowerCase().includes('fiagro') || i.segment.toLowerCase().includes('agro'));
    } else if (categoryFilter === 'tijolo') {
      list = allList.filter((i) => i.segment.toLowerCase().includes('tijolo') || i.segment.toLowerCase().includes('galp') || i.segment.toLowerCase().includes('shop'));
    } else if (categoryFilter === 'papel') {
      list = allList.filter((i) => i.segment.toLowerCase().includes('papel') || i.segment.toLowerCase().includes('cri') || i.segment.toLowerCase().includes('cdi') || i.segment.toLowerCase().includes('ipca'));
    } else {
      list = allList;
    }

    // Apply Search Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (i) =>
          i.ticker.toLowerCase().includes(term) ||
          i.name.toLowerCase().includes(term) ||
          i.segment.toLowerCase().includes(term) ||
          (i.manager && i.manager.toLowerCase().includes(term))
      );
    }

    // Apply Sorting
    return [...list].sort((a, b) => {
      if (sortBy === 'price_asc') {
        return a.currentPrice - b.currentPrice; // Lowest share price (Base 10) first
      }
      if (sortBy === 'stability') {
        return b.stabilityScore - a.stabilityScore; // Higher score first
      }
      if (sortBy === 'profitability') {
        return b.monthlyDY - a.monthlyDY; // Higher yield first
      }
      if (sortBy === 'magic_cost') {
        return a.costToSnowball - b.costToSnowball; // Lowest cost to magic number first
      }
      if (sortBy === 'pvp_discount') {
        return a.pvp - b.pvp; // Highest discount (lowest P/VP) first
      }
      if (sortBy === 'alphabetical') {
        return a.ticker.localeCompare(b.ticker);
      }
      return 0;
    });
  }, [recommendation, categoryFilter, sortBy, searchTerm, contributionInput, realtimeQuotes]);

  const openAssetModal = (asset: FiiRecommendationItem, tab: ModalTab = 'overview') => {
    setSelectedAssetModal(asset);
    setActiveModalTab(tab);
  };

  const handleContributionChange = (val: number) => {
    setContributionInput(val);
    // If not a persisted AI analysis yet, update the preview dynamically
    if (!isPersistedAI) {
      setRecommendation(buildCuratedRecommendation(val));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="snowball-ai-advisor-root">
      {/* Top Banner AI Spotlight */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                <span>Análise Profissional • CNPI & Inteligência B3</span>
              </div>
              {isPersistedAI && lastAnalyzedAt && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold font-mono">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Auditoria Salva: {new Date(lastAnalyzedAt).toLocaleDateString('pt-BR')} às {new Date(lastAnalyzedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>IA FIIs & Fiagros: Top das Galáxias</span>
            </h2>
            <p className="text-xs md:text-sm text-indigo-200/90 leading-relaxed">
              Recomendações, notas dos 5 pilares e gatilhos de reavaliação calibrados para o seu <strong>aporte individual</strong>. Todos os dados permanecem <strong>salvos e persistidos</strong> até que você execute uma nova auditoria com a IA.
            </p>
          </div>

          {/* Action Trigger Box */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block mb-1">
                Seu Aporte Individual (R$):
              </label>
              <input
                type="number"
                step="5"
                min="5"
                value={contributionInput}
                onChange={(e) => handleContributionChange(Math.max(1, Number(e.target.value)))}
                className="w-full sm:w-36 px-3 py-2 text-sm font-mono font-bold rounded-xl bg-slate-900/80 border border-indigo-400/40 text-white outline-none focus:ring-2 focus:ring-amber-400"
              />
              <div className="flex items-center gap-1 mt-1.5">
                {[10, 20, 50, 100, 300].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleContributionChange(preset)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      contributionInput === preset
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'bg-white/10 text-indigo-200 hover:bg-white/20'
                    }`}
                  >
                    R${preset}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRunAIAnalysis}
              disabled={loading}
              className="mt-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs md:text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Auditando Mercado...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>{isPersistedAI ? 'Nova Análise com IA' : 'Gerar Análise com IA'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* TOP 1 PICK FOR INDIVIDUAL CONTRIBUTION SPOTLIGHT */}
      {recommendation?.topPick && (
        <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-indigo-500/15 dark:from-amber-950/40 dark:via-emerald-950/40 dark:to-indigo-950/40 border-2 border-amber-400/50 dark:border-amber-400/40 rounded-3xl p-5 md:p-6 shadow-lg relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black tracking-wide uppercase shadow-sm">
                  <Award className="w-3.5 h-3.5 fill-slate-950" />
                  Top 1 das Galáxias para o seu Aporte
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  {contributionInput >= recommendation.topPick.currentPrice
                    ? `Compra ${Math.floor(contributionInput / recommendation.topPick.currentPrice)} cota(s) inteira(s) com R$ ${contributionInput.toFixed(2)}`
                    : `Cotação de R$ ${recommendation.topPick.currentPrice.toFixed(2)}`}
                </span>
                {recommendation.topPick.currentPrice < 25 && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-black">
                    🏷️ Base R$ 10
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-3 flex-wrap">
                <h3 className="text-2xl md:text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                  {recommendation.topPick.ticker}
                </h3>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  {recommendation.topPick.name} • {recommendation.topPick.segment}
                </span>
              </div>

              <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {recommendation.topPick.whyTop}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0 w-full lg:w-auto">
              <div className="grid grid-cols-3 gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Cotação</span>
                  <span className="text-xs font-black font-mono text-slate-900 dark:text-white">
                    R$ {recommendation.topPick.currentPrice.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block uppercase font-bold">DY Mensal</span>
                  <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {recommendation.topPick.monthlyDY.toFixed(2)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 block uppercase font-bold">Nº Mágico</span>
                  <span className="text-xs font-black font-mono text-cyan-600 dark:text-cyan-400">
                    {recommendation.topPick.magicNumber} cotas
                  </span>
                </div>
              </div>

              <button
                onClick={() =>
                  onSelectAssetToInvest({
                    ticker: recommendation.topPick.ticker,
                    name: recommendation.topPick.name,
                    price: recommendation.topPick.currentPrice,
                    dividend: recommendation.topPick.dividend,
                    segment: recommendation.topPick.segment,
                  })
                }
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs md:text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Aportar Agora em {recommendation.topPick.ticker}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTER & SORT BAR (Interactive Navigation) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        {/* Top line: Category Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCategoryFilter('anti_crise')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                categoryFilter === 'anti_crise'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>🛡️ Anti-Crise (Mais Seguros)</span>
            </button>

            <button
              onClick={() => setCategoryFilter('momento')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                categoryFilter === 'momento'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-600 fill-orange-600" />
              <span>🔥 Alto Yield (Momento)</span>
            </button>

            <button
              onClick={() => setCategoryFilter('cabe_no_aporte')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                categoryFilter === 'cabe_no_aporte'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 hover:bg-cyan-100 border border-cyan-300 dark:border-cyan-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" />
              <span>🎯 Cabem no meu Aporte (≤ R$ {contributionInput})</span>
            </button>

            <button
              onClick={() => setCategoryFilter('base_10')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                categoryFilter === 'base_10'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 hover:bg-purple-100 border border-purple-300 dark:border-purple-800'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-purple-500" />
              <span>🏷️ Base R$ 10 (Cotação Acessível)</span>
            </button>

            <button
              onClick={() => setCategoryFilter('all')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>Todos ({featuredTickers.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar ticker, gestora ou segmento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Bottom line: Sorting & Sub-filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs">
          {/* Sub category tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-medium mr-1">Filtrar:</span>
            <button
              onClick={() => setCategoryFilter('fiagro')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                categoryFilter === 'fiagro'
                  ? 'bg-lime-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Wheat className="w-3 h-3" />
              <span>Fiagros</span>
            </button>
            <button
              onClick={() => setCategoryFilter('tijolo')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                categoryFilter === 'tijolo'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>FIIs Tijolo</span>
            </button>
            <button
              onClick={() => setCategoryFilter('papel')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                categoryFilter === 'papel'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Coins className="w-3 h-3" />
              <span>FIIs Papel</span>
            </button>
          </div>

          {/* Sort selection */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Ordenar por:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="price_asc">🏷️ Menor Cotação (Base R$ 10 primeiro)</option>
              <option value="stability">🛡️ Estabilidade & Resiliência (Maior Score)</option>
              <option value="profitability">💰 Rentabilidade (Maior Dividend Yield)</option>
              <option value="magic_cost">⚡ Menor Custo do Número Mágico</option>
              <option value="pvp_discount">🏷️ Maior Desconto Patrimonial (Menor P/VP)</option>
              <option value="alphabetical">🔤 Ticker (A - Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ASSET CARDS GRID (Rich & Interactive) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {categoryFilter === 'anti_crise'
                ? 'Os 5 Mais Pagantes com Alta Estabilidade (Anti-Crise)'
                : categoryFilter === 'momento'
                ? 'Destaques do Momento (Alto Dividend Yield & Oportunidades)'
                : 'Lista de Ativos Auditados'}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs">
              {displayedAssets.length} ativos
            </span>
          </div>

          <button
            onClick={loadRealtimeQuotes}
            disabled={loadingQuotes}
            className="flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingQuotes ? 'animate-spin' : ''}`} />
            <span>Atualizar Cotações B3</span>
          </button>
        </div>

        {displayedAssets.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700 space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="text-sm text-slate-600 dark:text-slate-300 font-bold">
              Nenhum ativo encontrado para os filtros selecionados.
            </p>
            <button
              onClick={() => {
                setCategoryFilter('all');
                setSearchTerm('');
              }}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-indigo-700"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedAssets.map((asset, index) => {
              const monthsToGoal = contributionInput > 0 ? Math.ceil(asset.costToSnowball / contributionInput) : 0;
              const isAntiCrise = asset.category === 'anti_crise';
              const isExpanded = expandedCardTicker === asset.ticker;

              return (
                <div
                  key={asset.ticker}
                  className={`bg-white dark:bg-slate-800 rounded-3xl p-5 md:p-6 border transition-all hover:shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden group ${
                    isAntiCrise
                      ? 'border-emerald-500/40 dark:border-emerald-500/30 hover:border-emerald-500'
                      : 'border-amber-500/40 dark:border-amber-500/30 hover:border-amber-500'
                  }`}
                >
                  {/* Subtle highlight background banner */}
                  <div
                    className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-10 pointer-events-none ${
                      isAntiCrise ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />

                  {/* Header info */}
                  <div className="space-y-3 relative z-10">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono font-black text-xl text-slate-900 dark:text-white tracking-tight">
                            {asset.ticker}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 ${
                              isAntiCrise
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {isAntiCrise ? (
                              <>
                                <ShieldCheck className="w-3 h-3" />
                                <span>Anti-Crise AAA</span>
                              </>
                            ) : (
                              <>
                                <Flame className="w-3 h-3" />
                                <span>Momento / Alto Yield</span>
                              </>
                            )}
                          </span>

                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {asset.segment}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {asset.name}
                        </h4>
                        {asset.manager && (
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Gestão: <strong>{asset.manager}</strong>
                          </span>
                        )}
                      </div>

                      {/* Stability Score Shield with Click-to-Breakdown */}
                      <button
                        onClick={() => openAssetModal(asset, 'score_breakdown')}
                        title="Clique para ver por que esta nota foi atribuída"
                        className="text-right shrink-0 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 transition-all cursor-pointer group/score"
                      >
                        <div className="flex items-center gap-1.5 px-1.5">
                          <Shield
                            className={`w-4 h-4 ${
                              asset.stabilityScore >= 95
                                ? 'text-emerald-500'
                                : asset.stabilityScore >= 90
                                ? 'text-cyan-500'
                                : 'text-amber-500'
                            }`}
                          />
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase font-bold text-left group-hover/score:text-cyan-500 flex items-center gap-0.5">
                              Nota Confiança <HelpCircle className="w-2.5 h-2.5 opacity-60" />
                            </span>
                            <span className="text-xs font-black font-mono text-slate-900 dark:text-white block text-left">
                              {asset.stabilityScore}/100
                            </span>
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Key Metrics Strip (Price, Yield, Provento, P/VP) */}
                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Cotação</span>
                        <span className="text-xs font-black font-mono text-slate-900 dark:text-white block mt-0.5">
                          R$ {asset.currentPrice.toFixed(2)}
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">
                          DY Mensal
                        </span>
                        <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 block mt-0.5">
                          {asset.monthlyDY.toFixed(2)}%
                        </span>
                        <span className="text-[9px] text-slate-400">({asset.annualDY.toFixed(1)}% a.a.)</span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Dividendo</span>
                        <span className="text-xs font-black font-mono text-slate-800 dark:text-slate-200 block mt-0.5">
                          R$ {asset.dividend.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-slate-400">/cota/mês</span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">P/VP</span>
                        <span
                          className={`text-xs font-black font-mono block mt-0.5 ${
                            asset.pvp < 0.96
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : asset.pvp <= 1.03
                              ? 'text-slate-900 dark:text-white'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {asset.pvp.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {asset.pvp < 1 ? `-${Math.round((1 - asset.pvp) * 100)}% desc.` : 'preço justo'}
                        </span>
                      </div>
                    </div>

                    {/* Aporte Individual Compatibility Badge */}
                    <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                      asset.currentPrice <= contributionInput
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold">
                        {asset.currentPrice <= contributionInput ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Cabe no Aporte: <strong>{Math.floor(contributionInput / asset.currentPrice)} cota{Math.floor(contributionInput / asset.currentPrice) > 1 ? 's' : ''}</strong> por aporte de R$ {contributionInput.toFixed(2)}</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>Cotação acima do aporte (precisa acumular {Math.ceil(asset.currentPrice / contributionInput)} aportes p/ 1 cota)</span>
                          </>
                        )}
                      </div>
                      {asset.currentPrice < 25 && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] font-black shrink-0">
                          Base R$ 10
                        </span>
                      )}
                    </div>

                    {/* Snowball Magic Goal Box */}
                    <div className="p-3 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/5 border border-cyan-500/30 flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-300 flex items-center gap-1">
                          <Target className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                          Número Mágico (1 Cota Grátis/Mês)
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-black font-mono text-cyan-700 dark:text-cyan-300">
                            {asset.magicNumber} cotas
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            • Custo total: <strong>R$ {asset.costToSnowball.toFixed(2)}</strong>
                          </span>
                        </div>
                      </div>

                      {contributionInput > 0 && (
                        <div className="text-right shrink-0">
                          <span className="text-[9px] text-slate-400 block font-bold">Tempo Estimado</span>
                          <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400">
                            ~{monthsToGoal} {monthsToGoal === 1 ? 'aporte' : 'aportes'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* PROFESSIONAL ANALYST SECTIONS ON CARD */}
                    {/* 1. Primary Risk Alert */}
                    {asset.riskAlerts && asset.riskAlerts.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 block tracking-wide">
                            Sinal de Atenção / Risco Monitorado:
                          </span>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-tight">
                            {asset.riskAlerts[0]}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 2. Re-evaluation Trigger / Gatilho de Reavaliação */}
                    {asset.exitTriggers && asset.exitTriggers.length > 0 && (() => {
                      const firstTrigger = asset.exitTriggers[0];
                      const parts = firstTrigger.split('→');
                      const triggerCond = parts[0]?.replace(/^⚠️\s*/, '').trim();
                      const triggerReason = parts[1]?.trim();

                      return (
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-400 flex items-center gap-1 tracking-wide">
                              <AlertOctagon className="w-3.5 h-3.5" />
                              Gatilho de Reavaliação da Tese:
                            </span>
                            <button
                              onClick={() => openAssetModal(asset, 'exit_triggers')}
                              className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                            >
                              Ver todas ({asset.exitTriggers.length})
                            </button>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-[11px] text-slate-800 dark:text-slate-200 font-bold leading-tight flex items-start gap-1.5">
                              <span className="text-rose-500 shrink-0 mt-0.5 font-mono">⚠️</span>
                              <span>{triggerCond}</span>
                            </p>
                            {triggerReason && (
                              <p className="text-[10.5px] text-slate-600 dark:text-slate-300 italic pl-3.5 border-l-2 border-rose-400/40 leading-snug">
                                "{triggerReason}"
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Expandable Deep Dive inside the card */}
                    {isExpanded && (
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 space-y-2 text-xs animate-fade-in">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700">
                          <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1 text-[11px]">
                            <UserCheck className="w-3.5 h-3.5 text-cyan-500" />
                            Parecer Executivo do Especialista:
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 font-mono font-bold">
                            CNPI / Analista
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed italic">
                          "{asset.analystTake || asset.whyChosen}"
                        </p>

                        {asset.scoreBreakdown && (
                          <div className="pt-2 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Pilares da Nota ({asset.stabilityScore}/100):
                            </span>
                            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                              <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between">
                                <span className="font-sans text-slate-500">Gestão:</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {asset.scoreBreakdown.managementQuality?.score || 19}/20
                                </span>
                              </div>
                              <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between">
                                <span className="font-sans text-slate-500">Solvência:</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {asset.scoreBreakdown.portfolioSolvency?.score || 20}/20
                                </span>
                              </div>
                              <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between">
                                <span className="font-sans text-slate-500">Liquidez:</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {asset.scoreBreakdown.liquidity?.score || 19}/20
                                </span>
                              </div>
                              <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between">
                                <span className="font-sans text-slate-500">Previsibilidade:</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {asset.scoreBreakdown.predictability?.score || 19}/20
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons ("Dai eu escolho" + Quick Expand) */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 relative z-10">
                    <button
                      onClick={() =>
                        onSelectAssetToInvest({
                          ticker: asset.ticker,
                          name: asset.name,
                          price: asset.currentPrice,
                          dividend: asset.dividend,
                          segment: asset.segment,
                        })
                      }
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs md:text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Escolher {asset.ticker} (Aportar Agora)</span>
                    </button>

                    <button
                      onClick={() => setExpandedCardTicker(isExpanded ? null : asset.ticker)}
                      title={isExpanded ? 'Recolher detalhes' : 'Expandir parecer do analista'}
                      className="p-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shrink-0"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => openAssetModal(asset, 'overview')}
                      title="Abrir Dossiê Completo"
                      className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 transition-all cursor-pointer shrink-0"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STRATEGIC MASTER VERDICT & TACTICAL ADVICE */}
      {recommendation && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Veredito Mestre da IA: Como Balancear Estabilidade & Rentabilidade</span>
            </h4>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {recommendation.verdict}
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-700 to-slate-900 text-white rounded-3xl p-6 shadow-md space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span>Regras de Ouro dos Juros Compostos</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-indigo-100">
              {recommendation.tacticalAdvice.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* PUNCHY 2-LINE DIDACTIC FINAL SUMMARY / RECOMENDAÇÃO PRÁTICA */}
      <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 dark:from-amber-950/30 dark:via-emerald-950/30 dark:to-indigo-950/30 border-2 border-amber-500/30 dark:border-amber-400/25 rounded-3xl p-5 md:p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shrink-0 shadow-md">
              <Lightbulb className="w-5 h-5 fill-slate-950" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  Resumo Final Didático • Recomendação em 2 Linhas
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  Para Amarrar Tudo 🎯
                </span>
              </div>
              <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                1️⃣ <span className="text-emerald-700 dark:text-emerald-400 font-black">Meta 1:</span> Direcione todos os aportes para <strong>1 único ativo seguro (Anti-Crise)</strong> até atingir o <em>Número Mágico</em> de 1 cota grátis todo mês pelos dividendos.
              </p>
              <p className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200 leading-snug">
                2️⃣ <span className="text-amber-700 dark:text-amber-400 font-black">Meta 2:</span> Quando essa primeira bola de neve rodar sozinha, replique o processo em um fundo de <strong>Alto Yield (Momento)</strong> para acelerar seus ganhos sem abrir mão da segurança.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE DOSSIER / RAIO-X MODAL */}
      {selectedAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-2xl space-y-5 animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {selectedAssetModal.ticker}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {selectedAssetModal.segment}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {selectedAssetModal.name} • Gestora: <strong>{selectedAssetModal.manager || 'Consolidada'}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedAssetModal(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
              <button
                onClick={() => setActiveModalTab('overview')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeModalTab === 'overview'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Visão Geral & Bola de Neve
              </button>
              <button
                onClick={() => setActiveModalTab('score_breakdown')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeModalTab === 'score_breakdown'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                📊 Raio-X da Nota ({selectedAssetModal.stabilityScore}/100)
              </button>
              <button
                onClick={() => setActiveModalTab('risks')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeModalTab === 'risks'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ⚠️ Riscos
              </button>
              <button
                onClick={() => setActiveModalTab('exit_triggers')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeModalTab === 'exit_triggers'
                    ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🔍 Reavaliação da Tese
              </button>
            </div>

            {/* TAB CONTENT: Overview */}
            {activeModalTab === 'overview' && (
              <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed animate-fade-in">
                <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/60 space-y-1">
                  <span className="font-black text-cyan-800 dark:text-cyan-300 block text-xs flex items-center gap-1">
                    <UserCheck className="w-4 h-4" />
                    Parecer do Analista:
                  </span>
                  <p className="text-slate-700 dark:text-slate-200 text-xs">
                    "{selectedAssetModal.analystTake || selectedAssetModal.whyChosen}"
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-sans">Cotação Atual</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      R$ {selectedAssetModal.currentPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-sans">DY Mensal</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {selectedAssetModal.monthlyDY.toFixed(2)}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-sans">Dividendo</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      R$ {selectedAssetModal.dividend.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-sans">P/VP</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {selectedAssetModal.pvp.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-100 block">
                    🛡️ Resiliência & Comportamento em Crises:
                  </span>
                  <p>{selectedAssetModal.crisisResilienceReason}</p>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-300 block">
                      Número Mágico (1 Cota Grátis/mês)
                    </span>
                    <span className="text-lg font-black font-mono text-cyan-700 dark:text-cyan-300">
                      {selectedAssetModal.magicNumber} cotas
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Investimento Necessário
                    </span>
                    <span className="text-lg font-black font-mono text-indigo-700 dark:text-indigo-300">
                      R$ {selectedAssetModal.costToSnowball.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Score Breakdown (Por que da Nota) */}
            {activeModalTab === 'score_breakdown' && (
              <div className="space-y-4 text-xs animate-fade-in">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Score Global de Confiança</span>
                    <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {selectedAssetModal.stabilityScore} / 100
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {selectedAssetModal.riskLevel} Risco
                  </span>
                </div>

                <div className="space-y-2.5">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Detalhamento dos 5 Pilares de Avaliação:
                  </h5>

                  {/* 1. Gestão */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-white">1. Qualidade & Histórico da Gestão</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedAssetModal.scoreBreakdown?.managementQuality?.score || 19}/20 pts
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {selectedAssetModal.scoreBreakdown?.managementQuality?.detail || 'Gestora consolidada com governança de alto padrão na CVM e B3.'}
                    </p>
                  </div>

                  {/* 2. Solvência */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-white">2. Solvência da Carteira (Inadimplência / Vacância)</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedAssetModal.scoreBreakdown?.portfolioSolvency?.score || 20}/20 pts
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {selectedAssetModal.scoreBreakdown?.portfolioSolvency?.detail || 'Baixíssimo histórico de perdas, garantias reais e devedores com grau de investimento.'}
                    </p>
                  </div>

                  {/* 3. Liquidez */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-white">3. Liquidez de Mercado & Giro Diário</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedAssetModal.scoreBreakdown?.liquidity?.score || 19}/20 pts
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {selectedAssetModal.scoreBreakdown?.liquidity?.detail || 'Fundo com milhões em negociação diária, permitindo resgates ou compras sem spread excessivo.'}
                    </p>
                  </div>

                  {/* 4. Previsibilidade */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-white">4. Previsibilidade do Fluxo de Dividendos</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedAssetModal.scoreBreakdown?.predictability?.score || 19}/20 pts
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {selectedAssetModal.scoreBreakdown?.predictability?.detail || 'Contratos indexados com fluxo constante de caixa sem soluços distributivos.'}
                    </p>
                  </div>

                  {/* 5. Diversificação */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-white">5. Diversificação & Pulverização de Risco</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedAssetModal.scoreBreakdown?.diversification?.score || 19}/20 pts
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {selectedAssetModal.scoreBreakdown?.diversification?.detail || 'Dezenas de ativos e devedores que blindam o investidor contra o calote de um único nome.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Active Risk Alerts */}
            {activeModalTab === 'risks' && (
              <div className="space-y-4 text-xs animate-fade-in">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 space-y-1">
                  <span className="font-black flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Radar de Riscos Monitorados pelo Analista
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Investir com maturidade exige conhecer onde a tese pode sofrer pressão. Estes são os pontos de atenção atuais:
                  </p>
                </div>

                <div className="space-y-2.5">
                  {(selectedAssetModal.riskAlerts || [
                    'Sensibilidade a alterações no ciclo macroeconômico e juros.',
                    'Risco de reinvestimento de caixa com taxas menores em caso de afrouxamento monetário.',
                  ]).map((alert, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5"
                    >
                      <span className="font-mono font-bold text-amber-500 text-sm">#{idx + 1}</span>
                      <p className="text-slate-700 dark:text-slate-200 text-xs leading-relaxed">{alert}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Re-evaluation Triggers (Gatilhos de Reavaliação da Tese) */}
            {activeModalTab === 'exit_triggers' && (
              <div className="space-y-4 text-xs animate-fade-in">
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-950 dark:text-rose-200 space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-black flex items-center gap-1.5 text-xs text-rose-800 dark:text-rose-300">
                      <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      Gatilhos de Reavaliação da Tese (Monitoramento Dinâmico)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-800 dark:text-rose-300 font-bold text-[10px]">
                      Sinais para Reavaliar, Não Vender às Cegas
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                    O contexto macroeconômico muda constantemente. Os gatilhos abaixo servem como <strong>sinais de alerta prudente</strong> para <em>reavaliar a tese</em> e auditar os fundamentos do ativo, garantindo que suas decisões sejam conscientes e fundamentadas.
                  </p>
                </div>

                <div className="space-y-3">
                  {(selectedAssetModal.exitTriggers || [
                    'P/VP acima de 1,07 → Redução da margem de segurança do retorno real com prêmio excessivo.',
                    'Inadimplência recorrente em devedores relevantes → Exige acompanhamento da solvência e das garantias reais.',
                    'Redução de proventos por 3 meses consecutivos → Sinaliza necessidade de checar a sustentabilidade do fluxo de caixa.',
                  ]).map((trigger, idx) => {
                    const parts = trigger.split('→');
                    const condition = parts[0]?.replace(/^⚠️\s*/, '').trim();
                    const justification = parts.slice(1).join('→').replace(/^(Reavaliar tese\s*→\s*(Motivo:\s*)?)/i, '').trim();

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-amber-200/70 dark:border-amber-900/40 space-y-2 hover:border-amber-400 transition-colors shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 shrink-0 font-bold font-mono text-xs mt-0.5">
                              #{idx + 1}
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                                Gatilho de Alerta / Condição:
                              </span>
                              <h6 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                                {condition}
                              </h6>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-400/40 font-black text-[10px] shrink-0 uppercase tracking-wide flex items-center gap-1">
                            REAVALIAR TESE 🔍
                          </span>
                        </div>

                        {justification && (
                          <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-start gap-2 text-slate-600 dark:text-slate-300">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-relaxed">
                              <strong className="text-slate-800 dark:text-slate-200">Motivo / Análise recomendada: </strong>
                              {justification}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-3">
              <button
                onClick={() => setSelectedAssetModal(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              >
                Fechar Dossiê
              </button>
              <button
                onClick={() => {
                  const asset = selectedAssetModal;
                  setSelectedAssetModal(null);
                  onSelectAssetToInvest({
                    ticker: asset.ticker,
                    name: asset.name,
                    price: asset.currentPrice,
                    dividend: asset.dividend,
                    segment: asset.segment,
                  });
                }}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs md:text-sm shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Escolher {selectedAssetModal.ticker} para Aportar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
