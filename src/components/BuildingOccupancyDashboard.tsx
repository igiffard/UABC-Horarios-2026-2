import React, { useState, useMemo } from 'react';
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
import {
  Building2,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  Filter,
  BarChart3
} from 'lucide-react';
import { ScheduleSession, DayName } from '../types';
import { CONFIG } from '../config';
import { CAMPUS_BUILDINGS, getClassroomDetails, CampusBuildingInfo } from '../data/campusBuildings';

interface BuildingOccupancyDashboardProps {
  sessions: ScheduleSession[];
  classrooms: string[];
  onSelectClassroom?: (room: string) => void;
  onNavigateToAvailableRooms?: (day: DayName, start: string, end: string) => void;
}

const DAYS: DayName[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// Operating day: 07:00 to 21:00 (14 hours = 840 min)
const DAY_START_HOUR = 7;
const DAY_END_HOUR = 21;
const OPERATING_HOURS_PER_DAY = DAY_END_HOUR - DAY_START_HOUR; // 14 hours
const OPERATING_MINUTES_PER_DAY = OPERATING_HOURS_PER_DAY * 60; // 840 minutes

const DAY_COLORS: Record<DayName, string> = {
  'Lunes': '#0284c7',    // Sky 600
  'Martes': '#0d9488',   // Teal 600
  'Miércoles': '#059669',// Emerald 600
  'Jueves': '#d97706',   // Amber 600
  'Viernes': '#8b5cf6',  // Violet 500
  'Sábado': '#64748b',
  'Domingo': '#94a3b8'
};

export const BuildingOccupancyDashboard: React.FC<BuildingOccupancyDashboardProps> = ({
  sessions,
  classrooms,
  onSelectClassroom,
  onNavigateToAvailableRooms
}) => {
  const [selectedDay, setSelectedDay] = useState<DayName | 'TODOS'>('TODOS');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('ALL');
  const [viewMetric, setViewMetric] = useState<'percentage' | 'hours'>('percentage');

  // Filter only physical classroom sessions (exclude field trips, virtual, and unscheduled)
  const physicalSessions = useMemo(() => {
    return sessions.filter(s =>
      s.aula &&
      s.aula !== 'Sin Aula Asignada' &&
      !s.aula.toUpperCase().includes('CAMPO') &&
      s.aula !== 'VIR'
    );
  }, [sessions]);

  // Map each classroom to its building
  const buildingRoomsMap = useMemo(() => {
    const map = new Map<string, { info: CampusBuildingInfo | null; rooms: Set<string> }>();

    // Seed with known campus buildings that have physical rooms
    for (const b of CAMPUS_BUILDINGS) {
      if (b.id !== 'VIRTUAL') {
        map.set(b.id, { info: b, rooms: new Set() });
      }
    }

    // Populate active classrooms
    for (const s of physicalSessions) {
      const roomDetail = getClassroomDetails(s.aula);
      const bId = roomDetail.buildingId || 'OTRO';
      if (!map.has(bId)) {
        map.set(bId, { info: null, rooms: new Set() });
      }
      map.get(bId)!.rooms.add(s.aula);
    }

    // Also include any classrooms from the provided list
    for (const r of classrooms) {
      if (r !== 'Sin Aula Asignada' && !r.toUpperCase().includes('CAMPO') && r !== 'VIR') {
        const detail = getClassroomDetails(r);
        const bId = detail.buildingId || 'OTRO';
        if (map.has(bId)) {
          map.get(bId)!.rooms.add(r);
        }
      }
    }

    return map;
  }, [physicalSessions, classrooms]);

  // Calculate daily occupancy statistics per building
  const buildingStats = useMemo(() => {
    const list: Array<{
      buildingId: string;
      buildingName: string;
      shortName: string;
      color: string;
      roomCount: number;
      rooms: string[];
      dayStats: Record<DayName, { occupiedMinutes: number; percentage: number; occupiedHours: number }>;
      avgPercentage: number;
      totalOccupiedMinutes: number;
      peakHour: { hour: string; count: number; pct: number };
    }> = [];

    buildingRoomsMap.forEach((entry, bId) => {
      const roomCount = entry.rooms.size;
      if (roomCount === 0) return;

      const roomsArr: string[] = ([...entry.rooms] as string[]).sort();
      const bInfo = entry.info;
      const bName = bInfo ? bInfo.name : `Edificio ${bId}`;
      const shortName = bInfo ? (bInfo.number ? `E-${bInfo.number}` : bInfo.id) : bId;
      const color = bInfo?.color || '#0891b2';

      const totalDailyCapacityMin = roomCount * OPERATING_MINUTES_PER_DAY;
      const dayStats: Record<string, any> = {};
      let totalOccupiedMin = 0;

      for (const day of DAYS) {
        const daySessions = physicalSessions.filter(s => s.dia === day && entry.rooms.has(s.aula));
        const occupiedMin = daySessions.reduce((acc, s) => {
          // Clamp to operating hours
          const start = Math.max(DAY_START_HOUR * 60, s.startMinutes);
          const end = Math.min(DAY_END_HOUR * 60, s.endMinutes);
          return acc + Math.max(0, end - start);
        }, 0);

        const pct = totalDailyCapacityMin > 0 ? Math.min(100, Math.round((occupiedMin / totalDailyCapacityMin) * 100)) : 0;
        dayStats[day] = {
          occupiedMinutes: occupiedMin,
          occupiedHours: +(occupiedMin / 60).toFixed(1),
          percentage: pct
        };
        totalOccupiedMin += occupiedMin;
      }

      // Compute peak hour for this building across all weekdays
      let maxHour = '10:00';
      let maxHourRooms = 0;
      for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) {
        const hStart = h * 60;
        const hEnd = (h + 1) * 60;
        // Average active rooms in this hour
        let sumActive = 0;
        for (const day of DAYS) {
          const activeSessions = physicalSessions.filter(s =>
            s.dia === day &&
            entry.rooms.has(s.aula) &&
            s.startMinutes < hEnd &&
            s.endMinutes > hStart
          );
          sumActive += new Set(activeSessions.map(s => s.aula)).size;
        }
        const avgActive = sumActive / DAYS.length;
        if (avgActive > maxHourRooms) {
          maxHourRooms = avgActive;
          maxHour = `${h.toString().padStart(2, '0')}:00`;
        }
      }

      const totalPossibleMin = totalDailyCapacityMin * DAYS.length;
      const avgPercentage = totalPossibleMin > 0 ? Math.round((totalOccupiedMin / totalPossibleMin) * 100) : 0;

      list.push({
        buildingId: bId,
        buildingName: bName,
        shortName,
        color,
        roomCount,
        rooms: roomsArr,
        dayStats,
        avgPercentage,
        totalOccupiedMinutes: totalOccupiedMin,
        peakHour: {
          hour: `${maxHour} - ${parseInt(maxHour) + 1}:00`,
          count: Math.round(maxHourRooms),
          pct: roomCount > 0 ? Math.round((maxHourRooms / roomCount) * 100) : 0
        }
      });
    });

    // Sort by average occupancy descending
    return list.sort((a, b) => b.avgPercentage - a.avgPercentage);
  }, [buildingRoomsMap, physicalSessions]);

  // Chart 1 Data: Building Occupancy (either single selected day or comparative all days)
  const buildingChartData = useMemo(() => {
    return buildingStats.map(b => {
      const item: any = {
        name: b.shortName,
        fullName: b.buildingName,
        roomCount: b.roomCount,
        color: b.color,
        peakHour: b.peakHour.hour
      };

      if (selectedDay === 'TODOS') {
        item.avg = b.avgPercentage;
        item.Lunes = viewMetric === 'percentage' ? b.dayStats['Lunes'].percentage : b.dayStats['Lunes'].occupiedHours;
        item.Martes = viewMetric === 'percentage' ? b.dayStats['Martes'].percentage : b.dayStats['Martes'].occupiedHours;
        item.Miércoles = viewMetric === 'percentage' ? b.dayStats['Miércoles'].percentage : b.dayStats['Miércoles'].occupiedHours;
        item.Jueves = viewMetric === 'percentage' ? b.dayStats['Jueves'].percentage : b.dayStats['Jueves'].occupiedHours;
        item.Viernes = viewMetric === 'percentage' ? b.dayStats['Viernes'].percentage : b.dayStats['Viernes'].occupiedHours;
      } else {
        const stats = b.dayStats[selectedDay];
        item.value = viewMetric === 'percentage' ? stats.percentage : stats.occupiedHours;
        item.percentage = stats.percentage;
        item.hours = stats.occupiedHours;
        item.capacityHours = +(b.roomCount * OPERATING_HOURS_PER_DAY).toFixed(1);
      }

      return item;
    });
  }, [buildingStats, selectedDay, viewMetric]);

  // Chart 2 Data: Hourly Peak Usage (07:00 to 21:00)
  const hourlyPeakData = useMemo(() => {
    // Rooms to consider (either all or filtered by building)
    let targetRooms = new Set<string>();
    if (selectedBuildingId === 'ALL') {
      physicalSessions.forEach(s => targetRooms.add(s.aula));
    } else {
      const bInfo = buildingRoomsMap.get(selectedBuildingId);
      if (bInfo) targetRooms = bInfo.rooms;
    }

    const totalRooms = targetRooms.size;
    if (totalRooms === 0) return [];

    const hoursData: Array<{
      hour: string;
      hourLabel: string;
      occupiedRooms: number;
      percentage: number;
      isPeak: boolean;
      status: 'Pico' | 'Moderado' | 'Valle';
      color: string;
    }> = [];

    const targetDays = selectedDay === 'TODOS' ? DAYS : [selectedDay];

    for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) {
      const hStart = h * 60;
      const hEnd = (h + 1) * 60;
      const hourStr = `${h.toString().padStart(2, '0')}:00`;
      const hourLabel = `${hourStr} - ${(h + 1).toString().padStart(2, '0')}:00`;

      let sumOccupied = 0;
      for (const d of targetDays) {
        const activeInHour = physicalSessions.filter(s =>
          s.dia === d &&
          targetRooms.has(s.aula) &&
          s.startMinutes < hEnd &&
          s.endMinutes > hStart
        );
        const occupiedSet = new Set(activeInHour.map(s => s.aula));
        sumOccupied += occupiedSet.size;
      }

      const avgOccupied = sumOccupied / targetDays.length;
      const pct = Math.round((avgOccupied / totalRooms) * 100);

      // Define Peak thresholds:
      // In whole campus, > 28% simultaneous room usage is a peak. In a single building, > 50% is a peak.
      const peakThreshold = selectedBuildingId === 'ALL' ? 28 : 50;
      const moderateThreshold = selectedBuildingId === 'ALL' ? 20 : 30;

      let status: 'Pico' | 'Moderado' | 'Valle' = 'Valle';
      let color = '#10b981'; // Emerald 500

      if (pct >= peakThreshold) {
        status = 'Pico';
        color = '#ef4444'; // Rose / Red 500
      } else if (pct >= moderateThreshold) {
        status = 'Moderado';
        color = '#f59e0b'; // Amber 500
      }

      hoursData.push({
        hour: hourStr,
        hourLabel,
        occupiedRooms: Math.round(avgOccupied),
        percentage: pct,
        isPeak: pct >= peakThreshold,
        status,
        color
      });
    }

    return hoursData;
  }, [physicalSessions, buildingRoomsMap, selectedBuildingId, selectedDay]);

  // Overall KPI Highlights
  const kpis = useMemo(() => {
    // 1. Highest demand building
    const topBuilding = buildingStats[0] || null;

    // 2. Highest peak hour across current scope
    let peakHour = hourlyPeakData[0];
    for (const h of hourlyPeakData) {
      if (!peakHour || h.percentage > peakHour.percentage) {
        peakHour = h;
      }
    }

    // 3. Best valley hour (lowest occupancy between 08:00 and 19:00)
    const middayHours = hourlyPeakData.filter(h => {
      const hourNum = parseInt(h.hour);
      return hourNum >= 8 && hourNum <= 18;
    });
    let valleyHour = middayHours[0];
    for (const h of middayHours) {
      if (!valleyHour || h.percentage < valleyHour.percentage) {
        valleyHour = h;
      }
    }

    // 4. Monitored classrooms and buildings
    const totalRooms = new Set(physicalSessions.map(s => s.aula)).size;
    const totalBuildings = buildingStats.length;

    return {
      topBuilding,
      peakHour,
      valleyHour,
      totalRooms,
      totalBuildings
    };
  }, [buildingStats, hourlyPeakData, physicalSessions]);

  return (
    <div className="space-y-6">

      {/* Header & Controls Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-900 text-white shadow-xs">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                  <span>Dashboard de Ocupación por Edificio y Horas Pico</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                    FCM Ensenada
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Monitoreo de carga académica en aulas, laboratorios y centros de cómputo para detectar saturación y disponibilidad.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Filters Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Day Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedDay('TODOS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedDay === 'TODOS'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Promedio
              </button>
              {DAYS.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedDay === day
                      ? 'bg-white text-cyan-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>

            {/* Building Filter for Hourly Breakdown */}
            <select
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="ALL">Todo el Campus (11 Edificios)</option>
              {buildingStats.map(b => (
                <option key={b.buildingId} value={b.buildingId}>
                  {b.shortName} — {b.buildingName.replace(/^Edificio\s*\d+\s*\(?|\)?$/gi, '')} ({b.roomCount} aulas)
                </option>
              ))}
            </select>

            {/* Metric Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMetric('percentage')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMetric === 'percentage'
                    ? 'bg-white text-cyan-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Mostrar porcentaje de ocupación respecto al total disponible"
              >
                % Ocupación
              </button>
              <button
                type="button"
                onClick={() => setViewMetric('hours')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMetric === 'hours'
                    ? 'bg-white text-cyan-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Mostrar horas totales de clase impartidas"
              >
                Horas / Día
              </button>
            </div>
          </div>
        </div>

        {/* 4 KPI Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          {/* KPI 1: Hora Pico */}
          <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200/80 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0 mt-0.5">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                Hora Pico Máxima
              </div>
              <div className="text-base font-black text-rose-950 font-mono mt-0.5">
                {kpis.peakHour ? kpis.peakHour.hourLabel : '—'}
              </div>
              <div className="text-xs text-rose-800 font-medium">
                {kpis.peakHour ? `${kpis.peakHour.percentage}% de aulas ocupadas (${kpis.peakHour.occupiedRooms} simultáneas)` : ''}
              </div>
            </div>
          </div>

          {/* KPI 2: Edificio Mayor Ocupación */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Edificio Mayor Carga
              </div>
              <div className="text-base font-black text-amber-950 truncate mt-0.5">
                {kpis.topBuilding ? `${kpis.topBuilding.shortName}` : '—'}
              </div>
              <div className="text-xs text-amber-800 font-medium truncate">
                {kpis.topBuilding ? `${kpis.topBuilding.avgPercentage}% prom. semanal (${kpis.topBuilding.roomCount} aulas)` : ''}
              </div>
            </div>
          </div>

          {/* KPI 3: Franja Valle Recomendada */}
          <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Ventana Despejada (Valle)
              </div>
              <div className="text-base font-black text-emerald-950 font-mono mt-0.5">
                {kpis.valleyHour ? kpis.valleyHour.hourLabel : '—'}
              </div>
              <div className="text-xs text-emerald-800 font-medium">
                {kpis.valleyHour ? `Solo ${kpis.valleyHour.percentage}% ocupación (alta disponibilidad)` : ''}
              </div>
            </div>
          </div>

          {/* KPI 4: Espacios Físicos Monitoreados */}
          <div className="p-3.5 rounded-xl bg-cyan-50/80 border border-cyan-200/80 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-100 text-cyan-800 shrink-0 mt-0.5">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-800">
                Aulas y Lab. Activos
              </div>
              <div className="text-base font-black text-cyan-950 font-mono mt-0.5">
                {kpis.totalRooms} Aulas
              </div>
              <div className="text-xs text-cyan-900 font-medium">
                Distribuidas en {kpis.totalBuildings} edificios del campus
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart 1: Daily Occupancy by Building */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-700" />
              <span>
                {selectedDay === 'TODOS'
                  ? `Comparativa Semanal de Ocupación por Edificio (Lunes a Viernes)`
                  : `Porcentaje de Ocupación por Edificio — Día ${selectedDay}`}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {viewMetric === 'percentage'
                ? 'Porcentaje del horario disponible (07:00 a 21:00) ocupado con clases programadas.'
                : 'Horas acumuladas de clase impartidas en las aulas de cada edificio.'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> &gt; 55% Alta
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> 35-55% Media
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> &lt; 35% Libre
            </span>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="w-full h-80 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            {selectedDay === 'TODOS' ? (
              <BarChart
                data={buildingChartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis
                  unit={viewMetric === 'percentage' ? '%' : 'h'}
                  domain={[0, viewMetric === 'percentage' ? 100 : 'auto']}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const bData = buildingStats.find(b => b.shortName === label);
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 max-w-xs">
                        <div className="font-bold text-sm text-cyan-300">{bData?.buildingName || label}</div>
                        <div className="text-slate-300 text-[11px]">
                          {bData?.roomCount} aulas asignadas: <span className="font-mono text-cyan-200">{bData?.rooms.slice(0, 6).join(', ')}{bData && bData.rooms.length > 6 ? '...' : ''}</span>
                        </div>
                        <div className="text-[11px] text-amber-300 font-semibold">
                          ⚡ Hora pico habitual: {bData?.peakHour.hour}
                        </div>
                        <div className="pt-2 border-t border-slate-800 space-y-1">
                          {payload.map((entry: any) => (
                            <div key={entry.name} className="flex items-center justify-between gap-4">
                              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                                {entry.name}:
                              </span>
                              <span className="font-mono font-bold">
                                {entry.value}{viewMetric === 'percentage' ? '%' : ' hrs'}
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
                {DAYS.map(day => (
                  <Bar
                    key={day}
                    dataKey={day}
                    fill={DAY_COLORS[day]}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={14}
                  />
                ))}
              </BarChart>
            ) : (
              <BarChart
                data={buildingChartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis
                  unit={viewMetric === 'percentage' ? '%' : 'h'}
                  domain={[0, viewMetric === 'percentage' ? 100 : 'auto']}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload;
                    const bData = buildingStats.find(b => b.shortName === label);
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 max-w-xs">
                        <div className="font-bold text-sm text-cyan-300">{item.fullName} ({label})</div>
                        <div className="text-slate-300 text-[11px]">
                          {item.roomCount} aulas activas: <span className="font-mono text-cyan-200">{bData?.rooms.slice(0, 6).join(', ')}{bData && bData.rooms.length > 6 ? '...' : ''}</span>
                        </div>
                        <div className="pt-1.5 border-t border-slate-800 space-y-1 text-slate-200">
                          <div className="flex justify-between">
                            <span>Ocupación el {selectedDay}:</span>
                            <span className="font-bold font-mono text-emerald-400">{item.percentage}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Horas clase impartidas:</span>
                            <span className="font-bold font-mono text-cyan-300">{item.hours} hrs de {item.capacityHours} hrs</span>
                          </div>
                          <div className="flex justify-between text-amber-300">
                            <span>Hora pico de este edificio:</span>
                            <span className="font-mono">{bData?.peakHour.hour}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine
                  y={50}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: '50% Saturación', position: 'top', fill: '#ef4444', fontSize: 10 }}
                />
                <Bar
                  dataKey="value"
                  name={viewMetric === 'percentage' ? '% Ocupación' : 'Horas de Clase'}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                >
                  {buildingChartData.map((entry, index) => {
                    const pct = entry.percentage;
                    let barColor = '#10b981'; // Green
                    if (pct >= 55) barColor = '#ef4444'; // Red
                    else if (pct >= 35) barColor = '#f59e0b'; // Amber
                    return <Cell key={`cell-${index}`} fill={barColor} />;
                  })}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Hourly Peaks (07:00 to 21:00) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>
                Curva Horaria de Saturación de Aulas (07:00 — 21:00 hrs)
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Identificación de horas pico y valles de ocupación para {selectedBuildingId === 'ALL' ? 'todo el campus' : buildingStats.find(b => b.buildingId === selectedBuildingId)?.buildingName} ({selectedDay === 'TODOS' ? 'promedio semanal' : selectedDay}).
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Horas Pico (&gt;= {selectedBuildingId === 'ALL' ? '28%' : '50%'})
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Horas Valle (&lt; {selectedBuildingId === 'ALL' ? '20%' : '30%'})
            </span>
          </div>
        </div>

        {/* Recharts Hourly Bar Chart */}
        <div className="w-full h-72 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={hourlyPeakData}
              margin={{ top: 10, right: 10, left: -10, bottom: 15 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
              />
              <YAxis
                unit="%"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 max-w-xs">
                      <div className="font-bold text-sm text-cyan-300 font-mono">{item.hourLabel}</div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          item.status === 'Pico'
                            ? 'bg-rose-500 text-white'
                            : item.status === 'Moderado'
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-500 text-white'
                        }`}>
                          {item.status === 'Pico' ? '⚡ HORA PICO' : item.status === 'Moderado' ? 'DEMANDA MEDIA' : 'VENTANA VALLE (LIBRE)'}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-800 space-y-1 text-slate-200">
                        <div className="flex justify-between">
                          <span>Aulas ocupadas simultáneamente:</span>
                          <span className="font-bold font-mono text-cyan-300">{item.occupiedRooms} aulas</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Porcentaje de ocupación:</span>
                          <span className="font-bold font-mono text-emerald-400">{item.percentage}%</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="percentage"
                name="% Ocupación de Aulas"
                radius={[5, 5, 0, 0]}
                maxBarSize={28}
              >
                {hourlyPeakData.map((entry, index) => (
                  <Cell key={`cell-hour-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Insights Banner */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Hallazgo clave:</strong> Las horas de mayor demanda son matutinas (<strong>09:00 - 12:00 hrs</strong>) y nocturnas (<strong>19:00 - 21:00 hrs</strong>). La mejor ventana para programar eventos, exámenes o clases adicionales es entre <strong>14:00 y 16:00 hrs</strong>.
            </span>
          </div>

          {onNavigateToAvailableRooms && (
            <button
              type="button"
              onClick={() => onNavigateToAvailableRooms(selectedDay === 'TODOS' ? 'Lunes' : selectedDay, '14:00', '16:00')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-900 text-white font-semibold hover:bg-cyan-800 transition-colors shrink-0 cursor-pointer"
            >
              <span>Buscar aulas libres en franja valle (14:00 - 16:00)</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-cyan-300" />
            </button>
          )}
        </div>
      </div>

      {/* Building Breakdown Cards / Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-700" />
              <span>Desglose Detallado por Edificio del Campus FCM</span>
            </h3>
            <p className="text-xs text-slate-500">
              Resumen de aulas, porcentajes por día y botón para inspeccionar disponibilidad individual.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {buildingStats.length} Edificios
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {buildingStats.map(b => (
            <div
              key={b.buildingId}
              className="p-4 rounded-xl border border-slate-200 hover:border-cyan-300 hover:shadow-xs transition-all bg-white flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono">
                    {b.shortName}
                  </span>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                    b.avgPercentage >= 50
                      ? 'bg-rose-100 text-rose-800'
                      : b.avgPercentage >= 35
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {b.avgPercentage}% prom.
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mt-2 truncate" title={b.buildingName}>
                  {b.buildingName}
                </h4>

                <div className="text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-slate-700">{b.roomCount} aulas: </span>
                  <span className="font-mono text-[11px] text-slate-600">
                    {b.rooms.slice(0, 5).join(', ')}{b.rooms.length > 5 ? ` (+${b.rooms.length - 5})` : ''}
                  </span>
                </div>
              </div>

              {/* Mini day-by-day progress bars */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                  <span>Día</span>
                  <span>Ocupación</span>
                </div>
                {DAYS.map(day => {
                  const pct = b.dayStats[day].percentage;
                  return (
                    <div key={day} className="flex items-center gap-2 text-xs">
                      <span className="w-7 text-[11px] font-medium text-slate-600 shrink-0">
                        {day.slice(0, 3)}
                      </span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pct >= 55
                              ? 'bg-rose-500'
                              : pct >= 35
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-mono text-[11px] font-bold text-slate-700">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Bottom footer: peak hour & quick link */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  ⚡ Pico: <strong className="text-slate-800 font-mono">{b.peakHour.hour}</strong>
                </span>

                {onSelectClassroom && b.rooms.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onSelectClassroom(b.rooms[0])}
                    className="text-cyan-700 hover:text-cyan-900 font-bold inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Ver {b.rooms[0]}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
