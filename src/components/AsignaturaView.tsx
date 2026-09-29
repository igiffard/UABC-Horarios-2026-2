import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  User, 
  Building2, 
  Users, 
  Clock, 
  Sparkles, 
  Layers, 
  Printer, 
  GraduationCap, 
  Award,
  Filter,
  CheckCircle2
} from 'lucide-react';
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

export type SubjectLevel = 'ALL' | 'LICENCIATURA' | 'POSGRADO';

export const AsignaturaView: React.FC<AsignaturaViewProps> = ({
  sessions,
  subjects,
  onSelectSession,
  onOpenDirectory,
  onOpenPrintModal,
  selectedEntity
}) => {
  const [levelFilter, setLevelFilter] = useState<SubjectLevel>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>(selectedEntity || subjects[0] || '');
  const [filterQuery, setFilterQuery] = useState<string>('');

  // Map each subject to its educational level (Licenciatura vs Posgrado)
  const subjectLevelMap = useMemo(() => {
    const map = new Map<string, 'licenciatura' | 'posgrado'>();

    for (const sub of subjects) {
      const matchingSessions = sessions.filter(s => s.asignatura === sub);
      if (matchingSessions.length === 0) {
        map.set(sub, 'licenciatura');
        continue;
      }

      const isPos = matchingSessions.some(s => {
        const src = (s.source || '').toUpperCase();
        const prog = (s.programa || '').toUpperCase();
        const car = (s.carrera || '').toUpperCase();
        const grp = (s.grupo || '').trim().toUpperCase();

        return (
          src.includes('BASE 2') ||
          src.includes('POSGRADO') ||
          prog.includes('MAESTR') ||
          prog.includes('DOCTOR') ||
          prog.includes('POSGRADO') ||
          prog.includes('ESPECIALIDAD') ||
          car.includes('MAESTR') ||
          car.includes('DOCTOR') ||
          car.includes('POSGRADO') ||
          car.includes('ESPECIALIDAD') ||
          grp.startsWith('P') ||
          grp.startsWith('M') ||
          grp.startsWith('D') ||
          grp.match(/^9\d{2}/)
        );
      });

      map.set(sub, isPos ? 'posgrado' : 'licenciatura');
    }

    return map;
  }, [subjects, sessions]);

  // Split subjects into Licenciatura and Posgrado lists
  const { licenciaturaSubjects, posgradoSubjects } = useMemo(() => {
    const lic: string[] = [];
    const pos: string[] = [];

    for (const sub of subjects) {
      if (subjectLevelMap.get(sub) === 'posgrado') {
        pos.push(sub);
      } else {
        lic.push(sub);
      }
    }

    return {
      licenciaturaSubjects: lic,
      posgradoSubjects: pos
    };
  }, [subjects, subjectLevelMap]);

  // Active filtered subjects according to selected level button
  const activeSubjectsList = useMemo(() => {
    if (levelFilter === 'LICENCIATURA') return licenciaturaSubjects;
    if (levelFilter === 'POSGRADO') return posgradoSubjects;
    return subjects;
  }, [levelFilter, licenciaturaSubjects, posgradoSubjects, subjects]);

  // Handle level button click
  const handleSelectLevel = (level: SubjectLevel) => {
    setLevelFilter(level);
    setFilterQuery('');

    // If current selected subject does not match the chosen level, switch to the first available in that level
    if (level === 'LICENCIATURA') {
      const currentLevel = subjectLevelMap.get(selectedSubject);
      if (currentLevel !== 'licenciatura' && licenciaturaSubjects.length > 0) {
        setSelectedSubject(licenciaturaSubjects[0]);
      }
    } else if (level === 'POSGRADO') {
      const currentLevel = subjectLevelMap.get(selectedSubject);
      if (currentLevel !== 'posgrado' && posgradoSubjects.length > 0) {
        setSelectedSubject(posgradoSubjects[0]);
      }
    }
  };

  React.useEffect(() => {
    if (selectedEntity) {
      setSelectedSubject(selectedEntity);
      setFilterQuery('');
      // Auto-detect and align level filter with selected subject
      const level = subjectLevelMap.get(selectedEntity);
      if (level === 'posgrado' && levelFilter === 'LICENCIATURA') {
        setLevelFilter('ALL');
      } else if (level === 'licenciatura' && levelFilter === 'POSGRADO') {
        setLevelFilter('ALL');
      }
    }
  }, [selectedEntity, subjectLevelMap]);

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

    const currentLevel = subjectLevelMap.get(selectedSubject) || 'licenciatura';

    return {
      totalHours: formatDurationHours(totalMinutes),
      profCount: uniqueProfs.size,
      roomCount: uniqueRooms.size,
      groupCount: uniqueGroups.size,
      groupsList: Array.from(uniqueGroups),
      profsList: Array.from(uniqueProfs),
      claveUA: sample?.claveUA || '',
      programsList: Array.from(programs),
      level: currentLevel
    };
  }, [subjectSessions, selectedSubject, subjectLevelMap]);

  return (
    <div className="space-y-6">
      
      {/* Botones de Diferenciación: Licenciatura vs Posgrado */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-900 text-blue-300 flex items-center justify-center shrink-0">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <span>Diferenciar Nivel Académico</span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-mono px-2 py-0.2 rounded-full font-bold">
                    {subjects.length} materias totales
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Filtra rápidamente entre materias de carreras de Licenciatura y programas de Posgrado (Maestría y Doctorado).
                </p>
              </div>
            </div>
          </div>

          {/* Segmented Filter Buttons */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl gap-1 shrink-0 flex-wrap sm:flex-nowrap">
            
            {/* Botón: Todas */}
            <button
              type="button"
              onClick={() => handleSelectLevel('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                levelFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>Todas</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                levelFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {subjects.length}
              </span>
            </button>

            {/* Botón: Licenciatura */}
            <button
              type="button"
              onClick={() => handleSelectLevel('LICENCIATURA')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                levelFilter === 'LICENCIATURA'
                  ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/20 ring-2 ring-cyan-500/40'
                  : 'text-cyan-900 hover:text-cyan-950 hover:bg-cyan-50'
              }`}
            >
              <GraduationCap className={`w-4 h-4 ${levelFilter === 'LICENCIATURA' ? 'text-white' : 'text-cyan-700'}`} />
              <span>Licenciatura</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                levelFilter === 'LICENCIATURA' ? 'bg-white/25 text-white' : 'bg-cyan-100 text-cyan-800'
              }`}>
                {licenciaturaSubjects.length}
              </span>
            </button>

            {/* Botón: Posgrado */}
            <button
              type="button"
              onClick={() => handleSelectLevel('POSGRADO')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                levelFilter === 'POSGRADO'
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20 ring-2 ring-purple-500/40'
                  : 'text-purple-900 hover:text-purple-950 hover:bg-purple-50'
              }`}
            >
              <Award className={`w-4 h-4 ${levelFilter === 'POSGRADO' ? 'text-white' : 'text-purple-700'}`} />
              <span>Posgrado</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                levelFilter === 'POSGRADO' ? 'bg-white/25 text-white' : 'bg-purple-100 text-purple-800'
              }`}>
                {posgradoSubjects.length}
              </span>
            </button>

          </div>
        </div>

        {/* Quick-switch chips for current level */}
        <div className="pt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-500 shrink-0">
            {levelFilter === 'LICENCIATURA' 
              ? 'Materias de Licenciatura:' 
              : levelFilter === 'POSGRADO' 
              ? 'Materias de Posgrado:' 
              : 'Materias Frecuentes:'}
          </span>
          {activeSubjectsList.slice(0, 8).map(sub => {
            const isSelected = selectedSubject === sub;
            const isPos = subjectLevelMap.get(sub) === 'posgrado';
            return (
              <button
                key={sub}
                type="button"
                onClick={() => {
                  setSelectedSubject(sub);
                  setFilterQuery('');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer truncate max-w-xs ${
                  isSelected
                    ? isPos 
                      ? 'bg-purple-700 text-white shadow-xs' 
                      : 'bg-cyan-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title={sub}
              >
                {sub}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Selection Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs search-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl flex-1">
            <AutocompleteInput
              id="search-asignatura"
              label={
                levelFilter === 'LICENCIATURA' 
                  ? "Buscar Asignatura de Licenciatura" 
                  : levelFilter === 'POSGRADO' 
                  ? "Buscar Asignatura de Posgrado (Maestría y Doctorado)" 
                  : "Buscar o Seleccionar Asignatura"
              }
              placeholder={
                levelFilter === 'LICENCIATURA' 
                  ? `Buscar entre las ${licenciaturaSubjects.length} materias de licenciatura (ej. Oceanografía, Ecología, Cálculo)...` 
                  : levelFilter === 'POSGRADO' 
                  ? `Buscar entre las ${posgradoSubjects.length} materias de posgrado (ej. Seminario, Tópicos, Métodos)...` 
                  : "Escribe el nombre de la materia o clave UA..."
              }
              options={activeSubjectsList}
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
              countBadge={activeSubjectsList.length}
            />
          </div>

          {onOpenDirectory && (
            <button
              type="button"
              onClick={() => onOpenDirectory('asignaturas')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-200 shadow-2xs shrink-0 cursor-pointer h-[42px]"
            >
              <Layers className="w-4 h-4 text-cyan-700" />
              <span>Ver Catálogo General ({subjects.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Subject Summary Header */}
      {selectedSubject && stats && (
        <div className={`rounded-2xl p-6 text-white shadow-md border ${
          stats.level === 'posgrado'
            ? 'bg-gradient-to-r from-slate-900 via-purple-950 to-slate-800 border-purple-900/50'
            : 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-800 border-blue-900/50'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                
                {/* Educational Level Badge */}
                {stats.level === 'posgrado' ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/25 text-purple-200 border border-purple-400/40 flex items-center gap-1.5 shadow-xs">
                    <Award className="w-3.5 h-3.5 text-purple-300" />
                    <span>Posgrado (Maestría / Doctorado)</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 flex items-center gap-1.5 shadow-xs">
                    <GraduationCap className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Licenciatura</span>
                  </span>
                )}

                {stats.claveUA && (
                  <span className="text-xs text-slate-300 font-mono bg-white/10 px-2 py-0.5 rounded">
                    Clave UA: {stats.claveUA}
                  </span>
                )}

                {stats.programsList.length > 0 && (
                  <span className="text-xs text-slate-200 font-medium bg-white/10 px-2 py-0.5 rounded">
                    {stats.programsList.join(' • ')}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2 flex-wrap">
                <span>{selectedSubject}</span>
              </h2>

              <p className="text-xs text-slate-300">
                Docentes a cargo: {stats.profsList.join(' • ')}
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
          subtitle={`Nivel: ${stats?.level === 'posgrado' ? 'Posgrado (Maestría / Doctorado)' : 'Licenciatura'} • Se muestran todos los grupos y sesiones de esta materia`}
          highlightType="asignatura"
          onOpenPrintModal={() => onOpenPrintModal?.('asignatura', selectedSubject)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Selecciona una Asignatura</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {levelFilter === 'LICENCIATURA' 
              ? 'Busca cualquier unidad de aprendizaje de Licenciatura para ver los horarios de sus grupos y salones.'
              : levelFilter === 'POSGRADO'
              ? 'Busca cualquier unidad de aprendizaje de Posgrado para ver los horarios de sus grupos y salones.'
              : 'Busca cualquier unidad de aprendizaje para ver los horarios de sus grupos y salones.'}
          </p>
        </div>
      )}

    </div>
  );
};
