import React, { useState } from "react";
import { Plus, CalendarClock, ListTodo, Clock, Edit2, Trash2, CalendarIcon, ArrowUp, ArrowDown, ChevronUp, ChevronDown, Check, Banknote, Layers } from "lucide-react";

export const DetailsSidebar = ({
  selectedDay,
  currentDate,
  handleOpenModal,
  handleOpenAgendaModal,
  handleOpenTaskModal,
  selectedTransactions = [],
  selectedAgendaEvents = [],
  todayTasks = [],
  timelessTasks = [],
  onUpdateTask,
  setTaskFormData,
  setIsTaskModalOpen,
  onDeleteTask,
  onUpdateTransaction,
  handleMoveTransaction,
  onUpdateAgendaEvent,
  handleEditAgendaEvent,
  onDeleteAgendaEvent,
  year,
  month,
}: any) => {
  const [activeTab, setActiveTab] = useState<"all" | "transactions" | "events" | "tasks">("all");

  const totalTransactions = selectedTransactions.length;
  const totalEvents = selectedAgendaEvents.length;
  const totalTasks = todayTasks.length + timelessTasks.length;
  const totalAll = totalTransactions + totalEvents + totalTasks;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-0 overflow-hidden flex flex-col h-full min-h-[400px]">
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
          {selectedDay
            ? `${selectedDay} de ${currentDate.toLocaleDateString("pt-BR", { month: "long" })}`
            : "Resumo do Mês"}
        </h3>
        {selectedDay && (
          <>
            {/* Navigation Tabs (Icons only with count badges for clean responsive layout) */}
            <div className="grid grid-cols-4 gap-1 mt-3 p-1 bg-slate-200/70 dark:bg-slate-700/60 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab("all")}
                title={`Tudo (${totalAll})`}
                className={`relative flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs border border-slate-200/50 dark:border-slate-600"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Layers className="w-5 h-5 shrink-0" />
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                  {totalAll}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("transactions")}
                title={`Transações (${totalTransactions})`}
                className={`relative flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === "transactions"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs border border-slate-200/50 dark:border-slate-600"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Banknote className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  totalTransactions > 0 
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                }`}>
                  {totalTransactions}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("events")}
                title={`Eventos (${totalEvents})`}
                className={`relative flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === "events"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold shadow-xs border border-slate-200/50 dark:border-slate-600"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <CalendarClock className="w-5 h-5 shrink-0 text-blue-500" />
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  totalEvents > 0 
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                }`}>
                  {totalEvents}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("tasks")}
                title={`Tarefas (${totalTasks})`}
                className={`relative flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === "tasks"
                    ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs border border-slate-200/50 dark:border-slate-600"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ListTodo className="w-5 h-5 shrink-0 text-emerald-500" />
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  totalTasks > 0 
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                }`}>
                  {totalTasks}
                </span>
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!selectedDay && (
          <div className="text-center py-10">
            <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-700 mb-4">
              <CalendarIcon className="w-8 h-8 text-indigo-500" />
            </div>
            <p className="text-slate-500 font-medium">Selecione um dia</p>
            <p className="text-slate-400 text-xs mt-1">
              Clique no calendário para ver detalhes ou adicionar contas e eventos.
            </p>
          </div>
        )}

        {/* TAB: ALL */}
        {selectedDay && activeTab === "all" && (
          <>
            {totalAll === 0 && (
              <div className="text-center py-10">
                <CalendarClock className="w-12 h-12 text-slate-200 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">
                  Nenhuma movimentação, evento ou tarefa.
                </p>
              </div>
            )}

            {/* ATEMPORAL GROUP */}
            {timelessTasks.length > 0 && (
              <div className="mb-6">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3 px-1 border-b border-slate-100 dark:border-slate-700/50 pb-2">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> Atemporal
                </h4>
                <div className="space-y-2">
                  {timelessTasks.map((task: any) => (
                    <div
                      key={task.id}
                      className="group flex items-start justify-between p-3 rounded-lg border bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => onUpdateTask && onUpdateTask(task.id, { completed: !task.completed })}
                          className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.completed ? "bg-indigo-500 border-indigo-500 text-white" : "border-slate-300 dark:border-slate-500 hover:border-indigo-500"}`}
                        >
                          {task.completed && <Check className="w-3 h-3" />}
                        </button>
                        <div>
                          <p className={`font-semibold text-sm ${task.completed ? "text-slate-500 line-through" : "text-slate-800 dark:text-white"}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs mt-0.5 line-clamp-2 text-slate-500 dark:text-slate-400">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setTaskFormData({ id: task.id, title: task.title, description: task.description || "", listId: task.listId, dueDate: task.dueDate || "" });
                            setIsTaskModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                          title="Editar Tarefa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteTask && onDeleteTask(task.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors"
                          title="Excluir Tarefa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PROGRAMADO GROUP */}
            {(selectedTransactions.length > 0 || selectedAgendaEvents.length > 0 || todayTasks.length > 0) && (
              <div className="mb-6">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3 px-1 border-b border-slate-100 dark:border-slate-700/50 pb-2">
                  <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" /> Programado
                </h4>
                <div className="space-y-2">
                  {/* Transactions */}
                  {selectedTransactions.map((t: any, idx: number) => {
                    const canMoveUp = idx > 0;
                    const canMoveDown = idx < selectedTransactions.length - 1;
                    return (
                      <div key={t.id} className="group p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.type === "income" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"}`}>
                              {t.type === "income" ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-800 dark:text-white">{t.description}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {t.time && (
                                  <>
                                    <span className="text-[10px] font-bold text-indigo-500 uppercase flex items-center gap-0.5">
                                      <Clock className="w-3 h-3" /> {t.time}
                                    </span>
                                    <span className="text-slate-300 dark:text-slate-600">•</span>
                                  </>
                                )}
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{t.category}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className={`font-bold text-sm ${t.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>R$ {t.amount.toFixed(2)}</p>
                              {t.type === "expense" && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                  {t.status === "pending" ? "Pendente" : "Pago"}
                                </span>
                              )}
                            </div>
                            {onUpdateTransaction && (
                              <div className="flex flex-col gap-0.5 border-l border-slate-100 dark:border-slate-700 pl-2 ml-1 opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleMoveTransaction(idx, "up")} disabled={!canMoveUp} className={`p-0.5 rounded ${canMoveUp ? "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-600" : "text-slate-200 dark:text-slate-600 cursor-not-allowed"}`}><ChevronUp className="w-4 h-4" /></button>
                                <button onClick={() => handleMoveTransaction(idx, "down")} disabled={!canMoveDown} className={`p-0.5 rounded ${canMoveDown ? "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-600" : "text-slate-200 dark:text-slate-600 cursor-not-allowed"}`}><ChevronDown className="w-4 h-4" /></button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Agenda Events */}
                  {selectedAgendaEvents.map((event: any) => {
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay || 1).padStart(2, "0")}`;
                    const completed = event.completedDates?.includes(dateStr);
                    
                    const handleToggleEvent = async () => {
                      if (!onUpdateAgendaEvent) return;
                      const newDates = completed 
                        ? (event.completedDates || []).filter((d: string) => d !== dateStr) 
                        : [...(event.completedDates || []), dateStr];
                      await onUpdateAgendaEvent(event.id, { completedDates: newDates });
                    };

                    return (
                      <div key={event.id} className={`group flex items-start justify-between p-3 rounded-lg border transition-all ${completed ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30 opacity-75' : 'bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'}`}>
                        <div className="flex items-start gap-4 flex-1">
                          <button
                            onClick={handleToggleEvent}
                            className={`mt-1 w-5 h-5 rounded border flex shrink-0 items-center justify-center transition-colors ${completed ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20" : "border-slate-300 dark:border-slate-500 hover:border-emerald-500 dark:hover:border-emerald-400"}`}
                          >
                            {completed && <Check className="w-3 h-3" />}
                          </button>
                          <div className="flex flex-col items-center min-w-[3rem] mt-0.5">
                            <span className={`text-[11px] font-bold whitespace-nowrap ${completed ? 'text-emerald-600 dark:text-emerald-500' : 'text-blue-600 dark:text-blue-400'}`}>
                              {event.allDay ? "Dia Todo" : (
                                 <div className="flex flex-col items-center leading-tight">
                                    <span>{new Date(event.startDate).toLocaleTimeString("pt-BR", {hour: "2-digit", minute:"2-digit"})}</span>
                                    <span className="text-[9px] font-normal opacity-70">às</span>
                                    <span>{new Date(event.endDate).toLocaleTimeString("pt-BR", {hour: "2-digit", minute:"2-digit"})}</span>
                                 </div>
                              )}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm ${completed ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-800 dark:text-white'}`}>
                              {event.title}
                            </p>
                            {event.isRoutine && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 rounded">Rotina</span>
                            )}
                            {event.description && (
                              <p className={`text-xs mt-0.5 line-clamp-2 ${completed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                {event.description}
                              </p>
                            )}
                            {event.checklist && event.checklist.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {event.checklist.map((item: any, idx: number) => (
                                  <div key={item.id || idx} className="flex items-start gap-1.5">
                                     <button
                                        onClick={async () => {
                                            if(!onUpdateAgendaEvent) return;
                                            const newChecklist = [...event.checklist];
                                            newChecklist[idx] = { ...item, isCompleted: !item.isCompleted };
                                            await onUpdateAgendaEvent(event.id, { checklist: newChecklist });
                                        }}
                                        className={`mt-0.5 shrink-0 flex items-center justify-center w-3.5 h-3.5 rounded border transition-colors ${item.isCompleted ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300 dark:border-slate-500 text-transparent hover:border-blue-400'}`}
                                     >
                                        <Check className="w-2.5 h-2.5" />
                                     </button>
                                     <span className={`text-xs ${item.isCompleted ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-300'}`}>{item.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditAgendaEvent(event)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors" title="Editar Evento"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => onDeleteAgendaEvent && onDeleteAgendaEvent(event.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors" title="Excluir Evento"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Today Tasks */}
                  {todayTasks.map((t: any) => (
                    <div key={t.id} className={`group flex items-start justify-between p-3 rounded-lg border ${t.completed ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60' : 'bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'}`}>
                      <div className="flex items-start gap-3">
                        <button onClick={() => onUpdateTask && onUpdateTask(t.id, { completed: !t.completed })} className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${t.completed ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 dark:border-slate-500 hover:border-indigo-500'}`}>
                          {t.completed && <Check className="w-3 h-3" />}
                        </button>
                        <div>
                          <p className={`font-semibold text-sm ${t.completed ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-white'}`}>{t.title}</p>
                          {t.description && <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => {
                          setTaskFormData({ id: t.id, title: t.title, description: t.description || "", listId: t.listId, dueDate: t.dueDate || "" });
                          setIsTaskModalOpen(true);
                        }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors" title="Editar Tarefa"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => onDeleteTask && onDeleteTask(t.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors" title="Excluir Tarefa"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB: TRANSACTIONS */}
        {selectedDay && activeTab === "transactions" && (
          <div className="space-y-2">
            {selectedTransactions.length === 0 ? (
              <div className="text-center py-10">
                <Banknote className="w-12 h-12 text-slate-200 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">
                  Nenhuma transação registrada neste dia.
                </p>
              </div>
            ) : (
              selectedTransactions.map((t: any, idx: number) => {
                const canMoveUp = idx > 0;
                const canMoveDown = idx < selectedTransactions.length - 1;
                return (
                  <div key={t.id} className="group p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.type === "income" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"}`}>
                          {t.type === "income" ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-800 dark:text-white">{t.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {t.time && (
                              <>
                                <span className="text-[10px] font-bold text-indigo-500 uppercase flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" /> {t.time}
                                </span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                              </>
                            )}
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{t.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className={`font-bold text-sm ${t.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>R$ {t.amount.toFixed(2)}</p>
                          {t.type === "expense" && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                              {t.status === "pending" ? "Pendente" : "Pago"}
                            </span>
                          )}
                        </div>
                        {onUpdateTransaction && (
                          <div className="flex flex-col gap-0.5 border-l border-slate-100 dark:border-slate-700 pl-2 ml-1 opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleMoveTransaction(idx, "up")} disabled={!canMoveUp} className={`p-0.5 rounded ${canMoveUp ? "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-600" : "text-slate-200 dark:text-slate-600 cursor-not-allowed"}`}><ChevronUp className="w-4 h-4" /></button>
                            <button onClick={() => handleMoveTransaction(idx, "down")} disabled={!canMoveDown} className={`p-0.5 rounded ${canMoveDown ? "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-600" : "text-slate-200 dark:text-slate-600 cursor-not-allowed"}`}><ChevronDown className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB: EVENTS */}
        {selectedDay && activeTab === "events" && (
          <div className="space-y-2">
            {selectedAgendaEvents.length === 0 ? (
              <div className="text-center py-10">
                <CalendarClock className="w-12 h-12 text-slate-200 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">
                  Nenhum evento registrado neste dia.
                </p>
              </div>
            ) : (
              selectedAgendaEvents.map((event: any) => {
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay || 1).padStart(2, "0")}`;
                const completed = event.completedDates?.includes(dateStr);
                
                const handleToggleEvent = async () => {
                  if (!onUpdateAgendaEvent) return;
                  const newDates = completed 
                    ? (event.completedDates || []).filter((d: string) => d !== dateStr) 
                    : [...(event.completedDates || []), dateStr];
                  await onUpdateAgendaEvent(event.id, { completedDates: newDates });
                };

                return (
                  <div key={event.id} className={`group flex items-start justify-between p-3 rounded-lg border transition-all ${completed ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30 opacity-75' : 'bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'}`}>
                    <div className="flex items-start gap-4 flex-1">
                      <button
                        onClick={handleToggleEvent}
                        className={`mt-1 w-5 h-5 rounded border flex shrink-0 items-center justify-center transition-colors ${completed ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20" : "border-slate-300 dark:border-slate-500 hover:border-emerald-500 dark:hover:border-emerald-400"}`}
                      >
                        {completed && <Check className="w-3 h-3" />}
                      </button>
                      <div className="flex flex-col items-center min-w-[3rem] mt-0.5">
                        <span className={`text-[11px] font-bold whitespace-nowrap ${completed ? 'text-emerald-600 dark:text-emerald-500' : 'text-blue-600 dark:text-blue-400'}`}>
                          {event.allDay ? "Dia Todo" : (
                             <div className="flex flex-col items-center leading-tight">
                                <span>{new Date(event.startDate).toLocaleTimeString("pt-BR", {hour: "2-digit", minute:"2-digit"})}</span>
                                <span className="text-[9px] font-normal opacity-70">às</span>
                                <span>{new Date(event.endDate).toLocaleTimeString("pt-BR", {hour: "2-digit", minute:"2-digit"})}</span>
                             </div>
                          )}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${completed ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-800 dark:text-white'}`}>
                          {event.title}
                        </p>
                        {event.isRoutine && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 rounded">Rotina</span>
                        )}
                        {event.description && (
                          <p className={`text-xs mt-0.5 line-clamp-2 ${completed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>
                            {event.description}
                          </p>
                        )}
                        {event.checklist && event.checklist.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {event.checklist.map((item: any, idx: number) => (
                              <div key={item.id || idx} className="flex items-start gap-1.5">
                                 <button
                                    onClick={async () => {
                                        if(!onUpdateAgendaEvent) return;
                                        const newChecklist = [...event.checklist];
                                        newChecklist[idx] = { ...item, isCompleted: !item.isCompleted };
                                        await onUpdateAgendaEvent(event.id, { checklist: newChecklist });
                                    }}
                                    className={`mt-0.5 shrink-0 flex items-center justify-center w-3.5 h-3.5 rounded border transition-colors ${item.isCompleted ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300 dark:border-slate-500 text-transparent hover:border-blue-400'}`}
                                 >
                                    <Check className="w-2.5 h-2.5" />
                                 </button>
                                 <span className={`text-xs ${item.isCompleted ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-300'}`}>{item.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditAgendaEvent(event)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors" title="Editar Evento"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => onDeleteAgendaEvent && onDeleteAgendaEvent(event.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors" title="Excluir Evento"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB: TASKS */}
        {selectedDay && activeTab === "tasks" && (
          <div className="space-y-3">
            {totalTasks === 0 ? (
              <div className="text-center py-10">
                <ListTodo className="w-12 h-12 text-slate-200 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">
                  Nenhuma tarefa registrada neste dia.
                </p>
              </div>
            ) : (
              <>
                {timelessTasks.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2 px-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" /> Atemporal
                    </h4>
                    <div className="space-y-2">
                      {timelessTasks.map((task: any) => (
                        <div
                          key={task.id}
                          className="group flex items-start justify-between p-3 rounded-lg border bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => onUpdateTask && onUpdateTask(task.id, { completed: !task.completed })}
                              className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.completed ? "bg-indigo-500 border-indigo-500 text-white" : "border-slate-300 dark:border-slate-500 hover:border-indigo-500"}`}
                            >
                              {task.completed && <Check className="w-3 h-3" />}
                            </button>
                            <div>
                              <p className={`font-semibold text-sm ${task.completed ? "text-slate-500 line-through" : "text-slate-800 dark:text-white"}`}>
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-xs mt-0.5 line-clamp-2 text-slate-500 dark:text-slate-400">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setTaskFormData({ id: task.id, title: task.title, description: task.description || "", listId: task.listId, dueDate: task.dueDate || "" });
                                setIsTaskModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                              title="Editar Tarefa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteTask && onDeleteTask(task.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors"
                              title="Excluir Tarefa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {todayTasks.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2 px-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-emerald-500" /> Do Dia
                    </h4>
                    <div className="space-y-2">
                      {todayTasks.map((t: any) => (
                        <div key={t.id} className={`group flex items-start justify-between p-3 rounded-lg border ${t.completed ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60' : 'bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'}`}>
                          <div className="flex items-start gap-3">
                            <button onClick={() => onUpdateTask && onUpdateTask(t.id, { completed: !t.completed })} className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${t.completed ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 dark:border-slate-500 hover:border-indigo-500'}`}>
                              {t.completed && <Check className="w-3 h-3" />}
                            </button>
                            <div>
                              <p className={`font-semibold text-sm ${t.completed ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-white'}`}>{t.title}</p>
                              {t.description && <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => {
                              setTaskFormData({ id: t.id, title: t.title, description: t.description || "", listId: t.listId, dueDate: t.dueDate || "" });
                              setIsTaskModalOpen(true);
                            }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors" title="Editar Tarefa"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => onDeleteTask && onDeleteTask(t.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors" title="Excluir Tarefa"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

