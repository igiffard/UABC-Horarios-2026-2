import React, { useState, useMemo } from 'react';
import { User, BookOpen, Clock, Building2, AlertTriangle, Sparkles, Layers, Printer } from 'lucide-react';
import { ScheduleSession, DirectoryCategory } from '../types';
import { AutocompleteInput } from './AutocompleteInput';
import { WeeklyCalendar } from './WeeklyCalendar';
import { formatDurationHours } from '../utils/normalizer';

interface ProfesorViewProps {
  sessions: ScheduleSession[];
  professors: string[];
  onSelectSession: (session: ScheduleSession) => void;
  onOpenDirectory?: (category: DirectoryCategory) => void;
  onOpenPrintModal?: (targetType?: 'profesor', targetName?: string) => void;
  selectedEntity?: string;
}

export const ProfesorView: React.FC<ProfesorViewProps> = ({
  sessions,
  professors,
  onSelectSession,
  onOpenDirectory,
  onOpenPrintModal,
  selectedEntity
}) => {
  const [selectedProf, setSelectedProf] = useState<string>(selectedEntity || professors[0] || '');
  const [filterQuery, setFilterQuery] = useState<string>('');

  React.useEffect(() => {
    if (selectedEntity) {
      setSelectedProf(selectedEntity);
      setFilterQuery('');
    }
  }, [selectedEntity]);

  // Filter sessions for selected professor
  const profSessions = useMemo(() => {
    if (!selectedProf) return [];
    return sessions.filter(s => s.profesor === selectedProf);
  }, [sessions, selectedProf]);

  // Statistics for selected professor
  const stats = useMemo(() => {
    if (profSessions.length === 0) return null;

    const uniqueSubjects = new Set(profSessions.map(s => s.asignatura));
    const uniqueRooms = new Set(profSessions.map(s => s.aula).filter(a => a && a !== 'Sin Aula Asignada'));
    const uniqueGroups = new Set(profSessions.map(s => s.grupo).filter(g => g && g !== '-'));
    
    let totalMinutes = 0;
    let conflictsCount = 0;
    let correctionsCount = 0;

    for (const s of profSessions) {
      totalMinutes += s.durationMinutes;
      if (s.hasConflict) conflictsCount++;
      if (s.isCorrection) correctionsCount++;
    }

    const noEmpleado = profSessions.find(s => s.noEmpleado)?.noEmpleado || '';

    return {
      totalHours: formatDurationHours(totalMinutes),
      subjectCount: uniqueSubjects.size,
      roomCount: uniqueRooms.size,
      groupCount: uniqueGroups.size,
      subjectsList: Array.from(uniqueSubjects),
      conflictsCount,
      correctionsCount,
      noEmpleado
    };
  }, [profSessions]);

  return (
    <div className="space-y-6">
      
      {/* Search & Selection Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs search-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl flex-1">
            <AutocompleteInput
              id="search-profesor"
              label="Buscar o Seleccionar Profesor"
              placeholder="Escribe el nombre o apellido del docente..."
              options={professors}
              value={selectedProf || filterQuery}
              onChange={(val) => {
                setFilterQuery(val);
                if (!val) setSelectedProf('');
              }}
              onSelect={(val) => {
                setSelectedProf(val);
                setFilterQuery('');
              }}
              icon={User}
              countBadge={professors.length}
            />
          </div>

          {onOpenDirectory && (
            <button
              type="button"
              onClick={() => onOpenDirectory('profesores')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-200 shadow-2xs shrink-0 cursor-pointer h-[42px]"
            >
              <Layers className="w-4 h-4 text-cyan-700" />
              <span>Ver Lista de Profesores ({professors.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Professor Summary Header */}
      {selectedProf && stats && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 rounded-2xl p-6 text-white shadow-md border border-slate-700/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Horario Docente
                </span>
                {stats.noEmpleado && (
                  <span className="text-xs text-slate-400 font-mono">
                    No. Empleado: {stats.noEmpleado}
                  </span>
                )}
                {stats.correctionsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {stats.correctionsCount} {stats.correctionsCount === 1 ? 'ajuste aplicado' : 'ajustes aplicados'}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold font-display tracking-tight text-white">
                {selectedProf}
              </h2>

              <p className="text-xs text-slate-300 line-clamp-1">
                Materias: {stats.subjectsList.join(' • ')}
              </p>
            </div>

            {/* Metric counters */}
            <div className="flex items-center flex-wrap gap-3">
              
              <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-[100px]">
                <div className="flex items-center justify-center gap-1 text-slate-300 text-xs mb-0.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Carga Semanal</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">{stats.totalHours}</div>
              </div>

              <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-[90px]">
                <div className="flex items-center justify-center gap-1 text-slate-300 text-xs mb-0.5">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Asignaturas</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">{stats.subjectCount}</div>
              </div>

              <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-[80px]">
                <div className="flex items-center justify-center gap-1 text-slate-300 text-xs mb-0.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Espacios</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">{stats.roomCount}</div>
              </div>

              {stats.conflictsCount > 0 && (
                <div className="px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-center">
                  <div className="flex items-center justify-center gap-1 text-rose-300 text-xs mb-0.5 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Conflictos</span>
                  </div>
                  <div className="text-lg font-bold text-rose-200 font-mono">{stats.conflictsCount}</div>
                </div>
              )}

              {onOpenPrintModal && (
                <button
                  type="button"
                  onClick={() => onOpenPrintModal('profesor', selectedProf)}
                  title="Imprimir o exportar ficha oficial de este docente"
                  className="px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/30 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Ficha</span>
                </button>
              )}

            </div>

          </div>
        </div>
      )}

      {/* Weekly Schedule Grid */}
      {selectedProf ? (
        <WeeklyCalendar
          sessions={profSessions}
          onSelectSession={onSelectSession}
          title={`Horario Semanal: ${selectedProf}`}
          subtitle="Haz clic en cualquier bloque para ver detalles completos de la sesión"
          highlightType="profesor"
          onOpenPrintModal={() => onOpenPrintModal?.('profesor', selectedProf)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Selecciona un Profesor</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Utiliza el buscador superior para consultar el horario semanal del docente.
          </p>
        </div>
      )}

    </div>
  );
};
