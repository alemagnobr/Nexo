import React, { useState, useEffect, useMemo } from 'react';
import {
  SportsBettingProject,
  SportsBettingMultiProjectData,
  SportsBettingProjectStatus,
  SportsBettingConfig,
  SportsBetOperation,
  SportsBetStatus,
  View,
} from '../types';
import {
  getSportsProjectsData,
  saveSportsProjectsData,
  getActiveSportsProject,
  setActiveSportsProjectId,
  createSportsProject,
  updateSportsProject,
  deleteSportsProject,
  duplicateSportsProject,
  getGlobalSportsStats,
  getSportsBettingData,
  addSportsBetOperation,
  updateSportsBetOperation,
  deleteSportsBetOperation,
  updateSportsBettingConfig,
  recordVaultTransfer,
  resetSportsBettingCycle,
  getSportsBettingStats,
  getOpTimestamp,
  simulateCompoundGrowth,
  calculateRecommendedStake,
  SPORTS_CATEGORIES,
  PROJECT_COLOR_THEMES,
  BOOKMAKERS_LIST,
} from '../services/sportsBettingService';
import { SportsBettingOperationModal } from './SportsBettingOperationModal';
import { SportsBettingConfigModal } from './SportsBettingConfigModal';
import { SportsBettingVaultModal } from './SportsBettingVaultModal';
import { SportsBettingProjectModal } from './SportsBettingProjectModal';
import {
  Trophy,
  Plus,
  Sliders,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Percent,
  Calculator,
  Target,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Download,
  Trash2,
  Edit2,
  Copy,
  Flame,
  BarChart3,
  PieChart as PieIcon,
  HelpCircle,
  RotateCcw,
  Zap,
  Lock,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  FolderPlus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import { toast } from 'sonner';

interface MercadoEsportivoViewProps {
  privacyMode?: boolean;
  onNavigate?: (view: View) => void;
  investments?: any[];
  onAddTransaction?: (transaction: any) => void;
  onUpdateInvestment?: (id: string, updates: any) => void;
}

type TabType = 'OPERATIONS' | 'CHARTS' | 'SIMULATOR' | 'VAULT_STATEMENT' | 'SETTINGS';

export const MercadoEsportivoView: React.FC<MercadoEsportivoViewProps> = ({
  privacyMode = false,
  onNavigate,
  investments = [],
  onAddTransaction,
  onUpdateInvestment,
}) => {
  const [multiData, setMultiData] = useState<SportsBettingMultiProjectData>(() => getSportsProjectsData());
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('OPERATIONS');

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<SportsBettingProject | null>(null);

  const [isOpModalOpen, setIsOpModalOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<SportsBetOperation | null>(null);
  const [opTargetProjectId, setOpTargetProjectId] = useState<string | null>(null);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);

  // Hub filters
  const [hubStatusFilter, setHubStatusFilter] = useState<string>('ALL');
  const [hubSearchTerm, setHubSearchTerm] = useState('');

  // Operations inside project filters
  const [opStatusFilter, setOpStatusFilter] = useState<'ALL' | SportsBetStatus>('ALL');
  const [opSportFilter, setOpSportFilter] = useState<string>('ALL');
  const [opSearchTerm, setOpSearchTerm] = useState('');

  // Simulator state
  const [simEntries, setSimEntries] = useState<number>(30);
  const [simWinRate, setSimWinRate] = useState<number>(60);
  const [simOdds, setSimOdds] = useState<number>(1.85);

  // Synchronize state on custom events
  useEffect(() => {
    const handleUpdate = () => {
      setMultiData(getSportsProjectsData());
    };
    window.addEventListener('nexo_sports_betting_updated', handleUpdate);
    return () => window.removeEventListener('nexo_sports_betting_updated', handleUpdate);
  }, []);

  // Current active project if one is selected
  const activeProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return multiData.projects.find((p) => p.id === selectedProjectId) || null;
  }, [multiData, selectedProjectId]);

  // If selected project was deleted, reset back to Hub view automatically
  useEffect(() => {
    if (selectedProjectId && !multiData.projects.some((p) => p.id === selectedProjectId)) {
      setSelectedProjectId(null);
    }
  }, [multiData.projects, selectedProjectId]);

  const globalStats = useMemo(() => {
    return getGlobalSportsStats(multiData.projects);
  }, [multiData]);

  // Project-specific data & stats
  const projectData = useMemo(() => {
    if (!activeProject) return null;
    return {
      config: activeProject.config,
      operations: activeProject.operations,
      vaultTransfers: activeProject.vaultTransfers || [],
    };
  }, [activeProject]);

  const projectStats = useMemo(() => {
    if (!projectData) return null;
    return getSportsBettingStats(projectData);
  }, [projectData]);

  const recommendedStake = useMemo(() => {
    if (!activeProject) return 0;
    return calculateRecommendedStake(
      activeProject.config.currentBankroll,
      activeProject.config.stakePercentage
    );
  }, [activeProject]);

  // ==========================================
  // PROJECT CRUD HANDLERS
  // ==========================================
  const handleOpenNewProject = () => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (proj: SportsBettingProject, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProject(proj);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = (projectFormData: any) => {
    if (editingProject) {
      const updated = updateSportsProject(editingProject.id, projectFormData);
      setMultiData(updated);
      toast.success('Projeto atualizado com sucesso!');
    } else {
      const newProj = createSportsProject(projectFormData);
      setMultiData(getSportsProjectsData());
      setSelectedProjectId(newProj.id);
      toast.success(`Projeto "${newProj.name}" criado com sucesso!`);
    }
    setIsProjectModalOpen(false);
    setEditingProject(null);
  };

  const handleDuplicateProject = (projId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const duplicated = duplicateSportsProject(projId);
    setMultiData(getSportsProjectsData());
    toast.success(`Projeto duplicado: "${duplicated.name}"`);
  };

  const handleDeleteProject = (projId: string, projName: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const updated = deleteSportsProject(projId);
    setMultiData(updated);
    if (selectedProjectId === projId) {
      setSelectedProjectId(null);
    }
    setIsProjectModalOpen(false);
    setIsConfigModalOpen(false);
    setEditingProject(null);
    toast.success(`Projeto "${projName}" excluído.`);
  };

  // ==========================================
  // OPERATIONS HANDLERS
  // ==========================================
  const handleOpenAddOp = (targetProjId?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const pid = targetProjId || selectedProjectId || multiData.projects[0]?.id;
    setOpTargetProjectId(pid);
    setEditingOp(null);
    setIsOpModalOpen(true);
  };

  const handleOpenEditOp = (op: SportsBetOperation) => {
    setOpTargetProjectId(selectedProjectId);
    setEditingOp(op);
    setIsOpModalOpen(true);
  };

  const handleSaveOperation = (opData: any) => {
    const targetId = opTargetProjectId || selectedProjectId || multiData.projects[0]?.id;
    if (!targetId) return;

    if (editingOp) {
      updateSportsBetOperation(editingOp.id, opData, targetId);
      setMultiData(getSportsProjectsData());
      toast.success('Operação atualizada com sucesso!');
    } else {
      const targetProject = multiData.projects.find(p => p.id === targetId);
      const previousVault = targetProject?.config.protectedVault || 0;

      addSportsBetOperation(opData, targetId);
      
      const updatedData = getSportsProjectsData();
      setMultiData(updatedData);

      const updatedProject = updatedData.projects.find(p => p.id === targetId);
      const newVault = updatedProject?.config.protectedVault || 0;
      const protectionAdded = newVault - previousVault;

      if (opData.status === 'WIN' && protectionAdded > 0 && updatedProject?.config.protectionInvestmentId && onUpdateInvestment) {
        const invId = updatedProject.config.protectionInvestmentId;
        const targetInvestment = investments.find(inv => inv.id === invId);
        if (targetInvestment) {
          const newAmount = (targetInvestment.amount || 0) + protectionAdded;
          
          // Optionally, add to its history if the type supports it, but updateInvestment handles amount
          const historyEntry = {
            id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            date: new Date().toISOString().split('T')[0],
            amount: protectionAdded,
            type: 'contribution'
          };
          
          const updatedHistory = targetInvestment.history ? [...targetInvestment.history, historyEntry] : [historyEntry];

          onUpdateInvestment(invId, { 
            amount: newAmount,
            history: updatedHistory
          });
          toast.success(`🎉 Green registrado! Proteção de R$ ${protectionAdded.toFixed(2)} enviada para: ${targetInvestment.name}`);
        } else {
          toast.success(`🎉 Green registrado! (Ativo de proteção não encontrado)`);
        }
      } else {
        toast.success(
          opData.status === 'WIN'
            ? '🎉 Green registrado! Juros Compostos e Proteção aplicados!'
            : 'Operação registrada com sucesso!'
        );
      }
    }
    setIsOpModalOpen(false);
    setEditingOp(null);
  };

  const handleDeleteOp = (id: string) => {
    if (!selectedProjectId) return;
    if (confirm('Deseja excluir esta operação do histórico? Os saldos serão recalculados.')) {
      deleteSportsBetOperation(id, selectedProjectId);
      setMultiData(getSportsProjectsData());
      toast.success('Operação excluída.');
    }
  };

  const handleQuickLiquidate = (op: SportsBetOperation, newStatus: SportsBetStatus) => {
    if (!selectedProjectId) return;
    updateSportsBetOperation(op.id, { status: newStatus }, selectedProjectId);
    setMultiData(getSportsProjectsData());
    toast.success(`Operação liquidada como ${newStatus}!`);
  };

  const handleSaveConfig = (newConfig: Partial<SportsBettingConfig>, reapply: boolean) => {
    if (!selectedProjectId) return;
    updateSportsBettingConfig(newConfig, reapply, selectedProjectId);
    setMultiData(getSportsProjectsData());
    toast.success('Configurações salvas!');
  };

  const handleResetCycle = (initial: number, clearHist: boolean) => {
    if (!selectedProjectId) return;
    resetSportsBettingCycle(initial, clearHist, selectedProjectId);
    setMultiData(getSportsProjectsData());
    toast.success('Ciclo reiniciado com sucesso.');
  };

  const handleVaultTransfer = (type: 'WITHDRAWAL' | 'REINJECT_TO_BANKROLL', amount: number, notes?: string) => {
    if (!selectedProjectId) return;
    recordVaultTransfer(type, amount, notes, selectedProjectId);
    setMultiData(getSportsProjectsData());
    setIsVaultModalOpen(false);
    toast.success(type === 'WITHDRAWAL' ? 'Saque registrado!' : 'Reinjeção na banca realizada!');
  };

  // Export CSV
  const handleExportCSV = (specificProjectId?: string) => {
    let opsToExport: { op: SportsBetOperation; projectName: string }[] = [];

    if (specificProjectId) {
      const proj = multiData.projects.find((p) => p.id === specificProjectId);
      if (proj) {
        opsToExport = (proj.operations || []).map((op) => ({ op, projectName: proj.name }));
      }
    } else {
      multiData.projects.forEach((proj) => {
        (proj.operations || []).forEach((op) => {
          opsToExport.push({ op, projectName: proj.name });
        });
      });
    }

    if (opsToExport.length === 0) {
      toast.error('Nenhuma operação para exportar.');
      return;
    }

    const headers = [
      'Projeto',
      'Data',
      'Evento',
      'Esporte',
      'Mercado',
      'Odd',
      'Stake (R$)',
      'Status',
      'Lucro Líquido (R$)',
      'Juros Compostos (R$)',
      'Proteção Risco (R$)',
      'Banca Após (R$)',
      'Cofre Após (R$)',
      'Notas',
    ];

    const rows = opsToExport.map(({ op, projectName }) => [
      `"${projectName.replace(/"/g, '""')}"`,
      op.date,
      `"${op.event.replace(/"/g, '""')}"`,
      `"${op.sport || ''}"`,
      `"${op.market.replace(/"/g, '""')}"`,
      op.odds,
      op.stake,
      op.status,
      op.netProfit,
      op.compoundAmount,
      op.protectedAmount,
      op.bankrollAfter,
      op.vaultAfter,
      `"${(op.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `nexo_mercado_esportivo_${specificProjectId ? 'projeto' : 'consolidado'}_${
        new Date().toISOString().split('T')[0]
      }.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Relatório CSV exportado com sucesso!');
  };

  // Filtered projects in Hub view
  const filteredProjects = useMemo(() => {
    return multiData.projects.filter((proj) => {
      if (hubStatusFilter !== 'ALL' && proj.status !== hubStatusFilter) return false;
      if (hubSearchTerm.trim()) {
        const term = hubSearchTerm.toLowerCase();
        const matchName = proj.name.toLowerCase().includes(term);
        const matchBookmaker = (proj.bookmaker || '').toLowerCase().includes(term);
        const matchSport = (proj.sportFocus || '').toLowerCase().includes(term);
        const matchDesc = (proj.description || '').toLowerCase().includes(term);
        if (!matchName && !matchBookmaker && !matchSport && !matchDesc) return false;
      }
      return true;
    });
  }, [multiData.projects, hubStatusFilter, hubSearchTerm]);

  // Filtered operations in project view
  const filteredOperations = useMemo(() => {
    if (!activeProject) return [];
    const ops = activeProject.operations.filter((op) => {
      if (opStatusFilter !== 'ALL' && op.status !== opStatusFilter) return false;
      if (opSportFilter !== 'ALL' && op.sport !== opSportFilter) return false;
      if (opSearchTerm.trim()) {
        const term = opSearchTerm.toLowerCase();
        const matchEvent = op.event.toLowerCase().includes(term);
        const matchMarket = op.market.toLowerCase().includes(term);
        const matchNotes = (op.notes || '').toLowerCase().includes(term);
        const matchComp = (op.competition || '').toLowerCase().includes(term);
        if (!matchEvent && !matchMarket && !matchNotes && !matchComp) return false;
      }
      return true;
    });

    // Sort by date (newest first). If same date, use time or maintain order.
    return ops.sort((a, b) => getOpTimestamp(b.date, b.time) - getOpTimestamp(a.date, a.time));
  }, [activeProject, opStatusFilter, opSportFilter, opSearchTerm]);

  // Simulator calculation for active project
  const simulationResult = useMemo(() => {
    if (!activeProject) return null;
    return simulateCompoundGrowth({
      initialBankroll: activeProject.config.currentBankroll,
      stakePercentage: activeProject.config.stakePercentage,
      compoundPercentage: activeProject.config.compoundPercentage,
      protectionPercentage: activeProject.config.protectionPercentage,
      winRate: simWinRate,
      avgOdds: simOdds,
      numEntries: simEntries,
    });
  }, [activeProject, simWinRate, simOdds, simEntries]);

  // Pie chart data for active project
  const pieData = useMemo(() => {
    if (!projectStats) return [];
    return [
      { name: 'Greens', value: projectStats.wins + projectStats.halfWins, color: '#10b981' },
      { name: 'Reds', value: projectStats.losses + projectStats.halfLosses, color: '#f43f5e' },
      { name: 'Devolvidas / Void', value: projectStats.voids, color: '#64748b' },
    ].filter((item) => item.value > 0);
  }, [projectStats]);

  // Project for OpModal target
  const opModalTargetProject = useMemo(() => {
    const targetId = opTargetProjectId || selectedProjectId || multiData.projects[0]?.id;
    return multiData.projects.find((p) => p.id === targetId) || multiData.projects[0];
  }, [multiData, opTargetProjectId, selectedProjectId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ========================================================================= */}
      {/* VIEW 1: HUB DE PROJETOS ESPORTIVOS (VISÃO GERAL / MULTI-PROJETOS)           */}
      {/* ========================================================================= */}
      {!selectedProjectId && (
        <div className="space-y-6">
          {/* Header do Hub */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800/80 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700/80 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="p-4 rounded-3xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shadow-sm">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                    Mercado Esportivo
                  </h1>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 tracking-wider uppercase">
                    Visão Geral
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
                  Gerencie múltiplos projetos e bancas simultâneas aplicando estratégias de juros compostos e blindagem de capital.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 relative z-10">
              <button
                onClick={() => handleExportCSV()}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2"
                title="Exportar dados de todos os projetos em CSV"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>
              <button
                onClick={handleOpenNewProject}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Novo Projeto</span>
              </button>
            </div>
          </div>

          {/* Banner de Métricas Globais Consolidadas */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Total em Bancas */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total em Bancas</span>
                <DollarSign className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
                {privacyMode
                  ? '••••••'
                  : `R$ ${globalStats.totalBankrolls.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </div>
              <span className="text-[10px] font-medium text-slate-400">Capital Ativo de Giro</span>
            </div>

            {/* Total no Cofre */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Cofres Blindados</span>
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">
                {privacyMode
                  ? '••••••'
                  : `R$ ${globalStats.totalVaults.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </div>
              <span className="text-[10px] font-medium text-slate-400">Reserva Segura</span>
            </div>

            {/* Patrimônio Total */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-teal-200 dark:border-teal-900/60 shadow-sm bg-gradient-to-br from-teal-500/5 to-emerald-500/5">
              <div className="flex items-center justify-between text-teal-600 dark:text-teal-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Patrimônio Total</span>
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-base sm:text-lg font-black text-teal-600 dark:text-teal-400">
                {privacyMode
                  ? '••••••'
                  : `R$ ${globalStats.totalEquity.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </div>
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                {globalStats.globalGrowthPercent >= 0 ? '+' : ''}
                {globalStats.globalGrowthPercent.toFixed(1)}% vs Inicial
              </span>
            </div>

            {/* Lucro Líquido Global */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Lucro Líquido</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div
                className={`text-base sm:text-lg font-black ${
                  globalStats.totalNetProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {privacyMode
                  ? '••••••'
                  : `${globalStats.totalNetProfit >= 0 ? '+' : ''}R$ ${globalStats.totalNetProfit.toLocaleString(
                      'pt-BR',
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}`}
              </div>
              <span className="text-[10px] font-medium text-slate-400">Acumulado Geral</span>
            </div>

            {/* Win Rate Global */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Taxa de Acerto</span>
                <Target className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
                {globalStats.globalWinRate.toFixed(1)}%
              </div>
              <span className="text-[10px] font-medium text-slate-400">Win Rate Geral</span>
            </div>

            {/* Projetos Ativos */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Projetos</span>
                <Layers className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
                {globalStats.activeProjectsCount}{' '}
                <span className="text-xs font-normal text-slate-400">/ {globalStats.allProjectsCount}</span>
              </div>
              <span className="text-[10px] font-medium text-slate-400">
                {globalStats.totalOperations} operações
              </span>
            </div>
          </div>

          {/* Filtros e Busca do Hub */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar projeto por nome, casa ou esporte..."
                value={hubSearchTerm}
                onChange={(e) => setHubSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'ALL', label: 'Todos os Projetos' },
                { id: 'ACTIVE', label: '🟢 Ativos' },
                { id: 'PAUSED', label: '🟡 Pausados' },
                { id: 'COMPLETED', label: '🔵 Concluídos' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setHubStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    hubStatusFilter === st.id
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Cards de Projetos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((proj) => {
              const pStats = getSportsBettingStats({
                config: proj.config,
                operations: proj.operations,
                vaultTransfers: proj.vaultTransfers || [],
              });

              const targetProgress = proj.targetGoal
                ? Math.min(100, Math.max(0, (pStats.totalEquity / proj.targetGoal) * 100))
                : null;

              const theme =
                PROJECT_COLOR_THEMES.find((t) => t.id === proj.color) || PROJECT_COLOR_THEMES[0];

              return (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className="bg-white dark:bg-slate-800/80 rounded-[2rem] border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-lg hover:border-teal-400 dark:hover:border-teal-500 transition-all cursor-pointer flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-6 space-y-5 flex-1">
                    {/* Header do Card */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${theme.badge.split(' ')[0]}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            {proj.bookmaker || 'Bet365'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400">
                            {proj.sportFocus || 'Futebol'}
                          </span>
                          {proj.status === 'PAUSED' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              Pausado
                            </span>
                          )}
                          {proj.status === 'COMPLETED' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              Meta Atingida
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1 tracking-tight">
                          {proj.name}
                        </h3>
                      </div>
                      
                      {/* Dropdown / Quick Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleOpenEditProject(proj, e)}
                          className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                          title="Editar Configurações do Projeto"
                        >
                          <Sliders className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteProject(proj.id, proj.name, e)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                          title="Excluir Projeto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {proj.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {proj.description}
                      </p>
                    )}

                    {/* Bloco de Saldos: Banca Ativa vs. Cofre Blindado */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-widest mb-1">Banca Ativa</span>
                        <span className="text-base font-black text-slate-800 dark:text-white">
                          {privacyMode
                            ? '••••••'
                            : `R$ ${proj.config.currentBankroll.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
                        <span className="text-[10px] text-indigo-500 dark:text-indigo-400 block font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Cofre Seguro
                        </span>
                        <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                          {privacyMode
                            ? '••••••'
                            : `R$ ${proj.config.protectedVault.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`}
                        </span>
                      </div>
                    </div>

                    {/* Barra de Progresso da Meta */}
                    {proj.targetGoal && targetProgress !== null && (
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-500 dark:text-slate-400">
                            Meta: R$ {proj.targetGoal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-teal-600 dark:text-teal-400">{targetProgress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-teal-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${targetProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Resumo da Estratégia & Performance */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        Stk <strong>{proj.config.stakePercentage}%</strong> •{' '}
                        <span className="text-teal-600 dark:text-teal-400 font-bold">{proj.config.compoundPercentage}%</span> /{' '}
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{proj.config.protectionPercentage}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-emerald-500 font-bold">{pStats.wins}W</span>
                        <span className="text-rose-500 font-bold">{pStats.losses}L</span>
                        <span className="text-slate-800 dark:text-white font-black ml-1">{pStats.winRate.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Card Action Buttons */}
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                    <button
                      onClick={(e) => handleOpenAddOp(proj.id, e)}
                      className="px-4 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nova Entrada</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-1 transition-transform">
                      <span>Gerenciar</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Card de Adicionar Novo Projeto */}
            <div
              onClick={handleOpenNewProject}
              className="bg-slate-50/50 dark:bg-slate-800/30 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 p-8 flex flex-col items-center justify-center text-center gap-4 cursor-pointer transition-all group min-h-[300px]"
            >
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all">
                <FolderPlus className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  Criar Novo Projeto / Banca
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs">
                  Configure capital inicial, porcentagem de stake, juros compostos e blindagem para uma nova estratégia simultânea.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: DETALHES DO PROJETO SELECIONADO (OPERAÇÕES, GESTÃO & ANÁLISE)     */}
      {/* ========================================================================= */}
      {selectedProjectId && activeProject && projectStats && (
        <div className="space-y-6 animate-in fade-in-down duration-500">
          {/* Hero Header Area for Active Project */}
          <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] border border-slate-800 shadow-xl p-6 sm:p-8">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            
            <div className="relative z-10">
              {/* Back & Switcher row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-800/80 pb-6">
                <button
                  onClick={() => setSelectedProjectId(null)}
                  className="group flex items-center gap-2.5 text-sm font-bold text-slate-400 hover:text-teal-400 transition-colors w-fit"
                >
                  <div className="p-2 rounded-xl bg-slate-800 group-hover:bg-teal-500/20 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  <span>Visão Geral</span>
                </button>
                
                <div className="relative">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-black text-slate-300 focus:outline-none focus:border-teal-500/50 cursor-pointer"
                  >
                    {multiData.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        Mudar para: {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold px-3 py-1 rounded-lg bg-teal-500/10 text-teal-400 uppercase tracking-widest border border-teal-500/20">
                      {activeProject.sportFocus || 'Futebol'}
                    </span>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-lg bg-slate-800 text-slate-400 uppercase tracking-widest border border-slate-700">
                      {activeProject.bookmaker || 'Bet365'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                      {activeProject.name}
                    </h2>
                    {activeProject.description && (
                      <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed mt-2">
                        {activeProject.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Core Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setIsVaultModalOpen(true)}
                    className="px-4 py-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-sm font-bold transition-all flex items-center gap-2"
                  >
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    <span>Cofre Blindado (R$ {activeProject.config.protectedVault.toFixed(0)})</span>
                  </button>
                  
                  <button
                    onClick={() => setIsConfigModalOpen(true)}
                    className="p-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                    title="Configurar Projeto"
                  >
                    <Sliders className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => handleOpenAddOp(activeProject.id)}
                    className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-900 text-sm font-black shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Nova Entrada</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Banner de KPIs do Projeto Específico */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Card 1: Banca Ativa */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Banca Ativa</span>
                <DollarSign className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
                {privacyMode
                  ? '••••••'
                  : `R$ ${activeProject.config.currentBankroll.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </div>
              <span className="text-[10px] text-slate-400 block font-medium">
                Inicial: R$ {activeProject.config.initialBankroll.toFixed(2)}
              </span>
            </div>

            {/* Card 2: Cofre de Proteção Blindado */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 shadow-sm bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
              <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Cofre Seguro
                </span>
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400">
                {privacyMode
                  ? '••••••'
                  : `R$ ${activeProject.config.protectedVault.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </div>
              <span className="text-[10px] text-indigo-500/80 font-bold block">
                {activeProject.config.protectionPercentage}% de blindagem
              </span>
            </div>

            {/* Card 3: Próxima Entrada Recomendada */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-teal-200 dark:border-teal-900/60 shadow-sm bg-gradient-to-br from-teal-500/5 to-emerald-500/5">
              <div className="flex items-center justify-between text-teal-600 dark:text-teal-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5" />
                  Stake Sugerida
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/20">
                  {activeProject.config.stakePercentage}%
                </span>
              </div>
              <div className="text-lg sm:text-xl font-black text-teal-600 dark:text-teal-400">
                {privacyMode
                  ? '••••••'
                  : `R$ ${recommendedStake.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </div>
              <span className="text-[10px] text-slate-400 font-medium block">
                Gestão calculada na banca
              </span>
            </div>

            {/* Card 4: Lucro Líquido Realizado */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Lucro Líquido</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div
                className={`text-lg sm:text-xl font-black ${
                  projectStats.totalNetProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {privacyMode
                  ? '••••••'
                  : `${projectStats.totalNetProfit >= 0 ? '+' : ''}R$ ${projectStats.totalNetProfit.toLocaleString(
                      'pt-BR',
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}`}
              </div>
              <span className="text-[10px] text-slate-400 block">
                ROI: <strong>{projectStats.roi.toFixed(1)}%</strong>
              </span>
            </div>

            {/* Card 5: Taxa de Acerto (Win Rate) */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Taxa de Acerto</span>
                <Target className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
                {projectStats.winRate.toFixed(1)}%
              </div>
              <span className="text-[10px] text-slate-400 block">
                {projectStats.wins}W • {projectStats.losses}L • {projectStats.voids}V
              </span>
            </div>

            {/* Card 6: Patrimônio Total do Projeto */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Patrimônio Projeto</span>
                <Sparkles className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
                {privacyMode
                  ? '••••••'
                  : `R$ ${projectStats.totalEquity.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </div>
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 block">
                {projectStats.equityGrowthPercent >= 0 ? '+' : ''}
                {projectStats.equityGrowthPercent.toFixed(1)}% Crescimento
              </span>
            </div>
          </div>

          {/* Abas Internas do Projeto */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit max-w-full overflow-x-auto border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setActiveTab('OPERATIONS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'OPERATIONS'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Operações ({activeProject.operations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('CHARTS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'CHARTS'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Gráficos & Performance</span>
            </button>

            <button
              onClick={() => setActiveTab('SIMULATOR')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'SIMULATOR'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Simulador de Projeções</span>
            </button>

            <button
              onClick={() => setActiveTab('VAULT_STATEMENT')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'VAULT_STATEMENT'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>Extrato do Cofre</span>
            </button>

            <button
              onClick={() => setActiveTab('SETTINGS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'SETTINGS'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Regras & Estratégia</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: OPERAÇÕES DO PROJETO                                               */}
          {/* ========================================================================= */}
          {activeTab === 'OPERATIONS' && (
            <div className="space-y-4">
              {/* Barra de Filtros e Busca */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Filtrar por evento, mercado ou notas..."
                    value={opSearchTerm}
                    onChange={(e) => setOpSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  {/* Filtro Status */}
                  <select
                    value={opStatusFilter}
                    onChange={(e) => setOpStatusFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="ALL">Todos os Resultados</option>
                    <option value="WIN">🟢 Greens (Vitórias)</option>
                    <option value="LOSS">🔴 Reds (Derrotas)</option>
                    <option value="HALF_WIN">🟡 Meio Green</option>
                    <option value="HALF_LOSS">🟠 Meio Red</option>
                    <option value="VOID">⚪ Devolvida (Void)</option>
                    <option value="PENDING">⏳ Pendentes</option>
                  </select>

                  {/* Filtro Esporte */}
                  <select
                    value={opSportFilter}
                    onChange={(e) => setOpSportFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="ALL">Todos os Esportes</option>
                    {SPORTS_CATEGORIES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon} {s.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleExportCSV(activeProject.id)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    title="Exportar CSV deste projeto"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleOpenAddOp(activeProject.id)}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Entrada</span>
                  </button>
                </div>
              </div>

              {/* Lista de Operações */}
              {filteredOperations.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
                  <div className="p-4 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 w-16 h-16 mx-auto flex items-center justify-center">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    Nenhuma operação encontrada neste projeto
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Registre suas entradas no mercado esportivo para começar a alavancar com juros compostos e blindar sua banca.
                  </p>
                  <button
                    onClick={() => handleOpenAddOp(activeProject.id)}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition-all inline-flex items-center gap-2 mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Registrar Primeira Entrada</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOperations.map((op) => {
                    const isWin = op.status === 'WIN';
                    const isLoss = op.status === 'LOSS';
                    const isPending = op.status === 'PENDING';
                    const isVoid = op.status === 'VOID';
                    const isHalfWin = op.status === 'HALF_WIN';
                    const isHalfLoss = op.status === 'HALF_LOSS';

                    return (
                      <div
                        key={op.id}
                        className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-teal-400 dark:hover:border-teal-500 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        {/* Esquerda: Detalhes do Jogo e Mercado */}
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {new Date(op.date).toLocaleDateString('pt-BR')} {op.time ? `• ${op.time}` : ''}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400">
                              {op.sport || 'Futebol'}
                            </span>
                            {op.competition && (
                              <span className="text-[11px] text-slate-400 font-medium">
                                {op.competition}
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                              {op.event}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                {op.market}
                              </span>
                              <span className="text-xs font-black text-teal-600 dark:text-teal-400">
                                @{op.odds.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {op.notes && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                              "{op.notes}"
                            </p>
                          )}
                        </div>

                        {/* Centro: Valores Financeiros & Divisão de Lucro */}
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 py-2 md:py-0 border-y md:border-y-0 border-slate-100 dark:border-slate-700/60">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Stake</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-white">
                              {privacyMode ? '••••' : `R$ ${op.stake.toFixed(2)}`}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Resultado</span>
                            <span
                              className={`text-sm font-black ${
                                isWin || isHalfWin
                                  ? 'text-emerald-500'
                                  : isLoss || isHalfLoss
                                  ? 'text-rose-500'
                                  : 'text-slate-500'
                              }`}
                            >
                              {privacyMode
                                ? '••••'
                                : isPending
                                ? 'Em Aberto'
                                : `${op.netProfit >= 0 ? '+' : ''}R$ ${op.netProfit.toFixed(2)}`}
                            </span>
                          </div>

                          {/* Divisão: Juros Compostos vs Cofre */}
                          {(isWin || isHalfWin) && (
                            <div className="hidden sm:flex flex-col text-[10px] bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                              <span className="text-teal-600 dark:text-teal-400 font-bold">
                                +R$ {op.compoundAmount.toFixed(2)} na Banca
                              </span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                +R$ {op.protectedAmount.toFixed(2)} no Cofre
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Direita: Status Badge & Ações de Liquidação */}
                        <div className="flex items-center justify-between md:justify-end gap-2">
                          {isPending ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleQuickLiquidate(op, 'WIN')}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                                title="Liquidar como GREEN (Ganho)"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Green</span>
                              </button>
                              <button
                                onClick={() => handleQuickLiquidate(op, 'LOSS')}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                                title="Liquidar como RED (Perda)"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Red</span>
                              </button>
                              <button
                                onClick={() => handleQuickLiquidate(op, 'VOID')}
                                className="px-2 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                                title="Devolvida / Anulada"
                              >
                                Void
                              </button>
                            </div>
                          ) : (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                                isWin
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : isLoss
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                  : isHalfWin
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                  : isHalfLoss
                                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                              }`}
                            >
                              {isWin && 'GREEN'}
                              {isLoss && 'RED'}
                              {isHalfWin && 'MEIO GREEN'}
                              {isHalfLoss && 'MEIO RED'}
                              {isVoid && 'DEVOLVIDA'}
                            </span>
                          )}

                          <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700">
                            <button
                              onClick={() => handleOpenEditOp(op)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              title="Editar Operação"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteOp(op.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                              title="Excluir Operação"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

          {/* ========================================================================= */}
          {/* TAB 2: GRÁFICOS & PERFORMANCE DO PROJETO                                  */}
          {/* ========================================================================= */}
          {activeTab === 'CHARTS' && (
            <div className="space-y-6">
              {/* Gráfico 1: Curva de Evolução Patrimonial (Banca + Cofre + Total) */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-teal-500" />
                      Evolução Patrimonial: Banca vs. Cofre Blindado
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Veja o efeito dos juros compostos na banca e a acumulação da reserva segura ao longo das entradas.
                    </p>
                  </div>
                </div>

                <div className="h-72 sm:h-80 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectStats.evolutionChartData}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorBankroll" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorVault" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(v) => `R$${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '12px',
                          border: '1px solid #334155',
                          fontSize: '12px',
                          color: '#fff',
                        }}
                        formatter={(val: any) => [`R$ ${Number(val).toFixed(2)}`, '']}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Area
                        type="linear"
                        dataKey="totalEquity"
                        name="Patrimônio Total"
                        stroke="#0d9488"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                      />
                      <Area
                        type="linear"
                        dataKey="bankroll"
                        name="Banca Ativa (Compostos)"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorBankroll)"
                      />
                      <Area
                        type="linear"
                        dataKey="vault"
                        name="Cofre Blindado"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorVault)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Seção 2: Melhores Mercados com Lucros e Perdas Individuais */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-teal-500" />
                      Desempenho por Mercado: Lucros e Perdas Individuais
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Compare os ganhos brutos positivos e perdas reais sofridas em cada mercado para identificar onde está sua maior vantagem.
                    </p>
                  </div>
                </div>

                {(!projectStats.marketBreakdown || projectStats.marketBreakdown.length === 0) ? (
                  <p className="text-xs text-slate-400 py-10 text-center">Nenhum mercado com operação finalizada ainda.</p>
                ) : (
                  <div className="space-y-6">
                    <div className="h-72 sm:h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={projectStats.marketBreakdown} margin={{ top: 20, right: 30, left: 0, bottom: 25 }}>
                          <XAxis dataKey="market" stroke="#94a3b8" fontSize={11} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderRadius: '12px',
                              border: '1px solid #334155',
                              fontSize: '12px',
                              color: '#fff',
                            }}
                            formatter={(val: any, name: string) => [
                              `R$ ${Number(val).toFixed(2)}`,
                              name === 'gains' ? 'Ganhos (+)' : name === 'losses' ? 'Perdas (-)' : 'Saldo Líquido',
                            ]}
                          />
                          <Legend
                            verticalAlign="top"
                            height={36}
                            formatter={(val) =>
                              val === 'gains' ? 'Lucros / Greens (R$)' : val === 'losses' ? 'Perdas / Reds (R$)' : 'Saldo Líquido (R$)'
                            }
                          />
                          <Bar dataKey="gains" name="gains" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="losses" name="losses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="profit" name="profit" fill="#0d9488" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Cards / Tabela com Detalhamento de Cada Mercado */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                      {projectStats.marketBreakdown.map((m: any, idx: number) => (
                        <div
                          key={m.market || idx}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/40 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[140px]">
                              {m.market}
                            </span>
                            <span
                              className={`text-xs font-black px-2 py-0.5 rounded-md ${
                                m.profit >= 0
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {m.profit >= 0 ? '+' : ''}R$ {m.profit.toFixed(2)}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1 text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-800">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Lucros (+)</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                R$ {m.gains ? m.gains.toFixed(2) : '0.00'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Perdas (-)</span>
                              <span className="font-bold text-rose-600 dark:text-rose-400">
                                R$ {m.losses ? m.losses.toFixed(2) : '0.00'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Taxa Acerto</span>
                              <span className="font-bold text-slate-700 dark:text-slate-200">{m.winRate}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Seção 3: Faixas de Odds que mais dão Lucratividade */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500" />
                      Faixas de Odds com Maior Lucratividade
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Descubra quais faixas de cotação (ex: 1.30 a 1.40, 1.41 a 1.50, 1.51 a 1.60) geram mais retorno líquido e melhor taxa de assertividade.
                    </p>
                  </div>
                </div>

                {(!projectStats.oddsRangeBreakdown || projectStats.oddsRangeBreakdown.length === 0) ? (
                  <p className="text-xs text-slate-400 py-10 text-center">Nenhuma operação finalizada para análise de faixas de odds.</p>
                ) : (
                  <div className="space-y-6">
                    <div className="h-72 sm:h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={projectStats.oddsRangeBreakdown} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                          <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderRadius: '12px',
                              border: '1px solid #334155',
                              fontSize: '12px',
                              color: '#fff',
                            }}
                            formatter={(val: any, name: string) => [
                              `R$ ${Number(val).toFixed(2)}`,
                              name === 'profit' ? 'Lucro Líquido' : name === 'gains' ? 'Ganhos (+)' : 'Perdas (-)',
                            ]}
                          />
                          <Legend
                            verticalAlign="top"
                            height={36}
                            formatter={(val) =>
                              val === 'profit' ? 'Lucro Líquido (R$)' : val === 'gains' ? 'Ganhos (+)' : 'Perdas (-)'
                            }
                          />
                          <Bar dataKey="profit" name="profit" radius={[6, 6, 0, 0]}>
                            {projectStats.oddsRangeBreakdown.map((entry: any, index: number) => (
                              <Cell key={`cell-odd-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#f43f5e'} />
                            ))}
                          </Bar>
                          <Bar dataKey="gains" name="gains" fill="#06b6d4" opacity={0.6} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="lossAmount" name="lossAmount" fill="#f43f5e" opacity={0.4} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Grade de Faixas de Odds com Destaque de Mais Lucrativa */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                      {projectStats.oddsRangeBreakdown.map((item: any, idx: number) => {
                        const isMostProfitable =
                          item.profit > 0 &&
                          item.profit ===
                            Math.max(...projectStats.oddsRangeBreakdown.map((o: any) => o.profit));

                        return (
                          <div
                            key={item.range || idx}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isMostProfitable
                                ? 'border-amber-400 dark:border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm'
                                : 'border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/40'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1">
                                Odd {item.range}
                                {isMostProfitable && (
                                  <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                                    TOP 1
                                  </span>
                                )}
                              </span>
                              <span
                                className={`text-xs font-black px-2 py-0.5 rounded-md ${
                                  item.profit >= 0
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {item.profit >= 0 ? '+' : ''}R$ {item.profit.toFixed(2)}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-1 text-[11px] pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-800">
                              <div>
                                <span className="text-[10px] text-slate-400 block">Entradas</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">{item.count} ops</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block">W / L</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                  {item.wins}G / {item.losses}R
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block">Win Rate</span>
                                <span className="font-bold text-teal-600 dark:text-teal-400">{item.winRate}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Seção 4: Distribuição e Proporções */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico 4: Distribuição por Esporte */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-teal-500" />
                    Lucro Líquido por Esporte
                  </h3>

                  {projectStats.sportBreakdown.length === 0 ? (
                    <p className="text-xs text-slate-400 py-10 text-center">Nenhum esporte com resultado ainda.</p>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={projectStats.sportBreakdown.slice(0, 6)}>
                          <XAxis dataKey="sport" stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderRadius: '12px',
                              border: '1px solid #334155',
                              fontSize: '12px',
                              color: '#fff',
                            }}
                            formatter={(val: any) => [`R$ ${Number(val).toFixed(2)}`, 'Lucro Líquido']}
                          />
                          <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
                            {projectStats.sportBreakdown.map((entry: any, index: number) => (
                              <Cell key={`cell-sport-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#f43f5e'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Gráfico 5: Distribuição de Resultados (Greens vs. Reds vs. Voids) */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <PieIcon className="w-5 h-5 text-teal-500" />
                    Distribuição de Resultados Gerais
                  </h3>

                  {pieData.length === 0 ? (
                    <p className="text-xs text-slate-400 py-10 text-center">Nenhuma operação concluída ainda.</p>
                  ) : (
                    <div className="h-64 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={4}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderRadius: '12px',
                              border: '1px solid #334155',
                              fontSize: '12px',
                              color: '#fff',
                            }}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SIMULADOR DE PROJEÇÕES                                             */}
          {/* ========================================================================= */}
          {activeTab === 'SIMULATOR' && simulationResult && (
            <div className="space-y-6">
              {/* Painel de Controles do Simulador */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-teal-500" />
                    Simulador Matemático de Crescimento Composto & Blindagem
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Projete o crescimento da banca e o saldo protegido no cofre com base na sua taxa de acerto e odd média.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Controle 1: Quantidade de Entradas */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Quantidade de Entradas</span>
                      <span className="text-teal-600 dark:text-teal-400">{simEntries} ops</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="150"
                      step="5"
                      value={simEntries}
                      onChange={(e) => setSimEntries(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                  </div>

                  {/* Controle 2: Taxa de Acerto (Win Rate) */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Taxa de Acerto Esperada</span>
                      <span className="text-teal-600 dark:text-teal-400">{simWinRate}%</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="90"
                      step="1"
                      value={simWinRate}
                      onChange={(e) => setSimWinRate(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                  </div>

                  {/* Controle 3: Odd Média */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Odd Média por Entrada</span>
                      <span className="text-teal-600 dark:text-teal-400">@{simOdds.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="1.40"
                      max="3.00"
                      step="0.05"
                      value={simOdds}
                      onChange={(e) => setSimOdds(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                  </div>
                </div>

                {/* KPIs da Simulação */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Banca Projetada</span>
                    <span className="text-base font-black text-emerald-500">
                      R$ {simulationResult.finalBankroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-500 block font-bold uppercase">Cofre Projetado</span>
                    <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                      R$ {simulationResult.finalVault.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-teal-500 block font-bold uppercase">Patrimônio Total</span>
                    <span className="text-base font-black text-teal-600 dark:text-teal-400">
                      R$ {simulationResult.finalTotalEquity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Lucro Projetado</span>
                    <span className="text-base font-black text-slate-800 dark:text-white">
                      +R$ {simulationResult.totalNetProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Gráfico da Simulação */}
                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={simulationResult.timeline}>
                      <XAxis dataKey="entry" stroke="#94a3b8" fontSize={11} tickLine={false} label={{ value: 'Nº de Entradas', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '12px',
                          border: '1px solid #334155',
                          fontSize: '12px',
                          color: '#fff',
                        }}
                        formatter={(val: any) => [`R$ ${Number(val).toFixed(2)}`, '']}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Line type="linear" dataKey="totalEquity" name="Patrimônio Total" stroke="#0d9488" strokeWidth={2.5} dot={false} />
                      <Line type="linear" dataKey="bankroll" name="Banca Ativa" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="linear" dataKey="vault" name="Cofre Blindado" stroke="#6366f1" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: EXTRATO DO COFRE BLINDADO                                          */}
          {/* ========================================================================= */}
          {activeTab === 'VAULT_STATEMENT' && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-500" />
                    Extrato do Cofre de Proteção Blindado
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Histórico de saques e reinjeções da reserva protegida deste projeto.
                  </p>
                </div>

                <button
                  onClick={() => setIsVaultModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Realizar Saque ou Transferência</span>
                </button>
              </div>

              {(!activeProject.vaultTransfers || activeProject.vaultTransfers.length === 0) ? (
                <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-900 text-center space-y-2">
                  <ShieldCheck className="w-8 h-8 text-indigo-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nenhuma transferência de cofre realizada ainda.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    O saldo seguro acumulado no cofre (R$ {activeProject.config.protectedVault.toFixed(2)}) pode ser sacado para realização de lucros ou reinjetado na banca quando desejar.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeProject.vaultTransfers.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            t.type === 'WITHDRAWAL'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                          }`}
                        >
                          {t.type === 'WITHDRAWAL' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-white block">
                            {t.type === 'WITHDRAWAL' ? 'Saque Realizado do Cofre' : 'Reinjeção na Banca Ativa'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(t.date).toLocaleDateString('pt-BR')} {t.notes ? `• ${t.notes}` : ''}
                          </span>
                        </div>
                      </div>

                      <span className="text-sm font-black text-slate-800 dark:text-white">
                        R$ {t.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: CONFIGURAÇÕES E REGRAS DO PROJETO                                  */}
          {/* ========================================================================= */}
          {activeTab === 'SETTINGS' && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-teal-500" />
                    Regras & Parâmetros do Projeto
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ajuste os parâmetros matemáticos, capital e metas deste projeto.
                  </p>
                </div>

                <button
                  onClick={() => handleOpenEditProject(activeProject)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Editar Parâmetros Completos</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-500 block uppercase">Resumo da Estratégia</span>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">
                    {activeProject.name}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeProject.description || 'Sem descrição cadastrada.'}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-medium">
                      Casa: <strong>{activeProject.bookmaker || 'Bet365'}</strong>
                    </span>
                    <span className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-medium">
                      Foco: <strong>{activeProject.sportFocus || 'Futebol'}</strong>
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-500 block uppercase">Divisão dos Greens</span>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-teal-600 dark:text-teal-400">
                      Juros Compostos: {activeProject.config.compoundPercentage}%
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      Cofre Blindado: {activeProject.config.protectionPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden flex">
                    <div
                      className="bg-teal-500 h-full"
                      style={{ width: `${activeProject.config.compoundPercentage}%` }}
                    />
                    <div
                      className="bg-indigo-500 h-full"
                      style={{ width: `${activeProject.config.protectionPercentage}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Exposição por entrada: <strong>{activeProject.config.stakePercentage}% da banca ativa</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS GLOBAIS                                                            */}
      {/* ========================================================================= */}
      {/* 1. Modal de Criação / Edição de Projeto */}
      <SportsBettingProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        investments={investments}
        onSave={handleSaveProject}
        editingProject={editingProject}
        onDelete={handleDeleteProject}
      />

      {/* 2. Modal de Nova / Edição de Operação */}
      {opModalTargetProject && (
        <SportsBettingOperationModal
          isOpen={isOpModalOpen}
          onClose={() => {
            setIsOpModalOpen(false);
            setEditingOp(null);
          }}
          onSave={handleSaveOperation}
          editingOperation={editingOp}
          config={opModalTargetProject.config}
        />
      )}

      {/* 3. Modal de Configurações de Risco do Projeto */}
      {activeProject && (
        <SportsBettingConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          config={activeProject.config}
          investments={investments}
          onSaveConfig={handleSaveConfig}
          onResetCycle={handleResetCycle}
        />
      )}

      {/* 4. Modal do Cofre Blindado (Saque / Transferência) */}
      {activeProject && (
        <SportsBettingVaultModal
          isOpen={isVaultModalOpen}
          onClose={() => setIsVaultModalOpen(false)}
          config={activeProject.config}
          vaultTransfers={activeProject.vaultTransfers || []}
          onTransfer={handleVaultTransfer}
        />
      )}
    </div>
  );
};
