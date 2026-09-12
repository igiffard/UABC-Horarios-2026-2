import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Printer,
  FileDown,
  Image as ImageIcon,
  FileSpreadsheet,
  Check,
  Calendar,
  Table as TableIcon,
  FileText,
  User,
  Building2,
  BookOpen,
  Users,
  FlaskConical,
  PenTool,
  Copy,
  Sparkles,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Layers,
  Palette,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { ScheduleSession, PrintOptions, ViewTab } from '../types';
import { exportSessionsToCSV } from '../utils/exporter';
import { isActivityOrResearchSession, formatDurationHours } from '../utils/normalizer';
import { exportElementToPDF, exportElementToImage, printWithNativeDialog } from '../utils/pdfExport';
import { PrintSchedule } from './PrintSchedule';
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
  // Target entity for print
  const initialType: 'profesor' | 'aula' | 'grupo' | 'asignatura' = 
    printOptions.targetType || (activeTab === 'disponibilidad' ? 'profesor' : (activeTab as any) || 'profesor');

  const [targetType, setTargetType] = useState<'profesor' | 'aula' | 'grupo' | 'asignatura'>(initialType);
  const [selectedEntity, setSelectedEntity] = useState<string>(() => {
    if (printOptions.targetName) return printOptions.targetName;
    if (currentEntityName) return currentEntityName;
    if (initialType === 'profesor') return allProfessors[0] || '';
    if (initialType === 'aula') return allClassrooms[0] || '';
    if (initialType === 'grupo') return allGroups[0] || '';
    if (initialType === 'asignatura') return allSubjects[0] || '';
    return allProfessors[0] || '';
  });

  const [searchFilter, setSearchFilter] = useState('');
  const [zoomLevel, setZoomLevel] = useState<number>(0.85); // 85% scale fits comfortably
  const [copied, setCopied] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Mobile tab toggle (on desktop, both panels are shown side-by-side)
  const [mobileTab, setMobileTab] = useState<'options' | 'preview'>('preview');

  // Ref to the live preview sheet for captures
  const previewSheetRef = useRef<HTMLDivElement>(null);

  // When targetType changes, reset search and pick first item
  const handleTargetTypeChange = (type: 'profesor' | 'aula' | 'grupo' | 'asignatura') => {
    setTargetType(type);
    setSearchFilter('');
    let defaultItem = '';
    if (type === 'profesor') defaultItem = allProfessors[0] || '';
    else if (type === 'aula') defaultItem = allClassrooms[0] || '';
    else if (type === 'grupo') defaultItem = allGroups[0] || '';
    else if (type === 'asignatura') defaultItem = allSubjects[0] || '';
    setSelectedEntity(defaultItem);

    // Sync to printOptions
    onChangePrintOptions({
      ...printOptions,
      targetType: type,
      targetName: defaultItem,
      signerTeacher: type === 'profesor' && defaultItem ? defaultItem : printOptions.signerTeacher
    });
  };

  const handleEntitySelect = (name: string) => {
    setSelectedEntity(name);
    onChangePrintOptions({
      ...printOptions,
      targetType,
      targetName: name,
      signerTeacher: targetType === 'profesor' ? name : printOptions.signerTeacher
    });
  };

  // Filter list of available entities based on search box
  const availableEntities = useMemo(() => {
    let list: string[] = [];
    if (targetType === 'profesor') list = allProfessors;
    else if (targetType === 'aula') list = allClassrooms;
    else if (targetType === 'grupo') list = allGroups;
    else if (targetType === 'asignatura') list = allSubjects;

    if (!searchFilter.trim()) return list;
    const q = searchFilter.toLowerCase();
    return list.filter(item => item.toLowerCase().includes(q));
  }, [targetType, allProfessors, allClassrooms, allGroups, allSubjects, searchFilter]);

  // Filtered sessions for the selected target
  const targetSessions = useMemo(() => {
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
        return [];
    }
  }, [sessions, targetType, selectedEntity]);

  // Filtered sessions factoring in printOptions.showActivities
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
      if (s.aula && s.aula !== 'Sin Aula Asignada') rooms.add(s.aula);
      if (s.grupo && s.grupo !== '-') groups.add(s.grupo);
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

  const getCleanDocTitle = () => {
    const typeLabel = {
      profesor: 'Docente',
      aula: 'Aula',
      grupo: 'Grupo',
      asignatura: 'Materia'
    }[targetType];
    return `Horario_${typeLabel}_${selectedEntity || 'FCM'}`.replace(/\s+/g, '_');
  };

  const viewTitleText = useMemo(() => {
    const typeLabel = {
      profesor: 'Docente Titular',
      aula: 'Aula / Laboratorio',
      grupo: 'Grupo Estudiantil',
      asignatura: 'Asignatura'
    }[targetType];
    return `${typeLabel.toUpperCase()}: ${selectedEntity}`;
  }, [targetType, selectedEntity]);

  // 1. Direct PDF Download with safety timeout
  const handleDownloadPDF = async () => {
    if (!previewSheetRef.current) return;
    setIsExportingPDF(true);
    setSuccessMessage(null);
    try {
      const filename = `${getCleanDocTitle()}_2026-2.pdf`;
      await exportElementToPDF(previewSheetRef.current, {
        filename,
        orientation: printOptions.paperOrientation || 'landscape',
        paperSize: 'letter',
        quality: 0.95
      });
      setSuccessMessage('¡PDF descargado con éxito!');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setSuccessMessage('Abriendo ventana de impresión para guardar PDF...');
      handleTriggerPrint();
    } finally {
      setIsExportingPDF(false);
    }
  };

  // 2. Direct PNG Image Download
  const handleDownloadImage = async () => {
    if (!previewSheetRef.current) return;
    setIsExportingImage(true);
    setSuccessMessage(null);
    try {
      const filename = `${getCleanDocTitle()}_2026-2.png`;
      await exportElementToImage(
        previewSheetRef.current,
        filename,
        printOptions.paperOrientation || 'landscape'
      );
      setSuccessMessage('¡Imagen PNG descargada con éxito!');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Error generating Image:', err);
      setSuccessMessage('No se pudo generar la imagen. Intenta imprimir.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setIsExportingImage(false);
    }
  };

  // 3. Connect to Laptop's Real Native Print Dialog
  const handleTriggerPrint = async () => {
    if (!previewSheetRef.current) return;
    setIsPrinting(true);
    setSuccessMessage(null);
    try {
      // Sync options to parent state
      onChangePrintOptions({
        ...printOptions,
        targetType,
        targetName: selectedEntity
      });

      await printWithNativeDialog(
        previewSheetRef.current.innerHTML,
        getCleanDocTitle(),
        printOptions.paperOrientation || 'landscape'
      );
    } catch (e) {
      console.warn('Print trigger fallback to window.print()', e);
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExportCSV = () => {
    exportSessionsToCSV(printableSessions, getCleanDocTitle());
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs no-print">
      <div 
        className="bg-slate-900 text-slate-100 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700 w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Impresión y Exportación de Horarios"
      >
        
        {/* Modal Header */}
        <div className="bg-slate-950 px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-600 flex items-center justify-center text-white shadow-md shadow-cyan-600/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-display">
                  Imprimir y Exportar Horario
                </h2>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 font-semibold px-2 py-0.5 rounded-full border border-cyan-800 hidden sm:inline-block">
                  Oficial FCM 2026-2
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Visualiza la hoja en tiempo real, elige orientación Horizontal o Vertical y conéctate a la impresora de tu computadora.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Tab Switcher */}
            <div className="sm:hidden flex bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setMobileTab('options')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                  mobileTab === 'options' ? 'bg-cyan-600 text-white' : 'text-slate-400'
                }`}
              >
                Opciones
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('preview')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                  mobileTab === 'preview' ? 'bg-cyan-600 text-white' : 'text-slate-400'
                }`}
              >
                Vista Previa
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content: Split Layout */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          
          {/* ================= LEFT PANEL: CONTROLS & ORIENTATION ================= */}
          <div className={`w-full sm:w-88 md:w-96 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto ${
            mobileTab === 'preview' ? 'hidden sm:flex' : 'flex'
          }`}>
            <div className="p-4 space-y-4 text-xs">
              
              {/* STEP 1: ENTITY SELECTION */}
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center">1</span>
                    ¿Qué horario deseas imprimir?
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {stats.sessionsCount} sesiones
                  </span>
                </div>

                {/* Target Type Selector Pills */}
                <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleTargetTypeChange('profesor')}
                    className={`py-1.5 px-1 rounded-lg font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      targetType === 'profesor' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Docente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTargetTypeChange('aula')}
                    className={`py-1.5 px-1 rounded-lg font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      targetType === 'aula' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Aula</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTargetTypeChange('grupo')}
                    className={`py-1.5 px-1 rounded-lg font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      targetType === 'grupo' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Grupo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTargetTypeChange('asignatura')}
                    className={`py-1.5 px-1 rounded-lg font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      targetType === 'asignatura' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Materia</span>
                  </button>
                </div>

                {/* Search & Select Entity Dropdown */}
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={`Filtrar ${targetType}...`}
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                  </div>

                  <select
                    value={selectedEntity}
                    onChange={(e) => handleEntitySelect(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-cyan-300 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 cursor-pointer max-h-36"
                    size={availableEntities.length > 5 ? 4 : Math.max(3, availableEntities.length)}
                  >
                    {availableEntities.map(name => (
                      <option key={name} value={name} className="py-1 px-2 hover:bg-cyan-900/50">
                        {targetType === 'grupo' ? `Grupo ${name}` : name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Entity Card */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1">
                  <div className="font-bold text-white truncate flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="truncate">{selectedEntity}</span>
                  </div>
                  <div className="text-slate-400 flex items-center justify-between text-[10px]">
                    <span>Carga: <strong className="text-cyan-400">{stats.totalHours}</strong></span>
                    <span>Materias: <strong className="text-slate-200">{stats.subjectsCount}</strong></span>
                    <span>Salones: <strong className="text-slate-200">{stats.roomsCount}</strong></span>
                  </div>
                </div>

              </div>

              {/* STEP 2: ORIENTATION SELECTOR (LANDSCAPE VS PORTRAIT) */}
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center">2</span>
                    Orientación de Página
                  </span>
                  <span className="text-[10px] text-cyan-300 font-mono">
                    {printOptions.paperOrientation === 'landscape' ? 'Horizontal (11" × 8.5")' : 'Vertical (8.5" × 11")'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateOption('paperOrientation', 'landscape')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer ${
                      printOptions.paperOrientation === 'landscape'
                        ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-md ring-2 ring-cyan-500/50'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="w-11 h-7 rounded border-2 border-current flex items-center justify-center font-bold text-[8.5px] bg-slate-900/50">
                      11 × 8.5
                    </div>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1 justify-center">
                        <span>Horizontal</span>
                        {printOptions.paperOrientation === 'landscape' && <Check className="w-3 h-3 text-cyan-400" />}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">Landscape (Recomendado)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateOption('paperOrientation', 'portrait')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer ${
                      printOptions.paperOrientation === 'portrait'
                        ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-md ring-2 ring-cyan-500/50'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="w-7 h-11 rounded border-2 border-current flex items-center justify-center font-bold text-[8.5px] bg-slate-900/50">
                      8.5 × 11
                    </div>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1 justify-center">
                        <span>Vertical</span>
                        {printOptions.paperOrientation === 'portrait' && <Check className="w-3 h-3 text-cyan-400" />}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">Portrait (Para listas)</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* STEP 3: FORMAT TEMPLATE */}
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-2.5">
                <span className="font-bold text-cyan-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center">3</span>
                  Formato del Horario
                </span>

                <div className="space-y-1.5">
                  {/* Option 1: Matrix */}
                  <label
                    onClick={() => updateOption('layout', 'matrix')}
                    className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                      printOptions.layout === 'matrix'
                        ? 'bg-cyan-950/70 border-cyan-500 text-white font-semibold'
                        : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modalPrintLayout"
                      checked={printOptions.layout === 'matrix'}
                      onChange={() => updateOption('layout', 'matrix')}
                      className="mt-0.5 text-cyan-600 focus:ring-cyan-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Cuadrícula Semanal</span>
                        <span className="text-[9px] bg-cyan-900 text-cyan-300 px-1.5 py-0.2 rounded font-normal ml-auto">1 Página</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        Horario visual semanal de L-V. El formato clásico y más práctico.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Full Document */}
                  <label
                    onClick={() => updateOption('layout', 'full')}
                    className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                      printOptions.layout === 'full'
                        ? 'bg-cyan-950/70 border-cyan-500 text-white font-semibold'
                        : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modalPrintLayout"
                      checked={printOptions.layout === 'full'}
                      onChange={() => updateOption('layout', 'full')}
                      className="mt-0.5 text-cyan-600 focus:ring-cyan-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Documento Completo Oficial</span>
                        <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-normal ml-auto">Completo</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        Cuadrícula + Desglose detallado de materias + Firmas de validación.
                      </p>
                    </div>
                  </label>

                  {/* Option 3: Table Only */}
                  <label
                    onClick={() => updateOption('layout', 'table')}
                    className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                      printOptions.layout === 'table'
                        ? 'bg-cyan-950/70 border-cyan-500 text-white font-semibold'
                        : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modalPrintLayout"
                      checked={printOptions.layout === 'table'}
                      onChange={() => updateOption('layout', 'table')}
                      className="mt-0.5 text-cyan-600 focus:ring-cyan-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <TableIcon className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Solo Tabla Desglosada</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        Lista detallada de claves, tipos (C/T/L), salones y cupos.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* STEP 4: QUICK TOGGLES */}
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-2.5">
                <span className="font-bold text-cyan-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center">4</span>
                  Opciones Adicionales
                </span>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2 bg-slate-950/50 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800/60">
                    <div className="flex items-center gap-2 text-xs">
                      <PenTool className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Firmas de Validación Oficial</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={printOptions.showSignatures}
                      onChange={(e) => updateOption('showSignatures', e.target.checked)}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 bg-slate-950/50 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800/60">
                    <div className="flex items-center gap-2 text-xs">
                      <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
                      <span>Investigación / Actividades</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={printOptions.showActivities}
                      onChange={(e) => updateOption('showActivities', e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Color de Tinta:</label>
                      <select
                        value={printOptions.colorMode}
                        onChange={(e) => updateOption('colorMode', e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-slate-200"
                      >
                        <option value="color">Color Institucional</option>
                        <option value="grayscale">Escala de Grises</option>
                        <option value="contrast">Blanco y Negro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Tamaño Letra:</label>
                      <select
                        value={printOptions.fontSize}
                        onChange={(e) => updateOption('fontSize', e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-slate-200"
                      >
                        <option value="compact">Compacto (9pt)</option>
                        <option value="standard">Estándar (10.5pt)</option>
                        <option value="large">Grande (12pt)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ================= RIGHT PANEL: LIVE 1:1 PAPER DOCUMENT PREVIEW ================= */}
          <div className={`flex-1 bg-slate-950 flex flex-col overflow-hidden ${
            mobileTab === 'options' ? 'hidden sm:flex' : 'flex'
          }`}>
            
            {/* Live Preview Toolbar */}
            <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold text-slate-200">Vista Previa en Vivo</span>
                <span className="text-cyan-400 text-[11px] font-semibold bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/60">
                  {printOptions.paperOrientation === 'landscape' ? 'Hoja Horizontal (Landscape)' : 'Hoja Vertical (Portrait)'}
                </span>
              </div>

              {/* Toolbar Actions: Open clean tab & Zoom Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerPrint}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                  title="Abrir en pestaña completa e invocar impresión de tu computadora"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Pestaña Completa</span>
                </button>

                <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.max(0.45, prev - 0.1))}
                    className="p-1 hover:text-cyan-400 text-slate-400 transition-colors cursor-pointer"
                    title="Reducir zoom"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-slate-300 w-10 text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.min(1.3, prev + 0.1))}
                    className="p-1 hover:text-cyan-400 text-slate-400 transition-colors cursor-pointer"
                    title="Aumentar zoom"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(0.85)}
                    className="p-1 hover:text-cyan-400 text-slate-400 ml-1 border-l border-slate-800 pl-1.5 cursor-pointer"
                    title="Restablecer zoom"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Document Paper Container */}
            <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start bg-slate-950/90">
              
              <div 
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out'
                }}
                className="w-full flex justify-center"
              >
                {/* Real Live Render of PrintSchedule with isPreview=true */}
                <PrintSchedule
                  ref={previewSheetRef}
                  viewTitle={viewTitleText}
                  sessions={printableSessions}
                  lastLoadedAt={lastLoadedAt}
                  printOptions={printOptions}
                  isPreview={true}
                />
              </div>

            </div>

            {/* Feedback notification toast */}
            {successMessage && (
              <div className="bg-emerald-600 text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>{successMessage}</span>
              </div>
            )}

          </div>

        </div>

        {/* Modal Footer: Bulletproof Action Buttons */}
        <div className="bg-slate-950 px-4 sm:px-6 py-3.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Secondary formats: Excel, Image, Copy */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              title="Descargar este horario en formato CSV para Excel"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Excel (CSV)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isExportingImage}
              title="Descargar horario como imagen PNG de alta resolución"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isExportingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" /> : <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />}
              <span className="hidden sm:inline">Imagen (PNG)</span>
            </button>

            <button
              type="button"
              onClick={handleCopySummary}
              title="Copiar texto resumen al portapapeles"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span className="hidden sm:inline">{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          {/* Primary Action Buttons: Real Laptop Print & Direct PDF Download */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            {/* REAL LAPTOP PRINT BUTTON (HP, EPSON, CANON, SYSTEM PDF) */}
            <button
              type="button"
              onClick={handleTriggerPrint}
              disabled={isPrinting}
              id="btn-print-native"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Abre directamente el cuadro de impresión de tu computadora (Windows / Mac / Linux) o Guardar como PDF del sistema"
            >
              {isPrinting ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <Printer className="w-4 h-4 text-cyan-400" />}
              <span>Imprimir en mi Laptop</span>
            </button>

            {/* DIRECT PDF DOWNLOAD (INSTANT ONE-CLICK GENERATION) */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              id="btn-download-pdf-direct"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title="Descargar el archivo .pdf directo a tu carpeta de descargas"
            >
              {isExportingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Descargar PDF</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
