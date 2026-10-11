import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Target,
  Calendar,
  ShieldAlert,
  Hexagon,
  Loader2,
  Key,
  Menu,
  PlusCircle,
  ShoppingCart,
  AppWindow,
  Landmark,
  CheckSquare,
  Activity,
  LineChart,
  ArrowUp,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import {
  View,
  Transaction,
  TransactionStatus,
  ShoppingItem,
  PaymentMethod,
  AppData,
} from "./types";
import {
  loadData,
  saveData,
  migrateLocalToCloud,
} from "./services/storageService";
import {
  setApiKey,
  getApiKey,
  removeApiKey,
  hasCustomApiKey,
} from "./services/geminiService";
import { auth } from "./services/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";

import { Login } from "./components/Login";
import { AiAssistant } from "./components/AiAssistant";
import { Sidebar } from "./components/Sidebar";
import { FocusTimerModal } from "./components/FocusTimerModal";
import { AppModals } from "./components/AppModals";
import { ShortcutsModal } from "./components/ShortcutsModal";
import { useAppData } from "./hooks/useAppData";
import { SettingsView } from "./components/SettingsView";

// New Wrapper Views
import { FinanceiroView } from "./components/FinanceiroView";
import { InvestimentosView } from "./components/InvestimentosView";
import { PlanejamentoView } from "./components/PlanejamentoView";
import { ComprasView } from "./components/ComprasView";
import { SaudeView } from "./components/SaudeView";
import { FinancialCalendar } from "./components/FinancialCalendar";

const PIX_KEY = "028.268.001-24";
const PIX_NAME = "Alexandre Magno dos Santos Linhares";

import { Toaster } from "sonner";

const getInitialView = (): View => {
  try {
    // 1. Check URL hash first (e.g., #transactions, #TRANSACTIONS, #/transactions)
    if (typeof window !== "undefined" && window.location.hash) {
      const rawHash = window.location.hash.replace(/^#\/?/, "").trim();
      const upperHash = rawHash.toUpperCase();
      const match = Object.values(View).find(
        (v) => v.toUpperCase() === upperHash
      );
      if (match && match !== View.DASHBOARD) {
        return match;
      }
    }
    // 2. Check localStorage
    if (typeof localStorage !== "undefined") {
      const savedView = localStorage.getItem("nexo_current_view");
      if (
        savedView &&
        Object.values(View).includes(savedView as View) &&
        (savedView as View) !== View.DASHBOARD
      ) {
        return savedView as View;
      }
    }
  } catch (e) {
    console.error("Error reading initial view:", e);
  }
  return View.TRANSACTIONS;
};

export const getViewTitle = (view: View): string => {
  switch (view) {
    case View.TRANSACTIONS:
      return "Transações";
    case View.SUBSCRIPTIONS:
      return "Assinaturas";
    case View.DEBTS:
      return "Dívidas";
    case View.BUDGETS:
      return "Orçamentos";
    case View.PIX_KEYS:
      return "Chaves Pix";
    case View.FINANCEIRO_DASHBOARD:
      return "Financeiro";
    case View.INVESTMENTS:
      return "Meus Investimentos";
    case View.STOCKS_GROWTH:
      return "Motor de Crescimento";
    case View.SNOWBALL:
      return "Efeito Bola de Neve";
    case View.FINANCIAL_CHALLENGES:
      return "Desafios Financeiros";
    case View.WEALTH_PLANNER:
      return "Aposentadoria";
    case View.MERCADO_ESPORTIVO:
      return "Mercado Esportivo";
    case View.INVESTMENTS_DASHBOARD:
      return "Investimentos";
    case View.SHOPPING_LIST:
      return "Lista de Mercado";
    case View.INVENTORY:
      return "Despensa & Estoque";
    case View.KANBAN:
      return "Sonhos de Consumo";
    case View.NOTES:
      return "Notas Rápidas";
    case View.PASSWORDS:
      return "Cofre de Senhas";
    case View.PRODUCTIVITY:
      return "Foco (Pomodoro)";
    case View.WORK_GOALS:
      return "Trabalho";
    case View.DAILY_ROUTINES:
      return "Rotinas Diárias";
    case View.PLANEJAMENTO_DASHBOARD:
      return "Planejamento";
    case View.CALENDAR:
      return "Agenda";
    case View.TREINO:
      return "Ficha de Treino";
    case View.SAUDE_DASHBOARD:
      return "Saúde & Treino";
    case View.WALLETS:
      return "Minhas Carteiras";
    case View.SETTINGS:
      return "Configurações";
    case View.AI_ASSISTANT:
      return "Assistente IA";
    case View.DASHBOARD:
      return "Transações";
    default:
      return "Painel";
  }
};

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Custom Hook for all Data Logic
  const { data, setData, actions } = useAppData(user, isGuest);

  // UI State - persisted across page refreshes
  const [currentView, setCurrentView] = useState<View>(getInitialView);

  // Navigation History Stack with Session Persistence
  const [navigationHistory, setNavigationHistory] = useState<View[]>(() => {
    const init = getInitialView();
    try {
      const raw = sessionStorage.getItem("nexo_nav_history");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((v) => Object.values(View).includes(v));
          if (valid.length > 0) return valid;
        }
      }
    } catch (e) {}
    return [init];
  });

  const [historyIndex, setHistoryIndex] = useState<number>(() => {
    try {
      const rawIdx = sessionStorage.getItem("nexo_nav_index");
      if (rawIdx !== null) {
        const parsed = parseInt(rawIdx, 10);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    } catch (e) {}
    return 0;
  });

  // Save navigation history
  useEffect(() => {
    try {
      sessionStorage.setItem("nexo_nav_history", JSON.stringify(navigationHistory));
      sessionStorage.setItem("nexo_nav_index", String(historyIndex));
    } catch (e) {}
  }, [navigationHistory, historyIndex]);

  const canGoBack = historyIndex > 0;
  const previousView = canGoBack ? navigationHistory[historyIndex - 1] : null;
  const canGoForward = historyIndex < navigationHistory.length - 1;
  const nextView = canGoForward ? navigationHistory[historyIndex + 1] : null;

  const navigateTo = useCallback(
    (targetView: View, replace = false) => {
      let finalTarget = targetView;
      if (finalTarget === View.DASHBOARD) finalTarget = View.TRANSACTIONS;
      if (finalTarget === currentView) return;

      if (replace) {
        setNavigationHistory((prev) => {
          const copy = [...prev];
          copy[historyIndex] = finalTarget;
          return copy;
        });
        setCurrentView(finalTarget);
        return;
      }

      setNavigationHistory((prev) => {
        const upToCurrent = prev.slice(0, historyIndex + 1);
        return [...upToCurrent, finalTarget];
      });
      setHistoryIndex((prev) => prev + 1);
      setCurrentView(finalTarget);
    },
    [currentView, historyIndex]
  );

  const handleGoBack = useCallback(() => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const target = navigationHistory[prevIdx];
      setHistoryIndex(prevIdx);
      setCurrentView(target);
    }
  }, [historyIndex, navigationHistory]);

  const handleGoForward = useCallback(() => {
    if (historyIndex < navigationHistory.length - 1) {
      const nextIdx = historyIndex + 1;
      const target = navigationHistory[nextIdx];
      setHistoryIndex(nextIdx);
      setCurrentView(target);
    }
  }, [historyIndex, navigationHistory]);

  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("nexo_privacy_mode") === "true";
    } catch {
      return false;
    }
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("nexo_dark_mode");
      if (saved !== null) return saved === "true";
      return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // Synchronize currentView with localStorage & URL hash, and scroll to top
  useEffect(() => {
    try {
      localStorage.setItem("nexo_current_view", currentView);
      const targetHash = `#${currentView.toLowerCase()}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, "", targetHash);
      }
      if (mainRef.current) {
        mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (e) {
      console.error("Error persisting current view:", e);
    }
  }, [currentView]);

  // Ensure any legacy routes redirect cleanly
  useEffect(() => {
    if (currentView === View.DASHBOARD) {
      setCurrentView(View.TRANSACTIONS);
    } else if (currentView === View.STOCKS_GROWTH) {
      setCurrentView(View.INVESTMENTS);
    }
  }, [currentView]);

  const handleMainScroll = () => {
    if (mainRef.current) {
      setShowScrollTop(mainRef.current.scrollTop > 280);
    }
  };

  const scrollToTop = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Listen to browser navigation (back/forward or hash change)
  useEffect(() => {
    const handleHashChange = () => {
      try {
        const rawHash = window.location.hash.replace(/^#\/?/, "").trim();
        const upperHash = rawHash.toUpperCase();
        let match = Object.values(View).find(
          (v) => v.toUpperCase() === upperHash
        );
        if (match === View.DASHBOARD) match = View.TRANSACTIONS;
        if (match && match !== currentView) {
          if (historyIndex > 0 && navigationHistory[historyIndex - 1] === match) {
            setHistoryIndex((prev) => prev - 1);
            setCurrentView(match);
          } else if (historyIndex < navigationHistory.length - 1 && navigationHistory[historyIndex + 1] === match) {
            setHistoryIndex((prev) => prev + 1);
            setCurrentView(match);
          } else {
            navigateTo(match);
          }
        }
      } catch (e) {
        console.error("Error handling hash change:", e);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [currentView, historyIndex, navigationHistory, navigateTo]);

  // Persist privacy and dark mode settings
  useEffect(() => {
    try {
      localStorage.setItem("nexo_privacy_mode", String(privacyMode));
    } catch (e) {}
  }, [privacyMode]);

  useEffect(() => {
    try {
      localStorage.setItem("nexo_dark_mode", String(darkMode));
    } catch (e) {}
  }, [darkMode]);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Modals & Keys
  const [quickActionSignal, setQuickActionSignal] = useState<number>(0);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [userKeyInput, setUserKeyInput] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PWA Install Logic
  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  useEffect(() => {
    // Safety fallback: ensure authLoading doesn't stay true indefinitely if Firebase hangs or is blocked
    const timer = setTimeout(() => {
      setAuthLoading(false);
    }, 2500);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      clearTimeout(timer);
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        setIsGuest(false);
        const localData = loadData("guest_user");
        if (localData.transactions.length > 0) {
          if (
            confirm(
              "Encontramos dados no modo convidado. Deseja migrar para sua conta na nuvem?",
            )
          ) {
            await migrateLocalToCloud(currentUser.uid, localData);
            localStorage.removeItem("finansmart_data_v2_guest_user");
          }
        }
      }
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authLoading && isGuest) {
      saveData(data, "guest_user");
    }
  }, [data, isGuest, authLoading]);

  const handleGuestLogin = () => {
    setIsGuest(true);
    const guestData = loadData("guest_user");
    setData(guestData);
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("nexo_current_view");
      window.history.replaceState(null, "", "#transactions");
    } catch (e) {}
    setCurrentView(View.TRANSACTIONS);
    if (isGuest) {
      setIsGuest(false);
      setData({
        transactions: [],
        investments: [],
        budgets: [],
        debts: [],
        shoppingList: [],
        unlockedBadges: [],
        kanbanColumns: [],
        kanbanBoards: [],
        notes: [],
        passwords: [],
        categories: [],
        agendaEvents: [],
        pixKeys: [],
        taskLists: [],
        tasks: [],
        habits: [],
        dailyRoutines: [],
      });
    } else {
      await signOut(auth);
    }
  };

  useEffect(() => {
    setHasKey(hasCustomApiKey());
    if (hasCustomApiKey()) {
      setUserKeyInput(getApiKey() || "");
    }
    const hasSeenWelcome = localStorage.getItem("nexo_welcome_seen");
    if (!hasSeenWelcome && (user || isGuest)) {
      setShowWelcome(true);
    }
  }, [user, isGuest]);

  // Helpers
  const handleSaveKey = () => {
    if (userKeyInput.trim()) {
      setApiKey(userKeyInput.trim());
      setHasKey(true);
      setIsKeyModalOpen(false);
      alert("Chave API salva no seu navegador com sucesso!");
    }
  };

  const handleRemoveKey = () => {
    removeApiKey();
    setUserKeyInput("");
    setHasKey(false);
    setIsKeyModalOpen(false);
  };

  const handleFinishWelcome = () => {
    if (userKeyInput.trim()) {
      setApiKey(userKeyInput.trim());
      setHasKey(true);
    }
    localStorage.setItem("nexo_welcome_seen", "true");
    setShowWelcome(false);
  };

  const copyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    alert("Chave Pix copiada!");
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleFactoryReset = () => {
    if (
      confirm(
        "⚠️ ATENÇÃO: Isso apagará TODOS os dados, configurações e chave API deste navegador.\n\nDeseja realmente resetar o app para o estado de fábrica?",
      )
    ) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleExportBackup = () => {
    const dataStr = JSON.stringify(data);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", "nexo_backup.json");
    linkElement.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (confirm("Isso substituirá seus dados atuais. Tem certeza?")) {
          if (user) {
            await migrateLocalToCloud(user.uid, json);
          } else {
            setData(json);
          }
          alert("Backup restaurado com sucesso!");
        }
      } catch (err) {
        alert("Erro ao ler arquivo de backup.");
      }
    };
    reader.readAsText(file);
  };

  const triggerQuickAction = (view: View) => {
    navigateTo(view);
    setMobileMenuOpen(false);
    setTimeout(() => setQuickActionSignal(Date.now()), 50);
  };

  // View Renderer - Logic Updated for Grouped Views
  const renderContent = () => {
    if (currentView === View.AI_ASSISTANT) {
      return <AiAssistant data={data} privacyMode={privacyMode} />;
    }

    if (currentView === View.SETTINGS) {
      return (
        <SettingsView
          data={data}
          actions={actions}
          privacyMode={privacyMode}
          setPrivacyMode={setPrivacyMode}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          hasApiKey={hasKey}
          onOpenKeyModal={() => setIsKeyModalOpen(true)}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          onFactoryReset={handleFactoryReset}
        />
      );
    }

    // 2. Group: Financeiro (Transactions, Subscriptions, Debts, Budgets, Pix Keys)
    if (
      [
        View.FINANCEIRO_DASHBOARD,
        View.TRANSACTIONS, 
        View.SUBSCRIPTIONS, 
        View.DEBTS, 
        View.BUDGETS, 
        View.PIX_KEYS
      ].includes(currentView)
    ) {
      return (
        <FinanceiroView
          currentView={currentView}
          onNavigate={navigateTo}
          data={data}
          actions={actions}
          privacyMode={privacyMode}
          hasApiKey={hasKey}
          quickActionSignal={quickActionSignal}
        />
      );
    }

    // 2.5. Group: Investimentos (Meus Investimentos, Bola de Neve, Desafios Financeiros, Aposentadoria)
    if (
      [
        View.INVESTMENTS_DASHBOARD,
        View.INVESTMENTS,
        View.SNOWBALL,
        View.FINANCIAL_CHALLENGES,
        View.WEALTH_PLANNER,
      ].includes(currentView)
    ) {
      return (
        <InvestimentosView
          currentView={currentView}
          onNavigate={navigateTo}
          data={data}
          actions={actions}
          privacyMode={privacyMode}
          hasApiKey={hasKey}
          quickActionSignal={quickActionSignal}
        />
      );
    }

    // 3. Group: Compras (Shopping List, Inventory, Nexo Sonhos de Consumo)
    if ([View.SHOPPING_LIST, View.INVENTORY, View.KANBAN].includes(currentView)) {
      return (
        <ComprasView
          currentView={currentView}
          onNavigate={navigateTo}
          data={data}
          actions={actions}
          privacyMode={privacyMode}
          hasApiKey={hasKey}
          quickActionSignal={quickActionSignal}
        />
      );
    }

    // 4. Group: Productivity (Notes, Habits, Work Goals, Passwords)
    if ([View.PLANEJAMENTO_DASHBOARD, View.NOTES, View.PRODUCTIVITY, View.WORK_GOALS, View.PASSWORDS].includes(currentView)) {
      return (
        <PlanejamentoView
          currentView={currentView}
          onNavigate={navigateTo}
          data={data}
          actions={actions}
          privacyMode={privacyMode}
          hasApiKey={hasKey}
          quickActionSignal={quickActionSignal}
        />
      );
    }

    // 4.5. Standalone: Calendar
    if (currentView === View.CALENDAR) {
      return (
        <div className="animate-fade-in">
          <FinancialCalendar
            currentView={currentView}
            transactions={data.transactions}
            budgets={data.budgets}
            agendaEvents={data.agendaEvents}
            taskLists={data.taskLists}
            tasks={data.tasks}
            onAddTransaction={actions.addTransaction}
            onUpdateTransaction={actions.updateTransaction}
            onAddAgendaEvent={actions.addAgendaEvent}
            onUpdateAgendaEvent={actions.updateAgendaEvent}
            onDeleteAgendaEvent={actions.deleteAgendaEvent}
            onAddTaskList={actions.addTaskList}
            onUpdateTaskList={actions.updateTaskList}
            onDeleteTaskList={actions.deleteTaskList}
            onAddTask={actions.addTask}
            onUpdateTask={actions.updateTask}
            onDeleteTask={actions.deleteTask}
            privacyMode={privacyMode}
            onNavigate={navigateTo}
          />
        </div>
      );
    }

    // 6. Group: Saude (Treino)
    if ([View.SAUDE_DASHBOARD, View.TREINO].includes(currentView)) {
      return (
        <SaudeView
          currentView={currentView}
          onNavigate={navigateTo}
          data={data}
          actions={actions}
        />
      );
    }

    // Fallback: Default to Transações
    return (
      <FinanceiroView
        currentView={View.TRANSACTIONS}
        onNavigate={navigateTo}
        data={data}
        actions={actions}
        privacyMode={privacyMode}
        hasApiKey={hasKey}
        quickActionSignal={quickActionSignal}
      />
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!user && !isGuest) {
    return <Login onGuestLogin={handleGuestLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      <Sidebar
        user={user}
        isGuest={isGuest}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        currentView={currentView}
        onNavigate={navigateTo}
        onLogout={handleLogout}
        privacyMode={privacyMode}
        setPrivacyMode={setPrivacyMode}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        hasKey={hasKey}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        onOpenDonateModal={() => setIsDonateModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onFactoryReset={handleFactoryReset}
        canInstall={!!deferredPrompt}
        onInstall={handleInstallClick}
        driveLink={data.driveLink}
        onSetDriveLink={actions.setDriveLink}
      />

      <main
        ref={mainRef}
        onScroll={handleMainScroll}
        className="flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-8 overflow-y-auto h-screen scroll-smooth relative"
      >
        <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 p-4 border-b border-slate-800 z-30 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-slate-300 hover:text-white p-1"
              title="Abrir Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Botão Voltar Mobile */}
            <button
              onClick={handleGoBack}
              disabled={!canGoBack}
              className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
                canGoBack
                  ? "text-white bg-slate-800 border-slate-700 hover:bg-slate-700 active:scale-95 shadow-sm"
                  : "text-slate-600 border-slate-800/40 bg-slate-900/40 opacity-40 cursor-not-allowed"
              }`}
              title={
                canGoBack && previousView
                  ? `Voltar para: ${getViewTitle(previousView)}`
                  : "Nenhuma tela anterior"
              }
              aria-label="Voltar para a tela anterior"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 ml-1">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Hexagon className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white tracking-tight">NEXO</span>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="text-emerald-400 hover:text-white animate-pulse"
                title="Instalar Aplicativo"
              >
                <AppWindow className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => setIsKeyModalOpen(true)}
              className={`${hasKey ? "text-emerald-400" : "text-rose-500"} hover:text-white relative`}
            >
              <Key className="w-5 h-5" />
              {!hasKey && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto animate-fade-in">
          {/* Barra Universal Superior com Botão Voltar em Todas as Telas */}
          <div className="mb-5 flex items-center justify-between gap-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={handleGoBack}
                disabled={!canGoBack}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold transition-all ${
                  canGoBack
                    ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:border-indigo-600 dark:hover:text-white cursor-pointer active:scale-95 shadow-xs"
                    : "bg-slate-100/50 dark:bg-slate-800/40 border-slate-200/40 dark:border-slate-800/40 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-45"
                }`}
                title={
                  canGoBack && previousView
                    ? `Voltar para: ${getViewTitle(previousView)}`
                    : "Nenhuma tela anterior acessada"
                }
              >
                <ArrowLeft className={`w-4 h-4 transition-transform ${canGoBack ? "group-hover:-translate-x-0.5" : ""}`} />
                <span>Voltar</span>
              </button>

              {canGoForward && (
                <button
                  onClick={handleGoForward}
                  className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold transition-all bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:border-indigo-600 dark:hover:text-white cursor-pointer active:scale-95 shadow-xs"
                  title={`Avançar para: ${nextView ? getViewTitle(nextView) : ""}`}
                >
                  <span>Avançar</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              )}

              {canGoBack && previousView && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-400 dark:text-slate-500">Tela anterior:</span>
                  <button
                    onClick={handleGoBack}
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {getViewTitle(previousView)}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="hidden md:inline text-slate-400 dark:text-slate-500">Você está em:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                {getViewTitle(currentView)}
              </span>
            </div>
          </div>

          {renderContent()}
        </div>

        {/* Botão Flutuante de Voltar ao Topo (posicionado acima do botão de ação flutuante para não sobrepor) */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-36 right-5 md:bottom-24 md:right-9 z-30 w-11 h-11 bg-slate-900/90 hover:bg-slate-800 dark:bg-slate-700/95 dark:hover:bg-slate-600 text-white rounded-full shadow-xl shadow-slate-900/20 border border-slate-700/40 dark:border-slate-500/40 backdrop-blur-sm transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
            title="Voltar ao topo da tela"
            aria-label="Voltar ao topo"
          >
            <ArrowUp className="w-5 h-5 animate-bounce" />
          </button>
        )}
      </main>

      <FocusTimerModal />
      <AppModals
        showWelcome={showWelcome}
        isDonateModalOpen={isDonateModalOpen}
        isKeyModalOpen={isKeyModalOpen}
        userKeyInput={userKeyInput}
        hasKey={hasKey}
        PIX_KEY={PIX_KEY}
        PIX_NAME={PIX_NAME}
        setShowWelcome={setShowWelcome}
        setIsDonateModalOpen={setIsDonateModalOpen}
        setIsKeyModalOpen={setIsKeyModalOpen}
        setUserKeyInput={setUserKeyInput}
        handleSaveKey={handleSaveKey}
        handleRemoveKey={handleRemoveKey}
        handleFinishWelcome={handleFinishWelcome}
        copyPix={copyPix}
      />
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
      <Toaster position="top-right" richColors />
    </div>
  );
};

export default App;
