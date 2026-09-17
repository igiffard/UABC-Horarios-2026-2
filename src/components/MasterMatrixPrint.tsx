import React, { useMemo } from 'react';
import { ScheduleSession, DayName } from '../types';
import { CONFIG } from '../config';
import { getSubjectColorScheme } from '../utils/colors';
import { isActivityOrResearchSession } from '../utils/normalizer';

export interface MasterMatrixPrintProps {
  type: 'aula' | 'grupo' | 'profesor';
  entities: string[];
  sessions: ScheduleSession[];
  day: DayName;
  printTimestamp?: string;
  showActivities?: boolean;
  filterMode?: 'all' | 'main' | 'active';
  isPreview?: boolean;
}

const HOURS = Array.from({ length: 14 }, (_, i) => {
  const h = 7 + i;
  return {
    label: `${h.toString().padStart(2, '0')}:00`,
    shortLabel: `${h}:00`,
    startMinutes: h * 60,
    endMinutes: (h + 1) * 60
  };
});

export const MasterMatrixPrint = React.forwardRef<HTMLDivElement, MasterMatrixPrintProps>(({
  type,
  entities,
  sessions,
  day,
  printTimestamp,
  showActivities = false,
  filterMode = 'active',
  isPreview = false
}, ref) => {
  const currentTimestamp = printTimestamp || new Date().toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  // Filter day sessions
  const daySessions = useMemo(() => {
    return sessions.filter(s => {
      if (s.dia !== day) return false;
      if (!showActivities && isActivityOrResearchSession(s)) return false;
      return true;
    });
  }, [sessions, day, showActivities]);

  // Determine active entities and sort them logically
  const displayEntities = useMemo(() => {
    // Collect entities that have sessions on this day
    const activeOnDay = new Set<string>();
    daySessions.forEach(s => {
      const val = type === 'aula' ? s.aula : type === 'grupo' ? s.grupo : s.profesor;
      if (val && val !== 'Sin Aula Asignada' && val !== '-') {
        activeOnDay.add(val);
      }
    });

    let list = entities.filter(e => e && e !== 'Sin Aula Asignada' && e !== '-');

    if (filterMode === 'active') {
      list = list.filter(e => activeOnDay.has(e));
    } else if (filterMode === 'main' && type === 'aula') {
      // Main classrooms priority
      const mainNames = ['S1', 'S2', 'S3', 'S5', 'S6', 'S7', 'S8', 'SA', 'SB', 'SC', 'SG', 'SGP', 'CCL', 'CAI', 'AM1', 'AM2', 'ESP', 'PT', 'AF1', 'AF2', 'AF3'];
      list = list.filter(e => mainNames.includes(e) || activeOnDay.has(e));
    }

    return list.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [entities, daySessions, type, filterMode]);

  // Pre-index sessions by entity and hour
  const gridMap = useMemo(() => {
    const map = new Map<string, Map<number, ScheduleSession[]>>();

    displayEntities.forEach(ent => {
      const hourMap = new Map<number, ScheduleSession[]>();
      HOURS.forEach(h => hourMap.set(h.startMinutes, []));
      map.set(ent, hourMap);
    });

    daySessions.forEach(s => {
      const entKey = type === 'aula' ? s.aula : type === 'grupo' ? s.grupo : s.profesor;
      const hourMap = map.get(entKey);
      if (!hourMap) return;

      HOURS.forEach(h => {
        if (s.startMinutes < h.endMinutes && s.endMinutes > h.startMinutes) {
          hourMap.get(h.startMinutes)?.push(s);
        }
      });
    });

    return map;
  }, [displayEntities, daySessions, type]);

  // Overall stats for this day
  const stats = useMemo(() => {
    const occupiedSlots = displayEntities.reduce((acc, ent) => {
      const hourMap = gridMap.get(ent);
      if (!hourMap) return acc;
      let count = 0;
      hourMap.forEach(sessList => {
        if (sessList.length > 0) count++;
      });
      return acc + count;
    }, 0);

    const totalPossibleSlots = displayEntities.length * HOURS.length;
    const occupancyRate = totalPossibleSlots > 0 ? Math.round((occupiedSlots / totalPossibleSlots) * 100) : 0;

    return {
      entitiesCount: displayEntities.length,
      sessionsCount: daySessions.length,
      occupiedSlots,
      occupancyRate
    };
  }, [displayEntities, daySessions, gridMap]);

  const typeTitle = {
    aula: 'AULAS Y LABORATORIOS',
    grupo: 'GRUPOS ESTUDIANTILES',
    profesor: 'DOCENTES Y PROFESORES'
  }[type];

  const containerClasses = isPreview
    ? 'bg-white text-slate-900 p-4 sm:p-5 font-sans shadow-2xl border border-slate-300 rounded-2xl w-full max-w-6xl mx-auto'
    : 'hidden print:block print-only print-container single-page-sheet p-2 bg-white text-black font-sans';

  return (
    <div
      ref={ref}
      id="master-matrix-sheet"
      data-print-sheet="true"
      className={containerClasses}
    >
      {/* Official Institutional Header */}
      <div className="border-b-2 border-slate-900 pb-1.5 mb-2 flex items-start justify-between">
        <div>
          <div className="text-[9px] font-bold tracking-wider text-slate-600 uppercase">
            Universidad Autónoma de Baja California • Facultad de Ciencias Marinas
          </div>
          <h1 className="text-base font-black tracking-tight text-slate-950 font-serif leading-tight mt-0.5">
            SÁBANA GENERAL DE OCUPACIÓN DE {typeTitle} — DÍA {day.toUpperCase()}
          </h1>
          <div className="text-xs font-bold text-slate-900 flex items-center gap-3 mt-0.5">
            <span className="text-cyan-800">Semestre 2026-2</span>
            <span>•</span>
            <span className="text-slate-700">{stats.entitiesCount} {type === 'aula' ? 'Espacios' : type === 'grupo' ? 'Grupos' : 'Docentes'}</span>
            <span>•</span>
            <span className="text-emerald-800 font-bold">{stats.sessionsCount} Clases Programadas</span>
            <span>•</span>
            <span className="text-slate-600 font-mono">Ocupación Promedio: {stats.occupancyRate}%</span>
          </div>
        </div>

        <div className="text-right text-[8.5px] text-slate-600 space-y-0.2">
          <div><strong className="text-slate-900">Emisión:</strong> {currentTimestamp}</div>
          <div className="text-emerald-700 font-bold">● Formato Concentrado 1 Hoja (7:00 a 21:00 h)</div>
          <div><strong className="text-slate-900">Folio:</strong> FCM-SABANA-{day.slice(0, 3).toUpperCase()}-2026-2</div>
        </div>
      </div>

      {/* Main Sábana Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border-2 border-slate-700 text-[8px] table-fixed">
          <thead>
            <tr className="bg-slate-200/95 text-slate-900 border-b-2 border-slate-700">
              <th className="border border-slate-400 p-0.5 w-16 text-center font-bold font-mono uppercase bg-slate-300/80">
                {type === 'aula' ? 'Aula' : type === 'grupo' ? 'Grupo' : 'Profesor'}
              </th>
              {HOURS.map(h => (
                <th key={h.startMinutes} className="border border-slate-400 p-0.5 text-center font-mono font-bold">
                  {h.shortLabel}
                </th>
              ))}
              <th className="border border-slate-400 p-0.5 w-10 text-center font-bold font-mono bg-slate-300/80">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {displayEntities.map((entityName, idx) => {
              const hourMap = gridMap.get(entityName);
              let totalEntityHours = 0;

              return (
                <tr
                  key={entityName}
                  className={`h-[18px] max-h-[19px] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                >
                  {/* Row Label (Aula name, Group, or Teacher) */}
                  <td className="border border-slate-300 p-0.5 text-center font-bold font-mono bg-slate-100/90 text-slate-900 truncate">
                    <span title={entityName}>{entityName}</span>
                  </td>

                  {/* 14 Hourly Blocks */}
                  {HOURS.map(h => {
                    const sessList = hourMap?.get(h.startMinutes) || [];
                    if (sessList.length > 0) totalEntityHours++;

                    return (
                      <td
                        key={h.startMinutes}
                        className={`border border-slate-200 p-0.2 text-[7.5px] align-middle text-center overflow-hidden ${
                          sessList.length > 0 ? 'bg-cyan-50/80' : ''
                        }`}
                      >
                        {sessList.map((s, sIdx) => {
                          const colors = getSubjectColorScheme(s.asignatura);
                          const displayText = type === 'aula'
                            ? `${s.asignatura.slice(0, 10)}${s.grupo !== '-' ? ` (${s.grupo})` : ''}`
                            : type === 'grupo'
                            ? `${s.asignatura.slice(0, 10)}${s.aula !== 'Sin Aula Asignada' ? ` [${s.aula}]` : ''}`
                            : `${s.asignatura.slice(0, 8)}${s.aula !== 'Sin Aula Asignada' ? ` [${s.aula}]` : ''}`;

                          return (
                            <div
                              key={sIdx}
                              title={`${s.asignatura} | G.${s.grupo} | Aula: ${s.aula} | Prof: ${s.profesor} (${s.horaInicio}-${s.horaFin})`}
                              className={`truncate leading-tight px-0.5 py-0.2 rounded font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
                            >
                              {displayText}
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}

                  {/* Total Hours for this Entity */}
                  <td className="border border-slate-300 p-0.5 text-center font-mono font-bold text-slate-800 bg-slate-100/70">
                    {totalEntityHours > 0 ? `${totalEntityHours}h` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Notes */}
      <div className="mt-2 pt-1 border-t border-slate-300 flex items-center justify-between text-[8px] text-slate-500">
        <div>
          <span>UABC • Facultad de Ciencias Marinas • Subdirección Académica</span>
          <span className="mx-2">|</span>
          <span>Matriz Maestra de Planificación y Asignación de Espacios</span>
        </div>
        <div>
          <span>Mostrando {displayEntities.length} registros para el día <strong>{day}</strong></span>
        </div>
      </div>
    </div>
  );
});

MasterMatrixPrint.displayName = 'MasterMatrixPrint';
