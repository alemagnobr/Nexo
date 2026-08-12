import React, { useRef, useState } from "react";
import {
  LayoutDashboard,
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
  BrainCircuit,
  Cloud,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Activity,
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

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    compras: false,
    financeiro: false,
    planejamento: false,
    saude: false,
  });

  const toggleMenu = (menu: string, defaultView?: View) => {
    setOpenMenus((prev) => {
      const isOpen = prev[menu] ?? false;
      return {
        ...prev,
        [menu]: !isOpen,
      };
    });
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

  // Group Logic Helpers to determine active state
  const isFinanceiroActive = [
    View.FINANCEIRO_DASHBOARD,
    View.TRANSACTIONS,
    View.SUBSCRIPTIONS,
    View.DEBTS,
    View.INVESTMENTS,
    View.BUDGETS,
    View.WEALTH_PLANNER,
    View.PIX_KEYS,
  ].includes(currentView);
  
  const isComprasActive = [
    View.SHOPPING_LIST,
    View.INVENTORY,
    View.KANBAN,
  ].includes(currentView);

  const isProductivityActive = [
    View.PLANEJAMENTO_DASHBOARD,
    View.NOTES,
    View.PRODUCTIVITY,
    View.WORK_GOALS,
    View.PASSWORDS,
  ].includes(currentView);
  const isSaudeActive = [
    View.SAUDE_DASHBOARD,
    View.TREINO
  ].includes(currentView);

  return (
    <nav
      className={`
         fixed md:sticky top-0 left-0 h-screen z-50 w-72 md:w-64 bg-slate-900 border-r border-slate-800 
         transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col
         ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
       `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-900/50">
            <Hexagon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight leading-none">
              NEXO
            </h1>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Smart Life Planner
            </span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden text-slate-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* User Info */}
      <div className="p-4 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50 backdrop-blur-sm">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 overflow-hidden text-xs text-white">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User" />
            ) : (
              user?.email?.substring(0, 2).toUpperCase() || "CV"
            )}
          </div>
          <div className="overflow-hidden flex-1 min-w-0">
            <p
              className="text-xs font-bold text-white truncate"
              title={user?.email || "Convidado"}
            >
              {user?.email?.split("@")[0] || "Convidado"}
            </p>
            <div className="flex items-center gap-1">
              <div
                className={`w-1.5 h-1.5 rounded-full ${user ? "bg-emerald-500" : "bg-amber-500"}`}
              ></div>
              <p className="text-[10px] text-slate-400">
                {user ? "Online (Cloud)" : "Offline (Local)"}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-rose-500"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col no-scrollbar space-y-1">
        <p className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">
          Visão Geral
        </p>

        <NavItem
          active={currentView === View.DASHBOARD}
          onClick={() => handleNavClick(View.DASHBOARD)}
          icon={LayoutDashboard}
          label="Dashboard Global"
        />

        <NavItem
          active={currentView === View.CALENDAR}
          onClick={() => handleNavClick(View.CALENDAR)}
          icon={Calendar}
          label="Agenda"
        />

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
            {(openMenus.financeiro ?? isFinanceiroActive) ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {(openMenus.financeiro ?? isFinanceiroActive) && (
            <div className="pl-4 space-y-1 py-1 border-l-2 border-blue-500/30 ml-4">
              <button
                onClick={() => handleNavClick(View.TRANSACTIONS)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentView === View.TRANSACTIONS
                    ? "bg-blue-600 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Receipt className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                <span>Transações</span>
              </button>

              <button
                onClick={() => handleNavClick(View.SUBSCRIPTIONS)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentView === View.SUBSCRIPTIONS
                    ? "bg-blue-600 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Repeat className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                <span>Assinaturas</span>
              </button>

              <button
                onClick={() => handleNavClick(View.DEBTS)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentView === View.DEBTS
                    ? "bg-blue-600 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span>Dívidas</span>
              </button>

              <button
                onClick={() => handleNavClick(View.INVESTMENTS)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentView === View.INVESTMENTS
                    ? "bg-blue-600 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <LineChart className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>Investimentos</span>
              </button>

              <button
                onClick={() => handleNavClick(View.BUDGETS)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentView === View.BUDGETS
                    ? "bg-blue-600 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Target className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                <span>Orçamentos</span>
              </button>

              <button
                onClick={() => handleNavClick(View.WEALTH_PLANNER)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentView === View.WEALTH_PLANNER
                    ? "bg-blue-600 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Landmark className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>Aposentadoria</span>
              </button>

              <button
                onClick={() => handleNavClick(View.PIX_KEYS)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentView === View.PIX_KEYS
                    ? "bg-blue-600 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Key className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                <span>Pix</span>
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
            {(openMenus.compras ?? isComprasActive) ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {(openMenus.compras ?? isComprasActive) && (
            <div className="pl-4 space-y-1 py-1 border-l-2 border-amber-500/30 ml-4">
              <button
                onClick={() => handleNavClick(View.SHOPPING_LIST)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentView === View.SHOPPING_LIST
                    ? "bg-amber-600 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span>Lista de Compras</span>
              </button>

              <button
                onClick={() => handleNavClick(View.INVENTORY)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentView === View.INVENTORY
                    ? "bg-amber-600 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Package className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                <span>Estoque</span>
              </button>

              <button
                onClick={() => handleNavClick(View.KANBAN)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentView === View.KANBAN
                    ? "bg-amber-600 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                <span className="leading-tight text-left">Sonhos de Consumo</span>
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
            {(openMenus.planejamento ?? isProductivityActive) ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {(openMenus.planejamento ?? isProductivityActive) && (
            <div className="pl-4 space-y-1 py-1 border-l-2 border-emerald-500/30 ml-4">
              <button
                onClick={() => handleNavClick(View.PRODUCTIVITY)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentView === View.PRODUCTIVITY
                    ? "bg-emerald-600 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Target className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span>Hábitos</span>
              </button>

              <button
                onClick={() => handleNavClick(View.NOTES)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentView === View.NOTES
                    ? "bg-emerald-600 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <StickyNote className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>NEXO Notes</span>
              </button>

              <button
                onClick={() => handleNavClick(View.WORK_GOALS)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentView === View.WORK_GOALS
                    ? "bg-emerald-600 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <LineChart className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>Metas de Trabalho</span>
              </button>

              <button
                onClick={() => handleNavClick(View.PASSWORDS)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentView === View.PASSWORDS
                    ? "bg-emerald-600 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Key className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                <span>Cofre de Senhas</span>
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
            {(openMenus.saude ?? isSaudeActive) ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {(openMenus.saude ?? isSaudeActive) && (
            <div className="pl-4 space-y-1 py-1 border-l-2 border-rose-500/30 ml-4">
              <button
                onClick={() => handleNavClick(View.TREINO)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentView === View.TREINO
                    ? "bg-rose-600 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Activity className="w-3.5 h-3.5 shrink-0 text-orange-400" />
                <span>Treinos & Saúde</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Focus Mode */}
        <div className="mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={openModal}
            className={`w-full relative group overflow-hidden rounded-xl p-[1px] transition-all duration-300 ${
              isActive
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20"
                : "bg-slate-700/50 hover:bg-slate-700"
            }`}
          >
            <div
              className={`relative flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-[11px] bg-slate-900 transition-colors h-full`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-lg ${isActive ? "bg-emerald-500/20" : "bg-slate-800 group-hover:bg-slate-700"}`}
                >
                  <BrainCircuit
                    className={`w-4 h-4 ${isActive ? "text-emerald-400 animate-pulse" : "text-slate-400 group-hover:text-white"}`}
                  />
                </div>
                <div className="text-left">
                  <p
                    className={`text-sm font-bold ${isActive ? "text-white" : "text-slate-300 group-hover:text-white"}`}
                  >
                    Modo Foco
                  </p>
                  <p
                    className={`text-xs ${isActive ? "text-emerald-400 font-mono" : "text-slate-500 group-hover:text-slate-400"}`}
                  >
                    {isActive
                      ? `${Math.floor(timeLeft / 60)
                          .toString()
                          .padStart(
                            2,
                            "0",
                          )}:${(timeLeft % 60).toString().padStart(2, "0")}`
                      : "Temporizador de estudo"}
                  </p>
                  {isActive && focusReason && (
                    <p
                      className="text-[10px] text-emerald-300 truncate w-full mt-0.5"
                      title={focusReason}
                    >
                      {focusReason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-slate-800 bg-slate-900 shrink-0">
        {canInstall && (
          <button
            onClick={onInstall}
            className="w-full mb-4 flex items-center justify-center gap-2 p-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
          >
            <AppWindow className="w-3 h-3" /> Instalar App (PWA)
          </button>
        )}

        {/* Simplified Footer Grid */}
        <div className="flex justify-between items-center gap-2 flex-wrap">
          <button
            onClick={onOpenShortcutsModal}
            className="flex-1 min-w-[40px] flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all border border-slate-800 hover:border-slate-700"
            title="Atalhos Rápidos"
          >
            <Link className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleNavClick(View.SETTINGS)}
            className={`flex-1 min-w-[40px] flex items-center justify-center p-2 rounded-lg transition-all border border-slate-800 hover:border-slate-700 ${currentView === View.SETTINGS ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
            title="Configurações e Dados"
          >
            <Settings className="w-5 h-5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex-1 min-w-[40px] flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all border border-slate-800 hover:border-slate-700"
            title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5" />
            ) : (
              <Maximize className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={onOpenDonateModal}
            className="flex-1 min-w-[40px] flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-pink-500 transition-all border border-slate-800 hover:border-slate-700"
            title="Apoiar Projeto"
          >
            <Heart className="w-5 h-5" />
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
            className="flex-1 min-w-[40px] flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-blue-400 transition-all border border-slate-800 hover:border-slate-700"
            title={
              driveLink
                ? "Abrir Pasta de Comprovantes (Botão direito para editar)"
                : "Configurar Pasta de Comprovantes"
            }
          >
            <Cloud className="w-5 h-5" />
          </button>
        </div>

        {/* Credits & Version */}
        <div className="pt-4 mt-3 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500 font-mono">v2.6.0 Config</p>
          <a
            href="https://www.linkedin.com/in/alemagnobr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-slate-400 hover:text-indigo-400 transition-colors flex items-center justify-center gap-1.5 mt-1"
          >
            <Linkedin className="w-3 h-3" /> Alexandre Magno S. Linhares
          </a>
        </div>
      </div>
    </nav>
  );
};
