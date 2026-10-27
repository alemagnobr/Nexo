import React, { useState } from 'react';
import { WorkoutRoutine, WorkoutProject } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Coffee, CheckCircle2, Flag, Settings2, Sparkles, Check } from 'lucide-react';
import { WEEK_DAYS, formatDateISO, formatDateDisplay, parseDate } from '../utils/workoutScheduler';

interface WorkoutMiniCalendarProps {
  routine: WorkoutRoutine;
  project?: WorkoutProject;
  onCompleteDay?: (dayIndex: number) => void;
  onUpdateDates?: (startDate: string, endDate: string, restDays: number[]) => void;
}

export const WorkoutMiniCalendar: React.FC<WorkoutMiniCalendarProps> = ({
  routine,
  project,
  onCompleteDay,
  onUpdateDates,
}) => {
  const [currentDate, setCurrentDate] = useState(() => {
    const initialDateStr = routine.days?.[0]?.scheduledDate || routine.startDate || project?.startDate || formatDateISO(new Date());
    return parseDate(initialDateStr);
  });

  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  // Estados locais sincronizados de datas
  const activeStartDate = routine.startDate || routine.days?.[0]?.scheduledDate || project?.startDate || formatDateISO(new Date());
  const activeEndDate = routine.endDate || project?.endDate || '';
  const activeRestDays = routine.restDays || [];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Primeiros dias do mês e dias totais
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  // Mapeamentos de dados da rotina
  const restDays = activeRestDays;
  const projectEndDate = activeEndDate;
  const projectStartDate = activeStartDate;

  // Handlers para datas e descansos
  const handleStartDateChange = (newStart: string) => {
    onUpdateDates?.(newStart, activeEndDate, activeRestDays);
  };

  const handleEndDateChange = (newEnd: string) => {
    onUpdateDates?.(activeStartDate, newEnd, activeRestDays);
  };

  const handleToggleRestDay = (dayVal: number) => {
    const updated = activeRestDays.includes(dayVal)
      ? activeRestDays.filter(d => d !== dayVal)
      : [...activeRestDays, dayVal].sort();
    onUpdateDates?.(activeStartDate, activeEndDate, updated);
  };

  // Mapa de datas agendadas para os treinos: dateStr -> { dayIndex, dayName }
  const scheduledMap = new Map<string, { dayIndex: number; name: string }>();
  (routine.days || []).forEach((day, index) => {
    if (day.scheduledDate) {
      scheduledMap.set(day.scheduledDate, { dayIndex: index, name: day.name });
    }
  });

  // Mapa de conclusões: dateStr -> string[] (nomes dos treinos concluídos nessa data)
  const completedMap = new Map<string, string[]>();
  (routine.days || []).forEach(day => {
    (day.completedDates || []).forEach(d => {
      const existing = completedMap.get(d) || [];
      completedMap.set(d, [...existing, day.name]);
    });
  });

  // Dias em branco antes do início do mês
  const blankDays = Array.from({ length: startingDayOfWeek });
  const monthDays = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm p-4 sm:p-5 transition-all">
      {/* Cabeçalho do Mini-Calendário com botão para editar Início/Fim/Descanso */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-500" />
          <h4 className="font-extrabold text-base text-slate-800 dark:text-white">
            {monthNames[month]} {year}
          </h4>
          {projectEndDate && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-100 dark:border-rose-900/40">
              <Flag className="w-3 h-3" /> Fim: {formatDateDisplay(projectEndDate).split(' ')[0]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onUpdateDates && (
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                showConfig
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
              }`}
              title="Configurar Início, Fim e Descanso do Projeto"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{showConfig ? 'Fechar Datas' : 'Editar Início / Fim / Descanso'}</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700/50 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Painel Expansível de Configuração de Início, Fim e Descanso */}
      {showConfig && onUpdateDates && (
        <div className="mb-4 p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl animate-fade-in space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Período & Dias de Descanso da Ficha
            </h5>
            <span className="text-[11px] text-slate-400">Salva e recalcula automaticamente</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Data Inicial do Ciclo (Treino A)
              </label>
              <input
                type="date"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                value={activeStartDate}
                onChange={e => handleStartDateChange(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
                <Flag className="w-3 h-3 text-rose-500" />
                Data Final do Projeto (Limite)
              </label>
              <input
                type="date"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                value={activeEndDate}
                onChange={e => handleEndDateChange(e.target.value)}
                placeholder="Sem data limite"
              />
            </div>
          </div>

          {/* Seleção de Dias de Descanso */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 flex items-center gap-1">
              <Coffee className="w-3 h-3 text-amber-500" />
              Dias de Descanso da Semana (Off):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {WEEK_DAYS.map(w => {
                const isSelected = activeRestDays.includes(w.value);
                return (
                  <button
                    key={w.value}
                    type="button"
                    onClick={() => handleToggleRestDay(w.value)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {isSelected && <Coffee className="w-2.5 h-2.5 text-amber-600" />}
                    <span>{w.short}</span>
                    {isSelected && <span className="text-[9px] font-normal opacity-80">(Off)</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Legenda Resumida */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 mb-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Próximo Treino
        </span>
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Concluído
        </span>
        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> Descanso
        </span>
        {projectEndDate && (
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Data Limite
          </span>
        )}
      </div>

      {/* Grade dos Dias da Semana */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {WEEK_DAYS.map(w => (
          <div key={w.value} className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1">
            {w.short}
          </div>
        ))}
      </div>

      {/* Grade dos Dias do Mês */}
      <div className="grid grid-cols-7 gap-1">
        {blankDays.map((_, i) => (
          <div key={`blank-${i}`} className="h-10 sm:h-12 rounded-xl" />
        ))}

        {monthDays.map(dayNum => {
          const dateObj = new Date(year, month, dayNum);
          const dateStr = formatDateISO(dateObj);
          const dayOfWeek = dateObj.getDay();

          const isRest = restDays.includes(dayOfWeek);
          const scheduled = scheduledMap.get(dateStr);
          const completedList = completedMap.get(dateStr);
          const isProjectEnd = projectEndDate === dateStr;
          const isPastProjectEnd = Boolean(projectEndDate && dateStr > projectEndDate);
          const isToday = formatDateISO(new Date()) === dateStr;

          let dayBg = 'bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300';
          let borderStyle = 'border-transparent';

          if (isPastProjectEnd) {
            dayBg = 'bg-slate-100/50 dark:bg-slate-900/20 text-slate-300 dark:text-slate-600 opacity-60';
          } else if (completedList && completedList.length > 0) {
            dayBg = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 font-bold';
          } else if (scheduled) {
            dayBg = 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 font-bold shadow-xs';
          } else if (isRest) {
            dayBg = 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40';
          }

          if (isToday) {
            borderStyle = 'ring-2 ring-indigo-500';
          }

          if (isProjectEnd) {
            borderStyle = 'ring-2 ring-rose-500 font-black';
          }

          return (
            <button
              key={dayNum}
              type="button"
              onClick={() => setSelectedDateStr(selectedDateStr === dateStr ? null : dateStr)}
              className={`h-10 sm:h-12 rounded-xl border p-1 flex flex-col items-center justify-between transition-all cursor-pointer hover:scale-105 ${dayBg} ${borderStyle}`}
              title={`${dateStr}: ${scheduled ? scheduled.name : isRest ? 'Descanso' : isProjectEnd ? 'Fim do Projeto' : 'Dia Livre'}`}
            >
              <div className="flex items-center justify-between w-full px-1">
                <span className={`text-[11px] sm:text-xs leading-none ${isToday ? 'font-black text-indigo-600 dark:text-indigo-400' : ''}`}>
                  {dayNum}
                </span>
                {isProjectEnd && <Flag className="w-2.5 h-2.5 text-rose-500" />}
              </div>

              {/* Indicador inferior */}
              <div className="flex items-center justify-center gap-0.5">
                {completedList && completedList.length > 0 ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                ) : scheduled ? (
                  <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 leading-none truncate max-w-[38px]">
                    {scheduled.name.split(' ')[0] || 'Treino'}
                  </span>
                ) : isRest ? (
                  <Coffee className="w-2.5 h-2.5 text-amber-500" />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detalhe do dia selecionado */}
      {selectedDateStr && (
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fade-in">
          <div>
            <span className="font-bold text-slate-800 dark:text-white">
              {formatDateDisplay(selectedDateStr)}:
            </span>
            <span className="ml-1 text-slate-600 dark:text-slate-300">
              {scheduledMap.has(selectedDateStr)
                ? `📅 Treino agendado: ${scheduledMap.get(selectedDateStr)?.name}`
                : completedMap.has(selectedDateStr)
                ? `✅ Concluído: ${completedMap.get(selectedDateStr)?.join(', ')}`
                : restDays.includes(parseDate(selectedDateStr).getDay())
                ? '☕ Dia de Descanso (Off)'
                : projectEndDate && selectedDateStr > projectEndDate
                ? '🏁 Data posterior ao término do projeto'
                : 'Dia sem treino fixo marcado'}
            </span>
          </div>

          {scheduledMap.has(selectedDateStr) && onCompleteDay && (
            <button
              onClick={() => {
                const item = scheduledMap.get(selectedDateStr);
                if (item) onCompleteDay(item.dayIndex);
                setSelectedDateStr(null);
              }}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Concluir Este Treino
            </button>
          )}
        </div>
      )}
    </div>
  );
};
