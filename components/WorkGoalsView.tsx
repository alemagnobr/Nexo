import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  Clock,
  Timer,
  Package,
  CalendarDays,
  History,
  X,
  DollarSign,
  Sparkles,
  CheckCircle2,
  Briefcase,
  FolderPlus,
  ArrowLeft,
  Info,
  ChevronRight,
  Flag,
  RotateCcw,
} from "lucide-react";
import { WorkGoal, WorkProject, WorkGoalUnit, WorkGoalFinalization } from "../types";

interface WorkGoalsViewProps {
  projects: WorkProject[];
  goals: WorkGoal[];
  onAddProject: (project: WorkProject) => void;
  onUpdateProject: (id: string, partial: Partial<WorkProject>) => void;
  onDeleteProject: (id: string) => void;
  onAddGoal: (goal: WorkGoal) => void;
  onUpdateGoal: (id: string, partial: Partial<WorkGoal>) => void;
  onDeleteGoal: (id: string) => void;
}

export const getUnitDetails = (unitType?: WorkGoalUnit) => {
  switch (unitType) {
    case "minutes":
      return {
        label: "Minutos",
        singular: "minuto",
        short: "min",
        rateLabel: "por minuto",
        icon: Timer,
        actionLabel: "Registrar Minutos",
        placeholderQty: "Ex: 300",
        placeholderRate: "Ex: 2.50",
      };
    case "deliveries":
      return {
        label: "Entregas",
        singular: "entrega",
        short: "entregas",
        rateLabel: "por entrega",
        icon: Package,
        actionLabel: "Registrar Entregas",
        placeholderQty: "Ex: 10",
        placeholderRate: "Ex: 150.00",
      };
    case "hours":
    default:
      return {
        label: "Horas",
        singular: "hora",
        short: "h",
        rateLabel: "por hora",
        icon: Clock,
        actionLabel: "Registrar Horas",
        placeholderQty: "Ex: 40",
        placeholderRate: "Ex: 50.00",
      };
  }
};

const formatCurrency = (val: number) => {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export const WorkGoalsView: React.FC<WorkGoalsViewProps> = ({
  projects,
  goals,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Project Modals
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectFormData, setProjectFormData] = useState<{
    id: string;
    name: string;
    description: string;
    color: string;
  }>({ id: "", name: "", description: "", color: "emerald" });

  // Goal Modals
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isAddQtyModalOpen, setIsAddQtyModalOpen] = useState<{
    isOpen: boolean;
    goalId: string | null;
    quantity: string;
    customValue: string;
    notes: string;
    date: string;
  }>({ isOpen: false, goalId: null, quantity: "", customValue: "", notes: "", date: "" });

  const [selectedGoalHistoryId, setSelectedGoalHistoryId] = useState<string | null>(null);

  const [goalsSubTab, setGoalsSubTab] = useState<"active" | "completed">("active");

  // Finalize Goal Modal
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState<{
    isOpen: boolean;
    goal: WorkGoal | null;
    startDate: string;
    endDate: string;
    notes: string;
    finalizationType: "conclude" | "recurring";
  }>({
    isOpen: false,
    goal: null,
    startDate: "",
    endDate: new Date().toISOString().split("T")[0],
    notes: "",
    finalizationType: "conclude",
  });

  // Finalization Details Modal
  const [selectedFinalization, setSelectedFinalization] = useState<{
    goalTitle: string;
    finalization: WorkGoalFinalization;
    goalId: string;
  } | null>(null);

  const [goalFormData, setGoalFormData] = useState<{
    id: string;
    title: string;
    targetQuantity: string;
    unitType: WorkGoalUnit;
    unitValue: string;
    startDate: string;
    deadline: string;
  }>({
    id: "",
    title: "",
    targetQuantity: "",
    unitType: "hours",
    unitValue: "",
    startDate: "",
    deadline: "",
  });

  // Handle Project Save
  const handleOpenProjectModal = (proj?: WorkProject) => {
    if (proj) {
      setProjectFormData({
        id: proj.id,
        name: proj.name,
        description: proj.description || "",
        color: proj.color || "emerald",
      });
    } else {
      setProjectFormData({
        id: "",
        name: "",
        description: "",
        color: "emerald",
      });
    }
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectFormData.name.trim()) return;

    if (projectFormData.id === "unassigned") {
      const newProjId = crypto.randomUUID();
      const newProj: WorkProject = {
        id: newProjId,
        name: projectFormData.name.trim(),
        description: projectFormData.description.trim() || undefined,
        color: projectFormData.color,
        createdAt: new Date().toISOString(),
      };
      onAddProject(newProj);
      // Update all unassigned goals to belong to this new project
      const unassignedList = goals.filter((g) => !g.projectId);
      unassignedList.forEach((g) => {
        onUpdateGoal(g.id, { projectId: newProjId });
      });
      if (selectedProjectId === "unassigned") {
        setSelectedProjectId(newProjId);
      }
    } else if (projectFormData.id) {
      onUpdateProject(projectFormData.id, {
        name: projectFormData.name.trim(),
        description: projectFormData.description.trim() || undefined,
        color: projectFormData.color,
      });
    } else {
      const newProj: WorkProject = {
        id: crypto.randomUUID(),
        name: projectFormData.name.trim(),
        description: projectFormData.description.trim() || undefined,
        color: projectFormData.color,
        createdAt: new Date().toISOString(),
      };
      onAddProject(newProj);
      // Automatically open the newly created project
      setSelectedProjectId(newProj.id);
    }
    setIsProjectModalOpen(false);
  };

  // Handle Goal Modal
  const handleOpenGoalModal = (goal?: WorkGoal) => {
    if (goal) {
      setGoalFormData({
        id: goal.id,
        title: goal.title,
        targetQuantity: (goal.targetHours || 0).toString(),
        unitType: goal.unitType || "hours",
        unitValue: goal.unitValue ? goal.unitValue.toString() : "",
        startDate: goal.startDate || "",
        deadline: goal.deadline || "",
      });
    } else {
      setGoalFormData({
        id: "",
        title: "",
        targetQuantity: "",
        unitType: "hours",
        unitValue: "",
        startDate: "",
        deadline: "",
      });
    }
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalFormData.title || !goalFormData.targetQuantity) return;

    const targetQty = parseFloat(goalFormData.targetQuantity);
    const valPerUnit = goalFormData.unitValue ? parseFloat(goalFormData.unitValue) : undefined;

    if (goalFormData.id) {
      onUpdateGoal(goalFormData.id, {
        title: goalFormData.title,
        targetHours: targetQty,
        unitType: goalFormData.unitType,
        unitValue: isNaN(valPerUnit || NaN) ? undefined : valPerUnit,
        startDate: goalFormData.startDate || undefined,
        deadline: goalFormData.deadline || undefined,
      });
    } else {
      onAddGoal({
        id: crypto.randomUUID(),
        projectId: selectedProjectId || undefined,
        title: goalFormData.title,
        targetHours: targetQty,
        completedHours: 0,
        unitType: goalFormData.unitType,
        unitValue: isNaN(valPerUnit || NaN) ? undefined : valPerUnit,
        startDate: goalFormData.startDate || undefined,
        deadline: goalFormData.deadline || undefined,
        createdAt: new Date().toISOString(),
      });
    }
    setIsGoalModalOpen(false);
  };

  const handleAddQuantity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddQtyModalOpen.goalId || !isAddQtyModalOpen.quantity) return;
    const qty = parseFloat(isAddQtyModalOpen.quantity);
    if (isNaN(qty) || qty <= 0) return;

    const goal = goals.find((g) => g.id === isAddQtyModalOpen.goalId);
    if (goal) {
      const customVal =
        isAddQtyModalOpen.customValue.trim() !== ""
          ? parseFloat(isAddQtyModalOpen.customValue)
          : undefined;
      const entryDate = isAddQtyModalOpen.date
        ? new Date(isAddQtyModalOpen.date + "T12:00:00").toISOString()
        : new Date().toISOString();
      const newEntry = {
        id: crypto.randomUUID(),
        date: entryDate,
        hours: qty,
        notes: isAddQtyModalOpen.notes,
        value: customVal !== undefined && !isNaN(customVal) ? customVal : undefined,
      };

      const currentHistory = goal.history || [];
      const newHistory = [newEntry, ...currentHistory].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      onUpdateGoal(goal.id, {
        completedHours: (goal.completedHours || 0) + qty,
        history: newHistory,
      });
    }
    setIsAddQtyModalOpen({
      isOpen: false,
      goalId: null,
      quantity: "",
      customValue: "",
      notes: "",
      date: "",
    });
  };

  const handleDeleteHistoryEntry = (goalId: string, historyId: string, qty: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (goal && goal.history) {
      const updatedHistory = goal.history.filter((h) => h.id !== historyId);
      onUpdateGoal(goal.id, {
        completedHours: Math.max(0, (goal.completedHours || 0) - qty),
        history: updatedHistory,
      });
    }
  };

  // Finalize Goal Handler
  const handleOpenFinalizeModal = (goal: WorkGoal) => {
    let defaultStart = goal.startDate || "";
    if (!defaultStart && goal.history && goal.history.length > 0) {
      const sortedHistory = [...goal.history].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      defaultStart = sortedHistory[0].date.split("T")[0];
    }
    if (!defaultStart) {
      defaultStart = goal.createdAt.split("T")[0];
    }

    setIsFinalizeModalOpen({
      isOpen: true,
      goal,
      startDate: defaultStart,
      endDate: new Date().toISOString().split("T")[0],
      notes: "",
      finalizationType: "conclude",
    });
  };

  const handleConfirmFinalizeGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const { goal, startDate, endDate, notes, finalizationType } = isFinalizeModalOpen;
    if (!goal) return;

    const unitVal = goal.unitValue || 0;
    const completedQty = goal.completedHours || 0;
    const targetQty = goal.targetHours || 0;

    const totalCompletedValue =
      goal.history && goal.history.length > 0
        ? goal.history.reduce((acc, h) => acc + (h.value ?? h.hours * unitVal), 0)
        : completedQty * unitVal;

    const percentage = targetQty > 0 ? (completedQty / targetQty) * 100 : 0;

    const finalizationRecord: WorkGoalFinalization = {
      id: crypto.randomUUID(),
      finalizedAt: new Date().toISOString(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      targetQuantity: targetQty,
      completedQuantity: completedQty,
      percentage,
      unitType: goal.unitType,
      unitValue: goal.unitValue,
      totalValue: totalCompletedValue,
      notes: notes.trim() || undefined,
      historyEntries: [...(goal.history || [])],
    };

    const updatedFinalizations = [finalizationRecord, ...(goal.finalizations || [])];

    onUpdateGoal(goal.id, {
      completedHours: 0,
      history: [],
      finalizations: updatedFinalizations,
      isCompleted: true,
      status: "completed",
    });

    setIsFinalizeModalOpen({
      isOpen: false,
      goal: null,
      startDate: "",
      endDate: "",
      notes: "",
      finalizationType: "conclude",
    });
  };

  const handleConcludeGoal = (goalId: string) => {
    onUpdateGoal(goalId, {
      isCompleted: true,
      status: "completed",
    });
  };

  const handleReopenGoal = (goalId: string) => {
    onUpdateGoal(goalId, {
      isCompleted: false,
      status: "active",
    });
  };

  const handleDeleteFinalizationRecord = (goalId: string, finalizationId: string) => {
    if (!confirm("Deseja realmente excluir este registro de finalização do histórico?")) return;
    const goal = goals.find((g) => g.id === goalId);
    if (goal && goal.finalizations) {
      const updated = goal.finalizations.filter((f) => f.id !== finalizationId);
      onUpdateGoal(goal.id, { finalizations: updated });
    }
    setSelectedFinalization(null);
  };

  const handleRestoreFinalization = (goalId: string, finalizationId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || !goal.finalizations) return;

    const finToRestore = goal.finalizations.find((f) => f.id === finalizationId);
    if (!finToRestore) return;

    if (
      !confirm(
        `Deseja restaurar este ciclo finalizado de volta para a meta ativa?\n\nOs ${finToRestore.completedQuantity} registros deste ciclo serão devolvidos à meta atual para dar continuidade.`
      )
    ) {
      return;
    }

    const updatedFinalizations = goal.finalizations.filter((f) => f.id !== finalizationId);

    const restoredHistory = [
      ...(goal.history || []),
      ...(finToRestore.historyEntries || []),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const updatedCompletedHours = (goal.completedHours || 0) + finToRestore.completedQuantity;

    onUpdateGoal(goal.id, {
      completedHours: updatedCompletedHours,
      history: restoredHistory,
      finalizations: updatedFinalizations,
      isCompleted: false,
      status: "active",
    });

    if (selectedFinalization?.finalization.id === finalizationId) {
      setSelectedFinalization(null);
    }
  };

  // Find selected project details
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  // If no project selected, view Projects Screen (Screen 1)
  if (!selectedProjectId) {
    // Check if there are goals with no projectId or goals assigned to projects
    const unassignedGoals = goals.filter((g) => !g.projectId);

    return (
      <div className="p-4 md:p-8 space-y-8 animate-fade-in">
        {/* Header Projetos */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-xl">
                <Briefcase className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                  Projetos de Trabalho
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Crie e selecione um projeto para gerenciar suas metas e históricos separadamente.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => handleOpenProjectModal()}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all text-sm shrink-0"
          >
            <FolderPlus className="w-5 h-5" /> Novo Projeto
          </button>
        </div>

        {/* List / Grid of Projects */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card for Unassigned / Default Goals if any exist */}
          {unassignedGoals.length > 0 && (
            <div
              onClick={() => setSelectedProjectId("unassigned")}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-sm transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-100 dark:from-slate-700 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                    Projeto Principal
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setProjectFormData({
                          id: "unassigned",
                          name: "Geral / Sem Projeto",
                          description: "Metas de trabalho iniciais cadastrados no sistema.",
                          color: "emerald",
                        });
                        setIsProjectModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Editar Nome do Projeto"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>

                <h3 className="font-bold text-xl text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Geral / Sem Projeto
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 line-clamp-2">
                  Metas de trabalho iniciais cadastrados no sistema.
                </p>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Metas Ativas
                    </span>
                    <span className="text-base font-extrabold text-slate-800 dark:text-white">
                      {unassignedGoals.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Status
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Disponível
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3">
                <span className="w-full py-2.5 bg-slate-50 dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  Abrir Projeto <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          )}

          {/* User Projects List */}
          {projects.map((proj) => {
            const projGoals = goals.filter((g) => g.projectId === proj.id);
            const activeGoalsCount = projGoals.length;

            // Calculate total finalized value across goals in this project
            const totalFinalizedVal = projGoals.reduce((acc, g) => {
              if (!g.finalizations) return acc;
              return acc + g.finalizations.reduce((fAcc, f) => fAcc + (f.totalValue || 0), 0);
            }, 0);

            // Calculate active goals completed value
            const activeCompletedVal = projGoals.reduce((acc, g) => {
              const uVal = g.unitValue || 0;
              const val =
                g.history && g.history.length > 0
                  ? g.history.reduce((hAcc, h) => hAcc + (h.value ?? h.hours * uVal), 0)
                  : (g.completedHours || 0) * uVal;
              return acc + val;
            }, 0);

            const totalValueGenerated = totalFinalizedVal + activeCompletedVal;

            return (
              <div
                key={proj.id}
                onClick={() => setSelectedProjectId(proj.id)}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                      Projeto
                    </span>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenProjectModal(proj)}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Editar Projeto"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Deseja realmente excluir o projeto "${proj.name}"? As metas continuarão salvas.`
                            )
                          ) {
                            onDeleteProject(proj.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Excluir Projeto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-xl text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {proj.name}
                  </h3>
                  {proj.description && (
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>
                  )}

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Metas Cadastradas
                      </span>
                      <span className="text-base font-extrabold text-slate-800 dark:text-white">
                        {activeGoalsCount} {activeGoalsCount === 1 ? "meta" : "metas"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Total Atingido
                      </span>
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(totalValueGenerated)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3">
                  <span className="w-full py-2.5 bg-slate-50 dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                    Ver Metas do Projeto <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}

          {projects.length === 0 && unassignedGoals.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800">
              <Briefcase className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
                Nenhum projeto cadastrado
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm max-w-sm mx-auto">
                Crie seu primeiro projeto para agrupar e gerenciar suas metas e históricos de finalização.
              </p>
              <button
                onClick={() => handleOpenProjectModal()}
                className="mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all text-sm"
              >
                <FolderPlus className="w-4 h-4" /> Criar Primeiro Projeto
              </button>
            </div>
          )}
        </div>

        {/* Modal Criar / Editar Projeto */}
        {isProjectModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  {projectFormData.id ? "Editar Projeto" : "Novo Projeto de Trabalho"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProject} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                    Nome do Projeto
                  </label>
                  <input
                    required
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                    value={projectFormData.name}
                    onChange={(e) =>
                      setProjectFormData({ ...projectFormData, name: e.target.value })
                    }
                    placeholder="Ex: Consultoria Empresa Alpha, Redesign App..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                    Descrição do Projeto (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    value={projectFormData.description}
                    onChange={(e) =>
                      setProjectFormData({ ...projectFormData, description: e.target.value })
                    }
                    placeholder="Detalhes ou objetivos deste projeto..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsProjectModalOpen(false)}
                    className="flex-1 py-3 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-colors text-sm"
                  >
                    Salvar Projeto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // SCREEN 2: Inside a selected Project - Show Metas of this project
  const isDefaultUnassigned = selectedProjectId === "unassigned";
  const projectTitle = isDefaultUnassigned
    ? "Projeto Principal (Geral)"
    : currentProject?.name || "Projeto";
  const projectDesc = isDefaultUnassigned
    ? "Metas de trabalho sem projeto específico associado."
    : currentProject?.description;

  const projectGoals = goals.filter((g) => {
    if (isDefaultUnassigned) {
      return !g.projectId;
    }
    return g.projectId === selectedProjectId;
  });

  const activeProjectGoals = projectGoals.filter(
    (g) => !g.isCompleted && g.status !== "completed"
  );
  const completedProjectGoals = projectGoals.filter(
    (g) => g.isCompleted || g.status === "completed"
  );

  const displayedGoals =
    goalsSubTab === "active" ? activeProjectGoals : completedProjectGoals;

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in">
      {/* Top Navigation & Project Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <button
          onClick={() => setSelectedProjectId(null)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-600 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Todos os Projetos
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-xl">
                <Briefcase className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                    {projectTitle}
                  </h2>
                  <button
                    onClick={() => {
                      if (isDefaultUnassigned) {
                        setProjectFormData({
                          id: "unassigned",
                          name: "Geral / Sem Projeto",
                          description: "Metas de trabalho sem projeto específico associado.",
                          color: "emerald",
                        });
                        setIsProjectModalOpen(true);
                      } else if (currentProject) {
                        handleOpenProjectModal(currentProject);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Editar Nome do Projeto"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                {projectDesc && (
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                    {projectDesc}
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleOpenGoalModal()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all text-sm shrink-0"
          >
            <Plus className="w-5 h-5" /> Nova Meta do Projeto
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
        <button
          onClick={() => setGoalsSubTab("active")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            goalsSubTab === "active"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
          }`}
        >
          <span>Metas Ativas</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              goalsSubTab === "active"
                ? "bg-emerald-700 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            }`}
          >
            {activeProjectGoals.length}
          </span>
        </button>

        <button
          onClick={() => setGoalsSubTab("completed")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            goalsSubTab === "completed"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Metas Concluídas / Finalizadas</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              goalsSubTab === "completed"
                ? "bg-emerald-700 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            }`}
          >
            {completedProjectGoals.length}
          </span>
        </button>
      </div>

      {/* Grid of Goals for this Project */}
      {displayedGoals.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">
            {goalsSubTab === "active"
              ? "Nenhuma meta ativa neste projeto."
              : "Nenhuma meta concluída ou finalizada neste projeto ainda."}
          </p>
          {goalsSubTab === "active" && (
            <button
              onClick={() => handleOpenGoalModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Criar Primeira Meta
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayedGoals.map((goal) => {
          const unit = getUnitDetails(goal.unitType);
          const UnitIcon = unit.icon;
          const targetQty = goal.targetHours || 0;
          const completedQty = goal.completedHours || 0;
          const progress = targetQty > 0 ? Math.min((completedQty / targetQty) * 100, 100) : 0;
          const unitValue = goal.unitValue || 0;

          const totalCompletedValue =
            goal.history && goal.history.length > 0
              ? goal.history.reduce((acc, h) => acc + (h.value ?? h.hours * unitValue), 0)
              : completedQty * unitValue;
          const remainingQty = Math.max(0, targetQty - completedQty);
          const totalTargetValue = totalCompletedValue + remainingQty * unitValue;

          return (
            <div
              key={goal.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between relative overflow-hidden"
            >
              <div>
                {/* Header Card */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        <UnitIcon className="w-3.5 h-3.5 text-emerald-500" />
                        {unit.label}
                      </span>
                      {(goal.isCompleted || goal.status === "completed") && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Concluída
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-2 leading-tight">
                      {goal.title}
                    </h3>
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <button
                      onClick={() => setSelectedGoalHistoryId(goal.id)}
                      className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Histórico de Registros"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenGoalModal(goal)}
                      className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Editar Meta"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Excluir Meta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* If Goal is Completed/Finalized: Show clean status banner */}
                {goal.isCompleted || goal.status === "completed" ? (
                  <div className="my-3 p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <p className="font-bold text-emerald-900 dark:text-emerald-100">
                          Meta Concluída e Arquivada
                        </p>
                        <p className="text-emerald-700 dark:text-emerald-300 text-[11px]">
                          Registrada no histórico abaixo. Use o botão Restaurar para reabrir este ciclo.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleReopenGoal(goal.id)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold rounded-xl border border-amber-200/80 dark:border-amber-800/80 transition-colors shadow-sm flex items-center gap-1 text-[11px] shrink-0"
                      title="Reabrir meta para novos lançamentos"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reabrir Meta
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Progress Bar & Quantity */}
                    <div className="my-3">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <UnitIcon className="w-4 h-4 text-emerald-500" />
                          {completedQty} / {targetQty} {unit.short}
                        </span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden border border-slate-200 dark:border-slate-600">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Financial Summary Box (If unitValue configured) */}
                    {unitValue > 0 && (
                      <div className="mt-3 p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            Valor por {unit.singular}:
                          </span>
                          <span className="font-bold">{formatCurrency(unitValue)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/40 dark:border-emerald-800/30">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                              Acumulado Ciclo Atual
                            </span>
                            <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                              {formatCurrency(totalCompletedValue)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                              Meta Final Ciclo
                            </span>
                            <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                              {formatCurrency(totalTargetValue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dates & Pace Calculations */}
                    {(goal.deadline || goal.startDate) && (
                      <div className="mt-3 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                        {goal.startDate && (
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                            <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                            Início: {new Date(goal.startDate + "T12:00:00").toLocaleDateString("pt-BR")}
                          </p>
                        )}
                        {goal.deadline && (
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                            <CalendarDays className="w-3.5 h-3.5 text-emerald-500" />
                            Prazo: {new Date(goal.deadline + "T12:00:00").toLocaleDateString("pt-BR")}
                          </p>
                        )}

                        {(() => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);

                          let daysUntilStart = 0;
                          if (goal.startDate) {
                            const startD = new Date(goal.startDate + "T12:00:00");
                            startD.setHours(0, 0, 0, 0);
                            daysUntilStart = Math.ceil(
                              (startD.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                            );
                          }

                          let daysRemaining = 0;
                          if (goal.deadline) {
                            const dl = new Date(goal.deadline + "T12:00:00");
                            dl.setHours(0, 0, 0, 0);

                            const referenceDate =
                              daysUntilStart > 0
                                ? new Date(goal.startDate + "T12:00:00")
                                : today;
                            referenceDate.setHours(0, 0, 0, 0);

                            const diffMs = dl.getTime() - referenceDate.getTime();
                            daysRemaining = Math.max(
                              0,
                              Math.ceil(diffMs / (1000 * 60 * 60 * 24))
                            );
                          }

                          const remainingQty = Math.max(0, targetQty - completedQty);
                          const qtyPerDay =
                            daysRemaining > 0 ? remainingQty / daysRemaining : remainingQty;
                          const qtyPerWeek = daysRemaining >= 7 ? qtyPerDay * 7 : remainingQty;

                          return (
                            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                              {daysUntilStart > 0 && (
                                <div className="col-span-3 flex flex-col items-center p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
                                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-0.5">
                                    Começa em
                                  </span>
                                  <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                                    {daysUntilStart} {daysUntilStart === 1 ? "dia" : "dias"}
                                  </span>
                                </div>
                              )}

                              {goal.deadline && (
                                <>
                                  <div className="flex flex-col items-center p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                      Faltam
                                    </span>
                                    <span
                                      className={`text-xs font-black ${
                                        daysRemaining <= 3
                                          ? "text-rose-500"
                                          : "text-emerald-600 dark:text-emerald-400"
                                      }`}
                                    >
                                      {daysRemaining}d
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-center p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                      Por Dia
                                    </span>
                                    <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                                      {qtyPerDay.toFixed(1)} {unit.short}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-center p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                      Por Sem.
                                    </span>
                                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                                      {qtyPerWeek.toFixed(1)} {unit.short}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Action Buttons: Registrar & Finalizar */}
                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          setIsAddQtyModalOpen({
                            isOpen: true,
                            goalId: goal.id,
                            quantity: "",
                            customValue: "",
                            notes: "",
                            date: "",
                          })
                        }
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-emerald-50 text-emerald-700 dark:bg-slate-700 dark:text-emerald-400 dark:hover:bg-slate-600 rounded-xl font-bold flex justify-center items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-600 hover:border-emerald-300 text-xs shadow-sm min-w-[120px]"
                      >
                        <Plus className="w-4 h-4" /> {unit.actionLabel}
                      </button>

                      <button
                        onClick={() => handleOpenFinalizeModal(goal)}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex justify-center items-center gap-1.5 transition-colors shadow-md shadow-emerald-500/20 text-xs shrink-0"
                        title="Finalizar este ciclo de meta e guardar no histórico"
                      >
                        <Flag className="w-4 h-4" /> Finalizar Meta
                      </button>
                    </div>
                  </>
                )}


              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Modal Nova / Editar Meta */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {goalFormData.id ? "Editar Meta" : "Nova Meta do Projeto"}
              </h3>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                  Título da Meta
                </label>
                <input
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  value={goalFormData.title}
                  onChange={(e) =>
                    setGoalFormData({ ...goalFormData, title: e.target.value })
                  }
                  placeholder="Ex: Desenvolver Frontend, 40 Horas de Estudo..."
                />
              </div>

              {/* Unit Selection */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">
                  Tipo de Métrica
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setGoalFormData({ ...goalFormData, unitType: "hours" })
                    }
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                      goalFormData.unitType === "hours"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Horas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setGoalFormData({ ...goalFormData, unitType: "minutes" })
                    }
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                      goalFormData.unitType === "minutes"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <Timer className="w-4 h-4" />
                    <span>Minutos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setGoalFormData({ ...goalFormData, unitType: "deliveries" })
                    }
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                      goalFormData.unitType === "deliveries"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Entregas</span>
                  </button>
                </div>
              </div>

              {/* Quantity Target */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                  Meta Final ({getUnitDetails(goalFormData.unitType).label})
                </label>
                <input
                  required
                  type="number"
                  step="any"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  value={goalFormData.targetQuantity}
                  onChange={(e) =>
                    setGoalFormData({ ...goalFormData, targetQuantity: e.target.value })
                  }
                  placeholder={getUnitDetails(goalFormData.unitType).placeholderQty}
                />
              </div>

              {/* Unit Value (R$) */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                  Valor por {getUnitDetails(goalFormData.unitType).singular} (R$)
                </label>
                <input
                  type="number"
                  step="any"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  value={goalFormData.unitValue}
                  onChange={(e) =>
                    setGoalFormData({ ...goalFormData, unitValue: e.target.value })
                  }
                  placeholder={getUnitDetails(goalFormData.unitType).placeholderRate}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Opcional. Ex: Valor cobrado ou recebido por {getUnitDetails(goalFormData.unitType).singular}.
                </p>
              </div>

              {/* Live Meta Final Total Preview */}
              {goalFormData.targetQuantity && goalFormData.unitValue && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Valor Final do Ciclo:{" "}
                    {formatCurrency(
                      (parseFloat(goalFormData.targetQuantity) || 0) *
                        (parseFloat(goalFormData.unitValue) || 0)
                    )}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                    Início (Opcional)
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    value={goalFormData.startDate}
                    onChange={(e) =>
                      setGoalFormData({ ...goalFormData, startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                    Prazo (Opcional)
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    value={goalFormData.deadline}
                    onChange={(e) =>
                      setGoalFormData({ ...goalFormData, deadline: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="flex-1 py-3 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-colors text-sm"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Progresso */}
      {isAddQtyModalOpen.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in border border-slate-200 dark:border-slate-700">
            {(() => {
              const currentGoal = goals.find((g) => g.id === isAddQtyModalOpen.goalId);
              const unit = getUnitDetails(currentGoal?.unitType);
              const unitVal = currentGoal?.unitValue || 0;
              const addedQty = parseFloat(isAddQtyModalOpen.quantity) || 0;

              return (
                <>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                    {unit.actionLabel}
                  </h3>
                  <form onSubmit={handleAddQuantity} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                        Quantidade realizada ({unit.label})
                      </label>
                      <input
                        required
                        autoFocus
                        type="number"
                        step="any"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-center text-xl font-black"
                        value={isAddQtyModalOpen.quantity}
                        onChange={(e) =>
                          setIsAddQtyModalOpen((prev) => ({
                            ...prev,
                            quantity: e.target.value,
                          }))
                        }
                        placeholder={unit.placeholderQty}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center justify-between">
                        <span>Valor Real Total (R$) (Opcional)</span>
                        {addedQty > 0 && unitVal > 0 && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            Estimado: {formatCurrency(addedQty * unitVal)}
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        step="any"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                        value={isAddQtyModalOpen.customValue}
                        onChange={(e) =>
                          setIsAddQtyModalOpen((prev) => ({
                            ...prev,
                            customValue: e.target.value,
                          }))
                        }
                        placeholder={
                          unitVal > 0 && addedQty > 0
                            ? `Ex: ${(addedQty * unitVal).toFixed(2)} (vazio = usar estimado)`
                            : "Ex: 150.00"
                        }
                      />
                    </div>

                    {addedQty > 0 && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 text-center">
                        {isAddQtyModalOpen.customValue.trim() !== "" &&
                        !isNaN(parseFloat(isAddQtyModalOpen.customValue))
                          ? `+ ${formatCurrency(parseFloat(isAddQtyModalOpen.customValue))} (Valor Real Informado)`
                          : unitVal > 0
                          ? `+ ${formatCurrency(addedQty * unitVal)} (Valor Estimado)`
                          : `+ ${addedQty} ${unit.short}`}
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                        Data (Opcional)
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                        value={isAddQtyModalOpen.date}
                        onChange={(e) =>
                          setIsAddQtyModalOpen((prev) => ({
                            ...prev,
                            date: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                        Observações / Detalhes (Opcional)
                      </label>
                      <input
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                        value={isAddQtyModalOpen.notes}
                        onChange={(e) =>
                          setIsAddQtyModalOpen((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        placeholder="Ex: Módulo concluído..."
                      />
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() =>
                          setIsAddQtyModalOpen({
                            isOpen: false,
                            goalId: null,
                            quantity: "",
                            customValue: "",
                            notes: "",
                            date: "",
                          })
                        }
                        className="flex-1 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-colors text-xs"
                      >
                        Adicionar
                      </button>
                    </div>
                  </form>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL FINALIZAR META */}
      {isFinalizeModalOpen.isOpen && isFinalizeModalOpen.goal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 rounded-xl">
                  <Flag className="w-5 h-5" />
                </span>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  Finalizar Meta
                </h3>
              </div>
              <button
                type="button"
                onClick={() =>
                  setIsFinalizeModalOpen({
                    isOpen: false,
                    goal: null,
                    startDate: "",
                    endDate: "",
                    notes: "",
                    finalizationType: "conclude",
                  })
                }
                className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const g = isFinalizeModalOpen.goal;
              const unit = getUnitDetails(g.unitType);
              const targetQty = g.targetHours || 0;
              const completedQty = g.completedHours || 0;
              const unitVal = g.unitValue || 0;
              const pct = targetQty > 0 ? (completedQty / targetQty) * 100 : 0;

              const totalVal =
                g.history && g.history.length > 0
                  ? g.history.reduce((acc, h) => acc + (h.value ?? h.hours * unitVal), 0)
                  : completedQty * unitVal;

              return (
                <form onSubmit={handleConfirmFinalizeGoal} className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 space-y-2">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                      {g.title}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-slate-400 block font-semibold">Realizado</span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-200">
                          {completedQty} / {targetQty} {unit.short} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Valor Atingido</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(totalVal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                        Data Inicial
                      </label>
                      <input
                        required
                        type="date"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                        value={isFinalizeModalOpen.startDate}
                        onChange={(e) =>
                          setIsFinalizeModalOpen((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                        Data Final
                      </label>
                      <input
                        required
                        type="date"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                        value={isFinalizeModalOpen.endDate}
                        onChange={(e) =>
                          setIsFinalizeModalOpen((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                      Observações da Finalização (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                      value={isFinalizeModalOpen.notes}
                      onChange={(e) =>
                        setIsFinalizeModalOpen((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Ex: Ciclo concluído com sucesso e entregue ao cliente..."
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200/50 dark:border-emerald-800/40">
                    💡 Ao finalizar, este ciclo será registrado no histórico com os valores e o card passará para o estado de concluído. Você poderá restaurá-lo a qualquer momento para continuar o progresso.
                  </p>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setIsFinalizeModalOpen({
                          isOpen: false,
                          goal: null,
                          startDate: "",
                          endDate: "",
                          notes: "",
                          finalizationType: "conclude",
                        })
                      }
                      className="flex-1 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-colors text-xs flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Confirmar Finalização
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL DETALHES DA FINALIZAÇÃO */}
      {selectedFinalization && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-scale-in border border-slate-200 dark:border-slate-700">
            {(() => {
              const { goalTitle, finalization: fin, goalId } = selectedFinalization;
              const unit = getUnitDetails(fin.unitType);
              const startFmt = fin.startDate
                ? new Date(fin.startDate + "T12:00:00").toLocaleDateString("pt-BR")
                : "";
              const endFmt = fin.endDate
                ? new Date(fin.endDate + "T12:00:00").toLocaleDateString("pt-BR")
                : new Date(fin.finalizedAt).toLocaleDateString("pt-BR");
              const periodStr =
                startFmt && endFmt ? `${startFmt} a ${endFmt}` : endFmt || "Ciclo Concluído";

              return (
                <>
                  <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/80">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200/50">
                        Detalhes da Finalização
                      </span>
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white mt-1 leading-tight">
                        {goalTitle}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        Período: {periodStr}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFinalization(null)}
                      className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-5 overflow-y-auto space-y-4">
                    {/* Summary Badges */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-700/40 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-center">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Atingido
                        </span>
                        <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                          {fin.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Quantidade
                        </span>
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                          {fin.completedQuantity} / {fin.targetQuantity} {unit.short}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Valor Total
                        </span>
                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(fin.totalValue)}
                        </span>
                      </div>
                    </div>

                    {fin.notes && (
                      <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                        <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400 block mb-1">
                          Observações do Ciclo
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {fin.notes}
                        </p>
                      </div>
                    )}

                    {/* Snapshot of Daily Entries in this cycle */}
                    <div className="space-y-2 pt-1">
                      <h4 className="text-xs font-bold text-slate-500 uppercase">
                        Registros Efetuados no Ciclo ({fin.historyEntries?.length || 0})
                      </h4>
                      {!fin.historyEntries || fin.historyEntries.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                          Sem registros detalhados gravados.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {fin.historyEntries.map((h) => (
                            <div
                              key={h.id}
                              className="bg-slate-50 dark:bg-slate-700/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700 flex justify-between items-start text-xs"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    +{h.hours} {unit.short}
                                  </span>
                                  <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                    {new Date(h.date).toLocaleDateString("pt-BR", {
                                      day: "2-digit",
                                      month: "short",
                                    })}
                                  </span>
                                </div>
                                {h.notes && (
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                                    {h.notes}
                                  </p>
                                )}
                              </div>
                              <span className="font-bold text-slate-700 dark:text-slate-200">
                                {formatCurrency(h.value ?? h.hours * (fin.unitValue || 0))}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex flex-wrap justify-between items-center gap-2 bg-slate-50 dark:bg-slate-800/80">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestoreFinalization(goalId, fin.id)}
                        className="px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800/80 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                        title="Devolver todo o progresso e registros deste ciclo para a meta ativa"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Restaurar Ciclo
                      </button>
                      <button
                        onClick={() => handleDeleteFinalizationRecord(goalId, fin.id)}
                        className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </button>
                    </div>

                    <button
                      onClick={() => setSelectedFinalization(null)}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 font-bold text-slate-700 dark:text-slate-200 rounded-xl text-xs transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal Histórico Diário */}
      {selectedGoalHistoryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col md:max-h-[85vh] max-h-screen animate-scale-in border border-slate-200 dark:border-slate-700">
            {(() => {
              const goal = goals.find((g) => g.id === selectedGoalHistoryId);
              if (!goal) return null;
              const unit = getUnitDetails(goal.unitType);
              const unitVal = goal.unitValue || 0;
              const totalCompletedVal =
                goal.history && goal.history.length > 0
                  ? goal.history.reduce((acc, h) => acc + (h.value ?? h.hours * unitVal), 0)
                  : (goal.completedHours || 0) * unitVal;
              const remainingQtyHistory = Math.max(0, (goal.targetHours || 0) - (goal.completedHours || 0));
              const totalTargetVal = totalCompletedVal + remainingQtyHistory * unitVal;

              return (
                <>
                  <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80 sticky top-0 z-10">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">
                        Histórico de Registros (Ciclo Atual)
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {goal.title} ({unit.label})
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedGoalHistoryId(null)}
                      className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Summary Bar inside History */}
                  <div className="p-4 bg-slate-100/70 dark:bg-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-bold text-[10px] uppercase">
                        Realizado Atual
                      </span>
                      <span className="font-extrabold text-slate-800 dark:text-white">
                        {goal.completedHours || 0} / {goal.targetHours || 0} {unit.short}
                      </span>
                    </div>
                    {unitVal > 0 && (
                      <div className="text-right">
                        <span className="text-slate-500 dark:text-slate-400 block font-bold text-[10px] uppercase">
                          Valor Acumulado
                        </span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(totalCompletedVal)} / {formatCurrency(totalTargetVal)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 md:p-6 overflow-y-auto">
                    <div className="space-y-3">
                      {!goal.history || goal.history.length === 0 ? (
                        <p className="text-center text-sm text-slate-400 py-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                          Nenhum registro encontrado para o ciclo atual.
                        </p>
                      ) : (
                        goal.history.map((h) => (
                          <div
                            key={h.id}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex items-start justify-between group"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  +{h.hours} {unit.short}
                                </span>
                                {(() => {
                                  const itemVal = h.value ?? h.hours * unitVal;
                                  if (itemVal <= 0 && unitVal <= 0 && h.value === undefined)
                                    return null;
                                  return (
                                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/40">
                                      {formatCurrency(itemVal)}{" "}
                                      {h.value !== undefined ? "(Real)" : ""}
                                    </span>
                                  );
                                })()}
                                <span className="text-[10px] text-slate-400 font-medium bg-slate-50 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                  {new Date(h.date).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "short",
                                  })}
                                </span>
                              </div>
                              {h.notes && (
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                                  {h.notes}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteHistoryEntry(goal.id, h.id, h.hours)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 mt-0.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Projeto */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {projectFormData.id ? "Editar Projeto" : "Novo Projeto de Trabalho"}
              </h3>
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                  Nome do Projeto
                </label>
                <input
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                  value={projectFormData.name}
                  onChange={(e) =>
                    setProjectFormData({ ...projectFormData, name: e.target.value })
                  }
                  placeholder="Ex: Consultoria Empresa Alpha, Redesign App..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                  Descrição do Projeto (Opcional)
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  value={projectFormData.description}
                  onChange={(e) =>
                    setProjectFormData({ ...projectFormData, description: e.target.value })
                  }
                  placeholder="Detalhes ou objetivos deste projeto..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="flex-1 py-3 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-colors text-sm"
                >
                  Salvar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
