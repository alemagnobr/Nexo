import React, { useState, useMemo } from 'react';
import { Investment, View, Wallet } from '../types';
import {
  Snowflake,
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Sparkles,
  Calculator,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
  ArrowUpRight,
  PieChart as PieChartIcon,
  ChevronRight,
  Coins,
  Repeat,
  PlusCircle,
  Target
} from 'lucide-react';
import { CurrencyInput } from './CurrencyInput';
import { SnowballAIAdvisor } from './SnowballAIAdvisor';
import { SnowballAssetReevaluationModal } from './SnowballAssetReevaluationModal';
import { SnowballGrowthChartModal } from './SnowballGrowthChartModal';
import { fetchB3Quote, CURATED_FII_DATA, B3QuoteResult } from '../services/brapiService';

interface SnowballViewProps {
  investments: Investment[];
  onAddInvestment: (inv: Omit<Investment, 'id'>) => Promise<string> | void;
  onUpdateInvestment: (id: string, updates: Partial<Investment>) => Promise<void> | void;
  onDeleteInvestment: (id: string) => Promise<void> | void;
  privacyMode: boolean;
  wallets?: Wallet[];
  onAddTransaction?: (t: any) => Promise<void> | void;
  onNavigateToAllInvestments?: () => void;
}

// Preset popular FIIs / Fiagros for quick simulation & addition
const POPULAR_FII_PRESETS = [
  { ticker: 'MXRF11', name: 'Maxi Renda FII', segment: 'Papel / CRI', defaultPrice: 10.15, defaultYield: 0.09, category: 'FII Base R$ 10' },
  { ticker: 'VGIA11', name: 'Valora CRA Fiagro', segment: 'Fiagro', defaultPrice: 8.85, defaultYield: 0.10, category: 'Fiagro Base R$ 10' },
  { ticker: 'CPTS11', name: 'Capitânia Securities', segment: 'Papel / CRI', defaultPrice: 8.20, defaultYield: 0.075, category: 'FII Base R$ 10' },
  { ticker: 'SNAG11', name: 'Suno Agro Fiagro', segment: 'Fiagro', defaultPrice: 10.05, defaultYield: 0.105, category: 'Fiagro Base R$ 10' },
  { ticker: 'HGLG11', name: 'CSHG Logística', segment: 'Tijolo / Galpões', defaultPrice: 162.50, defaultYield: 1.10, category: 'FII Base R$ 100' },
  { ticker: 'XPML11', name: 'XP Malls FII', segment: 'Tijolo / Shoppings', defaultPrice: 112.80, defaultYield: 0.92, category: 'FII Base R$ 100' },
  { ticker: 'KNCR11', name: 'Kinea Rendimentos', segment: 'Papel / CDI', defaultPrice: 104.20, defaultYield: 1.05, category: 'FII Base R$ 100' },
  { ticker: 'BTLG11', name: 'BTG Pactual Logística', segment: 'Tijolo / Galpões', defaultPrice: 101.90, defaultYield: 0.78, category: 'FII Base R$ 100' },
];

export const SnowballView: React.FC<SnowballViewProps> = ({
  investments,
  onAddInvestment,
  onUpdateInvestment,
  onDeleteInvestment,
  privacyMode,
  wallets = [],
  onAddTransaction,
  onNavigateToAllInvestments,
}) => {
  // Modal / Form States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'carteira' | 'ia' | 'simulador' | 'guia'>('carteira');
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [isFetchingLiveQuote, setIsFetchingLiveQuote] = useState(false);
  const [reevaluatingAsset, setReevaluatingAsset] = useState<Investment | null>(null);
  const [growthChartAsset, setGrowthChartAsset] = useState<Investment | null>(null);

  // Quick Share increment modal
  const [quickShareAsset, setQuickShareAsset] = useState<Investment | null>(null);
  const [sharesToAdd, setSharesToAdd] = useState<number>(1);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');

  const handleUpdateAssetQuote = async (assetId: string, newPrice: number, newDividend: number) => {
    try {
      const target = investments.find((inv) => inv.id === assetId);
      if (!target) return;
      const shares = target.sharesCount || (target.sharePrice ? Math.floor(target.amount / target.sharePrice) : 1);
      const newAmount = shares * newPrice;
      const newMagicNumber = newDividend > 0 ? Math.ceil(newPrice / newDividend) : target.magicNumberTarget;

      await onUpdateInvestment(assetId, {
        sharePrice: newPrice,
        dividendPerShare: newDividend,
        amount: newAmount,
        targetAmount: newMagicNumber ? newMagicNumber * newPrice : target.targetAmount,
        magicNumberTarget: newMagicNumber,
      });
    } catch (err) {
      console.error('Error updating asset quote:', err);
    }
  };

  // Form State for new asset
  const [formData, setFormData] = useState({
    ticker: '',
    name: '',
    type: 'FIIs',
    fiiSegment: 'Papel / CRI',
    sharesCount: 1,
    sharePrice: 10.0,
    dividendPerShare: 0.1,
    institution: '',
  });

  // Edit State
  const [editFormData, setEditFormData] = useState({
    ticker: '',
    name: '',
    fiiSegment: 'Papel / CRI',
    sharesCount: 0,
    sharePrice: 0,
    dividendPerShare: 0,
  });

  // Live Simulator state
  const [simTicker, setSimTicker] = useState('MXRF11');
  const [simName, setSimName] = useState('Maxi Renda FII');
  const [simSegment, setSimSegment] = useState('Papel / CRI');
  const [simPrice, setSimPrice] = useState(10.15);
  const [simDividend, setSimDividend] = useState(0.09);
  const [simCurrentShares, setSimCurrentShares] = useState(25);
  const [simMonthlyContributionShares, setSimMonthlyContributionShares] = useState(5);

  // Filter snowball-eligible investments
  // An investment is in snowball if it has isSnowballActive === true OR type is FIIs/Fiagro or has sharesCount > 0
  const snowballAssets = useMemo(() => {
    return investments.filter((inv) => {
      const isFII =
        inv.isSnowballActive ||
        inv.type?.toLowerCase().includes('fii') ||
        inv.type?.toLowerCase().includes('fiagro') ||
        inv.type?.toLowerCase().includes('imobili') ||
        inv.sharesCount !== undefined;
      return isFII;
    });
  }, [investments]);

  // Global calculations
  const globalStats = useMemo(() => {
    let totalInvested = 0;
    let totalMonthlyIncome = 0;
    let totalFreeSharesMonthly = 0;
    let achievedCount = 0;

    snowballAssets.forEach((asset) => {
      const shares = asset.sharesCount || (asset.sharePrice ? Math.floor(asset.amount / asset.sharePrice) : 1);
      const price = asset.sharePrice || (shares > 0 ? asset.amount / shares : asset.amount);
      const dividend = asset.dividendPerShare || 0;

      const assetTotalVal = shares * price;
      const assetMonthlyYield = shares * dividend;
      const magicNumber = dividend > 0 ? Math.ceil(price / dividend) : 0;
      const freeShares = price > 0 ? Math.floor(assetMonthlyYield / price) : 0;

      totalInvested += assetTotalVal;
      totalMonthlyIncome += assetMonthlyYield;
      totalFreeSharesMonthly += freeShares;
      if (magicNumber > 0 && shares >= magicNumber) {
        achievedCount++;
      }
    });

    const averageProgress =
      snowballAssets.length > 0
        ? snowballAssets.reduce((acc, asset) => {
            const shares = asset.sharesCount || 0;
            const price = asset.sharePrice || 10;
            const dividend = asset.dividendPerShare || 0.1;
            const magicNum = dividend > 0 ? Math.ceil(price / dividend) : 100;
            const pct = Math.min(100, (shares / magicNum) * 100);
            return acc + pct;
          }, 0) / snowballAssets.length
        : 0;

    return {
      totalInvested,
      totalMonthlyIncome,
      totalFreeSharesMonthly,
      achievedCount,
      totalAssets: snowballAssets.length,
      averageProgress,
    };
  }, [snowballAssets]);

  // Simulator live calculations
  const simMagicNumber = useMemo(() => {
    if (!simPrice || !simDividend || simDividend <= 0) return 0;
    return Math.ceil(simPrice / simDividend);
  }, [simPrice, simDividend]);

  const simCostToMagicNumber = useMemo(() => {
    return simMagicNumber * simPrice;
  }, [simMagicNumber, simPrice]);

  const simCurrentMonthlyIncome = useMemo(() => {
    return simCurrentShares * simDividend;
  }, [simCurrentShares, simDividend]);

  const simCurrentProgress = useMemo(() => {
    if (!simMagicNumber) return 0;
    return Math.min(100, (simCurrentShares / simMagicNumber) * 100);
  }, [simCurrentShares, simMagicNumber]);

  const simMissingShares = useMemo(() => {
    return Math.max(0, simMagicNumber - simCurrentShares);
  }, [simMagicNumber, simCurrentShares]);

  const simMissingMoney = useMemo(() => {
    return simMissingShares * simPrice;
  }, [simMissingShares, simPrice]);

  const simFreeSharesPerMonth = useMemo(() => {
    if (!simPrice || simPrice <= 0) return 0;
    return (simCurrentMonthlyIncome / simPrice);
  }, [simCurrentMonthlyIncome, simPrice]);

  // Projection over 12, 24, 36, 60 months with reinvestment
  const projectionTable = useMemo(() => {
    if (!simPrice || !simDividend || simDividend <= 0) return [];
    const points = [6, 12, 24, 36, 60, 120];
    const results = [];

    let currentShares = simCurrentShares;
    let currentCash = 0;

    for (let m = 1; m <= 120; m++) {
      // Receive dividends
      const yieldAmount = currentShares * simDividend;
      currentCash += yieldAmount;
      // Add monthly new contribution shares
      currentShares += simMonthlyContributionShares;

      // Reinvest cash into new shares
      if (currentCash >= simPrice) {
        const newSharesBought = Math.floor(currentCash / simPrice);
        currentShares += newSharesBought;
        currentCash -= newSharesBought * simPrice;
      }

      if (points.includes(m)) {
        const equity = currentShares * simPrice;
        const monthlyYield = currentShares * simDividend;
        const freeShares = Math.floor(monthlyYield / simPrice);
        results.push({
          months: m,
          years: (m / 12).toFixed(1).replace('.0', ''),
          shares: Math.round(currentShares),
          equity,
          monthlyYield,
          freeShares,
        });
      }
    }
    return results;
  }, [simPrice, simDividend, simCurrentShares, simMonthlyContributionShares]);

  // Handle Add Form Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const shares = Number(formData.sharesCount) || 1;
    const price = Number(formData.sharePrice) || 10;
    const dividend = Number(formData.dividendPerShare) || 0.1;
    const totalAmount = shares * price;
    const magicNum = dividend > 0 ? Math.ceil(price / dividend) : 100;

    const tickerUpper = (formData.ticker || formData.name).trim().toUpperCase();

    await onAddInvestment({
      name: `${tickerUpper} - ${formData.name || 'Fundo Imobiliário'}`,
      ticker: tickerUpper,
      type: formData.type || 'FIIs',
      fiiSegment: formData.fiiSegment || 'Papel / CRI',
      amount: totalAmount,
      investedAmount: totalAmount,
      targetAmount: magicNum * price,
      date: new Date().toISOString().split('T')[0],
      sharesCount: shares,
      sharePrice: price,
      dividendPerShare: dividend,
      magicNumberTarget: magicNum,
      isSnowballActive: true,
      institution: formData.institution || 'Corretora',
      history: [
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString().split('T')[0],
          amount: totalAmount,
          type: 'contribution',
        },
      ],
    });

    setIsAddModalOpen(false);
    setFormData({
      ticker: '',
      name: '',
      type: 'FIIs',
      fiiSegment: 'Papel / CRI',
      sharesCount: 1,
      sharePrice: 10.0,
      dividendPerShare: 0.1,
      institution: '',
    });
  };

  // Handle Edit Submit
  const handleSaveEdit = async (id: string) => {
    const shares = Number(editFormData.sharesCount) || 1;
    const price = Number(editFormData.sharePrice) || 10;
    const dividend = Number(editFormData.dividendPerShare) || 0.1;
    const totalAmount = shares * price;
    const magicNum = dividend > 0 ? Math.ceil(price / dividend) : 100;

    await onUpdateInvestment(id, {
      name: editFormData.name,
      ticker: editFormData.ticker.toUpperCase(),
      fiiSegment: editFormData.fiiSegment,
      sharesCount: shares,
      sharePrice: price,
      dividendPerShare: dividend,
      amount: totalAmount,
      targetAmount: magicNum * price,
      magicNumberTarget: magicNum,
      isSnowballActive: true,
    });

    setEditingAssetId(null);
  };

  // Start Edit
  const startEdit = (asset: Investment) => {
    const shares = asset.sharesCount || (asset.sharePrice ? Math.floor(asset.amount / asset.sharePrice) : 1);
    const price = asset.sharePrice || (shares > 0 ? asset.amount / shares : 10);
    const dividend = asset.dividendPerShare || 0.1;

    setEditingAssetId(asset.id);
    setEditFormData({
      ticker: asset.ticker || asset.name.split('-')[0].trim(),
      name: asset.name,
      fiiSegment: asset.fiiSegment || 'Papel / CRI',
      sharesCount: shares,
      sharePrice: price,
      dividendPerShare: dividend,
    });
  };

  // Quick increment shares
  const handleQuickAddShares = async () => {
    if (!quickShareAsset) return;
    const currentShares = quickShareAsset.sharesCount || 0;
    const newShares = currentShares + sharesToAdd;
    const price = quickShareAsset.sharePrice || 10;
    const newAmount = newShares * price;
    const cost = sharesToAdd * price;

    await onUpdateInvestment(quickShareAsset.id, {
      sharesCount: newShares,
      amount: newAmount,
      investedAmount: (quickShareAsset.investedAmount || quickShareAsset.amount) + cost,
      lastContribution: cost,
      lastContributionDate: new Date().toISOString().split('T')[0],
      history: [
        ...(quickShareAsset.history || []),
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString().split('T')[0],
          amount: cost,
          type: 'contribution',
        },
      ],
    });

    // If wallet was chosen, record financial transaction
    if (selectedWalletId && onAddTransaction && cost > 0) {
      await onAddTransaction({
        description: `Aporte ${quickShareAsset.ticker || quickShareAsset.name} (+${sharesToAdd} cotas)`,
        amount: cost,
        type: 'expense',
        category: 'Investimentos',
        date: new Date().toISOString().split('T')[0],
        status: 'paid',
        walletId: selectedWalletId,
        observation: `Estratégia Bola de Neve: Reinvestimento/Aporte em ${quickShareAsset.ticker || quickShareAsset.name}`,
      });
    }

    setQuickShareAsset(null);
    setSharesToAdd(1);
    setSelectedWalletId('');
  };

  const applyPresetToSimulator = (preset: typeof POPULAR_FII_PRESETS[0]) => {
    setSimTicker(preset.ticker);
    setSimName(preset.name);
    setSimSegment(preset.segment);
    setSimPrice(preset.defaultPrice);
    setSimDividend(preset.defaultYield);
  };

  const applyPresetToNewForm = async (preset: typeof POPULAR_FII_PRESETS[0]) => {
    setIsFetchingLiveQuote(true);
    let price = preset.defaultPrice;
    let div = preset.defaultYield;
    try {
      const quote = await fetchB3Quote(preset.ticker);
      if (quote && quote.price > 0) {
        price = quote.price;
        if (quote.lastDividend) div = quote.lastDividend;
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsFetchingLiveQuote(false);
    }

    setFormData({
      ticker: preset.ticker,
      name: preset.name,
      type: preset.segment.includes('Fiagro') ? 'Fiagro' : 'FIIs',
      fiiSegment: preset.segment,
      sharesCount: 10,
      sharePrice: price,
      dividendPerShare: div,
      institution: 'Corretora',
    });
    setIsAddModalOpen(true);
  };

  const handleSelectAssetFromAI = (assetData: {
    ticker: string;
    name: string;
    price: number;
    dividend: number;
    segment: string;
  }) => {
    const existing = snowballAssets.find(
      (a) => (a.ticker || a.name.split('-')[0].trim()).toUpperCase() === assetData.ticker.toUpperCase()
    );

    if (existing) {
      setQuickShareAsset(existing);
      setSharesToAdd(1);
    } else {
      setFormData({
        ticker: assetData.ticker,
        name: assetData.name,
        type: assetData.segment.toLowerCase().includes('fiagro') ? 'Fiagro' : 'FIIs',
        fiiSegment: assetData.segment,
        sharesCount: 10,
        sharePrice: assetData.price,
        dividendPerShare: assetData.dividend,
        institution: 'Corretora',
      });
      setIsAddModalOpen(true);
    }
  };

  const handleFetchTickerQuote = async (tickerToSearch: string) => {
    if (!tickerToSearch) return;
    setIsFetchingLiveQuote(true);
    try {
      const quote = await fetchB3Quote(tickerToSearch);
      if (quote) {
        setFormData((prev) => ({
          ...prev,
          ticker: quote.ticker,
          name: prev.name || quote.name,
          sharePrice: quote.price || prev.sharePrice,
          dividendPerShare: quote.lastDividend || prev.dividendPerShare,
          fiiSegment: quote.segment || prev.fiiSegment,
          type: (quote.segment || '').toLowerCase().includes('fiagro') ? 'Fiagro' : prev.type,
        }));
      }
    } catch (err) {
      console.error('Error fetching ticker:', err);
    } finally {
      setIsFetchingLiveQuote(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Concept Banner */}
      <div className="bg-gradient-to-br from-cyan-600 via-teal-700 to-indigo-800 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Snowflake className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wide">
              <Snowflake className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
              <span>Estratégia de Reinvestimento Automático</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              Bola de Neve: O Número Mágico
            </h1>
            <p className="text-sm text-cyan-100 leading-relaxed">
              Descubra exatamente quantas cotas de cada FII ou Fiagro você precisa para que os <strong>rendimentos mensais comprem novas cotas sozinhos</strong>, ativando o efeito multiplicador dos juros compostos sem precisar tirar dinheiro do bolso.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('ia')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs md:text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
              <span>IA: Top das Galáxias</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-teal-900 hover:bg-cyan-50 font-black text-xs md:text-sm shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 text-teal-700 stroke-[3]" />
              <span>Adicionar FII / Fiagro</span>
            </button>
            <button
              onClick={() => setActiveTab('simulador')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs md:text-sm backdrop-blur-md transition-all cursor-pointer"
            >
              <Calculator className="w-4 h-4 text-cyan-200" />
              <span>Simulador</span>
            </button>
          </div>
        </div>

        {/* Global Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-8 pt-6 border-t border-white/20">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <span className="text-[11px] font-bold text-cyan-200 uppercase tracking-wider block mb-1">
              Renda Passiva Mensal
            </span>
            <div className="text-lg md:text-2xl font-black text-white font-mono">
              {privacyMode
                ? '••••••'
                : globalStats.totalMonthlyIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <span className="text-[10px] text-cyan-100 opacity-90 block mt-0.5">
              Proventos dos ativos FII/Fiagro
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <span className="text-[11px] font-bold text-cyan-200 uppercase tracking-wider block mb-1">
              Cotas Recompradas / Mês
            </span>
            <div className="text-lg md:text-2xl font-black text-amber-300 font-mono flex items-center gap-1.5">
              <Zap className="w-5 h-5 text-amber-300" />
              <span>+{globalStats.totalFreeSharesMonthly} cotas</span>
            </div>
            <span className="text-[10px] text-cyan-100 opacity-90 block mt-0.5">
              Compradas 100% pelos proventos
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <span className="text-[11px] font-bold text-cyan-200 uppercase tracking-wider block mb-1">
              Bolas de Neve Ativadas
            </span>
            <div className="text-lg md:text-2xl font-black text-emerald-300 font-mono">
              {globalStats.achievedCount} / {globalStats.totalAssets}
            </div>
            <span className="text-[10px] text-cyan-100 opacity-90 block mt-0.5">
              Ativos autossuficientes
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
            <span className="text-[11px] font-bold text-cyan-200 uppercase tracking-wider block mb-1">
              Patrimônio em FIIs
            </span>
            <div className="text-lg md:text-2xl font-black text-white font-mono">
              {privacyMode
                ? '••••••'
                : globalStats.totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <span className="text-[10px] text-cyan-100 opacity-90 block mt-0.5">
              Progresso médio: {globalStats.averageProgress.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Internal Navigation Subtabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('carteira')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'carteira'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PieChartIcon className="w-4 h-4" />
          <span>Minha Carteira Bola de Neve ({snowballAssets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ia')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ia'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md'
              : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
          }`}
        >
          <Sparkles className="w-4 h-4 fill-current" />
          <span>IA: Top das Galáxias (Recomendações)</span>
        </button>

        <button
          onClick={() => setActiveTab('simulador')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'simulador'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Simulador & Calculadora</span>
        </button>

        <button
          onClick={() => setActiveTab('guia')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'guia'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Como Funciona o Número Mágico?</span>
        </button>
      </div>

      {/* TAB 1: MINHA CARTEIRA BOLA DE NEVE */}
      {activeTab === 'carteira' && (
        <div className="space-y-6">
          {snowballAssets.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 text-center border border-dashed border-slate-300 dark:border-slate-700 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 mx-auto flex items-center justify-center shadow-inner">
                <Snowflake className="w-8 h-8 animate-spin-slow" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  Nenhum FII ou Fiagro na Bola de Neve
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Cadastre seus fundos imobiliários e fiagros com preço da cota e rendimento mensal para acompanhar a barra de progresso do número mágico em tempo real!
                </p>
              </div>

              {/* Quick Presets Buttons */}
              <div className="pt-4 max-w-2xl mx-auto">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-3">
                  Adicionar com 1 Clique (Fundos Populares):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {POPULAR_FII_PRESETS.slice(0, 4).map((preset) => (
                    <button
                      key={preset.ticker}
                      onClick={() => applyPresetToNewForm(preset)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500 bg-slate-50 dark:bg-slate-900/60 text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-800 dark:text-white group-hover:text-cyan-600">
                          {preset.ticker}
                        </span>
                        <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-500" />
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">{preset.name}</span>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono block mt-1">
                        R$ {preset.defaultPrice.toFixed(2)} | Div: R$ {preset.defaultYield.toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Cadastrar Primeiro FII / Fiagro</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {snowballAssets.map((asset) => {
                const isEditing = editingAssetId === asset.id;
                const shares = asset.sharesCount || (asset.sharePrice ? Math.floor(asset.amount / asset.sharePrice) : 1);
                const price = asset.sharePrice || (shares > 0 ? asset.amount / shares : 10);
                const dividend = asset.dividendPerShare || 0.1;
                const totalVal = shares * price;
                const monthlyIncome = shares * dividend;
                const magicNumber = dividend > 0 ? Math.ceil(price / dividend) : 100;
                const isAchieved = magicNumber > 0 && shares >= magicNumber;
                const progressPct = magicNumber > 0 ? Math.min(100, (shares / magicNumber) * 100) : 0;
                const missingShares = Math.max(0, magicNumber - shares);
                const missingMoney = missingShares * price;
                const monthlyFreeShares = price > 0 ? monthlyIncome / price : 0;
                const monthlyDY = price > 0 ? (dividend / price) * 100 : 0;

                const ticker = asset.ticker || asset.name.split('-')[0].trim();

                return (
                  <div
                    key={asset.id}
                    className={`bg-white dark:bg-slate-800 rounded-3xl p-6 border shadow-sm transition-all relative overflow-hidden flex flex-col justify-between gap-5 ${
                      isAchieved
                        ? 'border-cyan-400/70 dark:border-cyan-500/50 ring-1 ring-cyan-400/30'
                        : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {/* Background Decorative Accent for Achieved Snowball */}
                    {isAchieved && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-500/10 via-teal-500/5 to-transparent rounded-bl-full pointer-events-none" />
                    )}

                    {/* Card Header */}
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-black text-sm shadow-xs ${
                              isAchieved
                                ? 'bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-cyan-500/20'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white'
                            }`}
                          >
                            {isAchieved ? <Snowflake className="w-6 h-6 animate-pulse" /> : ticker.slice(0, 4)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-black text-slate-900 dark:text-white font-mono tracking-tight">
                                {ticker}
                              </h3>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                {asset.fiiSegment || asset.type || 'FII'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                              {asset.name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                          <button
                            onClick={() => setGrowthChartAsset(asset)}
                            title="Visualizar gráfico de crescimento e efeito Bola de Neve"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/80 dark:border-cyan-800/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 hover:border-cyan-400 transition-all shadow-xs cursor-pointer"
                          >
                            <TrendingUp className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                            <span>Gráfico</span>
                          </button>
                          <button
                            onClick={() => setReevaluatingAsset(asset)}
                            title="Reavaliar tese deste ativo com IA (Segurança, Rentabilidade, Estabilidade e Gatilhos)"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 hover:border-amber-400 transition-all shadow-xs cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Reavaliar</span>
                          </button>
                          <button
                            onClick={() => startEdit(asset)}
                            title="Editar ativo"
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remover "${ticker}" da estratégia Bola de Neve?`)) {
                                onDeleteInvestment(asset.id);
                              }
                            }}
                            title="Remover ativo"
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Edit Inline Form Mode */}
                      {isEditing ? (
                        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 space-y-3 mb-3">
                          <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                            Editar Ativo & Rendimentos
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Ticker</label>
                              <input
                                type="text"
                                value={editFormData.ticker}
                                onChange={(e) => setEditFormData({ ...editFormData, ticker: e.target.value })}
                                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Segmento</label>
                              <input
                                type="text"
                                value={editFormData.fiiSegment}
                                onChange={(e) => setEditFormData({ ...editFormData, fiiSegment: e.target.value })}
                                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Qtd Cotas</label>
                              <input
                                type="number"
                                min="1"
                                value={editFormData.sharesCount}
                                onChange={(e) => setEditFormData({ ...editFormData, sharesCount: Number(e.target.value) })}
                                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Preço Cota (R$)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={editFormData.sharePrice}
                                onChange={(e) => setEditFormData({ ...editFormData, sharePrice: Number(e.target.value) })}
                                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white font-mono"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                Rendimento / Provento Médio por Cota (R$)
                              </label>
                              <input
                                type="number"
                                step="0.001"
                                min="0.001"
                                value={editFormData.dividendPerShare}
                                onChange={(e) => setEditFormData({ ...editFormData, dividendPerShare: Number(e.target.value) })}
                                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white font-mono"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingAssetId(null)}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(asset.id)}
                              className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm"
                            >
                              Salvar Alterações
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Financial Info Grid */
                        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60 mb-4">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Cotas Atuais</span>
                            <span className="text-sm font-black text-slate-800 dark:text-white font-mono">
                              {shares} cotas
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {privacyMode ? '•••' : totalVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Preço / Cota</span>
                            <span className="text-sm font-black text-slate-800 dark:text-white font-mono">
                              R$ {price.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              DY: {monthlyDY.toFixed(2)}%/mês
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">
                              Provento / Mês
                            </span>
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                              {privacyMode ? '•••' : monthlyIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              (R$ {dividend.toFixed(2)}/cota)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* --- THE PRIMORDIAL MAGIC NUMBER PROGRESS BAR --- */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-700 dark:text-slate-200">
                              Progresso do Número Mágico:
                            </span>
                            <span className="font-mono font-black text-cyan-600 dark:text-cyan-400">
                              {shares} / {magicNumber} cotas
                            </span>
                          </div>
                          <span className="font-black font-mono text-xs px-2 py-0.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60">
                            {progressPct.toFixed(1)}%
                          </span>
                        </div>

                        {/* Visual Progress Bar Container */}
                        <div className="w-full bg-slate-100 dark:bg-slate-700/80 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-600/80 shadow-inner relative">
                          <div
                            className={`h-full rounded-full transition-all duration-700 relative ${
                              isAchieved
                                ? 'bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400 shadow-sm'
                                : 'bg-gradient-to-r from-cyan-600 to-indigo-600'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          >
                            {/* Animated subtle shimmer */}
                            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                          </div>
                        </div>

                        {/* Dynamic Status / Motivation Badge */}
                        <div
                          className={`p-3 rounded-2xl text-xs flex items-center justify-between gap-2 ${
                            isAchieved
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-cyan-50/70 dark:bg-cyan-950/30 text-cyan-900 dark:text-cyan-200 border border-cyan-100 dark:border-cyan-900/40'
                          }`}
                        >
                          {isAchieved ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-black block">❄️ Bola de Neve Ativada!</span>
                                <span className="text-[11px] opacity-90 block">
                                  Seus proventos compram <strong>+{monthlyFreeShares.toFixed(1)} novas cotas</strong> todo mês sem dinheiro novo.
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Target className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="font-bold block">
                                  Faltam <strong className="text-cyan-700 dark:text-cyan-300 font-mono">{missingShares} cotas</strong> ({missingMoney.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                                </span>
                                <span className="text-[11px] opacity-80 block">
                                  Meta: <strong>{magicNumber} cotas</strong> (R$ {(magicNumber * price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) para a 1ª auto-recompra.
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Share Increment Action Bar */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Aporte Rápido:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {[1, 5, 10].map((qty) => (
                          <button
                            key={qty}
                            onClick={() => {
                              setQuickShareAsset(asset);
                              setSharesToAdd(qty);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-cyan-600 hover:text-white dark:hover:bg-cyan-600 transition-all font-mono cursor-pointer"
                          >
                            +{qty} cota{qty > 1 ? 's' : ''}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            setQuickShareAsset(asset);
                            setSharesToAdd(1);
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Aportar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB IA: RECOMENDAÇÕES TOP DAS GALÁXIAS */}
      {activeTab === 'ia' && (
        <SnowballAIAdvisor
          currentAssets={snowballAssets}
          onSelectAssetToInvest={handleSelectAssetFromAI}
          monthlySavingsEstimated={300}
        />
      )}

      {/* TAB 2: SIMULADOR INTERATIVO */}
      {activeTab === 'simulador' && (
        <div className="space-y-6 animate-fade-in">
          {/* Preset Buttons */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                  Simulação Rápida com FIIs do Mercado Brasileiro
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Clique em um dos ativos abaixo para preencher os valores médios de cotação e dividendo automaticamente:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {POPULAR_FII_PRESETS.map((preset) => {
                const isSelected = simTicker === preset.ticker;
                return (
                  <button
                    key={preset.ticker}
                    onClick={() => applyPresetToSimulator(preset)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-50/80 dark:bg-cyan-950/40 shadow-xs ring-1 ring-cyan-500'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {preset.ticker}
                      </span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {preset.category}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">{preset.name}</span>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] font-mono font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">Cota: R$ {preset.defaultPrice.toFixed(2)}</span>
                      <span className="text-emerald-600 dark:text-emerald-400">Div: R$ {preset.defaultYield.toFixed(2)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simulator Calculator Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Parameters Box */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                <Calculator className="w-5 h-5 text-cyan-600" />
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  Parâmetros de Simulação
                </h3>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Ticker / Código
                    </label>
                    <input
                      type="text"
                      value={simTicker}
                      onChange={(e) => setSimTicker(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Segmento
                    </label>
                    <input
                      type="text"
                      value={simSegment}
                      onChange={(e) => setSimSegment(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Preço de 1 Cota (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={simPrice}
                    onChange={(e) => setSimPrice(Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Rendimento Mensal / Dividendo por Cota (R$)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={simDividend}
                    onChange={(e) => setSimDividend(Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500 text-emerald-600 dark:text-emerald-400"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Dividend Yield mensal: {simPrice > 0 ? ((simDividend / simPrice) * 100).toFixed(2) : 0}% / mês (
                    {simPrice > 0 ? (((simDividend / simPrice) * 100) * 12).toFixed(2) : 0}% a.a.)
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Cotas que Você Já Possui Hoje
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={simCurrentShares}
                      onChange={(e) => setSimCurrentShares(Number(e.target.value))}
                      className="flex-1 px-3 py-2.5 text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <span className="text-xs text-slate-500 font-bold">cotas</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Aporte Mensal Previsto (em cotas novas)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={simMonthlyContributionShares}
                      onChange={(e) => setSimMonthlyContributionShares(Number(e.target.value))}
                      className="flex-1 px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <span className="text-xs text-slate-500 font-bold">cotas/mês</span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Equivale a um aporte de {(simMonthlyContributionShares * simPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setFormData({
                        ticker: simTicker,
                        name: `${simTicker} - ${simName}`,
                        type: simSegment.includes('Fiagro') ? 'Fiagro' : 'FIIs',
                        fiiSegment: simSegment,
                        sharesCount: simCurrentShares || 1,
                        sharePrice: simPrice,
                        dividendPerShare: simDividend,
                        institution: 'Corretora',
                      });
                      setIsAddModalOpen(true);
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-700 hover:from-cyan-700 hover:to-teal-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Adicionar {simTicker} à Minha Carteira</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Results & Magic Number Display */}
            <div className="lg:col-span-7 space-y-6">
              {/* Highlight Hero Card */}
              <div className="bg-gradient-to-br from-slate-900 to-cyan-950 text-white rounded-3xl p-6 md:p-8 border border-cyan-500/30 shadow-xl space-y-5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      Resultado do Número Mágico
                    </span>
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                      {simTicker}
                    </span>
                  </div>
                  <Snowflake className="w-6 h-6 text-cyan-400 animate-pulse" />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div>
                    <span className="text-xs text-slate-300 block">Número Mágico de Cotas:</span>
                    <div className="text-4xl md:text-5xl font-black font-mono text-cyan-300 tracking-tight">
                      {simMagicNumber}{' '}
                      <span className="text-base font-bold text-slate-300">cotas</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-300 block">Investimento Total para Ativar:</span>
                    <div className="text-2xl font-black font-mono text-emerald-400">
                      {simCostToMagicNumber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                </div>

                {/* Progress in simulator */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>
                      Progresso Atual ({simCurrentShares} / {simMagicNumber} cotas):
                    </span>
                    <span className="font-mono font-bold text-cyan-300">
                      {simCurrentProgress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all"
                      style={{ width: `${simCurrentProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    {simCurrentShares >= simMagicNumber ? (
                      <span className="text-emerald-400 font-bold">
                        🎉 Bola de Neve Ativada! Gera {simFreeSharesPerMonth.toFixed(1)} cotas todo mês!
                      </span>
                    ) : (
                      <span>
                        Faltam <strong className="text-white">{simMissingShares} cotas</strong> (
                        {simMissingMoney.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                      </span>
                    )}
                    <span>Renda Atual: {simCurrentMonthlyIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês</span>
                  </div>
                </div>
              </div>

              {/* Exponential Projections Table */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                      Projeção da Bola de Neve no Tempo (Reinvestindo 100% dos Proventos)
                    </h4>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-2 px-3">Prazo</th>
                        <th className="py-2 px-3">Total de Cotas</th>
                        <th className="py-2 px-3">Patrimônio</th>
                        <th className="py-2 px-3">Renda / Mês</th>
                        <th className="py-2 px-3">Cotas Grátis / Mês</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono">
                      {projectionTable.map((row) => (
                        <tr key={row.months} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                          <td className="py-2.5 px-3 font-sans font-bold text-slate-700 dark:text-slate-200">
                            {row.months} meses ({row.years} anos)
                          </td>
                          <td className="py-2.5 px-3 font-bold text-cyan-600 dark:text-cyan-400">
                            {row.shares} cotas
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 dark:text-white">
                            {row.equity.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                            {row.monthlyYield.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-amber-500">
                            +{row.freeShares} cotas/mês
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GUIA DIDÁTICO */}
      {activeTab === 'guia' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Snowflake className="w-6 h-6 text-cyan-600" />
              O Que É e Como Funciona a Estratégia Bola de Neve?
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              A estratégia da <strong>Bola de Neve</strong> (também conhecida pelo conceito do <em>Número Mágico</em>) é o método definitivo para alcançar a independência financeira com Fundos Imobiliários (FIIs) e Fiagros.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-100 dark:border-cyan-900/40 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Fase 1: O Aporte Ativo</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Você aporta mensalmente com a sua renda do trabalho para acumular as primeiras cotas do fundo.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/40 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Fase 2: O Número Mágico</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Você atinge o marco onde o dividendo mensal pago pelo fundo é igual ou maior que o valor de 1 cota.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Fase 3: A Auto-Recompra</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Todo mês cai rendimento suficiente para comprar +1 cota (depois +2, +3...), acelerando sem esforço seu patrimônio!
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-2">
            <h4 className="text-sm font-bold text-cyan-300 font-mono">Fórmula Matemática Simples:</h4>
            <div className="p-3 rounded-xl bg-slate-800 font-mono text-xs md:text-sm text-emerald-300">
              Número Mágico = Preço da Cota ÷ Rendimento Médio por Cota
            </div>
            <p className="text-xs text-slate-400">
              Exemplo: Cota a R$ 10,00 rendendo R$ 0,10 por mês → 10,00 ÷ 0,10 = <strong>100 cotas</strong>.
            </p>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW FII / FIAGRO */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">
                  <Snowflake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Novo Ativo na Bola de Neve
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cadastre FIIs, Fiagros ou Ações de Dividendos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Ticker / Código *
                    </label>
                    {formData.ticker && (
                      <button
                        type="button"
                        onClick={() => handleFetchTickerQuote(formData.ticker)}
                        disabled={isFetchingLiveQuote}
                        className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Zap className={`w-3 h-3 ${isFetchingLiveQuote ? 'animate-spin' : ''}`} />
                        <span>Puxar B3</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MXRF11, VGIA11"
                    value={formData.ticker}
                    onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                    onBlur={() => {
                      if (formData.ticker && formData.ticker.length >= 5) {
                        handleFetchTickerQuote(formData.ticker);
                      }
                    }}
                    className="w-full px-3 py-2.5 text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Tipo / Categoria
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="FIIs">FII (Fundo Imobiliário)</option>
                    <option value="Fiagro">Fiagro (Agronegócio)</option>
                    <option value="Ações">Ações (Dividendos)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Nome do Fundo / Descrição
                </label>
                <input
                  type="text"
                  placeholder="Ex: Maxi Renda FII Papel"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Segmento
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Papel, Tijolo, Fiagro"
                    value={formData.fiiSegment}
                    onChange={(e) => setFormData({ ...formData, fiiSegment: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Corretora / Banco
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: NuInvest, XP, Rico"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-cyan-50/60 dark:bg-cyan-950/30 rounded-2xl border border-cyan-100 dark:border-cyan-900/40">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Cotas Atuais
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.sharesCount}
                    onChange={(e) => setFormData({ ...formData, sharesCount: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Preço Cota (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.sharePrice}
                    onChange={(e) => setFormData({ ...formData, sharePrice: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Div/Cota (R$)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    required
                    value={formData.dividendPerShare}
                    onChange={(e) => setFormData({ ...formData, dividendPerShare: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500 text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              {/* Instant calculation preview in modal */}
              {(() => {
                const p = Number(formData.sharePrice) || 0;
                const d = Number(formData.dividendPerShare) || 0;
                const q = Number(formData.sharesCount) || 0;
                const nm = d > 0 ? Math.ceil(p / d) : 0;
                const cost = nm * p;
                const progress = nm > 0 ? Math.min(100, (q / nm) * 100) : 0;

                if (!nm) return null;

                return (
                  <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">Número Mágico Calculado:</span>
                      <span className="font-mono font-black text-cyan-300 text-sm">{nm} cotas</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Investimento para autossuficiência:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Progresso inicial:</span>
                      <span className="font-mono font-bold text-white">{progress.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Salvar na Bola de Neve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUICK SHARE INCREMENT (Aporte / Reinvestimento) */}
      {quickShareAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Aportar / Reinvestir Cotas
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {quickShareAsset.ticker || quickShareAsset.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickShareAsset(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Quantidade de Novas Cotas a Adicionar:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={sharesToAdd}
                    onChange={(e) => setSharesToAdd(Math.max(1, Number(e.target.value)))}
                    className="flex-1 px-3 py-2.5 text-base font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <div className="flex gap-1">
                    {[1, 5, 10, 20].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setSharesToAdd(v)}
                        className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-cyan-600 hover:text-white transition-colors"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total Calculation */}
              {(() => {
                const price = quickShareAsset.sharePrice || 10;
                const cost = sharesToAdd * price;
                const currShares = quickShareAsset.sharesCount || 0;
                const afterShares = currShares + sharesToAdd;
                const magicNum = quickShareAsset.magicNumberTarget || 100;
                const afterProgress = Math.min(100, (afterShares / magicNum) * 100);

                return (
                  <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-100 dark:border-cyan-900/40 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Valor Total do Aporte:</span>
                      <span className="font-mono font-bold text-cyan-900 dark:text-cyan-200 text-sm">
                        {cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-slate-400">Novo saldo de cotas:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {currShares} → <strong className="text-cyan-600 dark:text-cyan-400">{afterShares} cotas</strong>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-slate-400">Novo progresso do Número Mágico:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {afterProgress.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Optional Wallet debit */}
              {wallets.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Debitar de uma Carteira/Banco (Opcional):
                  </label>
                  <select
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="">Não registrar saída de caixa</option>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} (Saldo: {w.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickShareAsset(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleQuickAddShares}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Confirmar Aporte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AI ASSET REEVALUATION (Seguro, Rentável, Estável, Valuation, Gatilhos) */}
      {reevaluatingAsset && (
        <SnowballAssetReevaluationModal
          asset={reevaluatingAsset}
          isOpen={!!reevaluatingAsset}
          onClose={() => setReevaluatingAsset(null)}
          onQuickAddShares={(assetToAport, qty) => {
            setQuickShareAsset(assetToAport);
            setSharesToAdd(qty);
          }}
          onUpdateAssetQuote={handleUpdateAssetQuote}
        />
      )}

      {/* MODAL: SNOWBALL GROWTH CHART */}
      {growthChartAsset && (
        <SnowballGrowthChartModal
          asset={growthChartAsset}
          isOpen={!!growthChartAsset}
          onClose={() => setGrowthChartAsset(null)}
          onQuickAddShares={(assetToAport, qty) => {
            setQuickShareAsset(assetToAport);
            setSharesToAdd(qty);
          }}
        />
      )}
    </div>
  );
};
