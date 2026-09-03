import React, { useState, useMemo } from 'react';
import { 
  Users, 
  CheckSquare, 
  Square, 
  Copy, 
  Check, 
  Mail, 
  Filter, 
  Search, 
  UserCheck, 
  BookOpen, 
  Clock, 
  Building2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Briefcase
} from 'lucide-react';
import { ScheduleSession } from '../types';
import { CampusBuildingInfo } from '../data/campusBuildings';
import { formatDurationHours } from '../utils/normalizer';

export interface BuildingProfItem {
  name: string;
  noEmpleado: string;
  rooms: string[];
  subjects: string[];
  groups: string[];
  hoursInBuilding: number;
  totalHoursFCM: number;
  isPTC: boolean; // Tiempo completo (aprox >= 30 horas registradas en carga docente FCM)
}

interface BuildingProfessorsSelectorProps {
  building: CampusBuildingInfo;
  sessions: ScheduleSession[];
  onSelectTeacher?: (teacherName: string) => void;
  onSelectRoom?: (roomCode: string) => void;
  className?: string;
  compact?: boolean;
}

export const BuildingProfessorsSelector: React.FC<BuildingProfessorsSelectorProps> = ({
  building,
  sessions,
  onSelectTeacher,
  onSelectRoom,
  className = '',
  compact = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ptc' | 'asignatura'>('all');
  const [selectedTeachers, setSelectedTeachers] = useState<Set<string>>(new Set());
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);
  const [separatorMode, setSeparatorMode] = useState<'semicolon' | 'comma' | 'newline'>('semicolon');

  // Compute building sessions and professors
  const { professorsList, totalBuildingHours } = useMemo(() => {
    // Rooms belonging to this building (case insensitive)
    const buildingRoomsSet = new Set(building.rooms.map(r => r.toUpperCase().trim()));

    // Total hours map across entire FCM to detect PTC vs Asignatura
    const globalHoursMap = new Map<string, number>();
    for (const s of sessions) {
      if (s.profesor) {
        globalHoursMap.set(s.profesor, (globalHoursMap.get(s.profesor) || 0) + s.durationMinutes / 60);
      }
    }

    // Filter sessions belonging to this building
    const bSessions = sessions.filter(s => {
      const aula = (s.aula || '').toUpperCase().trim();
      const edif = (s.edificio || '').toUpperCase().trim();
      return buildingRoomsSet.has(aula) || edif === building.number || edif === `E-${building.number}`;
    });

    let bHours = 0;
    const profMap = new Map<string, {
      name: string;
      noEmpleado: string;
      rooms: Set<string>;
      subjects: Set<string>;
      groups: Set<string>;
      minutes: number;
    }>();

    for (const s of bSessions) {
      bHours += s.durationMinutes / 60;
      const prof = (s.profesor || '').trim();
      if (!prof || prof.toLowerCase().includes('sin asignar') || prof === '0') continue;

      if (!profMap.has(prof)) {
        profMap.set(prof, {
          name: prof,
          noEmpleado: s.noEmpleado || '',
          rooms: new Set(),
          subjects: new Set(),
          groups: new Set(),
          minutes: 0
        });
      }

      const p = profMap.get(prof)!;
      if (s.noEmpleado && !p.noEmpleado) p.noEmpleado = s.noEmpleado;
      if (s.aula) p.rooms.add(s.aula);
      if (s.asignatura) p.subjects.add(s.asignatura);
      if (s.grupo) p.groups.add(s.grupo);
      p.minutes += s.durationMinutes;
    }

    const list: BuildingProfItem[] = Array.from(profMap.values()).map(p => {
      const fcmTotal = globalHoursMap.get(p.name) || (p.minutes / 60);
      return {
        name: p.name,
        noEmpleado: p.noEmpleado,
        rooms: Array.from(p.rooms).sort(),
        subjects: Array.from(p.subjects).sort(),
        groups: Array.from(p.groups).sort(),
        hoursInBuilding: Math.round((p.minutes / 60) * 10) / 10,
        totalHoursFCM: Math.round(fcmTotal * 10) / 10,
        isPTC: fcmTotal >= 28 // Generalmente 30-40 horas en carga académica institucional
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    return {
      professorsList: list,
      totalBuildingHours: Math.round(bHours * 10) / 10
    };
  }, [building, sessions]);

  // Sync default selection (select all by default initially)
  React.useEffect(() => {
    setSelectedTeachers(new Set(professorsList.map(p => p.name)));
  }, [professorsList]);

  // Filter list by search term and PTC filter
  const filteredList = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return professorsList.filter(p => {
      // Type filter
      if (filterType === 'ptc' && !p.isPTC) return false;
      if (filterType === 'asignatura' && p.isPTC) return false;

      // Search term
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        p.noEmpleado.includes(term) ||
        p.rooms.some(r => r.toLowerCase().includes(term)) ||
        p.subjects.some(s => s.toLowerCase().includes(term))
      );
    });
  }, [professorsList, searchTerm, filterType]);

  // Selection handlers
  const handleToggleTeacher = (name: string) => {
    setSelectedTeachers(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedTeachers(new Set(filteredList.map(p => p.name)));
  };

  const handleDeselectAll = () => {
    setSelectedTeachers(new Set());
  };

  // Copy to clipboard for Gmail
  const handleCopyForGmail = (format: 'semicolon' | 'comma' | 'newline' | 'detailed') => {
    const selected = professorsList.filter(p => selectedTeachers.has(p.name));
    if (selected.length === 0) return;

    let textToCopy = '';

    if (format === 'semicolon') {
      // Ideal for Gmail and Outlook To/Bcc fields: "Nombre 1; Nombre 2; Nombre 3"
      textToCopy = selected.map(p => p.name).join('; ');
    } else if (format === 'comma') {
      textToCopy = selected.map(p => p.name).join(', ');
    } else if (format === 'newline') {
      textToCopy = selected.map(p => p.name).join('\n');
    } else if (format === 'detailed') {
      textToCopy = `DOCENTES DE ${building.name.toUpperCase()} (UABC FCM - 2026-2)\n` +
        `Total: ${selected.length} profesores seleccionados\n\n` +
        selected.map((p, i) => 
          `${i + 1}. ${p.name} (No. Emp: ${p.noEmpleado || 'S/N'})\n` +
          `   - Aulas: ${p.rooms.join(', ')}\n` +
          `   - Materias: ${p.subjects.join(' | ')}\n` +
          `   - Horas E${building.number}: ${p.hoursInBuilding} hrs (${p.isPTC ? 'Tiempo Completo' : 'Asignatura'})`
        ).join('\n\n');
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopySuccess(format === 'detailed' ? 'list' : 'gmail');
      setTimeout(() => setCopySuccess(null), 3000);
    }).catch(err => {
      console.error('Error al copiar:', err);
    });
  };

  const ptcCount = professorsList.filter(p => p.isPTC).length;
  const asigCount = professorsList.length - ptcCount;
  const selectedCount = selectedTeachers.size;

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {building.id}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {building.title}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>Plantilla Docente Activa en {building.name}</span>
            </h3>

            <p className="text-xs text-slate-300 max-w-2xl">
              {professorsList.length} profesores imparten clase en este inmueble ({totalBuildingHours} hrs semanales frente a grupo).
              Selecciona nombres para copiarlos y pegarlos directamente en Gmail.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{isExpanded ? 'Ocultar Lista' : 'Mostrar Lista'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

        </div>

        {/* Quick stat counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-slate-700/60 mt-3 text-center">
          <div className="bg-white/5 rounded-lg py-1.5 px-2">
            <div className="text-[11px] text-slate-400">Total Docentes</div>
            <div className="text-base font-bold text-white font-mono">{professorsList.length}</div>
          </div>
          <div className="bg-white/5 rounded-lg py-1.5 px-2">
            <div className="text-[11px] text-slate-400">Tiempo Completo</div>
            <div className="text-base font-bold text-cyan-300 font-mono">{ptcCount}</div>
          </div>
          <div className="bg-white/5 rounded-lg py-1.5 px-2">
            <div className="text-[11px] text-slate-400">Asignatura / Horas</div>
            <div className="text-base font-bold text-amber-300 font-mono">{asigCount}</div>
          </div>
          <div className="bg-white/5 rounded-lg py-1.5 px-2">
            <div className="text-[11px] text-slate-400">Aulas Asignadas</div>
            <div className="text-base font-bold text-emerald-300 font-mono">{building.rooms.length}</div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          
          {/* Controls: Search, Filters & Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Filtrar por nombre, materia o aula..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* PTC / Asignatura Filter Pills */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 mr-1 hidden sm:inline">Perfil:</span>
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Todos ({professorsList.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('ptc')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  filterType === 'ptc'
                    ? 'bg-cyan-700 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                T. Completo ({ptcCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('asignatura')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  filterType === 'asignatura'
                    ? 'bg-amber-700 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Asignatura ({asigCount})
              </button>
            </div>

            {/* Select All / Deselect All */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-cyan-700 hover:text-cyan-900 font-semibold cursor-pointer underline"
              >
                Seleccionar todos
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer underline"
              >
                Deseleccionar
              </button>
            </div>

          </div>

          {/* Action Bar for Gmail Copy */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-cyan-50/70 border border-cyan-200/80 p-3.5 rounded-xl">
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-700 text-white flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-cyan-950 flex items-center gap-2">
                  <span>{selectedCount} de {professorsList.length} seleccionados</span>
                  {copySuccess && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3 h-3" /> ¡Copiado al portapapeles!
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-cyan-800">
                  Listo para pegar en el campo "Para" o "CCO" de Gmail / Google Workspace UABC.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              
              {/* Primary Copy Button for Gmail */}
              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={() => handleCopyForGmail('semicolon')}
                title="Copia los nombres separados por punto y coma (formato estándar para el campo Para/CCO de Gmail)"
                className="px-3.5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar para Gmail ({selectedCount})</span>
              </button>

              {/* Secondary format options */}
              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={() => handleCopyForGmail('detailed')}
                title="Copia el listado completo con No. Empleado, aulas y asignaturas"
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 disabled:opacity-40 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Copiar Detallado</span>
              </button>

            </div>

          </div>

          {/* List of Professors with Checkboxes */}
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No se encontraron docentes con el filtro aplicado.
              </div>
            ) : (
              filteredList.map((prof, index) => {
                const isSelected = selectedTeachers.has(prof.name);
                return (
                  <div
                    key={prof.name}
                    className={`flex items-start sm:items-center justify-between p-3 gap-3 transition-colors ${
                      isSelected ? 'bg-cyan-50/40 hover:bg-cyan-50/70' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    
                    {/* Checkbox and Name */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleTeacher(prof.name)}
                        className="mt-0.5 text-cyan-700 hover:text-cyan-900 cursor-pointer focus:outline-none"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-cyan-700" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span 
                            onClick={() => handleToggleTeacher(prof.name)}
                            className="font-bold text-xs text-slate-900 hover:text-cyan-800 cursor-pointer"
                          >
                            {prof.name}
                          </span>

                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
                            prof.isPTC
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {prof.isPTC ? 'Tiempo Completo' : 'Asignatura'}
                          </span>

                          {prof.noEmpleado && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              No. Emp: {prof.noEmpleado}
                            </span>
                          )}
                        </div>

                        {/* Rooms & Subjects snippet */}
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600 flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Building2 className="w-3 h-3 text-cyan-600" />
                            Aulas: {prof.rooms.map(r => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => onSelectRoom?.(r)}
                                className="underline hover:text-cyan-800 font-bold"
                              >
                                {r}
                              </button>
                            ))}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="truncate max-w-md text-slate-500" title={prof.subjects.join(', ')}>
                            {prof.subjects.join(' | ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Hours & Direct View Action */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-bold text-slate-800 font-mono">
                          {prof.hoursInBuilding} hrs en {building.id}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Total FCM: {prof.totalHoursFCM} hrs
                        </div>
                      </div>

                      {onSelectTeacher && (
                        <button
                          type="button"
                          onClick={() => onSelectTeacher(prof.name)}
                          title={`Ver horario semanal de ${prof.name}`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-cyan-100 text-slate-600 hover:text-cyan-800 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Quick paste helper text */}
          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between flex-wrap gap-2">
            <span>
              💡 <strong>Tip para Gmail:</strong> Al pulsar <em>"Copiar para Gmail"</em>, abre una ventana de redactar en tu correo UABC y pulsa <kbd className="bg-white px-1 py-0.5 rounded border border-slate-300 text-slate-700 font-mono text-[10px]">Ctrl+V</kbd> en el campo <strong>Para</strong> o <strong>CCO</strong>. Gmail convertirá automáticamente cada nombre en el contacto institucional.
            </span>
          </div>

        </div>
      )}

    </div>
  );
};
