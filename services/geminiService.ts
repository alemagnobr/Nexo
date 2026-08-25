
import { GoogleGenAI, Type } from "@google/genai";
import { AppData, Investment, ChatMessage, RiskProfile, ShoppingItem } from '../types';

const CATEGORIES = ['Casa', 'Mobilidade', 'Alimentos', 'Lazer', 'Pets', 'Outros'];
const API_KEY_STORAGE = 'nexo_user_api_key';

// Helper functions for API Key Management
export const getApiKey = (): string | null => {
  // Only use the user's custom key stored in browser
  const storedKey = localStorage.getItem(API_KEY_STORAGE);
  if (storedKey) return storedKey;
  
  // No fallback to process.env.API_KEY anymore
  return null;
};

export const setApiKey = (key: string) => {
  localStorage.setItem(API_KEY_STORAGE, key);
};

export const removeApiKey = () => {
  localStorage.removeItem(API_KEY_STORAGE);
};

export const hasCustomApiKey = (): boolean => {
  return !!localStorage.getItem(API_KEY_STORAGE);
};

/**
 * Robust JSON parser that handles markdown backticks, trailing text/notes,
 * multiple objects, or unbalanced trailing tokens from LLM output.
 */
export function safeParseJson<T>(rawText: string | undefined | null, fallback: T | null = null): T | null {
  if (!rawText) return fallback;
  let text = rawText.trim();

  // 1. Remove markdown code fences if present (```json ... ``` or ``` ...)
  if (text.startsWith('```json')) {
    text = text.substring(7);
  } else if (text.startsWith('```')) {
    text = text.substring(3);
  }
  if (text.endsWith('```')) {
    text = text.substring(0, text.length - 3);
  }
  text = text.trim();

  // 2. Try direct JSON.parse
  try {
    return JSON.parse(text) as T;
  } catch (_directErr) {
    // 3. Match balanced JSON braces {} or brackets [] to extract the clean primary JSON payload
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');

    let startIdx = -1;
    let isObject = false;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      isObject = true;
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      isObject = false;
    }

    if (startIdx !== -1) {
      let depth = 0;
      let inString = false;
      let escape = false;
      let endIdx = -1;

      for (let i = startIdx; i < text.length; i++) {
        const char = text[i];
        if (escape) {
          escape = false;
          continue;
        }
        if (char === '\\') {
          escape = true;
          continue;
        }
        if (char === '"') {
          inString = !inString;
          continue;
        }
        if (!inString) {
          if (char === (isObject ? '{' : '[')) {
            depth++;
          } else if (char === (isObject ? '}' : ']')) {
            depth--;
            if (depth === 0) {
              endIdx = i + 1;
              break;
            }
          }
        }
      }

      if (endIdx !== -1) {
        const candidate = text.substring(startIdx, endIdx);
        try {
          return JSON.parse(candidate) as T;
        } catch (innerErr) {
          console.warn("safeParseJson: balanced substring parsing failed:", innerErr);
        }
      }
    }

    // 4. Regex fallback extraction
    try {
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch) {
        return JSON.parse(objMatch[0]) as T;
      }
      const arrMatch = text.match(/\[[\s\S]*\]/);
      if (arrMatch) {
        return JSON.parse(arrMatch[0]) as T;
      }
    } catch (_regexErr) {
      // ignore
    }

    console.warn("safeParseJson: Unable to parse AI response as JSON. Returning fallback.");
    return fallback;
  }
}

// Types for the Investment Advice response
export interface InvestmentAdviceResult {
  text: string;
  sources: { title: string; uri: string }[];
}

// New Interface for Structured Wealth Analysis
export interface WealthAnalysisResult {
    analysisText: string;
    currentAllocation: { name: string; value: number }[];
    suggestedAllocation: { name: string; value: number }[];
    actionItems: { title: string; type: 'buy' | 'sell' | 'hold'; description: string }[];
}

export interface ParsedAgendaInput {
  type: 'event' | 'task';
  title: string;
  description?: string;
  startDate: string; // ISO string
  endDate?: string;  // ISO string
  allDay?: boolean;
}

export const parseAgendaInput = async (input: string, currentDate: Date): Promise<ParsedAgendaInput | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `
    Você é um assistente de calendário inteligente.
    O usuário fornecerá um comando em linguagem natural para criar um evento ou uma tarefa.
    A data e hora atual de referência é: ${currentDate.toISOString()} (${currentDate.toLocaleString('pt-BR')}).
    O fuso horário atual do usuário é UTC${currentDate.getTimezoneOffset() > 0 ? '-' : '+'}${Math.abs(currentDate.getTimezoneOffset() / 60)}.
    
    Extraia os detalhes e retorne um objeto JSON.
    - Se for um compromisso com hora marcada ou duração, classifique como "event".
    - Se for algo a fazer (lembrete, conta a pagar), classifique como "task".
    - Converta termos como "amanhã", "próxima sexta", "daqui a 2 horas" para datas reais baseadas na data atual.
    - IMPORTANTE: Retorne as datas no fuso horário local do usuário, no formato YYYY-MM-DDTHH:mm:ss (SEM a letra 'Z' no final). Exemplo: "2026-03-30T14:00:00".
    - Se o usuário não especificar o ano, assuma o ano atual.
    - Se não especificar a hora para um evento, assuma que é o dia todo (allDay: true).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: input,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, description: "Deve ser 'event' ou 'task'" },
            title: { type: Type.STRING, description: "Título curto e claro" },
            description: { type: Type.STRING, description: "Detalhes adicionais, se houver" },
            startDate: { type: Type.STRING, description: "Data de início no formato YYYY-MM-DDTHH:mm:ss (SEM a letra Z)" },
            endDate: { type: Type.STRING, description: "Data de término no formato YYYY-MM-DDTHH:mm:ss (SEM a letra Z)" },
            allDay: { type: Type.BOOLEAN, description: "Verdadeiro se durar o dia todo ou não tiver hora específica" }
          },
          required: ["type", "title", "startDate"]
        }
      }
    });

    const text = response.text?.trim();
    if (!text) return null;
    return safeParseJson<ParsedAgendaInput>(text);
  } catch (error) {
    console.error("Erro ao processar entrada da agenda:", error);
    return null;
  }
};

export const generateShoppingListFromRecipe = async (prompt: string): Promise<Omit<ShoppingItem, 'id' | 'actualPrice' | 'isChecked'>[]> => {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `
    Você é um assistente de compras inteligente.
    O usuário vai pedir uma receita, evento ou lista genérica.
    Gere uma lista de compras JSON com ingredientes/itens.
    
    CATEGORIAS PERMITIDAS: 'Hortifruti', 'Carnes', 'Laticínios', 'Mercearia', 'Bebidas', 'Limpeza', 'Higiene', 'Padaria', 'Outros'.

    RESPONDA APENAS JSON VÁLIDO neste formato:
    [
      { "name": "Nome do item", "quantity": 1, "category": "Categoria" }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gere a lista para: ${prompt}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json'
      }
    });

    const text = response.text?.trim() || "[]";
    return safeParseJson<Omit<ShoppingItem, 'id' | 'actualPrice' | 'isChecked'>[]>(text, []) || [];
  } catch (error) {
    console.error("Erro ao gerar lista:", error);
    return [];
  }
};

export const suggestCategory = async (description: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return 'Outros';

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Classifique "${description}" em: ${CATEGORIES.join(', ')}. Responda SÓ a categoria.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    const text = response.text?.trim() || 'Outros';
    return CATEGORIES.includes(text) ? text : 'Outros';
  } catch (error) {
    return 'Outros';
  }
};

export const analyzeReceipt = async (base64Image: string): Promise<any> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  // Prompt specifically for Gemini Vision
  const prompt = `
    Analise esta imagem de recibo/nota fiscal.
    Extraia:
    1. Nome do estabelecimento (description)
    2. Valor total (amount)
    3. Data (date) no formato YYYY-MM-DD
    4. Categoria provável (${CATEGORIES.join(', ')})

    Responda EXATAMENTE neste formato JSON, sem crase ou markdown:
    { "description": "...", "amount": 0.00, "date": "YYYY-MM-DD", "category": "..." }
  `;

  try {
    // Usando gemini-3-flash-preview para tarefas multimodais (texto + imagem)
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      }
    });

    const text = response.text?.trim();
    return safeParseJson<any>(text, null);
  } catch (error) {
    console.error("Receipt analysis error:", error);
    return null;
  }
};

export const getInvestmentAdvice = async (investments: Investment[]): Promise<InvestmentAdviceResult> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { 
      text: "Configure sua API Key nas preferências para receber recomendações de investimentos.", 
      sources: [] 
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  const portfolioSummary = investments.map(i => `${i.name} (${i.type}): R$ ${i.amount}`).join(', ');
  const totalValue = investments.reduce((acc, i) => acc + i.amount, 0);

  const prompt = `
    Você é um consultor de investimentos sênior especialista no mercado brasileiro.
    Carteira Atual: R$ ${totalValue} (${portfolioSummary || "Vazia"}).

    TAREFA:
    Encontre oportunidades REAIS e ATUAIS para diversificação.
    
    FORMATO OBRIGATÓRIO (Siga estritamente):
    
    ### 🛡️ Baixo Risco
    1. **[Nome]** - [Taxa/Preço] - [Motivo curto]
    2. **[Nome]** - [Taxa/Preço] - [Motivo curto]
    3. **[Nome]** - [Taxa/Preço] - [Motivo curto]

    ### ⚖️ Médio Risco
    (3 opções no mesmo formato)

    ### 🚀 Alto Risco
    (3 opções no mesmo formato)

    ---SECTION-BREAK---

    ### 🧠 Análise Técnica
    (Sua análise detalhada aqui sobre cenário macro, inflação e porquês)
  `;

  try {
    // Tentativa 1: Com Google Search (Grounding)
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const sources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach(chunk => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Fonte Web",
            uri: chunk.web.uri || "#"
          });
        }
      });
    }

    const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);

    return {
      text: response.text || "Não foi possível gerar recomendações no momento.",
      sources: uniqueSources
    };

  } catch (error: any) {
    console.warn("Google Search Grounding failed, retrying without search...", error);
    
    // Tentativa 2: Fallback sem Google Search (para evitar erro total)
    try {
        const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt + "\n\n(Nota: A pesquisa em tempo real falhou. Use seu conhecimento geral.)",
        });
        
        return {
            text: (fallbackResponse.text || "Sem resposta.") + "\n\n⚠️ *Nota: O acesso à pesquisa em tempo real falhou. As taxas mencionadas podem ser estimativas baseadas no conhecimento geral do modelo.*",
            sources: []
        };
    } catch (fallbackError: any) {
        console.error("Investment Advice Error (Fallback):", fallbackError);
        return { 
            text: `Erro ao consultar IA: ${fallbackError.message || "Erro desconhecido"}. Verifique sua chave API ou tente novamente mais tarde.`, 
            sources: [] 
        };
    }
  }
};

// NEW FUNCTION: Structured Analysis for Wealth Planner
export const analyzeWealthPortfolio = async (investments: Investment[], riskProfile: RiskProfile, age: number): Promise<WealthAnalysisResult | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });

    // Aggregate current allocation
    const allocationMap = new Map<string, number>();
    investments.forEach(inv => {
        allocationMap.set(inv.type, (allocationMap.get(inv.type) || 0) + inv.amount);
    });
    
    // Create clear summary for AI
    const portfolioSummary = Array.from(allocationMap.entries())
        .map(([type, amount]) => `${type}: R$ ${amount.toFixed(2)}`)
        .join(', ');

    const prompt = `
      Atue como um Gestor de Private Banking. O cliente tem ${age} anos e perfil de risco: ${riskProfile.toUpperCase()}.
      
      Carteira Atual Agregada: ${portfolioSummary || "R$ 0,00 (Vazia)"}

      Sua tarefa é analisar a alocação de ativos e sugerir o rebalanceamento ideal baseado nas melhores práticas de Wealth Management (como Bridgewater/Arta) adaptado ao Brasil.
      
      RETORNE APENAS JSON VÁLIDO. NÃO USE MARKDOWN. Siga este esquema:
      {
        "analysisText": "Parágrafo curto (max 300 chars) com sua visão macro sobre a carteira do cliente.",
        "currentAllocation": [ {"name": "Categoria", "value": %_atual (0-100)} ],
        "suggestedAllocation": [ {"name": "Categoria", "value": %_ideal (0-100)} ],
        "actionItems": [
           {"title": "Ação Tática", "type": "buy" | "sell" | "hold", "description": "Explicação curta"}
        ]
      }
      
      Regras:
      1. 'suggestedAllocation' deve somar 100.
      2. Categorias sugeridas podem ser: 'Renda Fixa Pós', 'Renda Fixa Pré/IPCA', 'Ações Brasil', 'Ações Global', 'FIIs', 'Cripto/Alternativos', 'Reserva'.
      3. Se a carteira estiver vazia, sugira a alocação ideal do zero.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' } // Enforcing JSON mode
        });

        const jsonStr = response.text?.trim() || "{}";
        return safeParseJson<WealthAnalysisResult>(jsonStr, null);

    } catch (error) {
        console.error("Wealth Analysis Error:", error);
        return null;
    }
};

// STREAMING Implementation
export async function* chatWithAdvisorStream(message: string, history: ChatMessage[], data: AppData) {
  const apiKey = getApiKey();
  if (!apiKey) {
    yield "Por favor, configure sua API Key nas preferências do menu.";
    return;
  }

  const ai = new GoogleGenAI({ apiKey });

  const income = data.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = data.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const invested = data.investments.reduce((s, i) => s + i.amount, 0);
  const debts = data.debts.reduce((s, d) => s + d.currentAmount, 0);
  
  const recentTransactions = data.transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30)
    .map(t => `- ${t.date}: ${t.description} (${t.type}) R$ ${t.amount} [${t.category}] Status: ${t.status}`)
    .join('\n');

  const investmentPortfolio = data.investments
    .map(i => `- ${i.name} (${i.type}): R$ ${i.amount} (Meta: R$ ${i.targetAmount})`)
    .join('\n');

  const debtList = data.debts
    .map(d => `- ${d.creditor}: R$ ${d.currentAmount} (Status: ${d.status}, Vence: ${d.dueDate})`)
    .join('\n');

  let userPersona = "Neutro";
  if (debts > invested * 2) userPersona = "Endividado (Foco em quitação)";
  else if (invested > expense * 6) userPersona = "Investidor (Foco em otimização)";
  else if (income < expense) userPersona = "Déficit (Foco em corte de gastos)";

  const financialContext = `
    RELATÓRIO FINANCEIRO DO USUÁRIO (Contexto Interno):
    
    1. PERFIL IDENTIFICADO: ${userPersona}
    2. RESUMO:
       - Renda Total: R$ ${income.toFixed(2)}
       - Despesas Totais: R$ ${expense.toFixed(2)}
       - Saldo: R$ ${(income - expense).toFixed(2)}
       - Total Investido: R$ ${invested.toFixed(2)}
       - Dívidas Ativas: R$ ${debts.toFixed(2)}
    3. ÚLTIMAS TRANSAÇÕES:
    ${recentTransactions}
    4. INVESTIMENTOS:
    ${investmentPortfolio}
    5. DÍVIDAS:
    ${debtList}
  `;

  const systemInstruction = `
    Você é o NEXO AI, um assistente financeiro pessoal de elite.
    OBJETIVO: Ajudar o usuário a gerenciar suas finanças com base no perfil identificado: ${userPersona}.
    CONTEXTO: ${financialContext}
    DIRETRIZES:
    - Responda de forma concisa e amigável.
    - Se o usuário perguntar sobre o saldo, gastos específicos ou investimentos, consulte o relatório acima.
    - Seja proativo: se vir uma dívida vencendo ou gasto alto, pode alertar sutilmente.
    - Use Markdown para formatar valores e listas.
  `;

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: { systemInstruction }
  });
  
  const conversationHistory = history.slice(-6).map(h => `${h.role === 'user' ? 'Usuário' : 'Modelo'}: ${h.content}`).join('\n');
  const fullMessage = `
    [Histórico Recente]:
    ${conversationHistory}
    
    [Nova Mensagem]: ${message}
  `;

  try {
    const result = await chat.sendMessageStream({ message: fullMessage });
    for await (const chunk of result) {
       if (chunk.text) {
          yield chunk.text;
       }
    }
  } catch (error) {
    console.error(error);
    yield "Erro de conexão com o cérebro digital. Verifique sua Chave de API.";
  }
}

export interface FiiRecommendationItem {
  rank: number;
  ticker: string;
  name: string;
  segment: string;
  manager?: string;
  currentPrice: number;
  dividend: number;
  monthlyDY: number;
  annualDY: number;
  pvp: number;
  stabilityScore: number; // 0-100
  riskLevel: string;
  magicNumber: number;
  costToSnowball: number;
  whyChosen: string;
  crisisResilienceReason: string;
  category: 'anti_crise' | 'momento';
  scoreBreakdown?: {
    managementQuality?: { score: number; max: number; detail: string };
    portfolioSolvency?: { score: number; max: number; detail: string };
    liquidity?: { score: number; max: number; detail: string };
    predictability?: { score: number; max: number; detail: string };
    diversification?: { score: number; max: number; detail: string };
  };
  riskAlerts?: string[];
  exitTriggers?: string[];
  analystTake?: string;
}

export interface SnowballAIRecommendation {
  topPick: {
    ticker: string;
    name: string;
    segment: string;
    currentPrice: number;
    dividend: number;
    monthlyDY: number;
    magicNumber: number;
    costToSnowball: number;
    whyTop: string;
  };
  // Os 5 mais pagantes com alta estabilidade comprovada (anti-crise)
  topCrisisResilient: FiiRecommendationItem[];
  // Outros destaques quentes do momento (alto yield / desconto)
  topMomentum: FiiRecommendationItem[];
  ranking: {
    rank: number;
    ticker: string;
    name: string;
    segment: string;
    score: number; // 0-100
    highlight: string;
    magicNumber: number;
    monthlyDividend: number;
  }[];
  verdict: string;
  tacticalAdvice: string[];
}

export const analyzeSnowballRecommendation = async (
  currentAssets: { ticker: string; shares: number; price: number; dividend: number; segment: string }[],
  availableContribution: number = 300
): Promise<SnowballAIRecommendation | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  const portfolioSummary = currentAssets.length > 0 
    ? currentAssets.map(a => `${a.ticker}: ${a.shares} cotas (Preço R$ ${a.price.toFixed(2)}, Div R$ ${a.dividend.toFixed(2)}/mês, Seg: ${a.segment})`).join('\n')
    : 'Nenhum ativo cadastrado ainda na carteira Bola de Neve.';

  const prompt = `
    Você é o mais conceituado analista e especialista em Fundos Imobiliários (FIIs) e Fiagros da B3 (Bolsa Brasileira).
    
    Aporte individual por investimento informado pelo investidor: R$ ${availableContribution.toFixed(2)}.
    
    CARTEIRA ATUAL DO INVESTIDOR:
    ${portfolioSummary}

    BASE DE ATIVOS PRINCIPAIS DA B3:
    - SNAG11: Suno Agro Fiagro (Fiagro Crédito). Cota ~R$ 10.04, Div ~R$ 0.105 (~1.05%/mês, 12.8% a.a.). P/VP ~0.99. Gestão Suno. Inadimplência zero histórica, base R$ 10 super acessível.
    - MXRF11: Maxi Renda FII (Papel/CRI). Cota ~R$ 10.18, Div ~R$ 0.09 (~0.88%/mês, 10.9% a.a.). P/VP ~1.02. Mais de 1,1M de cotistas, alta liquidez, base R$ 10.
    - GARE11: Guardian Real Estate (Tijolo Renda Urbana & Galpões). Cota ~R$ 9.15, Div ~R$ 0.087 (~0.95%/mês, 11.4% a.a.). P/VP ~0.97. Contratos atípicos 10+ anos com GPA/BRF, tijolo acessível base R$ 10.
    - VGIA11: Valora CRA Fiagro (Fiagro Crédito). Cota ~R$ 8.82, Div ~R$ 0.10 (~1.13%/mês, 13.6% a.a.). P/VP ~0.94. Campeão de dividend yield do momento, base R$ 10.
    - CPTS11: Capitânia Securities (Papel/CRI). Cota ~R$ 8.24, Div ~R$ 0.075 (~0.91%/mês, 11.2% a.a.). P/VP ~0.91. Forte desconto de 9% no valor patrimonial, base R$ 10.
    - VGHF11: Valora Hedge Fund (Papel Multi-estratégia). Cota ~R$ 8.20, Div ~R$ 0.08 (~0.98%/mês, 11.7% a.a.). P/VP ~0.90. Desconto de 10% no VP, base R$ 10.
    - KNCR11: Kinea CDI High Grade (Papel/CDI). Cota ~R$ 103.90, Div ~R$ 1.04 (~1.00%/mês, 12.4% a.a.). P/VP ~1.01. Gestão Itaú/Kinea. Zero inadimplência histórica em crédito AAA.
    - HGLG11: CSHG / Patria Logística (Tijolo Galpões AAA). Cota ~R$ 162.80, Div ~R$ 1.10 (~0.68%/mês, 8.3% a.a.). P/VP ~1.03. Histórico de 14 anos passando ileso por 2015-2016 e 2020.
    - BTLG11: BTG Pactual Logística (Tijolo Galpões). Cota ~R$ 101.40, Div ~R$ 0.78 (~0.77%/mês, 9.3% a.a.). P/VP ~0.99. Galpões estratégicos no raio 30km de SP, contratos atípicos longos.
    - KNIP11: Kinea Índice de Preços (Papel/IPCA+). Cota ~R$ 92.50, Div ~R$ 0.85 (~0.92%/mês, 11.1% a.a.). P/VP ~0.96. Proteção real contra inflação, desconto patrimonial.
    - XPML11: XP Malls (Tijolo Shoppings). Cota ~R$ 112.50, Div ~R$ 0.92 (~0.82%/mês, 9.7% a.a.). P/VP ~0.98. Shoppings dominantes no Brasil.
    - RZTR11: Riza Terrax (Terras Agrícolas). Cota ~R$ 89.90, Div ~R$ 0.85 (~0.95%/mês, 11.4% a.a.). P/VP ~0.94. Renda de arrendamento com valorização de terras.
    - KNSC11: Kinea Securities (Papel/Misto CDI+IPCA). Cota ~R$ 90.10, Div ~R$ 0.82 (~0.91%/mês, 10.9% a.a.). P/VP ~0.97.
    - RBRR11: RBR High Grade (Papel/CRI). Cota ~R$ 88.70, Div ~R$ 0.80 (~0.90%/mês, 10.8% a.a.). P/VP ~0.95.

    REGRAS CRÍTICAS DE ENQUADRAMENTO DO APORTE INDIVIDUAL:
    - O investidor informou que seu APORTE INDIVIDUAL é de R$ ${availableContribution.toFixed(2)}.
    - ${availableContribution < 80 
        ? `ATENÇÃO OBRIGATÓRIA: Como o aporte individual (R$ ${availableContribution.toFixed(2)}) é MENOR que R$ 80, o investidor NÃO PODE comprar cotas de R$ 100 (como KNCR11 ou HGLG11) com um único aporte. Portanto, você DEVE OBRIGATORIAMENTE escolher como TOP PICK um ativo de cotação acessível (Base R$ 10, com cota entre R$ 8 e R$ 11, como SNAG11, MXRF11, GARE11 ou VGIA11) para que ele consiga comprar 1 ou mais cotas INTEIRAS a cada aporte!` 
        : `Como o aporte é de R$ ${availableContribution.toFixed(2)}, o investidor tem flexibilidade para mesclar ativos de Base R$ 100 e Base R$ 10.`}

    SUA MISSÃO:
    1. Listar os 5 FIIs/Fiagros MAIS PAGANTES COM ALTA ESTABILIDADE (Anti-Crise: sabem passar por crises sem sobressaltos, gestão exemplar, crédito AAA ou imóveis dominantes). ${availableContribution < 80 ? 'Ordene primeiro os ativos cuja cotação cabe no aporte do usuário (Base R$ 10: SNAG11, MXRF11, GARE11).' : ''}
    2. Listar outros FIIs/Fiagros DESTAQUES DO MOMENTO (Alto Yield, desconto P/VP, momentos de oportunidade tática). ${availableContribution < 80 ? 'Destaque ativos base R$ 10 como VGIA11, CPTS11, VGHF11.' : ''}
    3. Indicar o ATIVO TOP 1 das Galáxias para o investidor focar hoje para ativar a Bola de Neve no menor tempo com o aporte informado.
    4. Fornecer veredito estratégico e conselhos práticos adaptados ao valor do aporte individual.
    5. CRITÉRIO OBRIGATÓRIO PARA O 'analystTake' DE CADA ATIVO: Não gere frases genéricas ou rasas (como "Ativo para o futuro..."). Gere OBRIGATORIAMENTE um parecer aprofundado de 2 a 3 linhas explicando por que aquele ativo merece estar no ranking, citando a Nota/Score e os critérios técnicos que a sustentam (qualidade de gestão, índice de solvência/vacância, liquidez, previsibilidade dos proventos e diversificação).
    6. CRITÉRIO DOS GATILHOS (exitTriggers): Os gatilhos servem estritamente para REAVALIAR TESE (ex: "P/VP acima de 1,07 → Reavaliar tese → Motivo: redução da margem de segurança do retorno real"), nunca para venda cega, disparando uma reanálise técnica da tese.

    RESPONDA EXCLUSIVAMENTE COM JSON VÁLIDO no seguinte formato (sem Markdown):
    {
      "topPick": {
        "ticker": "TICKER",
        "name": "Nome do Fundo",
        "segment": "Segmento",
        "currentPrice": 0.00,
        "dividend": 0.00,
        "monthlyDY": 0.00,
        "magicNumber": 0,
        "costToSnowball": 0.00,
        "whyTop": "Explicação clara e empolgante de por que este é o ativo perfeito para ativar a bola de neve agora com o aporte informado."
      },
      "topCrisisResilient": [
        {
          "rank": 1,
          "ticker": "KNCR11",
          "name": "Kinea Rendimentos Imobiliários",
          "segment": "Papel / CDI High Grade",
          "manager": "Kinea (Grupo Itaú)",
          "currentPrice": 103.90,
          "dividend": 1.04,
          "monthlyDY": 1.00,
          "annualDY": 12.4,
          "pvp": 1.01,
          "stabilityScore": 99,
          "riskLevel": "Muito Baixo",
          "magicNumber": 100,
          "costToSnowball": 10390.00,
          "whyChosen": "Maior segurança de crédito da B3, gestão Itaú, 0 inadimplência em todas as crises.",
          "crisisResilienceReason": "Empréstimos atrelados ao CDI com garantias imobiliárias de empresas grau de investimento.",
          "category": "anti_crise",
          "scoreBreakdown": {
            "managementQuality": { "score": 20, "max": 20, "detail": "Gestão Itaú/Kinea com rigor máximo." },
            "portfolioSolvency": { "score": 20, "max": 20, "detail": "0% inadimplência histórica." },
            "liquidity": { "score": 20, "max": 20, "detail": "Alta liquidez diária > R$ 10M." },
            "predictability": { "score": 20, "max": 20, "detail": "CDI + 2.1% previsível." },
            "diversification": { "score": 19, "max": 20, "detail": "65+ devedores corporativos." }
          },
          "riskAlerts": [
            "Sensibilidade a cortes na taxa Selic abaixo de 9% a.a."
          ],
          "exitTriggers": [
            "P/VP acima de 1,07 → Reavaliar tese → Motivo: o ativo passa a negociar com prêmio excessivo, reduzindo a margem de segurança e o dividend yield do reinvestimento.",
            "Inadimplência não coberta por garantias em devedores com mais de 5% do PL → Reavaliar tese → Motivo: verificar solidez das garantias reais e impacto no fluxo mensal de caixa.",
            "Redução atípica de proventos por 3 meses consecutivos sem correlação macroeconômica → Reavaliar tese → Motivo: auditar carteira de crédito e eventuais despesas operacionais atípicas."
          ],
          "analystTake": "Score 99/100 sustentado pelo padrão institucional do Grupo Itaú/Kinea, com zero inadimplência histórica em quase uma década. A indexação pura ao CDI com spread médio de 2,1% a.a. assegura previsibilidade máxima e proventos regulares de ~1,0% ao mês, blindando o capital contra choques macroeconômicos."
        }
      ],
      "topMomentum": [
        {
          "rank": 1,
          "ticker": "VGIA11",
          "name": "Valora CRA Fiagro",
          "segment": "Fiagro / Crédito CRA",
          "manager": "Valora",
          "currentPrice": 8.82,
          "dividend": 0.10,
          "monthlyDY": 1.13,
          "annualDY": 13.6,
          "pvp": 0.94,
          "stabilityScore": 89,
          "riskLevel": "Moderado",
          "magicNumber": 89,
          "costToSnowball": 784.98,
          "whyChosen": "Maior dividendo mensal do agro e menor barreira para atingir o Número Mágico.",
          "crisisResilienceReason": "Carteira com alienação de safras e terras que suportam choques climáticos.",
          "category": "momento",
          "analystTake": "Nota 89/100 alavancada pelo maior dividendo mensal da bolsa (~1,13%/mês) e pelo menor custo de entrada para ativar o Número Mágico (~R$ 785). O spread robusto de CDI + 4,0% a.a. em CRAs agro com garantias de safra compensa o risco de tomadores médios, acelerando exponencialmente o reinvestimento."
        }
      ],
      "ranking": [
        {
          "rank": 1,
          "ticker": "TICKER",
          "name": "Nome",
          "segment": "Segmento",
          "score": 98,
          "highlight": "Destaque chave",
          "magicNumber": 100,
          "monthlyDividend": 0.10
        }
      ],
      "verdict": "Veredito mestre sobre como balancear estabilidade e rentabilidade hoje.",
      "tacticalAdvice": [
        "Dica prática 1",
        "Dica prática 2",
        "Dica prática 3"
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonStr = response.text?.trim() || "{}";
    return safeParseJson<SnowballAIRecommendation>(jsonStr, null);
  } catch (error) {
    console.error("Snowball AI Analysis Error:", error);
    return null;
  }
};

// --- SINGLE ASSET REAL-TIME REEVALUATION ---
export interface AssetReevaluationResult {
  ticker: string;
  name: string;
  segment: string;
  manager: string;
  currentPrice: number;
  lastDividend: number;
  monthlyDY: number;
  annualDY: number;
  pvp: number;
  overallScore: number; // 0 - 100
  status: 'healthy' | 'caution' | 'alert';
  statusLabel: string;
  verdictTitle: string;
  analystTake: string;
  pillars: {
    safety: {
      name: string;
      score: number; // 0-20
      status: 'safe' | 'caution' | 'alert';
      summary: string;
      detail: string;
    };
    profitability: {
      name: string;
      score: number; // 0-20
      status: 'safe' | 'caution' | 'alert';
      summary: string;
      detail: string;
    };
    stability: {
      name: string;
      score: number; // 0-20
      status: 'safe' | 'caution' | 'alert';
      summary: string;
      detail: string;
    };
    valuation: {
      name: string;
      score: number; // 0-20
      status: 'safe' | 'caution' | 'alert';
      summary: string;
      detail: string;
    };
    governance: {
      name: string;
      score: number; // 0-20
      status: 'safe' | 'caution' | 'alert';
      summary: string;
      detail: string;
    };
  };
  triggerAudits: {
    trigger: string;
    status: 'ok' | 'triggered' | 'warning';
    evaluation: string;
  }[];
  strategicAdvice: string[];
  snowballAdvice: string;
}

export const reevaluateSingleAssetWithAI = async (
  ticker: string,
  shares: number,
  price: number,
  dividend: number,
  segment: string,
  name?: string
): Promise<AssetReevaluationResult | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  const monthlyDY = price > 0 ? (dividend / price) * 100 : 0;
  const annualDY = monthlyDY * 12;

  const prompt = `
    Você é um analista CNPI sênior de Fundos Imobiliários e Fiagros da B3.
    Faça uma REAVALIAÇÃO COMPLETA E RIGOROSA DA TESE do ativo ${ticker} baseada no momento atual do mercado.

    DADOS ATUAIS DO ATIVO:
    - Ticker: ${ticker}
    - Nome: ${name || ticker}
    - Segmento: ${segment}
    - Preço da Cota: R$ ${price.toFixed(2)}
    - Provento / Dividendo Mensal: R$ ${dividend.toFixed(2)} (${monthlyDY.toFixed(2)}%/mês, ~${annualDY.toFixed(1)}% a.a.)
    - Cotas na carteira do investidor: ${shares} cotas (Patrimônio: R$ ${(shares * price).toFixed(2)})

    SUA MISSÃO DE REAVALIAÇÃO:
    Auditar minuciosamente se o ativo ESTÁ DENTRO DOS PADRÕES EXIGIDOS pelo método Bola de Neve:
    1. PADRÃO SEGURO: Inadimplência, LTV, garantias reais (penhor de safra, hipoteca, alienação fiduciária), solidez dos devedores/locatários.
    2. PADRÃO RENTÁVEL: Dividend Yield atual vs spread de mercado (CDI/IPCA), consistência e sustentabilidade dos proventos.
    3. PADRÃO ESTÁVEL: Vacância física/financeira, duração e tipo de contratos (atípicos 10+ anos vs típicos), previsibilidade do fluxo.
    4. PADRÃO DE VALUATION (P/VP): P/VP estimado, margem de segurança no preço atual da cota.
    5. PADRÃO DE GESTÃO & GOVERNANÇA: Reputação da gestora (Kinea, BTG, Suno, XP, Capitânia, etc.), liquidez diária, transparência.
    6. AUDITORIA DE GATILHOS: Verificar se algum gatilho de saída/reavaliação foi acionado no momento.
    7. VEREDITO DO ANALISTA: Emitir status ('healthy', 'caution' ou 'alert') e um parecer aprofundado de 2-4 linhas com argumentos técnicos.

    RESPONDA EXCLUSIVAMENTE COM JSON VÁLIDO no seguinte formato (sem Markdown):
    {
      "ticker": "${ticker}",
      "name": "${name || ticker}",
      "segment": "${segment}",
      "manager": "Nome da Gestora",
      "currentPrice": ${price},
      "lastDividend": ${dividend},
      "monthlyDY": ${Number(monthlyDY.toFixed(2))},
      "annualDY": ${Number(annualDY.toFixed(1))},
      "pvp": 1.00,
      "overallScore": 95,
      "status": "healthy",
      "statusLabel": "Tese Íntegra & Aporte Recomendado",
      "verdictTitle": "Padrões Seguro, Rentável e Estável Atendidos",
      "analystTake": "Parecer aprofundado de 2 a 3 linhas sobre a solidez e momento do ativo.",
      "pillars": {
        "safety": {
          "name": "Padrão Seguro (Solvência & Risco)",
          "score": 19,
          "status": "safe",
          "summary": "Excelente solidez de garantias",
          "detail": "Detalhamento técnico da segurança, inadimplência e garantias."
        },
        "profitability": {
          "name": "Padrão Rentável (Yield & Spread)",
          "score": 19,
          "status": "safe",
          "summary": "Yield atrativo e acima do CDI",
          "detail": "Detalhamento da rentabilidade real e spread financeiro."
        },
        "stability": {
          "name": "Padrão Estável (Previsibilidade)",
          "score": 19,
          "status": "safe",
          "summary": "Fluxo linear e contratos longos",
          "detail": "Detalhamento da estabilidade de proventos e vacância."
        },
        "valuation": {
          "name": "Padrão de Valuation (P/VP & Preço)",
          "score": 19,
          "status": "safe",
          "summary": "Preço justo dentro da margem segura",
          "detail": "Detalhamento do P/VP e valor patrimonial."
        },
        "governance": {
          "name": "Padrão de Gestão & Governança",
          "score": 19,
          "status": "safe",
          "summary": "Gestora qualificada e alta liquidez",
          "detail": "Detalhamento da equipe gestora e transparência."
        }
      },
      "triggerAudits": [
        {
          "trigger": "P/VP acima de 1.07",
          "status": "ok",
          "evaluation": "P/VP atual está dentro do limite seguro, mantendo a margem de segurança."
        },
        {
          "trigger": "Inadimplência ou perda de inquilinos relevantes",
          "status": "ok",
          "evaluation": "Nenhum evento de calote relevante registrado na carteira."
        },
        {
          "trigger": "Queda atípica de proventos por 3 meses consecutivos",
          "status": "ok",
          "evaluation": "Distribuição de dividendos consistente e alinhada com o guidance da gestora."
        }
      ],
      "strategicAdvice": [
        "Recomendação prática de aporte e alocação 1",
        "Recomendação prática 2"
      ],
      "snowballAdvice": "Orientação específica de como este ativo acelera a auto-recompra na carteira do usuário."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonStr = response.text?.trim() || "{}";
    return safeParseJson<AssetReevaluationResult>(jsonStr, null);
  } catch (error) {
    console.error("Single Asset AI Reevaluation Error:", error);
    return null;
  }
};

