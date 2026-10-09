import React, { useState, useMemo } from 'react';
import { Clock, Building2, User, Search, CheckCircle2, XCircle, Sparkles, Filter, ChevronRight, BarChart3 } from 'lucide-react';
import { ScheduleSession, DayName } from '../types';
import { CONFIG } from '../config';
import { AutocompleteInput } from './AutocompleteInput';
import { BuildingOccupancyDashboard } from './BuildingOccupancyDashboard';
import {
  getProfessorAvailability,
  getClassroomAvailability,
  findAvailableClassrooms,
  findAvailableProfessors,
  findByMinimumDuration
} from '../utils/availability';

interface DisponibilidadViewProps {
  sessions: ScheduleSession[];
  professors: string[];
  classrooms: string[];
  onSelectSession: (session: ScheduleSession) => void;
}

type SubTab = 'dashboard' | 'buscar_aulas' | 'buscar_profs' | 'aula_dia' | 'prof_dia' | 'duracion_minima';

const DAYS = CONFIG.CALENDAR.DAYS;

// Time options from 07:00 to 21:00 in 30-min steps
const TIME_OPTIONS: string[] = [];
for (let h = 7; h <= 21; h++) {
  const hStr = h.toString().padStart(2, '0');
  TIME_OPTIONS.push(`${hStr}:00`);
  if (h < 21) {
    TIME_OPTIONS.push(`${hStr}:30`);
  }
}

export const DisponibilidadView: React.FC<DisponibilidadViewProps> = ({
  sessions,
  professors,
  classrooms,
  onSelectSession
}) => {
  const [subTab, setSubTab] = useState<SubTab>('dashboard');

  // State for sub-tabs
  const [selectedDay, setSelectedDay] = useState<DayName>('Lunes');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('11:00');
  
  // Specific Entity states
  const [selectedRoom, setSelectedRoom] = useState<string>(classrooms[0] || '');
  const [selectedProf, setSelectedProf] = useState<string>(professors[0] || '');
  const [roomFilterText, setRoomFilterText] = useState<string>('');
  const [profFilterText, setProfFilterText] = useState<string>('');

  // Duration search states
  const [durationEntityType, setDurationEntityType] = useState<'aula' | 'profesor'>('aula');
  const [minDurationMinutes, setMinDurationMinutes] = useState<number>(120); // 2 hours default
  const [onlyAvailableFilter, setOnlyAvailableFilter] = useState<boolean>(true);

  // 1. Disponibilidad de Aula por Día
  const roomAvailability = useMemo(() => {
    if (!selectedRoom) return null;
    return getClassroomAvailability(sessions, selectedRoom, selectedDay);
  }, [sessions, selectedRoom, selectedDay]);

  // 2. Disponibilidad de Profesor por Día
  const profAvailability = useMemo(() => {
    if (!selectedProf) return null;
    return getProfessorAvailability(sessions, selectedProf, selectedDay);
  }, [sessions, selectedProf, selectedDay]);

  // 3. Buscar Aulas Disponibles en Rango
  const availableClassroomsList = useMemo(() => {
    return findAvailableClassrooms(sessions, classrooms, selectedDay, startTime, endTime, roomFilterText);
  }, [sessions, classrooms, selectedDay, startTime, endTime, roomFilterText]);

  // 4. Buscar Profesores Disponibles en Rango
  const availableProfessorsList = useMemo(() => {
    return findAvailableProfessors(sessions, professors, selectedDay, startTime, endTime, profFilterText);
  }, [sessions, professors, selectedDay, startTime, endTime, profFilterText]);

  // 5. Búsqueda por Duración Continua
  const durationResults = useMemo(() => {
    const entityList = durationEntityType === 'aula' ? classrooms : professors;
    return findByMinimumDuration(sessions, entityList, durationEntityType, selectedDay, minDurationMinutes);
  }, [sessions, classrooms, professors, durationEntityType, selectedDay, minDurationMinutes]);

  return (
    <div className="space-y-6">
      
      {/* Sub-navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs search-container transition-colors duration-200">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          
          <button
            type="button"
            onClick={() => setSubTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              subTab === 'dashboard'
                ? 'bg-cyan-900 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dashboard de Ocupación</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              subTab === 'dashboard' ? 'bg-cyan-700 text-cyan-100' : 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300'
            }`}>
              Horas Pico
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('buscar_aulas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              subTab === 'buscar_aulas'
                ? 'bg-cyan-900 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Buscar Aulas Libres</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('buscar_profs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              subTab === 'buscar_profs'
                ? 'bg-cyan-900 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>Buscar Docentes Libres</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('aula_dia')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              subTab === 'aula_dia'
                ? 'bg-cyan-900 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Disponibilidad por Aula</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('prof_dia')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              subTab === 'prof_dia'
                ? 'bg-cyan-900 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Disponibilidad por Docente</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('duracion_minima')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              subTab === 'duracion_minima'
                ? 'bg-cyan-900 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Por Duración Continua</span>
          </button>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 0. DASHBOARD VISUAL DE OCUPACIÓN Y HORAS PICO */}
      {/* ========================================================================= */}
      {subTab === 'dashboard' && (
        <BuildingOccupancyDashboard
          sessions={sessions}
          classrooms={classrooms}
          onSelectClassroom={(room) => {
            setSelectedRoom(room);
            setSubTab('aula_dia');
          }}
          onNavigateToAvailableRooms={(day, start, end) => {
            setSelectedDay(day);
            setStartTime(start);
            setEndTime(end);
            setSubTab('buscar_aulas');
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 1. BUSCAR AULAS LIBRES EN RANGO (Día + Hora Inicio + Hora Fin) */}
      {/* ========================================================================= */}
      {subTab === 'buscar_aulas' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs search-container transition-colors duration-200">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
              <span>Buscar Aulas Disponibles para un Horario Específico</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              
              {/* Day Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Día
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value as DayName)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {DAYS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Hora Inicio
                </label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-800 dark:text-slate-100 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {TIME_OPTIONS.filter(t => t < endTime).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* End Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Hora Fin
                </label>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-800 dark:text-slate-100 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {TIME_OPTIONS.filter(t => t > startTime).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Text filter for room name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Filtrar por Aula
                </label>
                <input
                  type="text"
                  value={roomFilterText}
                  onChange={(e) => setRoomFilterText(e.target.value)}
                  placeholder="Ej. S1, CPB, Edificio 14..."
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

            </div>

            {/* Filter Toggle */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyAvailableFilter}
                  onChange={(e) => setOnlyAvailableFilter(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                />
                <span>Mostrar únicamente aulas completamente libres</span>
              </label>

              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                {availableClassroomsList.filter(r => r.isFree).length} aulas libres de {availableClassroomsList.length}
              </span>
            </div>

          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {availableClassroomsList
              .filter(r => !onlyAvailableFilter || r.isFree)
              .map((item) => (
                <div
                  key={item.classroom}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.isFree
                      ? 'bg-white dark:bg-slate-900 border-emerald-200/80 dark:border-emerald-800/60 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-600'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${item.isFree ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">{item.classroom}</h4>
                    </div>

                    {item.isFree ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Disponible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300">
                        <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        Ocupada
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedDay} de <strong className="font-mono text-slate-700 dark:text-slate-200">{startTime}</strong> a <strong className="font-mono text-slate-700 dark:text-slate-200">{endTime}</strong>
                  </p>

                  {/* Conflicting sessions if occupied */}
                  {!item.isFree && item.conflictsWith.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 space-y-1.5">
                      <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-400 block uppercase">Clase(s) en ese horario:</span>
                      {item.conflictsWith.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => onSelectSession(c)}
                          className="text-xs p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500 cursor-pointer transition-colors"
                        >
                          <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{c.asignatura}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{c.horaInicio} - {c.horaFin} • {c.profesor}</div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. BUSCAR PROFESORES LIBRES EN RANGO (Día + Hora Inicio + Hora Fin) */}
      {/* ========================================================================= */}
      {subTab === 'buscar_profs' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs search-container transition-colors duration-200">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
              <span>Buscar Docentes Disponibles para un Horario Específico</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              
              {/* Day Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Día
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value as DayName)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {DAYS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Hora Inicio
                </label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-800 dark:text-slate-100 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {TIME_OPTIONS.filter(t => t < endTime).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* End Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Hora Fin
                </label>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-800 dark:text-slate-100 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {TIME_OPTIONS.filter(t => t > startTime).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Text filter for prof name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Filtrar Docente
                </label>
                <input
                  type="text"
                  value={profFilterText}
                  onChange={(e) => setProfFilterText(e.target.value)}
                  placeholder="Nombre o apellido..."
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyAvailableFilter}
                  onChange={(e) => setOnlyAvailableFilter(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                />
                <span>Mostrar únicamente docentes disponibles</span>
              </label>

              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                {availableProfessorsList.filter(p => p.isFree).length} docentes libres de {availableProfessorsList.length}
              </span>
            </div>

          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {availableProfessorsList
              .filter(p => !onlyAvailableFilter || p.isFree)
              .map((item) => (
                <div
                  key={item.professor}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.isFree
                      ? 'bg-white dark:bg-slate-900 border-emerald-200/80 dark:border-emerald-800/60 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-600'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className={`p-2 rounded-xl shrink-0 ${item.isFree ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                        <User className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{item.professor}</h4>
                    </div>

                    {item.isFree ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        Libre
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 shrink-0">
                        <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        Ocupado
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedDay} • <strong className="font-mono text-slate-700 dark:text-slate-200">{startTime} - {endTime}</strong>
                  </p>

                  {!item.isFree && item.conflictsWith.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 space-y-1.5">
                      <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-400 block uppercase">Impartiendo en ese horario:</span>
                      {item.conflictsWith.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => onSelectSession(c)}
                          className="text-xs p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500 cursor-pointer transition-colors"
                        >
                          <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{c.asignatura}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{c.horaInicio} - {c.horaFin} • Aula: {c.aula}</div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DISPONIBILIDAD POR AULA (Bloques ocupados e intervalos libres) */}
      {/* ========================================================================= */}
      {subTab === 'aula_dia' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs search-container transition-colors duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AutocompleteInput
                id="disp-aula-select"
                label="Seleccionar Aula"
                placeholder="Escribe el código de aula..."
                options={classrooms}
                value={selectedRoom}
                onChange={setSelectedRoom}
                onSelect={setSelectedRoom}
                icon={Building2}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Día de Consulta
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {DAYS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDay(d)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedDay === d
                          ? 'bg-cyan-900 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {roomAvailability && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Free Intervals Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-base">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Intervalos Libres ({roomAvailability.freeIntervals.length})</span>
                  </div>
                  <span className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                    {selectedRoom} • {selectedDay}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {roomAvailability.freeIntervals.map((slot, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <div className="text-sm font-bold font-mono text-emerald-950 dark:text-emerald-200">
                            {slot.start} — {slot.end}
                          </div>
                          <span className="text-xs text-emerald-700 dark:text-emerald-400">Espacio disponible para reserva</span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg bg-emerald-200/70 dark:bg-emerald-900/70 text-emerald-900 dark:text-emerald-200 font-bold text-xs font-mono">
                        {slot.durationHours} hrs continuas
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Occupied Sessions Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-base">
                    <XCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <span>Sesiones Ocupadas ({roomAvailability.occupiedSessions.length})</span>
                  </div>
                  <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full">
                    {selectedDay}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {roomAvailability.occupiedSessions.length > 0 ? (
                    roomAvailability.occupiedSessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => onSelectSession(session)}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-400 cursor-pointer transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800">
                            {session.horaInicio} - {session.horaFin}
                          </span>
                          {session.grupo && <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Grupo {session.grupo}</span>}
                        </div>
                        <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">{session.asignatura}</h5>
                        <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{session.profesor || 'Por asignar'}</span>
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      El aula se encuentra 100% libre durante toda la jornada de este día.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DISPONIBILIDAD POR PROFESOR (Bloques ocupados e intervalos libres) */}
      {/* ========================================================================= */}
      {subTab === 'prof_dia' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs search-container transition-colors duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AutocompleteInput
                id="disp-prof-select"
                label="Seleccionar Docente"
                placeholder="Escribe el nombre del docente..."
                options={professors}
                value={selectedProf}
                onChange={setSelectedProf}
                onSelect={setSelectedProf}
                icon={User}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Día de Consulta
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {DAYS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDay(d)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedDay === d
                          ? 'bg-cyan-900 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {profAvailability && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Free Intervals Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-base">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Tiempos Libres ({profAvailability.freeIntervals.length})</span>
                  </div>
                  <span className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                    {selectedDay}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {profAvailability.freeIntervals.map((slot, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <div className="text-sm font-bold font-mono text-emerald-950 dark:text-emerald-200">
                            {slot.start} — {slot.end}
                          </div>
                          <span className="text-xs text-emerald-700 dark:text-emerald-400">Docente disponible</span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg bg-emerald-200/70 dark:bg-emerald-900/70 text-emerald-900 dark:text-emerald-200 font-bold text-xs font-mono">
                        {slot.durationHours} hrs libres
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Occupied Sessions Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-base">
                    <XCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <span>Actividades Asignadas ({profAvailability.occupiedSessions.length})</span>
                  </div>
                  <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full">
                    {selectedDay}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {profAvailability.occupiedSessions.length > 0 ? (
                    profAvailability.occupiedSessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => onSelectSession(session)}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-400 cursor-pointer transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800">
                            {session.horaInicio} - {session.horaFin}
                          </span>
                          <span className="text-xs font-semibold text-cyan-900 dark:text-cyan-200 bg-slate-200/70 dark:bg-slate-700 px-2 py-0.5 rounded">
                            Aula: {session.aula}
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">{session.asignatura}</h5>
                        {session.grupo && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">Grupo {session.grupo}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      El docente no tiene clases ni actividades programadas en este día.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. BUSCAR POR DURACIÓN CONTINUA (Mínimo X horas continuas) */}
      {/* ========================================================================= */}
      {subTab === 'duracion_minima' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs search-container transition-colors duration-200">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
              <span>Buscar Bloques Libres por Duración Continua</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              
              {/* Type: Aula vs Profesor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Tipo de Consulta
                </label>
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setDurationEntityType('aula')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      durationEntityType === 'aula' ? 'bg-white dark:bg-slate-900 text-cyan-950 dark:text-cyan-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Aulas Libres
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationEntityType('profesor')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      durationEntityType === 'profesor' ? 'bg-white dark:bg-slate-900 text-cyan-950 dark:text-cyan-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Docentes Libres
                  </button>
                </div>
              </div>

              {/* Day Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Día
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value as DayName)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {DAYS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Minimum Duration */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Duración Continua Mínima
                </label>
                <select
                  value={minDurationMinutes}
                  onChange={(e) => setMinDurationMinutes(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                >
                  <option value={60}>Al menos 1 hora (60 min)</option>
                  <option value={90}>Al menos 1.5 horas (90 min)</option>
                  <option value={120}>Al menos 2 horas (120 min)</option>
                  <option value={180}>Al menos 3 horas (180 min)</option>
                  <option value={240}>Al menos 4 horas (240 min)</option>
                </select>
              </div>

            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Buscando bloques continuos libres de {minDurationMinutes / 60} hrs o más el día {selectedDay}.</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{durationResults.length} resultados encontrados</span>
            </div>
          </div>

          {/* Duration Results List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {durationResults.map((res, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-500 transition-all shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 shrink-0">
                      {durationEntityType === 'aula' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{res.entityName}</h4>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs shrink-0 font-mono">
                    {res.durationFormatted}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{res.day}</span>
                  <span className="font-bold font-mono text-cyan-900 dark:text-cyan-300">{res.start} — {res.end}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
