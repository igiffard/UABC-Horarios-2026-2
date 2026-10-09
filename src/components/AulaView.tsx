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
  Info,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
  Legend
} from 'recharts';
import { ScheduleSession, DirectoryCategory, DayName } from '../types';
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
import { useTheme } from '../context/ThemeContext';

interface AulaViewProps {
  sessions: ScheduleSession[];
  classrooms: string[];
  onSelectSession: (session: ScheduleSession) => void;
  onOpenDirectory?: (category: DirectoryCategory) => void;
  onOpenPrintModal?: (targetType?: 'aula', targetName?: string, initialScope?: 'current' | 'batch' | 'master_matrix') => void;
  onOpenMapModal?: (buildingId?: string) => void;
  onSelectTeacher?: (teacherName: string) => void;
  selectedEntity?: string;
}

// Operating schedule parameters (07:00 to 21:00 = 14 hours / day = 840 min)
const DAY_START_MINUTES = 7 * 60; // 420
const DAY_END_MINUTES = 21 * 60;  // 1260
const OPERATING_HOURS_PER_DAY = 14;
const OPERATING_MINUTES_PER_DAY = 14 * 60; // 840
const WEEKLY_HOURS_PER_ROOM = 70;
const WEEKLY_MINUTES_PER_ROOM = 70 * 60; // 4200
const WEEKDAYS: DayName[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const DAY_COLORS: Record<string, string> = {
  'Lunes': '#0284c7',    // Sky 600
  'Martes': '#0d9488',   // Teal 600
  'Miércoles': '#059669',// Emerald 600
  'Jueves': '#d97706',   // Amber 600
  'Viernes': '#8b5cf6',  // Violet 500
};

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
  const { isDark } = useTheme();
  const [selectedRoom, setSelectedRoom] = useState<string>(selectedEntity || classrooms[0] || '');
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>('ALL'); // 'ALL' or 'E-21', etc.
  const [showBuildingProfessors, setShowBuildingProfessors] = useState<boolean>(false);
  const [chartViewMode, setChartViewMode] = useState<'weekly' | 'daily'>('weekly');
  const [isChartExpanded, setIsChartExpanded] = useState<boolean>(true);

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

  // ==========================================
  // RECHARTS: Weekly Occupancy by Building
  // ==========================================
  const buildingOccupancyList = useMemo(() => {
    // Filter physical sessions (exclude virtual, field trips, etc.)
    const physicalSessions = sessions.filter(s =>
      s.aula &&
      s.aula !== 'Sin Aula Asignada' &&
      s.aula !== 'VIR' &&
      !s.aula.toUpperCase().includes('CAMPO') &&
      WEEKDAYS.includes(s.dia)
    );

    return CAMPUS_BUILDINGS.filter(b => b.id !== 'VIRTUAL').map(b => {
      // Collect all physical rooms associated with this building
      const bRooms = new Set<string>(b.rooms.map(r => r.toUpperCase()));
      for (const r of classrooms) {
        if (r !== 'Sin Aula Asignada' && r !== 'VIR' && !r.toUpperCase().includes('CAMPO')) {
          const detail = getClassroomDetails(r);
          if (detail.buildingId === b.id || detail.buildingNumber === b.number) {
            bRooms.add(r.toUpperCase());
          }
        }
      }

      const roomCount = bRooms.size;
      const weeklyCapacityMin = roomCount * WEEKLY_MINUTES_PER_ROOM;

      // Filter sessions belonging to this building's rooms
      const buildingSessions = physicalSessions.filter(s => 
        bRooms.has(s.aula.toUpperCase()) || 
        getClassroomDetails(s.aula).buildingId === b.id
      );

      let totalOccupiedMin = 0;
      const dayStats: Record<string, { minutes: number; hours: number; percentage: number }> = {
        'Lunes': { minutes: 0, hours: 0, percentage: 0 },
        'Martes': { minutes: 0, hours: 0, percentage: 0 },
        'Miércoles': { minutes: 0, hours: 0, percentage: 0 },
        'Jueves': { minutes: 0, hours: 0, percentage: 0 },
        'Viernes': { minutes: 0, hours: 0, percentage: 0 }
      };

      for (const s of buildingSessions) {
        const start = Math.max(DAY_START_MINUTES, s.startMinutes);
        const end = Math.min(DAY_END_MINUTES, s.endMinutes);
        const dur = Math.max(0, end - start);
        totalOccupiedMin += dur;

        if (dayStats[s.dia]) {
          dayStats[s.dia].minutes += dur;
        }
      }

      const dayCapacityMin = roomCount * OPERATING_MINUTES_PER_DAY;
      for (const day of WEEKDAYS) {
        const dMin = dayStats[day].minutes;
        dayStats[day].hours = +(dMin / 60).toFixed(1);
        dayStats[day].percentage = dayCapacityMin > 0 ? Math.min(100, Math.round((dMin / dayCapacityMin) * 100)) : 0;
      }

      const weeklyPercentage = weeklyCapacityMin > 0 ? Math.min(100, Math.round((totalOccupiedMin / weeklyCapacityMin) * 100)) : 0;
      const occupiedHours = +(totalOccupiedMin / 60).toFixed(1);
      const capacityHours = roomCount * WEEKLY_HOURS_PER_ROOM;

      // Determine peak day
      let peakDay = 'Lunes';
      let peakDayMin = 0;
      for (const day of WEEKDAYS) {
        if (dayStats[day].minutes > peakDayMin) {
          peakDayMin = dayStats[day].minutes;
          peakDay = day;
        }
      }

      return {
        buildingId: b.id,
        name: b.id,
        fullName: b.name,
        shortName: b.id,
        roomCount,
        rooms: Array.from(bRooms),
        weeklyCapacityMin,
        totalOccupiedMin,
        occupiedHours,
        capacityHours,
        weeklyPercentage,
        peakDay,
        dayStats,
        Lunes: dayStats['Lunes'].percentage,
        Martes: dayStats['Martes'].percentage,
        Miércoles: dayStats['Miércoles'].percentage,
        Jueves: dayStats['Jueves'].percentage,
        Viernes: dayStats['Viernes'].percentage
      };
    }).filter(b => b.roomCount > 0);
  }, [sessions, classrooms]);

  // Overall building occupancy metrics
  const occupancyHighlights = useMemo(() => {
    if (buildingOccupancyList.length === 0) return null;

    const sorted = [...buildingOccupancyList].sort((a, b) => b.weeklyPercentage - a.weeklyPercentage);
    const mostOccupied = sorted[0];
    const leastOccupied = sorted[sorted.length - 1];

    let totalCap = 0;
    let totalOcc = 0;
    for (const b of buildingOccupancyList) {
      totalCap += b.weeklyCapacityMin;
      totalOcc += b.totalOccupiedMin;
    }
    const campusAvg = totalCap > 0 ? Math.round((totalOcc / totalCap) * 100) : 0;

    return {
      mostOccupied,
      leastOccupied,
      campusAvg,
      buildingCount: buildingOccupancyList.length
    };
  }, [buildingOccupancyList]);

  return (
    <div className="space-y-6">
      
      {/* Visualización Recharts: Porcentaje de Ocupación Semanal por Edificio */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors duration-200">
        
        {/* Chart Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-cyan-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-900 text-cyan-300 flex items-center justify-center shrink-0 shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
                  <span>Porcentaje de Ocupación Semanal por Edificio</span>
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 font-mono">
                  Recharts • 07:00 a 21:00 h
                </span>
                {selectedBuildingFilter !== 'ALL' && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-900 dark:bg-cyan-600 text-white font-mono animate-in fade-in">
                    Filtro activo: {selectedBuildingFilter}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Capacidad utilizada por cada inmueble del campus FCM durante la semana (haz clic en una barra para filtrar).
              </p>
            </div>
          </div>

          {/* Mode Controls & Collapse Button */}
          <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
            {/* Toggle View Mode */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setChartViewMode('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartViewMode === 'weekly'
                    ? 'bg-white dark:bg-slate-900 text-cyan-900 dark:text-cyan-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Ver porcentaje promedio acumulado de toda la semana"
              >
                % Semanal Global
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartViewMode === 'daily'
                    ? 'bg-white dark:bg-slate-900 text-cyan-900 dark:text-cyan-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Ver desglose comparativo de Lunes a Viernes"
              >
                Desglose Diario (L-V)
              </button>
            </div>

            {/* Expand / Collapse Toggle */}
            <button
              type="button"
              onClick={() => setIsChartExpanded(!isChartExpanded)}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title={isChartExpanded ? "Minimizar gráfico" : "Expandir gráfico"}
              aria-label="Toggle Gráfico"
            >
              {isChartExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Chart Content Area */}
        {isChartExpanded && (
          <div className="p-4 sm:p-5 space-y-4">
            
            {/* Chart Legend & Status Thresholds */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Nivel de saturación semanal:</span>
                <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                  &ge; 50% Alta Demanda
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  35% &ndash; 49% Moderada
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  &lt; 35% Alta Disponibilidad
                </span>
              </div>

              <div className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                * Calculado sobre 70 hrs operativas/semana por aula (07:00 a 21:00 h).
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="w-full h-72 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                {chartViewMode === 'weekly' ? (
                  <BarChart
                    data={buildingOccupancyList}
                    margin={{ top: 15, right: 10, left: -10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: isDark ? '#cbd5e1' : '#334155', fontWeight: 700 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      unit="%"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        const bData = buildingOccupancyList.find(b => b.name === label);
                        if (!bData) return null;

                        const isSelected = selectedBuildingFilter === bData.buildingId;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 text-xs space-y-2 max-w-xs">
                            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                              <span className="font-bold text-sm text-cyan-300">{bData.fullName}</span>
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                                {bData.buildingId}
                              </span>
                            </div>

                            <div className="space-y-1 text-slate-300">
                              <div className="flex justify-between">
                                <span>Aulas asignadas:</span>
                                <span className="font-bold text-white font-mono">{bData.roomCount} aulas</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Horas de clase semanales:</span>
                                <span className="font-bold font-mono text-cyan-300">{bData.occupiedHours} h de {bData.capacityHours} h</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Ocupación semanal:</span>
                                <span className="font-extrabold font-mono text-emerald-400 text-sm">{bData.weeklyPercentage}%</span>
                              </div>
                              <div className="flex justify-between text-amber-300">
                                <span>Día con mayor uso:</span>
                                <span className="font-semibold">{bData.peakDay} ({bData.dayStats[bData.peakDay]?.percentage}%)</span>
                              </div>
                            </div>

                            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-cyan-400" />
                              <span>{isSelected ? '✓ Edificio actualmente filtrado' : '👉 Haz clic en la barra para filtrar sus aulas'}</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <ReferenceLine
                      y={50}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{ value: '50% Saturación', position: 'top', fill: '#ef4444', fontSize: 10, fontWeight: 700 }}
                    />
                    <Bar
                      dataKey="weeklyPercentage"
                      name="% Ocupación Semanal"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={42}
                      onClick={(data: any) => {
                        if (data && data.buildingId) {
                          handleSelectBuilding(data.buildingId);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {buildingOccupancyList.map((entry, index) => {
                        const isSelected = selectedBuildingFilter === entry.buildingId;
                        let barColor = '#10b981'; // Emerald 500
                        if (entry.weeklyPercentage >= 50) barColor = '#ef4444'; // Rose 500
                        else if (entry.weeklyPercentage >= 35) barColor = '#f59e0b'; // Amber 500

                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={isSelected ? '#0891b2' : barColor}
                            stroke={isSelected ? '#0e7490' : 'none'}
                            strokeWidth={isSelected ? 2 : 0}
                            opacity={selectedBuildingFilter !== 'ALL' && !isSelected ? 0.45 : 1}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                ) : (
                  <BarChart
                    data={buildingOccupancyList}
                    margin={{ top: 15, right: 10, left: -10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: isDark ? '#cbd5e1' : '#334155', fontWeight: 700 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      unit="%"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        const bData = buildingOccupancyList.find(b => b.name === label);
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 text-xs space-y-2 max-w-xs">
                            <div className="font-bold text-sm text-cyan-300">{bData?.fullName || label}</div>
                            <div className="text-[11px] text-slate-300">
                              Ocupación diaria por aula ({bData?.roomCount} aulas):
                            </div>
                            <div className="space-y-1 pt-1 border-t border-slate-800">
                              {payload.map((entry: any) => (
                                <div key={entry.name} className="flex items-center justify-between gap-4">
                                  <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                                    {entry.name}:
                                  </span>
                                  <span className="font-mono font-bold text-white">
                                    {entry.value}% ({bData?.dayStats[entry.name]?.hours} h)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                      iconSize={10}
                    />
                    {WEEKDAYS.map(day => (
                      <Bar
                        key={day}
                        dataKey={day}
                        fill={DAY_COLORS[day]}
                        radius={[3, 3, 0, 0]}
                        maxBarSize={12}
                        onClick={(data: any) => {
                          if (data && data.buildingId) {
                            handleSelectBuilding(data.buildingId);
                          }
                        }}
                        className="cursor-pointer"
                      />
                    ))}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Quick KPI Highlights Summary Bar */}
            {occupancyHighlights && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                
                <div 
                  onClick={() => handleSelectBuilding(occupancyHighlights.mostOccupied.buildingId)}
                  className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/50 cursor-pointer hover:bg-rose-100/70 dark:hover:bg-rose-950/50 transition-colors"
                  title="Haz clic para filtrar este edificio"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-rose-700 dark:text-rose-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Mayor Ocupación</span>
                  </div>
                  <div className="text-sm font-black text-rose-950 dark:text-rose-200 font-display mt-0.5 truncate">
                    {occupancyHighlights.mostOccupied.name} — {occupancyHighlights.mostOccupied.weeklyPercentage}%
                  </div>
                  <div className="text-[11px] text-rose-800 dark:text-rose-300/80">
                    {occupancyHighlights.mostOccupied.occupiedHours} h clase / semana
                  </div>
                </div>

                <div 
                  onClick={() => handleSelectBuilding(occupancyHighlights.leastOccupied.buildingId)}
                  className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 cursor-pointer hover:bg-emerald-100/70 dark:hover:bg-emerald-950/50 transition-colors"
                  title="Haz clic para filtrar este edificio"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mayor Disponibilidad</span>
                  </div>
                  <div className="text-sm font-black text-emerald-950 dark:text-emerald-200 font-display mt-0.5 truncate">
                    {occupancyHighlights.leastOccupied.name} — {occupancyHighlights.leastOccupied.weeklyPercentage}%
                  </div>
                  <div className="text-[11px] text-emerald-800 dark:text-emerald-300/80">
                    {occupancyHighlights.leastOccupied.roomCount} aulas con holgura
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/80 dark:border-cyan-800/50">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-cyan-800 dark:text-cyan-400">
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Promedio Campus FCM</span>
                  </div>
                  <div className="text-sm font-black text-cyan-950 dark:text-cyan-200 font-display mt-0.5 font-mono">
                    {occupancyHighlights.campusAvg}% semanal
                  </div>
                  <div className="text-[11px] text-cyan-900 dark:text-cyan-300/80">
                    Uso regular de espacios
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Edificios Monitoreados</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-slate-100 font-display mt-0.5 font-mono">
                    {occupancyHighlights.buildingCount} Inmuebles
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    FCM UABC Ensenada
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </div>

      {/* Building Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs transition-colors duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-900 text-cyan-300 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Filtro por Edificio / Inmueble FCM</span>
                {activeBuilding && (
                  <span className="text-[10px] bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 font-mono px-2 py-0.2 rounded-full font-bold">
                    {activeBuilding.id}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Selecciona un edificio para filtrar sus aulas y consultar su plantilla docente para Gmail.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenMapModal && (
              <button
                type="button"
                onClick={() => onOpenMapModal(activeBuilding?.id || 'E-21')}
                className="px-3 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/70 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Map className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Ver Mapa Interactivo del Campus</span>
              </button>
            )}

            {activeBuilding && (
              <button
                type="button"
                onClick={() => setShowBuildingProfessors(!showBuildingProfessors)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border ${
                  showBuildingProfessors
                    ? 'bg-slate-900 dark:bg-cyan-600 text-white border-slate-900 dark:border-cyan-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
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
                ? 'bg-slate-900 dark:bg-cyan-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Todas las Aulas ({classrooms.length})
          </button>

          {CAMPUS_BUILDINGS.map(b => {
            const isSelected = selectedBuildingFilter === b.id;
            const bData = buildingOccupancyList.find(item => item.buildingId === b.id);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => handleSelectBuilding(b.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/20 ring-2 ring-cyan-500/50'
                    : 'bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>{b.id}</span>
                {bData && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected 
                      ? 'bg-white/20 text-white' 
                      : bData.weeklyPercentage >= 50
                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                      : bData.weeklyPercentage >= 35
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {bData.weeklyPercentage}%
                  </span>
                )}
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {b.rooms.length} sal.
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
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs search-container transition-colors duration-200">
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
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Salones en {activeBuilding.id}:</span>
                {activeBuilding.rooms.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRoom(r)}
                    className={`px-2 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedRoom === r
                        ? 'bg-cyan-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
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
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0 cursor-pointer h-[42px]"
              >
                <Layers className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenPrintModal('aula', selectedRoom, 'current')}
                    title="Imprimir u obtener PDF del horario de este salón"
                    className="px-3 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/30 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Aula</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenPrintModal('aula', undefined, 'batch')}
                    title="Imprimir todas las aulas al mismo tiempo en un solo lote o en sábana concentrada"
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Todas las Aulas</span>
                  </button>
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
          title={`Ocupación de Aula: ${selectedRoom}${roomDetails?.name ? ` — ${roomDetails.name}` : ''}`}
          subtitle={roomDetails ? `${roomDetails.buildingName} • ${roomDetails.floor || 'Planta Baja'}` : 'Haz clic en cualquier clase para consultar detalles'}
          highlightType="aula"
          onOpenPrintModal={() => onOpenPrintModal?.('aula', selectedRoom)}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400">
          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">Selecciona un Aula o Espacio</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            Utiliza el filtro de edificio superior o el buscador para ver las clases y horarios asignados a este salón.
          </p>
        </div>
      )}

    </div>
  );
};
