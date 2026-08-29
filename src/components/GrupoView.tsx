import React, { useState, useMemo } from 'react';
import { Users, BookOpen, User, Building2, Clock, Layers } from 'lucide-react';
import { ScheduleSession, DirectoryCategory } from '../types';
import { AutocompleteInput } from './AutocompleteInput';
import { WeeklyCalendar } from './WeeklyCalendar';
import { formatDurationHours } from '../utils/normalizer';

interface GrupoViewProps {
  sessions: ScheduleSession[];
  groups: string[];
  onSelectSession: (session: ScheduleSession) => void;
  onOpenDirectory?: (category: DirectoryCategory) => void;
  selectedEntity?: string;
}

export const GrupoView: React.FC<GrupoViewProps> = ({
  sessions,
  groups,
  onSelectSession,
  onOpenDirectory,
  selectedEntity
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>(selectedEntity || groups[0] || '');
  const [filterQuery, setFilterQuery] = useState<string>('');

  React.useEffect(() => {
    if (selectedEntity) {
      setSelectedGroup(selectedEntity);
      setFilterQuery('');
    }
  }, [selectedEntity]);

  // Filter sessions for selected group
  const groupSessions = useMemo(() => {
    if (!selectedGroup) return [];
    return sessions.filter(s => s.grupo === selectedGroup);
  }, [sessions, selectedGroup]);

  // Statistics for selected group
  const stats = useMemo(() => {
    if (groupSessions.length === 0) return null;

    const uniqueSubjects = new Set(groupSessions.map(s => s.asignatura));
    const uniqueProfs = new Set(groupSessions.map(s => s.profesor).filter(Boolean));
    const uniqueRooms = new Set(groupSessions.map(s => s.aula).filter(a => a && a !== 'Sin Aula Asignada'));
    const programs = new Set(groupSessions.map(s => s.programa).filter(Boolean));

    let totalMinutes = 0;
    let conflictsCount = 0;
    let overcapacityCount = 0;
    
    const sampleWithCupo = groupSessions.find(s => s.cupoGrupo);
    const cupoGrupo = sampleWithCupo?.cupoGrupo || null;
    const enrolledList = groupSessions.map(s => s.inscritos).filter((n): n is number => n !== undefined && n !== null);
    const avgInscritos = enrolledList.length > 0 ? Math.round(enrolledList.reduce((a, b) => a + b, 0) / enrolledList.length) : null;
    const maxInscritos = enrolledList.length > 0 ? Math.max(...enrolledList) : null;

    for (const s of groupSessions) {
      totalMinutes += s.durationMinutes;
      if (s.hasConflict) conflictsCount++;
      if (s.alertaSobrecupo) overcapacityCount++;
    }

    return {
      totalHours: formatDurationHours(totalMinutes),
      subjectCount: uniqueSubjects.size,
      profCount: uniqueProfs.size,
      roomCount: uniqueRooms.size,
      subjectsList: Array.from(uniqueSubjects),
      programsList: Array.from(programs),
      cupoGrupo,
      avgInscritos,
      maxInscritos,
      conflictsCount,
      overcapacityCount
    };
  }, [groupSessions]);

  return (
    <div className="space-y-6">
      
      {/* Search & Selection Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs search-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl flex-1">
            <AutocompleteInput
              id="search-grupo"
              label="Buscar o Seleccionar Grupo"
              placeholder="Escribe el número o código de grupo (ej. 1, 111, 201, 301, 401)..."
              options={groups}
              value={selectedGroup || filterQuery}
              onChange={(val) => {
                setFilterQuery(val);
                if (!val) setSelectedGroup('');
              }}
              onSelect={(val) => {
                setSelectedGroup(val);
                setFilterQuery('');
              }}
              icon={Users}
              countBadge={groups.length}
            />
          </div>

          {onOpenDirectory && (
            <button
              type="button"
              onClick={() => onOpenDirectory('grupos')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-200 shadow-2xs shrink-0 cursor-pointer h-[42px]"
            >
              <Layers className="w-4 h-4 text-cyan-700" />
              <span>Ver Lista de Grupos ({groups.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Group Summary Header */}
      {selectedGroup && stats && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 rounded-2xl p-6 text-white shadow-md border border-indigo-900/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Grupo de Estudiantes
                </span>
                {stats.programsList.length > 0 && (
                  <span className="text-xs text-slate-300">
                    {stats.programsList.join(' • ')}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold font-display tracking-tight text-white">
                Grupo {selectedGroup}
              </h2>

              <p className="text-xs text-slate-300 line-clamp-1">
                Materias: {stats.subjectsList.join(' • ')}
              </p>
            </div>

            {/* Metric counters */}
            <div className="flex items-center flex-wrap gap-3">
              
              <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-[90px]">
                <div className="flex items-center justify-center gap-1 text-slate-300 text-xs mb-0.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Horas Sem.</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">{stats.totalHours}</div>
              </div>

              <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-[90px]">
                <div className="flex items-center justify-center gap-1 text-slate-300 text-xs mb-0.5">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Materias</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">{stats.subjectCount}</div>
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

              {(stats.cupoGrupo || stats.avgInscritos !== null) && (
                <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-[100px]">
                  <div className="flex items-center justify-center gap-1 text-slate-300 text-xs mb-0.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Inscritos/Cupo</span>
                  </div>
                  <div className="text-lg font-bold text-white font-mono">
                    {stats.avgInscritos !== null ? stats.avgInscritos : '—'}{stats.cupoGrupo ? `/${stats.cupoGrupo}` : ''}
                  </div>
                </div>
              )}

              {stats.overcapacityCount > 0 && (
                <div className="px-4 py-2.5 rounded-xl bg-amber-500/25 border border-amber-400/50 text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-200 text-xs mb-0.5 font-semibold">
                    <Users className="w-3.5 h-3.5 text-amber-300" />
                    <span>Sobrecupo</span>
                  </div>
                  <div className="text-lg font-bold text-amber-100 font-mono">{stats.overcapacityCount} cl.</div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* Weekly Schedule Grid */}
      {selectedGroup ? (
        <WeeklyCalendar
          sessions={groupSessions}
          onSelectSession={onSelectSession}
          title={`Horario Semanal: Grupo ${selectedGroup}`}
          subtitle="Horario completo de clases y asignaciones para este grupo"
          highlightType="grupo"
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Selecciona un Grupo</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Utiliza el buscador para ver el horario completo del grupo de estudiantes.
          </p>
        </div>
      )}

    </div>
  );
};
