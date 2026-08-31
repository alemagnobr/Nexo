import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Award,
  CheckCircle2,
  X,
  Plus,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { StockAsset, StockContribution, StockSemaphore } from '../types';
import { toast } from 'sonner';

interface StockContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock?: StockAsset | null; // If single stock
  top5Stocks?: StockAsset[]; // If basket / distribution
  mode?: 'single' | 'top5_basket';
  defaultAporteAmount?: number;
  onConfirmContribution: (contributions: Omit<StockContribution, 'id'>[]) => void;
}

export const StockContributionModal: React.FC<StockContributionModalProps> = ({
  isOpen,
  onClose,
  stock,
  top5Stocks = [],
  mode: initialMode = 'single',
  defaultAporteAmount = 1000,
  onConfirmContribution,
}) => {
  const [mode, setMode] = useState<'single' | 'top5_basket'>(initialMode);
  const [selectedStock, setSelectedStock] = useState<StockAsset | null>(stock || null);
  const [totalAporte, setTotalAporte] = useState<number>(defaultAporteAmount || 1000);
  const [sharesCount, setSharesCount] = useState<number>(1);
  const [price, setPrice] = useState<number>(stock?.currentPrice || 10);
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  // Top 5 Basket state with customizable weight percentages
  const [basketWeights, setBasketWeights] = useState<Record<string, number>>({
    0: 35, // Top 1: 35%
    1: 25, // Top 2: 25%
    2: 15, // Top 3: 15%
    3: 15, // Top 4: 15%
    4: 10, // Top 5: 10%
  });

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (stock) {
      setSelectedStock(stock);
      setPrice(stock.currentPrice);
      const calculatedShares = Math.max(1, Math.floor((defaultAporteAmount || 1000) / (stock.currentPrice || 1)));
      setSharesCount(calculatedShares);
    }
  }, [stock, defaultAporteAmount, isOpen]);

  if (!isOpen) return null;

  const currentTotalCost = Number((sharesCount * price).toFixed(2));
  const remainingCash = Math.max(0, Number((totalAporte - currentTotalCost).toFixed(2)));

  const handleStockChange = (newStock: StockAsset) => {
    setSelectedStock(newStock);
    setPrice(newStock.currentPrice);
    const calculatedShares = Math.max(1, Math.floor(totalAporte / (newStock.currentPrice || 1)));
    setSharesCount(calculatedShares);
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;
    if (sharesCount <= 0) {
      toast.error('A quantidade de ações deve ser no mínimo 1.');
      return;
    }

    const payload: Omit<StockContribution, 'id'> = {
      date,
      ticker: selectedStock.ticker,
      sharesCount,
      pricePurchased: price,
      totalAmount: currentTotalCost,
      growthScoreAtPurchase: selectedStock.growthScore,
      semaphoreAtPurchase: selectedStock.semaphore,
      notes: notes || `Aporte no Motor de Crescimento (${selectedStock.ticker}).`,
    };

    onConfirmContribution([payload]);
    toast.success(`Aporte de ${sharesCount} ações de ${selectedStock.ticker} (R$ ${currentTotalCost.toFixed(2)}) registrado!`);
    onClose();
  };

  const handleBasketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!top5Stocks || top5Stocks.length === 0) return;

    const basketItems: Omit<StockContribution, 'id'>[] = [];
    let registeredCount = 0;

    top5Stocks.slice(0, 5).forEach((item, index) => {
      const weight = basketWeights[index] || 20;
      const allocatedBudget = (totalAporte * weight) / 100;
      const shares = Math.floor(allocatedBudget / (item.currentPrice || 1));
      
      if (shares > 0) {
        const itemCost = Number((shares * item.currentPrice).toFixed(2));
        basketItems.push({
          date,
          ticker: item.ticker,
          sharesCount: shares,
          pricePurchased: item.currentPrice,
          totalAmount: itemCost,
          growthScoreAtPurchase: item.growthScore,
          semaphoreAtPurchase: item.semaphore,
          notes: `Cesta TOP 5 Motor de Crescimento (Peso ${weight}% - Rank #${index + 1}).`,
        });
        registeredCount++;
      }
    });

    if (basketItems.length === 0) {
      toast.error('O valor do aporte informado é insuficiente para comprar pelo menos 1 ação da cesta.');
      return;
    }

    onConfirmContribution(basketItems);
    toast.success(`Cesta TOP 5 registrada com sucesso (${registeredCount} ativos adicionados)!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto animate-scale-up">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Registro de Aporte
              </span>
              <h2 className="text-xl font-black text-white">
                {mode === 'single' ? `Registrar Aporte: ${selectedStock?.ticker || 'Ação'}` : 'Registrar Cesta TOP 5'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'single'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Aporte Individual (Top 1 ou Específico)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('top5_basket')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'top5_basket'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Cesta Distribuída TOP 5</span>
          </button>
        </div>

        {/* Form Body */}
        {mode === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="p-6 space-y-5">
            {/* Quick Stock Selector if top5 available */}
            {top5Stocks.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Selecionar Ativo do Ranking:
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {top5Stocks.slice(0, 5).map((s, idx) => {
                    const isSelected = selectedStock?.ticker === s.ticker;
                    return (
                      <button
                        key={s.ticker}
                        type="button"
                        onClick={() => handleStockChange(s)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <span className="text-[10px] text-slate-400 block font-bold">
                          {idx === 0 ? '🏆 Top 1' : `#${idx + 1}`}
                        </span>
                        <strong className="text-xs font-black block">{s.ticker}</strong>
                        <span className="text-[10px] text-slate-500 block">R$ {s.currentPrice.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Cotação / Preço de Compra (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Quantidade de Ações
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={sharesCount}
                    onChange={(e) => setSharesCount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl text-xs font-black bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (price > 0 && totalAporte > 0) {
                        setSharesCount(Math.max(1, Math.floor(totalAporte / price)));
                      }
                    }}
                    className="px-2.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-[10px] font-bold hover:bg-slate-300 dark:hover:bg-slate-600 shrink-0"
                    title="Calcular máximo de ações com base no aporte"
                  >
                    Max
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Data do Aporte
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Math Preview Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                  Total Financeiro do Aporte
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  R$ {currentTotalCost.toFixed(2)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                  Status no Momento
                </span>
                <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                  Score {selectedStock?.growthScore || 90}/100 • {selectedStock?.semaphore || 'APORTAR'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Observações / Racional da Compra (Opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Aporte mensal recorrente executado na B3."
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar e Salvar Aporte</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleBasketSubmit} className="p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 block">
                  Valor Total a Distribuir no TOP 5:
                </span>
                <div className="flex items-center gap-2 mt-1">
                  {[500, 1000, 2000, 5000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setTotalAporte(v)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                        totalAporte === v ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      R$ {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative w-28">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={totalAporte}
                  onChange={(e) => setTotalAporte(Number(e.target.value) || 0)}
                  className="w-full pl-8 pr-2 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            {/* TOP 5 Basket Table preview */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                Distribuição Automática por Peso de Assimetria:
              </span>

              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {top5Stocks.slice(0, 5).map((stockItem, idx) => {
                  const weight = basketWeights[idx] || 20;
                  const budgetForThis = (totalAporte * weight) / 100;
                  const shares = Math.floor(budgetForThis / (stockItem.currentPrice || 1));
                  const cost = shares * stockItem.currentPrice;

                  return (
                    <div key={stockItem.ticker} className="p-3 bg-white dark:bg-slate-800/80 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[10px]">
                          #{idx + 1}
                        </span>
                        <div>
                          <strong className="font-black text-slate-900 dark:text-white">{stockItem.ticker}</strong>
                          <span className="text-[11px] text-slate-400 block">R$ {stockItem.currentPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Peso: {weight}%</span>
                          <strong className="text-indigo-600 dark:text-indigo-400">{shares} ações</strong>
                        </div>

                        <div className="text-right w-24">
                          <span className="text-[10px] text-slate-400 block">Subtotal</span>
                          <strong className="text-slate-900 dark:text-white">R$ {cost.toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Registrar Todos os Aportes do TOP 5</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
