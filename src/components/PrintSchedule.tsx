import React, { useMemo } from 'react';
import { ScheduleSession, PrintOptions, DEFAULT_PRINT_OPTIONS } from '../types';
import { CONFIG } from '../config';
import { isActivityOrResearchSession, formatDurationHours } from '../utils/normalizer';
import { getSubjectColorScheme } from '../utils/colors';

export interface PrintScheduleProps {
  viewTitle: string;
  viewSubtitle?: string;
  sessions: ScheduleSession[];
  lastLoadedAt: Date;
  printOptions?: PrintOptions;
  isPreview?: boolean;
}

const DAYS = CONFIG.CALENDAR.DAYS;
const HOURS = Array.from({ length: 15 }, (_, i) => {
  const h = 7 + i;
  return `${h.toString().padStart(2, '0')}:00`;
});

export const PrintSchedule = React.forwardRef<HTMLDivElement, PrintScheduleProps>(({
  viewTitle,
  viewSubtitle,
  sessions,
  lastLoadedAt,
  printOptions = DEFAULT_PRINT_OPTIONS,
  isPreview = false
}, ref) => {
  const now = new Date();
  const printTimestamp = now.toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  // Filter sessions based on options (e.g. showActivities)
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      if (!printOptions.showActivities && isActivityOrResearchSession(s)) {
        return false;
      }
      return true;
    });
  }, [sessions, printOptions.showActivities]);

  // Compute summary stats
  const stats = useMemo(() => {
    let totalMinutes = 0;
    let teachingMinutes = 0;
    let activityMinutes = 0;
    const uniqueSubjects = new Set<string>();
    const uniqueRooms = new Set<string>();
    const uniqueGroups = new Set<string>();

    for (const s of filteredSessions) {
      totalMinutes += s.durationMinutes;
      if (isActivityOrResearchSession(s)) {
        activityMinutes += s.durationMinutes;
      } else {
        teachingMinutes += s.durationMinutes;
      }
      if (s.asignatura) uniqueSubjects.add(s.asignatura);
      if (s.aula && s.aula !== 'Sin Aula Asignada') uniqueRooms.add(s.aula);
      if (s.grupo && s.grupo !== '-') uniqueGroups.add(s.grupo);
    }

    return {
      totalHours: formatDurationHours(totalMinutes),
      teachingHours: formatDurationHours(teachingMinutes),
      activityHours: formatDurationHours(activityMinutes),
      subjectsCount: uniqueSubjects.size,
      roomsCount: uniqueRooms.size,
      groupsCount: uniqueGroups.size,
      sessionsCount: filteredSessions.length,
    };
  }, [filteredSessions]);

  // Group detailed subjects for the table summary
  const detailedSubjects = useMemo(() => {
    const map = new Map<string, {
      claveUA: string;
      asignatura: string;
      tipo: string;
      grupo: string;
      profesor: string;
      aulas: Set<string>;
      schedules: string[];
      totalMinutes: number;
      cupo: number | null;
      inscritos: number | null;
      isActivity: boolean;
    }>();

    for (const s of filteredSessions) {
      const key = `${s.asignatura}__${s.grupo}__${s.profesor}__${s.tipo}`;
      if (!map.has(key)) {
        map.set(key, {
          claveUA: s.claveUA || '',
          asignatura: s.asignatura || 'Sin Asignatura',
          tipo: s.tipo || 'C',
          grupo: s.grupo || '-',
          profesor: s.profesor || '',
          aulas: new Set(),
          schedules: [],
          totalMinutes: 0,
          cupo: s.cupoGrupo ?? s.capacidad ?? null,
          inscritos: s.inscritos ?? null,
          isActivity: isActivityOrResearchSession(s)
        });
      }

      const entry = map.get(key)!;
      if (s.aula && s.aula !== 'Sin Aula Asignada') entry.aulas.add(s.aula);
      entry.schedules.push(`${s.dia.slice(0, 3)} ${s.horaInicio}-${s.horaFin}`);
      entry.totalMinutes += s.durationMinutes;
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.isActivity !== b.isActivity) return a.isActivity ? 1 : -1;
      return a.asignatura.localeCompare(b.asignatura);
    });
  }, [filteredSessions]);

  const fontSizeClass = {
    compact: 'text-[9px]',
    standard: 'text-[10.5px]',
    large: 'text-[12px]'
  }[printOptions.fontSize] || 'text-[10.5px]';

  const isSinglePage = printOptions.fitToSinglePage !== false && printOptions.layout === 'matrix';
  const isLandscape = printOptions.paperOrientation !== 'portrait';
  const orientationWidthClass = isLandscape ? 'max-w-5xl' : 'max-w-3xl';

  const containerClasses = isPreview
    ? `bg-white text-slate-900 ${isSinglePage ? 'p-4 sm:p-5' : 'p-6 sm:p-8'} font-sans shadow-2xl border border-slate-300 rounded-2xl w-full ${orientationWidthClass} mx-auto transition-all ${fontSizeClass}`
    : `hidden print:block print-only print-container ${isSinglePage ? 'single-page-sheet p-2' : 'p-4'} bg-white text-black font-sans ${fontSizeClass}`;

  return (
    <div
      ref={ref}
      id={isPreview ? 'print-schedule-preview' : 'print-schedule-container'}
      data-print-sheet="true"
      className={containerClasses}
    >
      
      {/* Header for print */}
      <div className={`border-b-2 border-slate-900 ${isSinglePage ? 'pb-1.5 mb-2' : 'pb-2.5 mb-3'} flex items-start justify-between`}>
        <div>
          <div className={`${isSinglePage ? 'text-[9.5px]' : 'text-[11px]'} font-bold tracking-wider text-slate-600 uppercase`}>
            Universidad Autónoma de Baja California • Facultad de Ciencias Marinas
          </div>
          <h1 className={`${isSinglePage ? 'text-base' : 'text-lg'} font-black tracking-tight text-slate-950 font-serif leading-tight mt-0.5`}>
            {CONFIG.APP_TITLE} — Semestre 2026-2
          </h1>
          <div className={`${isSinglePage ? 'text-sm' : 'text-base'} font-bold text-slate-900 mt-0.5 flex items-center gap-2`}>
            <span>{viewTitle}</span>
          </div>
          {viewSubtitle && (
            <p className={`${isSinglePage ? 'text-[9.5px]' : 'text-[11px]'} text-slate-600 font-medium`}>{viewSubtitle}</p>
          )}
        </div>

        <div className={`text-right ${isSinglePage ? 'text-[8.5px] space-y-0.2' : 'text-[10px] space-y-0.5'} text-slate-600`}>
          <div><strong className="text-slate-900">Emisión:</strong> {printTimestamp}</div>
          <div className="text-emerald-700 font-bold">● Horario Oficial (07:00 a 21:00 h • L-V)</div>
          <div><strong className="text-slate-900">Folio:</strong> FCM-2026-2-{filteredSessions.length}S {isSinglePage ? '(1 Hoja)' : ''}</div>
        </div>
      </div>

      {/* Summary Statistics Bar (Optional) */}
      {printOptions.showStats && (
        <div className={`${isSinglePage ? 'mb-2 px-2.5 py-1 text-[9px]' : 'mb-3 px-3 py-1.5 text-[10.5px]'} bg-slate-100/90 border border-slate-300 rounded flex items-center justify-between text-slate-800 font-medium`}>
          <div className={`flex items-center ${isSinglePage ? 'gap-3' : 'gap-4'}`}>
            <span><strong>Carga Total:</strong> {stats.totalHours} ({stats.sessionsCount} sesiones)</span>
            <span><strong>Docencia:</strong> {stats.teachingHours}</span>
            {stats.activityHours !== '0.0 h' && (
              <span><strong>Investigación/Actividades:</strong> {stats.activityHours}</span>
            )}
          </div>
          <div className={`flex items-center ${isSinglePage ? 'gap-3' : 'gap-4'} text-slate-600`}>
            <span><strong>Asignaturas:</strong> {stats.subjectsCount}</span>
            <span><strong>Grupos:</strong> {stats.groupsCount}</span>
            <span><strong>Aulas:</strong> {stats.roomsCount}</span>
          </div>
        </div>
      )}

      {/* 1. WEEKLY MATRIX VIEW (If layout is 'matrix' or 'full') */}
      {(printOptions.layout === 'matrix' || printOptions.layout === 'full') && (
        <div className={isSinglePage ? 'mb-2' : 'mb-4'}>
          <table className={`w-full border-collapse border-2 border-slate-700 ${isSinglePage ? 'text-[8.5px]' : 'text-[10px]'} table-fixed`}>
            <thead>
              <tr className={`bg-slate-200/90 text-slate-900 border-b-2 border-slate-700 ${isSinglePage ? 'h-6' : ''}`}>
                <th className={`border border-slate-400 ${isSinglePage ? 'p-0.5 w-12 text-[8.5px]' : 'p-1 w-14 text-[9.5px]'} text-center font-bold font-mono`}>Hora</th>
                {DAYS.map(day => (
                  <th key={day} className={`border border-slate-400 ${isSinglePage ? 'p-0.5 text-[8.5px]' : 'p-1 text-[9.5px]'} text-center font-bold uppercase tracking-wider`}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.slice(0, -1).map((hour, hIdx) => {
                const hStart = (7 + hIdx) * 60;
                const hEnd = (8 + hIdx) * 60;

                return (
                  <tr key={hour} className={isSinglePage ? 'h-[25px] min-h-[25px] max-h-[25px]' : 'min-h-[34px]'}>
                    <td className={`border border-slate-300 ${isSinglePage ? 'p-0.5 text-[8px]' : 'p-1 text-[9.5px]'} text-center font-mono font-bold bg-slate-100/80`}>
                      {hour}
                    </td>
                    {DAYS.map(day => {
                      const slotSessions = filteredSessions.filter(s => {
                        if (s.dia !== day) return false;
                        return s.startMinutes < hEnd && s.endMinutes > hStart;
                      });

                      return (
                        <td key={day} className={`border border-slate-300 p-0.5 align-top bg-white ${isSinglePage ? 'h-[25px]' : 'h-8'}`}>
                          {slotSessions.map(s => {
                            const isActivity = isActivityOrResearchSession(s);
                            const color = getSubjectColorScheme(s.asignatura);

                            let cardClass = `${isSinglePage ? 'mb-0.5 p-0.5 rounded text-[8px]' : 'mb-0.5 p-1 rounded text-[9px]'} border leading-tight `;
                            if (printOptions.colorMode === 'grayscale') {
                              cardClass += isActivity ? "bg-slate-200 border-slate-400 text-slate-950 font-medium" : "bg-slate-50 border-slate-400 text-slate-900";
                            } else if (printOptions.colorMode === 'contrast') {
                              cardClass += "bg-white border-2 border-slate-900 text-black";
                            } else {
                              // Subtle color
                              cardClass += isActivity 
                                ? "bg-purple-50 border-purple-300 text-purple-950" 
                                : `${color.bg} ${color.border} ${color.text}`;
                            }

                            return (
                              <div key={s.id} className={cardClass}>
                                <div className={`font-bold truncate ${isSinglePage ? 'text-[8px]' : 'text-[9px]'}`} title={s.asignatura}>
                                  {s.asignatura}
                                </div>
                                <div className={`${isSinglePage ? 'text-[7px]' : 'text-[8px]'} flex items-center justify-between mt-0.2 opacity-90 leading-none`}>
                                  <span>{s.horaInicio}-{s.horaFin}</span>
                                  <span className="font-semibold">{s.aula || 'S/A'} {s.grupo && s.grupo !== '-' ? `(G.${s.grupo})` : ''}</span>
                                </div>
                                {s.profesor && (
                                  <div className={`${isSinglePage ? 'text-[7px]' : 'text-[8px]'} truncate opacity-85 mt-0.2 leading-none`}>{s.profesor}</div>
                                )}
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. DETAILED TABLE SUMMARY (If layout is 'table' or 'full') */}
      {(printOptions.layout === 'table' || printOptions.layout === 'full') && (
        <div className={`mb-4 page-break-avoid ${printOptions.layout === 'full' ? 'mt-4' : ''}`}>
          <div className="text-xs font-bold text-slate-900 mb-1.5 uppercase tracking-wider flex items-center justify-between border-b border-slate-400 pb-1">
            <span>Desglose de Carga y Asignaturas</span>
            <span className="text-[10px] font-normal text-slate-600">{detailedSubjects.length} asignaturas registradas</span>
          </div>

          <table className="w-full border-collapse border border-slate-400 text-[9.5px]">
            <thead>
              <tr className="bg-slate-100 text-slate-900">
                <th className="border border-slate-400 p-1 text-center w-12 font-bold">Clave</th>
                <th className="border border-slate-400 p-1 text-left font-bold">Asignatura / Actividad</th>
                <th className="border border-slate-400 p-1 text-center w-10 font-bold">Tipo</th>
                <th className="border border-slate-400 p-1 text-center w-12 font-bold">Grupo</th>
                <th className="border border-slate-400 p-1 text-left font-bold">Horario Semanal</th>
                <th className="border border-slate-400 p-1 text-center w-16 font-bold">Aula(s)</th>
                <th className="border border-slate-400 p-1 text-center w-12 font-bold">Hrs/Sem</th>
                {printOptions.showRoomCapacity && (
                  <th className="border border-slate-400 p-1 text-center w-14 font-bold">Cupo/Alum</th>
                )}
                <th className="border border-slate-400 p-1 text-left font-bold">Profesor</th>
              </tr>
            </thead>
            <tbody>
              {detailedSubjects.map((sub, idx) => {
                const hrs = (sub.totalMinutes / 60).toFixed(1);
                const aulasList = Array.from(sub.aulas).join(', ') || 'Sin Aula';
                const schedulesStr = sub.schedules.join(', ');

                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-300 p-1 text-center font-mono font-bold text-slate-700">{sub.claveUA || '-'}</td>
                    <td className="border border-slate-300 p-1 font-semibold text-slate-900">
                      {sub.asignatura}
                      {sub.isActivity && (
                        <span className="ml-1 text-[8px] font-bold px-1 py-0.2 bg-purple-100 text-purple-900 border border-purple-300 rounded">
                          Actividad
                        </span>
                      )}
                    </td>
                    <td className="border border-slate-300 p-1 text-center font-bold text-slate-800">{sub.tipo}</td>
                    <td className="border border-slate-300 p-1 text-center font-mono font-bold text-slate-800">{sub.grupo}</td>
                    <td className="border border-slate-300 p-1 text-slate-700">{schedulesStr}</td>
                    <td className="border border-slate-300 p-1 text-center font-semibold text-slate-800">{aulasList}</td>
                    <td className="border border-slate-300 p-1 text-center font-bold text-slate-900">{hrs} h</td>
                    {printOptions.showRoomCapacity && (
                      <td className="border border-slate-300 p-1 text-center text-slate-600">
                        {sub.cupo ? `${sub.inscritos ?? '-'}/${sub.cupo}` : (sub.inscritos ? `${sub.inscritos}` : '-')}
                      </td>
                    )}
                    <td className="border border-slate-300 p-1 text-slate-800 truncate max-w-[140px]">{sub.profesor || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. SIGNATURES SECTION (If showSignatures is true) */}
      {printOptions.showSignatures && (
        <div className={`${isSinglePage ? 'mt-2 pt-1.5' : 'mt-6 pt-3'} page-break-avoid`}>
          {!isSinglePage && (
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-6 text-center">
              Validación y Firmas de Conformidad
            </div>
          )}
          <div className={`grid grid-cols-3 ${isSinglePage ? 'gap-4 text-[8.5px]' : 'gap-6 text-[10px]'} text-center`}>
            <div className="border-t border-slate-700 pt-1">
              <div className="font-bold text-slate-900 uppercase truncate">{printOptions.signerTeacher}</div>
              <div className="text-slate-500 text-[8px]">Firma de Enterado / Docente</div>
            </div>
            <div className="border-t border-slate-700 pt-1">
              <div className="font-bold text-slate-900 uppercase truncate">{printOptions.signerCoord}</div>
              <div className="text-slate-500 text-[8px]">Vo.Bo. Coordinación de Carrera</div>
            </div>
            <div className="border-t border-slate-700 pt-1">
              <div className="font-bold text-slate-900 uppercase truncate">{printOptions.signerDirector}</div>
              <div className="text-slate-500 text-[8px]">Vo.Bo. Dirección FCM - UABC</div>
            </div>
          </div>
        </div>
      )}

      {/* 4. FOOTER & NOTES */}
      <div className={`${isSinglePage ? 'mt-2 pt-1 text-[8px]' : 'mt-4 pt-2 text-[9px]'} border-t border-slate-300 flex items-center justify-between text-slate-500 page-break-avoid leading-none`}>
        <div>
          {printOptions.includeNotes && printOptions.customNotes && (
            <p className="italic text-slate-700 mb-0.5">Nota: {printOptions.customNotes}</p>
          )}
          <span>Facultad de Ciencias Marinas • UABC — Horario Oficial de 07:00 a 21:00 h (Lunes a Viernes).</span>
        </div>
        <div className="text-right font-bold text-slate-700">
          <span>Página 1 de 1</span>
        </div>
      </div>

    </div>
  );
});

PrintSchedule.displayName = 'PrintSchedule';
