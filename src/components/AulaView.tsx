import React, { useState, useMemo } from 'react';
import { Building2, BookOpen, Clock, User, AlertTriangle, Sparkles, MapPin, Layers } from 'lucide-react';
import { ScheduleSession, DirectoryCategory } from '../types';
import { AutocompleteInput } from './AutocompleteInput';
import { WeeklyCalendar } from './WeeklyCalendar';
import { formatDurationHours } from '../utils/normalizer';

interface AulaViewProps {
  sessions: ScheduleSession[];
  classrooms: string[];
  onSelectSession: (session: ScheduleSession) => void;
  onOpenDirectory?: (category: DirectoryCategory) => void;
  selectedEntity?: string;
}

export const AulaView: React.FC<AulaViewProps> = ({
  sessions,
  classrooms,
  onSelectSession,
  onOpenDirectory,
  selectedEntity
}) => {
  const [selectedRoom, setSelectedRoom] = useState<string>(selectedEntity || classrooms[0] || '');
  const [filterQuery, setFilterQuery] = useState<string>('');

  React.useEffect(() => {
    if (selectedEntity) {
      setSelectedRoom(selectedEntity);
      setFilterQuery('');
    }
  }, [selectedEntity]);

  // Filter sessions for selected classroom
  const roomSessions = useMemo(() => {
    if (!selectedRoom) return [];
    return sessions.filter(s => s.aula === selectedRoom);
  }, [sessions, selectedRoom]);

  // Statistics for selected classroom
  const stats = useMemo(() => {
    if (roomSessions.length === 0) return null;

    const uniqueSubjects = new Set(roomSessions.map(s => s.asignatura));
    const uniqueProfs = new Set(roomSessions.map(s => s.profesor).filter(Boolean));
    const sampleWithCapacity = roomSessions.find(s => s.capacidadSalon || s.capacidad);
    const sample = sampleWithCapacity || roomSessions[0];
    
    let totalMinutes = 0;
    let conflictsCount = 0;
    let correctionsCount = 0;
    let overcapacityCount = 0;

    for (const s of roomSessions) {
      totalMinutes += s.durationMinutes;
      if (s.hasConflict) conflictsCount++;
      if (s.isCorrection) correctionsCount++;
      if (s.alertaSobrecupo) overcapacityCount++;
    }

    const weeklyCapacityMinutes = 14 * 5 * 60; // 70 hours (07:00 to 21:00 x 5 days = 4200 min)
    const occupancyRate = Math.round((totalMinutes / weeklyCapacityMinutes) * 100);

    return {
      totalHours: formatDurationHours(totalMinutes),
      subjectCount: uniqueSubjects.size,
      profCount: uniqueProfs.size,
      occupancyRate,
      edificio: sample?.edificio || '',
      capacidad: sample?.capacidadSalon || sample?.capacidad || null,
      conflictsCount,
      correctionsCount,
      overcapacityCount
    };
  }, [roomSessions]);

  return (
    <div className="space-y-6">
      
      {/* Search & Selection Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs search-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl flex-1">
            <AutocompleteInput
              id="search-aula"
              label="Buscar o Seleccionar Aula / Espacio"
              placeholder="Escribe el nombre o código del aula (ej. S1, CPB, LFQ, CCL)..."
              options={classrooms}
              value={selectedRoom || filterQuery}
              onChange={(val) => {
                setFilterQuery(val);
                if (!val) setSelectedRoom('');
              }}
              onSelect={(val) => {
                setSelectedRoom(val);
                setFilterQuery('');
              }}
              icon={Building2}
              countBadge={classrooms.length}
            />
          </div>

          {onOpenDirectory && (
            <button
              type="button"
              onClick={() => onOpenDirectory('aulas')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-200 shadow-2xs shrink-0 cursor-pointer h-[42px]"
            >
              <Layers className="w-4 h-4 text-cyan-700" />
              <span>Ver Catálogo de Aulas ({classrooms.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Classroom Summary Header */}
      {selectedRoom && stats && (
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-800 rounded-2xl p-6 text-white shadow-md border border-cyan-900/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Espacio Físico
                </span>
                {stats.edificio && (
                  <span className="text-xs text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    Edificio {stats.edificio}
                  </span>
                )}
                {stats.capacidad && (
                  <span className="text-xs text-slate-300 font-mono">
                    Capacidad: {stats.capacidad} estudiantes
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
                Aula / Espacio: {selectedRoom}
              </h2>

              <p className="text-xs text-slate-300">
                Ocupación semanal: {stats.totalHours} de 70 hrs disponibles ({stats.occupancyRate}%)
              </p>
            </div>

            {/* Metric counters */}
            <div className="flex items-center flex-wrap gap-3">
              
              <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-[100px]">
                <div className="flex items-center justify-center gap-1 text-slate-300 text-xs mb-0.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Uso Semanal</span>
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

              <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-[80px]">
                <div className="flex items-center justify-center gap-1 text-slate-300 text-xs mb-0.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Docentes</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">{stats.profCount}</div>
              </div>

              <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-center min-w-[80px]">
                <div className="flex items-center justify-center gap-1 text-slate-300 text-xs mb-0.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Capacidad</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">
                  {stats.capacidad ? `${stats.capacidad} est.` : 'Flexible'}
                </div>
              </div>

              {stats.overcapacityCount > 0 && (
                <div className="px-4 py-2.5 rounded-xl bg-amber-500/25 border border-amber-400/50 text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-200 text-xs mb-0.5 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                    <span>Sobrecupo</span>
                  </div>
                  <div className="text-lg font-bold text-amber-100 font-mono">{stats.overcapacityCount} cl.</div>
                </div>
              )}

              {stats.conflictsCount > 0 && (
                <div className="px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-center">
                  <div className="flex items-center justify-center gap-1 text-rose-300 text-xs mb-0.5 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Conflictos</span>
                  </div>
                  <div className="text-lg font-bold text-rose-200 font-mono">{stats.conflictsCount}</div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* Weekly Schedule Grid */}
      {selectedRoom ? (
        <WeeklyCalendar
          sessions={roomSessions}
          onSelectSession={onSelectSession}
          title={`Ocupación de Aula: ${selectedRoom}`}
          subtitle="Haz clic en cualquier clase para consultar detalles"
          highlightType="aula"
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Selecciona un Aula o Espacio</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Utiliza el buscador para ver las clases y horarios asignados a este salón.
          </p>
        </div>
      )}

    </div>
  );
};
