import React, { useState, useMemo } from 'react';
import { 
  X, 
  MapPin, 
  Building2, 
  Layers, 
  Users, 
  Search, 
  Compass, 
  Info, 
  ExternalLink, 
  Check, 
  BookOpen, 
  GraduationCap, 
  Eye, 
  Share2,
  Navigation as NavIcon
} from 'lucide-react';
import { ScheduleSession } from '../types';
import { CAMPUS_BUILDINGS, ROOM_CATALOG, CampusBuildingInfo, getClassroomDetails } from '../data/campusBuildings';
import { BuildingProfessorsSelector } from './BuildingProfessorsSelector';

interface CampusMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ScheduleSession[];
  onSelectBuilding?: (buildingNumber: string) => void;
  onSelectRoom?: (roomCode: string) => void;
  onSelectTeacher?: (teacherName: string) => void;
  initialBuildingId?: string;
}

export const CampusMapModal: React.FC<CampusMapModalProps> = ({
  isOpen,
  onClose,
  sessions,
  onSelectBuilding,
  onSelectRoom,
  onSelectTeacher,
  initialBuildingId = 'E-21'
}) => {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(initialBuildingId);
  const [activeTab, setActiveTab] = useState<'map' | 'directory'>('map');
  const [searchDirectoryTerm, setSearchDirectoryTerm] = useState<string>('');
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);

  // Sync initial building
  React.useEffect(() => {
    if (initialBuildingId) {
      setSelectedBuildingId(initialBuildingId);
    }
  }, [initialBuildingId]);

  const selectedBuilding = useMemo(() => {
    return CAMPUS_BUILDINGS.find(b => b.id === selectedBuildingId) || CAMPUS_BUILDINGS[0];
  }, [selectedBuildingId]);

  // Statistics per building from actual sessions
  const buildingStats = useMemo(() => {
    const map = new Map<string, { sessionsCount: number; profsCount: Set<string>; roomsSet: Set<string> }>();
    
    CAMPUS_BUILDINGS.forEach(b => {
      map.set(b.id, { sessionsCount: 0, profsCount: new Set(), roomsSet: new Set(b.rooms.map(r => r.toUpperCase())) });
    });

    sessions.forEach(s => {
      const roomUpper = (s.aula || '').toUpperCase().trim();
      const edif = (s.edificio || '').toUpperCase().trim();
      
      for (const b of CAMPUS_BUILDINGS) {
        const data = map.get(b.id)!;
        if (data.roomsSet.has(roomUpper) || edif === b.number || edif === `E-${b.number}`) {
          data.sessionsCount++;
          if (s.profesor && !s.profesor.toLowerCase().includes('sin asignar')) {
            data.profsCount.add(s.profesor);
          }
        }
      }
    });

    return map;
  }, [sessions]);

  // Search in directory
  const filteredDirectory = useMemo(() => {
    const term = searchDirectoryTerm.toLowerCase().trim();
    const roomsList = Object.values(ROOM_CATALOG);
    
    if (!term) return roomsList;

    return roomsList.filter(r => 
      r.code.toLowerCase().includes(term) ||
      r.name.toLowerCase().includes(term) ||
      r.buildingName.toLowerCase().includes(term) ||
      r.buildingNumber.includes(term) ||
      (r.floor && r.floor.toLowerCase().includes(term))
    );
  }, [searchDirectoryTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-bold shadow-md shadow-cyan-600/30">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">Facultad de Ciencias Marinas • UABC</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.2 rounded-full border border-cyan-800">Oficial</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display">
                Mapa de la Unidad FCM y Ubicación de Aulas / Laboratorios
              </h2>
            </div>
          </div>

          {/* Tab Switcher & Close */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('map')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'map' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Mapa Interactivo
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'directory' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Directorio de Claves ({Object.keys(ROOM_CATALOG).length})
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="sm:hidden bg-slate-100 p-2 flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold text-center ${
              activeTab === 'map' ? 'bg-cyan-700 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            Mapa del Campus
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold text-center ${
              activeTab === 'directory' ? 'bg-cyan-700 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            Directorio de Claves
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'map' ? (
            <div className="p-4 sm:p-6 space-y-6">
              
              {/* Top Banner Guide */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>
                    <strong>Instrucciones:</strong> Haz clic en cualquier edificio del mapa satelital para ver sus aulas, laboratorios y la <strong>plantilla docente completa lista para copiar a Gmail</strong>.
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-500">Ir directo a:</span>
                  {['E-21', 'E-18', 'E-17', 'E-16', 'E-14', 'E-15', 'E-25', 'E-56'].map(id => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedBuildingId(id)}
                      className={`px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
                        selectedBuildingId === id 
                          ? 'bg-cyan-700 text-white shadow-xs' 
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Interactive Map Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* SVG Visual Campus Map (8 cols) */}
                <div className="lg:col-span-7 bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-inner relative overflow-hidden">
                  
                  <div className="flex items-center justify-between mb-2 text-white">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
                      <span>Vista Aérea del Campus Sauzal • FCM UABC</span>
                    </div>
                    <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                      Costa del Pacífico (Sur) 🌊
                    </span>
                  </div>

                  {/* Interactive SVG Rendering */}
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-b from-stone-800 via-stone-850 to-cyan-950 border border-slate-700">
                    <svg
                      viewBox="0 0 720 540"
                      className="w-full h-full select-none"
                    >
                      <defs>
                        {/* Pacific Ocean Gradient */}
                        <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#082f49" />
                          <stop offset="50%" stopColor="#0369a1" />
                          <stop offset="100%" stopColor="#0284c7" />
                        </linearGradient>

                        {/* Ground & Grass */}
                        <radialGradient id="campusGround" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#292524" />
                          <stop offset="100%" stopColor="#1c1917" />
                        </radialGradient>
                      </defs>

                      {/* Base Ground */}
                      <rect x="0" y="0" width="720" height="540" fill="url(#campusGround)" />

                      {/* Ocean Coastline (Bottom & Left-Bottom) */}
                      <path
                        d="M 0,480 Q 180,470 300,490 T 720,510 L 720,540 L 0,540 Z"
                        fill="url(#oceanGrad)"
                        opacity="0.85"
                      />
                      <path
                        d="M 0,485 Q 180,475 300,495 T 720,515"
                        stroke="#38bdf8"
                        strokeWidth="3"
                        fill="none"
                        opacity="0.6"
                        strokeDasharray="8 4"
                      />

                      {/* Central Plaza & Parking Areas */}
                      <rect x="180" y="80" width="160" height="240" rx="8" fill="#44403c" opacity="0.6" />
                      <text x="260" y="200" fill="#a8a29e" fontSize="10" fontWeight="bold" textAnchor="middle">
                        Estacionamiento Central
                      </text>

                      {/* Roads / Pathways */}
                      <path d="M 160,0 L 160,460" stroke="#78716c" strokeWidth="12" strokeDasharray="10 6" opacity="0.4" />
                      <path d="M 0,180 L 360,180" stroke="#78716c" strokeWidth="8" opacity="0.4" />
                      <path d="M 0,340 L 360,340" stroke="#78716c" strokeWidth="8" opacity="0.4" />

                      {/* North Amenities */}
                      {/* Gimnasio */}
                      <g className="cursor-pointer" onClick={() => {}}>
                        <rect x="200" y="15" width="80" height="55" rx="6" fill="#ea580c" opacity="0.85" />
                        <text x="240" y="45" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">
                          Gimnasio
                        </text>
                      </g>

                      {/* Cafetería */}
                      <g className="cursor-pointer">
                        <rect x="290" y="25" width="50" height="45" rx="6" fill="#f97316" opacity="0.85" />
                        <text x="315" y="52" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">
                          Cafetería
                        </text>
                      </g>

                      {/* Sala de Usos Múltiples */}
                      <g className="cursor-pointer">
                        <rect x="195" y="78" width="40" height="35" rx="4" fill="#fb923c" opacity="0.8" />
                        <text x="215" y="96" fill="white" fontSize="7" fontWeight="bold" textAnchor="middle">
                          Usos Múlt.
                        </text>
                      </g>

                      {/* ================= BUILDINGS ================= */}

                      {/* E-12 */}
                      <g className="cursor-pointer">
                        <rect x="115" y="125" width="30" height="28" rx="4" fill="#b91c1c" stroke="#f87171" strokeWidth="1" />
                        <text x="130" y="143" fill="white" fontSize="8" fontWeight="bold" textAnchor="middle">E-12</text>
                      </g>

                      {/* E-13 (Almacén y Buceo) */}
                      <g 
                        className="cursor-pointer transition-transform hover:scale-105"
                        onClick={() => setSelectedBuildingId('E-13')}
                        onMouseEnter={() => setHoveredBuilding('E-13')}
                        onMouseLeave={() => setHoveredBuilding(null)}
                      >
                        <rect
                          x="115"
                          y="160"
                          width="30"
                          height="75"
                          rx="5"
                          fill={selectedBuildingId === 'E-13' ? '#38bdf8' : '#b91c1c'}
                          stroke={selectedBuildingId === 'E-13' ? '#ffffff' : '#f87171'}
                          strokeWidth={selectedBuildingId === 'E-13' ? 2.5 : 1}
                        />
                        <text x="130" y="200" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">E-13</text>
                        <text x="130" y="212" fill="#fecaca" fontSize="6.5" textAnchor="middle">Buceo</text>
                      </g>

                      {/* E-14 (Dirección FCM) */}
                      <g 
                        className="cursor-pointer transition-transform hover:scale-105"
                        onClick={() => setSelectedBuildingId('E-14')}
                        onMouseEnter={() => setHoveredBuilding('E-14')}
                        onMouseLeave={() => setHoveredBuilding(null)}
                      >
                        <rect
                          x="40"
                          y="125"
                          width="65"
                          height="75"
                          rx="6"
                          fill={selectedBuildingId === 'E-14' ? '#38bdf8' : '#b91c1c'}
                          stroke={selectedBuildingId === 'E-14' ? '#ffffff' : '#f87171'}
                          strokeWidth={selectedBuildingId === 'E-14' ? 2.5 : 1.5}
                        />
                        <text x="72" y="155" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">E-14</text>
                        <text x="72" y="170" fill="white" fontSize="8" fontWeight="medium" textAnchor="middle">Dirección</text>
                        <text x="72" y="182" fill="#fecaca" fontSize="7" textAnchor="middle">Cómputo/SC</text>
                      </g>

                      {/* E-15 (Biología y Química) */}
                      <g 
                        className="cursor-pointer transition-transform hover:scale-105"
                        onClick={() => setSelectedBuildingId('E-15')}
                        onMouseEnter={() => setHoveredBuilding('E-15')}
                        onMouseLeave={() => setHoveredBuilding(null)}
                      >
                        <rect
                          x="0"
                          y="110"
                          width="30"
                          height="100"
                          rx="4"
                          fill={selectedBuildingId === 'E-15' ? '#38bdf8' : '#b91c1c'}
                          stroke={selectedBuildingId === 'E-15' ? '#ffffff' : '#f87171'}
                          strokeWidth={selectedBuildingId === 'E-15' ? 2.5 : 1}
                        />
                        <text x="15" y="160" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">E-15</text>
                        <text x="15" y="175" fill="#fecaca" fontSize="6.5" textAnchor="middle">Bio/Q</text>
                      </g>

                      {/* E-16 (Física y Geología) */}
                      <g 
                        className="cursor-pointer transition-transform hover:scale-105"
                        onClick={() => setSelectedBuildingId('E-16')}
                        onMouseEnter={() => setHoveredBuilding('E-16')}
                        onMouseLeave={() => setHoveredBuilding(null)}
                      >
                        <rect
                          x="0"
                          y="225"
                          width="30"
                          height="100"
                          rx="4"
                          fill={selectedBuildingId === 'E-16' ? '#38bdf8' : '#b91c1c'}
                          stroke={selectedBuildingId === 'E-16' ? '#ffffff' : '#f87171'}
                          strokeWidth={selectedBuildingId === 'E-16' ? 2.5 : 1}
                        />
                        <text x="15" y="275" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">E-16</text>
                        <text x="15" y="290" fill="#fecaca" fontSize="6.5" textAnchor="middle">Física</text>
                      </g>

                      {/* E-17 (Aulas Magnas) */}
                      <g 
                        className="cursor-pointer transition-transform hover:scale-105"
                        onClick={() => setSelectedBuildingId('E-17')}
                        onMouseEnter={() => setHoveredBuilding('E-17')}
                        onMouseLeave={() => setHoveredBuilding(null)}
                      >
                        <rect
                          x="45"
                          y="280"
                          width="95"
                          height="35"
                          rx="6"
                          fill={selectedBuildingId === 'E-17' ? '#38bdf8' : '#b91c1c'}
                          stroke={selectedBuildingId === 'E-17' ? '#ffffff' : '#f87171'}
                          strokeWidth={selectedBuildingId === 'E-17' ? 2.5 : 1.5}
                        />
                        <text x="92" y="298" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">E-17</text>
                        <text x="92" y="309" fill="#fecaca" fontSize="7" textAnchor="middle">Aulas Magnas I y II / S8</text>
                      </g>

                      {/* E-18 (Salones 1-7 y Ecotecnias) */}
                      <g 
                        className="cursor-pointer transition-transform hover:scale-105"
                        onClick={() => setSelectedBuildingId('E-18')}
                        onMouseEnter={() => setHoveredBuilding('E-18')}
                        onMouseLeave={() => setHoveredBuilding(null)}
                      >
                        <rect
                          x="45"
                          y="335"
                          width="95"
                          height="40"
                          rx="6"
                          fill={selectedBuildingId === 'E-18' ? '#38bdf8' : '#b91c1c'}
                          stroke={selectedBuildingId === 'E-18' ? '#ffffff' : '#f87171'}
                          strokeWidth={selectedBuildingId === 'E-18' ? 2.5 : 1.5}
                        />
                        <text x="92" y="355" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">E-18</text>
                        <text x="92" y="367" fill="#fecaca" fontSize="7" textAnchor="middle">Aulas Troncales (S1-S7)</text>
                      </g>

                      {/* E-20 (Moluscos y Totoaba) */}
                      <g 
                        className="cursor-pointer transition-transform hover:scale-105"
                        onClick={() => setSelectedBuildingId('E-20')}
                        onMouseEnter={() => setHoveredBuilding('E-20')}
                        onMouseLeave={() => setHoveredBuilding(null)}
                      >
                        <rect
                          x="0"
                          y="390"
                          width="30"
                          height="85"
                          rx="4"
                          fill={selectedBuildingId === 'E-20' ? '#38bdf8' : '#b91c1c'}
                          stroke={selectedBuildingId === 'E-20' ? '#ffffff' : '#f87171'}
                          strokeWidth={selectedBuildingId === 'E-20' ? 2.5 : 1}
                        />
                        <text x="15" y="435" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">E-20</text>
                        <text x="15" y="448" fill="#fecaca" fontSize="6" textAnchor="middle">Moluscos</text>
                      </g>

                      {/* E-41 (Sistemas y Crustáceos) */}
                      <g 
                        className="cursor-pointer transition-transform hover:scale-105"
                        onClick={() => setSelectedBuildingId('E-41')}
                        onMouseEnter={() => setHoveredBuilding('E-41')}
                        onMouseLeave={() => setHoveredBuilding(null)}
                      >
                        <rect
                          x="40"
                          y="420"
                          width="25"
                          height="60"
                          rx="4"
                          fill={selectedBuildingId === 'E-41' ? '#38bdf8' : '#b91c1c'}
                          stroke={selectedBuildingId === 'E-41' ? '#ffffff' : '#f87171'}
                          strokeWidth={selectedBuildingId === 'E-41' ? 2.5 : 1}
                        />
                        <text x="52" y="450" fill="white" fontSize="8" fontWeight="bold" textAnchor="middle">E-41</text>
                        <text x="52" y="462" fill="#fecaca" fontSize="5.5" textAnchor="middle">Sistemas</text>
                      </g>

                      {/* E-21 (Especialidad y Geomática) */}
                      <g 
                        className="cursor-pointer transition-transform hover:scale-105"
                        onClick={() => setSelectedBuildingId('E-21')}
                        onMouseEnter={() => setHoveredBuilding('E-21')}
                        onMouseLeave={() => setHoveredBuilding(null)}
                      >
                        <rect
                          x="68"
                          y="435"
                          width="45"
                          height="35"
                          rx="5"
                          fill={selectedBuildingId === 'E-21' ? '#38bdf8' : '#b91c1c'}
                          stroke={selectedBuildingId === 'E-21' ? '#ffffff' : '#f87171'}
                          strokeWidth={selectedBuildingId === 'E-21' ? 3 : 1.5}
                        />
                        <text x="90" y="452" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">E-21</text>
                        <text x="90" y="463" fill="#fef08a" fontSize="7" fontWeight="bold" textAnchor="middle">ESP / GEO</text>
                      </g>

                      {/* E-25 (IIO - Instituto de Investigaciones Oceanológicas) */}
                      <g 
                        className="cursor-pointer transition-transform hover:scale-105"
                        transform="rotate(-15 360 270)"
                        onClick={() => setSelectedBuildingId('E-25')}
                        onMouseEnter={() => setHoveredBuilding('E-25')}
                        onMouseLeave={() => setHoveredBuilding(null)}
                      >
                        <rect
                          x="320"
                          y="220"
                          width="85"
                          height="100"
                          rx="8"
                          fill={selectedBuildingId === 'E-25' ? '#38bdf8' : '#2563eb'}
                          stroke={selectedBuildingId === 'E-25' ? '#ffffff' : '#60a5fa'}
                          strokeWidth={selectedBuildingId === 'E-25' ? 3 : 1.5}
                        />
                        <text x="362" y="250" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">Instituto de</text>
                        <text x="362" y="262" fill="white" fontSize="8" textAnchor="middle">Investigaciones</text>
                        <text x="362" y="274" fill="white" fontSize="8" textAnchor="middle">Oceanológicas</text>
                        <text x="362" y="292" fill="#bfdbfe" fontSize="12" fontWeight="bold" textAnchor="middle">(E-25)</text>
                      </g>

                      {/* E-56 (Totoaba / Peces) */}
                      <g 
                        className="cursor-pointer transition-transform hover:scale-105"
                        onClick={() => setSelectedBuildingId('E-56')}
                        onMouseEnter={() => setHoveredBuilding('E-56')}
                        onMouseLeave={() => setHoveredBuilding(null)}
                      >
                        <rect
                          x="420"
                          y="160"
                          width="70"
                          height="75"
                          rx="6"
                          fill={selectedBuildingId === 'E-56' ? '#38bdf8' : '#b91c1c'}
                          stroke={selectedBuildingId === 'E-56' ? '#ffffff' : '#f87171'}
                          strokeWidth={selectedBuildingId === 'E-56' ? 2.5 : 1.5}
                        />
                        <text x="455" y="195" fill="white" fontSize="13" fontWeight="bold" textAnchor="middle">E-56</text>
                        <text x="455" y="210" fill="#fecaca" fontSize="7.5" textAnchor="middle">Totoaba A/B</text>
                        <text x="455" y="222" fill="#fecaca" fontSize="6.5" textAnchor="middle">Peces / LPE</text>
                      </g>

                      {/* Campus Footprints & Legends */}
                      <text x="20" y="525" fill="white" fontSize="13" fontStyle="italic" fontFamily="serif" fontWeight="bold">
                        Facultad de Ciencias Marinas
                      </text>

                      {/* Scale Bar */}
                      <line x1="320" y1="525" x2="420" y2="525" stroke="white" strokeWidth="3" />
                      <line x1="320" y1="520" x2="320" y2="530" stroke="white" strokeWidth="3" />
                      <line x1="420" y1="520" x2="420" y2="530" stroke="white" strokeWidth="3" />
                      <text x="370" y="520" fill="white" fontSize="9" textAnchor="middle">80 m</text>

                      {/* North Compass Rose */}
                      <g transform="translate(480, 480) scale(0.6)">
                        <circle cx="0" cy="0" r="30" fill="#1e293b" opacity="0.8" stroke="#94a3b8" strokeWidth="2" />
                        <polygon points="0,-25 6,0 -6,0" fill="#ef4444" />
                        <polygon points="0,25 6,0 -6,0" fill="#cbd5e1" />
                        <polygon points="-25,0 0,6 0,-6" fill="#cbd5e1" />
                        <polygon points="25,0 0,6 0,-6" fill="#cbd5e1" />
                        <text x="0" y="-30" fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">N</text>
                        <text x="0" y="38" fill="white" fontSize="10" textAnchor="middle">S</text>
                        <text x="38" y="4" fill="white" fontSize="10" textAnchor="middle">E</text>
                        <text x="-38" y="4" fill="white" fontSize="10" textAnchor="middle">W</text>
                      </g>

                    </svg>

                    {/* Interactive overlay indicator */}
                    <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs text-[10px] text-cyan-300 px-2.5 py-1 rounded-md border border-slate-700 pointer-events-none">
                      Edificio Activo: <strong>{selectedBuilding.id}</strong>
                    </div>
                  </div>

                  {/* Building Pills Selector underneath map */}
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-slate-400 font-semibold mr-1">Seleccionar:</span>
                    {CAMPUS_BUILDINGS.map(b => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBuildingId(b.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedBuildingId === b.id
                            ? 'bg-cyan-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                        }`}
                      >
                        {b.id}
                      </button>
                    ))}
                  </div>

                </div>

                {/* Building Details & Rooms Card (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  
                  {/* Selected Building Details Box */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                    
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                            {selectedBuilding.id}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {selectedBuilding.rooms.length} aulas registradas
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mt-1 font-display">
                          {selectedBuilding.title}
                        </h3>
                      </div>

                      {onSelectBuilding && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectBuilding(selectedBuilding.number);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                        >
                          <span>Ver en Aulas</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedBuilding.description}
                    </p>

                    {/* Breakdown by Floors */}
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-cyan-700" />
                        <span>Distribución de Aulas y Espacios</span>
                      </h4>

                      {/* Planta Baja */}
                      {selectedBuilding.floors.plantaBaja && selectedBuilding.floors.plantaBaja.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-500 uppercase">Planta Baja:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {selectedBuilding.floors.plantaBaja.map(r => (
                              <div
                                key={r.code}
                                onClick={() => onSelectRoom?.(r.code)}
                                className="p-2 rounded-lg bg-white border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/50 transition-colors cursor-pointer text-xs"
                              >
                                <span className="font-bold text-cyan-900 font-mono">{r.code}</span>
                                <span className="text-slate-600 block text-[11px] leading-tight truncate" title={r.name}>
                                  {r.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Planta Alta */}
                      {selectedBuilding.floors.plantaAlta && selectedBuilding.floors.plantaAlta.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[11px] font-bold text-slate-500 uppercase">Planta Alta:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {selectedBuilding.floors.plantaAlta.map(r => (
                              <div
                                key={r.code}
                                onClick={() => onSelectRoom?.(r.code)}
                                className="p-2 rounded-lg bg-white border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/50 transition-colors cursor-pointer text-xs"
                              >
                                <span className="font-bold text-cyan-900 font-mono">{r.code}</span>
                                <span className="text-slate-600 block text-[11px] leading-tight truncate" title={r.name}>
                                  {r.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Parte Posterior / Otros */}
                      {selectedBuilding.floors.partePosterior && selectedBuilding.floors.partePosterior.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[11px] font-bold text-slate-500 uppercase">Parte Posterior / Talleres:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {selectedBuilding.floors.partePosterior.map(r => (
                              <div
                                key={r.code}
                                onClick={() => onSelectRoom?.(r.code)}
                                className="p-2 rounded-lg bg-white border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/50 transition-colors cursor-pointer text-xs"
                              >
                                <span className="font-bold text-cyan-900 font-mono">{r.code}</span>
                                <span className="text-slate-600 block text-[11px] leading-tight truncate" title={r.name}>
                                  {r.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>

                </div>

              </div>

              {/* Plantilla Docente Activa & Copiado para Gmail (Full Width Section for this building) */}
              <div className="pt-2">
                <BuildingProfessorsSelector
                  building={selectedBuilding}
                  sessions={sessions}
                  onSelectTeacher={(teacher) => {
                    onSelectTeacher?.(teacher);
                    onClose();
                  }}
                  onSelectRoom={(room) => {
                    onSelectRoom?.(room);
                    onClose();
                  }}
                />
              </div>

            </div>
          ) : (
            /* Directory Tab: Full reference list of classrooms with official names */
            <div className="p-4 sm:p-6 space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchDirectoryTerm}
                    onChange={e => setSearchDirectoryTerm(e.target.value)}
                    placeholder="Buscar aula por clave (GEO, LFQ, S1), nombre o edificio..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  {searchDirectoryTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchDirectoryTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-500">
                  Mostrando <strong>{filteredDirectory.length}</strong> de {Object.keys(ROOM_CATALOG).length} espacios
                </div>
              </div>

              {/* Table of Classrooms */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase tracking-wider">Clave</th>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase tracking-wider">Nombre Completo del Aula / Laboratorio</th>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase tracking-wider">Edificio</th>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase tracking-wider">Ubicación / Planta</th>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase tracking-wider">Tipo</th>
                      <th className="px-3.5 py-2.5 text-right font-bold uppercase tracking-wider">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {filteredDirectory.map((room) => (
                      <tr key={room.code} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3.5 py-2 font-mono font-bold text-cyan-900 text-xs">
                          {room.code}
                        </td>
                        <td className="px-3.5 py-2 font-medium text-slate-900">
                          {room.name}
                        </td>
                        <td className="px-3.5 py-2 text-slate-600">
                          <span className="font-semibold text-slate-800">{room.buildingName}</span>
                        </td>
                        <td className="px-3.5 py-2 text-slate-500">
                          {room.floor || 'General'}
                        </td>
                        <td className="px-3.5 py-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {room.type}
                          </span>
                        </td>
                        <td className="px-3.5 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectRoom?.(room.code);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded-md bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-semibold text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>Ver Horario</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">UABC Facultad de Ciencias Marinas</span>
            <span>•</span>
            <span>Unidad Universitaria Ensenada (Sauzal)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
