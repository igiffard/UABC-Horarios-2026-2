import React, { useState, useMemo } from 'react';
import { BookOpen, User, Building2, Users, Clock, Sparkles, Layers, Printer } from 'lucide-react';
import { ScheduleSession, DirectoryCategory } from '../types';
import { AutocompleteInput } from './AutocompleteInput';
import { WeeklyCalendar } from './WeeklyCalendar';
import { formatDurationHours } from '../utils/normalizer';

interface AsignaturaViewProps {
  sessions: ScheduleSession[];
  subjects: string[];
  onSelectSession: (session: ScheduleSession) => void;
  onOpenDirectory?: (category: DirectoryCategory) => void;
  onOpenPrintModal?: (targetType?: 'asignatura', targetName?: string) => void;
  selectedEntity?: string;
}

export const AsignaturaView: React.FC<AsignaturaViewProps> = ({
  sessions,
  subjects,
  onSelectSession,
  onOpenDirectory,
  onOpenPrintModal,
  selectedEntity
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>(selectedEntity || subjects[0] || '');
  const [filterQuery, setFilterQuery] = useState<string>('');

  React.useEffect(() => {
    if (selectedEntity) {
      setSelectedSubject(selectedEntity);
      setFilterQuery('');
    }
  }, [selectedEntity]);

  // Filter sessions for selected subject
  const subjectSessions = useMemo(() => {
    if (!selectedSubject) return [];
    return sessions.filter(s => s.asignatura === selectedSubject);
  }, [sessions, selectedSubject]);

  // Statistics for selected subject
  const stats = useMemo(() => {
    if (subjectSessions.length === 0) return null;

    const uniqueProfs = new Set(subjectSessions.map(s => s.profesor).filter(Boolean));
    const uniqueRooms = new Set(subjectSessions.map(s => s.aula).filter(a => a && a !== 'Sin Aula Asignada'));
    const uniqueGroups = new Set(subjectSessions.map(s => s.grupo).filter(g => g && g !== '-'));
    const programs = new Set(subjectSessions.map(s => s.programa).filter(Boolean));
    const sample = subjectSessions[0];

    let totalMinutes = 0;
    for (const s of subjectSessions) {
      totalMinutes += s.durationMinutes;
    }

    return {
      totalHours: formatDurationHours(totalMinutes),
      profCount: uniqueProfs.size,
      roomCount: uniqueRooms.size,
      groupCount: uniqueGroups.size,
      groupsList: Array.from(uniqueGroups),
      profsList: Array.from(uniqueProfs),
      claveUA: sample?.claveUA || '',
      programsList: Array.from(programs)
    };
  }, [subjectSessions]);

  return (
    <div className="space-y-6">
      
      {/* Search & Selection Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs search-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl flex-1">
            <AutocompleteInput
              id="search-asignatura"
              label="Buscar o Seleccionar Asignatura"
              placeholder="Escribe el nombre de la materia..."
              options={subjects}
              value={selectedSubject || filterQuery}
              onChange={(val) => {
                setFilterQuery(val);
                if (!val) setSelectedSubject('');
              }}
              onSelect={(val) => {
                setSelectedSubject(val);
                setFilterQuery('');
              }}
              icon={BookOpen}
              countBadge={subjects.length}
            />
          </div>

          {onOpenDirectory && (
            <button
              type="button"
              onClick={() => onOpenDirectory('asignaturas')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-200 shadow-2xs shrink-0 cursor-pointer h-[42px]"
            >
              <Layers className="w-4 h-4 text-cyan-700" />
              <span>Ver Lista de Asignaturas ({subjects.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Subject Summary Header */}
      {selectedSubject && stats && (
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-800 rounded-2xl p-6 text-white shadow-md border border-blue-900/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Unidad de Aprendizaje
                </span>
                {stats.claveUA && (
                  <span className="text-xs text-slate-300 font-mono">
                    Clave: {stats.claveUA}
                  </span>
                )}
                {stats.programsList.length > 0 && (
                  <span className="text-xs text-slate-300">
                    {stats.programsList.join(', ')}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold font-display tracking-tight text-white">
                {selectedSubject}
              </h2>

              <p className="text-xs text-slate-300">
                Docentes: {stats.profsList.join(' • ')}
              </p>
            </div>

            {/* Metric counters */}
            <div className="flex items-center flex-wrap gap-3">
              
              <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-[90px]">
                <div className="flex items-center justify-center gap-1 text-slate-300 text-xs mb-0.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Grupos</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">{stats.groupCount}</div>
              </div>

              <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-[90px]">
                <div className="flex items-center justify-center gap-1 text-slate-300 text-xs mb-0.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Docentes</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">{stats.profCount}</div>
              </div>

              <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-[90px]">
                <div className="flex items-center justify-center gap-1 text-slate-300 text-xs mb-0.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Aulas</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">{stats.roomCount}</div>
              </div>

              <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-[90px]">
                <div className="flex items-center justify-center gap-1 text-slate-300 text-xs mb-0.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Total Horas</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">{stats.totalHours}</div>
              </div>

              {onOpenPrintModal && (
                <button
                  type="button"
                  onClick={() => onOpenPrintModal('asignatura', selectedSubject)}
                  title="Imprimir u obtener PDF del horario de esta asignatura"
                  className="px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/30 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Materia</span>
                </button>
              )}

            </div>

          </div>
        </div>
      )}

      {/* Weekly Schedule Grid */}
      {selectedSubject ? (
        <WeeklyCalendar
          sessions={subjectSessions}
          onSelectSession={onSelectSession}
          title={`Horarios de la Asignatura: ${selectedSubject}`}
          subtitle="Se muestran todos los grupos y sesiones de esta materia"
          highlightType="asignatura"
          onOpenPrintModal={() => onOpenPrintModal?.('asignatura', selectedSubject)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Selecciona una Asignatura</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Busca cualquier unidad de aprendizaje para ver los horarios de sus grupos y salones.
          </p>
        </div>
      )}

    </div>
  );
};
