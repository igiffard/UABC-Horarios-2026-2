import React, { useState, useMemo } from 'react';
import { Clock, Building2, User, Search, CheckCircle2, XCircle, Sparkles, Filter, ChevronRight } from 'lucide-react';
import { ScheduleSession, DayName } from '../types';
import { CONFIG } from '../config';
import { AutocompleteInput } from './AutocompleteInput';
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

type SubTab = 'aula_dia' | 'prof_dia' | 'buscar_aulas' | 'buscar_profs' | 'duracion_minima';

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
  const [subTab, setSubTab] = useState<SubTab>('buscar_aulas');

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
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs search-container">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          
          <button
            type="button"
            onClick={() => setSubTab('buscar_aulas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              subTab === 'buscar_aulas'
                ? 'bg-cyan-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
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
                : 'text-slate-600 hover:bg-slate-100'
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
                : 'text-slate-600 hover:bg-slate-100'
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
                : 'text-slate-600 hover:bg-slate-100'
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
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Por Duración Continua</span>
          </button>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. BUSCAR AULAS LIBRES EN RANGO (Día + Hora Inicio + Hora Fin) */}
      {/* ========================================================================= */}
      {subTab === 'buscar_aulas' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs search-container">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-700" />
              <span>Buscar Aulas Disponibles para un Horario Específico</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              
              {/* Day Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Día
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value as DayName)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {DAYS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hora Inicio
                </label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-800 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {TIME_OPTIONS.filter(t => t < endTime).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* End Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hora Fin
                </label>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-800 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {TIME_OPTIONS.filter(t => t > startTime).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Text filter for room name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Filtrar por Aula
                </label>
                <input
                  type="text"
                  value={roomFilterText}
                  onChange={(e) => setRoomFilterText(e.target.value)}
                  placeholder="Ej. S1, CPB, Edificio 14..."
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

            </div>

            {/* Filter Toggle */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyAvailableFilter}
                  onChange={(e) => setOnlyAvailableFilter(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                />
                <span>Mostrar únicamente aulas completamente libres</span>
              </label>

              <span className="text-xs text-slate-500 font-semibold">
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
                      ? 'bg-white border-emerald-200/80 shadow-xs hover:border-emerald-300'
                      : 'bg-slate-50 border-slate-200 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${item.isFree ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">{item.classroom}</h4>
                    </div>

                    {item.isFree ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Disponible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Ocupada
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">
                    {selectedDay} de <strong className="font-mono text-slate-700">{startTime}</strong> a <strong className="font-mono text-slate-700">{endTime}</strong>
                  </p>

                  {/* Conflicting sessions if occupied */}
                  {!item.isFree && item.conflictsWith.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/70 space-y-1.5">
                      <span className="text-[11px] font-semibold text-rose-800 block uppercase">Clase(s) en ese horario:</span>
                      {item.conflictsWith.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => onSelectSession(c)}
                          className="text-xs p-1.5 bg-white rounded-lg border border-slate-200 hover:border-cyan-400 cursor-pointer transition-colors"
                        >
                          <div className="font-medium text-slate-800 truncate">{c.asignatura}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{c.horaInicio} - {c.horaFin} • {c.profesor}</div>
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs search-container">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-700" />
              <span>Buscar Docentes Disponibles para un Horario Específico</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              
              {/* Day Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Día
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value as DayName)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {DAYS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hora Inicio
                </label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-800 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {TIME_OPTIONS.filter(t => t < endTime).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* End Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hora Fin
                </label>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono text-slate-800 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {TIME_OPTIONS.filter(t => t > startTime).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Text filter for prof name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Filtrar Docente
                </label>
                <input
                  type="text"
                  value={profFilterText}
                  onChange={(e) => setProfFilterText(e.target.value)}
                  placeholder="Nombre o apellido..."
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyAvailableFilter}
                  onChange={(e) => setOnlyAvailableFilter(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                />
                <span>Mostrar únicamente docentes disponibles</span>
              </label>

              <span className="text-xs text-slate-500 font-semibold">
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
                      ? 'bg-white border-emerald-200/80 shadow-xs hover:border-emerald-300'
                      : 'bg-slate-50 border-slate-200 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className={`p-2 rounded-xl shrink-0 ${item.isFree ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        <User className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm truncate">{item.professor}</h4>
                    </div>

                    {item.isFree ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Libre
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 shrink-0">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        Ocupado
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">
                    {selectedDay} • <strong className="font-mono text-slate-700">{startTime} - {endTime}</strong>
                  </p>

                  {!item.isFree && item.conflictsWith.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/70 space-y-1.5">
                      <span className="text-[11px] font-semibold text-rose-800 block uppercase">Impartiendo en ese horario:</span>
                      {item.conflictsWith.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => onSelectSession(c)}
                          className="text-xs p-1.5 bg-white rounded-lg border border-slate-200 hover:border-cyan-400 cursor-pointer transition-colors"
                        >
                          <div className="font-medium text-slate-800 truncate">{c.asignatura}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{c.horaInicio} - {c.horaFin} • Aula: {c.aula}</div>
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs search-container">
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
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
              <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Intervalos Libres ({roomAvailability.freeIntervals.length})</span>
                  </div>
                  <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    {selectedRoom} • {selectedDay}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {roomAvailability.freeIntervals.map((slot, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <div>
                          <div className="text-sm font-bold font-mono text-emerald-950">
                            {slot.start} — {slot.end}
                          </div>
                          <span className="text-xs text-emerald-700">Espacio disponible para reserva</span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg bg-emerald-200/70 text-emerald-900 font-bold text-xs font-mono">
                        {slot.durationHours} hrs continuas
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Occupied Sessions Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                    <XCircle className="w-5 h-5 text-slate-500" />
                    <span>Sesiones Ocupadas ({roomAvailability.occupiedSessions.length})</span>
                  </div>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                    {selectedDay}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {roomAvailability.occupiedSessions.length > 0 ? (
                    roomAvailability.occupiedSessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => onSelectSession(session)}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-cyan-500 cursor-pointer transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                            {session.horaInicio} - {session.horaFin}
                          </span>
                          {session.grupo && <span className="text-xs text-slate-500 font-medium">Grupo {session.grupo}</span>}
                        </div>
                        <h5 className="text-sm font-bold text-slate-900">{session.asignatura}</h5>
                        <p className="text-xs text-slate-600 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{session.profesor || 'Por asignar'}</span>
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs search-container">
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
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
              <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Tiempos Libres ({profAvailability.freeIntervals.length})</span>
                  </div>
                  <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    {selectedDay}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {profAvailability.freeIntervals.map((slot, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <div>
                          <div className="text-sm font-bold font-mono text-emerald-950">
                            {slot.start} — {slot.end}
                          </div>
                          <span className="text-xs text-emerald-700">Docente disponible</span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg bg-emerald-200/70 text-emerald-900 font-bold text-xs font-mono">
                        {slot.durationHours} hrs libres
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Occupied Sessions Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                    <XCircle className="w-5 h-5 text-slate-500" />
                    <span>Actividades Asignadas ({profAvailability.occupiedSessions.length})</span>
                  </div>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                    {selectedDay}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {profAvailability.occupiedSessions.length > 0 ? (
                    profAvailability.occupiedSessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => onSelectSession(session)}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-cyan-500 cursor-pointer transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                            {session.horaInicio} - {session.horaFin}
                          </span>
                          <span className="text-xs font-semibold text-cyan-900 bg-slate-200/70 px-2 py-0.5 rounded">
                            Aula: {session.aula}
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-slate-900">{session.asignatura}</h5>
                        {session.grupo && (
                          <p className="text-xs text-slate-500">Grupo {session.grupo}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs search-container">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-700" />
              <span>Buscar Bloques Libres por Duración Continua</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              
              {/* Type: Aula vs Profesor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tipo de Consulta
                </label>
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setDurationEntityType('aula')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      durationEntityType === 'aula' ? 'bg-white text-cyan-950 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Aulas Libres
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationEntityType('profesor')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      durationEntityType === 'profesor' ? 'bg-white text-cyan-950 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Docentes Libres
                  </button>
                </div>
              </div>

              {/* Day Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Día
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value as DayName)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {DAYS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Minimum Duration */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Duración Continua Mínima
                </label>
                <select
                  value={minDurationMinutes}
                  onChange={(e) => setMinDurationMinutes(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20"
                >
                  <option value={60}>Al menos 1 hora (60 min)</option>
                  <option value={90}>Al menos 1.5 horas (90 min)</option>
                  <option value={120}>Al menos 2 horas (120 min)</option>
                  <option value={180}>Al menos 3 horas (180 min)</option>
                  <option value={240}>Al menos 4 horas (240 min)</option>
                </select>
              </div>

            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Buscando bloques continuos libres de {minDurationMinutes / 60} hrs o más el día {selectedDay}.</span>
              <span className="font-bold text-slate-800">{durationResults.length} resultados encontrados</span>
            </div>
          </div>

          {/* Duration Results List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {durationResults.map((res, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-cyan-400 transition-all shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="p-2 rounded-xl bg-cyan-50 text-cyan-800 shrink-0">
                      {durationEntityType === 'aula' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm truncate">{res.entityName}</h4>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs shrink-0 font-mono">
                    {res.durationFormatted}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">{res.day}</span>
                  <span className="font-bold font-mono text-cyan-900">{res.start} — {res.end}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
