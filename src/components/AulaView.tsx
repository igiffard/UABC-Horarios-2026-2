import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  BookOpen, 
  Clock, 
  User, 
  AlertTriangle, 
  Sparkles, 
  MapPin, 
  Layers, 
  Printer, 
  Mail, 
  Map, 
  Filter, 
  ChevronRight, 
  Check, 
  Users,
  Eye,
  Info
} from 'lucide-react';
import { ScheduleSession, DirectoryCategory } from '../types';
import { AutocompleteInput } from './AutocompleteInput';
import { WeeklyCalendar } from './WeeklyCalendar';
import { formatDurationHours } from '../utils/normalizer';
import { 
  CAMPUS_BUILDINGS, 
  ROOM_CATALOG, 
  CampusBuildingInfo, 
  getClassroomDetails, 
  getBuildingForClassroom,
  getBuildingById 
} from '../data/campusBuildings';
import { BuildingProfessorsSelector } from './BuildingProfessorsSelector';

interface AulaViewProps {
  sessions: ScheduleSession[];
  classrooms: string[];
  onSelectSession: (session: ScheduleSession) => void;
  onOpenDirectory?: (category: DirectoryCategory) => void;
  onOpenPrintModal?: (targetType?: 'aula', targetName?: string) => void;
  onOpenMapModal?: (buildingId?: string) => void;
  onSelectTeacher?: (teacherName: string) => void;
  selectedEntity?: string;
}

export const AulaView: React.FC<AulaViewProps> = ({
  sessions,
  classrooms,
  onSelectSession,
  onOpenDirectory,
  onOpenPrintModal,
  onOpenMapModal,
  onSelectTeacher,
  selectedEntity
}) => {
  const [selectedRoom, setSelectedRoom] = useState<string>(selectedEntity || classrooms[0] || '');
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>('ALL'); // 'ALL' or 'E-21', etc.
  const [showBuildingProfessors, setShowBuildingProfessors] = useState<boolean>(false);

  React.useEffect(() => {
    if (selectedEntity) {
      setSelectedRoom(selectedEntity);
      setFilterQuery('');
      // Auto-detect building for this room
      const b = getBuildingForClassroom(selectedEntity);
      if (b) {
        setSelectedBuildingFilter(b.id);
      }
    }
  }, [selectedEntity]);

  // Current active building if filtered
  const activeBuilding = useMemo(() => {
    if (selectedBuildingFilter === 'ALL') return null;
    return getBuildingById(selectedBuildingFilter);
  }, [selectedBuildingFilter]);

  // Available classrooms filtered by the selected building
  const filteredClassroomsList = useMemo(() => {
    if (!activeBuilding) return classrooms;
    const bRooms = new Set(activeBuilding.rooms.map(r => r.toUpperCase()));
    return classrooms.filter(c => {
      if (bRooms.has(c.toUpperCase())) return true;
      const details = getClassroomDetails(c);
      return details.buildingId === activeBuilding.id || details.buildingNumber === activeBuilding.number;
    });
  }, [classrooms, activeBuilding]);

  // If building changes and selectedRoom is not in it, switch to the first room of that building
  const handleSelectBuilding = (buildingId: string) => {
    setSelectedBuildingFilter(buildingId);
    if (buildingId === 'ALL') {
      setShowBuildingProfessors(false);
      return;
    }

    const b = getBuildingById(buildingId);
    if (b) {
      // Find matching room from classrooms array
      const matchingRoom = classrooms.find(c => b.rooms.some(r => r.toUpperCase() === c.toUpperCase()));
      if (matchingRoom) {
        setSelectedRoom(matchingRoom);
      } else if (b.rooms.length > 0) {
        setSelectedRoom(b.rooms[0]);
      }
      setShowBuildingProfessors(true); // Open professors drawer for easy Gmail copying
    }
  };

  // Filter sessions for selected classroom
  const roomSessions = useMemo(() => {
    if (!selectedRoom) return [];
    return sessions.filter(s => s.aula === selectedRoom);
  }, [sessions, selectedRoom]);

  // Classroom catalog details
  const roomDetails = useMemo(() => {
    if (!selectedRoom) return null;
    return getClassroomDetails(selectedRoom);
  }, [selectedRoom]);

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
      edificio: sample?.edificio || roomDetails?.buildingNumber || '',
      capacidad: sample?.capacidadSalon || sample?.capacidad || null,
      conflictsCount,
      correctionsCount,
      overcapacityCount
    };
  }, [roomSessions, roomDetails]);

  return (
    <div className="space-y-6">
      
      {/* Building Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-900 text-cyan-300 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span>Filtro por Edificio / Inmueble FCM</span>
                {activeBuilding && (
                  <span className="text-[10px] bg-cyan-100 text-cyan-800 font-mono px-2 py-0.2 rounded-full font-bold">
                    {activeBuilding.id}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500">
                Selecciona un edificio para filtrar sus aulas y consultar su plantilla docente para Gmail.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenMapModal && (
              <button
                type="button"
                onClick={() => onOpenMapModal(activeBuilding?.id || 'E-21')}
                className="px-3 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Map className="w-3.5 h-3.5 text-cyan-600" />
                <span>Ver Mapa Interactivo del Campus</span>
              </button>
            )}

            {activeBuilding && (
              <button
                type="button"
                onClick={() => setShowBuildingProfessors(!showBuildingProfessors)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border ${
                  showBuildingProfessors
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-cyan-500" />
                <span>{showBuildingProfessors ? 'Ocultar Docentes' : `Docentes de ${activeBuilding.id} (Gmail)`}</span>
              </button>
            )}
          </div>

        </div>

        {/* Building Horizontal Scrollable Pills */}
        <div className="pt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => handleSelectBuilding('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedBuildingFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas las Aulas ({classrooms.length})
          </button>

          {CAMPUS_BUILDINGS.map(b => {
            const isSelected = selectedBuildingFilter === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => handleSelectBuilding(b.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{b.id}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                }`}>
                  {b.rooms.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Building Professors Drawer (if active building selected) */}
      {activeBuilding && showBuildingProfessors && (
        <div className="animate-in fade-in slide-in-from-top-3 duration-200">
          <BuildingProfessorsSelector
            building={activeBuilding}
            sessions={sessions}
            onSelectTeacher={onSelectTeacher}
            onSelectRoom={(roomCode) => setSelectedRoom(roomCode)}
          />
        </div>
      )}

      {/* Search & Selection Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs search-container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl flex-1">
            <AutocompleteInput
              id="search-aula"
              label={activeBuilding ? `Seleccionar Aula en ${activeBuilding.name}` : "Buscar o Seleccionar Aula / Espacio"}
              placeholder={activeBuilding ? `Aulas de ${activeBuilding.id} (ej. ${activeBuilding.rooms.slice(0, 3).join(', ')})...` : "Escribe el código del aula (ej. S1, GEO, ESP, CPB, LFQ)..."}
              options={filteredClassroomsList}
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
              countBadge={filteredClassroomsList.length}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activeBuilding && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-500">Salones en {activeBuilding.id}:</span>
                {activeBuilding.rooms.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRoom(r)}
                    className={`px-2 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedRoom === r
                        ? 'bg-cyan-700 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

            {onOpenDirectory && (
              <button
                type="button"
                onClick={() => onOpenDirectory('aulas')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-200 shadow-2xs shrink-0 cursor-pointer h-[42px]"
              >
                <Layers className="w-4 h-4 text-cyan-700" />
                <span>Catálogo General</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Classroom Summary Header */}
      {selectedRoom && stats && (
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-800 rounded-2xl p-6 text-white shadow-md border border-cyan-900/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                  {selectedRoom}
                </span>

                {roomDetails && (
                  <span className="text-xs text-slate-200 font-semibold">
                    {roomDetails.name}
                  </span>
                )}

                {roomDetails && roomDetails.buildingId !== 'OTRO' && (
                  <button
                    type="button"
                    onClick={() => handleSelectBuilding(roomDetails.buildingId)}
                    className="text-xs text-cyan-300 hover:text-white bg-cyan-900/60 px-2 py-0.5 rounded-md border border-cyan-700/60 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{roomDetails.buildingName}</span>
                    {roomDetails.floor && <span className="text-cyan-400 font-mono">({roomDetails.floor})</span>}
                  </button>
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

              <h2 className="text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2 flex-wrap">
                <span>Aula: {selectedRoom}</span>
                {roomDetails?.name && roomDetails.name !== `Aula ${selectedRoom}` && (
                  <span className="text-base text-cyan-300 font-normal">
                    — {roomDetails.name}
                  </span>
                )}
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

              {onOpenPrintModal && (
                <button
                  type="button"
                  onClick={() => onOpenPrintModal('aula', selectedRoom)}
                  title="Imprimir u obtener PDF del horario de este salón"
                  className="px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/30 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Aula</span>
                </button>
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
          title={`Ocupación de Aula: ${selectedRoom}${roomDetails?.name ? ` — ${roomDetails.name}` : ''}`}
          subtitle={roomDetails ? `${roomDetails.buildingName} • ${roomDetails.floor || 'Planta Baja'}` : 'Haz clic en cualquier clase para consultar detalles'}
          highlightType="aula"
          onOpenPrintModal={() => onOpenPrintModal?.('aula', selectedRoom)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Selecciona un Aula o Espacio</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Utiliza el filtro de edificio superior o el buscador para ver las clases y horarios asignados a este salón.
          </p>
        </div>
      )}

    </div>
  );
};
