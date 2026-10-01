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
  CheckCircle2,
  FlaskConical,
  Wrench,
  Compass,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar,
  ListFilter,
  Check
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
export type ActivityFilterType = 'ALL' | 'C' | 'T' | 'L' | 'P';

/**
 * Normaliza y clasifica el tipo de actividad docente de una sesión
 * C = Clase Teórica, T = Taller, L = Laboratorio, P = Práctica / Práctica de Campo
 */
export function getSessionActivityType(session: ScheduleSession): 'C' | 'T' | 'L' | 'P' | 'A' {
  const t = (session.tipo || '').toUpperCase().trim();
  if (t === 'C' || t === 'CLASE' || t === 'TEORIA' || t === 'TEÓRICA') return 'C';
  if (t === 'T' || t === 'TALLER') return 'T';
  if (t === 'L' || t === 'LAB' || t === 'LABORATORIO') return 'L';
  if (t === 'P' || t === 'PRACTICA' || t === 'PRÁCTICA' || t === 'CAMPO' || t.startsWith('P')) return 'P';
  if (t === 'A' || t === 'ACTIVIDAD') return 'A';

  // Heurísticas complementarias basadas en nombre de materia y salón
  const asig = (session.asignatura || '').toUpperCase();
  const room = (session.aula || '').toUpperCase();
  if (asig.includes('LABORATORIO') || room.startsWith('L') || room === 'LBQ' || room === 'LQO' || room === 'LFQ' || room === 'LMB' || room === 'LZ') {
    return 'L';
  }
  if (asig.includes('TALLER')) return 'T';
  if (asig.includes('PRACTICA') || asig.includes('CAMPO')) return 'P';
  
  return 'C';
}

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
  const [activityFilter, setActivityFilter] = useState<ActivityFilterType>('ALL');
  const [showGroupBreakdown, setShowGroupBreakdown] = useState<boolean>(true);

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
      setActivityFilter('ALL');
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

  // Reset activity filter when switching subjects
  React.useEffect(() => {
    setActivityFilter('ALL');
  }, [selectedSubject]);

  // Detailed activity breakdown: Clase (C), Taller (T), Laboratorio (L), Práctica (P)
  const activityStats = useMemo(() => {
    if (subjectSessions.length === 0) return null;

    const cSessions: ScheduleSession[] = [];
    const tSessions: ScheduleSession[] = [];
    const lSessions: ScheduleSession[] = [];
    const pSessions: ScheduleSession[] = [];

    for (const s of subjectSessions) {
      const actType = getSessionActivityType(s);
      if (actType === 'C') cSessions.push(s);
      else if (actType === 'T') tSessions.push(s);
      else if (actType === 'L') lSessions.push(s);
      else if (actType === 'P') pSessions.push(s);
      else cSessions.push(s);
    }

    const buildCategoryStats = (
      code: 'C' | 'T' | 'L' | 'P',
      name: string,
      shortLabel: string,
      actSessions: ScheduleSession[]
    ) => {
      let totalMinutes = 0;
      const groupSet = new Set<string>();
      const subgroupSet = new Set<string>();
      const roomsSet = new Set<string>();
      const teachersSet = new Set<string>();
      const groupSubgroupDurationMap = new Map<string, Map<string, number>>();

      for (const s of actSessions) {
        totalMinutes += s.durationMinutes || 0;
        const g = (s.grupo || '').trim() || '-';
        const sub = (s.subgrupo || '0').trim();
        if (g !== '-') groupSet.add(g);
        subgroupSet.add(`${g}-${sub}`);
        if (s.aula && s.aula !== 'Sin Aula Asignada') roomsSet.add(s.aula);
        if (s.profesor) teachersSet.add(s.profesor);

        if (!groupSubgroupDurationMap.has(g)) {
          groupSubgroupDurationMap.set(g, new Map<string, number>());
        }
        const subMap = groupSubgroupDurationMap.get(g)!;
        subMap.set(sub, (subMap.get(sub) || 0) + (s.durationMinutes || 0));
      }

      // Horas que un alumno cursa en esta modalidad por grupo
      // Para Clase (C): generalmente subgrupo 0, el grupo completo toma todas las sesiones (ej. 2h o 3h)
      // Para Taller (T) o Lab (L): los alumnos se dividen en subgrupos, cada estudiante cursa la duración de 1 subgrupo
      const studentHoursList: number[] = [];
      groupSubgroupDurationMap.forEach((subMap) => {
        if (code === 'C') {
          let sum = 0;
          subMap.forEach(mins => { sum += mins; });
          studentHoursList.push(sum / 60);
        } else {
          const subValues = Array.from(subMap.values());
          if (subValues.length > 0) {
            studentHoursList.push(subValues[0] / 60);
          }
        }
      });

      const minHrs = studentHoursList.length > 0 ? Math.min(...studentHoursList) : 0;
      const maxHrs = studentHoursList.length > 0 ? Math.max(...studentHoursList) : 0;
      const avgHrs = studentHoursList.length > 0 
        ? studentHoursList.reduce((acc, h) => acc + h, 0) / studentHoursList.length 
        : 0;

      let hoursPerGroupFormatted = '0 h / sem';
      if (minHrs > 0) {
        if (minHrs === maxHrs) {
          hoursPerGroupFormatted = minHrs % 1 === 0 ? `${minHrs} h / sem` : `${minHrs.toFixed(1)} h / sem`;
        } else {
          hoursPerGroupFormatted = `${minHrs % 1 === 0 ? minHrs : minHrs.toFixed(1)} a ${maxHrs % 1 === 0 ? maxHrs : maxHrs.toFixed(1)} h / sem`;
        }
      }

      const totalHoursNum = totalMinutes / 60;
      const totalHoursFormatted = totalHoursNum % 1 === 0 ? `${totalHoursNum} h` : `${totalHoursNum.toFixed(1)} h`;

      return {
        code,
        name,
        shortLabel,
        totalMinutes,
        totalHoursNum,
        totalHoursFormatted,
        hoursPerGroupFormatted,
        avgStudentHours: avgHrs,
        minStudentHours: minHrs,
        maxStudentHours: maxHrs,
        groupsCount: groupSet.size,
        groupsList: Array.from(groupSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
        subgroupsCount: subgroupSet.size,
        roomsList: Array.from(roomsSet).sort(),
        teachersList: Array.from(teachersSet).sort(),
        sessionsCount: actSessions.length,
        sessions: actSessions
      };
    };

    const clase = buildCategoryStats('C', 'Clase Teórica', 'Clase (C)', cSessions);
    const taller = buildCategoryStats('T', 'Taller', 'Taller (T)', tSessions);
    const laboratorio = buildCategoryStats('L', 'Laboratorio', 'Laboratorio (L)', lSessions);
    const practica = buildCategoryStats('P', 'Práctica de Campo / Práctica', 'Práctica (P)', pSessions);

    // Suma de horas curriculares semanales por alumno
    const totalStudentCurricularHours = 
      (clase.groupsCount > 0 ? clase.avgStudentHours : 0) +
      (taller.groupsCount > 0 ? taller.avgStudentHours : 0) +
      (laboratorio.groupsCount > 0 ? laboratorio.avgStudentHours : 0) +
      (practica.groupsCount > 0 ? practica.avgStudentHours : 0);

    // Desglose detallado por grupo individual
    const allGroups = (Array.from(
      new Set(subjectSessions.map(s => s.grupo).filter(g => g && g !== '-'))
    ) as string[]).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const groupBreakdowns = allGroups.map(grp => {
      const grpSessions = subjectSessions.filter(s => s.grupo === grp);

      const getActSummaryForGroup = (actCode: 'C' | 'T' | 'L' | 'P') => {
        const act = grpSessions.filter(s => getSessionActivityType(s) === actCode);
        if (act.length === 0) return null;

        let totalMins = 0;
        const subgpos = new Set<string>();
        const rooms = new Set<string>();
        const profs = new Set<string>();
        const scheduleSlots: { day: string; time: string; room: string; teacher: string; subgpo: string }[] = [];

        for (const s of act) {
          totalMins += s.durationMinutes || 0;
          subgpos.add(s.subgrupo || '0');
          if (s.aula && s.aula !== 'Sin Aula Asignada') rooms.add(s.aula);
          if (s.profesor) profs.add(s.profesor);
          scheduleSlots.push({
            day: s.dia,
            time: `${s.horaInicio} - ${s.horaFin}`,
            room: s.aula || 'Sin aula',
            teacher: s.profesor || 'Sin docente asignado',
            subgpo: s.subgrupo || '0'
          });
        }

        let studentHrs = 0;
        if (actCode === 'C') {
          studentHrs = totalMins / 60;
        } else {
          const firstSub = Array.from(subgpos)[0];
          const firstSubMins = act
            .filter(s => (s.subgrupo || '0') === firstSub)
            .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
          studentHrs = firstSubMins / 60;
        }

        return {
          hoursTotal: totalMins / 60,
          hoursStudent: studentHrs,
          subgroups: Array.from(subgpos).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
          rooms: Array.from(rooms),
          teachers: Array.from(profs),
          scheduleSlots,
          sessionsCount: act.length
        };
      };

      const gClase = getActSummaryForGroup('C');
      const gTaller = getActSummaryForGroup('T');
      const gLab = getActSummaryForGroup('L');
      const gPractica = getActSummaryForGroup('P');

      const studentTotal = 
        (gClase ? gClase.hoursStudent : 0) +
        (gTaller ? gTaller.hoursStudent : 0) +
        (gLab ? gLab.hoursStudent : 0) +
        (gPractica ? gPractica.hoursStudent : 0);

      const teachingTotal = 
        (gClase ? gClase.hoursTotal : 0) +
        (gTaller ? gTaller.hoursTotal : 0) +
        (gLab ? gLab.hoursTotal : 0) +
        (gPractica ? gPractica.hoursTotal : 0);

      return {
        grupo: grp,
        studentTotal,
        teachingTotal,
        clase: gClase,
        taller: gTaller,
        laboratorio: gLab,
        practica: gPractica
      };
    });

    return {
      clase,
      taller,
      laboratorio,
      practica,
      totalStudentCurricularHours,
      groupBreakdowns,
      hasPractica: practica.totalHoursNum > 0 || practica.groupsCount > 0
    };
  }, [subjectSessions]);

  // Filter sessions passed to WeeklyCalendar based on the selected activity filter
  const calendarSessions = useMemo(() => {
    if (activityFilter === 'ALL') return subjectSessions;
    return subjectSessions.filter(s => getSessionActivityType(s) === activityFilter);
  }, [subjectSessions, activityFilter]);

  // Overall statistics for subject header
  const stats = useMemo(() => {
    if (subjectSessions.length === 0) return null;

    const uniqueProfs = new Set(subjectSessions.map(s => s.profesor).filter(Boolean));
    const uniqueRooms = new Set(subjectSessions.map(s => s.aula).filter(a => a && a !== 'Sin Aula Asignada'));
    const uniqueGroups = new Set(subjectSessions.map(s => s.grupo).filter(g => g && g !== '-'));
    const programs = new Set(subjectSessions.map(s => s.programa).filter(Boolean));
    const sample = subjectSessions[0];

    let totalMinutes = 0;
    for (const s of subjectSessions) {
      totalMinutes += s.durationMinutes || 0;
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

      {/* SECCIÓN ESPECIAL SOLICITADA: HORAS Y GRUPOS DE CLASE (C), TALLER (T) Y LABORATORIO (L) */}
      {selectedSubject && activityStats && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
          
          {/* Header de la sección */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                  <Layers className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Estructura Docente: Horas y Grupos por Modalidad
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Desglose curricular de horas de <strong className="text-blue-700">Clase Teórica (C)</strong>, <strong className="text-amber-700">Taller (T)</strong> y <strong className="text-emerald-700">Laboratorio (L)</strong>, así como la cantidad de grupos y subgrupos asignados.
              </p>
            </div>

            {/* Carga promedio del estudiante */}
            {activityStats.totalStudentCurricularHours > 0 && (
              <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl shrink-0">
                <Clock className="w-4 h-4 text-cyan-700" />
                <span className="text-xs text-slate-600">Carga por estudiante:</span>
                <span className="text-xs font-extrabold text-slate-900 font-mono">
                  {activityStats.totalStudentCurricularHours % 1 === 0 
                    ? `${activityStats.totalStudentCurricularHours} h` 
                    : `${activityStats.totalStudentCurricularHours.toFixed(1)} h`} / semana
                </span>
              </div>
            )}
          </div>

          {/* Tarjetas Principales de Modalidad: C, T, L (y P si aplica) */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
            
            {/* 1. CLASE TEÓRICA (C) */}
            <div 
              onClick={() => setActivityFilter(activityFilter === 'C' ? 'ALL' : 'C')}
              className={`rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer relative overflow-hidden ${
                activityStats.clase.groupsCount > 0 
                  ? activityFilter === 'C'
                    ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/30 shadow-md'
                    : 'bg-white hover:bg-blue-50/40 border-blue-200/80 hover:border-blue-300 shadow-2xs'
                  : 'bg-slate-50/60 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    activityStats.clase.groupsCount > 0 ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200 text-slate-400'
                  }`}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-blue-900">Modalidad</div>
                    <h4 className="text-base font-bold text-slate-900">Clase (C)</h4>
                  </div>
                </div>
                {activityStats.clase.groupsCount > 0 ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono">
                    {activityStats.clase.groupsCount} {activityStats.clase.groupsCount === 1 ? 'grupo' : 'grupos'}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
                    Sin clases C
                  </span>
                )}
              </div>

              {activityStats.clase.groupsCount > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {activityStats.clase.hoursPerGroupFormatted}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">por grupo</span>
                  </div>

                  <div className="pt-2 border-t border-blue-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">Total Impartido</span>
                      <span className="font-bold text-slate-800 font-mono">{activityStats.clase.totalHoursFormatted} totales</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">Grupos Activos</span>
                      <span className="font-bold text-blue-700 font-mono truncate block" title={activityStats.clase.groupsList.join(', ')}>
                        {activityStats.clase.groupsList.join(', ')}
                      </span>
                    </div>
                  </div>

                  {activityStats.clase.roomsList.length > 0 && (
                    <div className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="text-slate-400 font-medium">Aulas:</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {activityStats.clase.roomsList.slice(0, 4).join(', ')}
                        {activityStats.clase.roomsList.length > 4 ? ` +${activityStats.clase.roomsList.length - 4}` : ''}
                      </span>
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className={`font-semibold ${activityFilter === 'C' ? 'text-blue-700' : 'text-slate-400'}`}>
                      {activityFilter === 'C' ? '✓ Filtrando en horario' : 'Clic para filtrar horario'}
                    </span>
                    <span className="text-blue-600 font-bold">{activityStats.clase.sessionsCount} sesiones</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3">Esta asignatura no tiene sesiones teóricas de tipo clase registradas.</p>
              )}
            </div>

            {/* 2. TALLER (T) */}
            <div 
              onClick={() => setActivityFilter(activityFilter === 'T' ? 'ALL' : 'T')}
              className={`rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer relative overflow-hidden ${
                activityStats.taller.groupsCount > 0 
                  ? activityFilter === 'T'
                    ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/30 shadow-md'
                    : 'bg-white hover:bg-amber-50/40 border-amber-200/80 hover:border-amber-300 shadow-2xs'
                  : 'bg-slate-50/60 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    activityStats.taller.groupsCount > 0 ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-200 text-slate-400'
                  }`}>
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-amber-900">Modalidad</div>
                    <h4 className="text-base font-bold text-slate-900">Taller (T)</h4>
                  </div>
                </div>
                {activityStats.taller.groupsCount > 0 ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono">
                    {activityStats.taller.groupsCount} {activityStats.taller.groupsCount === 1 ? 'grupo' : 'grupos'}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
                    Sin talleres T
                  </span>
                )}
              </div>

              {activityStats.taller.groupsCount > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {activityStats.taller.hoursPerGroupFormatted}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">por alumno</span>
                  </div>

                  <div className="pt-2 border-t border-amber-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">Total Impartido</span>
                      <span className="font-bold text-slate-800 font-mono">{activityStats.taller.totalHoursFormatted} totales</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">Subgrupos</span>
                      <span className="font-bold text-amber-800 font-mono">{activityStats.taller.subgroupsCount} subgrupos</span>
                    </div>
                  </div>

                  {activityStats.taller.roomsList.length > 0 && (
                    <div className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap">
                      <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="text-slate-400 font-medium">Espacios:</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {activityStats.taller.roomsList.slice(0, 4).join(', ')}
                        {activityStats.taller.roomsList.length > 4 ? ` +${activityStats.taller.roomsList.length - 4}` : ''}
                      </span>
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className={`font-semibold ${activityFilter === 'T' ? 'text-amber-700' : 'text-slate-400'}`}>
                      {activityFilter === 'T' ? '✓ Filtrando en horario' : 'Clic para filtrar horario'}
                    </span>
                    <span className="text-amber-700 font-bold">{activityStats.taller.sessionsCount} sesiones</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3">Esta asignatura no incluye horas de taller en su estructura docente.</p>
              )}
            </div>

            {/* 3. LABORATORIO (L) */}
            <div 
              onClick={() => setActivityFilter(activityFilter === 'L' ? 'ALL' : 'L')}
              className={`rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer relative overflow-hidden ${
                activityStats.laboratorio.groupsCount > 0 
                  ? activityFilter === 'L'
                    ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/30 shadow-md'
                    : 'bg-white hover:bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-300 shadow-2xs'
                  : 'bg-slate-50/60 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    activityStats.laboratorio.groupsCount > 0 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-400'
                  }`}>
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">Modalidad</div>
                    <h4 className="text-base font-bold text-slate-900">Laboratorio (L)</h4>
                  </div>
                </div>
                {activityStats.laboratorio.groupsCount > 0 ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                    {activityStats.laboratorio.groupsCount} {activityStats.laboratorio.groupsCount === 1 ? 'grupo' : 'grupos'}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
                    Sin laboratorios L
                  </span>
                )}
              </div>

              {activityStats.laboratorio.groupsCount > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {activityStats.laboratorio.hoursPerGroupFormatted}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">por subgrupo</span>
                  </div>

                  <div className="pt-2 border-t border-emerald-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">Total Impartido</span>
                      <span className="font-bold text-slate-800 font-mono">{activityStats.laboratorio.totalHoursFormatted} totales</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">Subgrupos Lab</span>
                      <span className="font-bold text-emerald-800 font-mono">{activityStats.laboratorio.subgroupsCount} subgrupos</span>
                    </div>
                  </div>

                  {activityStats.laboratorio.roomsList.length > 0 && (
                    <div className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-slate-400 font-medium">Laboratorios:</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {activityStats.laboratorio.roomsList.slice(0, 4).join(', ')}
                        {activityStats.laboratorio.roomsList.length > 4 ? ` +${activityStats.laboratorio.roomsList.length - 4}` : ''}
                      </span>
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className={`font-semibold ${activityFilter === 'L' ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {activityFilter === 'L' ? '✓ Filtrando en horario' : 'Clic para filtrar horario'}
                    </span>
                    <span className="text-emerald-700 font-bold">{activityStats.laboratorio.sessionsCount} sesiones</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3">Esta asignatura no tiene sesiones prácticas de laboratorio registradas.</p>
              )}
            </div>

          </div>

          {/* Tarjeta de Práctica (P) en caso de que la asignatura cuente con prácticas de campo o clínicas */}
          {activityStats.hasPractica && (
            <div 
              onClick={() => setActivityFilter(activityFilter === 'P' ? 'ALL' : 'P')}
              className={`rounded-2xl p-4 border transition-all cursor-pointer ${
                activityFilter === 'P'
                  ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-500/30 shadow-md'
                  : 'bg-purple-50/40 hover:bg-purple-50 border-purple-200/80 shadow-2xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Prácticas de Campo / Práctica (P)</span>
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-purple-100 text-purple-800 font-mono">
                        {activityStats.practica.groupsCount} {activityStats.practica.groupsCount === 1 ? 'grupo' : 'grupos'} • {activityStats.practica.subgroupsCount} subgrupos
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Esta asignatura complementa sus horas con salidas de campo o prácticas aplicadas.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-sans">Por alumno</span>
                    <span className="font-bold text-purple-900">{activityStats.practica.hoursPerGroupFormatted}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-sans">Total Impartido</span>
                    <span className="font-bold text-purple-900">{activityStats.practica.totalHoursFormatted}</span>
                  </div>
                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activityFilter === 'P' ? 'bg-purple-700 text-white' : 'bg-white text-purple-700 border border-purple-200'
                    }`}
                  >
                    {activityFilter === 'P' ? 'Filtrado activo' : 'Ver en horario'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Desglose Detallado por Grupo Individual (Acordeón expandible) */}
          {activityStats.groupBreakdowns.length > 0 && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowGroupBreakdown(!showGroupBreakdown)}
                className="w-full px-4 py-3.5 bg-slate-50/80 hover:bg-slate-100 text-left flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Desglose por Grupo ({activityStats.groupBreakdowns.length} {activityStats.groupBreakdowns.length === 1 ? 'grupo' : 'grupos'} disponibles)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                  <span>{showGroupBreakdown ? 'Ocultar detalles de grupos' : 'Ver horas por grupo'}</span>
                  {showGroupBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {showGroupBreakdown && (
                <div className="p-4 divide-y divide-slate-100 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {activityStats.groupBreakdowns.map(g => (
                      <div key={g.grupo} className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/40 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span>
                            <span className="text-sm font-bold text-slate-900 font-mono">Grupo {g.grupo}</span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                            {g.studentTotal} h / sem alumno
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          {/* Clase C */}
                          {g.clase ? (
                            <div className="flex items-start justify-between gap-1 text-slate-700">
                              <span className="flex items-center gap-1 text-blue-700 font-semibold">
                                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                                <span>Clase (C):</span>
                              </span>
                              <div className="text-right">
                                <span className="font-mono font-bold">{g.clase.hoursStudent} h</span>
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  {g.clase.rooms.join(', ') || 'Sin aula'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-slate-400 text-[11px]">
                              <span>Clase (C):</span>
                              <span>0 h</span>
                            </div>
                          )}

                          {/* Taller T */}
                          {g.taller ? (
                            <div className="flex items-start justify-between gap-1 text-slate-700">
                              <span className="flex items-center gap-1 text-amber-800 font-semibold">
                                <Wrench className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                                <span>Taller (T):</span>
                              </span>
                              <div className="text-right">
                                <span className="font-mono font-bold">{g.taller.hoursStudent} h</span>
                                <span className="text-[10px] text-amber-700 block font-mono">
                                  {g.taller.subgroups.length} {g.taller.subgroups.length === 1 ? 'subgpo' : 'subgpos'} ({g.taller.rooms.join(', ') || 'Espacio T'})
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-slate-400 text-[11px]">
                              <span>Taller (T):</span>
                              <span>0 h</span>
                            </div>
                          )}

                          {/* Laboratorio L */}
                          {g.laboratorio ? (
                            <div className="flex items-start justify-between gap-1 text-slate-700">
                              <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                                <FlaskConical className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                                <span>Laboratorio (L):</span>
                              </span>
                              <div className="text-right">
                                <span className="font-mono font-bold text-emerald-900">{g.laboratorio.hoursStudent} h</span>
                                <span className="text-[10px] text-emerald-700 block font-mono">
                                  {g.laboratorio.subgroups.length} {g.laboratorio.subgroups.length === 1 ? 'subgpo' : 'subgpos'} ({g.laboratorio.rooms.join(', ') || 'Lab'})
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-slate-400 text-[11px]">
                              <span>Laboratorio (L):</span>
                              <span>0 h</span>
                            </div>
                          )}

                          {/* Práctica P */}
                          {g.practica && (
                            <div className="flex items-start justify-between gap-1 text-slate-700">
                              <span className="flex items-center gap-1 text-purple-800 font-semibold">
                                <Compass className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                                <span>Práctica (P):</span>
                              </span>
                              <div className="text-right">
                                <span className="font-mono font-bold text-purple-900">{g.practica.hoursStudent} h</span>
                                <span className="text-[10px] text-purple-700 block font-mono">
                                  {g.practica.subgroups.length} {g.practica.subgroups.length === 1 ? 'subgpo' : 'subgpos'}
                                </span>
                              </div>
                            </div>
                          )}

                        </div>

                        {/* Docentes a cargo del grupo */}
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 truncate" title={[
                          ...(g.clase?.teachers || []),
                          ...(g.taller?.teachers || []),
                          ...(g.laboratorio?.teachers || []),
                          ...(g.practica?.teachers || [])
                        ].filter((v, i, a) => a.indexOf(v) === i).join(' • ')}>
                          <span className="font-semibold text-slate-700">Docentes: </span>
                          {[
                            ...(g.clase?.teachers || []),
                            ...(g.taller?.teachers || []),
                            ...(g.laboratorio?.teachers || []),
                            ...(g.practica?.teachers || [])
                          ].filter((v, i, a) => a.indexOf(v) === i).join(' • ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Selector de Filtro de Modalidad sobre el Calendario */}
      {selectedSubject && activityStats && (
        <div className="bg-slate-100 p-2.5 rounded-2xl flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 pl-2">
            <ListFilter className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-800">Filtrar actividades en el horario:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActivityFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activityFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <span>Todas las modalidades</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                activityFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {subjectSessions.length}
              </span>
            </button>

            {activityStats.clase.sessionsCount > 0 && (
              <button
                type="button"
                onClick={() => setActivityFilter('C')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activityFilter === 'C'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white hover:bg-blue-50 text-blue-900 border border-blue-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Solo Clase (C)</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  activityFilter === 'C' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                }`}>
                  {activityStats.clase.sessionsCount}
                </span>
              </button>
            )}

            {activityStats.taller.sessionsCount > 0 && (
              <button
                type="button"
                onClick={() => setActivityFilter('T')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activityFilter === 'T'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white hover:bg-amber-50 text-amber-900 border border-amber-200'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Solo Taller (T)</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  activityFilter === 'T' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  {activityStats.taller.sessionsCount}
                </span>
              </button>
            )}

            {activityStats.laboratorio.sessionsCount > 0 && (
              <button
                type="button"
                onClick={() => setActivityFilter('L')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activityFilter === 'L'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Solo Laboratorio (L)</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  activityFilter === 'L' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {activityStats.laboratorio.sessionsCount}
                </span>
              </button>
            )}

            {activityStats.hasPractica && activityStats.practica.sessionsCount > 0 && (
              <button
                type="button"
                onClick={() => setActivityFilter('P')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activityFilter === 'P'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white hover:bg-purple-50 text-purple-900 border border-purple-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Solo Práctica (P)</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  activityFilter === 'P' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                }`}>
                  {activityStats.practica.sessionsCount}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Weekly Schedule Grid */}
      {selectedSubject ? (
        <WeeklyCalendar
          sessions={calendarSessions}
          onSelectSession={onSelectSession}
          title={`Horarios de la Asignatura: ${selectedSubject}`}
          subtitle={`${
            activityFilter === 'C' ? 'Mostrando únicamente sesiones de Clase Teórica (C)' :
            activityFilter === 'T' ? 'Mostrando únicamente sesiones de Taller (T)' :
            activityFilter === 'L' ? 'Mostrando únicamente sesiones de Laboratorio (L)' :
            activityFilter === 'P' ? 'Mostrando únicamente sesiones de Práctica (P)' :
            `Nivel: ${stats?.level === 'posgrado' ? 'Posgrado (Maestría / Doctorado)' : 'Licenciatura'} • Se muestran todos los grupos y sesiones de esta materia`
          }`}
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
