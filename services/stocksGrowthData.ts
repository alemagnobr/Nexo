import { StockAsset } from '../types';

export const CURATED_STOCKS_GROWTH: Record<string, StockAsset> = {
  'WEGE3': {
    ticker: 'WEGE3',
    name: 'WEG S.A.',
    sector: 'Bens Industriais / Motores & Automação',
    subsector: 'Equipamentos Elétricos Industriais & Energia Solar',
    currentPrice: 53.80,
    changePercent: 0.85,
    classification: 'QUALITY_COMPOUNDER',
    growthScore: 94,
    semaphore: 'APORTAR',
    riskLevel: 'BAIXO',
    valuationStatus: 'Neutro / Justo',
    growthPace: 'Muito Forte',
    qualityRating: 'Excepcional',
    
    // Fundamentals
    revenueCagr5y: 22.4,
    revenueCagr3y: 19.8,
    profitCagr5y: 24.1,
    profitCagr3y: 21.6,
    ebitdaCagr3y: 22.9,
    roic: 28.6,
    roe: 31.2,
    netMargin: 17.5,
    grossMargin: 32.8,
    operatingMargin: 20.4,
    netDebtToEbitda: -0.15, // Caixa líquido
    interestCoverage: 18.5,
    cashPosition: 'R$ 7.4 bi (Caixa Líquido positivo)',
    fcfYield: 4.8,
    fcfConversion: 88.5,
    fcfConsistency: 'Geração livre de caixa positiva e crescente nos últimos 15 anos consecutivos',
    
    // Valuation
    peRatio: 31.2,
    historicalAvgPe: 34.5,
    evEbitda: 22.4,
    pegRatio: 1.30,
    pToFcf: 24.8,
    fairPriceEstimated: 61.50,
    safetyMarginPercent: 14.3,

    // Moat & Quality
    moat: 'Vantagem de custo de fabricação verticalizada global, rede de distribuição em 135 países e barreira de substituição em motores de alta eficiência (IE4/IE5).',
    pricingPower: 'Elevado repasse inflacionário com margens brutas históricas protegidas acima de 30%.',
    governanceLevel: 'Novo Mercado B3 (100% Tag Along, Conselho independente, alinhamento familiar centenário).',
    crisisHistory: 'Cresceu lucro líquido e receita em 2008, 2015-2016 e 2020 (Covid), convertendo desvalorização cambial em ganho de competitividade global.',

    // 6 Audited Pillars (24 + 20 + 20 + 13 + 7 + 10 = 94)
    pillars: {
      growth: {
        score: 24,
        max: 25,
        label: 'Crescimento',
        metrics: [
          'CAGR Receita 5 Anos: +22.4% a.a.',
          'CAGR Lucro Líquido 5 Anos: +24.1% a.a.',
          'CAGR EBITDA 3 Anos: +22.9% a.a.',
          'Consistência: 10 anos seguidos de expansão de faturamento'
        ],
        justification: 'Aceleração contínua impulsionada por transição energética, motores industriais, automação e aquisição da Regal Rexnord nos EUA.'
      },
      profitability: {
        score: 20,
        max: 20,
        label: 'Rentabilidade',
        metrics: [
          'ROIC Atual: 28.6% (Top 1% da B3)',
          'ROE Atual: 31.2%',
          'Margem Líquida: 17.5%',
          'Margem Bruta: 32.8%'
        ],
        justification: 'Eficiência operacional máxima com ROIC consistentemente acima de 25% há mais de 10 anos, gerando valor exponencial sobre o capital reinvestido.'
      },
      financialHealth: {
        score: 20,
        max: 20,
        label: 'Saúde Financeira',
        metrics: [
          'Dívida Líquida / EBITDA: -0.15x (Caixa Líquido)',
          'Disponibilidade de Caixa: R$ 7.4 bilhões',
          'Cobertura de Juros: 18.5x o serviço da dívida',
          'Perfil de Dívida: 82% no longo prazo com baixo custo'
        ],
        justification: 'Balanço fortaleza. Empresa possui mais dinheiro em caixa do que dívida total bruta, garantindo imunidade a ciclos de aperto monetário.'
      },
      cashGeneration: {
        score: 13,
        max: 15,
        label: 'Geração de Caixa',
        metrics: [
          'FCF Yield: 4.8%',
          'Conversão de Lucro em Caixa Livre: 88.5%',
          'Capex Orgânico Disciplinado: R$ 1.8 bi/ano',
          'Fluxo Operacional Robusto: R$ 5.9 bi'
        ],
        justification: 'Altíssima conversão de lucro contábil em dinheiro vivo no caixa, autofinanciando ampliações industriais sem necessidade de endividamento.'
      },
      valuation: {
        score: 7,
        max: 10,
        label: 'Valuation',
        metrics: [
          'P/L Atual: 31.2x (Abaixo da média histórica de 5 anos de 34.5x)',
          'EV/EBITDA: 22.4x',
          'PEG Ratio: 1.30 (Valuation coerente com taxa de expansão >20%)',
          'Preço Justo Estimado: R$ 61.50'
        ],
        justification: 'Embora nunca negocie a múltiplos baixos de empresas cíclicas, o P/L atual está abaixo de sua média histórica de 34x, oferecendo assimetria favorável para horizontes longos.'
      },
      qualityResilience: {
        score: 10,
        max: 10,
        label: 'Qualidade & Resiliência',
        metrics: [
          'Diversificação Geográfica: 55% da receita no exterior',
          'Moat Estrutural: Escala global e verticalização',
          'Governança: Novo Mercado B3',
          'Histórico em Crises: Lucro positivo e crescente em 100% dos anos'
        ],
        justification: 'Considerada a melhor empresa industrial da América Latina. Receitas dolarizadas e resiliência secular a crises políticas ou macroeconômicas locais.'
      }
    },
    analystVerdict: 'WEG combina crescimento composto de lucros acima de 20% ao ano com ROIC de 28.6% e caixa líquido positivo. A cotação atual, abaixo da média histórica de múltiplos, confere a melhor relação entre previsibilidade, expansão global e assimetria de longo prazo na B3.',
    asymmetryReason: 'Vence pela combinação inigualável de ROIC (28.6%), caixa líquido, 55% de receita global dolarizada e múltiplos atuais ligeiramente abaixo da média dos últimos 5 anos.',
    keyStrengths: [
      'ROIC médio de 28.6% nos últimos 10 anos sustentado por reinvestimento disciplinado',
      'Receita dolarizada e internacionalizada (mais de 135 países atendidos)',
      'Caixa líquido positivo (mais de R$ 7 bilhões em disponibilidades)',
      'Liderança absoluta na transição energética global (eólica, solar, baterias e tração elétrica)'
    ],
    keyRisks: [
      {
        id: 'r1',
        name: 'Sensibilidade Cambial',
        level: 'BAIXO',
        description: 'Apreciação forte do Real frente ao Dólar pode reduzir margens nominais de exportação no curto prazo.',
        mitigation: 'Hedge natural por meio de fábricas locais na Europa, China, México, Índia e EUA.'
      },
      {
        id: 'r2',
        name: 'Integração de Aquisições Internacionais',
        level: 'MODERADO',
        description: 'Desafio na integração de fábricas e cultura da divisão de motores industriais da Regal Rexnord.',
        mitigation: 'Histórico comprovado de dezenas de M&As integrados com sucesso e ganho de sinergia nos últimos 20 anos.'
      }
    ],
    triggers: [
      {
        id: 't1',
        condition: 'ROIC trimestral abaixo de 18% por 3 trimestres consecutivos',
        status: 'NORMAL',
        motive: 'Sinalizaria perda de eficiência de capital nas novas fábricas ou sobrecapacidade.',
        recommendedAnalysis: 'Auditar retorno das fábricas internacionais e margem bruta.'
      },
      {
        id: 't2',
        condition: 'Dívida Líquida / EBITDA ultrapassar 2.0x',
        status: 'NORMAL',
        motive: 'Comprometeria a política histórica de balanço conservador.',
        recommendedAnalysis: 'Verificar alavancagem pós-M&A e cronograma de amortização.'
      },
      {
        id: 't3',
        condition: 'Queda na receita de exportações superior a 15% a.a.',
        status: 'NORMAL',
        motive: 'Sinal de recessão industrial global ou perda de competitividade.',
        recommendedAnalysis: 'Acompanhar PMI global e pedidos em carteira (backlog).'
      }
    ],
    dataConfidence: 'ALTA',
    dataSource: 'B3 / RI WEG / Demonstrações Financeiras Padronizadas (DFP CVM 2024)',
    lastAuditDate: '2026-08-20'
  },

  'RADL3': {
    ticker: 'RADL3',
    name: 'Raia Drogasil S.A.',
    sector: 'Consumo Não-Cíclico / Varejo Farmacêutico',
    subsector: 'Farmácias, Saúde & Hub de Cuidados',
    currentPrice: 26.40,
    changePercent: -0.32,
    classification: 'QUALITY_COMPOUNDER',
    growthScore: 91,
    semaphore: 'APORTAR',
    riskLevel: 'BAIXO',
    valuationStatus: 'Atrativo',
    growthPace: 'Forte',
    qualityRating: 'Excepcional',

    revenueCagr5y: 18.2,
    revenueCagr3y: 16.5,
    profitCagr5y: 19.4,
    profitCagr3y: 17.8,
    ebitdaCagr3y: 18.1,
    roic: 21.4,
    roe: 22.8,
    netMargin: 3.8,
    grossMargin: 29.5,
    operatingMargin: 6.2,
    netDebtToEbitda: 0.95,
    interestCoverage: 9.2,
    cashPosition: 'R$ 1.9 bi em caixa + linhas de liquidez',
    fcfYield: 5.2,
    fcfConversion: 92.0,
    fcfConsistency: 'Fluxo livre de caixa positivo com expansão anual de ~260 lojas',

    peRatio: 24.8,
    historicalAvgPe: 33.2,
    evEbitda: 14.1,
    pegRatio: 1.28,
    pToFcf: 19.2,
    fairPriceEstimated: 32.80,
    safetyMarginPercent: 24.2,

    moat: 'Mais de 3.000 lojas nos melhores pontos do país, base de 50 milhões de clientes fidelizados, inteligência de dados de saúde e logística própria automatizada.',
    pricingPower: 'Reajuste anual de medicamentos regulado pela CMED repassado pontualmente sem perda de volume.',
    governanceLevel: 'Novo Mercado B3 (Comitês independentes, 100% ações ON).',
    crisisHistory: 'Negócio de demanda inelástica essencial; cresceu faturamento acima da inflação em todos os anos das últimas 2 décadas.',

    // Pillars: 23 + 19 + 18 + 14 + 8 + 9 = 91
    pillars: {
      growth: {
        score: 23,
        max: 25,
        label: 'Crescimento',
        metrics: [
          'CAGR Receita 5 Anos: +18.2% a.a.',
          'CAGR Lucro Líquido 5 Anos: +19.4% a.a.',
          'Abertura Líquida: ~260 a 300 novas lojas/ano',
          'Same-Store Sales (SSS): Inflação + 4.5%'
        ],
        justification: 'Capacidade comprovada de manter crescimento composto de dois dígitos por décadas, combinando novas lojas e expansão digital/serviços de saúde.'
      },
      profitability: {
        score: 19,
        max: 20,
        label: 'Rentabilidade',
        metrics: [
          'ROIC: 21.4% (Excepcional para o varejo físico)',
          'ROE: 22.8%',
          'Margem Bruta Estável: 29.5%',
          'Maturação de Lojas: Lojas maduras atingem ROIC >30%'
        ],
        justification: 'Excelente eficiência de capital de giro e maturação rápida de novas unidades, gerando retornos muito acima do custo médio de capital.'
      },
      financialHealth: {
        score: 18,
        max: 20,
        label: 'Saúde Financeira',
        metrics: [
          'Dívida Líquida / EBITDA: 0.95x',
          'Cobertura de Juros: 9.2x',
          'Fluxo de Caixa Operacional Cobre 100% dos Vencimentos',
          'Alongamento de Prazos Bancários de Longo Prazo'
        ],
        justification: 'Alavancagem muito baixa e controlada, financiando a abertura de centenas de lojas majoritariamente com geração própria de caixa.'
      },
      cashGeneration: {
        score: 14,
        max: 15,
        label: 'Geração de Caixa',
        metrics: [
          'FCF Yield: 5.2%',
          'Conversão de Lucro em Caixa: 92.0%',
          'Ciclo Financeiro Negativo em Fornecedores',
          'Geração Operacional Robusta: R$ 2.4 bi'
        ],
        justification: 'Venda à vista/cartão e pagamento a prazo para grandes laboratórios farmacêuticos geram capital de giro estruturalmente favorável.'
      },
      valuation: {
        score: 8,
        max: 10,
        label: 'Valuation',
        metrics: [
          'P/L Atual: 24.8x (Desconto de ~25% frente à média histórica de 33x)',
          'EV/EBITDA: 14.1x',
          'PEG Ratio: 1.28',
          'Margem de Segurança Estimada: 24.2%'
        ],
        justification: 'Oportunidade pontual de múltiplos comprimidos pelo ciclo de juros altos no Brasil, oferecendo ponto de entrada muito favorável para uma empresa com essa previsibilidade.'
      },
      qualityResilience: {
        score: 9,
        max: 10,
        label: 'Qualidade & Resiliência',
        metrics: [
          'Market Share Líder: 16% nacional (40%+ em SP)',
          'Envelhecimento Populacional Secular',
          'Novo Mercado B3',
          'Plataforma Digital com 18% das vendas'
        ],
        justification: 'Vento a favor demográfico incontestável: o envelhecimento da população brasileira expande o consumo de medicamentos e cuidados contínuos ano após ano.'
      }
    },
    analystVerdict: 'Raia Drogasil negocia com valuation cerca de 25% abaixo da sua média histórica de P/L, mantendo ritmo de crescimento de ~260 lojas/ano e ROIC acima de 20%. Apresenta assimetria altamente atrativa com baixíssimo risco operacional.',
    asymmetryReason: 'Oferece excelente margem de segurança de valuation atual (P/L 24.8x vs histórico de 33x) em um negócio de extrema previsibilidade e demanda inelástica.',
    keyStrengths: [
      'Modelo de expansão autofinanciado com ROIC de 21.4%',
      'Programa de fidelidade e dados de saúde com mais de 50M de clientes',
      'Margens brutas estáveis e repasse de preços assegurado pela CMED',
      'Valuation comprimido com mais de 24% de margem de segurança teórica'
    ],
    keyRisks: [
      {
        id: 'radl_r1',
        name: 'Aumento da Concorrência Regional',
        level: 'MODERADO',
        description: 'Pressão promocional de redes regionais em praças fora do Sudeste.',
        mitigation: 'Escala de compras massiva permite condições comerciais imbatíveis com a indústria farmacêutica.'
      },
      {
        id: 'radl_r2',
        name: 'Pressão de Custos em Aluguéis de Pontos',
        level: 'BAIXO',
        description: 'Reajustes pelo IGP-M/IPCA de contratos imobiliários das lojas.',
        mitigation: 'Poder de barganha da RD Saúde para renegociar contratos e migrar lojas se necessário.'
      }
    ],
    triggers: [
      {
        id: 'radl_t1',
        condition: 'Same-Store Sales (SSS) ficar abaixo da inflação (IPCA) por 2 trimestres seguidos',
        status: 'NORMAL',
        motive: 'Sinal de perda de tráfego de clientes ou canibalização de lojas.',
        recommendedAnalysis: 'Avaliar vendas nas mesmas lojas e ganho de market share regional.'
      },
      {
        id: 'radl_t2',
        condition: 'Dívida Líquida / EBITDA passar de 2.0x',
        status: 'NORMAL',
        motive: 'Perda de disciplina na expansão de lojas com financiamento alavancado.',
        recommendedAnalysis: 'Revisar ritmo de capex e aberturas brutas.'
      }
    ],
    dataConfidence: 'ALTA',
    dataSource: 'B3 / RI RD Saúde / DFP CVM 2024',
    lastAuditDate: '2026-08-21'
  },

  'TOTS3': {
    ticker: 'TOTS3',
    name: 'Totvs S.A.',
    sector: 'Tecnologia da Informação',
    subsector: 'Software de Gestão Empresarial (ERP) & FinTech',
    currentPrice: 32.50,
    changePercent: 1.15,
    classification: 'QUALITY_COMPOUNDER',
    growthScore: 89,
    semaphore: 'APORTAR',
    riskLevel: 'BAIXO',
    valuationStatus: 'Atrativo',
    growthPace: 'Forte',
    qualityRating: 'Excelente',

    revenueCagr5y: 19.8,
    revenueCagr3y: 18.4,
    profitCagr5y: 21.0,
    profitCagr3y: 19.2,
    ebitdaCagr3y: 19.5,
    roic: 19.2,
    roe: 18.6,
    netMargin: 15.8,
    grossMargin: 68.4,
    operatingMargin: 22.1,
    netDebtToEbitda: 0.65,
    interestCoverage: 11.4,
    cashPosition: 'R$ 2.6 bi em disponibilidades',
    fcfYield: 6.1,
    fcfConversion: 94.0,
    fcfConsistency: 'Receita recorrente anual (ARR) com taxa de renovação de 98.5%',

    peRatio: 21.5,
    historicalAvgPe: 27.8,
    evEbitda: 12.8,
    pegRatio: 1.08,
    pToFcf: 16.4,
    fairPriceEstimated: 41.00,
    safetyMarginPercent: 26.1,

    moat: 'Custo de troca gigantesco (Switching Costs) — trocar o ERP que roda o coração da empresa gera disrupção operacional e risco inaceitável para clientes médios/grandes.',
    pricingPower: 'Reajuste anual de contratos por índices de inflação (IGP-M/IPCA) com churn inferior a 1.5% ao ano.',
    governanceLevel: 'Novo Mercado B3 (Corporation com capital pulverizado de padrão global).',
    crisisHistory: 'Receita recorrente contratada (SaaS) garantiu lucros recordes mesmo durante recessões econômicas severas.',

    // Pillars: 23 + 18 + 19 + 14 + 6 + 9 = 89
    pillars: {
      growth: {
        score: 23,
        max: 25,
        label: 'Crescimento',
        metrics: [
          'CAGR Receita 5 Anos: +19.8% a.a.',
          'CAGR Lucro 5 Anos: +21.0% a.a.',
          'Adição Líquida de ARR (Receita Recorrente): >R$ 600M/ano',
          'Expansão da Divisão de Techfin & Dimensa'
        ],
        justification: 'Crescimento orgânico consistente no ecossistema SaaS para PMEs brasileiras somado a cross-selling de crédito, antecipação e seguros.'
      },
      profitability: {
        score: 18,
        max: 20,
        label: 'Rentabilidade',
        metrics: [
          'ROIC: 19.2%',
          'Margem Bruta: 68.4% (Software de alto valor agregado)',
          'Margem EBITDA: 26.5%',
          'Margem Líquida: 15.8%'
        ],
        justification: 'Margens brutas típicas de monopólio de software nacional com alavancagem operacional contínua.'
      },
      financialHealth: {
        score: 19,
        max: 20,
        label: 'Saúde Financeira',
        metrics: [
          'Dívida Líquida / EBITDA: 0.65x',
          'Cobertura de Juros: 11.4x',
          'Caixa e Equivalentes: R$ 2.6 bilhões',
          'Dívida com prazo médio de 4.8 anos'
        ],
        justification: 'Estrutura de capital extremamente sólida, conferindo munição para M&As seletivos sem risco de liquidez.'
      },
      cashGeneration: {
        score: 14,
        max: 15,
        label: 'Geração de Caixa',
        metrics: [
          'FCF Yield: 6.1%',
          'Conversão de EBITDA em Caixa: 94.0%',
          'Capex Leve (Asset-light puro software)',
          'Baixa Inadimplência Contratual'
        ],
        justification: 'Modelo de assinatura mensal em nuvem com alta previsibilidade e fluxo de caixa livre imediato.'
      },
      valuation: {
        score: 6,
        max: 10,
        label: 'Valuation',
        metrics: [
          'P/L Atual: 21.5x (Desconto frente a pares globais de ERP que rodam a 35x+)',
          'EV/EBITDA: 12.8x',
          'PEG Ratio: 1.08',
          'Margem de Segurança: 26.1%'
        ],
        justification: 'Múltiplos atraentes para uma líder de software SaaS com mais de 50% de market share no Brasil.'
      },
      qualityResilience: {
        score: 9,
        max: 10,
        label: 'Qualidade & Resiliência',
        metrics: [
          'Market Share ERP Brasil: >50%',
          'Taxa de Retenção Líquida (NRR): 108%',
          'Novo Mercado B3 / 100% Capital Pulverizado',
          'Ecossistema Completo (Gestão, Techfin e Business Performance)'
        ],
        justification: 'Empresa com maior fosso econômico defensivo (moat) do setor de tecnologia da América Latina.'
      }
    },
    analystVerdict: 'Totvs detém mais de 50% do mercado de ERP nacional com renovação de contratos de 98.5% e margem bruta de 68%. O valuation atual em 21.5x P/L oferece uma das melhores assimetrias do setor de tecnologia da B3.',
    asymmetryReason: 'Combinação de alta receita recorrente (SaaS), custo de troca elevado e valuation de 21.5x P/L bem abaixo da média histórica e de pares internacionais.',
    keyStrengths: [
      'Mais de 50% de participação no mercado de ERP corporativo do Brasil',
      'Receita recorrente garantida com renovação contratual de 98.5%',
      'Margem bruta de 68.4% e conversão de caixa livre superior a 90%',
      'Valuation com PEG Ratio próximo de 1.08'
    ],
    keyRisks: [
      {
        id: 'tots_r1',
        name: 'Inadimplência de PMEs em Cenário de Recessão',
        level: 'MODERADO',
        description: 'Fechamento de micro e pequenas empresas clientes da base de entrada.',
        mitigation: 'Foco prioritário em empresas médias e grandes com maior resiliência financeira.'
      },
      {
        id: 'tots_r2',
        name: 'Atraso na Rentabilização da JV com Itaú (Techfin)',
        level: 'BAIXO',
        description: 'Crescimento mais lento do que o projetado nos serviços financeiros integrados.',
        mitigation: 'Software central de ERP continua sendo a vaca leiteira geradora de caixa ininterrupta.'
      }
    ],
    triggers: [
      {
        id: 'tots_t1',
        condition: 'Churn anual consolidado ultrapassar 3.5%',
        status: 'NORMAL',
        motive: 'Indicaria vulnerabilidade competitiva ou obsolescência de produtos.',
        recommendedAnalysis: 'Auditar taxa de renovação e satisfação de clientes (NPS).'
      },
      {
        id: 'tots_t2',
        condition: 'Redução na margem bruta para menos de 60%',
        status: 'NORMAL',
        motive: 'Pressão de custos de infraestrutura ou serviços de baixa rentabilidade.',
        recommendedAnalysis: 'Reavaliar mix de produtos e custos de hospedagem cloud.'
      }
    ],
    dataConfidence: 'ALTA',
    dataSource: 'B3 / RI Totvs / DFP CVM 2024',
    lastAuditDate: '2026-08-22'
  },

  'PRIO3': {
    ticker: 'PRIO3',
    name: 'PRIO S.A. (PetroRio)',
    sector: 'Petróleo, Gás & Biocombustíveis',
    subsector: 'Exploração & Produção Independente (E&P)',
    currentPrice: 42.10,
    changePercent: 1.80,
    classification: 'GROWTH',
    growthScore: 88,
    semaphore: 'APORTAR',
    riskLevel: 'MODERADO',
    valuationStatus: 'Muito Atrativo',
    growthPace: 'Muito Forte',
    qualityRating: 'Excelente',

    revenueCagr5y: 46.5,
    revenueCagr3y: 38.2,
    profitCagr5y: 52.0,
    profitCagr3y: 41.5,
    ebitdaCagr3y: 44.0,
    roic: 26.5,
    roe: 34.0,
    netMargin: 38.2,
    grossMargin: 64.0,
    operatingMargin: 56.5,
    netDebtToEbitda: 0.80,
    interestCoverage: 12.0,
    cashPosition: 'US$ 1.1 bi em caixa e linhas de crédito',
    fcfYield: 14.5,
    fcfConversion: 82.0,
    fcfConsistency: 'Fluxo de caixa livre explosivo com lifting cost de ~US$ 7/barril',

    peRatio: 5.8,
    historicalAvgPe: 7.5,
    evEbitda: 3.6,
    pegRatio: 0.25,
    pToFcf: 6.9,
    fairPriceEstimated: 64.00,
    safetyMarginPercent: 52.0,

    moat: 'Menor custo de extração de petróleo offshore da América Latina (Lifting Cost de ~US$ 7.20/barril), equipe técnica de elite e capacidade ímpar de revitalizar campos maduros.',
    pricingPower: 'Preço 100% indexado ao Brent em dólares com liquidez imediata no mercado internacional.',
    governanceLevel: 'Novo Mercado B3 (Gestão focada em valor e remuneração alinhada por ações).',
    crisisHistory: 'Break-even em ~US$ 25/barril: mesmo com Brent despencando, a empresa segue altamente lucrativa.',

    // Pillars: 25 + 19 + 17 + 14 + 9 + 4 = 88
    pillars: {
      growth: {
        score: 25,
        max: 25,
        label: 'Crescimento',
        metrics: [
          'CAGR Receita 5 Anos: +46.5% a.a.',
          'CAGR Lucro 5 Anos: +52.0% a.a.',
          'Produção Diária Saltando para >140k boepd com campo de Wahoo',
          'Histórico Impecável de Execução em Frade e Albacora Leste'
        ],
        justification: 'O maior crescimento orgânico de produção e lucro da bolsa brasileira com novos poços e campos entrando em operação.'
      },
      profitability: {
        score: 19,
        max: 20,
        label: 'Rentabilidade',
        metrics: [
          'ROIC: 26.5%',
          'ROE: 34.0%',
          'Margem EBITDA: >70%',
          'Margem Líquida: 38.2%'
        ],
        justification: 'Rentabilidade estelar proporcionada pelo custo de extração ultrabaixo em relação à cotação do barril Brent.'
      },
      financialHealth: {
        score: 17,
        max: 20,
        label: 'Saúde Financeira',
        metrics: [
          'Dívida Líquida / EBITDA: 0.80x',
          'Desalavancagem Rápida Pós-M&A',
          'Cobertura de Juros: 12.0x',
          'Caixa em Dólares: US$ 1.1 bilhão'
        ],
        justification: 'Geração massiva de caixa permite pagar dívidas de aquisição em menos de 18 meses mantendo balanço protegido.'
      },
      cashGeneration: {
        score: 14,
        max: 15,
        label: 'Geração de Caixa',
        metrics: [
          'FCF Yield: 14.5%',
          'Conversão de Lucro em Caixa Livre: 82.0%',
          'Capex de Desenvolvimento com Payback de ~1 ano',
          'Caixa 100% Líquido em Moeda Forte (USD)'
        ],
        justification: 'Uma das maiores geradoras de fluxo de caixa livre da bolsa, operando como uma impressora de dólares.'
      },
      valuation: {
        score: 9,
        max: 10,
        label: 'Valuation',
        metrics: [
          'P/L Atual: 5.8x (Extremamente descontado)',
          'EV/EBITDA: 3.6x',
          'PEG Ratio: 0.25 (Assimetria absurda)',
          'Margem de Segurança: 52.0%'
        ],
        justification: 'Preço desconta cenários extremamente pessimistas do petróleo, oferecendo valuation de barganha para a qualidade e taxa de crescimento entregues.'
      },
      qualityResilience: {
        score: 4,
        max: 10,
        label: 'Qualidade & Resiliência',
        metrics: [
          'Exposição Direta à Volatilidade do Petróleo Brent',
          'Risco Regulatório de Licenciamento Ambiental (Ibama)',
          'Break-even Resiliente em US$ 25/barril',
          'Novo Mercado B3'
        ],
        justification: 'Negócio de altíssimo retorno, porém dependente da commodity e sujeito a licenças regulatórias de exploração offshore.'
      }
    },
    analystVerdict: 'PRIO entrega o menor custo de extração offshore da América Latina (~US$ 7/barril) com ROIC de 26.5% e P/L de 5.8x. Apresenta valuation explosivo e proteção em dólares, mantendo nível de risco moderado por se tratar de commodity.',
    asymmetryReason: 'Apresenta a maior assimetria de múltiplos da B3 (P/L de 5.8x e PEG de 0.25) combinada com crescimento de produção contratado via novos poços.',
    keyStrengths: [
      'Lifting cost de ~US$ 7/barril garante lucro mesmo se o petróleo desabar 60%',
      'Crescimento de produção contratado para os próximos anos',
      'Receitas e geração de caixa 100% em dólares norte-americanos',
      'P/L de apenas 5.8x com FCF Yield de 14.5%'
    ],
    keyRisks: [
      {
        id: 'prio_r1',
        name: 'Queda Estrutural do Preço do Barril de Petróleo Brent',
        level: 'MODERADO',
        description: 'Recessão global reduzindo a cotação do Brent para menos de US$ 50.',
        mitigation: 'Custo de extração ultrabaixo permite lucratividade saudável mesmo a US$ 40.'
      },
      {
        id: 'prio_r2',
        name: 'Atrasos no Licenciamento do Campo de Wahoo',
        level: 'MODERADO',
        description: 'Greves ou exigências adicionais de órgãos ambientais (Ibama).',
        mitigation: 'Campos atuais de Frade e Albacora Leste continuam gerando caixa pleno.'
      }
    ],
    triggers: [
      {
        id: 'prio_t1',
        condition: 'Lifting cost subir para mais de US$ 15/barril por 2 trimestres seguidos',
        status: 'NORMAL',
        motive: 'Sinal de ineficiência operacional ou problemas mecânicos em plataformas.',
        recommendedAnalysis: 'Auditar custos operacionais por campo de extração.'
      },
      {
        id: 'prio_t2',
        condition: 'Dívida Líquida / EBITDA superar 2.5x sem novos campos produtivos',
        status: 'NORMAL',
        motive: 'Alavancagem excessiva em momento de queda da commodity.',
        recommendedAnalysis: 'Reavaliar política de M&A e fluxo de amortização de debêntures.'
      }
    ],
    dataConfidence: 'ALTA',
    dataSource: 'B3 / ANP / RI PRIO / DFP CVM 2024',
    lastAuditDate: '2026-08-23'
  },

  'ITUB4': {
    ticker: 'ITUB4',
    name: 'Itaú Unibanco Holding S.A.',
    sector: 'Financeiro / Bancos',
    subsector: 'Crédito, Meios de Pagamento, Gestão & Seguros',
    currentPrice: 35.90,
    changePercent: 0.40,
    classification: 'QUALITY_COMPOUNDER',
    growthScore: 90,
    semaphore: 'APORTAR',
    riskLevel: 'BAIXO',
    valuationStatus: 'Atrativo',
    growthPace: 'Forte',
    qualityRating: 'Excepcional',

    revenueCagr5y: 13.5,
    revenueCagr3y: 14.8,
    profitCagr5y: 15.2,
    profitCagr3y: 16.5,
    ebitdaCagr3y: 15.8,
    roic: 22.5,
    roe: 22.8,
    netMargin: 24.5,
    grossMargin: 48.0,
    operatingMargin: 32.0,
    netDebtToEbitda: 0.0, // Não aplicável tradicionalmente para bancos (Índice de Basiléia 16.8%)
    interestCoverage: 25.0,
    cashPosition: 'Índice de Basiléia 16.8% (Excesso de capital regulatório)',
    fcfYield: 8.5,
    fcfConversion: 98.0,
    fcfConsistency: 'Lucro líquido superior a R$ 38 bi/ano com payout consistente',

    peRatio: 8.4,
    historicalAvgPe: 10.5,
    evEbitda: 6.5,
    pegRatio: 0.65,
    pToFcf: 8.8,
    fairPriceEstimated: 44.50,
    safetyMarginPercent: 23.9,

    moat: 'Maior banco privado da América Latina, custo de captação imbatível, liderança em tecnologia bancária, menor índice de inadimplência do setor e 70 milhões de correntistas.',
    pricingPower: 'Capacidade de precificar risco de crédito com spreads saudáveis e rentabilidade de serviços (Asset, Cartões, Seguros, Câmbio).',
    governanceLevel: 'Nível 1 B3 (Controle familiar Setubal/Villela/Moreira Salles com governança exemplar).',
    crisisHistory: 'Atravessou todas as crises da história moderna brasileira com lucros crescentes e zero dependência de socorro estatal.',

    // Pillars: 21 + 20 + 20 + 14 + 7 + 8 = 90
    pillars: {
      growth: {
        score: 21,
        max: 25,
        label: 'Crescimento',
        metrics: [
          'CAGR Lucro 5 Anos: +15.2% a.a.',
          'Crescimento da Carteira de Crédito: +10% a.a. com foco em alta renda',
          'Expansão Contínua de Receitas de Serviços e Seguros',
          'Transformação Digital Concluída (Migração Cloud de 95% dos sistemas)'
        ],
        justification: 'Ganhos de eficiência digital e expansão da carteira com foco cirúrgico em clientes de alta renda e grandes empresas.'
      },
      profitability: {
        score: 20,
        max: 20,
        label: 'Rentabilidade',
        metrics: [
          'ROE: 22.8% (O mais alto entre os grandes bancos privados)',
          'Índice de Eficiência Histórico: 39.5% (Quanto menor, melhor)',
          'Margem Financeira Gerencial em Expansão',
          'Retorno Seguro sobre o Patrimônio Líquido'
        ],
        justification: 'Liderança indiscutível em rentabilidade e eficiência no setor financeiro latino-americano.'
      },
      financialHealth: {
        score: 20,
        max: 20,
        label: 'Saúde Financeira',
        metrics: [
          'Índice de Basiléia: 16.8% (Bem acima do mínimo regulatório de 10.5%)',
          'Índice de Inadimplência 90 dias: Apenas 2.6% (O mais baixo da história)',
          'Cobertura de PDD (Provisão para Devedores): >220%',
          'Liquidez Imediata em Títulos Públicos'
        ],
        justification: 'Gestão de risco de crédito mais rigorosa e disciplinada do país com reservas de provisão excedentes.'
      },
      cashGeneration: {
        score: 14,
        max: 15,
        label: 'Geração de Caixa',
        metrics: [
          'Dividend Yield + JCP: ~7.5% a.a.',
          'Geração de Lucro Líquido Real: >R$ 38 bilhões/ano',
          'Recompra Constante de Ações no Mercado',
          'Autofinanciamento de Todo o Crescimento da Carteira'
        ],
        justification: 'Gerador colossal de lucros líquidos reais distribuídos na forma de dividendos, JCP e recompras que aumentam a fatia de cada acionista.'
      },
      valuation: {
        score: 7,
        max: 10,
        label: 'Valuation',
        metrics: [
          'P/L Atual: 8.4x (Desconto de ~20% frente à média histórica de 10.5x)',
          'P/VP: 1.65x (Justificado pelo ROE de 22.8%)',
          'PEG Ratio: 0.65',
          'Margem de Segurança: 23.9%'
        ],
        justification: 'Múltiplos muito atrativos para a maior instituição financeira do país com ROE de 22.8%.'
      },
      qualityResilience: {
        score: 8,
        max: 10,
        label: 'Qualidade & Resiliência',
        metrics: [
          'Mais de 100 anos de história sólida',
          'Ecossistema Completo (Itaú BBA, Íon, Iti, Kinea, Rede)',
          'Comportamento Impecável em Todas as Crises',
          'Governança de Padrão Internacional'
        ],
        justification: 'Um dos maiores ativos institucionais do Brasil, combinando segurança de capital com remuneração de proventos e valorização contínua.'
      }
    },
    analystVerdict: 'Itaú combina ROE de 22.8% com a menor inadimplência do setor bancário brasileiro e P/L de 8.4x. Oferece solidez inabalável de capital, crescimento composto de lucros e proventos robustos com margem de segurança favorável.',
    asymmetryReason: 'Vence pela combinação de solidez máxima (Basiléia 16.8%), ROE de 22.8% e valuation com P/L de apenas 8.4x.',
    keyStrengths: [
      'ROE líder de 22.8% com índice de eficiência operacional recorde de 39.5%',
      'Inadimplência de apenas 2.6% com cobertura de provisões de 220%',
      'Distribuição robusta de dividendos e JCP recorrentes',
      'P/L de 8.4x abaixo da média histórica'
    ],
    keyRisks: [
      {
        id: 'itub_r1',
        name: 'Aumento da Alíquota de Tributação (CSLL/JCP)',
        level: 'MODERADO',
        description: 'Mudanças legislativas que aumentem a carga tributária sobre lucros bancários.',
        mitigation: 'Capacidade histórica de recompor margens operacionais e otimizar custos.'
      },
      {
        id: 'itub_r2',
        name: 'Recessão Econômica e Inadimplência Corporativa',
        level: 'BAIXO',
        description: 'Calotes em grandes grupos empresariais em momentos de estresse de juros.',
        mitigation: 'Provisões conservadoras que cobrem mais de 2x o volume de créditos duvidosos.'
      }
    ],
    triggers: [
      {
        id: 'itub_t1',
        condition: 'ROE consolidado cair abaixo de 16% por 3 trimestres seguidos',
        status: 'NORMAL',
        motive: 'Sinalizaria perda de rentabilidade estrutural frente aos competidores.',
        recommendedAnalysis: 'Reavaliar custo de captação e margem financeira gerencial.'
      },
      {
        id: 'itub_t2',
        condition: 'Inadimplência total > 90 dias superar 4.5%',
        status: 'NORMAL',
        motive: 'Deterioração relevante na qualidade das concessões de crédito.',
        recommendedAnalysis: 'Verificar carteira de pessoa física e pequenas empresas.'
      }
    ],
    dataConfidence: 'ALTA',
    dataSource: 'B3 / Banco Central do Brasil / RI Itaú Unibanco / DFP CVM 2024',
    lastAuditDate: '2026-08-24'
  },

  'EGIE3': {
    ticker: 'EGIE3',
    name: 'Engie Brasil Energia S.A.',
    sector: 'Utilidade Pública / Energia Elétrica',
    subsector: 'Geração de Energia Renovável & Transmissão',
    currentPrice: 41.20,
    changePercent: -0.15,
    classification: 'QUALITY_COMPOUNDER',
    growthScore: 87,
    semaphore: 'APORTAR',
    riskLevel: 'BAIXO',
    valuationStatus: 'Atrativo',
    growthPace: 'Estável',
    qualityRating: 'Excelente',

    revenueCagr5y: 12.8,
    revenueCagr3y: 11.5,
    profitCagr5y: 14.0,
    profitCagr3y: 12.2,
    ebitdaCagr3y: 13.5,
    roic: 18.5,
    roe: 28.0,
    netMargin: 31.5,
    grossMargin: 56.0,
    operatingMargin: 46.0,
    netDebtToEbitda: 2.10,
    interestCoverage: 6.8,
    cashPosition: 'R$ 3.8 bi em disponibilidades e linhas contratadas',
    fcfYield: 7.8,
    fcfConversion: 95.0,
    fcfConsistency: 'Contratos de venda de energia de longo prazo com indexação ao IPCA/IGP-M',

    peRatio: 10.8,
    historicalAvgPe: 12.5,
    evEbitda: 7.2,
    pegRatio: 0.90,
    pToFcf: 11.2,
    fairPriceEstimated: 49.50,
    safetyMarginPercent: 20.1,

    moat: 'Maior geradora 100% privada de energia renovável do Brasil, contratos de venda de longo prazo (PPA) de 15 a 20 anos corrigidos por inflação e novos lotes de transmissão.',
    pricingPower: 'Receitas contratuais com repasse automático de inflação e proteção contra volatilidade do mercado spot.',
    governanceLevel: 'Novo Mercado B3 (Grupo multinacional francês Engie com mais de 100 anos).',
    crisisHistory: 'Resiliência total a crises econômicas e inflação por operar infraestrutura essencial sem risco de crédito significativo.',

    // Pillars: 20 + 19 + 17 + 14 + 8 + 9 = 87
    pillars: {
      growth: {
        score: 20,
        max: 25,
        label: 'Crescimento',
        metrics: [
          'CAGR Receita 5 Anos: +12.8% a.a.',
          'CAGR Lucro 5 Anos: +14.0% a.a.',
          'Entrada Operacional de Parques Eólicos (Santo Agostinho) e Solares (Assu Sol)',
          'Aquisição e Expansão Estratégica em Linhas de Transmissão (Gavião Real)'
        ],
        justification: 'Crescimento previsível por meio da entrega de novos projetos e diversificação estratégica da matriz energética.'
      },
      profitability: {
        score: 19,
        max: 20,
        label: 'Rentabilidade',
        metrics: [
          'ROIC: 18.5%',
          'ROE: 28.0%',
          'Margem Líquida: 31.5%',
          'Margem EBITDA: 58.0%'
        ],
        justification: 'Margens operacionais altíssimas típicas de ativos renováveis e linhas de transmissão de energia.'
      },
      financialHealth: {
        score: 17,
        max: 20,
        label: 'Saúde Financeira',
        metrics: [
          'Dívida Líquida / EBITDA: 2.10x (Perfeitamente segura para concessão regulada)',
          'Cobertura de Juros: 6.8x',
          'Vencimento Médio da Dívida: 7.2 anos',
          'Custo de Dívida Competitivo Indexado ao IPCA'
        ],
        justification: 'Alavancagem saudável e compatível com o fluxo de caixa previsível e indexado à inflação.'
      },
      cashGeneration: {
        score: 14,
        max: 15,
        label: 'Geração de Caixa',
        metrics: [
          'FCF Yield: 7.8%',
          'Dividend Yield Histórico: ~7% a 9% a.a.',
          'Conversão de EBITDA em Caixa: 95.0%',
          'Contratos de Longo Prazo Sem Risco de Inadimplência'
        ],
        justification: 'Fluxo de caixa contratado e blindado contra variações de demanda de curto prazo.'
      },
      valuation: {
        score: 8,
        max: 10,
        label: 'Valuation',
        metrics: [
          'P/L Atual: 10.8x (Desconto frente à média histórica de 12.5x)',
          'EV/EBITDA: 7.2x',
          'PEG Ratio: 0.90',
          'Margem de Segurança: 20.1%'
        ],
        justification: 'Preço atrativo para uma das empresas de serviços públicos mais eficientes e bem administradas do mundo.'
      },
      qualityResilience: {
        score: 9,
        max: 10,
        label: 'Qualidade & Resiliência',
        metrics: [
          'Matriz 100% Renovável (Hidro, Eólica, Solar e Transmissão)',
          'Contratos de 15 a 30 anos',
          'Novo Mercado B3',
          'Selo ESG Ouro e Liderança em Sustentabilidade'
        ],
        justification: 'Ativo defensivo por excelência, funcionando como uma garantia de renda e crescimento indexado à inflação.'
      }
    },
    analystVerdict: 'Engie Brasil alia margem líquida de 31.5% e ROE de 28% com contratos indexados à inflação e P/L atrativo de 10.8x. Excelente oportunidade de crescimento patrimonial com alta previsibilidade e proteção defensiva.',
    asymmetryReason: 'Oferece proteção inflacionária contratual, dividendos robustos e valuation com 20% de margem de segurança teórica.',
    keyStrengths: [
      'Contratos de longo prazo indexados ao IPCA com margem líquida de 31.5%',
      'Matriz 100% limpa e renovável sem risco de carvão ou carbono',
      'ROE de 28% e histórico impecável de distribuição de proventos',
      'P/L de 10.8x com PEG de 0.90'
    ],
    keyRisks: [
      {
        id: 'egie_r1',
        name: 'Risco Hidrológico (GSF / Secas Prolongadas)',
        level: 'MODERADO',
        description: 'Períodos de seca severa exigindo compra de energia no mercado spot.',
        mitigation: 'Diversificação intensa com usinas eólicas, solares e transmissão que mitigam a dependência de chuva.'
      },
      {
        id: 'egie_r2',
        name: 'Pressão nos Preços de Energia de Longo Prazo (PLD)',
        level: 'BAIXO',
        description: 'Excesso pontual de oferta de energia renovável no Nordeste.',
        mitigation: 'Portfólio comercial quase 100% contratado até 2028.'
      }
    ],
    triggers: [
      {
        id: 'egie_t1',
        condition: 'Dívida Líquida / EBITDA ultrapassar 3.2x',
        status: 'NORMAL',
        motive: 'Comprometeria o pagamento de dividendos e aumentaria despesas financeiras.',
        recommendedAnalysis: 'Auditar ritmo de capex e cronograma de amortizações.'
      },
      {
        id: 'egie_t2',
        condition: 'Redução na margem EBITDA para menos de 45%',
        status: 'NORMAL',
        motive: 'Impacto severo de custos de compra de energia ou corte de geração (curtailment).',
        recommendedAnalysis: 'Acompanhar dados do ONS e geração eólica regional.'
      }
    ],
    dataConfidence: 'ALTA',
    dataSource: 'B3 / Aneel / RI Engie Brasil / DFP CVM 2024',
    lastAuditDate: '2026-08-25'
  }
};
