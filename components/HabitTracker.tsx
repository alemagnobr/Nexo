import React, { useState } from 'react';
import { Habit, HabitEntry } from '../types';
import { Target, Plus, Trash2, Edit2, CheckCircle2, Circle, X, Calendar as CalendarIcon, Check, XCircle } from 'lucide-react';

interface HabitTrackerProps {
  habits: Habit[];
  onAdd: (habit: Omit<Habit, 'id' | 'createdAt' | 'entries'>) => void;
  onUpdate: (id: string, updates: Partial<Habit>) => void;
  onDelete: (id: string) => void;
  onToggleEntry: (id: string, dayIndex: number, status: 'done' | 'missed', dateStr: string) => void;
  privacyMode: boolean;
}

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#6366f1'
];

const ICONS = ['🎯', '💧', '🏃', '📚', '🧘', '🥗', '💻', '🎸', '🎨', '✍️', '💸', '🧹'];

export const HabitTracker: React.FC<HabitTrackerProps> = ({
  habits,
  onAdd,
  onUpdate,
  onDelete,
  onToggleEntry,
  privacyMode
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: '🎯', color: '#3b82f6', targetDays: 21, startDate: new Date().toISOString().split('T')[0], description: '', punishment: 0 });
  
  // Entry Modal State
  const [entryModal, setEntryModal] = useState<{ habitId: string, dayIndex: number, status: 'done' | 'missed', date: string } | null>(null);

  const handleSave = () => {
    if (!formData.name.trim() || formData.targetDays < 1) return;
    
    if (editingId) {
      onUpdate(editingId, { 
          name: formData.name, 
          icon: formData.icon, 
          color: formData.color, 
          targetDays: formData.targetDays,
          startDate: formData.startDate,
          description: formData.description,
          punishment: formData.punishment
      });
    } else {
      onAdd({ 
          name: formData.name, 
          icon: formData.icon, 
          color: formData.color, 
          targetDays: formData.targetDays,
          startDate: formData.startDate,
          description: formData.description,
          punishment: formData.punishment
      });
    }
    
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', icon: '🎯', color: '#3b82f6', targetDays: 21, startDate: new Date().toISOString().split('T')[0], description: '', punishment: 0 });
  };

  const startEdit = (habit: Habit) => {
    setFormData({ 
        name: habit.name, 
        icon: habit.icon, 
        color: habit.color, 
        targetDays: habit.targetDays || 21,
        startDate: habit.startDate || new Date().toISOString().split('T')[0],
        description: habit.description || '',
        punishment: habit.punishment || 0
    });
    setEditingId(habit.id);
    setIsAdding(true);
  };

  const handleSaveEntry = () => {
      if (!entryModal) return;
      onToggleEntry(entryModal.habitId, entryModal.dayIndex, entryModal.status, entryModal.date);
      setEntryModal(null);
  };

  const formatDateShort = (dateStr: string) => {
      if (!dateStr) return '';
      const [y, m, d] = dateStr.split('-');
      return `${parseInt(d)}/${parseInt(m)}`;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-500" />
            Rastreador de Hábitos
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Construa rotinas diárias consistentes e acompanhe seu progresso.</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', icon: '🎯', color: '#3b82f6', targetDays: 21, startDate: new Date().toISOString().split('T')[0], description: '', punishment: 0 });
            setIsAdding(true);
            setEditingId(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Novo Hábito
        </button>
      </div>

      {isAdding && (
        <div className="mb-8 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white">
              {editingId ? 'Editar Hábito' : 'Criar Novo Hábito'}
            </h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Nome do Hábito</label>
              <input
                type="text"
                placeholder="Ex: Ler 20 páginas, Beber 2L água"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Dias Alvo (ex: 21, 30, 66)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={formData.targetDays}
                onChange={(e) => setFormData({ ...formData, targetDays: parseInt(e.target.value) || 21 })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Data de Início</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Penalidade por Falha (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 5.00"
                value={formData.punishment || ''}
                onChange={(e) => setFormData({ ...formData, punishment: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Descrição / Motivação</label>
            <input
              type="text"
              placeholder="Por que este hábito é importante para você?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center border transition-all ${
                    formData.icon === icon
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 scale-110'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Cor</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === c ? 'border-indigo-600 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors"
            >
              {editingId ? 'Salvar Alterações' : 'Criar Hábito'}
            </button>
          </div>
        </div>
      )}

      {habits.length === 0 && !isAdding ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">Nenhum hábito cadastrado</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Comece definindo pequenos hábitos diários para construir uma rotina consistente.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Adicionar Primeiro Hábito
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {habits.map((habit) => {
            const completedCount = Object.values(habit.entries || {}).filter((e) => e?.status === 'done').length;
            const target = habit.targetDays || 21;
            const progress = Math.min(100, Math.round((completedCount / target) * 100));

            // Generate Day Grid up to target days
            const dayItems = Array.from({ length: target }, (_, i) => {
              const dayIndex = i + 1;
              const entry = habit.entries ? habit.entries[dayIndex] : undefined;
              return { dayIndex, entry };
            });

            return (
              <div
                key={habit.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group"
              >
                {/* Accent top border based on habit color */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: habit.color || '#3b82f6' }}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-slate-100 dark:border-slate-700"
                      style={{ backgroundColor: `${habit.color}15` }}
                    >
                      {habit.icon || '🎯'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-base md:text-lg flex items-center gap-2">
                        {habit.name}
                        {progress === 100 && (
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">
                            Concluído! 🏆
                          </span>
                        )}
                      </h3>
                      {habit.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{habit.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Progress Indicator */}
                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-400">Progresso</span>
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {completedCount} / {target} dias ({progress}%)
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(habit)}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                        title="Editar Hábito"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(habit.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                        title="Excluir Hábito"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mb-5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: habit.color || '#3b82f6',
                    }}
                  />
                </div>

                {/* Day Check-in Grid */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Jornada dos {target} Dias
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Clique no dia para registrar ou alterar
                    </span>
                  </div>

                  <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-21 gap-2">
                    {dayItems.map(({ dayIndex, entry }) => {
                      const isDone = entry?.status === 'done';
                      const isMissed = entry?.status === 'missed';

                      let bgClass = 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400';
                      let customStyle = {};

                      if (isDone) {
                        bgClass = 'text-white border-transparent shadow-sm';
                        customStyle = { backgroundColor: habit.color || '#3b82f6' };
                      } else if (isMissed) {
                        bgClass = 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-500';
                      }

                      return (
                        <button
                          key={dayIndex}
                          onClick={() => {
                            // Calculate approximate date based on start date + dayIndex
                            const start = habit.startDate ? new Date(habit.startDate) : new Date();
                            const targetDate = new Date(start);
                            targetDate.setDate(targetDate.getDate() + (dayIndex - 1));
                            const dateStr = entry?.date || targetDate.toISOString().split('T')[0];

                            setEntryModal({
                              habitId: habit.id,
                              dayIndex,
                              status: isDone ? 'missed' : 'done',
                              date: dateStr,
                            });
                          }}
                          style={customStyle}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${bgClass}`}
                        >
                          <span className="text-[10px] opacity-75">D{dayIndex}</span>
                          {isDone ? (
                            <Check className="w-3.5 h-3.5 mt-0.5 stroke-[3]" />
                          ) : isMissed ? (
                            <X className="w-3.5 h-3.5 mt-0.5 stroke-[3]" />
                          ) : (
                            <span className="w-3.5 h-3.5 mt-0.5 flex items-center justify-center text-[10px] opacity-50">
                              -
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Entry Modal */}
      {entryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-500" />
                Registrar Dia {entryModal.dayIndex}
              </h3>
              <button onClick={() => setEntryModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Status do Dia</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEntryModal({ ...entryModal, status: 'done' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                      entryModal.status === 'done'
                        ? 'bg-emerald-500 text-white border-transparent shadow-md'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Concluído
                  </button>

                  <button
                    type="button"
                    onClick={() => setEntryModal({ ...entryModal, status: 'missed' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                      entryModal.status === 'missed'
                        ? 'bg-rose-500 text-white border-transparent shadow-md'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <XCircle className="w-4 h-4" /> Falhei
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Data</label>
                <input
                  type="date"
                  value={entryModal.date}
                  onChange={(e) => setEntryModal({ ...entryModal, date: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => setEntryModal(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEntry}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
