import { ScheduleSession, DayName, TimeSlotInterval, AvailabilityEntityResult, DurationMatchResult } from '../types';
import { CONFIG } from '../config';
import { minutesToTime, timeToMinutes, formatDurationHours, matchesSearchQuery } from './normalizer';

const CAL_START = CONFIG.CALENDAR.START_MINUTES; // 420 (07:00)
const CAL_END = CONFIG.CALENDAR.END_MINUTES;     // 1260 (21:00)

/**
 * Calcula intervalos libres a partir de una lista de sesiones ocupadas en un día
 */
export function calculateFreeIntervals(
  occupiedSessions: ScheduleSession[],
  calStart: number = CAL_START,
  calEnd: number = CAL_END
): TimeSlotInterval[] {
  if (occupiedSessions.length === 0) {
    const durationMinutes = calEnd - calStart;
    return [{
      start: minutesToTime(calStart),
      end: minutesToTime(calEnd),
      startMinutes: calStart,
      endMinutes: calEnd,
      durationMinutes,
      durationHours: durationMinutes / 60
    }];
  }

  // Ordenar sesiones por horaInicio
  const sorted = [...occupiedSessions].sort((a, b) => a.startMinutes - b.startMinutes);

  // Fusionar sesiones continuas o solapadas
  const mergedSpans: { start: number; end: number }[] = [];
  for (const s of sorted) {
    // Clamping dentro del rango de operación (07:00 - 21:00)
    const sStart = Math.max(calStart, Math.min(calEnd, s.startMinutes));
    const sEnd = Math.max(calStart, Math.min(calEnd, s.endMinutes));
    if (sEnd <= sStart) continue;

    if (mergedSpans.length === 0) {
      mergedSpans.push({ start: sStart, end: sEnd });
    } else {
      const prev = mergedSpans[mergedSpans.length - 1];
      if (sStart <= prev.end) {
        prev.end = Math.max(prev.end, sEnd);
      } else {
        mergedSpans.push({ start: sStart, end: sEnd });
      }
    }
  }

  // Obtener intervalos libres entre spans ocupados
  const freeIntervals: TimeSlotInterval[] = [];
  let currentPointer = calStart;

  for (const span of mergedSpans) {
    if (span.start > currentPointer) {
      const dur = span.start - currentPointer;
      if (dur >= 15) { // mínimo 15 minutos para considerar intervalo útil
        freeIntervals.push({
          start: minutesToTime(currentPointer),
          end: minutesToTime(span.start),
          startMinutes: currentPointer,
          endMinutes: span.start,
          durationMinutes: dur,
          durationHours: dur / 60
        });
      }
    }
    currentPointer = Math.max(currentPointer, span.end);
  }

  if (currentPointer < calEnd) {
    const dur = calEnd - currentPointer;
    if (dur >= 15) {
      freeIntervals.push({
        start: minutesToTime(currentPointer),
        end: minutesToTime(calEnd),
        startMinutes: currentPointer,
        endMinutes: calEnd,
        durationMinutes: dur,
        durationHours: dur / 60
      });
    }
  }

  return freeIntervals;
}

/**
 * 1. Disponibilidad de un Profesor específico para un día dado
 */
export function getProfessorAvailability(
  sessions: ScheduleSession[],
  profName: string,
  day: DayName
): AvailabilityEntityResult {
  const occupied = sessions.filter(s => s.dia === day && s.profesor === profName);
  const freeIntervals = calculateFreeIntervals(occupied);

  return {
    entityName: profName,
    day,
    freeIntervals,
    occupiedSessions: occupied.sort((a, b) => a.startMinutes - b.startMinutes)
  };
}

/**
 * 2. Disponibilidad de un Aula específica para un día dado
 */
export function getClassroomAvailability(
  sessions: ScheduleSession[],
  classroom: string,
  day: DayName
): AvailabilityEntityResult {
  const occupied = sessions.filter(s => s.dia === day && s.aula === classroom);
  const freeIntervals = calculateFreeIntervals(occupied);

  return {
    entityName: classroom,
    day,
    freeIntervals,
    occupiedSessions: occupied.sort((a, b) => a.startMinutes - b.startMinutes)
  };
}

/**
 * 3. Buscar Aulas disponibles en un día y rango horario específico
 */
export function findAvailableClassrooms(
  sessions: ScheduleSession[],
  allClassrooms: string[],
  day: DayName,
  startTime: string,
  endTime: string,
  filterQuery: string = ''
): { classroom: string; isFree: boolean; conflictsWith: ScheduleSession[] }[] {
  const qStart = timeToMinutes(startTime);
  const qEnd = timeToMinutes(endTime);

  const results: { classroom: string; isFree: boolean; conflictsWith: ScheduleSession[] }[] = [];

  for (const room of allClassrooms) {
    if (room === 'Sin Aula Asignada') continue;
    if (filterQuery && !matchesSearchQuery(room, filterQuery)) continue;

    // Buscar sesiones de este aula en este día que se solapen con [qStart, qEnd]
    const conflicting = sessions.filter(s => {
      if (s.dia !== day || s.aula !== room) return false;
      return s.startMinutes < qEnd && s.endMinutes > qStart;
    });

    results.push({
      classroom: room,
      isFree: conflicting.length === 0,
      conflictsWith: conflicting
    });
  }

  // Ordenar: primero las libres, luego las ocupadas
  return results.sort((a, b) => {
    if (a.isFree && !b.isFree) return -1;
    if (!a.isFree && b.isFree) return 1;
    return a.classroom.localeCompare(b.classroom, 'es', { numeric: true });
  });
}

/**
 * 4. Buscar Profesores disponibles en un día y rango horario específico
 */
export function findAvailableProfessors(
  sessions: ScheduleSession[],
  allProfessors: string[],
  day: DayName,
  startTime: string,
  endTime: string,
  filterQuery: string = ''
): { professor: string; isFree: boolean; conflictsWith: ScheduleSession[] }[] {
  const qStart = timeToMinutes(startTime);
  const qEnd = timeToMinutes(endTime);

  const results: { professor: string; isFree: boolean; conflictsWith: ScheduleSession[] }[] = [];

  for (const prof of allProfessors) {
    if (filterQuery && !matchesSearchQuery(prof, filterQuery)) continue;

    const conflicting = sessions.filter(s => {
      if (s.dia !== day || s.profesor !== prof) return false;
      return s.startMinutes < qEnd && s.endMinutes > qStart;
    });

    results.push({
      professor: prof,
      isFree: conflicting.length === 0,
      conflictsWith: conflicting
    });
  }

  return results.sort((a, b) => {
    if (a.isFree && !b.isFree) return -1;
    if (!a.isFree && b.isFree) return 1;
    return a.professor.localeCompare(b.professor, 'es');
  });
}

/**
 * 5. Buscar por duración continua mínima (e.g. >= 1h, 1.5h, 2h, 3h)
 */
export function findByMinimumDuration(
  sessions: ScheduleSession[],
  entities: string[],
  entityType: 'aula' | 'profesor',
  day: DayName,
  minDurationMinutes: number
): DurationMatchResult[] {
  const results: DurationMatchResult[] = [];

  for (const entity of entities) {
    if (entityType === 'aula' && entity === 'Sin Aula Asignada') continue;

    const occupied = sessions.filter(s => {
      if (s.dia !== day) return false;
      return entityType === 'aula' ? s.aula === entity : s.profesor === entity;
    });

    const freeSlots = calculateFreeIntervals(occupied);

    for (const slot of freeSlots) {
      if (slot.durationMinutes >= minDurationMinutes) {
        results.push({
          entityType,
          entityName: entity,
          day,
          start: slot.start,
          end: slot.end,
          durationHours: slot.durationHours,
          durationFormatted: formatDurationHours(slot.durationMinutes)
        });
      }
    }
  }

  // Ordenar por duración descendente y luego por nombre
  return results.sort((a, b) => {
    if (b.durationHours !== a.durationHours) return b.durationHours - a.durationHours;
    return a.entityName.localeCompare(b.entityName, 'es', { numeric: true });
  });
}
