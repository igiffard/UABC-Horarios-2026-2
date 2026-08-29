import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  User, 
  Building2, 
  BookOpen, 
  Users, 
  ArrowRight,
  Clock,
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { ScheduleSession, DirectoryCategory, ViewTab } from '../types';
import { formatDurationHours } from '../utils/normalizer';

interface DirectoryProfItem {
  name: string;
  subjects: Set<string>;
  rooms: Set<string>;
  groups: Set<string>;
  totalMinutes: number;
  sessionCount: number;
  noEmpleado: string;
}

interface DirectoryRoomItem {
  name: string;
  building: string;
  capacity: number | null;
  subjects: Set<string>;
  professors: Set<string>;
  totalMinutes: number;
  sessionCount: number;
}

interface DirectorySubjectItem {
  name: string;
  claveUA: string;
  programs: Set<string>;
  professors: Set<string>;
  groups: Set<string>;
  rooms: Set<string>;
  totalMinutes: number;
  sessionCount: number;
}

interface DirectoryGroupItem {
  name: string;
  programs: Set<string>;
  subjects: Set<string>;
  professors: Set<string>;
  totalMinutes: number;
  sessionCount: number;
}

interface DirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ScheduleSession[];
  initialCategory?: DirectoryCategory;
  onSelectEntity: (tab: ViewTab, name: string) => void;
}

export const DirectoryModal: React.FC<DirectoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  initialCategory = 'profesores',
  onSelectEntity
}) => {
  const [activeCategory, setActiveCategory] = useState<DirectoryCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLetter, setSelectedLetter] = useState<string>('TODOS');

  // Build aggregated data for all 4 categories
  const directoryData = useMemo(() => {
    // 1. Profesores
    const profMap = new Map<string, DirectoryProfItem>();

    // 2. Aulas
    const roomMap = new Map<string, DirectoryRoomItem>();

    // 3. Asignaturas
    const subjectMap = new Map<string, DirectorySubjectItem>();

    // 4. Grupos
    const groupMap = new Map<string, DirectoryGroupItem>();

    for (const s of sessions) {
      // Teacher
      if (s.profesor && s.profesor.trim()) {
        const prof = s.profesor.trim();
        if (!profMap.has(prof)) {
          profMap.set(prof, {
            name: prof,
            subjects: new Set<string>(),
            rooms: new Set<string>(),
            groups: new Set<string>(),
            totalMinutes: 0,
            sessionCount: 0,
            noEmpleado: s.noEmpleado || ''
          });
        }
        const pObj = profMap.get(prof)!;
        if (s.asignatura) pObj.subjects.add(s.asignatura);
        if (s.aula && s.aula !== 'Sin Aula Asignada') pObj.rooms.add(s.aula);
        if (s.grupo && s.grupo !== '-') pObj.groups.add(s.grupo);
        pObj.totalMinutes += s.durationMinutes || 0;
        pObj.sessionCount++;
      }

      // Room
      if (s.aula && s.aula.trim() && s.aula !== 'Sin Aula Asignada') {
        const room = s.aula.trim();
        if (!roomMap.has(room)) {
          roomMap.set(room, {
            name: room,
            building: s.edificio || '',
            capacity: s.capacidadSalon || s.capacidad || null,
            subjects: new Set<string>(),
            professors: new Set<string>(),
            totalMinutes: 0,
            sessionCount: 0
          });
        } else {
          const rObj = roomMap.get(room)!;
          if (!rObj.capacity && (s.capacidadSalon || s.capacidad)) {
            rObj.capacity = s.capacidadSalon || s.capacidad || null;
          }
        }
        const rObj = roomMap.get(room)!;
        if (s.asignatura) rObj.subjects.add(s.asignatura);
        if (s.profesor) rObj.professors.add(s.profesor);
        rObj.totalMinutes += s.durationMinutes || 0;
        rObj.sessionCount++;
      }

      // Subject
      if (s.asignatura && s.asignatura.trim()) {
        const subject = s.asignatura.trim();
        if (!subjectMap.has(subject)) {
          subjectMap.set(subject, {
            name: subject,
            claveUA: s.claveUA || '',
            programs: new Set<string>(),
            professors: new Set<string>(),
            groups: new Set<string>(),
            rooms: new Set<string>(),
            totalMinutes: 0,
            sessionCount: 0
          });
        }
        const sObj = subjectMap.get(subject)!;
        if (s.programa) sObj.programs.add(s.programa);
        if (s.profesor) sObj.professors.add(s.profesor);
        if (s.grupo && s.grupo !== '-') sObj.groups.add(s.grupo);
        if (s.aula && s.aula !== 'Sin Aula Asignada') sObj.rooms.add(s.aula);
        sObj.totalMinutes += s.durationMinutes || 0;
        sObj.sessionCount++;
      }

      // Group
      if (s.grupo && s.grupo.trim() && s.grupo !== '-') {
        const group = s.grupo.trim();
        if (!groupMap.has(group)) {
          groupMap.set(group, {
            name: group,
            programs: new Set<string>(),
            subjects: new Set<string>(),
            professors: new Set<string>(),
            totalMinutes: 0,
            sessionCount: 0
          });
        }
        const gObj = groupMap.get(group)!;
        if (s.programa) gObj.programs.add(s.programa);
        if (s.asignatura) gObj.subjects.add(s.asignatura);
        if (s.profesor) gObj.professors.add(s.profesor);
        gObj.totalMinutes += s.durationMinutes || 0;
        gObj.sessionCount++;
      }
    }

    return {
      profesores: Array.from(profMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'es')),
      aulas: Array.from(roomMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true })),
      asignaturas: Array.from(subjectMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'es')),
      grupos: Array.from(groupMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true })),
    };
  }, [sessions]);

  // Alphabet list for quick letter filtering
  const letters = useMemo(() => {
    const set = new Set<string>();
    const currentList = directoryData[activeCategory] || [];
    currentList.forEach(item => {
      const firstChar = item.name.charAt(0).toUpperCase();
      if (/[A-ZÁÉÍÓÚÑ0-9]/.test(firstChar)) {
        set.add(firstChar);
      }
    });
    return Array.from(set).sort();
  }, [directoryData, activeCategory]);

  // Filter items based on activeCategory, searchQuery and selectedLetter
  const filteredList = useMemo(() => {
    const rawList = directoryData[activeCategory] || [];
    let result = rawList;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      result = result.filter(item => {
        const nameNorm = item.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (nameNorm.includes(q)) return true;

        // Additional subfield matches
        if (activeCategory === 'profesores') {
          const prof = item as DirectoryProfItem;
          return Array.from(prof.subjects).some((s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q));
        }
        if (activeCategory === 'aulas') {
          const room = item as DirectoryRoomItem;
          return room.building.toLowerCase().includes(q) || Array.from(room.subjects).some((s: string) => s.toLowerCase().includes(q));
        }
        if (activeCategory === 'asignaturas') {
          const subj = item as DirectorySubjectItem;
          return subj.claveUA.toLowerCase().includes(q) || Array.from(subj.professors).some((p: string) => p.toLowerCase().includes(q));
        }
        if (activeCategory === 'grupos') {
          const grp = item as DirectoryGroupItem;
          return Array.from(grp.programs).some((p: string) => p.toLowerCase().includes(q));
        }
        return false;
      });
    }

    if (selectedLetter !== 'TODOS') {
      result = result.filter(item => item.name.toUpperCase().startsWith(selectedLetter));
    }

    return result;
  }, [directoryData, activeCategory, searchQuery, selectedLetter]);

  if (!isOpen) return null;

  const handleSelect = (category: DirectoryCategory, name: string) => {
    const tabMap: Record<DirectoryCategory, ViewTab> = {
      profesores: 'profesor',
      aulas: 'aula',
      asignaturas: 'asignatura',
      grupos: 'grupo',
    };
    onSelectEntity(tabMap[category], name);
    onClose();
  };

  const counts = {
    profesores: directoryData.profesores.length,
    aulas: directoryData.aulas.length,
    asignaturas: directoryData.asignaturas.length,
    grupos: directoryData.grupos.length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Modal Card */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[90vh] max-h-[820px] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display tracking-tight flex items-center gap-2">
                <span>Catálogo y Directorio General</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-normal">
                  FCM • 2026-2
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Explora el listado completo de profesores, aulas, asignaturas o grupos para consultar su horario al instante.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 pt-3 pb-0">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            
            {/* Profesores Tab */}
            <button
              type="button"
              onClick={() => {
                setActiveCategory('profesores');
                setSelectedLetter('TODOS');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-semibold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
                activeCategory === 'profesores'
                  ? 'border-cyan-700 text-cyan-950 bg-white shadow-xs font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <User className="w-4 h-4 text-cyan-600" />
              <span>Profesores</span>
              <span className={`text-[11px] px-2 py-0.2 rounded-full ${
                activeCategory === 'profesores' ? 'bg-cyan-100 text-cyan-900' : 'bg-slate-200 text-slate-700'
              }`}>
                {counts.profesores}
              </span>
            </button>

            {/* Aulas Tab */}
            <button
              type="button"
              onClick={() => {
                setActiveCategory('aulas');
                setSelectedLetter('TODOS');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-semibold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
                activeCategory === 'aulas'
                  ? 'border-cyan-700 text-cyan-950 bg-white shadow-xs font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4 text-cyan-600" />
              <span>Aulas y Espacios</span>
              <span className={`text-[11px] px-2 py-0.2 rounded-full ${
                activeCategory === 'aulas' ? 'bg-cyan-100 text-cyan-900' : 'bg-slate-200 text-slate-700'
              }`}>
                {counts.aulas}
              </span>
            </button>

            {/* Asignaturas Tab */}
            <button
              type="button"
              onClick={() => {
                setActiveCategory('asignaturas');
                setSelectedLetter('TODOS');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-semibold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
                activeCategory === 'asignaturas'
                  ? 'border-cyan-700 text-cyan-950 bg-white shadow-xs font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4 text-cyan-600" />
              <span>Asignaturas / Materias</span>
              <span className={`text-[11px] px-2 py-0.2 rounded-full ${
                activeCategory === 'asignaturas' ? 'bg-cyan-100 text-cyan-900' : 'bg-slate-200 text-slate-700'
              }`}>
                {counts.asignaturas}
              </span>
            </button>

            {/* Grupos Tab */}
            <button
              type="button"
              onClick={() => {
                setActiveCategory('grupos');
                setSelectedLetter('TODOS');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-semibold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
                activeCategory === 'grupos'
                  ? 'border-cyan-700 text-cyan-950 bg-white shadow-xs font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 text-cyan-600" />
              <span>Grupos Estudiantiles</span>
              <span className={`text-[11px] px-2 py-0.2 rounded-full ${
                activeCategory === 'grupos' ? 'bg-cyan-100 text-cyan-900' : 'bg-slate-200 text-slate-700'
              }`}>
                {counts.grupos}
              </span>
            </button>

          </div>
        </div>

        {/* Filter Controls (Search + Letter index) */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 space-y-3">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeCategory === 'profesores' 
                  ? 'Filtrar por nombre de profesor o materia que imparte...' 
                  : activeCategory === 'aulas'
                  ? 'Filtrar por código de aula (ej. S1, CPB, LFQ) o edificio...'
                  : activeCategory === 'asignaturas'
                  ? 'Filtrar por nombre de materia, clave UA o docente...'
                  : 'Filtrar por número de grupo o programa educativo...'
              }
              className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Alphabet Filter (A-Z) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
              Índice:
            </span>
            <button
              type="button"
              onClick={() => setSelectedLetter('TODOS')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs shrink-0 transition-all cursor-pointer ${
                selectedLetter === 'TODOS'
                  ? 'bg-cyan-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Todos ({directoryData[activeCategory]?.length || 0})
            </button>
            {letters.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => setSelectedLetter(letter)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg font-bold text-xs shrink-0 transition-all cursor-pointer ${
                  selectedLetter === letter
                    ? 'bg-cyan-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>

        </div>

        {/* Directory Items Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60">
          
          {filteredList.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                No se encontraron resultados para "{searchQuery}"
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLetter('TODOS');
                }}
                className="px-4 py-1.5 rounded-lg bg-cyan-700 text-white text-xs font-semibold hover:bg-cyan-800 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              
              {/* PROFESORES ITEMS */}
              {activeCategory === 'profesores' && (
                filteredList.map((item) => {
                  const prof = item as typeof directoryData.profesores[0];
                  return (
                    <div
                      key={prof.name}
                      onClick={() => handleSelect('profesores', prof.name)}
                      className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-cyan-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-cyan-800 transition-colors font-display line-clamp-2">
                            {prof.name}
                          </h3>
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200 shrink-0">
                            {formatDurationHours(prof.totalMinutes)}
                          </span>
                        </div>

                        {prof.subjects.size > 0 && (
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {Array.from(prof.subjects).join(', ')}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-medium text-slate-600">
                          <BookOpen className="w-3 h-3 text-cyan-600" />
                          {prof.subjects.size} {prof.subjects.size === 1 ? 'materia' : 'materias'}
                        </span>

                        <span className="flex items-center gap-1 text-cyan-700 font-semibold group-hover:translate-x-0.5 transition-transform">
                          <span>Ver Horario</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              {/* AULAS ITEMS */}
              {activeCategory === 'aulas' && (
                filteredList.map((item) => {
                  const room = item as typeof directoryData.aulas[0];
                  return (
                    <div
                      key={room.name}
                      onClick={() => handleSelect('aulas', room.name)}
                      className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-cyan-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-900 font-bold font-mono text-xs flex items-center justify-center border border-cyan-200 shrink-0">
                              {room.name.slice(0, 3)}
                            </span>
                            <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-800 transition-colors font-display">
                              Aula {room.name}
                            </h3>
                          </div>
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
                            {formatDurationHours(room.totalMinutes)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {room.building && <span>Edificio {room.building}</span>}
                          {room.capacity && <span>• Cap. {room.capacity} est.</span>}
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-medium text-slate-600">
                          {room.subjects.size} materias asignadas
                        </span>

                        <span className="flex items-center gap-1 text-cyan-700 font-semibold group-hover:translate-x-0.5 transition-transform">
                          <span>Ver Horario</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              {/* ASIGNATURAS ITEMS */}
              {activeCategory === 'asignaturas' && (
                filteredList.map((item) => {
                  const subj = item as typeof directoryData.asignaturas[0];
                  return (
                    <div
                      key={subj.name}
                      onClick={() => handleSelect('asignaturas', subj.name)}
                      className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-cyan-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-cyan-800 transition-colors font-display line-clamp-2">
                            {subj.name}
                          </h3>
                          {subj.claveUA && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                              {subj.claveUA}
                            </span>
                          )}
                        </div>

                        {subj.professors.size > 0 && (
                          <p className="text-xs text-slate-500 line-clamp-1">
                            Docente(s): {Array.from(subj.professors).join(', ')}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-medium text-slate-600">
                          {subj.groups.size} {subj.groups.size === 1 ? 'grupo' : 'grupos'} • {formatDurationHours(subj.totalMinutes)}
                        </span>

                        <span className="flex items-center gap-1 text-cyan-700 font-semibold group-hover:translate-x-0.5 transition-transform">
                          <span>Ver Horario</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              {/* GRUPOS ITEMS */}
              {activeCategory === 'grupos' && (
                filteredList.map((item) => {
                  const grp = item as typeof directoryData.grupos[0];
                  return (
                    <div
                      key={grp.name}
                      onClick={() => handleSelect('grupos', grp.name)}
                      className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-cyan-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-800 transition-colors font-display">
                            Grupo {grp.name}
                          </h3>
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 shrink-0">
                            {formatDurationHours(grp.totalMinutes)}
                          </span>
                        </div>

                        {grp.programs.size > 0 && (
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {Array.from(grp.programs).join(' • ')}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-medium text-slate-600">
                          {grp.subjects.size} asignaturas
                        </span>

                        <span className="flex items-center gap-1 text-cyan-700 font-semibold group-hover:translate-x-0.5 transition-transform">
                          <span>Ver Horario</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Mostrando {filteredList.length} elementos en {activeCategory}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
