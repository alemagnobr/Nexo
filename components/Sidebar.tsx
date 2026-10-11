import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  Receipt,
  LineChart,
  Target,
  Calendar,
  Repeat,
  MessageSquareMore,
  ShieldAlert,
  Hexagon,
  LogIn,
  LogOut,
  Maximize,
  Minimize,
  Key,
  Eye,
  EyeOff,
  Moon,
  Sun,
  HardDriveDownload,
  HardDriveUpload,
  Trash2,
  Heart,
  X,
  ShoppingCart,
  Package,
  Sparkles,
  Github,
  Linkedin,
  Copy,
  Landmark,
  AppWindow,
  Wallet,
  StickyNote,
  ArrowLeftRight,
  Layout,
  Settings,
  Wrench,
  Link,
  Timer,
  Clock,
  BrainCircuit,
  Cloud,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Activity,
  Coins,
  TrendingUp,
  Snowflake,
  Trophy,
  Lock,
  QrCode,
} from "lucide-react";
import { View } from "../types";
import { useFocus } from "../contexts/FocusContext";

interface SidebarProps {
  user: any;
  isGuest: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  currentView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;

  // State props
  privacyMode: boolean;
  setPrivacyMode: (mode: boolean) => void;
  darkMode: boolean;
  setDarkMode: (mode: boolean) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  hasKey: boolean;

  // Modal triggers
  onOpenKeyModal: () => void;
  onOpenDonateModal: () => void;
  onOpenShortcutsModal: () => void;

  // Data actions
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFactoryReset: () => void;

  // PWA
  canInstall: boolean;
  onInstall: () => void;

  driveLink?: string;
  onSetDriveLink: (link: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  isGuest,
  mobileMenuOpen,
  setMobileMenuOpen,
  currentView,
  onNavigate,
  onLogout,
  privacyMode,
  setPrivacyMode,
  darkMode,
  setDarkMode,
  isFullscreen,
  toggleFullscreen,
  hasKey,
  onOpenKeyModal,
  onOpenDonateModal,
  onOpenShortcutsModal,
  onExportBackup,
  onImportBackup,
  onFactoryReset,
  canInstall,
  onInstall,
  driveLink,
  onSetDriveLink,
}) => {
  const { isActive, timeLeft, openModal, focusReason } = useFocus();

  // Group Logic Helpers to determine active state
  const isFinanceiroActive = [
    View.FINANCEIRO_DASHBOARD,
    View.TRANSACTIONS,
    View.SUBSCRIPTIONS,
    View.DEBTS,
    View.BUDGETS,
  ].includes(currentView);

  const isInvestimentosActive = [
    View.INVESTMENTS_DASHBOARD,
    View.INVESTMENTS,
    View.SNOWBALL,
    View.FINANCIAL_CHALLENGES,
    View.WEALTH_PLANNER,
  ].includes(currentView);
  
  const isComprasActive = [
    View.SHOPPING_LIST,
    View.INVENTORY,
    View.KANBAN,
  ].includes(currentView);

  const isProductivityActive = [
    View.PLANEJAMENTO_DASHBOARD,
    View.PRODUCTIVITY,
    View.WORK_GOALS,
  ].includes(currentView);

  const isSaudeActive = [
    View.SAUDE_DASHBOARD,
    View.TREINO
  ].includes(currentView);

  // Active group detection
  const activeGroup = useMemo(() => {
    if (isFinanceiroActive) return "financeiro";
    if (isInvestimentosActive) return "investimentos";
    if (isComprasActive) return "compras";
    if (isProductivityActive) return "planejamento";
    if (isSaudeActive) return "saude";
    return null;
  }, [isFinanceiroActive, isInvestimentosActive, isComprasActive, isProductivityActive, isSaudeActive]);

  // Keep single expanded menu state (accordion)
  const [expandedMenu, setExpandedMenu] = useState<string | null>(activeGroup);

  // Sync expanded menu when navigating across modules
  useEffect(() => {
    if (activeGroup) {
      setExpandedMenu(activeGroup);
    }
  }, [activeGroup]);

  const toggleMenu = (menu: string, defaultView?: View) => {
    setExpandedMenu((prev) => (prev === menu ? null : menu));
    if (defaultView && currentView !== defaultView) {
      handleNavClick(defaultView);
    }
  };

  const handleNavClick = (view: View) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  const NavItem = ({
    active,
    onClick,
    icon: Icon,
    label,
    customClass = "",
  }: {
    active: boolean;
    onClick: () => void;
    icon: any;
    label: string;
    customClass?: string;
  }) => (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-xs font-medium ${customClass} ${
        active
          ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <Icon
        className={`w-5 h-5 ${!active && customClass ? "text-purple-400 group-hover:text-white" : ""}`}
      />
      <div className="flex-1 flex justify-between items-center">
        <span>{label}</span>
      </div>
    </button>
  );

  return (
    <nav
      className={`
         fixed md:sticky top-0 left-0 h-screen z-50 w-72 md:w-64 bg-slate-900 border-r border-slate-800 
         transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col
         ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
       `}
    >
      {/* Header Unificado com Logo + Usuário Discreto */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-md shadow-indigo-950/50 shrink-0 flex items-center justify-center">
            <Hexagon className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            {/* Topo: NEXO sozinho */}
            <h1 className="text-base font-black text-white tracking-wide leading-none">
              NEXO
            </h1>
            {/* Embaixo: Nome do usuário e status Cloud na mesma linha */}
            <div className="flex items-center gap-1.5 mt-1.5 leading-none">
              <span
                className="text-xs font-medium text-slate-300 truncate max-w-[105px]"
                title={user?.email || "Convidado"}
              >
                {user?.email?.split("@")[0] || "Convidado"}
              </span>
              <span className="text-slate-600 text-[10px] select-none">•</span>
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  user
                    ? "bg-emerald-400 shadow-sm shadow-emerald-500/50"
                    : "bg-amber-400"
                }`}
              />
              <span className="text-[11px] font-medium text-slate-400">
                {user ? "Cloud" : "Local"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center"
            title="Sair / Desconectar"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col no-scrollbar space-y-1">
        {/* Financeiro */}
        <div className="space-y-1">
          <button
            onClick={() => toggleMenu("financeiro", View.TRANSACTIONS)}
            className={`flex w-full items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs font-bold ${
              isFinanceiroActive
                ? "bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${isFinanceiroActive ? 'bg-blue-600 text-white' : 'bg-blue-500/10 text-blue-400'}`}>
                <Landmark className="w-4 h-4" />
              </div>
              <span>Financeiro</span>
            </div>
            {expandedMenu === "financeiro" ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedMenu === "financeiro" && (
            <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-950/40 rounded-xl border border-slate-800/60 my-1 animate-fade-in">
              {/* 1. Transações */}
              <button
                onClick={() => handleNavClick(View.TRANSACTIONS)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all border group ${
                  currentView === View.TRANSACTIONS
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-sm"
                    : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-blue-300 hover:border-slate-700"
                }`}
                title="Transações Financeiras"
              >
                <Receipt className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] mt-1 tracking-tight font-medium truncate max-w-full">
                  Transações
                </span>
              </button>

              {/* 2. Assinaturas */}
              <button
                onClick={() => handleNavClick(View.SUBSCRIPTIONS)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all border group ${
                  currentView === View.SUBSCRIPTIONS
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-sm"
                    : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-purple-300 hover:border-slate-700"
                }`}
                title="Assinaturas Recorrentes"
              >
                <Repeat className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] mt-1 tracking-tight font-medium truncate max-w-full">
                  Assinaturas
                </span>
              </button>

              {/* 3. Dívidas */}
              <button
                onClick={() => handleNavClick(View.DEBTS)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all border group ${
                  currentView === View.DEBTS
                    ? "bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-sm"
                    : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-rose-300 hover:border-slate-700"
                }`}
                title="Controle de Dívidas"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] mt-1 tracking-tight font-medium truncate max-w-full">
                  Dívidas
                </span>
              </button>

              {/* 4. Orçamentos */}
              <button
                onClick={() => handleNavClick(View.BUDGETS)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all border group ${
                  currentView === View.BUDGETS
                    ? "bg-sky-500/20 border-sky-500/50 text-sky-300 shadow-sm"
                    : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-sky-300 hover:border-slate-700"
                }`}
                title="Limites e Orçamentos"
              >
                <Target className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] mt-1 tracking-tight font-medium truncate max-w-full">
                  Orçamentos
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Investimentos */}
        <div className="space-y-1">
          <button
            onClick={() => toggleMenu("investimentos", View.INVESTMENTS)}
            className={`flex w-full items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs font-bold ${
              isInvestimentosActive
                ? "bg-teal-600/20 text-teal-300 border border-teal-500/40 shadow-sm"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${isInvestimentosActive ? 'bg-teal-600 text-white' : 'bg-teal-500/10 text-teal-400'}`}>
                <LineChart className="w-4 h-4" />
              </div>
              <span>Investimentos</span>
            </div>
            {expandedMenu === "investimentos" ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedMenu === "investimentos" && (
            <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-950/40 rounded-xl border border-slate-800/60 my-1 animate-fade-in">
              {/* 1. Meus Investimentos */}
              <button
                onClick={() => handleNavClick(View.INVESTMENTS)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all border group ${
                  currentView === View.INVESTMENTS
                    ? "bg-teal-500/20 border-teal-500/50 text-teal-300 shadow-sm"
                    : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-teal-300 hover:border-slate-700"
                }`}
                title="Meus Investimentos"
              >
                <TrendingUp className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] mt-1 tracking-tight font-medium truncate max-w-full">
                  Investimentos
                </span>
              </button>

              {/* 2. Bola de Neve */}
              <button
                onClick={() => handleNavClick(View.SNOWBALL)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all border group ${
                  currentView === View.SNOWBALL
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm"
                    : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-cyan-300 hover:border-slate-700"
                }`}
                title="Efeito Bola de Neve"
              >
                <Snowflake className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] mt-1 tracking-tight font-medium truncate max-w-full">
                  Bola de Neve
                </span>
              </button>

              {/* 3. Desafios Financeiros */}
              <button
                onClick={() => handleNavClick(View.FINANCIAL_CHALLENGES)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all border group ${
                  currentView === View.FINANCIAL_CHALLENGES
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm"
                    : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-amber-300 hover:border-slate-700"
                }`}
                title="Desafios Financeiros"
              >
                <Coins className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] mt-1 tracking-tight font-medium truncate max-w-full">
                  Desafios
                </span>
              </button>

              {/* 4. Aposentadoria */}
              <button
                onClick={() => handleNavClick(View.WEALTH_PLANNER)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all border group ${
                  currentView === View.WEALTH_PLANNER
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-sm"
                    : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-purple-300 hover:border-slate-700"
                }`}
                title="Planejador de Aposentadoria & Liberdade Financeira"
              >
                <Landmark className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] mt-1 tracking-tight font-medium truncate max-w-full">
                  Aposentadoria
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Compras */}
        <div className="space-y-1">
          <button
            onClick={() => toggleMenu("compras", View.SHOPPING_LIST)}
            className={`flex w-full items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs font-bold ${
              isComprasActive
                ? "bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${isComprasActive ? 'bg-amber-600 text-white' : 'bg-amber-500/10 text-amber-400'}`}>
                <ShoppingCart className="w-4 h-4" />
              </div>
              <span>Compras</span>
            </div>
            {expandedMenu === "compras" ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedMenu === "compras" && (
            <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-950/40 rounded-xl border border-slate-800/60 my-1 animate-fade-in">
              {/* 1. Lista de Compras */}
              <button
                onClick={() => handleNavClick(View.SHOPPING_LIST)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all border group ${
                  currentView === View.SHOPPING_LIST
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm"
                    : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-amber-300 hover:border-slate-700"
                }`}
                title="Lista de Compras do Mês"
              >
                <ShoppingCart className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] mt-1 tracking-tight font-medium truncate max-w-full">
                  Compras
                </span>
              </button>

              {/* 2. Estoque */}
              <button
                onClick={() => handleNavClick(View.INVENTORY)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all border group ${
                  currentView === View.INVENTORY
                    ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-sm"
                    : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-indigo-300 hover:border-slate-700"
                }`}
                title="Despensa & Estoque Doméstico"
              >
                <Package className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] mt-1 tracking-tight font-medium truncate max-w-full">
                  Estoque
                </span>
              </button>

              {/* 3. Sonhos de Consumo */}
              <button
                onClick={() => handleNavClick(View.KANBAN)}
                className={`col-span-2 flex items-center justify-center gap-2 py-2 px-1 rounded-lg transition-all border group ${
                  currentView === View.KANBAN
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-sm"
                    : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-purple-300 hover:border-slate-700"
                }`}
                title="Sonhos de Consumo & Prioridades"
              >
                <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform shrink-0" />
                <span className="text-[10px] tracking-tight font-medium truncate">
                  Sonhos de Consumo
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Planejamento */}
        <div className="space-y-1">
          <button
            onClick={() => toggleMenu("planejamento", View.PRODUCTIVITY)}
            className={`flex w-full items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs font-bold ${
              isProductivityActive
                ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${isProductivityActive ? 'bg-emerald-600 text-white' : 'bg-emerald-500/10 text-emerald-400'}`}>
                <Target className="w-4 h-4" />
              </div>
              <span>Planejamento</span>
            </div>
            {expandedMenu === "planejamento" ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedMenu === "planejamento" && (
            <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-950/40 rounded-xl border border-slate-800/60 my-1 animate-fade-in">
              {/* 1. Hábitos */}
              <button
                onClick={() => handleNavClick(View.PRODUCTIVITY)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all border group ${
                  currentView === View.PRODUCTIVITY
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm"
                    : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-emerald-300 hover:border-slate-700"
                }`}
                title="Controle de Hábitos Diários"
              >
                <Target className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] mt-1 tracking-tight font-medium truncate max-w-full">
                  Hábitos
                </span>
              </button>

              {/* 2. Metas de Trabalho */}
              <button
                onClick={() => handleNavClick(View.WORK_GOALS)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all border group ${
                  currentView === View.WORK_GOALS
                    ? "bg-teal-500/20 border-teal-500/50 text-teal-300 shadow-sm"
                    : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-teal-300 hover:border-slate-700"
                }`}
                title="Metas de Trabalho & Projetos"
              >
                <LineChart className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] mt-1 tracking-tight font-medium truncate max-w-full">
                  Metas
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Saúde */}
        <div className="space-y-1">
          <button
            onClick={() => toggleMenu("saude", View.TREINO)}
            className={`flex w-full items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs font-bold ${
              isSaudeActive
                ? "bg-rose-600/20 text-rose-300 border border-rose-500/40 shadow-sm"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${isSaudeActive ? 'bg-rose-600 text-white' : 'bg-rose-500/10 text-rose-400'}`}>
                <Activity className="w-4 h-4" />
              </div>
              <span>Saúde</span>
            </div>
            {expandedMenu === "saude" ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {expandedMenu === "saude" && (
            <div className="grid grid-cols-1 gap-1.5 p-1.5 bg-slate-950/40 rounded-xl border border-slate-800/60 my-1 animate-fade-in">
              <button
                onClick={() => handleNavClick(View.TREINO)}
                className={`flex items-center justify-center gap-2 py-2 px-1 rounded-lg transition-all border group ${
                  currentView === View.TREINO
                    ? "bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-sm"
                    : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-rose-300 hover:border-slate-700"
                }`}
                title="Treinos, Fichas & Saúde"
              >
                <Activity className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform shrink-0" />
                <span className="text-[10px] tracking-tight font-medium truncate">
                  Treinos & Saúde
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barra Fixa de Atalhos Rápidos (Agenda, Foco, Notas, Senhas, Pix) */}
      <div className="px-2.5 py-2 border-t border-slate-800 bg-slate-900/95 shrink-0">
        <div className="grid grid-cols-5 gap-1">
          {/* 1. Agenda (Calendário) */}
          <button
            onClick={() => handleNavClick(View.CALENDAR)}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-all border group ${
              currentView === View.CALENDAR
                ? "bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-sm"
                : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-blue-300 hover:border-slate-700"
            }`}
            title="Agenda & Calendário"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-400 group-hover:scale-105 transition-transform" />
            <span className="text-[9px] mt-0.5 tracking-tight font-medium truncate">Agenda</span>
          </button>

          {/* 2. Modo Foco (Relógio) */}
          <button
            onClick={openModal}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-all border group relative ${
              isActive
                ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-sm shadow-emerald-950/40"
                : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-emerald-400 hover:border-slate-700"
            }`}
            title={
              isActive
                ? `Modo Foco Ativo (${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")})`
                : "Modo Foco"
            }
          >
            <div className="relative">
              <Clock className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400 animate-pulse" : "group-hover:scale-105 transition-transform"}`} />
              {isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <span className={`text-[9px] mt-0.5 tracking-tight font-medium truncate max-w-full ${isActive ? "text-emerald-300 font-bold font-mono" : ""}`}>
              {isActive
                ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")}`
                : "Foco"}
            </span>
          </button>

          {/* 3. Anotações (NEXO Notes) */}
          <button
            onClick={() => handleNavClick(View.NOTES)}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-all border group ${
              currentView === View.NOTES
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm"
                : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-amber-300 hover:border-slate-700"
            }`}
            title="Anotações Rápidas (NEXO Notes)"
          >
            <StickyNote className="w-3.5 h-3.5 group-hover:scale-105 transition-transform" />
            <span className="text-[9px] mt-0.5 tracking-tight font-medium truncate">Notas</span>
          </button>

          {/* 4. Cofre de Senhas */}
          <button
            onClick={() => handleNavClick(View.PASSWORDS)}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-all border group ${
              currentView === View.PASSWORDS
                ? "bg-sky-500/20 border-sky-500/50 text-sky-300 shadow-sm"
                : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-sky-300 hover:border-slate-700"
            }`}
            title="Cofre de Senhas"
          >
            <Lock className="w-3.5 h-3.5 group-hover:scale-105 transition-transform" />
            <span className="text-[9px] mt-0.5 tracking-tight font-medium truncate">Senhas</span>
          </button>

          {/* 5. Chaves Pix */}
          <button
            onClick={() => handleNavClick(View.PIX_KEYS)}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-all border group ${
              currentView === View.PIX_KEYS
                ? "bg-teal-500/20 border-teal-500/50 text-teal-300 shadow-sm"
                : "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-teal-300 hover:border-slate-700"
            }`}
            title="Chaves Pix"
          >
            <QrCode className="w-3.5 h-3.5 group-hover:scale-105 transition-transform" />
            <span className="text-[9px] mt-0.5 tracking-tight font-medium truncate">Pix</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto px-3 py-2.5 border-t border-slate-800 bg-slate-900 shrink-0">
        {canInstall && (
          <button
            onClick={onInstall}
            className="w-full mb-3 flex items-center justify-center gap-2 p-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20"
          >
            <AppWindow className="w-3.5 h-3.5" /> Instalar App (PWA)
          </button>
        )}

        {/* Simplified Footer Grid */}
        <div className="flex justify-between items-center gap-1.5 flex-wrap">
          <button
            onClick={onOpenShortcutsModal}
            className="flex-1 min-w-[32px] flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all border border-slate-800 hover:border-slate-700"
            title="Atalhos Rápidos"
          >
            <Link className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleNavClick(View.SETTINGS)}
            className={`flex-1 min-w-[32px] flex items-center justify-center p-1.5 rounded-lg transition-all border border-slate-800 hover:border-slate-700 ${currentView === View.SETTINGS ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
            title="Configurações e Dados"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex-1 min-w-[32px] flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all border border-slate-800 hover:border-slate-700"
            title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
          >
            {isFullscreen ? (
              <Minimize className="w-3.5 h-3.5" />
            ) : (
              <Maximize className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={onOpenDonateModal}
            className="flex-1 min-w-[32px] flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-pink-500 transition-all border border-slate-800 hover:border-slate-700"
            title="Apoiar Projeto"
          >
            <Heart className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (driveLink) {
                window.open(driveLink, "_blank");
              } else {
                const link = window.prompt(
                  "Cole o link da sua pasta do Google Drive (ou outro serviço) para salvar seus comprovantes:",
                );
                if (link) {
                  onSetDriveLink(link);
                  window.open(link, "_blank");
                }
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              const link = window.prompt(
                "Editar link da sua pasta de comprovantes:",
                driveLink || "",
              );
              if (link !== null) {
                onSetDriveLink(link);
              }
            }}
            className="flex-1 min-w-[32px] flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-blue-400 transition-all border border-slate-800 hover:border-slate-700"
            title={
              driveLink
                ? "Abrir Pasta de Comprovantes (Botão direito para editar)"
                : "Configurar Pasta de Comprovantes"
            }
          >
            <Cloud className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Credits & Version */}
        <div className="pt-2 mt-1.5 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500 font-mono">v2.6.0 Config</p>
          <a
            href="https://www.linkedin.com/in/alemagnobr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-slate-400 hover:text-indigo-400 transition-colors flex items-center justify-center gap-1.5 mt-0.5"
          >
            <Linkedin className="w-3 h-3" /> Alexandre Magno S. Linhares
          </a>
        </div>
      </div>
    </nav>
  );
};
