import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Snowflake,
  DollarSign,
  Calendar,
  X,
  Target,
  Sparkles,
  ArrowUpRight,
  Layers,
  Repeat,
  Zap,
  Award,
  Plus,
  BarChart2,
  Sliders
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { Investment } from '../types';

interface SnowballGrowthChartModalProps {
  asset: Investment;
  isOpen: boolean;
  onClose: () => void;
  onQuickAddShares?: (asset: Investment, sharesToAdd: number) => void;
}

export const SnowballGrowthChartModal: React.FC<SnowballGrowthChartModalProps> = ({
  asset,
  isOpen,
  onClose,
  onQuickAddShares
}) => {
  const ticker = (asset.ticker || asset.name || '').toUpperCase().trim();
  const currentShares = asset.sharesCount || (asset.sharePrice ? Math.floor(asset.amount / asset.sharePrice) : 1);
  const sharePrice = asset.sharePrice || 10;
  const dividendPerShare = asset.dividendPerShare || 0.09;

  // State controls
  const [yearsHorizon, setYearsHorizon] = useState<number>(5); // 1, 2, 3, 5, 10, 15, 20
  const [monthlyContributionShares, setMonthlyContributionShares] = useState<number>(2);
  const [reinvestDividends, setReinvestDividends] = useState<boolean>(true);
  const [activeChartTab, setActiveChartTab] = useState<'equity' | 'income' | 'shares'>('equity');

  const monthlyDY = sharePrice > 0 ? (dividendPerShare / sharePrice) * 100 : 0;
  const magicNumber = dividendPerShare > 0 ? Math.ceil(sharePrice / dividendPerShare) : 100;

  // Calculate monthly step simulation
  const simulationData = useMemo(() => {
    const totalMonths = yearsHorizon * 12;
    const data = [];

    let totalSharesSnowball = currentShares;
    let accumulatedCashFraction = 0;
    let totalInvestedFromPocket = currentShares * sharePrice;
    let totalDividendsReceived = 0;

    // Baseline without reinvestment (just monthly contribution from pocket)
    let totalSharesNoReinvest = currentShares;
    let totalDividendsNoReinvest = 0;

    // Milestones tracking
    let monthReachedMagicNumber: number | null = currentShares >= magicNumber ? 0 : null;
    let monthReached2xMagic: number | null = currentShares >= magicNumber * 2 ? 0 : null;
    let monthReached5xMagic: number | null = currentShares >= magicNumber * 5 ? 0 : null;
    let monthReached10xMagic: number | null = currentShares >= magicNumber * 10 ? 0 : null;

    // Initial point
    data.push({
      month: 0,
      label: 'Hoje',
      year: 0,
      sharesWithReinvest: Math.round(totalSharesSnowball),
      sharesNoReinvest: Math.round(totalSharesNoReinvest),
      equityWithReinvest: Math.round(totalSharesSnowball * sharePrice),
      equityNoReinvest: Math.round(totalSharesNoReinvest * sharePrice),
      investedFromPocket: Math.round(totalInvestedFromPocket),
      snowballGain: 0,
      monthlyIncome: Number((totalSharesSnowball * dividendPerShare).toFixed(2)),
      monthlyIncomeNoReinvest: Number((totalSharesNoReinvest * dividendPerShare).toFixed(2)),
      freeSharesPerMonth: Number((totalSharesSnowball / magicNumber).toFixed(1)),
      cumulativeDividends: 0
    });

    for (let m = 1; m <= totalMonths; m++) {
      // 1. Receive dividends from current shares
      const monthlyDividendPayment = totalSharesSnowball * dividendPerShare;
      totalDividendsReceived += monthlyDividendPayment;

      // 2. Add monthly active contribution from pocket
      totalSharesSnowball += monthlyContributionShares;
      totalInvestedFromPocket += monthlyContributionShares * sharePrice;

      // 3. Reinvestment mechanism
      if (reinvestDividends) {
        accumulatedCashFraction += monthlyDividendPayment;
        const newSharesFromDividends = Math.floor(accumulatedCashFraction / sharePrice);
        totalSharesSnowball += newSharesFromDividends;
        accumulatedCashFraction -= newSharesFromDividends * sharePrice;
      }

      // No reinvestment branch
      totalSharesNoReinvest += monthlyContributionShares;
      totalDividendsNoReinvest += totalSharesNoReinvest * dividendPerShare;

      // Track milestones
      if (monthReachedMagicNumber === null && totalSharesSnowball >= magicNumber) {
        monthReachedMagicNumber = m;
      }
      if (monthReached2xMagic === null && totalSharesSnowball >= magicNumber * 2) {
        monthReached2xMagic = m;
      }
      if (monthReached5xMagic === null && totalSharesSnowball >= magicNumber * 5) {
        monthReached5xMagic = m;
      }
      if (monthReached10xMagic === null && totalSharesSnowball >= magicNumber * 10) {
        monthReached10xMagic = m;
      }

      // Push key intervals or all months
      const isKeyInterval =
        totalMonths <= 36
          ? m % 3 === 0 || m === totalMonths
          : totalMonths <= 60
          ? m % 6 === 0 || m === totalMonths
          : m % 12 === 0 || m === totalMonths;

      if (isKeyInterval) {
        const equity = Math.round(totalSharesSnowball * sharePrice);
        const equityNoReinvest = Math.round(totalSharesNoReinvest * sharePrice);
        const snowballGain = Math.max(0, equity - totalInvestedFromPocket);

        const yr = (m / 12).toFixed(m % 12 === 0 ? 0 : 1);
        data.push({
          month: m,
          label: m % 12 === 0 ? `${m / 12} ano${m / 12 > 1 ? 's' : ''}` : `Mês ${m}`,
          year: Number(yr),
          sharesWithReinvest: Math.round(totalSharesSnowball),
          sharesNoReinvest: Math.round(totalSharesNoReinvest),
          equityWithReinvest: equity,
          equityNoReinvest: equityNoReinvest,
          investedFromPocket: Math.round(totalInvestedFromPocket),
          snowballGain: snowballGain,
          monthlyIncome: Number((totalSharesSnowball * dividendPerShare).toFixed(2)),
          monthlyIncomeNoReinvest: Number((totalSharesNoReinvest * dividendPerShare).toFixed(2)),
          freeSharesPerMonth: Number((totalSharesSnowball / magicNumber).toFixed(1)),
          cumulativeDividends: Math.round(totalDividendsReceived)
        });
      }
    }

    const lastPoint = data[data.length - 1];

    return {
      chartPoints: data,
      finalEquity: lastPoint.equityWithReinvest,
      finalMonthlyIncome: lastPoint.monthlyIncome,
      finalShares: lastPoint.sharesWithReinvest,
      finalFreeShares: lastPoint.freeSharesPerMonth,
      totalInvestedFromPocket: lastPoint.investedFromPocket,
      totalDividendsReceived: lastPoint.cumulativeDividends,
      snowballGain: lastPoint.snowballGain,
      multiplier:
        lastPoint.investedFromPocket > 0
          ? (lastPoint.equityWithReinvest / lastPoint.investedFromPocket).toFixed(2)
          : '1.0',
      milestones: {
        magic1x: monthReachedMagicNumber,
        magic2x: monthReached2xMagic,
        magic5x: monthReached5xMagic,
        magic10x: monthReached10xMagic
      }
    };
  }, [currentShares, sharePrice, dividendPerShare, yearsHorizon, monthlyContributionShares, reinvestDividends, magicNumber]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
      id="snowball-growth-chart-modal"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 p-5 sm:p-6 text-white border-b border-cyan-500/20 relative shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center font-mono font-black text-cyan-300 text-lg shadow-inner">
                {ticker.slice(0, 4)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white flex items-center gap-2">
                    {ticker}
                    <span className="text-xs font-bold font-sans px-2.5 py-0.5 rounded-full bg-cyan-500/30 border border-cyan-400/40 text-cyan-200">
                      Curva de Crescimento Bola de Neve
                    </span>
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-cyan-200/80 mt-0.5">
                  Projeção exponencial com reinvestimento automático de dividendos
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              title="Fechar janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-cyan-500/20">
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block">
                Posição Atual
              </span>
              <span className="text-sm font-black font-mono text-white">
                {currentShares} cotas{' '}
                <span className="text-[10px] text-slate-300 font-sans">
                  (R$ {(currentShares * sharePrice).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })})
                </span>
              </span>
            </div>

            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block">
                Dividendo / Cota
              </span>
              <span className="text-sm font-black font-mono text-emerald-400">
                R$ {dividendPerShare.toFixed(2)}{' '}
                <span className="text-[10px] text-emerald-300 font-sans">
                  ({monthlyDY.toFixed(2)}%/mês)
                </span>
              </span>
            </div>

            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block">
                Número Mágico
              </span>
              <span className="text-sm font-black font-mono text-amber-300">
                {magicNumber} cotas
              </span>
            </div>

            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block">
                Auto-Recompra Atual
              </span>
              <span className="text-sm font-black font-mono text-cyan-300">
                {(currentShares / magicNumber).toFixed(1)} cota(s)/mês
              </span>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* SIMULATOR CONTROLS BAR */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  Parâmetros de Simulação do Gráfico
                </span>
              </div>

              {/* Reinvest Toggle */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={reinvestDividends}
                    onChange={(e) => setReinvestDividends(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                  />
                  <span>Reinvestir 100% dos Proventos (Bola de Neve)</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Horizon Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
                  Horizonte de Tempo:
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1, 2, 3, 5, 10, 15, 20].map((yr) => (
                    <button
                      key={yr}
                      onClick={() => setYearsHorizon(yr)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        yearsHorizon === yr
                          ? 'bg-cyan-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {yr} {yr === 1 ? 'ano' : 'anos'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Monthly Contribution in Shares */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Aporte Mensal Ativo:
                  </label>
                  <span className="text-[11px] font-bold font-mono text-cyan-600 dark:text-cyan-400">
                    {(monthlyContributionShares * sharePrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={monthlyContributionShares}
                    onChange={(e) => setMonthlyContributionShares(Math.max(0, Number(e.target.value)))}
                    className="w-24 px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">cotas/mês</span>
                  
                  <div className="flex items-center gap-1 ml-auto">
                    {[0, 1, 2, 5, 10].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setMonthlyContributionShares(preset)}
                        className={`px-1.5 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                          monthlyContributionShares === preset
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                        }`}
                      >
                        +{preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart Mode Selector */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
                  Métrica em Exibição no Gráfico:
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-200/80 dark:bg-slate-900 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveChartTab('equity')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                      activeChartTab === 'equity'
                        ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Patrimônio
                  </button>
                  <button
                    onClick={() => setActiveChartTab('income')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                      activeChartTab === 'income'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Renda/Mês
                  </button>
                  <button
                    onClick={() => setActiveChartTab('shares')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                      activeChartTab === 'shares'
                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Qtd Cotas
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN INTERACTIVE RECHARTS GRAPH */}
          <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {activeChartTab === 'equity' && 'Evolução Patrimonial: Total Acumulado vs Aportes do Bolso'}
                  {activeChartTab === 'income' && 'Crescimento da Renda Mensal Passiva no Tempo (R$/mês)'}
                  {activeChartTab === 'shares' && 'Crescimento Acelerado do Total de Cotas em Carteira'}
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                Projeção de {yearsHorizon} {yearsHorizon === 1 ? 'ano' : 'anos'} ({yearsHorizon * 12} meses)
              </span>
            </div>

            <div className="h-72 sm:h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {activeChartTab === 'equity' ? (
                  <ComposedChart data={simulationData.chartPoints} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="snowballGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="pocketGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5">
                              <span className="font-bold text-cyan-300 block border-b border-slate-800 pb-1">
                                {label} ({data.month} meses)
                              </span>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Patrimônio com Bola de Neve:</span>
                                <span className="font-mono font-bold text-cyan-300">
                                  {data.equityWithReinvest.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Aportado do Seu Bolso:</span>
                                <span className="font-mono font-bold text-slate-300">
                                  {data.investedFromPocket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4 pt-1 border-t border-slate-800">
                                <span className="text-emerald-400 font-bold">Ganho da Bola de Neve:</span>
                                <span className="font-mono font-bold text-emerald-400">
                                  +{data.snowballGain.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-amber-400">Renda Mensal na data:</span>
                                <span className="font-mono font-bold text-amber-300">
                                  R$ {data.monthlyIncome.toFixed(2)}/mês
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(val) => <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{val}</span>}
                    />
                    <Area
                      type="monotone"
                      dataKey="equityWithReinvest"
                      name="Patrimônio Total (Bola de Neve)"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      fill="url(#snowballGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="investedFromPocket"
                      name="Capital Aportado do Bolso"
                      stroke="#64748b"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fill="url(#pocketGrad)"
                    />
                  </ComposedChart>
                ) : activeChartTab === 'income' ? (
                  <ComposedChart data={simulationData.chartPoints} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickFormatter={(val) => `R$ ${val}`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1">
                              <span className="font-bold text-emerald-300 block border-b border-slate-800 pb-1">
                                {label} ({data.month} meses)
                              </span>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Renda Mensal:</span>
                                <span className="font-mono font-bold text-emerald-400">
                                  R$ {data.monthlyIncome.toFixed(2)} / mês
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Cotas Grátis Geradas:</span>
                                <span className="font-mono font-bold text-amber-300">
                                  +{data.freeSharesPerMonth} cotas todo mês
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(val) => <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{val}</span>}
                    />
                    <Area
                      type="monotone"
                      dataKey="monthlyIncome"
                      name="Renda Mensal com Reinvestimento (R$/mês)"
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="url(#incomeGrad)"
                    />
                    <Line
                      type="monotone"
                      dataKey="monthlyIncomeNoReinvest"
                      name="Renda Sem Reinvestir (apenas novos aportes)"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                  </ComposedChart>
                ) : (
                  <ComposedChart data={simulationData.chartPoints} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickFormatter={(val) => `${val} un`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1">
                              <span className="font-bold text-cyan-300 block border-b border-slate-800 pb-1">
                                {label} ({data.month} meses)
                              </span>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Total de Cotas:</span>
                                <span className="font-mono font-bold text-cyan-300">
                                  {data.sharesWithReinvest} cotas
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Cotas Sem Reinvestir:</span>
                                <span className="font-mono font-bold text-slate-400">
                                  {data.sharesNoReinvest} cotas
                                </span>
                              </div>
                              <div className="flex justify-between gap-4 pt-1 border-t border-slate-800">
                                <span className="text-amber-400 font-bold">Cotas Grátis/mês:</span>
                                <span className="font-mono font-bold text-amber-300">
                                  +{data.freeSharesPerMonth} cotas/mês
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(val) => <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{val}</span>}
                    />
                    <Bar
                      dataKey="sharesWithReinvest"
                      name="Total de Cotas Acumuladas"
                      fill="#06b6d4"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      type="monotone"
                      dataKey="sharesNoReinvest"
                      name="Cotas Apenas por Aporte do Bolso"
                      stroke="#f59e0b"
                      strokeWidth={2}
                    />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* IMPACT CARDS SUMMARY */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300 block">
                Patrimônio em {yearsHorizon} Anos
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-cyan-950 dark:text-white">
                {simulationData.finalEquity.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Multiplicador de <strong className="text-cyan-600 dark:text-cyan-400">{simulationData.multiplier}x</strong> sobre seu dinheiro aportado.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                Renda Mensal Passiva Futura
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                R$ {simulationData.finalMonthlyIncome.toFixed(2)}{' '}
                <span className="text-xs font-sans text-slate-500">/mês</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Gerando <strong className="text-emerald-500">+{simulationData.finalFreeShares} cotas grátis</strong> todo mês sem dinheiro novo.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
                Ganho Extra da Bola de Neve
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                +{simulationData.snowballGain.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Renda acumulada dos juros compostos que reinvestiram por você.
              </p>
            </div>
          </div>

          {/* TIMELINE MILESTONES (MARCOS DA BOLA DE NEVE) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs sm:text-sm font-bold">
                Linha do Tempo dos Marcos do Número Mágico
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Marco 1x */}
              <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-amber-300">1ª Cota Grátis/mês</span>
                  <span className="font-mono text-slate-400">({magicNumber} cotas)</span>
                </div>
                <div className="text-sm font-black font-mono text-white">
                  {simulationData.milestones.magic1x === 0
                    ? '🎉 Já Atingido!'
                    : simulationData.milestones.magic1x !== null
                    ? `Em ${simulationData.milestones.magic1x} meses (${(simulationData.milestones.magic1x / 12).toFixed(1)} anos)`
                    : 'Aumente o aporte'}
                </div>
              </div>

              {/* Marco 2x */}
              <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-cyan-300">2 Cotas Grátis/mês</span>
                  <span className="font-mono text-slate-400">({magicNumber * 2} cotas)</span>
                </div>
                <div className="text-sm font-black font-mono text-white">
                  {simulationData.milestones.magic2x === 0
                    ? '🎉 Já Atingido!'
                    : simulationData.milestones.magic2x !== null
                    ? `Em ${simulationData.milestones.magic2x} meses (${(simulationData.milestones.magic2x / 12).toFixed(1)} anos)`
                    : 'Após o horizonte'}
                </div>
              </div>

              {/* Marco 5x */}
              <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-300">5 Cotas Grátis/mês</span>
                  <span className="font-mono text-slate-400">({magicNumber * 5} cotas)</span>
                </div>
                <div className="text-sm font-black font-mono text-white">
                  {simulationData.milestones.magic5x === 0
                    ? '🎉 Já Atingido!'
                    : simulationData.milestones.magic5x !== null
                    ? `Em ${simulationData.milestones.magic5x} meses (${(simulationData.milestones.magic5x / 12).toFixed(1)} anos)`
                    : 'Após o horizonte'}
                </div>
              </div>

              {/* Marco 10x */}
              <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-purple-300">10 Cotas Grátis/mês</span>
                  <span className="font-mono text-slate-400">({magicNumber * 10} cotas)</span>
                </div>
                <div className="text-sm font-black font-mono text-white">
                  {simulationData.milestones.magic10x === 0
                    ? '🎉 Já Atingido!'
                    : simulationData.milestones.magic10x !== null
                    ? `Em ${simulationData.milestones.magic10x} meses (${(simulationData.milestones.magic10x / 12).toFixed(1)} anos)`
                    : 'Após o horizonte'}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {onQuickAddShares && (
              <button
                onClick={() => {
                  onQuickAddShares(asset, 1);
                }}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Aportar +1 Cota em {ticker}</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
