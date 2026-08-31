import {
  StockAsset,
  StockSnapshot,
  StockContribution,
  StockReevaluationAudit,
  StockSemaphore,
  StockReevaluationStatus,
  StockAIEvaluationReport,
  StockAIEvaluationAssetRank,
} from '../types';
import { CURATED_STOCKS_GROWTH } from './stocksGrowthData';
import { fetchB3Quote } from './brapiService';
import { getApiKey, safeParseJson } from './geminiService';
import { GoogleGenAI } from '@google/genai';

const STOCKS_STORAGE_KEY = 'nexo_stocks_custom_data';
const CONTRIBUTIONS_KEY = 'nexo_stocks_contributions';
const SNAPSHOTS_KEY = 'nexo_stocks_snapshots';
const AI_REPORT_KEY = 'nexo_stocks_ai_evaluation_report';

/**
 * Load all stocks with live B3 quotes (or institutional fallback)
 */
export async function getStocksList(): Promise<StockAsset[]> {
  const baseStocks = { ...CURATED_STOCKS_GROWTH };

  // Try to load any user overrides or audits stored locally
  try {
    const saved = localStorage.getItem(STOCKS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(baseStocks, parsed);
    }
  } catch (e) {
    console.error('Error loading saved stocks:', e);
  }

  // Update quotes from B3
  const stocksArray = Object.values(baseStocks);
  const updated = await Promise.all(
    stocksArray.map(async (stock) => {
      try {
        const quote = await fetchB3Quote(stock.ticker);
        if (quote && quote.price > 0) {
          return {
            ...stock,
            currentPrice: quote.price,
            changePercent: quote.changePercent ?? stock.changePercent,
            isRealTimeQuote: quote.isRealTime,
          };
        }
      } catch (err) {
        console.warn(`Could not refresh quote for ${stock.ticker}`, err);
      }
      return stock;
    })
  );

  return updated;
}

/**
 * Identify the TOP 5 Stocks by Quality & Growth Score
 */
export function getTop5Stocks(stocks: StockAsset[]): StockAsset[] {
  return [...stocks]
    .sort((a, b) => b.growthScore - a.growthScore)
    .slice(0, 5);
}

/**
 * Determine the 🏆 TOP 1 — MELHOR ASSIMETRIA DO MOMENTO
 * Logic: Compares top candidates taking into account:
 * Quality (ROIC/Margin/Moat) + Growth + Valuation (P/E, PEG, Safety Margin) + Financial Health + Risk
 * Does NOT simply choose the highest Growth Score, but the best Risk x Return x Valuation asymmetry.
 */
export function calculateBestAsymmetry(stocks: StockAsset[], aporteAmount: number = 1000): {
  top1: StockAsset;
  sharesCount: number;
  totalCost: number;
  remainingCash: number;
  allRanked: { stock: StockAsset; asymmetryScore: number; reason: string }[];
} {
  const stockList = stocks && stocks.length > 0 ? stocks : Object.values(CURATED_STOCKS_GROWTH);
  const topCandidates = getTop5Stocks(stockList);

  const ranked = topCandidates.map((stock) => {
    // Valuation factor (0 to 30) - lower P/E, lower PEG, higher safety margin = higher score
    const pegScore = Math.max(0, Math.min(10, (2.0 - (stock.pegRatio || 1.5)) * 10));
    const safetyScore = Math.max(0, Math.min(10, ((stock.safetyMarginPercent || 15) / 40) * 10));
    const fcfScore = Math.max(0, Math.min(10, ((stock.fcfYield || 5) / 12) * 10));
    const valuationComposite = pegScore + safetyScore + fcfScore; // Max 30

    // Quality factor (0 to 40) - ROIC, margins, cash
    const roicFactor = Math.min(20, (stock.roic / 30) * 20);
    const healthFactor = stock.netDebtToEbitda <= 0 ? 10 : Math.max(0, 10 - stock.netDebtToEbitda * 3);
    const moatFactor = stock.qualityRating === 'Excepcional' ? 10 : 8;
    const qualityComposite = roicFactor + healthFactor + moatFactor; // Max 40

    // Growth factor (0 to 30)
    const growthComposite = Math.min(30, (stock.revenueCagr5y / 25) * 15 + (stock.profitCagr5y / 25) * 15);

    // Risk penalty
    let riskPenalty = 0;
    if (stock.riskLevel === 'MODERADO') riskPenalty = 4;
    if (stock.riskLevel === 'ELEVADO') riskPenalty = 12;
    if (stock.riskLevel === 'CRITICO') riskPenalty = 25;

    // Semaphore multiplier
    let semaphoreMultiplier = 1.0;
    if (stock.semaphore === 'AGUARDAR') semaphoreMultiplier = 0.65;
    if (stock.semaphore === 'REAVALIAR') semaphoreMultiplier = 0.4;
    if (stock.semaphore === 'TESE_DETERIORADA') semaphoreMultiplier = 0.1;

    const totalAsymmetry = (valuationComposite * 0.35 + qualityComposite * 0.40 + growthComposite * 0.25 - riskPenalty) * semaphoreMultiplier;

    return {
      stock,
      asymmetryScore: Number(totalAsymmetry.toFixed(2)),
      reason: stock.asymmetryReason || `Excelente equilíbrio entre ROIC de ${stock.roic}%, crescimento de lucros e margem de segurança de valuation de ${stock.safetyMarginPercent}%.`
    };
  });

  // Sort by highest asymmetry score
  ranked.sort((a, b) => b.asymmetryScore - a.asymmetryScore);

  const fallbackStock = Object.values(CURATED_STOCKS_GROWTH)[0];
  const top1 = ranked[0]?.stock || topCandidates[0] || fallbackStock;
  const currentPrice = top1?.currentPrice && top1.currentPrice > 0 ? top1.currentPrice : 1;
  const sharesCount = Math.floor(aporteAmount / currentPrice);
  const totalCost = Number((sharesCount * currentPrice).toFixed(2));
  const remainingCash = Number(Math.max(0, aporteAmount - totalCost).toFixed(2));

  return {
    top1,
    sharesCount,
    totalCost,
    remainingCash,
    allRanked: ranked
  };
}

/**
 * Reevaluate thesis of a specific stock (Offline deterministic audit + optional Gemini AI)
 */
export async function reevaluateStockThesis(
  stock: StockAsset,
  previousSnapshot?: StockSnapshot
): Promise<StockReevaluationAudit> {
  const today = new Date().toISOString().split('T')[0];
  
  // Default previous snapshot if none exists
  const prev: StockSnapshot = previousSnapshot || {
    id: `snap_${stock.ticker}_initial`,
    ticker: stock.ticker,
    date: '2025-12-15',
    price: Number((stock.currentPrice * 0.94).toFixed(2)),
    growthScore: stock.growthScore,
    revenueCagr5y: stock.revenueCagr5y,
    profitCagr5y: stock.profitCagr5y,
    roic: stock.roic,
    roe: stock.roe,
    netMargin: stock.netMargin,
    netDebtToEbitda: stock.netDebtToEbitda,
    fcfYield: stock.fcfYield,
    peRatio: stock.peRatio,
    semaphore: stock.semaphore,
    analystTake: stock.analystVerdict,
    thesisStatus: 'TESE_MANTIDA',
  };

  // Compare metrics
  const whatChanged: string[] = [];
  let status: StockReevaluationStatus = 'TESE_MANTIDA';
  let impactLevel: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO' = 'BAIXO';
  let newScore = stock.growthScore;

  // 1. ROIC Check
  const roicDiff = stock.roic - prev.roic;
  if (roicDiff < -4) {
    whatChanged.push(`Redução no ROIC de ${prev.roic}% para ${stock.roic}% (${roicDiff.toFixed(1)} p.p.)`);
    impactLevel = 'MEDIO';
    status = 'ATENCAO';
    newScore -= 3;
  } else if (roicDiff > 2) {
    whatChanged.push(`Expansão do ROIC de ${prev.roic}% para ${stock.roic}% (+${roicDiff.toFixed(1)} p.p.)`);
  } else {
    whatChanged.push(`ROIC estável em ${stock.roic}% (Excelente patamar de rentabilidade)`);
  }

  // 2. Net Debt Check
  if (stock.netDebtToEbitda > 2.5 && prev.netDebtToEbitda <= 2.0) {
    whatChanged.push(`Aumento da alavancagem para ${stock.netDebtToEbitda}x Dívida Líq/EBITDA`);
    impactLevel = 'ALTO';
    status = 'TESE_ENFRAQUECIDA';
    newScore -= 5;
  } else {
    whatChanged.push(`Estrutura de capital sólida com Dívida Líq/EBITDA de ${stock.netDebtToEbitda}x`);
  }

  // 3. Growth Check
  if (stock.profitCagr5y < 8) {
    whatChanged.push(`Desaceleração do crescimento de lucros para ${stock.profitCagr5y}% a.a.`);
    status = 'ATENCAO';
    newScore -= 4;
  } else {
    whatChanged.push(`Crescimento composto de lucros mantido em +${stock.profitCagr5y}% a.a.`);
  }

  // 4. Valuation Check
  const priceChange = ((stock.currentPrice - prev.price) / prev.price) * 100;
  whatChanged.push(`Variação da cotação: ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(1)}% desde a última auditoria`);

  let conclusion = `Tese plenamente mantida para ${stock.name} (${stock.ticker}). Os pilares de rentabilidade (ROIC ${stock.roic}%), baixo endividamento e geração de caixa seguem sólidos. O semáforo segue como ${stock.semaphore}.`;

  // Optional AI enhancement if Gemini API key exists
  const apiKey = getApiKey();
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Você é um analista CNPI sênior focado em Value/Growth Investing de alta qualidade na B3.
Faça uma reavaliação de tese estritamente técnica, factual e sem promessas de ganhos para a seguinte empresa:

Ativo: ${stock.ticker} - ${stock.name}
Setor: ${stock.sector}
Preço Atual: R$ ${stock.currentPrice.toFixed(2)}
Growth Score Atual: ${stock.growthScore}/100
ROIC: ${stock.roic}% | ROE: ${stock.roe}% | Margem Líquida: ${stock.netMargin}%
Dívida Líquida/EBITDA: ${stock.netDebtToEbitda}x
CAGR Lucro 5A: ${stock.profitCagr5y}% | CAGR Receita 5A: ${stock.revenueCagr5y}%
P/L Atual: ${stock.peRatio}x | PEG: ${stock.pegRatio}
Semáforo Atual: ${stock.semaphore}

Regras:
1. Nunca use frases sensacionalistas como "lucro garantido", "ação perfeita", "vai subir".
2. Seja objetivo em 3-4 linhas: por que a tese se sustenta, como está o valuation e qual o principal risco a monitorar.
3. Responda em formato JSON com a estrutura:
{
  "status": "TESE_MANTIDA" | "ATENCAO" | "TESE_ENFRAQUECIDA" | "MUDANCA_ESTRUTURAL",
  "impactLevel": "BAIXO" | "MEDIO" | "ALTO",
  "whatChanged": ["item 1", "item 2", "item 3"],
  "analystConclusion": "texto de 2 a 4 linhas...",
  "recommendedAction": "APORTAR" | "AGUARDAR" | "REAVALIAR"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        }
      });

      const parsed = safeParseJson<any>(response.text);
      if (parsed && parsed.analystConclusion) {
        conclusion = parsed.analystConclusion;
        if (parsed.status) status = parsed.status;
        if (parsed.impactLevel) impactLevel = parsed.impactLevel;
        if (Array.isArray(parsed.whatChanged) && parsed.whatChanged.length > 0) {
          whatChanged.splice(0, whatChanged.length, ...parsed.whatChanged);
        }
      }
    } catch (aiErr) {
      console.warn('Gemini AI analysis error, using institutional fallback:', aiErr);
    }
  }

  const auditResult: StockReevaluationAudit = {
    id: `audit_${stock.ticker}_${Date.now()}`,
    ticker: stock.ticker,
    auditDate: today,
    previousSnapshot: prev,
    currentData: stock,
    whatChanged,
    impactLevel,
    status,
    newGrowthScore: Math.max(0, Math.min(100, newScore)),
    analystConclusion: conclusion,
  };

  // Save new snapshot to history
  saveStockSnapshot({
    id: `snap_${stock.ticker}_${Date.now()}`,
    ticker: stock.ticker,
    date: today,
    price: stock.currentPrice,
    growthScore: auditResult.newGrowthScore,
    revenueCagr5y: stock.revenueCagr5y,
    profitCagr5y: stock.profitCagr5y,
    roic: stock.roic,
    roe: stock.roe,
    netMargin: stock.netMargin,
    netDebtToEbitda: stock.netDebtToEbitda,
    fcfYield: stock.fcfYield,
    peRatio: stock.peRatio,
    semaphore: stock.semaphore,
    analystTake: conclusion,
    thesisStatus: status,
  });

  return auditResult;
}

/**
 * Contributions & Snapshots persistence helpers
 */
export function getSavedContributions(): StockContribution[] {
  try {
    const raw = localStorage.getItem(CONTRIBUTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveContribution(contribution: StockContribution): void {
  try {
    const existing = getSavedContributions();
    const updated = [contribution, ...existing];
    localStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving stock contribution:', e);
  }
}

export function getSavedSnapshots(ticker?: string): StockSnapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    const list: StockSnapshot[] = raw ? JSON.parse(raw) : [];
    if (ticker) {
      return list.filter((s) => s.ticker === ticker);
    }
    return list;
  } catch (e) {
    return [];
  }
}

export function saveStockSnapshot(snapshot: StockSnapshot): void {
  try {
    const existing = getSavedSnapshots();
    const filtered = existing.filter((s) => s.id !== snapshot.id);
    const updated = [snapshot, ...filtered].slice(0, 50); // Keep last 50
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving stock snapshot:', e);
  }
}

/**
 * Persist / Load AI Evaluation Reports
 */
export function getSavedStockAIEvaluationReport(): StockAIEvaluationReport | null {
  try {
    const raw = localStorage.getItem(AI_REPORT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveStockAIEvaluationReport(report: StockAIEvaluationReport): void {
  try {
    localStorage.setItem(AI_REPORT_KEY, JSON.stringify(report));
  } catch (e) {
    console.error('Error saving stock AI report:', e);
  }
}

/**
 * Apply AI Evaluation updates (scores & semaphores) to local stock universe
 */
export function applyAIEvaluationToStocks(
  report: StockAIEvaluationReport,
  currentStocks: StockAsset[]
): StockAsset[] {
  const updated = currentStocks.map((stock) => {
    const aiRank = report.rankedAssets.find((r) => r.ticker === stock.ticker);
    if (!aiRank) return stock;

    return {
      ...stock,
      growthScore: aiRank.aiGrowthScore || stock.growthScore,
      semaphore: aiRank.semaphore || stock.semaphore,
      riskLevel: aiRank.riskLevel || stock.riskLevel,
      fairPriceEstimated: aiRank.fairPriceEstimated ?? stock.fairPriceEstimated,
      safetyMarginPercent: aiRank.safetyMarginPercent ?? stock.safetyMarginPercent,
      analystVerdict: aiRank.highlightRationale || stock.analystVerdict,
    };
  });

  try {
    const customMap: Record<string, Partial<StockAsset>> = {};
    updated.forEach((s) => {
      customMap[s.ticker] = {
        growthScore: s.growthScore,
        semaphore: s.semaphore,
        riskLevel: s.riskLevel,
        fairPriceEstimated: s.fairPriceEstimated,
        safetyMarginPercent: s.safetyMarginPercent,
        analystVerdict: s.analystVerdict,
      };
    });
    localStorage.setItem(STOCKS_STORAGE_KEY, JSON.stringify(customMap));
  } catch (e) {
    console.error('Error saving updated stocks after AI report:', e);
  }

  return updated;
}

/**
 * Run a full AI-Powered Search & Growth Stocks Re-Evaluation
 * Connects to Gemini 3.7 Flash with Google Search Grounding to evaluate
 * current macro trends, B3 valuations, debt burdens, and asymmetry.
 */
export async function runStocksGrowthAIEvaluation(
  aporteAmount: number = 1000,
  stocks?: StockAsset[]
): Promise<StockAIEvaluationReport> {
  const stockList = stocks && stocks.length > 0 ? stocks : await getStocksList();
  const apiKey = getApiKey();
  const today = new Date().toISOString().split('T')[0];

  // Stock universe summary for AI
  const stocksSummary = stockList.map((s) => {
    return `- ${s.ticker} (${s.name}, Setor: ${s.sector}): Preço R$ ${s.currentPrice.toFixed(2)}, ROIC: ${s.roic}%, Margem Líquida: ${s.netMargin}%, Dív.Líq/EBITDA: ${s.netDebtToEbitda}x, CAGR Lucro 5A: ${s.profitCagr5y}%, P/L: ${s.peRatio}x, PEG: ${s.pegRatio}, FCF Yield: ${s.fcfYield}%, Semáforo atual: ${s.semaphore}`;
  }).join('\n');

  const prompt = `
Você é um gestor de investimentos sênior de fundos de ações de alta qualidade (Compounders / Value & Growth Investing) no Brasil, credenciado CNPI e CFA.

O usuário quer realizar uma NOVA BUSCA E AVALIAÇÃO DE MERCADO completa sobre as melhores ações de crescimento sustentável e alta qualidade da B3.
Valor de aporte planejado para este momento: R$ ${aporteAmount.toFixed(2)}.

UNIVERSO DE ATIVOS EM ANÁLISE NA CARTEIRA:
${stocksSummary}

SUA MISSÃO:
1. Avaliar o MOMENTO MACROECONÔMICO ATUAL da B3 (impacto da Selic, câmbio, inflação e poder de repasse de preços em empresas com alto ROIC e baixa dívida).
2. Auditar cada uma das empresas acima com base nos 6 Pilares do Motor de Crescimento:
   - Crescimento Composto de Receita e Lucro
   - Rentabilidade Superior (ROIC > 15% e Margens Altas)
   - Solidez e Baixa Alavancagem (Dívida Líquida/EBITDA controlada)
   - Geração de Caixa Livre (FCF)
   - Valuation Atrativo vs Histórico (P/L, PEG Ratio, Margem de Segurança)
   - Fosso Econômico e Qualidade de Gestão
3. Definir o SEMÁFORO DE APORTE de cada ativo para o momento ('APORTAR', 'AGUARDAR', 'REAVALIAR', 'TESE_DETERIORADA').
4. Eleger o 🏆 TOP 1 ABSOLUTO EM ASSIMETRIA para receber o aporte de R$ ${aporteAmount.toFixed(2)}, calculando quantas ações cabem no valor e explicando a assimetria vencedora.
5. Listar os alertas de risco cruciais e 3 conselhos táticos de alocação.

RESPONDA EXCLUSIVAMENTE COM JSON VÁLIDO no seguinte formato (sem markdown fences):
{
  "macroContext": {
    "interestRateScenario": "Análise clara sobre impacto das taxas de juros no custo de capital das empresas de crescimento...",
    "sectorOutlook": "Visão setorial sobre bens de capital, tecnologia, saúde/farmácias e infraestrutura...",
    "summaryVerdict": "Veredito executivo de alocação para o mês."
  },
  "topPick": {
    "ticker": "TICKER",
    "name": "Nome da Empresa",
    "sector": "Setor",
    "currentPrice": 0.00,
    "fairPriceEstimated": 0.00,
    "safetyMarginPercent": 0,
    "growthScore": 95,
    "semaphore": "APORTAR",
    "whyTopPick": "Explicação técnica detalhada de por que este ativo possui a melhor assimetria risco x retorno x valuation hoje.",
    "recommendedAllocationPercent": 40,
    "targetSharesForAporte": 0
  },
  "rankedAssets": [
    {
      "ticker": "TICKER",
      "name": "Nome da Empresa",
      "sector": "Setor",
      "currentPrice": 0.00,
      "aiGrowthScore": 92,
      "semaphore": "APORTAR",
      "riskLevel": "BAIXO",
      "asymmetryRank": 1,
      "asymmetryScore": 94,
      "valuationStatus": "Atrativo",
      "fairPriceEstimated": 0.00,
      "safetyMarginPercent": 22,
      "highlightRationale": "Parecer de 2 linhas sobre ROIC, margens e valuation atual.",
      "growthDriver": "Principal vetor de crescimento da companhia para os próximos anos.",
      "mainRiskAlert": "Principal risco específico a monitorar."
    }
  ],
  "tacticalAdvice": [
    "Conselho tático 1",
    "Conselho tático 2",
    "Conselho tático 3"
  ],
  "riskAlerts": [
    "Alerta de risco macro ou setorial 1",
    "Alerta de risco 2"
  ]
}
`;

  let aiResult: any = null;
  const sources: { title: string; uri: string }[] = [];

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      try {
        // First try with Google Search Grounding for fresh B3 news
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          chunks.forEach((chunk: any) => {
            if (chunk.web?.title && chunk.web?.uri) {
              sources.push({
                title: chunk.web.title,
                uri: chunk.web.uri,
              });
            }
          });
        }

        aiResult = safeParseJson<any>(response.text);
      } catch (groundingErr) {
        console.warn('Search grounding error, attempting pure generative analysis:', groundingErr);
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        aiResult = safeParseJson<any>(fallbackResponse.text);
      }
    } catch (err) {
      console.error('Gemini AI Growth Stocks evaluation error:', err);
    }
  }

  // If AI response is valid, build structured report
  if (aiResult && aiResult.topPick && Array.isArray(aiResult.rankedAssets) && aiResult.rankedAssets.length > 0) {
    const topPickAsset = stockList.find((s) => s.ticker === aiResult.topPick.ticker) || stockList[0];
    const unitPrice = topPickAsset.currentPrice > 0 ? topPickAsset.currentPrice : (aiResult.topPick.currentPrice || 1);
    const sharesForAporte = Math.floor(aporteAmount / unitPrice);

    const report: StockAIEvaluationReport = {
      id: `ai_report_${Date.now()}`,
      analyzedAt: today,
      aporteConsidered: aporteAmount,
      macroContext: {
        interestRateScenario: aiResult.macroContext?.interestRateScenario || 'Ambiente de juros elevados exige foco em empresas desbalanceadas e geradoras de caixa líquido.',
        sectorOutlook: aiResult.macroContext?.sectorOutlook || 'Empresas de bens de capital e tecnologia com liderança de mercado sustentam crescimento mesmo em cenários voláteis.',
        summaryVerdict: aiResult.macroContext?.summaryVerdict || 'Alocação recomendada concentrada nos ativos de maior assimetria e ROIC sustentável.',
      },
      topPick: {
        ticker: aiResult.topPick.ticker || topPickAsset.ticker,
        name: aiResult.topPick.name || topPickAsset.name,
        sector: aiResult.topPick.sector || topPickAsset.sector,
        currentPrice: unitPrice,
        fairPriceEstimated: aiResult.topPick.fairPriceEstimated || (unitPrice * 1.25),
        safetyMarginPercent: aiResult.topPick.safetyMarginPercent || 20,
        growthScore: aiResult.topPick.growthScore || topPickAsset.growthScore,
        semaphore: (aiResult.topPick.semaphore as StockSemaphore) || topPickAsset.semaphore,
        whyTopPick: aiResult.topPick.whyTopPick || `Melhor assimetria identificada pela IA com ROIC elevado de ${topPickAsset.roic}% e forte margem de segurança.`,
        recommendedAllocationPercent: aiResult.topPick.recommendedAllocationPercent || 40,
        targetSharesForAporte: sharesForAporte,
      },
      rankedAssets: aiResult.rankedAssets.map((item: any, idx: number) => {
        const matching = stockList.find((s) => s.ticker === item.ticker);
        return {
          ticker: item.ticker || matching?.ticker || 'WEGE3',
          name: item.name || matching?.name || 'WEG S.A.',
          sector: item.sector || matching?.sector || 'Bens de Capital',
          currentPrice: matching?.currentPrice || item.currentPrice || 50,
          aiGrowthScore: item.aiGrowthScore || matching?.growthScore || 90,
          semaphore: (item.semaphore as StockSemaphore) || matching?.semaphore || 'APORTAR',
          riskLevel: item.riskLevel || matching?.riskLevel || 'BAIXO',
          asymmetryRank: idx + 1,
          asymmetryScore: item.asymmetryScore || Math.max(70, 98 - idx * 5),
          valuationStatus: item.valuationStatus || 'Atrativo',
          fairPriceEstimated: item.fairPriceEstimated || matching?.fairPriceEstimated,
          safetyMarginPercent: item.safetyMarginPercent || matching?.safetyMarginPercent,
          highlightRationale: item.highlightRationale || matching?.analystVerdict || 'Fundamentos de alta qualidade com rentabilidade sustentada.',
          growthDriver: item.growthDriver || 'Expansão de mercado, ganhos de eficiência e reinvestimento com alto ROIC.',
          mainRiskAlert: item.mainRiskAlert || 'Volatilidade macroeconômica e flutuações de demanda cíclica.',
        };
      }),
      tacticalAdvice: Array.isArray(aiResult.tacticalAdvice) && aiResult.tacticalAdvice.length > 0
        ? aiResult.tacticalAdvice
        : [
            `Priorize aportes fracionados nas ações com semáforo APORTAR para capturar o melhor preço médio.`,
            `Mantenha os aportes regulares sem tentar adivinhar topos e fundos de curto prazo da B3.`,
            `Reavalie a tese semestralmente ou caso ocorram mudanças estruturais na gestão ou endividamento.`,
          ],
      riskAlerts: Array.isArray(aiResult.riskAlerts) && aiResult.riskAlerts.length > 0
        ? aiResult.riskAlerts
        : [
            `Atenção à sensibilidade de múltiplos (P/L) em caso de manutenção prolongada da taxa Selic.`,
            `Monitore a conversão de EBITDA em Caixa Livre (FCF) nos balanços trimestrais.`,
          ],
      sources: sources.length > 0 ? sources : undefined,
      isCustomAI: true,
    };

    saveStockAIEvaluationReport(report);
    return report;
  }

  // Institutional Fallback if offline or no Gemini API key
  const asymmetryCalc = calculateBestAsymmetry(stockList, aporteAmount);
  const top1Asset = asymmetryCalc.top1;
  const sharesCount = Math.floor(aporteAmount / top1Asset.currentPrice);

  const fallbackReport: StockAIEvaluationReport = {
    id: `ai_report_${Date.now()}`,
    analyzedAt: today,
    aporteConsidered: aporteAmount,
    macroContext: {
      interestRateScenario: 'Cenário macroeconômico com Selic em patamar restritivo privilegia ativos com baixa alavancagem financeira (Dívida Líquida/EBITDA < 1.5x) e alta geração de caixa livre.',
      sectorOutlook: 'Empresas líderes em seus respectivos nichos (Bens de Capital, Tecnologia B2B, Varejo Farmacêutico e Energia) mantêm poder de repasse de preços e margens protegidas.',
      summaryVerdict: 'Recomenda-se alocação disciplinada focada no TOP 1 de assimetria e na dispersão tática entre compounders com semáforo verde (APORTAR).',
    },
    topPick: {
      ticker: top1Asset.ticker,
      name: top1Asset.name,
      sector: top1Asset.sector,
      currentPrice: top1Asset.currentPrice,
      fairPriceEstimated: top1Asset.fairPriceEstimated || Number((top1Asset.currentPrice * 1.22).toFixed(2)),
      safetyMarginPercent: top1Asset.safetyMarginPercent || 18,
      growthScore: top1Asset.growthScore,
      semaphore: top1Asset.semaphore,
      whyTopPick: top1Asset.asymmetryReason || `Excelente equilíbrio entre ROIC de ${top1Asset.roic}%, crescimento composto de lucros e margem de segurança de ${top1Asset.safetyMarginPercent}%.`,
      recommendedAllocationPercent: 40,
      targetSharesForAporte: sharesCount,
    },
    rankedAssets: asymmetryCalc.allRanked.map((item, idx) => ({
      ticker: item.stock.ticker,
      name: item.stock.name,
      sector: item.stock.sector,
      currentPrice: item.stock.currentPrice,
      aiGrowthScore: item.stock.growthScore,
      semaphore: item.stock.semaphore,
      riskLevel: item.stock.riskLevel,
      asymmetryRank: idx + 1,
      asymmetryScore: Math.round(item.asymmetryScore * 2.5),
      valuationStatus: item.stock.valuationStatus,
      fairPriceEstimated: item.stock.fairPriceEstimated,
      safetyMarginPercent: item.stock.safetyMarginPercent,
      highlightRationale: item.reason,
      growthDriver: `Expansão orgânica contínua e reinvestimento de capital a ROIC de ${item.stock.roic}%.`,
      mainRiskAlert: item.stock.keyRisks[0]?.description || item.stock.keyRisks[0]?.name || 'Flutuações conjunturais e pressão de custos.',
    })),
    tacticalAdvice: [
      `Aporte prioritário em ${top1Asset.ticker} (${sharesCount} ações cabem exatamente no aporte de R$ ${aporteAmount.toFixed(2)}).`,
      `Evite aportar em ativos com semáforo AGUARDAR ou REAVALIAR até normalização de múltiplos ou auditoria de tese.`,
      `Reinvista proventos recebidos na próxima melhor assimetria para acelerar o efeito juros compostos.`,
    ],
    riskAlerts: [
      `Variações bruscas na curva de juros futuros podem gerar volatilidade transitória nas cotações.`,
      `Audite as divulgações de resultados trimestrais para certificar que o ROIC permanece acima de 15%.`,
    ],
    isCustomAI: false,
  };

  saveStockAIEvaluationReport(fallbackReport);
  return fallbackReport;
}

