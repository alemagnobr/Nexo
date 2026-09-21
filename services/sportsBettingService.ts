
export function getOpTimestamp(dateStr: string, timeStr?: string): number {
  try {
    let d = dateStr;
    if (d.includes('T') && d.endsWith('Z')) return new Date(d).getTime();
    if (d.includes('/')) {
      const p = d.split('/');
      if (p.length === 3) d = `${p[2]}-${p[1]}-${p[0]}`;
    }
    if (d.includes('T')) d = d.split('T')[0];
    const t = timeStr || '00:00';
    const ts = new Date(`${d}T${t}`).getTime();
    if (!isNaN(ts)) return ts;
    return new Date(dateStr).getTime() || 0;
  } catch (e) {
    return 0;
  }
}

import {
  SportsBettingData,
  SportsBettingConfig,
  SportsBetOperation,
  SportsBetStatus,
  SportsBettingVaultTransfer,
  SportsBettingProject,
  SportsBettingMultiProjectData,
  SportsBettingProjectStatus,
} from '../types';

const MULTI_STORAGE_KEY = 'nexo_sports_betting_projects_v2';
const LEGACY_STORAGE_KEY = 'nexo_sports_betting_data_v1';

export const DEFAULT_SPORTS_BETTING_CONFIG: SportsBettingConfig = {
  initialBankroll: 1000,
  currentBankroll: 1000,
  protectedVault: 0,
  stakePercentage: 3, // 3% por entrada
  compoundPercentage: 70, // 70% do lucro vai para Juros Compostos (crescimento da banca)
  protectionPercentage: 30, // 30% do lucro vai para o Cofre de Proteção (blindagem)
  minimumStake: 5,
  strategyName: 'Gestão Inteligente de Juros Compostos & Blindagem',
  notes: 'Estratégia balanceada com 70% de reinvestimento e 30% de reserva segura.',
  updatedAt: new Date().toISOString(),
};

export const COMMON_MARKETS = [
  'Over 2.5 Gols',
  'Over 1.5 Gols',
  'Under 2.5 Gols',
  'Under 3.5 Gols',
  'Ambas Marcam (BTTS) - Sim',
  'Ambas Marcam (BTTS) - Não',
  'Match Odds (1X2) - Casa',
  'Match Odds (1X2) - Fora',
  'Match Odds (1X2) - Empate',
  'Dupla Hipótese (1X / X2)',
  'Empate Anula Aposta (DNB)',
  'Handicap Asiático 0.0',
  'Handicap Asiático -0.25',
  'Handicap Asiático +0.25',
  'Handicap Asiático -0.5',
  'Handicap Asiático +0.5',
  'Handicap Asiático -1.0',
  'Escanteios / Cantos Over',
  'Escanteios / Cantos Limite',
  'Over Pontos / Linha de Pontos',
  'Moneyline / Vencedor da Partida',
  'Ambos Marcam + Over 2.5',
  'Cartões Over / Under',
  'Outro Mercado',
];

export const SPORTS_CATEGORIES = [
  { id: 'Futebol', name: 'Futebol', icon: '⚽' },
  { id: 'Basquete', name: 'Basquete', icon: '🏀' },
  { id: 'Tênis', name: 'Tênis', icon: '🎾' },
  { id: 'E-Sports', name: 'E-Sports (CS, LOL, Valorant)', icon: '🎮' },
  { id: 'Fórmula 1', name: 'Fórmula 1 / Automobilismo', icon: '🏎️' },
  { id: 'MMA / UFC', name: 'MMA / UFC / Lutas', icon: '🥊' },
  { id: 'Vôlei', name: 'Vôlei', icon: '🏐' },
  { id: 'Futebol Americano', name: 'NFL / Fut. Americano', icon: '🏈' },
  { id: 'Multi-esportes', name: 'Multi-esportes', icon: '🏆' },
  { id: 'Outros', name: 'Outros Esportes', icon: '🎯' },
];

export const BOOKMAKERS_LIST = [
  'Bet365',
  'Betano',
  'Pinnacle',
  'Betfair',
  'Stake',
  'KTO',
  'Sportingbet',
  'Superbet',
  'Novibet',
  'EstrelaBet',
  'Outra',
];

export const PROJECT_COLOR_THEMES = [
  { id: 'emerald', name: 'Verde Esmeralda', badge: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', lightBg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  { id: 'cyan', name: 'Azul Ciano', badge: 'bg-cyan-500', text: 'text-cyan-500', border: 'border-cyan-500', lightBg: 'bg-cyan-500/10' },
  { id: 'indigo', name: 'Índigo Real', badge: 'bg-indigo-500', text: 'text-indigo-500', border: 'border-indigo-500', lightBg: 'bg-indigo-50 dark:bg-indigo-950/40' },
  { id: 'violet', name: 'Violeta / Roxo', badge: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500', lightBg: 'bg-purple-50 dark:bg-purple-950/40' },
  { id: 'amber', name: 'Dourado / Âmbar', badge: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500', lightBg: 'bg-amber-50 dark:bg-amber-950/40' },
  { id: 'rose', name: 'Rosa / Carmim', badge: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500', lightBg: 'bg-rose-50 dark:bg-rose-950/40' },
  { id: 'blue', name: 'Azul Safira', badge: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500', lightBg: 'bg-blue-50 dark:bg-blue-950/40' },
];

/**
 * Cria projeto padrão inicial caso não exista nenhum
 */
function createDefaultProject(id: string = 'proj_default_1', name: string = 'Projeto Alfa - Gestão & Blindagem'): SportsBettingProject {
  return {
    id,
    name,
    description: 'Gestão balanceada com 70% para crescimento composto e 30% para cofre de proteção.',
    bookmaker: 'Bet365',
    sportFocus: 'Futebol',
    targetGoal: 5000,
    color: 'emerald',
    status: 'ACTIVE',
    config: { ...DEFAULT_SPORTS_BETTING_CONFIG },
    operations: [],
    vaultTransfers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Carrega todos os projetos salvos do Mercado Esportivo (com auto-migração do v1)
 */
export function getSportsProjectsData(): SportsBettingMultiProjectData {
  try {
    const rawMulti = localStorage.getItem(MULTI_STORAGE_KEY);
    if (rawMulti) {
      const parsed: SportsBettingMultiProjectData = JSON.parse(rawMulti);
      if (Array.isArray(parsed.projects)) {
        return {
          activeProjectId: parsed.activeProjectId || (parsed.projects[0] ? parsed.projects[0].id : null),
          projects: parsed.projects,
        };
      }
    }

    // Tenta migrar do formato legado (v1) apenas na primeira inicialização se existir
    const rawLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (rawLegacy) {
      try {
        const parsedLegacy = JSON.parse(rawLegacy);
        const legacyConfig: SportsBettingConfig = {
          ...DEFAULT_SPORTS_BETTING_CONFIG,
          ...(parsedLegacy.config || {}),
        };
        const legacyOps = Array.isArray(parsedLegacy.operations) ? parsedLegacy.operations : [];
        const legacyVault = Array.isArray(parsedLegacy.vaultTransfers) ? parsedLegacy.vaultTransfers : [];

        const migratedProject: SportsBettingProject = {
          id: `proj_${Date.now()}`,
          name: legacyConfig.strategyName || 'Projeto Principal - Gestão de Risco',
          description: legacyConfig.notes || 'Projeto migrado com histórico de entradas.',
          bookmaker: 'Bet365',
          sportFocus: 'Futebol',
          targetGoal: 5000,
          color: 'emerald',
          status: 'ACTIVE',
          config: legacyConfig,
          operations: legacyOps,
          vaultTransfers: legacyVault,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const multiData: SportsBettingMultiProjectData = {
          activeProjectId: migratedProject.id,
          projects: [migratedProject],
        };

        // Salva formato multi e remove chave legada para evitar re-migração futura
        saveSportsProjectsData(multiData);
        try {
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch (_) {}

        return multiData;
      } catch (err) {
        console.error('Erro na migração de dados esportivos legados:', err);
      }
    }

    // Se não há dados, cria o primeiro projeto padrão
    const initialDefault = createDefaultProject();
    const defaultMulti: SportsBettingMultiProjectData = {
      activeProjectId: initialDefault.id,
      projects: [initialDefault],
    };
    saveSportsProjectsData(defaultMulti);
    return defaultMulti;
  } catch (err) {
    console.error('Erro ao ler projetos de Mercado Esportivo:', err);
    return {
      activeProjectId: null,
      projects: [],
    };
  }
}

/**
 * Salva a estrutura multi-projetos no localStorage e dispara evento de sincronização
 */
export function saveSportsProjectsData(data: SportsBettingMultiProjectData): void {
  try {
    localStorage.setItem(MULTI_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('nexo_sports_betting_updated', { detail: data }));
  } catch (err) {
    console.error('Erro ao salvar projetos de Mercado Esportivo:', err);
  }
}

/**
 * Retorna o projeto esportivo ativo ou um específico pelo ID
 */
export function getActiveSportsProject(projectId?: string): SportsBettingProject {
  const multiData = getSportsProjectsData();
  if (projectId) {
    const found = multiData.projects.find((p) => p.id === projectId);
    if (found) return found;
  }
  if (multiData.activeProjectId) {
    const active = multiData.projects.find((p) => p.id === multiData.activeProjectId);
    if (active) return active;
  }
  if (multiData.projects.length > 0) {
    return multiData.projects[0];
  }
  const fresh = createDefaultProject();
  saveSportsProjectsData({ activeProjectId: fresh.id, projects: [fresh] });
  return fresh;
}

/**
 * Define o projeto ativo atual
 */
export function setActiveSportsProjectId(projectId: string | null): void {
  const multiData = getSportsProjectsData();
  multiData.activeProjectId = projectId;
  saveSportsProjectsData(multiData);
}

/**
 * Cria um novo projeto esportivo independente
 */
export function createSportsProject(params: {
  name: string;
  description?: string;
  bookmaker?: string;
  sportFocus?: string;
  targetGoal?: number;
  color?: string;
  initialBankroll: number;
  stakePercentage: number;
  compoundPercentage: number;
  protectionPercentage: number;
  minimumStake?: number;
  stopLossPercentage?: number;
  stopLossDaily?: number;
  stopGainDaily?: number;
  notes?: string;
}): SportsBettingProject {
  const multiData = getSportsProjectsData();

  const id = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const config: SportsBettingConfig = {
    initialBankroll: Number(params.initialBankroll) || 1000,
    currentBankroll: Number(params.initialBankroll) || 1000,
    protectedVault: 0,
    stakePercentage: Number(params.stakePercentage) || 3,
    compoundPercentage: Number(params.compoundPercentage) || 70,
    protectionPercentage: Number(params.protectionPercentage) || 30,
    minimumStake: Number(params.minimumStake) || 5,
    stopLossPercentage: params.stopLossPercentage ? Number(params.stopLossPercentage) : undefined,
    stopLossDaily: params.stopLossDaily ? Number(params.stopLossDaily) : undefined,
    stopGainDaily: params.stopGainDaily ? Number(params.stopGainDaily) : undefined,
    strategyName: params.name,
    notes: params.notes || params.description || '',
    updatedAt: new Date().toISOString(),
  };

  const newProject: SportsBettingProject = {
    id,
    name: params.name.trim(),
    description: params.description?.trim() || '',
    bookmaker: params.bookmaker || 'Bet365',
    sportFocus: params.sportFocus || 'Futebol',
    targetGoal: params.targetGoal ? Number(params.targetGoal) : undefined,
    color: params.color || 'emerald',
    status: 'ACTIVE',
    config,
    operations: [],
    vaultTransfers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  multiData.projects = [newProject, ...multiData.projects];
  multiData.activeProjectId = newProject.id;
  saveSportsProjectsData(multiData);
  return newProject;
}

/**
 * Atualiza propriedades e configurações de um projeto
 */
export function updateSportsProject(
  projectId: string,
  updates: Partial<SportsBettingProject>
): SportsBettingMultiProjectData {
  const multiData = getSportsProjectsData();
  multiData.projects = multiData.projects.map((p) => {
    if (p.id !== projectId) return p;

    let updatedConfig = p.config;
    if (updates.config) {
      updatedConfig = {
        ...p.config,
        ...updates.config,
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      ...p,
      ...updates,
      config: updatedConfig,
      updatedAt: new Date().toISOString(),
    };
  });

  saveSportsProjectsData(multiData);
  return multiData;
}

/**
 * Duplica um projeto mantendo as mesmas configurações e zerando o histórico de apostas
 */
export function duplicateSportsProject(projectId: string): SportsBettingProject {
  const multiData = getSportsProjectsData();
  const source = multiData.projects.find((p) => p.id === projectId) || multiData.projects[0];

  const newId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const duplicated: SportsBettingProject = {
    ...source,
    id: newId,
    name: `${source.name} (Cópia)`,
    config: {
      ...source.config,
      currentBankroll: source.config.initialBankroll,
      protectedVault: 0,
      updatedAt: new Date().toISOString(),
    },
    operations: [],
    vaultTransfers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  multiData.projects = [duplicated, ...multiData.projects];
  multiData.activeProjectId = duplicated.id;
  saveSportsProjectsData(multiData);
  return duplicated;
}

/**
 * Exclui um projeto esportivo
 */
export function deleteSportsProject(projectId: string): SportsBettingMultiProjectData {
  const multiData = getSportsProjectsData();
  multiData.projects = multiData.projects.filter((p) => p.id !== projectId);

  if (multiData.activeProjectId === projectId) {
    multiData.activeProjectId = multiData.projects.length > 0 ? multiData.projects[0].id : null;
  }

  saveSportsProjectsData(multiData);
  return multiData;
}

/**
 * Calcula o valor da próxima entrada recomendada com base na banca e exposição %
 */
export function calculateRecommendedStake(bankroll: number, stakePercentage: number, minStake: number = 0): number {
  if (bankroll <= 0) return 0;
  const rawStake = bankroll * (stakePercentage / 100);
  const rounded = Math.round(rawStake * 100) / 100;
  if (minStake > 0) {
    return Math.max(rounded, minStake > bankroll ? bankroll : minStake);
  }
  return rounded;
}

/**
 * Calcula divisão matemática de lucro de uma aposta
 */
export function calculateBetOutcome(
  stake: number,
  odds: number,
  status: SportsBetStatus,
  compoundPercentage: number,
  protectionPercentage: number
): {
  netProfit: number;
  grossReturn: number;
  compoundAmount: number;
  protectedAmount: number;
} {
  let netProfit = 0;
  let grossReturn = 0;
  let compoundAmount = 0;
  let protectedAmount = 0;

  const totalRatio = compoundPercentage + protectionPercentage > 0 ? compoundPercentage + protectionPercentage : 100;
  const compRatio = compoundPercentage / totalRatio;
  const protRatio = protectionPercentage / totalRatio;

  switch (status) {
    case 'WIN': {
      grossReturn = stake * odds;
      netProfit = grossReturn - stake;
      compoundAmount = netProfit * compRatio;
      protectedAmount = netProfit * protRatio;
      break;
    }
    case 'HALF_WIN': {
      grossReturn = (stake / 2) * odds + stake / 2;
      netProfit = (stake / 2) * (odds - 1);
      compoundAmount = netProfit * compRatio;
      protectedAmount = netProfit * protRatio;
      break;
    }
    case 'LOSS': {
      grossReturn = 0;
      netProfit = -stake;
      compoundAmount = 0;
      protectedAmount = 0;
      break;
    }
    case 'HALF_LOSS': {
      grossReturn = stake / 2;
      netProfit = -(stake / 2);
      compoundAmount = 0;
      protectedAmount = 0;
      break;
    }
    case 'VOID':
    case 'PENDING':
    default: {
      grossReturn = status === 'VOID' ? stake : 0;
      netProfit = 0;
      compoundAmount = 0;
      protectedAmount = 0;
      break;
    }
  }

  return {
    netProfit: Math.round(netProfit * 100) / 100,
    grossReturn: Math.round(grossReturn * 100) / 100,
    compoundAmount: Math.round(compoundAmount * 100) / 100,
    protectedAmount: Math.round(protectedAmount * 100) / 100,
  };
}

/**
 * Recalcula toda a linha do tempo de operações a partir do capital inicial e transferências
 */
export function recalculateEntireTimeline(
  initialBankroll: number,
  operations: SportsBetOperation[],
  vaultTransfers: SportsBettingVaultTransfer[] = [],
  compoundPercentage: number,
  protectionPercentage: number
): {
  recalculatedOps: SportsBetOperation[];
  finalBankroll: number;
  finalVault: number;
} {
  let runningBankroll = initialBankroll;
  let runningVault = 0;

  // Processa transferências manuais de cofre se houver
  vaultTransfers.forEach((t) => {
    if (t.type === 'WITHDRAWAL') {
      runningVault = Math.max(0, runningVault - t.amount);
    } else if (t.type === 'REINJECT_TO_BANKROLL') {
      runningVault = Math.max(0, runningVault - t.amount);
      runningBankroll += t.amount;
    }
  });

  // Ordena operações cronologicamente
  const sortedOps = [...operations].sort((a, b) => getOpTimestamp(a.date, a.time) - getOpTimestamp(b.date, b.time));

  const recalculatedOps = sortedOps.map((op) => {
    const bankrollBefore = runningBankroll;
    const { netProfit, grossReturn, compoundAmount, protectedAmount } = calculateBetOutcome(
      op.stake,
      op.odds,
      op.status,
      compoundPercentage,
      protectionPercentage
    );

    if (op.status === 'WIN' || op.status === 'HALF_WIN') {
      runningBankroll += compoundAmount;
      runningVault += protectedAmount;
    } else if (op.status === 'LOSS') {
      runningBankroll = Math.max(0, runningBankroll - op.stake);
    } else if (op.status === 'HALF_LOSS') {
      runningBankroll = Math.max(0, runningBankroll - op.stake / 2);
    }
    // VOID e PENDING não alteram a banca realizada

    return {
      ...op,
      netProfit,
      grossReturn,
      compoundAmount,
      protectedAmount,
      bankrollBefore: Math.round(bankrollBefore * 100) / 100,
      bankrollAfter: Math.round(runningBankroll * 100) / 100,
      vaultAfter: Math.round(runningVault * 100) / 100,
    };
  });

  return {
    recalculatedOps,
    finalBankroll: Math.round(runningBankroll * 100) / 100,
    finalVault: Math.round(runningVault * 100) / 100,
  };
}

/**
 * Retorna dados de um projeto específico para compatibilidade com os componentes
 */
export function getSportsBettingData(projectId?: string): SportsBettingData {
  const project = getActiveSportsProject(projectId);
  return {
    config: project.config,
    operations: project.operations,
    vaultTransfers: project.vaultTransfers || [],
  };
}

/**
 * Salva dados de um projeto específico
 */
export function saveSportsBettingData(data: SportsBettingData, projectId?: string): void {
  const multiData = getSportsProjectsData();
  const targetId = projectId || multiData.activeProjectId || multiData.projects[0]?.id;

  multiData.projects = multiData.projects.map((p) => {
    if (p.id !== targetId) return p;
    return {
      ...p,
      config: data.config,
      operations: data.operations,
      vaultTransfers: data.vaultTransfers,
      updatedAt: new Date().toISOString(),
    };
  });

  saveSportsProjectsData(multiData);
}

/**
 * Adiciona uma nova operação no projeto ativo ou especificado
 */
export function addSportsBetOperation(
  opInput: Omit<
    SportsBetOperation,
    'id' | 'netProfit' | 'grossReturn' | 'compoundAmount' | 'protectedAmount' | 'bankrollBefore' | 'bankrollAfter' | 'vaultAfter'
  >,
  projectId?: string
): SportsBettingData {
  const project = getActiveSportsProject(projectId);
  const { config, operations, vaultTransfers = [] } = project;

  const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const bankrollBefore = config.currentBankroll;

  const { netProfit, grossReturn, compoundAmount, protectedAmount } = calculateBetOutcome(
    opInput.stake,
    opInput.odds,
    opInput.status,
    config.compoundPercentage,
    config.protectionPercentage
  );

  let newBankroll = bankrollBefore;
  let newVault = config.protectedVault;

  if (opInput.status === 'WIN' || opInput.status === 'HALF_WIN') {
    newBankroll += compoundAmount;
    newVault += protectedAmount;
  } else if (opInput.status === 'LOSS') {
    newBankroll = Math.max(0, newBankroll - opInput.stake);
  } else if (opInput.status === 'HALF_LOSS') {
    newBankroll = Math.max(0, newBankroll - opInput.stake / 2);
  }

  const newOp: SportsBetOperation = {
    ...opInput,
    id,
    netProfit,
    grossReturn,
    compoundAmount,
    protectedAmount,
    bankrollBefore: Math.round(bankrollBefore * 100) / 100,
    bankrollAfter: Math.round(newBankroll * 100) / 100,
    vaultAfter: Math.round(newVault * 100) / 100,
  };

  const updatedOps = [newOp, ...operations];

  const { recalculatedOps, finalBankroll, finalVault } = recalculateEntireTimeline(
    config.initialBankroll,
    updatedOps,
    vaultTransfers,
    config.compoundPercentage,
    config.protectionPercentage
  );

  const updatedData: SportsBettingData = {
    config: {
      ...config,
      currentBankroll: finalBankroll,
      protectedVault: finalVault,
      updatedAt: new Date().toISOString(),
    },
    operations: recalculatedOps.reverse(),
    vaultTransfers,
  };

  saveSportsBettingData(updatedData, project.id);
  return updatedData;
}

/**
 * Atualiza uma operação existente no projeto
 */
export function updateSportsBetOperation(
  id: string,
  updatedFields: Partial<SportsBetOperation>,
  projectId?: string
): SportsBettingData {
  const project = getActiveSportsProject(projectId);
  const { config, operations, vaultTransfers = [] } = project;

  const updatedOps = operations.map((op) => {
    if (op.id !== id) return op;
    return { ...op, ...updatedFields };
  });

  const { recalculatedOps, finalBankroll, finalVault } = recalculateEntireTimeline(
    config.initialBankroll,
    updatedOps,
    vaultTransfers,
    config.compoundPercentage,
    config.protectionPercentage
  );

  const updatedData: SportsBettingData = {
    config: {
      ...config,
      currentBankroll: finalBankroll,
      protectedVault: finalVault,
      updatedAt: new Date().toISOString(),
    },
    operations: recalculatedOps.reverse(),
    vaultTransfers,
  };

  saveSportsBettingData(updatedData, project.id);
  return updatedData;
}

/**
 * Exclui uma operação e recalcula o histórico
 */
export function deleteSportsBetOperation(id: string, projectId?: string): SportsBettingData {
  const project = getActiveSportsProject(projectId);
  const { config, operations, vaultTransfers = [] } = project;

  const filteredOps = operations.filter((op) => op.id !== id);

  const { recalculatedOps, finalBankroll, finalVault } = recalculateEntireTimeline(
    config.initialBankroll,
    filteredOps,
    vaultTransfers,
    config.compoundPercentage,
    config.protectionPercentage
  );

  const updatedData: SportsBettingData = {
    config: {
      ...config,
      currentBankroll: finalBankroll,
      protectedVault: finalVault,
      updatedAt: new Date().toISOString(),
    },
    operations: recalculatedOps.reverse(),
    vaultTransfers,
  };

  saveSportsBettingData(updatedData, project.id);
  return updatedData;
}

/**
 * Atualiza configurações de risco do projeto
 */
export function updateSportsBettingConfig(
  newConfig: Partial<SportsBettingConfig>,
  reapplyToHistory: boolean = false,
  projectId?: string
): SportsBettingData {
  const project = getActiveSportsProject(projectId);
  const mergedConfig: SportsBettingConfig = {
    ...project.config,
    ...newConfig,
    updatedAt: new Date().toISOString(),
  };

  let ops = project.operations;

  if (reapplyToHistory) {
    const { recalculatedOps, finalBankroll, finalVault } = recalculateEntireTimeline(
      mergedConfig.initialBankroll,
      project.operations,
      project.vaultTransfers || [],
      mergedConfig.compoundPercentage,
      mergedConfig.protectionPercentage
    );
    mergedConfig.currentBankroll = finalBankroll;
    mergedConfig.protectedVault = finalVault;
    ops = recalculatedOps.reverse();
  }

  const updatedData: SportsBettingData = {
    config: mergedConfig,
    operations: ops,
    vaultTransfers: project.vaultTransfers || [],
  };

  saveSportsBettingData(updatedData, project.id);
  return updatedData;
}

/**
 * Realiza transferência ou saque do cofre de proteção
 */
export function recordVaultTransfer(
  type: 'WITHDRAWAL' | 'REINJECT_TO_BANKROLL',
  amount: number,
  notes?: string,
  projectId?: string
): SportsBettingData {
  const project = getActiveSportsProject(projectId);
  const { config, operations, vaultTransfers = [] } = project;

  if (amount <= 0 || amount > config.protectedVault) {
    throw new Error('Valor inválido ou saldo insuficiente no cofre.');
  }

  const newTransfer: SportsBettingVaultTransfer = {
    id: `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    date: new Date().toISOString(),
    type,
    amount,
    notes,
  };

  const updatedTransfers = [newTransfer, ...vaultTransfers];

  let newVault = config.protectedVault - amount;
  let newBankroll = config.currentBankroll;

  if (type === 'REINJECT_TO_BANKROLL') {
    newBankroll += amount;
  }

  const updatedData: SportsBettingData = {
    config: {
      ...config,
      currentBankroll: Math.round(newBankroll * 100) / 100,
      protectedVault: Math.round(newVault * 100) / 100,
      updatedAt: new Date().toISOString(),
    },
    operations,
    vaultTransfers: updatedTransfers,
  };

  saveSportsBettingData(updatedData, project.id);
  return updatedData;
}

/**
 * Reinicia o ciclo mantendo ou limpando histórico
 */
export function resetSportsBettingCycle(
  newInitialBankroll: number,
  clearHistory: boolean = false,
  projectId?: string
): SportsBettingData {
  const project = getActiveSportsProject(projectId);
  const updatedConfig: SportsBettingConfig = {
    ...project.config,
    initialBankroll: newInitialBankroll,
    currentBankroll: newInitialBankroll,
    protectedVault: 0,
    updatedAt: new Date().toISOString(),
  };

  const updatedData: SportsBettingData = {
    config: updatedConfig,
    operations: clearHistory ? [] : project.operations,
    vaultTransfers: clearHistory ? [] : project.vaultTransfers,
  };

  saveSportsBettingData(updatedData, project.id);
  return updatedData;
}

/**
 * Calcula estatísticas globais consolidadas somando todos os projetos
 */
export function getGlobalSportsStats(projects: SportsBettingProject[]) {
  const activeProjects = projects.filter((p) => p.status === 'ACTIVE');
  const allProjectsCount = projects.length;

  let totalBankrolls = 0;
  let totalVaults = 0;
  let totalInitial = 0;
  let totalOperations = 0;
  let totalWins = 0;
  let totalDecisive = 0;
  let totalNetProfit = 0;

  projects.forEach((proj) => {
    totalBankrolls += proj.config.currentBankroll || 0;
    totalVaults += proj.config.protectedVault || 0;
    totalInitial += proj.config.initialBankroll || 0;
    totalOperations += (proj.operations || []).length;

    (proj.operations || []).forEach((op) => {
      if (op.status !== 'PENDING') {
        totalNetProfit += op.netProfit || 0;
        if (op.status === 'WIN' || op.status === 'HALF_WIN') {
          totalWins += 1;
          totalDecisive += 1;
        } else if (op.status === 'LOSS' || op.status === 'HALF_LOSS') {
          totalDecisive += 1;
        }
      }
    });
  });

  const totalEquity = totalBankrolls + totalVaults;
  const globalWinRate = totalDecisive > 0 ? (totalWins / totalDecisive) * 100 : 0;
  const globalGrowthPercent = totalInitial > 0 ? ((totalEquity - totalInitial) / totalInitial) * 100 : 0;

  return {
    allProjectsCount,
    activeProjectsCount: activeProjects.length,
    totalBankrolls: Math.round(totalBankrolls * 100) / 100,
    totalVaults: Math.round(totalVaults * 100) / 100,
    totalEquity: Math.round(totalEquity * 100) / 100,
    totalInitial: Math.round(totalInitial * 100) / 100,
    totalOperations,
    totalNetProfit: Math.round(totalNetProfit * 100) / 100,
    globalWinRate: Math.round(globalWinRate * 10) / 10,
    globalGrowthPercent: Math.round(globalGrowthPercent * 10) / 10,
  };
}

/**
 * Calcula todas as estatísticas analíticas de desempenho de um projeto
 */
export function getSportsBettingStats(data: SportsBettingData) {
  const { config, operations } = data;
  const completedOps = operations.filter((op) => op.status !== 'PENDING');

  const totalOps = operations.length;
  const completedCount = completedOps.length;
  const pendingCount = operations.filter((op) => op.status === 'PENDING').length;

  const wins = completedOps.filter((op) => op.status === 'WIN').length;
  const halfWins = completedOps.filter((op) => op.status === 'HALF_WIN').length;
  const losses = completedOps.filter((op) => op.status === 'LOSS').length;
  const halfLosses = completedOps.filter((op) => op.status === 'HALF_LOSS').length;
  const voids = completedOps.filter((op) => op.status === 'VOID').length;

  const effectiveAcertos = wins + halfWins;
  const effectiveErros = losses + halfLosses;
  const decisiveOps = effectiveAcertos + effectiveErros;
  const winRate = decisiveOps > 0 ? (effectiveAcertos / decisiveOps) * 100 : 0;

  const totalStaked = completedOps.reduce((sum, op) => sum + op.stake, 0);
  const totalNetProfit = completedOps.reduce((sum, op) => sum + op.netProfit, 0);
  const totalCompoundGained = completedOps.reduce((sum, op) => sum + op.compoundAmount, 0);
  const totalProtectedGained = completedOps.reduce((sum, op) => sum + op.protectedAmount, 0);

  const roi = totalStaked > 0 ? (totalNetProfit / totalStaked) * 100 : 0;
  const totalEquity = config.currentBankroll + config.protectedVault;
  const initialEquity = config.initialBankroll;
  const equityGrowthPercent = initialEquity > 0 ? ((totalEquity - initialEquity) / initialEquity) * 100 : 0;
  const bankrollGrowthPercent = initialEquity > 0 ? ((config.currentBankroll - initialEquity) / initialEquity) * 100 : 0;

  const avgOdds = completedCount > 0 ? completedOps.reduce((sum, op) => sum + op.odds, 0) / completedCount : 0;

  let maxWin = 0;
  let maxLoss = 0;
  completedOps.forEach((op) => {
    if (op.netProfit > maxWin) maxWin = op.netProfit;
    if (op.netProfit < maxLoss) maxLoss = op.netProfit;
  });

  // Sequências atuais de vitórias/derrotas
  let currentStreakType: 'WIN' | 'LOSS' | 'NONE' = 'NONE';
  let currentStreakCount = 0;

  for (const op of operations) {
    if (op.status === 'PENDING' || op.status === 'VOID') continue;
    const isWin = op.status === 'WIN' || op.status === 'HALF_WIN';
    const type = isWin ? 'WIN' : 'LOSS';

    if (currentStreakType === 'NONE') {
      currentStreakType = type;
      currentStreakCount = 1;
    } else if (currentStreakType === type) {
      currentStreakCount += 1;
    } else {
      break;
    }
  }

  // Agrupamento por Mercado (com lucro positivo, perdas e saldo individual de cada um)
  const marketMap: Record<string, { count: number; profit: number; gains: number; losses: number; wins: number; lossCount: number }> = {};
  completedOps.forEach((op) => {
    const m = op.market || 'Outro';
    if (!marketMap[m]) marketMap[m] = { count: 0, profit: 0, gains: 0, losses: 0, wins: 0, lossCount: 0 };
    marketMap[m].count += 1;
    marketMap[m].profit += op.netProfit;
    if (op.netProfit > 0) {
      marketMap[m].gains += op.netProfit;
    } else if (op.netProfit < 0) {
      marketMap[m].losses += Math.abs(op.netProfit);
    }
    if (op.status === 'WIN' || op.status === 'HALF_WIN') marketMap[m].wins += 1;
    if (op.status === 'LOSS' || op.status === 'HALF_LOSS') marketMap[m].lossCount += 1;
  });

  const marketBreakdown = Object.entries(marketMap)
    .map(([market, val]) => ({
      market,
      count: val.count,
      profit: Math.round(val.profit * 100) / 100,
      gains: Math.round(val.gains * 100) / 100,
      losses: Math.round(val.losses * 100) / 100,
      winRate: val.count > 0 ? Math.round((val.wins / val.count) * 100) : 0,
      wins: val.wins,
      lossCount: val.lossCount,
    }))
    .sort((a, b) => b.profit - a.profit);

  // Agrupamento por Faixa de Odds (Lucro e Desempenho por Range de Cotação)
  const oddsRanges = [
    { label: '1.20 a 1.30', min: 1.20, max: 1.30 },
    { label: '1.31 a 1.40', min: 1.31, max: 1.40 },
    { label: '1.41 a 1.50', min: 1.41, max: 1.50 },
    { label: '1.51 a 1.60', min: 1.51, max: 1.60 },
    { label: '1.61 a 1.70', min: 1.61, max: 1.70 },
    { label: '1.71 a 1.80', min: 1.71, max: 1.80 },
    { label: '1.81 a 2.00', min: 1.81, max: 2.00 },
    { label: '2.01 a 2.50', min: 2.01, max: 2.50 },
    { label: '2.51+', min: 2.51, max: 999.00 },
  ];

  const oddsRangeBreakdown = oddsRanges.map((range) => {
    const matchingOps = completedOps.filter((op) => op.odds >= range.min && op.odds <= range.max);
    const count = matchingOps.length;
    const wins = matchingOps.filter((op) => op.status === 'WIN' || op.status === 'HALF_WIN').length;
    const losses = matchingOps.filter((op) => op.status === 'LOSS' || op.status === 'HALF_LOSS').length;
    const profit = matchingOps.reduce((sum, op) => sum + op.netProfit, 0);
    const gains = matchingOps.reduce((sum, op) => (op.netProfit > 0 ? sum + op.netProfit : sum), 0);
    const lossAmount = matchingOps.reduce((sum, op) => (op.netProfit < 0 ? sum + Math.abs(op.netProfit) : sum), 0);
    const winRate = count > 0 ? Math.round((wins / count) * 100) : 0;

    return {
      range: range.label,
      min: range.min,
      max: range.max,
      count,
      wins,
      losses,
      profit: Math.round(profit * 100) / 100,
      gains: Math.round(gains * 100) / 100,
      lossAmount: Math.round(lossAmount * 100) / 100,
      winRate,
    };
  }).filter((item) => item.count > 0); // Exibe faixas com operações realizadas ou todas se houver

  // Agrupamento por Esporte
  const sportMap: Record<string, { count: number; profit: number; wins: number }> = {};
  completedOps.forEach((op) => {
    const s = op.sport || 'Outros';
    if (!sportMap[s]) sportMap[s] = { count: 0, profit: 0, wins: 0 };
    sportMap[s].count += 1;
    sportMap[s].profit += op.netProfit;
    if (op.status === 'WIN' || op.status === 'HALF_WIN') sportMap[s].wins += 1;
  });

  const sportBreakdown = Object.entries(sportMap)
    .map(([sport, val]) => ({
      sport,
      count: val.count,
      profit: Math.round(val.profit * 100) / 100,
      winRate: val.count > 0 ? Math.round((val.wins / val.count) * 100) : 0,
    }))
    .sort((a, b) => b.profit - a.profit);

  // Dados para Gráfico de Evolução Patrimonial
  const chronologicalOps = [...completedOps].sort((a, b) => getOpTimestamp(a.date, a.time) - getOpTimestamp(b.date, b.time));

  const evolutionChartData = [
    {
      index: 0,
      name: 'Início',
      date: 'Início',
      bankroll: config.initialBankroll,
      vault: 0,
      totalEquity: config.initialBankroll,
      netProfit: 0,
    },
    ...chronologicalOps.map((op, idx) => ({
      index: idx + 1,
      name: `#${idx + 1} ${op.event.length > 15 ? op.event.substring(0, 15) + '...' : op.event}`,
      date: new Date(op.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      bankroll: op.bankrollAfter,
      vault: op.vaultAfter,
      totalEquity: Math.round((op.bankrollAfter + op.vaultAfter) * 100) / 100,
      netProfit: op.netProfit,
    })),
  ];

  // Maior banca ativa histórica alcançada (Trailing Peak)
  // Segue sempre o maior valor atingido (banca inicial, evolução das operações ou banca atual)
  const bankrollHistory = [
    config.initialBankroll,
    config.currentBankroll,
    ...completedOps.map((op) => op.bankrollAfter ?? 0),
    ...completedOps.map((op) => op.bankrollBefore ?? 0),
  ];
  const peakBankroll = Math.max(...bankrollHistory, 0);

  const stopLossPercentage = config.stopLossPercentage ? Number(config.stopLossPercentage) : undefined;
  
  // Piso do Stop Loss: nível mínimo que a banca pode atingir antes de estourar o stop loss
  // Ex: Maior banca alcançada = R$ 2,30 com stop loss de 50% => Perda máxima de R$ 1,15 => Piso = R$ 1,15
  const stopLossFloor = (stopLossPercentage !== undefined && stopLossPercentage > 0)
    ? Math.max(0, Math.round(peakBankroll * (1 - stopLossPercentage / 100) * 100) / 100)
    : undefined;

  const maxAllowedLoss = (stopLossPercentage !== undefined && stopLossPercentage > 0)
    ? Math.round(peakBankroll * (stopLossPercentage / 100) * 100) / 100
    : undefined;

  // Queda atual a partir da maior banca histórica (Drawdown do topo)
  const currentDrawdown = peakBankroll > 0
    ? Math.max(0, Math.round(((peakBankroll - config.currentBankroll) / peakBankroll) * 1000) / 10)
    : 0;
  const currentDrawdownAmount = Math.max(0, Math.round((peakBankroll - config.currentBankroll) * 100) / 100);

  // Indica se a banca atingiu ou rompeu o piso do Stop Loss
  const isStopLossTriggered = (stopLossFloor !== undefined) && (config.currentBankroll <= stopLossFloor);

  // Margem restante até o corte do Stop Loss
  const stopLossMargin = stopLossFloor !== undefined
    ? Math.round((config.currentBankroll - stopLossFloor) * 100) / 100
    : undefined;

  return {
    totalOps,
    completedCount,
    pendingCount,
    wins,
    halfWins,
    losses,
    halfLosses,
    voids,
    winRate: Math.round(winRate * 10) / 10,
    totalStaked: Math.round(totalStaked * 100) / 100,
    totalNetProfit: Math.round(totalNetProfit * 100) / 100,
    totalCompoundGained: Math.round(totalCompoundGained * 100) / 100,
    totalProtectedGained: Math.round(totalProtectedGained * 100) / 100,
    roi: Math.round(roi * 100) / 100,
    totalEquity: Math.round(totalEquity * 100) / 100,
    equityGrowthPercent: Math.round(equityGrowthPercent * 10) / 10,
    bankrollGrowthPercent: Math.round(bankrollGrowthPercent * 10) / 10,
    avgOdds: Math.round(avgOdds * 100) / 100,
    maxWin: Math.round(maxWin * 100) / 100,
    maxLoss: Math.round(maxLoss * 100) / 100,
    peakBankroll: Math.round(peakBankroll * 100) / 100,
    stopLossPercentage,
    stopLossFloor,
    maxAllowedLoss,
    currentDrawdown,
    currentDrawdownAmount,
    isStopLossTriggered,
    stopLossMargin,
    currentStreakType,
    currentStreakCount,
    marketBreakdown,
    oddsRangeBreakdown,
    sportBreakdown,
    evolutionChartData,
  };
}

/**
 * Simula projeção futura de crescimento com juros compostos e proteção de risco
 */
export function simulateCompoundGrowth(params: {
  initialBankroll: number;
  stakePercentage: number;
  compoundPercentage: number;
  protectionPercentage: number;
  winRate: number;
  avgOdds: number;
  numEntries: number;
}): {
  finalBankroll: number;
  finalVault: number;
  finalTotalEquity: number;
  totalNetProfit: number;
  timeline: {
    entry: number;
    bankroll: number;
    vault: number;
    totalEquity: number;
    recommendedStake: number;
  }[];
} {
  const {
    initialBankroll,
    stakePercentage,
    compoundPercentage,
    protectionPercentage,
    winRate,
    avgOdds,
    numEntries,
  } = params;

  let currentBankroll = initialBankroll;
  let protectedVault = 0;
  const timeline = [
    {
      entry: 0,
      bankroll: Math.round(currentBankroll * 100) / 100,
      vault: 0,
      totalEquity: Math.round(currentBankroll * 100) / 100,
      recommendedStake: calculateRecommendedStake(currentBankroll, stakePercentage),
    },
  ];

  const totalRatio = compoundPercentage + protectionPercentage > 0 ? compoundPercentage + protectionPercentage : 100;
  const compRatio = compoundPercentage / totalRatio;
  const protRatio = protectionPercentage / totalRatio;

  const winProb = winRate / 100;
  const lossProb = 1 - winProb;

  for (let i = 1; i <= numEntries; i++) {
    const stake = calculateRecommendedStake(currentBankroll, stakePercentage);

    const expectedWinNet = stake * (avgOdds - 1);
    const expectedLossNet = -stake;

    const weightedCompound = expectedWinNet * compRatio * winProb + expectedLossNet * lossProb;
    const weightedProtection = expectedWinNet * protRatio * winProb;

    currentBankroll = Math.max(0, currentBankroll + weightedCompound);
    protectedVault += Math.max(0, weightedProtection);

    timeline.push({
      entry: i,
      bankroll: Math.round(currentBankroll * 100) / 100,
      vault: Math.round(protectedVault * 100) / 100,
      totalEquity: Math.round((currentBankroll + protectedVault) * 100) / 100,
      recommendedStake: calculateRecommendedStake(currentBankroll, stakePercentage),
    });
  }

  const finalBankroll = Math.round(currentBankroll * 100) / 100;
  const finalVault = Math.round(protectedVault * 100) / 100;
  const finalTotalEquity = Math.round((finalBankroll + finalVault) * 100) / 100;
  const totalNetProfit = Math.round((finalTotalEquity - initialBankroll) * 100) / 100;

  return {
    finalBankroll,
    finalVault,
    finalTotalEquity,
    totalNetProfit,
    timeline,
  };
}
