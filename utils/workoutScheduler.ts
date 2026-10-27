import { RoutineDay, WorkoutRoutine } from '../types';

export interface WeekDayOption {
  label: string;
  short: string;
  value: number; // 0 (Dom) to 6 (Sáb)
}

export const WEEK_DAYS: WeekDayOption[] = [
  { label: 'Domingo', short: 'Dom', value: 0 },
  { label: 'Segunda', short: 'Seg', value: 1 },
  { label: 'Terça', short: 'Ter', value: 2 },
  { label: 'Quarta', short: 'Qua', value: 3 },
  { label: 'Quinta', short: 'Qui', value: 4 },
  { label: 'Sexta', short: 'Sex', value: 5 },
  { label: 'Sábado', short: 'Sáb', value: 6 },
];

/**
 * Normaliza uma string de data para objeto Date local
 */
export function parseDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  return new Date();
}

/**
 * Formata um objeto Date para YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formata uma data YYYY-MM-DD para formato amigável brasileiro: "DD/MM/YYYY (Dia)"
 */
export function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return '';
  const d = parseDate(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const weekDayName = WEEK_DAYS[d.getDay()]?.short || '';
  return `${day}/${month}/${year} (${weekDayName})`;
}

/**
 * Obtém a próxima data de treino válida, pulando os dias de descanso especificados.
 */
export function getNextValidTrainingDate(
  startDateStr: string,
  restDays: number[] = [],
  dayOffset: number = 0
): string {
  if (!startDateStr) {
    startDateStr = formatDateISO(new Date());
  }

  const current = parseDate(startDateStr);

  // Se o dia inicial for dia de descanso, avança até o primeiro dia de treino válido
  while (restDays.includes(current.getDay())) {
    current.setDate(current.getDate() + 1);
  }

  let stepsTaken = 0;
  while (stepsTaken < dayOffset) {
    current.setDate(current.getDate() + 1);
    if (!restDays.includes(current.getDay())) {
      stepsTaken++;
    }
  }

  return formatDateISO(current);
}

/**
 * Recalcula as datas agendadas para uma lista de dias de treino com base na data inicial e dias de descanso.
 */
export function recalculateRoutineDates(
  days: RoutineDay[],
  startDateStr: string,
  restDays: number[] = [],
  projectEndDate?: string
): RoutineDay[] {
  if (!days || days.length === 0) return [];

  const baseDate = days[0]?.scheduledDate || startDateStr || formatDateISO(new Date());
  
  return days.map((day, index) => {
    const calculatedDate = getNextValidTrainingDate(baseDate, restDays, index);
    const isPastEnd = projectEndDate && calculatedDate > projectEndDate;
    return {
      ...day,
      scheduledDate: isPastEnd ? undefined : (day.scheduledDate && index === 0 ? day.scheduledDate : calculatedDate),
    };
  });
}

/**
 * Adiciona um novo dia de treino (ex: Treino C) diretamente à rotina, calculando sua data dinamicamente
 */
export function addNewWorkoutDayToRoutine(
  routine: WorkoutRoutine,
  baseStartDate?: string,
  projectEndDate?: string
): WorkoutRoutine {
  const nextIndex = routine.days.length;
  const nextLetter = String.fromCharCode(65 + nextIndex); // A, B, C, D...
  
  const anchorDate = routine.startDate || routine.days?.[0]?.scheduledDate || baseStartDate || formatDateISO(new Date());
  const restDays = routine.restDays || [];
  const maxEndDate = projectEndDate || routine.endDate;
  
  const calculatedDate = getNextValidTrainingDate(anchorDate, restDays, nextIndex);
  const isPastEnd = Boolean(maxEndDate && calculatedDate > maxEndDate);

  const newDay: RoutineDay = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
    name: `Treino ${nextLetter}`,
    exercises: [],
    scheduledDate: isPastEnd ? undefined : calculatedDate,
  };
  
  return {
    ...routine,
    days: [...routine.days, newDay],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Ao concluir um treino, avança a sua próxima data para a próxima rodada do ciclo,
 * respeitando a data final do projeto (se atingir o fim, não remarca e finaliza o ciclo).
 */
export function advanceWorkoutCycleOnCompletion(
  routine: WorkoutRoutine,
  completedDayIndex: number,
  completionDate?: string,
  projectEndDate?: string
): WorkoutRoutine {
  const todayStr = completionDate || formatDateISO(new Date());
  const updatedDays = [...routine.days];
  const day = { ...updatedDays[completedDayIndex] };

  const completedHistory = day.completedDates || [];
  day.lastCompletedDate = todayStr;
  day.completedDates = [todayStr, ...completedHistory];

  const maxEndDate = projectEndDate || routine.endDate;

  // Encontra a maior data atualmente agendada entre todos os treinos do ciclo
  let maxScheduledDateStr = day.scheduledDate || todayStr;
  for (const d of updatedDays) {
    if (d.scheduledDate && d.scheduledDate > maxScheduledDateStr) {
      maxScheduledDateStr = d.scheduledDate;
    }
  }

  // A próxima data deste treino será o próximo dia válido de treino após a última data agendada
  const nextOccurrence = getNextValidTrainingDate(maxScheduledDateStr, routine.restDays || [], 1);

  // Se houver data limite do projeto e ultrapassar, NÃO remarca!
  let hitProjectEnd = false;
  if (maxEndDate && nextOccurrence > maxEndDate) {
    day.scheduledDate = undefined; // Trava: não agenda após o fim do projeto
    hitProjectEnd = true;
  } else {
    day.scheduledDate = nextOccurrence;
  }

  updatedDays[completedDayIndex] = day;

  // Se todos os treinos não têm mais agendamento futuro (ultrapassaram a data final), o ciclo é dado como concluído
  const allCompleted = updatedDays.every(d => !d.scheduledDate);

  return {
    ...routine,
    isCycleCompleted: hitProjectEnd || allCompleted,
    days: updatedDays,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Estrutura de projeção para o calendário
 */
export interface ProjectedSession {
  date: string;
  dayName: string;
  dayIndex: number;
  isRest: boolean;
  dayOfWeek: number;
  isPastProjectEnd?: boolean;
}

export function generateCalendarProjection(
  days: RoutineDay[],
  startDateStr: string,
  restDays: number[] = [],
  totalDaysToProject: number = 21,
  projectEndDate?: string
): ProjectedSession[] {
  if (!days || days.length === 0) return [];

  const projection: ProjectedSession[] = [];
  const current = parseDate(startDateStr || formatDateISO(new Date()));
  let workoutIndex = 0;

  for (let i = 0; i < totalDaysToProject; i++) {
    const dateStr = formatDateISO(current);
    const dayOfWeek = current.getDay();
    const isRest = restDays.includes(dayOfWeek);
    const isPastProjectEnd = Boolean(projectEndDate && dateStr > projectEndDate);

    if (isRest) {
      projection.push({
        date: dateStr,
        dayName: 'Descanso',
        dayIndex: -1,
        isRest: true,
        dayOfWeek,
        isPastProjectEnd,
      });
    } else {
      const routineDay = days[workoutIndex % days.length];
      projection.push({
        date: dateStr,
        dayName: routineDay?.name || `Treino ${String.fromCharCode(65 + (workoutIndex % days.length))}`,
        dayIndex: workoutIndex % days.length,
        isRest: false,
        dayOfWeek,
        isPastProjectEnd,
      });
      workoutIndex++;
    }

    current.setDate(current.getDate() + 1);
  }

  return projection;
}
