import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  Settings2,
  Eye,
  Check,
  FileText,
  Calendar,
  Table,
  Sliders,
  User,
  Building2,
  BookOpen,
  Users,
  FlaskConical,
  PenTool,
  Copy,
  Sparkles,
  Info
} from 'lucide-react';
import { ScheduleSession, PrintOptions, DEFAULT_PRINT_OPTIONS, ViewTab } from '../types';
import { exportSessionsToCSV } from '../utils/exporter';
import { isActivityOrResearchSession, formatDurationHours } from '../utils/normalizer';
import { getSubjectColorScheme } from '../utils/colors';
import { CONFIG } from '../config';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ScheduleSession[];
  allProfessors: string[];
  allClassrooms: string[];
  allGroups: string[];
  allSubjects: string[];
  activeTab: ViewTab;
  currentEntityName?: string;
  lastLoadedAt: Date;
  printOptions: PrintOptions;
  onChangePrintOptions: (options: PrintOptions) => void;
  onExecutePrint: () => void;
}

const DAYS = CONFIG.CALENDAR.DAYS;
const HOURS = Array.from({ length: 15 }, (_, i) => {
  const h = 7 + i;
  return `${h.toString().padStart(2, '0')}:00`;
});

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  sessions,
  allProfessors,
  allClassrooms,
  allGroups,
  allSubjects,
  activeTab,
  currentEntityName,
  lastLoadedAt,
  printOptions,
  onChangePrintOptions,
  onExecutePrint
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'preview'>('config');
  const [copied, setCopied] = useState(false);

  // Target entity for print
  const [targetType, setTargetType] = useState<'profesor' | 'aula' | 'grupo' | 'asignatura' | 'all'>(
    activeTab === 'disponibilidad' ? 'profesor' : activeTab
  );
  const [selectedEntity, setSelectedEntity] = useState<string>(
    currentEntityName || (targetType === 'profesor' ? allProfessors[0] : allClassrooms[0]) || ''
  );

  // When targetType changes, update default selected entity
  const handleTargetTypeChange = (type: 'profesor' | 'aula' | 'grupo' | 'asignatura' | 'all') => {
    setTargetType(type);
    if (type === 'profesor') setSelectedEntity(allProfessors[0] || '');
    else if (type === 'aula') setSelectedEntity(allClassrooms[0] || '');
    else if (type === 'grupo') setSelectedEntity(allGroups[0] || '');
    else if (type === 'asignatura') setSelectedEntity(allSubjects[0] || '');
    else setSelectedEntity('Todas las sesiones');
  };

  // Filtered sessions according to target selection
  const targetSessions = useMemo(() => {
    if (targetType === 'all') return sessions;
    if (!selectedEntity) return [];

    switch (targetType) {
      case 'profesor':
        return sessions.filter(s => s.profesor === selectedEntity);
      case 'aula':
        return sessions.filter(s => s.aula === selectedEntity);
      case 'grupo':
        return sessions.filter(s => s.grupo === selectedEntity);
      case 'asignatura':
        return sessions.filter(s => s.asignatura === selectedEntity);
      default:
        return sessions;
    }
  }, [sessions, targetType, selectedEntity]);

  // Filtered by showActivities
  const printableSessions = useMemo(() => {
    return targetSessions.filter(s => {
      if (!printOptions.showActivities && isActivityOrResearchSession(s)) {
        return false;
      }
      return true;
    });
  }, [targetSessions, printOptions.showActivities]);

  // Statistics
  const stats = useMemo(() => {
    let totalMinutes = 0;
    const subjects = new Set<string>();
    const rooms = new Set<string>();
    const groups = new Set<string>();

    for (const s of printableSessions) {
      totalMinutes += s.durationMinutes;
      if (s.asignatura) subjects.add(s.asignatura);
      if (s.aula) rooms.add(s.aula);
      if (s.grupo) groups.add(s.grupo);
    }

    return {
      totalHours: formatDurationHours(totalMinutes),
      sessionsCount: printableSessions.length,
      subjectsCount: subjects.size,
      roomsCount: rooms.size,
      groupsCount: groups.size
    };
  }, [printableSessions]);

  const updateOption = <K extends keyof PrintOptions>(key: K, value: PrintOptions[K]) => {
    onChangePrintOptions({
      ...printOptions,
      [key]: value
    });
  };

  const handleExportCSV = () => {
    const prefix = targetType === 'all' ? 'Horario_General_FCM' : `Horario_${targetType}_${selectedEntity}`;
    exportSessionsToCSV(printableSessions, prefix);
  };

  const handleCopySummary = () => {
    const lines = [
      `UABC - FACULTAD DE CIENCIAS MARINAS`,
      `HORARIO OFICIAL 2026-2: ${targetType.toUpperCase()} - ${selectedEntity}`,
      `Total Carga: ${stats.totalHours} (${stats.sessionsCount} sesiones)`,
      `----------------------------------------`,
      ...printableSessions.map(s => `${s.dia.slice(0, 3)} ${s.horaInicio}-${s.horaFin} | ${s.asignatura} | G.${s.grupo} | Aula: ${s.aula} | Prof: ${s.profesor}`)
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintClick = () => {
    // Sync title/target name in printOptions
    onChangePrintOptions({
      ...printOptions,
      targetType: targetType === 'all' ? 'profesor' : targetType,
      targetName: selectedEntity
    });
    onExecutePrint();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 no-print">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        role="dialog"
        aria-modal="true"
      >
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white shadow-md shadow-cyan-600/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Centro de Impresión y Exportación</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.2 rounded-full border border-cyan-800">Oficial 2026-2</span>
              </div>
              <h2 className="text-lg font-bold text-white font-display">
                Configurar Impresión de Horario
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch between Config & Live Preview */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveSubTab('config')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeSubTab === 'config'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Opciones</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeSubTab === 'preview'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Vista Previa</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {activeSubTab === 'config' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Scope & Target Selector (5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                
                {/* 1. Target Entity Selection */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-cyan-600" />
                      <span>1. Horario a Imprimir</span>
                    </label>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {printableSessions.length} sesiones encontradas
                    </span>
                  </div>

                  {/* Target Category Tabs */}
                  <div className="grid grid-cols-4 gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => handleTargetTypeChange('profesor')}
                      className={`py-1.5 px-2 rounded-lg font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        targetType === 'profesor' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Profesor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTargetTypeChange('aula')}
                      className={`py-1.5 px-2 rounded-lg font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        targetType === 'aula' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Aula</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTargetTypeChange('grupo')}
                      className={`py-1.5 px-2 rounded-lg font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        targetType === 'grupo' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Grupo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTargetTypeChange('asignatura')}
                      className={`py-1.5 px-2 rounded-lg font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        targetType === 'asignatura' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Materia</span>
                    </button>
                  </div>

                  {/* Entity Dropdown Select */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Seleccionar {targetType === 'profesor' ? 'Docente' : targetType === 'aula' ? 'Salón / Laboratorio' : targetType === 'grupo' ? 'Grupo' : 'Asignatura'}:
                    </label>
                    <select
                      value={selectedEntity}
                      onChange={(e) => setSelectedEntity(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 shadow-2xs cursor-pointer"
                    >
                      {targetType === 'profesor' && allProfessors.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                      {targetType === 'aula' && allClassrooms.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                      {targetType === 'grupo' && allGroups.map(g => (
                        <option key={g} value={g}>Grupo {g}</option>
                      ))}
                      {targetType === 'asignatura' && allSubjects.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Entity Mini Summary Card */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                    <div className="font-bold text-slate-900 text-sm truncate">
                      {selectedEntity}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                      <div><strong>Carga Semanal:</strong> {stats.totalHours}</div>
                      <div><strong>Sesiones:</strong> {stats.sessionsCount}</div>
                      <div><strong>Asignaturas:</strong> {stats.subjectsCount}</div>
                      <div><strong>Aulas/Grupos:</strong> {stats.roomsCount} / {stats.groupsCount}</div>
                    </div>
                  </div>

                </div>

                {/* 2. Format & Layout Template */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-cyan-600" />
                    <span>2. Plantilla y Diseño</span>
                  </label>

                  <div className="space-y-2">
                    <label
                      onClick={() => updateOption('layout', 'full')}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        printOptions.layout === 'full'
                          ? 'bg-cyan-50 border-cyan-400 text-cyan-950 font-semibold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="printLayout"
                        checked={printOptions.layout === 'full'}
                        onChange={() => updateOption('layout', 'full')}
                        className="mt-0.5 text-cyan-600 focus:ring-cyan-500"
                      />
                      <div className="text-xs">
                        <div className="font-bold">Ficha Oficial Completa (Recomendado)</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          Cuadrícula semanal gráfica aSc + Tabla de desglose de materias + Firmas de Vo.Bo.
                        </div>
                      </div>
                    </label>

                    <label
                      onClick={() => updateOption('layout', 'matrix')}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        printOptions.layout === 'matrix'
                          ? 'bg-cyan-50 border-cyan-400 text-cyan-950 font-semibold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="printLayout"
                        checked={printOptions.layout === 'matrix'}
                        onChange={() => updateOption('layout', 'matrix')}
                        className="mt-0.5 text-cyan-600 focus:ring-cyan-500"
                      />
                      <div className="text-xs">
                        <div className="font-bold">Solo Matriz Semanal Gráfica</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          Horario tipo aSc de Lunes a Viernes optimizado para mural o carteleras.
                        </div>
                      </div>
                    </label>

                    <label
                      onClick={() => updateOption('layout', 'table')}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        printOptions.layout === 'table'
                          ? 'bg-cyan-50 border-cyan-400 text-cyan-950 font-semibold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="printLayout"
                        checked={printOptions.layout === 'table'}
                        onChange={() => updateOption('layout', 'table')}
                        className="mt-0.5 text-cyan-600 focus:ring-cyan-500"
                      />
                      <div className="text-xs">
                        <div className="font-bold">Solo Carga Académica (Tabla Detallada)</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          Lista detallada con claves UA, tipo de clase, horas y cupos.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

              </div>

              {/* Right Column: Detailed Print Options & Signatures (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* Content Switches */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-cyan-600" />
                    <span>3. Elementos a Incluir en el Documento</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    
                    <label className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-200 text-xs cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={printOptions.showActivities}
                        onChange={(e) => updateOption('showActivities', e.target.checked)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex items-center gap-1.5 font-semibold text-purple-950">
                        <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
                        <span>Investigación / Actividades</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-200 text-xs cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={printOptions.showSignatures}
                        onChange={(e) => updateOption('showSignatures', e.target.checked)}
                        className="rounded text-cyan-600 focus:ring-cyan-500"
                      />
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <PenTool className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Espacio para Firmas de Vo.Bo.</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-200 text-xs cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={printOptions.showStats}
                        onChange={(e) => updateOption('showStats', e.target.checked)}
                        className="rounded text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="font-semibold text-slate-800">Resumen Estadístico (Hrs/Sem)</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-200 text-xs cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={printOptions.showRoomCapacity}
                        onChange={(e) => updateOption('showRoomCapacity', e.target.checked)}
                        className="rounded text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="font-semibold text-slate-800">Cupo y Capacidad de Salón</span>
                    </label>

                  </div>
                </div>

                {/* Appearance Settings: Colors, Fonts & Orientation */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-600" />
                    <span>4. Estilo de Impresión y Tipografía</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Color / Tinta:</label>
                      <select
                        value={printOptions.colorMode}
                        onChange={(e) => updateOption('colorMode', e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="color">Color Institucional</option>
                        <option value="grayscale">Escala de Grises (Ahorro Tóner)</option>
                        <option value="contrast">Blanco y Negro (Alto Contraste)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tamaño de Letra:</label>
                      <select
                        value={printOptions.fontSize}
                        onChange={(e) => updateOption('fontSize', e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="compact">Compacto (9pt - Más espacio)</option>
                        <option value="standard">Estándar (10.5pt)</option>
                        <option value="large">Grande (12pt)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Orientación Recomendada:</label>
                      <div className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-700 font-semibold flex items-center justify-between">
                        <span>Horizontal (Landscape)</span>
                        <span className="text-[10px] text-cyan-700 bg-cyan-50 px-1.5 rounded">Carta</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signatures Labels & Custom Notes */}
                {printOptions.showSignatures && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <PenTool className="w-4 h-4 text-cyan-600" />
                      <span>5. Títulos de las Firmas Oficiales</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 mb-1">Firma 1 (Docente/Responsable):</label>
                        <input
                          type="text"
                          value={printOptions.signerTeacher}
                          onChange={(e) => updateOption('signerTeacher', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 mb-1">Firma 2 (Coordinación):</label>
                        <input
                          type="text"
                          value={printOptions.signerCoord}
                          onChange={(e) => updateOption('signerCoord', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 mb-1">Firma 3 (Dirección):</label>
                        <input
                          type="text"
                          value={printOptions.signerDirector}
                          onChange={(e) => updateOption('signerDirector', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Notes input */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-cyan-600" />
                      <span>Observaciones al Pie</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printOptions.includeNotes}
                        onChange={(e) => updateOption('includeNotes', e.target.checked)}
                        className="rounded text-cyan-600 focus:ring-cyan-500"
                      />
                      <span>Incluir en documento</span>
                    </label>
                  </div>
                  {printOptions.includeNotes && (
                    <input
                      type="text"
                      value={printOptions.customNotes}
                      onChange={(e) => updateOption('customNotes', e.target.value)}
                      placeholder="Ej. Horario sujeto a validación y cambios por la Coordinación..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-cyan-500"
                    />
                  )}
                </div>

              </div>

            </div>
          ) : (
            /* Live Preview tab */
            <div className="bg-slate-200/80 p-4 sm:p-6 rounded-2xl border border-slate-300 flex justify-center overflow-x-auto">
              <div className="bg-white shadow-xl rounded-lg p-6 w-full max-w-4xl text-slate-900 border border-slate-300 transform origin-top scale-95">
                
                {/* Mock Live Document Header */}
                <div className="border-b-2 border-slate-900 pb-2 mb-3 flex items-start justify-between">
                  <div>
                    <div className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">
                      Universidad Autónoma de Baja California • Facultad de Ciencias Marinas
                    </div>
                    <div className="text-base font-black tracking-tight text-slate-950 font-serif">
                      {CONFIG.APP_TITLE} — Semestre 2026-2
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {targetType.toUpperCase()}: {selectedEntity}
                    </div>
                  </div>
                  <div className="text-right text-[9px] text-slate-500">
                    <div><strong>Emisión:</strong> {new Date().toLocaleDateString('es-MX')}</div>
                    <div><strong>Estado:</strong> Horario Oficial Consolidado</div>
                  </div>
                </div>

                {/* Stats in Preview */}
                {printOptions.showStats && (
                  <div className="mb-3 px-3 py-1 bg-slate-100 border border-slate-300 rounded flex items-center justify-between text-[10px]">
                    <span><strong>Carga Total:</strong> {stats.totalHours} ({stats.sessionsCount} sesiones)</span>
                    <span><strong>Asignaturas:</strong> {stats.subjectsCount} • <strong>Grupos:</strong> {stats.groupsCount} • <strong>Aulas:</strong> {stats.roomsCount}</span>
                  </div>
                )}

                {/* Grid Preview */}
                {(printOptions.layout === 'matrix' || printOptions.layout === 'full') && (
                  <div className="border border-slate-400 rounded overflow-hidden mb-3">
                    <table className="w-full border-collapse text-[9px] table-fixed">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-400">
                          <th className="p-1 w-12 text-center border-r border-slate-300">Hora</th>
                          {DAYS.map(d => (
                            <th key={d} className="p-1 text-center border-r border-slate-300 last:border-r-0">{d}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00'].map((h, i) => (
                          <tr key={h} className="border-b border-slate-200">
                            <td className="p-1 text-center font-mono bg-slate-50 text-[8.5px] border-r border-slate-300 font-bold">{h}</td>
                            {DAYS.map(d => {
                              const match = printableSessions.find(s => s.dia === d && s.horaInicio.startsWith(h.slice(0, 2)));
                              return (
                                <td key={d} className="p-0.5 border-r border-slate-200 last:border-r-0 h-6 align-top">
                                  {match && (
                                    <div className="p-0.5 rounded bg-cyan-50 border border-cyan-300 text-[8px] leading-tight">
                                      <div className="font-bold truncate text-cyan-950">{match.asignatura}</div>
                                      <div className="text-[7.5px] text-cyan-800">{match.aula} (G.{match.grupo})</div>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Signatures Preview */}
                {printOptions.showSignatures && (
                  <div className="mt-4 pt-2 border-t border-slate-200">
                    <div className="grid grid-cols-3 gap-4 text-center text-[9px]">
                      <div className="border-t border-slate-700 pt-1">
                        <div className="font-bold">{printOptions.signerTeacher}</div>
                        <div className="text-slate-400 text-[8px]">Docente Titular</div>
                      </div>
                      <div className="border-t border-slate-700 pt-1">
                        <div className="font-bold">{printOptions.signerCoord}</div>
                        <div className="text-slate-400 text-[8px]">Coordinación Académica</div>
                      </div>
                      <div className="border-t border-slate-700 pt-1">
                        <div className="font-bold">{printOptions.signerDirector}</div>
                        <div className="text-slate-400 text-[8px]">Dirección FCM</div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>

        {/* Modal Footer with Action Buttons */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Export CSV / Excel button */}
            <button
              type="button"
              onClick={handleExportCSV}
              title="Descargar este horario en formato CSV para Excel"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar a Excel (CSV)</span>
            </button>

            {/* Copy summary button */}
            <button
              type="button"
              onClick={handleCopySummary}
              title="Copiar texto resumen al portapapeles"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handlePrintClick}
              id="btn-confirm-print"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
