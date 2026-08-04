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
} from "lucide-react";
import { WorkGoal, WorkGoalUnit } from "../types";

interface WorkGoalsViewProps {
  goals: WorkGoal[];
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
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddQtyModalOpen, setIsAddQtyModalOpen] = useState<{
    isOpen: boolean;
    goalId: string | null;
    quantity: string;
    notes: string;
    date: string;
  }>({ isOpen: false, goalId: null, quantity: "", notes: "", date: "" });
  const [selectedGoalHistoryId, setSelectedGoalHistoryId] = useState<
    string | null
  >(null);

  const [formData, setFormData] = useState<{
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

  const handleOpenModal = (goal?: WorkGoal) => {
    if (goal) {
      setFormData({
        id: goal.id,
        title: goal.title,
        targetQuantity: (goal.targetHours || 0).toString(),
        unitType: goal.unitType || "hours",
        unitValue: goal.unitValue ? goal.unitValue.toString() : "",
        startDate: goal.startDate || "",
        deadline: goal.deadline || "",
      });
    } else {
      setFormData({
        id: "",
        title: "",
        targetQuantity: "",
        unitType: "hours",
        unitValue: "",
        startDate: "",
        deadline: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.targetQuantity) return;

    const targetQty = parseFloat(formData.targetQuantity);
    const valPerUnit = formData.unitValue ? parseFloat(formData.unitValue) : undefined;

    if (formData.id) {
      onUpdateGoal(formData.id, {
        title: formData.title,
        targetHours: targetQty,
        unitType: formData.unitType,
        unitValue: isNaN(valPerUnit || NaN) ? undefined : valPerUnit,
        startDate: formData.startDate || undefined,
        deadline: formData.deadline || undefined,
      });
    } else {
      onAddGoal({
        id: crypto.randomUUID(),
        title: formData.title,
        targetHours: targetQty,
        completedHours: 0,
        unitType: formData.unitType,
        unitValue: isNaN(valPerUnit || NaN) ? undefined : valPerUnit,
        startDate: formData.startDate || undefined,
        deadline: formData.deadline || undefined,
        createdAt: new Date().toISOString(),
      });
    }
    setIsModalOpen(false);
  };

  const handleAddQuantity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddQtyModalOpen.goalId || !isAddQtyModalOpen.quantity) return;
    const qty = parseFloat(isAddQtyModalOpen.quantity);
    if (isNaN(qty) || qty <= 0) return;

    const goal = goals.find((g) => g.id === isAddQtyModalOpen.goalId);
    if (goal) {
      const entryDate = isAddQtyModalOpen.date
        ? new Date(isAddQtyModalOpen.date + "T12:00:00").toISOString()
        : new Date().toISOString();
      const newEntry = {
        id: crypto.randomUUID(),
        date: entryDate,
        hours: qty, // reusing hours field for quantity
        notes: isAddQtyModalOpen.notes,
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
      notes: "",
      date: "",
    });
  };

  const handleDeleteHistoryEntry = (
    goalId: string,
    historyId: string,
    qty: number
  ) => {
    const goal = goals.find((g) => g.id === goalId);
    if (goal && goal.history) {
      const updatedHistory = goal.history.filter((h) => h.id !== historyId);
      onUpdateGoal(goal.id, {
        completedHours: Math.max(0, (goal.completedHours || 0) - qty),
        history: updatedHistory,
      });
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
            Metas de Trabalho & Projetos
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Acompanhe suas metas em horas, minutos ou entregas com cálculo de valor financeiro acumulado.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all text-sm"
        >
          <Plus className="w-5 h-5" /> Nova Meta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals?.map((goal) => {
          const unit = getUnitDetails(goal.unitType);
          const UnitIcon = unit.icon;
          const targetQty = goal.targetHours || 0;
          const completedQty = goal.completedHours || 0;
          const progress = targetQty > 0 ? Math.min((completedQty / targetQty) * 100, 100) : 0;
          const unitValue = goal.unitValue || 0;
          const totalTargetValue = targetQty * unitValue;
          const totalCompletedValue = completedQty * unitValue;
          const remainingValue = Math.max(0, totalTargetValue - totalCompletedValue);

          return (
            <div
              key={goal.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between relative overflow-hidden"
            >
              <div>
                {/* Header Card */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 mb-1.5">
                      <UnitIcon className="w-3.5 h-3.5 text-emerald-500" />
                      {unit.label}
                    </span>
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
                      onClick={() => handleOpenModal(goal)}
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
                          Acumulado Realizado
                        </span>
                        <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                          {formatCurrency(totalCompletedValue)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                          Meta Final Registrada
                        </span>
                        <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(totalTargetValue)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dates & Daily/Weekly Pace Calculations */}
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
                        daysRemaining > 0
                          ? remainingQty / daysRemaining
                          : remainingQty;
                      const qtyPerWeek =
                        daysRemaining >= 7 ? qtyPerDay * 7 : remainingQty;

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
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() =>
                    setIsAddQtyModalOpen({
                      isOpen: true,
                      goalId: goal.id,
                      quantity: "",
                      notes: "",
                      date: "",
                    })
                  }
                  className="w-full py-2.5 bg-slate-100 hover:bg-emerald-50 text-emerald-700 dark:bg-slate-700 dark:text-emerald-400 dark:hover:bg-slate-600 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors border border-slate-200 dark:border-slate-600 dark:hover:border-emerald-500/50 hover:border-emerald-300 text-xs"
                >
                  <Plus className="w-4 h-4" /> {unit.actionLabel}
                </button>
              </div>
            </div>
          );
        })}

        {(!goals || goals.length === 0) && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <TrendingUp className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
              Nenhuma meta cadastrada
            </h3>
            <p className="text-slate-500 mt-1 text-sm">
              Crie sua primeira meta com horas, minutos ou entregas valorizadas.
            </p>
          </div>
        )}
      </div>

      {/* Modal Nova / Editar Meta */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {formData.id ? "Editar Meta" : "Nova Meta de Trabalho"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                  Título do Projeto / Meta
                </label>
                <input
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex: Consultoria Cliente X, Projeto Freelance..."
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
                      setFormData({ ...formData, unitType: "hours" })
                    }
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                      formData.unitType === "hours"
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
                      setFormData({ ...formData, unitType: "minutes" })
                    }
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                      formData.unitType === "minutes"
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
                      setFormData({ ...formData, unitType: "deliveries" })
                    }
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                      formData.unitType === "deliveries"
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
                  Meta Final ({getUnitDetails(formData.unitType).label})
                </label>
                <input
                  required
                  type="number"
                  step="any"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  value={formData.targetQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, targetQuantity: e.target.value })
                  }
                  placeholder={getUnitDetails(formData.unitType).placeholderQty}
                />
              </div>

              {/* Unit Value (R$) */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                  Valor por {getUnitDetails(formData.unitType).singular} (R$)
                </label>
                <input
                  type="number"
                  step="any"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  value={formData.unitValue}
                  onChange={(e) =>
                    setFormData({ ...formData, unitValue: e.target.value })
                  }
                  placeholder={getUnitDetails(formData.unitType).placeholderRate}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Opcional. Ex: Quanto você cobra ou recebe por {getUnitDetails(formData.unitType).singular}.
                </p>
              </div>

              {/* Live Meta Final Total Preview */}
              {formData.targetQuantity && formData.unitValue && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Meta Final Total Registrada:{" "}
                    {formatCurrency(
                      (parseFloat(formData.targetQuantity) || 0) *
                        (parseFloat(formData.unitValue) || 0)
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
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
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
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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

      {/* Modal Registrar Progresso (Horas / Minutos / Entregas) */}
      {isAddQtyModalOpen.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in border border-slate-200 dark:border-slate-700">
            {(() => {
              const currentGoal = goals.find(
                (g) => g.id === isAddQtyModalOpen.goalId
              );
              const unit = getUnitDetails(currentGoal?.unitType);
              const unitVal = currentGoal?.unitValue || 0;
              const addedQty = parseFloat(isAddQtyModalOpen.quantity) || 0;
              const addedValue = addedQty * unitVal;

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

                    {unitVal > 0 && addedQty > 0 && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 text-center">
                        + {formatCurrency(addedValue)} no valor acumulado
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
                        placeholder="Ex: Módulo de pagamento concluído..."
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

      {/* Modal Histórico */}
      {selectedGoalHistoryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col md:max-h-[85vh] max-h-screen animate-scale-in">
            {(() => {
              const goal = goals.find((g) => g.id === selectedGoalHistoryId);
              if (!goal) return null;
              const unit = getUnitDetails(goal.unitType);
              const unitVal = goal.unitValue || 0;
              const totalTargetVal = (goal.targetHours || 0) * unitVal;
              const totalCompletedVal = (goal.completedHours || 0) * unitVal;

              return (
                <>
                  <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80 sticky top-0 z-10">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">
                        Histórico de Registros
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
                        Realizado Total
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
                          Nenhum registro encontrado.
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
                                {unitVal > 0 && (
                                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/40">
                                    {formatCurrency(h.hours * unitVal)}
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400 font-medium bg-slate-50 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                  {new Date(h.date).toLocaleDateString(
                                    "pt-BR",
                                    { day: "2-digit", month: "short" }
                                  )}
                                </span>
                              </div>
                              {h.notes && (
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                                  {h.notes}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                handleDeleteHistoryEntry(
                                  goal.id,
                                  h.id,
                                  h.hours
                                )
                              }
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
    </div>
  );
};
