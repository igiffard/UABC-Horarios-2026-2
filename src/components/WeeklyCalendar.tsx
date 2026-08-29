import React, { useState } from 'react';
import { AlertTriangle, Sparkles, MapPin, User, Users, Compass, BookMarked, FlaskConical } from 'lucide-react';
import { ScheduleSession, DayName, CalendarDisplayOptions, DEFAULT_DISPLAY_OPTIONS } from '../types';
import { CONFIG } from '../config';
import { getSubjectColorScheme } from '../utils/colors';
import { isActivityOrResearchSession } from '../utils/normalizer';
import { CalendarDisplayControls } from './CalendarDisplayControls';

interface WeeklyCalendarProps {
  sessions: ScheduleSession[];
  onSelectSession: (session: ScheduleSession) => void;
  title?: string;
  subtitle?: string;
  highlightType?: 'profesor' | 'aula' | 'asignatura' | 'grupo';
  displayOptions?: CalendarDisplayOptions;
  onChangeDisplayOptions?: (options: CalendarDisplayOptions) => void;
  showDisplayControls?: boolean;
  onOpenPrintModal?: () => void;
}

const START_MINUTES = CONFIG.CALENDAR.START_MINUTES; // 420 (07:00)
const END_MINUTES = CONFIG.CALENDAR.END_MINUTES;     // 1260 (21:00)
const TOTAL_MINUTES = CONFIG.CALENDAR.TOTAL_MINUTES; // 840 (14 hours)
const DAYS = CONFIG.CALENDAR.DAYS;

// Generate hour marks from 07:00 to 21:00
const HOURS = Array.from({ length: 15 }, (_, i) => {
  const h = 7 + i;
  return `${h.toString().padStart(2, '0')}:00`;
});

interface CalendarPositionedSession {
  session: ScheduleSession;
  topPct: number;
  heightPct: number;
  colIndex: number;
  totalCols: number;
}

/**
 * Calcula la distribución en sub-columnas para eventos que se traslapan en el mismo día y hora,
 * permitiendo que prácticas de campo, investigaciones dirigidas y clases simultáneas
 * se muestren en la misma celda ocupando un espacio proporcional sin encimarse.
 */
function computeDayLayout(daySessions: ScheduleSession[]): CalendarPositionedSession[] {
  if (daySessions.length === 0) return [];

  // Filtrar y calcular límites normalizados
  const items = daySessions.map(s => {
    const start = Math.max(START_MINUTES, Math.min(END_MINUTES, s.startMinutes));
    const end = Math.max(START_MINUTES, Math.min(END_MINUTES, s.endMinutes));
    const duration = Math.max(25, end - start);
    const topPct = ((start - START_MINUTES) / TOTAL_MINUTES) * 100;
    const heightPct = (duration / TOTAL_MINUTES) * 100;
    return {
      session: s,
      start,
      end,
      duration,
      topPct,
      heightPct
    };
  });

  // Ordenar por hora de inicio ascendente y duración descendente
  items.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return b.duration - a.duration;
  });

  // Agrupar en clusters continuos de traslape
  const clusters: (typeof items)[] = [];
  let currentCluster: typeof items = [];
  let clusterEnd = -1;

  for (const item of items) {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      clusterEnd = item.end;
    } else {
      if (item.start < clusterEnd) {
        currentCluster.push(item);
        clusterEnd = Math.max(clusterEnd, item.end);
      } else {
        clusters.push(currentCluster);
        currentCluster = [item];
        clusterEnd = item.end;
      }
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // Asignar sub-columnas (greedy column coloring)
  const results: CalendarPositionedSession[] = [];

  for (const cluster of clusters) {
    const columnEnds: number[] = [];
    const clusterPlacements: { item: typeof items[0]; colIndex: number }[] = [];

    for (const item of cluster) {
      let placedCol = -1;
      for (let c = 0; c < columnEnds.length; c++) {
        if (columnEnds[c] <= item.start) {
          placedCol = c;
          columnEnds[c] = item.end;
          break;
        }
      }
      if (placedCol === -1) {
        placedCol = columnEnds.length;
        columnEnds.push(item.end);
      }
      clusterPlacements.push({ item, colIndex: placedCol });
    }

    const totalCols = Math.max(1, columnEnds.length);

    for (const p of clusterPlacements) {
      results.push({
        session: p.item.session,
        topPct: p.item.topPct,
        heightPct: p.item.heightPct,
        colIndex: p.colIndex,
        totalCols
      });
    }
  }

  return results;
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  sessions,
  onSelectSession,
  title,
  subtitle,
  highlightType = 'profesor',
  displayOptions: externalOptions,
  onChangeDisplayOptions,
  showDisplayControls = true,
  onOpenPrintModal
}) => {
  const [internalOptions, setInternalOptions] = useState<CalendarDisplayOptions>(DEFAULT_DISPLAY_OPTIONS);
  const options = externalOptions || internalOptions;

  const handleOptionsChange = (newOpts: CalendarDisplayOptions) => {
    if (onChangeDisplayOptions) {
      onChangeDisplayOptions(newOpts);
    } else {
      setInternalOptions(newOpts);
    }
  };

  const [selectedMobileDay, setSelectedMobileDay] = useState<DayName>('Lunes');

  // Filter sessions that fall on Lunes..Viernes
  const validSessions = sessions.filter(s => DAYS.includes(s.dia as typeof DAYS[number]));

  // Filter based on showActivities option (Investigación, Tutorías, Gestión, etc.)
  const activeSessions = validSessions.filter(s => {
    if (!options.showActivities && isActivityOrResearchSession(s)) {
      return false;
    }
    return true;
  });

  const hiddenActivitiesCount = validSessions.length - activeSessions.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Calendar Header / Title bar */}
      {(title || subtitle) && (
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            {title && <h3 className="text-base font-bold text-slate-900 font-display">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
          </div>

          <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block"></span>
              07:00 a 21:00 hrs
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <span>{activeSessions.length} sesiones</span>
              {hiddenActivitiesCount > 0 && (
                <span className="text-[11px] font-medium text-purple-800 bg-purple-100/80 px-2 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                  <FlaskConical className="w-3 h-3 text-purple-600" />
                  <span>{hiddenActivitiesCount} act. ocultas</span>
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Display Options Toolbar (aSc Style vs Modern, and Field Visibility Toggles) */}
      {showDisplayControls && (
        <CalendarDisplayControls
          options={options}
          onChangeOptions={handleOptionsChange}
          onOpenPrintModal={onOpenPrintModal}
        />
      )}

      {/* Mobile Day Selector (Visible on small screens) */}
      <div className="md:hidden flex items-center justify-around bg-slate-100 p-1.5 border-b border-slate-200">
        {DAYS.map((day) => {
          const count = activeSessions.filter(s => s.dia === day).length;
          const isSelected = selectedMobileDay === day;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedMobileDay(day)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{day.slice(0, 3)}</span>
              {count > 0 && (
                <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-cyan-800 text-cyan-200' : 'bg-slate-200 text-slate-700'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid Container */}
      <div className="relative overflow-x-auto">
        <div className="min-w-[640px] md:min-w-full">
          
          {/* Day Column Headers (Desktop) */}
          <div className="grid grid-cols-[65px_repeat(5,1fr)] bg-slate-100/90 border-b border-slate-300 text-xs font-bold text-slate-800 uppercase tracking-wider sticky top-0 z-20">
            <div className="p-3 text-center text-slate-500 border-r border-slate-300 font-mono">Hora</div>
            {DAYS.map((day) => {
              const dayCount = activeSessions.filter(s => s.dia === day).length;
              return (
                <div key={day} className="p-3 text-center border-r border-slate-300 last:border-r-0 flex items-center justify-center gap-1.5">
                  <span className="font-bold text-slate-900">{day}</span>
                  {dayCount > 0 && (
                    <span className="text-[10px] font-semibold bg-cyan-100 text-cyan-900 px-1.5 py-0.2 rounded-full border border-cyan-200">
                      {dayCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Time & Events Area */}
          <div className="grid grid-cols-[65px_repeat(5,1fr)] relative" style={{ height: '980px' }}>
            
            {/* Time Labels Column */}
            <div className="border-r border-slate-300 bg-slate-50 relative select-none">
              {HOURS.map((hour, idx) => (
                <div
                  key={hour}
                  className="absolute w-full text-right pr-2 text-[10px] sm:text-[11px] font-bold text-slate-600 font-mono"
                  style={{ top: `${(idx / 14) * 100}%`, transform: 'translateY(-50%)' }}
                >
                  {hour}
                </div>
              ))}
            </div>

            {/* Background Grid Lines across all 5 day columns */}
            <div className="absolute inset-0 left-[65px] pointer-events-none grid grid-rows-14">
              {Array.from({ length: 14 }).map((_, idx) => (
                <div key={idx} className="border-b border-slate-200 w-full relative">
                  {/* 30-min subtle line */}
                  <div className="absolute top-1/2 left-0 right-0 border-b border-slate-100 border-dashed"></div>
                </div>
              ))}
            </div>

            {/* 5 Day Columns with Event Blocks */}
            {DAYS.map((day) => {
              const daySessions = activeSessions.filter(s => s.dia === day);
              const positioned = computeDayLayout(daySessions);

              return (
                <div
                  key={day}
                  className="border-r border-slate-300 last:border-r-0 relative h-full p-0.5"
                >
                  {positioned.map((pos) => {
                    const session = pos.session;
                    const color = getSubjectColorScheme(session.asignatura);
                    
                    const leftPct = (pos.colIndex / pos.totalCols) * 100;
                    const widthPct = (1 / pos.totalCols) * 100;

                    const style: React.CSSProperties = {
                      top: `${pos.topPct}%`,
                      height: `calc(${pos.heightPct}% - 2px)`,
                      left: `calc(${leftPct}% + 1px)`,
                      width: `calc(${widthPct}% - 2px)`
                    };

                    const isCompact = pos.totalCols >= 2;
                    const isUltraCompact = pos.totalCols >= 3;

                    const isPracticaCampo = (
                      session.tipo?.toUpperCase() === 'P' ||
                      session.tipo?.toUpperCase().startsWith('P') ||
                      session.asignatura?.toUpperCase().includes('CAMPO') ||
                      session.aula?.toUpperCase().includes('CAMPO')
                    );

                    const isInvestigacion = (
                      session.tipo?.toUpperCase() === 'I' ||
                      session.tipo?.toUpperCase().startsWith('I') ||
                      session.asignatura?.toUpperCase().includes('INVESTIGACION') ||
                      session.asignatura?.toUpperCase().includes('INVESTIGACIÓN')
                    );

                    const isActivity = isActivityOrResearchSession(session);

                    const isAscMode = options.viewMode === 'asc';

                    return (
                      <div
                        key={session.id}
                        onClick={() => onSelectSession(session)}
                        style={style}
                        title={`Click para ver detalles:\n${session.asignatura}\n${session.profesor}\n${session.aula} (${session.horaInicio} - ${session.horaFin})${isPracticaCampo ? '\n[Práctica de Campo (P)]' : ''}${isActivity ? '\n[Horas de Investigación / Actividad Académica]' : ''}`}
                        className={`absolute cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg hover:z-30 overflow-hidden ${
                          isAscMode
                            ? `bg-white border-2 ${isActivity ? 'border-purple-600 bg-purple-50/30' : 'border-slate-700'} text-slate-900 rounded-lg ${isCompact ? 'p-1' : 'p-2'} shadow-2xs`
                            : `rounded-xl ${isCompact ? 'p-1.5' : 'p-2'} border ${color.bg} ${color.border} ${color.text}`
                        } ${
                          session.hasConflict ? 'ring-2 ring-rose-500 ring-offset-1 bg-rose-50/95 !border-rose-600' : ''
                        }`}
                      >
                        {/* aSc Format Corner Layout (Room at Top-Right, Subgroup at Top-Left) */}
                        {isAscMode ? (
                          <div className="h-full flex flex-col justify-between relative">
                            
                            {/* Top row: Time / Subgroup / Type / Enrollment / Room code in corner */}
                            <div className="flex items-start justify-between gap-1 leading-none mb-0.5">
                              
                              <div className="flex items-center gap-1 flex-wrap">
                                {options.showTime && (
                                  <span className={`font-mono font-bold text-slate-700 bg-slate-100 px-1 py-0.2 rounded border border-slate-300 ${isUltraCompact ? 'text-[7.5px]' : 'text-[8.5px]'}`}>
                                    {session.horaInicio}-{session.horaFin}
                                  </span>
                                )}

                                {options.showGroup && session.subgrupo && (
                                  <span className="font-bold text-[8px] px-1 py-0.2 rounded bg-slate-200 text-slate-800 border border-slate-300">
                                    {session.subgrupo}
                                  </span>
                                )}

                                {options.showType && isPracticaCampo && (
                                  <span title="Práctica de Campo (P)" className="px-1 py-0.2 rounded bg-emerald-100 text-emerald-900 font-bold text-[8px] border border-emerald-300">
                                    P
                                  </span>
                                )}

                                {options.showType && isActivity && !isPracticaCampo && (
                                  <span title="Horas de Investigación / Actividad Académica" className="px-1 py-0.2 rounded bg-purple-100 text-purple-900 font-bold text-[8px] border border-purple-300 flex items-center gap-0.5">
                                    <FlaskConical className="w-2.5 h-2.5 text-purple-700" />
                                    {!isUltraCompact && <span>Act</span>}
                                  </span>
                                )}

                                {options.showCapacity && session.inscritos !== undefined && session.inscritos !== null && !isUltraCompact && (
                                  <span 
                                    title={`Inscritos: ${session.inscritos} alumnos | Cupo Grupo: ${session.cupoGrupo ?? 'N/A'}${session.capacidadSalon ? ` | Capacidad Salón: ${session.capacidadSalon}` : ''}`} 
                                    className={`px-1 py-0.2 rounded font-bold text-[7.5px] border ${
                                      session.alertaSobrecupo
                                        ? 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse'
                                        : 'bg-cyan-50 text-cyan-900 border-cyan-200'
                                    }`}
                                  >
                                    👤 {session.inscritos}{session.cupoGrupo ? `/${session.cupoGrupo}` : ''}
                                  </span>
                                )}
                              </div>

                              {/* Classroom in corner (Like aSc official schedule) with room capacity */}
                              {options.showRoom && session.aula && (
                                <span 
                                  title={`Salón: ${session.aula}${session.capacidadSalon ? ` (Capacidad: ${session.capacidadSalon} asientos)` : ''}`}
                                  className={`font-mono font-extrabold text-slate-900 bg-slate-100 px-1 py-0.2 rounded border border-slate-400 shrink-0 ${isUltraCompact ? 'text-[8px]' : 'text-[9.5px]'}`}
                                >
                                  {session.aula}
                                  {options.showCapacity && session.capacidadSalon ? (
                                    <span className="font-sans font-normal text-[7.5px] text-slate-600 ml-0.5">
                                      ({session.capacidadSalon})
                                    </span>
                                  ) : null}
                                </span>
                              )}
                            </div>

                            {/* Center Subject Name */}
                            <div className="my-auto py-0.5 text-center">
                              <h4 className={`font-bold leading-tight line-clamp-2 text-slate-950 ${isUltraCompact ? 'text-[8.5px]' : isCompact ? 'text-[9.5px]' : 'text-[11px]'}`}>
                                {session.asignatura}
                              </h4>

                              {/* Teacher below subject */}
                              {options.showTeacher && session.profesor && (
                                <p className={`font-medium text-slate-700 truncate mt-0.5 ${isUltraCompact ? 'text-[7.5px]' : 'text-[9px]'}`}>
                                  {session.profesor}
                                </p>
                              )}
                            </div>

                            {/* Bottom row: Group or Correction Badges & Overcapacity Warning */}
                            <div className="flex items-center justify-between gap-1 leading-none mt-0.5 pt-0.5 border-t border-slate-100">
                              {options.showGroup && session.grupo && session.grupo !== '-' ? (
                                <span className="text-[8px] font-semibold text-slate-600">
                                  G.{session.grupo}
                                </span>
                              ) : <span></span>}

                              <div className="flex items-center gap-0.5">
                                {session.alertaSobrecupo && (
                                  <span title={`⚠️ Sobrecupo: ${session.inscritos} alumnos inscritos superan la capacidad física de ${session.capacidadSalon} del salón`} className="px-1 py-0.2 rounded bg-amber-100 text-amber-900 font-bold text-[7.5px] border border-amber-300">
                                    ⚠️ Sobrecupo
                                  </span>
                                )}
                                {session.isCorrection && (
                                  <span title="Ajustado por corrección" className="p-0.5 rounded bg-emerald-100 text-emerald-800">
                                    <Sparkles className="w-2.5 h-2.5" />
                                  </span>
                                )}
                                {session.hasConflict && (
                                  <span title="Conflicto detectado" className="p-0.5 rounded bg-rose-100 text-rose-800">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                  </span>
                                )}
                              </div>
                            </div>

                          </div>
                        ) : (
                          /* Modern Color View Mode */
                          <div className="h-full flex flex-col justify-between">
                            <div>
                              {/* Top Badges: Time & Indicators */}
                              <div className="flex items-center justify-between gap-1 mb-1 leading-none">
                                {options.showTime ? (
                                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded bg-white/90 border border-black/5 shrink-0 shadow-2xs ${isUltraCompact ? 'text-[8px]' : 'text-[9px]'}`}>
                                    {session.horaInicio} - {session.horaFin}
                                  </span>
                                ) : <span></span>}

                                <div className="flex items-center gap-0.5 shrink-0">
                                  {options.showType && isPracticaCampo && (
                                    <span title="Práctica de Campo (P)" className="p-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[8px] flex items-center gap-0.5 px-1">
                                      <Compass className="w-2.5 h-2.5 text-emerald-700 shrink-0" />
                                      {!isUltraCompact && <span>P</span>}
                                    </span>
                                  )}
                                  {options.showType && isActivity && !isPracticaCampo && (
                                    <span title="Horas de Investigación / Actividad Académica" className="p-0.5 rounded bg-purple-100 text-purple-900 font-bold text-[8px] flex items-center gap-0.5 px-1">
                                      <FlaskConical className="w-2.5 h-2.5 text-purple-700 shrink-0" />
                                      {!isUltraCompact && <span>Act</span>}
                                    </span>
                                  )}
                                  {session.isCorrection && (
                                    <span title="Ajustado por corrección" className="p-0.5 rounded bg-emerald-100 text-emerald-700">
                                      <Sparkles className="w-2.5 h-2.5" />
                                    </span>
                                  )}
                                  {session.alertaSobrecupo && (
                                    <span title={`⚠️ Sobrecupo: ${session.inscritos} alumnos > Cap. ${session.capacidadSalon}`} className="px-1 py-0.2 rounded bg-amber-200 text-amber-950 font-bold text-[8px]">
                                      ⚠️
                                    </span>
                                  )}
                                  {session.hasConflict && (
                                    <span title="Choque de horario detectado" className="p-0.5 rounded bg-rose-100 text-rose-700 animate-pulse">
                                      <AlertTriangle className="w-2.5 h-2.5" />
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Subject Title */}
                              <h4 className={`font-bold leading-tight line-clamp-2 ${isUltraCompact ? 'text-[9px]' : isCompact ? 'text-[10px]' : 'text-xs'}`}>
                                {session.asignatura}
                              </h4>

                              {/* Teacher */}
                              {options.showTeacher && highlightType !== 'profesor' && session.profesor && (
                                <p className={`font-medium text-slate-700 truncate mt-0.5 flex items-center gap-1 ${isUltraCompact ? 'text-[8px]' : 'text-[10px]'}`}>
                                  <User className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                                  <span>{session.profesor}</span>
                                </p>
                              )}

                              {/* Classroom with capacity */}
                              {options.showRoom && highlightType !== 'aula' && session.aula && (
                                <p className={`font-semibold text-cyan-800 truncate mt-0.5 flex items-center gap-1 ${isUltraCompact ? 'text-[8px]' : 'text-[10px]'}`}>
                                  <MapPin className="w-2.5 h-2.5 shrink-0 text-cyan-600" />
                                  <span>
                                    {session.aula}
                                    {options.showCapacity && session.capacidadSalon ? (
                                      <span className="font-normal text-slate-600 text-[9px] ml-1">
                                        (Cap. {session.capacidadSalon})
                                      </span>
                                    ) : null}
                                  </span>
                                </p>
                              )}
                            </div>

                            {/* Group badge and Enrollment info */}
                            <div className="mt-1 flex items-center justify-between gap-1 flex-wrap">
                              {options.showGroup && session.grupo && session.grupo !== '-' && !isUltraCompact && (
                                <span className="text-[9px] font-medium px-1 py-0.2 rounded bg-white/70 border border-black/5 text-slate-700 inline-flex items-center gap-0.5">
                                  <Users className="w-2 h-2 text-slate-400" />
                                  G.{session.grupo}
                                </span>
                              )}

                              {options.showCapacity && session.inscritos !== undefined && session.inscritos !== null && !isUltraCompact && (
                                <span className={`text-[8.5px] font-semibold px-1 py-0.2 rounded border inline-flex items-center gap-0.5 ${
                                  session.alertaSobrecupo
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : 'bg-white/80 text-slate-800 border-black/5'
                                }`}>
                                  👥 {session.inscritos}{session.cupoGrupo ? `/${session.cupoGrupo}` : ''} est.
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              );
            })}

          </div>

        </div>
      </div>

    </div>
  );
};


