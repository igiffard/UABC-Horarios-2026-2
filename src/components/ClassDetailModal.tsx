import React from 'react';
import { X, Clock, MapPin, User, Users, AlertTriangle, Sparkles, GraduationCap, Compass, BookMarked } from 'lucide-react';
import { ScheduleSession } from '../types';
import { isConflictExempt } from '../utils/consolidator';

interface ClassDetailModalProps {
  session: ScheduleSession | null;
  onClose: () => void;
}

export const ClassDetailModal: React.FC<ClassDetailModalProps> = ({ session, onClose }) => {
  if (!session) return null;

  const isCampo = session.tipo?.toUpperCase() === 'P' || 
    session.tipo?.toUpperCase().startsWith('P') || 
    session.asignatura?.toUpperCase().includes('CAMPO') || 
    session.aula?.toUpperCase().includes('CAMPO');

  const isHorasInv = session.asignatura?.toUpperCase().includes('HORAS DE INVESTIGAC') || session.asignatura?.toUpperCase().trim() === 'INVESTIGACION';
  const isInvestigacionDirigida = session.tipo?.toUpperCase() === 'I' || 
    session.tipo?.toUpperCase().startsWith('I') || 
    session.asignatura?.toUpperCase().includes('INVESTIGACION DIRIGIDA');

  const isExempt = isConflictExempt(session);

  let tipoLabel = 'Clase Teórica';
  if (isCampo) tipoLabel = 'Práctica de Campo (P)';
  else if (isHorasInv) tipoLabel = 'Horas de Investigación';
  else if (isInvestigacionDirigida) tipoLabel = 'Investigación Dirigida (I)';
  else if (session.tipo === 'P') tipoLabel = 'Práctica';
  else if (session.tipo === 'T') tipoLabel = 'Taller';
  else if (session.tipo === 'L') tipoLabel = 'Laboratorio';
  else if (session.tipo === 'A') tipoLabel = 'Actividad Académica';
  else if (session.tipo === 'C') tipoLabel = 'Clase (Teórica)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 relative border-b border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md flex items-center gap-1 ${
              isCampo 
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                : isHorasInv || isInvestigacionDirigida
                ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' 
                : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
            }`}>
              {isCampo && <Compass className="w-3 h-3 text-emerald-400" />}
              {(isHorasInv || isInvestigacionDirigida) && <BookMarked className="w-3 h-3 text-indigo-400" />}
              {tipoLabel}
            </span>

            {isExempt && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                Horario Flexible / Sin Conflicto
              </span>
            )}

            {session.claveUA && (
              <span className="text-[11px] font-mono text-slate-400">
                Clave: {session.claveUA}
              </span>
            )}

            {session.isCorrection && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Actualizado por Corrección
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold font-display text-white pr-8 leading-tight">
            {session.asignatura}
          </h2>

          {session.programa && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{session.programa}</span>
            </p>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Conflict Warning if any */}
          {session.hasConflict && session.conflicts && session.conflicts.length > 0 && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2 text-xs text-rose-900 dark:text-rose-100">
              <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Choque de Horario Detectado en Horario Consolidado</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1 text-rose-800 dark:text-rose-200">
                {session.conflicts.map((conf, idx) => (
                  <li key={idx}>
                    {conf.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Correction Note if any */}
          {session.isCorrection && session.correctionNote && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-100 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold text-emerald-950 dark:text-emerald-200">Ajuste Aplicado:</strong>
                <p className="text-emerald-800 dark:text-emerald-300">{session.correctionNote}</p>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Profesor */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex items-start gap-3">
              <User className="w-4 h-4 text-cyan-700 dark:text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase block">Docente</span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">{session.profesor || 'Por Asignar'}</p>
                {session.noEmpleado && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">No. Empleado: {session.noEmpleado}</span>
                )}
              </div>
            </div>

            {/* Horario y Día */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex items-start gap-3">
              <Clock className="w-4 h-4 text-cyan-700 dark:text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase block">Día y Horario</span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">{session.dia}</p>
                <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                  {session.horaInicio} - {session.horaFin} ({session.durationMinutes / 60} h)
                </p>
              </div>
            </div>

            {/* Aula / Espacio */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex items-start gap-3">
              <MapPin className="w-4 h-4 text-cyan-700 dark:text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase block">Aula / Salón Físico</span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">{session.aula}</p>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-x-2">
                  {session.edificio && <span>Edificio {session.edificio}</span>}
                  {session.capacidadSalon && <span>Capacidad Física: {session.capacidadSalon} asientos</span>}
                </div>
              </div>
            </div>

            {/* Grupo y Subgrupo */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex items-start gap-3">
              <Users className="w-4 h-4 text-cyan-700 dark:text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase block">Grupo / Subgrupo</span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {session.grupo ? `Grupo ${session.grupo}` : 'Sin Grupo'}
                  {session.subgrupo && session.subgrupo !== '0' && session.subgrupo !== '-' ? ` (Subg. ${session.subgrupo})` : ''}
                </p>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Fuente: {session.source}</span>
              </div>
            </div>

          </div>

          {/* Dedicated Section: Capacidad de Grupos, Inscritos y Salón */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-50/60 to-slate-50 dark:from-cyan-950/40 dark:to-slate-800/80 border border-cyan-200/70 dark:border-cyan-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-950 dark:text-cyan-200 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
                <span>Capacidad y Matrícula de Alumnos</span>
              </span>
              {session.alertaSobrecupo && (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/80 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold text-[11px] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                  Alerta de Sobrecupo
                </span>
              )}
            </div>

            {/* 3 Metric Stat Cards */}
            <div className="grid grid-cols-3 gap-2">
              
              {/* Estudiantes Inscritos */}
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-cyan-100 dark:border-cyan-900/80 shadow-2xs text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Inscritos</span>
                <p className="text-lg font-black text-cyan-900 dark:text-cyan-300 leading-none my-0.5">
                  {session.inscritos !== undefined && session.inscritos !== null ? session.inscritos : '—'}
                </p>
                <span className="text-[9.5px] text-slate-500 dark:text-slate-400">
                  {session.inscritos 
                    ? 'alumnos en clase' 
                    : (session.source?.includes('Posgrado') || session.source?.includes('Base 2') || session.programa?.toUpperCase().includes('DOCTORADO') || session.programa?.toUpperCase().includes('MAESTR'))
                    ? 'Matrícula Posgrado' 
                    : 'Sin registro SUE'}
                </span>
              </div>

              {/* Cupo del Grupo */}
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-cyan-100 dark:border-cyan-900/80 shadow-2xs text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Cupo Grupo</span>
                <p className="text-lg font-black text-slate-800 dark:text-slate-100 leading-none my-0.5">
                  {session.cupoGrupo !== undefined && session.cupoGrupo !== null ? session.cupoGrupo : '—'}
                </p>
                <span className="text-[9.5px] text-slate-500 dark:text-slate-400">
                  {session.cupoGrupo ? 'plazas autorizadas' : 'Sin límite'}
                </span>
              </div>

              {/* Capacidad Salón */}
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-cyan-100 dark:border-cyan-900/80 shadow-2xs text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Capacidad Salón</span>
                <p className="text-lg font-black text-slate-800 dark:text-slate-100 leading-none my-0.5">
                  {session.capacidadSalon ?? session.capacidad ?? '—'}
                </p>
                <span className="text-[9.5px] text-slate-500 dark:text-slate-400">
                  {session.capacidadSalon ? `asientos (${session.aula})` : 'Aula flexible'}
                </span>
              </div>

            </div>

            {/* Occupancy Progress Bars */}
            <div className="space-y-2 pt-1">
              
              {/* Grupo Occupancy */}
              {session.cupoGrupo && session.inscritos !== undefined && session.inscritos !== null && (
                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mb-1">
                    <span>Ocupación de Cupo del Grupo</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {session.inscritos} de {session.cupoGrupo} ({session.porcentajeOcupacionGrupo}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        (session.porcentajeOcupacionGrupo || 0) > 100 
                          ? 'bg-rose-500' 
                          : (session.porcentajeOcupacionGrupo || 0) >= 90 
                          ? 'bg-amber-500' 
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, session.porcentajeOcupacionGrupo || 0)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Room Occupancy */}
              {session.capacidadSalon && session.inscritos !== undefined && session.inscritos !== null && (
                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mb-1">
                    <span>Ocupación Física del Salón ({session.aula})</span>
                    <span className={`font-bold ${session.alertaSobrecupo ? 'text-rose-700 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
                      {session.inscritos} de {session.capacidadSalon} asientos ({session.porcentajeOcupacionSalon}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        session.alertaSobrecupo 
                          ? 'bg-rose-600 animate-pulse' 
                          : (session.porcentajeOcupacionSalon || 0) >= 85 
                          ? 'bg-amber-500' 
                          : 'bg-cyan-600'
                      }`}
                      style={{ width: `${Math.min(100, session.porcentajeOcupacionSalon || 0)}%` }}
                    />
                  </div>
                  {session.alertaSobrecupo && (
                    <p className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>Excede la capacidad de asientos en {session.inscritos - session.capacidadSalon} alumnos.</span>
                    </p>
                  )}
                </div>
              )}

              {/* Sub-breakdown if available */}
              {(session.cargaInscritos !== undefined && session.cargaInscritos !== null || session.subastaInscritos !== undefined && session.subastaInscritos !== null) && (
                <div className="text-[10.5px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3 pt-1 border-t border-cyan-100/60 dark:border-cyan-900/60">
                  {session.cargaInscritos !== null && session.cargaInscritos !== undefined && (
                    <span>Carga Regular: <strong>{session.cargaInscritos}</strong></span>
                  )}
                  {session.evalInscritos !== null && session.evalInscritos !== undefined && (
                    <span>Evaluación: <strong>{session.evalInscritos}</strong></span>
                  )}
                  {session.subastaInscritos !== null && session.subastaInscritos !== undefined && session.subastaInscritos > 0 && (
                    <span>Subasta: <strong>{session.subastaInscritos}</strong></span>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-cyan-700 hover:bg-slate-800 dark:hover:bg-cyan-600 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
