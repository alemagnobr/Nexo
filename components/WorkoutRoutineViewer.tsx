import React, { useState } from 'react';
import { WorkoutRoutine, RoutineDay, RoutineExercise, RoutineExerciseSet, WorkoutProject } from '../types';
import { 
  ChevronLeft, Calendar as CalendarIcon, List, LayoutGrid, Edit2, TrendingUp, 
  Plus, X, Play, CheckCircle2, Coffee, Sparkles, Check, Flag, CalendarDays, 
  Trash2, Copy, Settings, GripVertical, Save 
} from 'lucide-react';
import { 
  WEEK_DAYS, formatDateDisplay, advanceWorkoutCycleOnCompletion, 
  generateCalendarProjection, formatDateISO, addNewWorkoutDayToRoutine, 
  recalculateRoutineDates 
} from '../utils/workoutScheduler';
import { WorkoutMiniCalendar } from './WorkoutMiniCalendar';

const TECHNIQUES = [
  { id: 'Drop Set', label: 'Drop', desc: 'Reduz a carga (20-30%) ao falhar e continua.' },
  { id: 'Rest-pause', label: 'Rest-pause', desc: 'Pausa de 10-15s após a falha para mais reps.' },
  { id: 'FST-7', label: 'FST-7', desc: 'Fascia Stretch Training, 7 séries curtas (30s sec).' },
  { id: 'Cluster', label: 'Cluster', desc: 'Séries divididas por micro-pausas (ex: 4+10s+4).' },
  { id: 'Bi-set', label: 'Bi-set', desc: 'Dois exercícios sem descanso.' },
  { id: 'Isometria', label: 'Iso', desc: 'Pausa estática (2-5s) no pico de contração.' }
];

interface WorkoutRoutineViewerProps {
  routine: WorkoutRoutine;
  project?: WorkoutProject;
  onBack: () => void;
  onEdit?: () => void;
  onUpdateRoutine?: (routine: WorkoutRoutine) => void;
  onEditExercise?: (dayIndex: number, exIndex: number) => void;
  onPlayDay?: (dayIndex: number) => void;
}

export const WorkoutRoutineViewer: React.FC<WorkoutRoutineViewerProps> = ({ 
  routine, 
  project, 
  onBack, 
  onUpdateRoutine, 
  onPlayDay 
}) => {
  const [viewMode, setViewMode] = useState<'lista' | 'semanal'>('lista');
  const [showMiniCalendar, setShowMiniCalendar] = useState(true);
  
  // Edição de Título / Descrição da Ficha
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(routine.name);
  const [descInput, setDescInput] = useState(routine.description || '');

  // Modal de Configuração Completa de Exercício
  const [editingEx, setEditingEx] = useState<{ dayIndex: number; exIndex: number } | null>(null);

  // Modal de Histórico de Progressão
  const [selectedExercise, setSelectedExercise] = useState<{ dayId: string; ex: RoutineExercise; setIndex: number } | null>(null);
  const [newLoad, setNewLoad] = useState('');
  const [newReps, setNewReps] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Toast de feedback
  const [completedToast, setCompletedToast] = useState<string | null>(null);

  const projectEndDate = project?.endDate || routine.endDate;

  // Atualização centralizada de Início, Fim e Descanso no Calendário
  const handleUpdateDateConfig = (newStartDate: string, newEndDate: string, newRestDays: number[]) => {
    if (!onUpdateRoutine) return;
    const recalculatedDays = recalculateRoutineDates(routine.days, newStartDate, newRestDays, newEndDate);
    const updated: WorkoutRoutine = {
      ...routine,
      startDate: newStartDate,
      endDate: newEndDate || undefined,
      restDays: newRestDays,
      days: recalculatedDays,
      updatedAt: new Date().toISOString(),
    };
    onUpdateRoutine(updated);
    setCompletedToast("Período e dias de descanso atualizados!");
    setTimeout(() => setCompletedToast(null), 3000);
  };

  // Salvar Título e Descrição da Ficha
  const handleSaveTitle = () => {
    if (!onUpdateRoutine || !titleInput.trim()) return;
    const updated: WorkoutRoutine = {
      ...routine,
      name: titleInput.trim(),
      description: descInput.trim(),
      updatedAt: new Date().toISOString(),
    };
    onUpdateRoutine(updated);
    setIsEditingTitle(false);
    setCompletedToast("Nome e descrição da ficha atualizados!");
    setTimeout(() => setCompletedToast(null), 3000);
  };

  // Concluir treino e avançar fila (respeitando data limite)
  const handleCompleteDay = (dayIndex: number) => {
    if (!onUpdateRoutine) return;
    const day = routine.days[dayIndex];
    const updated = advanceWorkoutCycleOnCompletion(routine, dayIndex, undefined, projectEndDate);
    onUpdateRoutine(updated);
    
    if (updated.isCycleCompleted) {
      setCompletedToast(`Parabéns! "${day.name}" concluído. Atingiu a data final do projeto e o ciclo foi finalizado!`);
    } else {
      setCompletedToast(`Treino "${day.name}" concluído! A próxima data foi avançada.`);
    }
    setTimeout(() => setCompletedToast(null), 5000);
  };

  // Adicionar divisão de treino (Treino A, B, C...) diretamente na tela
  const handleAddDayDirectly = () => {
    if (!onUpdateRoutine) return;
    const updated = addNewWorkoutDayToRoutine(routine, project?.startDate, projectEndDate);
    onUpdateRoutine(updated);
    const newDayName = updated.days[updated.days.length - 1].name;
    setCompletedToast(`Novo dia "${newDayName}" adicionado dinamicamente com próxima data calculada!`);
    setTimeout(() => setCompletedToast(null), 4000);
  };

  // Alterar data agendada de um dia específico
  const handleUpdateDayDate = (dIndex: number, newDate: string) => {
    if (!onUpdateRoutine) return;
    const updatedDays = [...routine.days];
    updatedDays[dIndex] = { ...updatedDays[dIndex], scheduledDate: newDate };
    
    const baseDate = updatedDays[0]?.scheduledDate || routine.startDate || formatDateISO(new Date());
    const recalculated = recalculateRoutineDates(updatedDays, baseDate, routine.restDays || [], projectEndDate);
    
    onUpdateRoutine({
      ...routine,
      days: recalculated,
      updatedAt: new Date().toISOString(),
    });
  };

  // Renomear dia de treino (ex: "Peito / Costas")
  const handleRenameDay = (dIndex: number, newName: string) => {
    if (!onUpdateRoutine) return;
    const updatedDays = [...routine.days];
    updatedDays[dIndex] = { ...updatedDays[dIndex], name: newName };
    onUpdateRoutine({
      ...routine,
      days: updatedDays,
      updatedAt: new Date().toISOString(),
    });
  };

  // Excluir dia de treino inteiro
  const handleRemoveDay = (dIndex: number) => {
    if (!onUpdateRoutine) return;
    if (!confirm(`Deseja realmente excluir o dia "${routine.days[dIndex].name}"?`)) return;
    const updatedDays = [...routine.days];
    updatedDays.splice(dIndex, 1);
    
    const baseDate = updatedDays[0]?.scheduledDate || routine.startDate || formatDateISO(new Date());
    const recalculated = recalculateRoutineDates(updatedDays, baseDate, routine.restDays || [], projectEndDate);
    
    onUpdateRoutine({
      ...routine,
      days: recalculated,
      updatedAt: new Date().toISOString(),
    });
    setCompletedToast("Dia de treino removido e ciclo recalculado!");
    setTimeout(() => setCompletedToast(null), 3000);
  };

  // Adicionar exercício diretamente ao dia
  const handleAddExercise = (dayIndex: number) => {
    if (!onUpdateRoutine) return;
    const updatedDays = [...routine.days];
    const newExercise: RoutineExercise = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: '',
      setsData: [
        { id: Date.now().toString() + '1', reps: '10-12', rest: '60s' },
        { id: Date.now().toString() + '2', reps: '10-12', rest: '60s' },
        { id: Date.now().toString() + '3', reps: '10-12', rest: '60s' }
      ]
    };
    
    updatedDays[dayIndex] = {
      ...updatedDays[dayIndex],
      exercises: [...updatedDays[dayIndex].exercises, newExercise]
    };

    onUpdateRoutine({
      ...routine,
      days: updatedDays,
      updatedAt: new Date().toISOString(),
    });

    // Abre imediatamente o modal para o usuário dar nome e configurar o exercício
    setEditingEx({ dayIndex, exIndex: updatedDays[dayIndex].exercises.length - 1 });
  };

  // Duplicar exercício
  const handleDuplicateExercise = (dayIndex: number, exIndex: number) => {
    if (!onUpdateRoutine) return;
    const updatedDays = [...routine.days];
    const exToCopy = updatedDays[dayIndex].exercises[exIndex];
    const duplicatedSets = exToCopy.setsData 
      ? exToCopy.setsData.map(s => ({ ...s, id: Date.now().toString() + Math.random().toString(36).substr(2, 5) })) 
      : undefined;

    updatedDays[dayIndex].exercises.splice(exIndex + 1, 0, {
      ...exToCopy,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      setsData: duplicatedSets,
    });

    onUpdateRoutine({
      ...routine,
      days: updatedDays,
      updatedAt: new Date().toISOString(),
    });
    setCompletedToast("Exercício duplicado!");
    setTimeout(() => setCompletedToast(null), 3000);
  };

  // Remover exercício
  const handleRemoveExercise = (dayIndex: number, exIndex: number) => {
    if (!onUpdateRoutine) return;
    const updatedDays = [...routine.days];
    updatedDays[dayIndex].exercises.splice(exIndex, 1);
    onUpdateRoutine({
      ...routine,
      days: updatedDays,
      updatedAt: new Date().toISOString(),
    });
    if (editingEx && editingEx.dayIndex === dayIndex && editingEx.exIndex === exIndex) {
      setEditingEx(null);
    }
  };

  // Atualizar campo do exercício no modal
  const handleUpdateExercise = (dayIndex: number, exIndex: number, field: keyof RoutineExercise, value: string) => {
    if (!onUpdateRoutine) return;
    const updatedDays = [...routine.days];
    const newExercises = [...updatedDays[dayIndex].exercises];
    newExercises[exIndex] = { ...newExercises[exIndex], [field]: value };
    updatedDays[dayIndex] = { ...updatedDays[dayIndex], exercises: newExercises };
    onUpdateRoutine({
      ...routine,
      days: updatedDays,
      updatedAt: new Date().toISOString(),
    });
  };

  // Adicionar série ao exercício
  const handleAddSet = (dayIndex: number, exIndex: number) => {
    if (!onUpdateRoutine) return;
    const updatedDays = [...routine.days];
    const ex = updatedDays[dayIndex].exercises[exIndex];
    if (!ex.setsData) {
      ex.setsData = [
        { id: Date.now().toString() + '1', reps: '10-12', rest: '60s' }
      ];
    }
    const lastSet = ex.setsData[ex.setsData.length - 1];
    ex.setsData.push({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      reps: lastSet ? lastSet.reps : '10-12',
      rest: lastSet ? lastSet.rest : '60s',
      load: lastSet ? lastSet.load : '',
    });

    onUpdateRoutine({
      ...routine,
      days: updatedDays,
      updatedAt: new Date().toISOString(),
    });
  };

  // Atualizar série
  const handleUpdateSet = (dayIndex: number, exIndex: number, setIndex: number, field: keyof RoutineExerciseSet, value: string) => {
    if (!onUpdateRoutine) return;
    const updatedDays = [...routine.days];
    const ex = updatedDays[dayIndex].exercises[exIndex];
    if (ex.setsData && ex.setsData[setIndex]) {
      ex.setsData[setIndex] = { ...ex.setsData[setIndex], [field]: value };
    }
    onUpdateRoutine({
      ...routine,
      days: updatedDays,
      updatedAt: new Date().toISOString(),
    });
  };

  // Remover série
  const handleRemoveSet = (dayIndex: number, exIndex: number, setIndex: number) => {
    if (!onUpdateRoutine) return;
    const updatedDays = [...routine.days];
    const ex = updatedDays[dayIndex].exercises[exIndex];
    if (ex.setsData) {
      ex.setsData.splice(setIndex, 1);
    }
    onUpdateRoutine({
      ...routine,
      days: updatedDays,
      updatedAt: new Date().toISOString(),
    });
  };

  // Alternar técnica da série (Drop Set, Rest-pause, Bi-set, etc)
  const toggleTechniqueSet = (dayIndex: number, exIndex: number, setIndex: number, techId: string) => {
    if (!onUpdateRoutine) return;
    const updatedDays = [...routine.days];
    const set = updatedDays[dayIndex].exercises[exIndex].setsData![setIndex];
    const current = set.technique || '';
    const list = current ? current.split(',').map(s => s.trim()) : [];
    
    let newList;
    if (list.includes(techId)) {
      newList = list.filter(t => t !== techId);
    } else {
      newList = [...list, techId];
    }
    set.technique = newList.join(', ');

    onUpdateRoutine({
      ...routine,
      days: updatedDays,
      updatedAt: new Date().toISOString(),
    });
  };

  // Drop Set loads
  const handleUpdateDropLoad = (dayIndex: number, exIndex: number, setIndex: number, dropIndex: number, load: string) => {
    if (!onUpdateRoutine) return;
    const updatedDays = [...routine.days];
    const ex = updatedDays[dayIndex].exercises[exIndex];
    if (ex.setsData && ex.setsData[setIndex]) {
      const dropLoads = [...(ex.setsData[setIndex].dropLoads || [])];
      dropLoads[dropIndex] = load;
      ex.setsData[setIndex] = { ...ex.setsData[setIndex], dropLoads };
    }
    onUpdateRoutine({
      ...routine,
      days: updatedDays,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateDropCount = (dayIndex: number, exIndex: number, setIndex: number, count: number) => {
    if (!onUpdateRoutine) return;
    const updatedDays = [...routine.days];
    const ex = updatedDays[dayIndex].exercises[exIndex];
    if (ex.setsData && ex.setsData[setIndex]) {
      const dropLoads = [...(ex.setsData[setIndex].dropLoads || [])];
      if (count > dropLoads.length) {
        for (let i = dropLoads.length; i < count; i++) dropLoads.push('');
      } else {
        dropLoads.splice(count);
      }
      ex.setsData[setIndex] = { ...ex.setsData[setIndex], dropLoads };
    }
    onUpdateRoutine({
      ...routine,
      days: updatedDays,
      updatedAt: new Date().toISOString(),
    });
  };

  // Registrar histórico de progressão de carga
  const handleAddProgression = () => {
    if (!selectedExercise || !onUpdateRoutine || !newLoad.trim()) return;
    
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      load: newLoad,
      reps: newReps,
      notes: newNotes,
    };

    const newRoutine = { ...routine };
    const dayIndex = newRoutine.days.findIndex(d => d.id === selectedExercise.dayId);
    if (dayIndex === -1) return;
    
    const exIndex = newRoutine.days[dayIndex].exercises.findIndex(e => e.id === selectedExercise.ex.id);
    if (exIndex === -1) return;

    const setIndex = selectedExercise.setIndex;
    if (!newRoutine.days[dayIndex].exercises[exIndex].setsData || !newRoutine.days[dayIndex].exercises[exIndex].setsData[setIndex]) return;

    const currentHistory = newRoutine.days[dayIndex].exercises[exIndex].setsData[setIndex].loadHistory || [];
    
    newRoutine.days[dayIndex].exercises[exIndex].setsData[setIndex] = {
      ...newRoutine.days[dayIndex].exercises[exIndex].setsData[setIndex],
      load: newLoad,
      loadHistory: [newEntry, ...currentHistory]
    };
    
    if (setIndex === 0) {
      newRoutine.days[dayIndex].exercises[exIndex].currentLoad = newLoad;
    }

    onUpdateRoutine(newRoutine);
    setSelectedExercise({ dayId: selectedExercise.dayId, ex: newRoutine.days[dayIndex].exercises[exIndex], setIndex });
    setNewLoad('');
    setNewReps('');
    setNewNotes('');
  };

  const handleRemoveProgression = (histId: string) => {
    if (!selectedExercise || !onUpdateRoutine) return;
    
    const newRoutine = { ...routine };
    const dayIndex = newRoutine.days.findIndex(d => d.id === selectedExercise.dayId);
    if (dayIndex === -1) return;
    
    const exIndex = newRoutine.days[dayIndex].exercises.findIndex(e => e.id === selectedExercise.ex.id);
    if (exIndex === -1) return;

    const setIndex = selectedExercise.setIndex;
    if (!newRoutine.days[dayIndex].exercises[exIndex].setsData || !newRoutine.days[dayIndex].exercises[exIndex].setsData[setIndex]) return;

    const currentHistory = newRoutine.days[dayIndex].exercises[exIndex].setsData[setIndex].loadHistory || [];
    const updatedHistory = currentHistory.filter(h => h.id !== histId);
    
    newRoutine.days[dayIndex].exercises[exIndex].setsData[setIndex] = {
      ...newRoutine.days[dayIndex].exercises[exIndex].setsData[setIndex],
      load: updatedHistory.length > 0 ? updatedHistory[0].load : '',
      loadHistory: updatedHistory,
    };

    onUpdateRoutine(newRoutine);
    setSelectedExercise({ dayId: selectedExercise.dayId, ex: newRoutine.days[dayIndex].exercises[exIndex], setIndex });
  };

  return (
    <div className="animate-fade-in relative pb-32">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          
          <div className="flex-1">
            {isEditingTitle ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={titleInput}
                  onChange={e => setTitleInput(e.target.value)}
                  className="text-xl sm:text-2xl font-black bg-white dark:bg-slate-800 border border-indigo-400 rounded-xl px-3 py-1 outline-none text-slate-800 dark:text-white"
                  placeholder="Nome da Ficha"
                />
                <input
                  type="text"
                  value={descInput}
                  onChange={e => setDescInput(e.target.value)}
                  className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1 outline-none"
                  placeholder="Descrição opcional..."
                />
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={handleSaveTitle}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-indigo-700"
                  >
                    <Check className="w-3.5 h-3.5" /> Salvar Nome
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingTitle(false);
                      setTitleInput(routine.name);
                      setDescInput(routine.description || '');
                    }}
                    className="px-3 py-1 text-slate-500 hover:text-slate-700 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="group flex items-center gap-2">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
                    {routine.name}
                  </h2>
                  {routine.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 whitespace-pre-wrap">{routine.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 text-slate-400 hover:text-indigo-600 opacity-60 hover:opacity-100 transition-opacity"
                  title="Editar nome da ficha"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Ações Rápidas no Topo */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {onUpdateRoutine && (
            <button
              onClick={handleAddDayDirectly}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Adicionar nova divisão de treino"
            >
              <Plus className="w-4 h-4" />
              <span>+ Adicionar Treino</span>
            </button>
          )}

          <button
            onClick={() => setShowMiniCalendar(!showMiniCalendar)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showMiniCalendar
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
            title="Alternar exibição do mini-calendário"
          >
            <CalendarDays className="w-4 h-4 text-indigo-500" />
            <span className="hidden sm:inline">{showMiniCalendar ? 'Ocultar Calendário' : 'Mini Calendário'}</span>
          </button>

          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
            <button
              onClick={() => setViewMode('lista')}
              className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                viewMode === 'lista' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Visão em Lista"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('semanal')}
              className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                viewMode === 'semanal' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Visão Semanal"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {completedToast && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-sm font-semibold animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{completedToast}</span>
          </div>
          <button onClick={() => setCompletedToast(null)} className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Aviso de Projeto Finalizado */}
      {(routine.isCycleCompleted || (projectEndDate && formatDateISO(new Date()) >= projectEndDate)) && (
        <div className="mb-6 p-5 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 border-2 border-emerald-400/60 dark:border-emerald-500/40 rounded-3xl flex flex-col sm:flex-row items-center gap-4 text-emerald-900 dark:text-emerald-200 animate-fade-in shadow-sm">
          <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-md shrink-0">
            <Flag className="w-6 h-6" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h4 className="font-black text-base text-slate-800 dark:text-white">Projeto Finalizado / Ciclo Encerrado!</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Este ciclo de treino atingiu a data final estabelecida para o projeto ({projectEndDate ? formatDateDisplay(projectEndDate).split(' ')[0] : 'prazo final'}). 
              Nenhum treino será remarcado após este prazo.
            </p>
          </div>
          <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded-xl font-black text-xs uppercase tracking-wider shrink-0">
            Finalizado
          </div>
        </div>
      )}

      {/* Mini-Calendário Integrado com Edição de Início, Fim e Descanso */}
      {showMiniCalendar && (
        <div className="mb-6 animate-fade-in">
          <WorkoutMiniCalendar 
            routine={routine} 
            project={project} 
            onCompleteDay={handleCompleteDay}
            onUpdateDates={handleUpdateDateConfig}
          />
        </div>
      )}

      {/* Resumo do Ciclo & Dias de Descanso */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
            <CalendarIcon className="w-4 h-4 text-indigo-500" />
            <span>Início:</span>
            <span className="font-bold text-slate-800 dark:text-white">
              {formatDateDisplay(routine.startDate || routine.days?.[0]?.scheduledDate || project?.startDate) || 'Hoje'}
            </span>
          </div>

          {projectEndDate && (
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
              <Flag className="w-4 h-4 text-rose-500" />
              <span>Término:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {formatDateDisplay(projectEndDate).split(' ')[0]}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
            <Coffee className="w-4 h-4 text-amber-500" />
            <span>Descanso:</span>
            <span className="font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/50">
              {routine.restDays && routine.restDays.length > 0
                ? WEEK_DAYS.filter(w => routine.restDays?.includes(w.value)).map(w => w.short).join(', ')
                : 'Sem descanso fixo'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Ciclo:</span>
            <span className="font-bold text-slate-800 dark:text-white">
              {routine.days.length} {routine.days.length === 1 ? 'treino' : 'treinos rotativos'}
            </span>
          </div>
        </div>

        <div className="text-slate-400 text-[11px] font-medium">
          Edite exercícios, séries e datas diretamente nesta tela principal.
        </div>
      </div>

      {viewMode === 'lista' ? (
        <div className="space-y-6">
          {routine.days.map((day, dayIndex) => (
            <div key={day.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              {/* Header do Dia de Treino */}
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="text"
                    value={day.name}
                    onChange={(e) => handleRenameDay(dayIndex, e.target.value)}
                    placeholder="Nome do Treino (ex: Treino A - Peito)"
                    className="font-black text-lg text-slate-800 dark:text-white bg-transparent outline-none border-b border-transparent focus:border-indigo-500 transition-colors w-full sm:max-w-xs"
                    title="Clique para editar o nome do treino"
                  />

                  {/* Agendamento dinâmico */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs self-start sm:self-auto">
                    <CalendarIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="text-xs font-semibold text-slate-400">Data:</span>
                    <input
                      type="date"
                      value={day.scheduledDate || ''}
                      onChange={(e) => handleUpdateDayDate(dayIndex, e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
                      title="Alterar data deste treino"
                    />
                    {day.scheduledDate && (
                      <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 ml-1">
                        {formatDateDisplay(day.scheduledDate).split(' ')[1] || ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Botões do Dia */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                  <button
                    onClick={() => handleAddExercise(dayIndex)}
                    className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Exercício
                  </button>

                  {onUpdateRoutine && (
                    <button
                      onClick={() => handleCompleteDay(dayIndex)}
                      className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                      title="Marcar treino como realizado e avançar ciclo"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Concluir
                    </button>
                  )}

                  {onPlayDay && day.exercises.length > 0 && (
                    <button 
                      onClick={() => onPlayDay(dayIndex)}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Iniciar
                    </button>
                  )}

                  <button
                    onClick={() => handleRemoveDay(dayIndex)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                    title="Excluir este dia de treino"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Lista de Exercícios deste Dia */}
              <div className="p-0">
                {day.exercises.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                    <p className="text-sm text-slate-400">Nenhum exercício adicionado a este treino.</p>
                    <button
                      onClick={() => handleAddExercise(dayIndex)}
                      className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Adicionar Primeiro Exercício
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {day.exercises.map((ex, exIndex) => (
                      <div 
                        key={ex.id} 
                        className={`flex flex-col lg:flex-row items-stretch lg:items-center p-4 sm:p-5 gap-4 lg:gap-6 ${
                          exIndex !== day.exercises.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/50' : ''
                        } hover:bg-slate-50/50 dark:hover:bg-slate-700/10 transition-colors`}
                      >
                        {/* Nome do Exercício */}
                        <div className="flex-[0_0_220px] min-w-0">
                          <h4 className="font-bold text-base text-slate-800 dark:text-slate-100 leading-snug">
                            {ex.name || 'Sem nome (clique em Configurar)'}
                          </h4>
                          {ex.setsData?.some(s => s.bisetExerciseName) && (
                            <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-500 font-bold bg-amber-50 dark:bg-amber-900/20 inline-block px-2 py-0.5 rounded border border-amber-100 dark:border-amber-800/30 whitespace-nowrap">
                              + Bi-sets: {Array.from(new Set(ex.setsData.map(s => s.bisetExerciseName).filter(Boolean))).join(', ')}
                            </div>
                          )}
                          {ex.progressionMethod && (
                            <span className="block text-[10px] text-indigo-500 font-bold mt-1 uppercase tracking-wide">
                              {ex.progressionMethod}
                            </span>
                          )}
                        </div>

                        {/* Séries do Exercício */}
                        <div className="flex-1 flex gap-2 lg:gap-2.5 overflow-x-auto pb-2 lg:pb-0 items-start lg:items-center [&::-webkit-scrollbar]:hidden">
                          {ex.setsData ? ex.setsData.map((s, i) => (
                            <div key={i} className="group relative flex flex-col gap-1 items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs rounded-2xl p-2.5 min-w-[4.8rem] lg:min-w-[5.5rem] shrink-0">
                              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded w-full text-center">
                                S{i+1}
                              </div>
                              <span className="font-black text-slate-700 dark:text-slate-200 text-base whitespace-nowrap">
                                {s.reps || '-'}
                              </span>
                              {s.rest && <span className="text-[9px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-700 px-1 py-0.5 rounded">{s.rest}</span>}
                              
                              {s.load && (
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-full mt-0.5 border border-indigo-100 dark:border-indigo-800/30 w-full text-center whitespace-nowrap truncate">
                                  {s.load}
                                </span>
                              )}

                              <button 
                                onClick={() => setSelectedExercise({ dayId: day.id, ex, setIndex: i })} 
                                className="absolute -top-1.5 -right-1.5 bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-xs hover:scale-110 active:scale-95 cursor-pointer" 
                                title="Progresso da Série"
                              >
                                <TrendingUp className="w-3 h-3" />
                              </button>

                              {s.technique && (
                                <span className="text-[8px] font-bold bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-1 py-0.5 rounded mt-0.5 uppercase w-full text-center truncate" title={s.technique}>
                                  {s.technique}
                                </span>
                              )}
                            </div>
                          )) : (
                            <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl font-medium">
                              {ex.sets} séries x {ex.reps} reps ({ex.rest})
                            </div>
                          )}
                        </div>

                        {/* Ações do Exercício */}
                        <div className="flex-none flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingEx({ dayIndex, exIndex })}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 dark:bg-slate-700/60 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Editar exercício, séries e técnicas"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            <span>Configurar</span>
                          </button>

                          <button 
                            onClick={() => handleDuplicateExercise(dayIndex, exIndex)} 
                            title="Duplicar Exercício"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => handleRemoveExercise(dayIndex, exIndex)} 
                            title="Remover Exercício"
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Botão rápido para Adicionar Treino na base da lista */}
          {onUpdateRoutine && (
            <button
              onClick={handleAddDayDirectly}
              className="w-full py-5 rounded-3xl border-2 border-dashed border-indigo-200 hover:border-indigo-500 dark:border-indigo-900/60 dark:hover:border-indigo-500 bg-white/60 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer group shadow-2xs"
            >
              <Plus className="w-5 h-5 group-hover:scale-125 transition-transform" />
              <span>+ Adicionar Treino {String.fromCharCode(65 + routine.days.length)} diretamente nesta tela</span>
            </button>
          )}
        </div>
      ) : (
        /* Visão Calendário Semanal/Mensal (21 dias) */
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Projeção do Ciclo Dinâmico (Próximos 21 dias)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Distribuição contínua com avanço automático e respeito aos dias de descanso.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Treino Ativo
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                  <Coffee className="w-3.5 h-3.5" /> Descanso (Off)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
              {generateCalendarProjection(
                routine.days,
                routine.startDate || routine.days?.[0]?.scheduledDate || project?.startDate || formatDateISO(new Date()),
                routine.restDays || [],
                21,
                projectEndDate
              ).map((proj, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between min-h-[110px] ${
                    proj.isPastProjectEnd
                      ? 'bg-slate-50/40 dark:bg-slate-900/20 border-slate-200/50 dark:border-slate-800 text-slate-300 dark:text-slate-600 opacity-60'
                      : proj.isRest
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-xs hover:border-indigo-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                        {WEEK_DAYS[proj.dayOfWeek]?.label}
                      </span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {proj.date.split('-').slice(1).reverse().join('/')}
                      </span>
                    </div>

                    <div className="font-extrabold text-sm mt-1">
                      {proj.isPastProjectEnd ? (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Flag className="w-3 h-3 text-rose-400" /> Fim do Projeto
                        </span>
                      ) : proj.isRest ? (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs">
                          <Coffee className="w-3.5 h-3.5" /> Descanso
                        </span>
                      ) : (
                        <span className="text-indigo-600 dark:text-indigo-400 line-clamp-1">
                          {proj.dayName}
                        </span>
                      )}
                    </div>
                  </div>

                  {!proj.isRest && !proj.isPastProjectEnd && proj.dayIndex >= 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-slate-400">
                        {routine.days[proj.dayIndex]?.exercises?.length || 0} exercícios
                      </span>
                      {onUpdateRoutine && (
                        <button
                          onClick={() => handleCompleteDay(proj.dayIndex)}
                          className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5 cursor-pointer"
                          title="Concluir este treino"
                        >
                          <Check className="w-3 h-3" /> Feito
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuração Completa de Exercício (Centralizado) */}
      {editingEx && (() => {
        const { dayIndex: dIndex, exIndex } = editingEx;
        const ex = routine.days[dIndex]?.exercises[exIndex];
        if (!ex) return null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col my-auto max-h-[90vh] animate-scale-in">
              <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80 sticky top-0 z-10 shrink-0">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">
                    Configurar Exercício
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {routine.days[dIndex]?.name} • Exercício {exIndex + 1}
                  </p>
                </div>
                <button 
                  onClick={() => setEditingEx(null)} 
                  className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 md:p-6 overflow-y-auto space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Nome do Exercício</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Supino Reto com Barra" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500 font-bold text-base text-slate-800 dark:text-white"
                    value={ex.name} 
                    onChange={e => handleUpdateExercise(dIndex, exIndex, 'name', e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/50 dark:bg-slate-800/30 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Carga Alvo Referência</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 40kg cada lado" 
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm font-semibold text-slate-800 dark:text-white"
                      value={ex.currentLoad || ''} 
                      onChange={e => handleUpdateExercise(dIndex, exIndex, 'currentLoad', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Método de Progressão</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Pirâmide, RPT, Dupla Progressão" 
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm font-semibold text-slate-800 dark:text-white"
                      value={ex.progressionMethod || ''} 
                      onChange={e => handleUpdateExercise(dIndex, exIndex, 'progressionMethod', e.target.value)}
                    />
                  </div>
                </div>

                {/* Séries Individuais */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Séries e Técnicas ({ex.setsData?.length || 0})
                    </label>
                    <button 
                      type="button"
                      onClick={() => handleAddSet(dIndex, exIndex)} 
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Série
                    </button>
                  </div>

                  <div className="space-y-3">
                    {ex.setsData?.map((set, sIndex) => {
                      const currentTechs = set.technique ? set.technique.split(',').map(s => s.trim()) : [];
                      return (
                        <div key={set.id || sIndex} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                              Série {sIndex + 1}
                            </span>
                            {ex.setsData!.length > 1 && (
                              <button
                                onClick={() => handleRemoveSet(dIndex, exIndex, sIndex)}
                                className="text-slate-400 hover:text-rose-500 p-1 rounded-lg"
                                title="Remover série"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Reps</label>
                              <input
                                type="text"
                                placeholder="10-12"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                                value={set.reps || ''}
                                onChange={e => handleUpdateSet(dIndex, exIndex, sIndex, 'reps', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Carga (kg)</label>
                              <input
                                type="text"
                                placeholder="ex: 20kg"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                                value={set.load || ''}
                                onChange={e => handleUpdateSet(dIndex, exIndex, sIndex, 'load', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Descanso</label>
                              <input
                                type="text"
                                placeholder="60s"
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                                value={set.rest || ''}
                                onChange={e => handleUpdateSet(dIndex, exIndex, sIndex, 'rest', e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Técnicas */}
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Técnicas na Série:</span>
                            <div className="flex flex-wrap gap-1">
                              {TECHNIQUES.map(tech => {
                                const isSelected = currentTechs.includes(tech.id);
                                return (
                                  <button
                                    key={tech.id}
                                    type="button"
                                    onClick={() => toggleTechniqueSet(dIndex, exIndex, sIndex, tech.id)}
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all border ${
                                      isSelected
                                        ? 'bg-rose-500 text-white border-rose-500'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                                    }`}
                                  >
                                    {tech.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Bi-set info se selecionado */}
                          {currentTechs.includes('Bi-set') && (
                            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 space-y-2">
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase block">
                                Segundo Exercício do Bi-set
                              </span>
                              <input
                                type="text"
                                placeholder="Nome do segundo exercício..."
                                className="w-full bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/60 rounded-lg px-2.5 py-1 text-xs outline-none"
                                value={set.bisetExerciseName || ''}
                                onChange={e => handleUpdateSet(dIndex, exIndex, sIndex, 'bisetExerciseName', e.target.value)}
                              />
                            </div>
                          )}

                          {/* Drop-set loads */}
                          {currentTechs.includes('Drop Set') && (
                            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase">
                                  Drops de Carga
                                </span>
                                <div className="flex gap-1">
                                  {[1, 2, 3].map(c => (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() => handleUpdateDropCount(dIndex, exIndex, sIndex, c)}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        (set.dropLoads?.length || 0) === c ? 'bg-rose-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600'
                                      }`}
                                    >
                                      {c} drop{c > 1 ? 's' : ''}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-1.5">
                                {set.dropLoads?.map((dl, dlIdx) => (
                                  <input
                                    key={dlIdx}
                                    type="text"
                                    placeholder={`Drop ${dlIdx + 1}`}
                                    className="flex-1 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/60 rounded-lg px-2 py-1 text-xs outline-none"
                                    value={dl}
                                    onChange={e => handleUpdateDropLoad(dIndex, exIndex, sIndex, dlIdx, e.target.value)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Observações do Exercício</label>
                  <textarea 
                    rows={2} 
                    placeholder="Dicas de execução, postura, pegada..." 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-indigo-500 text-xs text-slate-800 dark:text-white"
                    value={ex.notes || ''} 
                    onChange={e => handleUpdateExercise(dIndex, exIndex, 'notes', e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 flex justify-end">
                <button
                  type="button"
                  onClick={() => setEditingEx(null)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Pronto
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Histórico de Progressão de Carga */}
      {selectedExercise && (() => {
        const setIndex = selectedExercise.setIndex;
        const setData = selectedExercise.ex.setsData?.[setIndex];
        const loadHistory = setData?.loadHistory || selectedExercise.ex.loadHistory || [];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col md:max-h-[85vh] max-h-screen animate-scale-in">
              <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80 sticky top-0 z-10">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">Histórico de Progressão</h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedExercise.ex.name} - Série {setIndex + 1}</p>
                </div>
                <button 
                  onClick={() => setSelectedExercise(null)} 
                  className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 md:p-6 overflow-y-auto">
                <div className="mb-6 space-y-3 bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                  <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Nova Evolução</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">Carga (ex: 20kg)</label>
                      <input 
                        type="text" 
                        value={newLoad}
                        onChange={e => setNewLoad(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">Reps executadas</label>
                      <input 
                        type="text" 
                        value={newReps}
                        onChange={e => setNewReps(e.target.value)}
                        placeholder="Ex: 12"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">Observações (opcional)</label>
                    <input 
                      type="text" 
                      value={newNotes}
                      onChange={e => setNewNotes(e.target.value)}
                      placeholder="Sentiu fácil? Amplitude máxima?"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-sm"
                    />
                  </div>
                  <button 
                    onClick={handleAddProgression}
                    disabled={!newLoad.trim()}
                    className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Registrar Progressão
                  </button>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    Histórico ({loadHistory.length})
                  </h4>
                  
                  <div className="space-y-3">
                    {loadHistory.length === 0 ? (
                      <p className="text-center text-sm text-slate-400 py-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        Nenhum registro ainda.
                      </p>
                    ) : (
                      loadHistory.map((h, i) => (
                        <div key={h.id || i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex items-center justify-between group">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-white">{h.load}</span>
                              {h.reps && <span className="text-xs bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold">{h.reps} reps</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-400 font-medium">
                                {new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                              </span>
                              {h.notes && (
                                <span className="text-[10px] text-slate-500 line-clamp-1 flex-1">
                                  • {h.notes}
                                </span>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRemoveProgression(h.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
