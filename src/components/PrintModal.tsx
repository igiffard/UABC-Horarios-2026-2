import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Filter,
  ExternalLink
} from 'lucide-react';
import { ScheduleSession, PrintOptions, DayName } from '../types';
import { exportSessionsToCSV } from '../utils/exporter';
import { isActivityOrResearchSession, formatDurationHours } from '../utils/normalizer';
import { exportElementToPDF, exportElementToImage, printWithNativeDialog } from '../utils/pdfExport';
import { PrintSchedule } from './PrintSchedule';
import { MasterMatrixPrint } from './MasterMatrixPrint';
import { CONFIG } from '../config';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ScheduleSession[];
  allProfessors: string[];
  allClassrooms: string[];
  allGroups: string[];
  allSubjects: string[];
  activeTab?: string;
  currentEntityName?: string;
  lastLoadedAt: Date | null;
  printOptions: PrintOptions;
  onChangePrintOptions: (options: PrintOptions) => void;
  onExecutePrint: () => void;
}

const MAIN_ROOMS_NAMES = [
  'S1', 'S2', 'S3', 'S5', 'S6', 'S7', 'S8', 'SA', 'SB', 'SC', 'SG', 'SGP', 'CCL', 'CAI', 'AM1', 'AM2', 'ESP', 'PT', 'AF1', 'AF2', 'AF3'
];

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
  onChangePrintOptions
}) => {
  // Print Scope: 'current' (single entity), 'batch' (booklet of all entities), 'master_matrix' (all rooms on 1 single sheet)
  const [printScope, setPrintScope] = useState<'current' | 'batch' | 'master_matrix'>(() => {
    return printOptions.scope || 'current';
  });

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

  // Batch & Matrix Specific States
  const [matrixDay, setMatrixDay] = useState<DayName>('Lunes');
  const [batchFilterMode, setBatchFilterMode] = useState<'active' | 'main' | 'all'>('active');
  const [batchSearchQuery, setBatchSearchQuery] = useState('');
  const [batchPreviewIndex, setBatchPreviewIndex] = useState<number>(0);
  const [selectedBatchEntities, setSelectedBatchEntities] = useState<string[]>([]);

  // General controls
  const [searchFilter, setSearchFilter] = useState('');
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);
  const [copied, setCopied] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Mobile tab toggle
  const [mobileTab, setMobileTab] = useState<'options' | 'preview'>('preview');

  // DOM Refs
  const previewSheetRef = useRef<HTMLDivElement>(null);
  const masterMatrixRef = useRef<HTMLDivElement>(null);
  const batchHiddenContainerRef = useRef<HTMLDivElement>(null);

  // Filtered entity sets with classes assigned
  const activeRooms = useMemo(() => {
    const rooms = sessions
      .map(s => s.aula)
      .filter((a): a is string => Boolean(a && a !== 'Sin Aula Asignada'));
    return Array.from(new Set<string>(rooms)).sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [sessions]);

  const mainRooms = useMemo(() => {
    return MAIN_ROOMS_NAMES.filter(r => allClassrooms.includes(r));
  }, [allClassrooms]);

  const activeProfessors = useMemo(() => {
    const profs = sessions
      .map(s => s.profesor)
      .filter((p): p is string => Boolean(p));
    return Array.from(new Set<string>(profs)).sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [sessions]);

  const activeGroups = useMemo(() => {
    const grps = sessions
      .map(s => s.grupo)
      .filter((g): g is string => Boolean(g && g !== '-'));
    return Array.from(new Set<string>(grps)).sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [sessions]);

  // Available list for batch selection
  const currentBatchUniverse = useMemo(() => {
    if (targetType === 'aula') {
      if (batchFilterMode === 'main') return mainRooms;
      if (batchFilterMode === 'active') return activeRooms;
      return allClassrooms;
    }
    if (targetType === 'grupo') {
      if (batchFilterMode === 'active') return activeGroups;
      return allGroups;
    }
    if (targetType === 'profesor') {
      if (batchFilterMode === 'active') return activeProfessors;
      return allProfessors;
    }
    return allSubjects;
  }, [targetType, batchFilterMode, mainRooms, activeRooms, allClassrooms, activeGroups, allGroups, activeProfessors, allProfessors, allSubjects]);

  // Sync batch selection when targetType or filter mode changes
  useEffect(() => {
    setSelectedBatchEntities(currentBatchUniverse);
    setBatchPreviewIndex(0);
  }, [currentBatchUniverse]);

  // Keep preview index in bounds
  useEffect(() => {
    if (batchPreviewIndex >= selectedBatchEntities.length) {
      setBatchPreviewIndex(Math.max(0, selectedBatchEntities.length - 1));
    }
  }, [selectedBatchEntities.length, batchPreviewIndex]);

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

  // Toggle entity in batch selection
  const toggleBatchEntity = (name: string) => {
    setSelectedBatchEntities(prev =>
      prev.includes(name) ? prev.filter(e => e !== name) : [...prev, name]
    );
  };

  const selectAllBatch = () => setSelectedBatchEntities(currentBatchUniverse);
  const clearAllBatch = () => setSelectedBatchEntities([]);

  // Filter list of available entities based on search box (single mode)
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

  // Current entity for batch preview
  const currentBatchEntity = selectedBatchEntities[batchPreviewIndex] || selectedBatchEntities[0] || '';

  // Filtered sessions for the selected target (Single mode)
  const targetSessions = useMemo(() => {
    const activeName = printScope === 'batch' ? currentBatchEntity : selectedEntity;
    if (!activeName) return [];
    switch (targetType) {
      case 'profesor':
        return sessions.filter(s => s.profesor === activeName);
      case 'aula':
        return sessions.filter(s => s.aula === activeName);
      case 'grupo':
        return sessions.filter(s => s.grupo === activeName);
      case 'asignatura':
        return sessions.filter(s => s.asignatura === activeName);
      default:
        return [];
    }
  }, [sessions, targetType, selectedEntity, printScope, currentBatchEntity]);

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
    if (printScope === 'master_matrix') {
      return `Sabana_General_FCM_${targetType.toUpperCase()}_${matrixDay}`.replace(/\s+/g, '_');
    }
    if (printScope === 'batch') {
      return `Cuadernillo_FCM_${targetType.toUpperCase()}S_2026-2`.replace(/\s+/g, '_');
    }
    const typeLabel = {
      profesor: 'Docente',
      aula: 'Aula',
      grupo: 'Grupo',
      asignatura: 'Materia'
    }[targetType];
    return `Horario_${typeLabel}_${selectedEntity || 'FCM'}`.replace(/\s+/g, '_');
  };

  const viewTitleText = useMemo(() => {
    const activeName = printScope === 'batch' ? currentBatchEntity : selectedEntity;
    const typeLabel = {
      profesor: 'Docente Titular',
      aula: 'Aula / Laboratorio',
      grupo: 'Grupo Estudiantil',
      asignatura: 'Asignatura'
    }[targetType];
    return `${typeLabel.toUpperCase()}: ${activeName}`;
  }, [targetType, selectedEntity, printScope, currentBatchEntity]);

  // 1. Direct PDF Download with safety
  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    setSuccessMessage(null);
    try {
      if (printScope === 'master_matrix') {
        if (!masterMatrixRef.current) return;
        const filename = `${getCleanDocTitle()}_2026-2.pdf`;
        await exportElementToPDF(masterMatrixRef.current, {
          filename,
          orientation: 'landscape',
          paperSize: 'letter',
          quality: 0.95,
          fitToSinglePage: true
        });
        setSuccessMessage('¡Sábana en PDF descargada con éxito (1 sola hoja)!');
        setTimeout(() => setSuccessMessage(null), 3500);
        return;
      }

      if (printScope === 'batch') {
        // For large batches (e.g. >10 pages), native print dialog with 'Guardar como PDF' produces instant vector crispness
        setSuccessMessage(`Abriendo diálogo de impresión para exportar ${selectedBatchEntities.length} páginas en PDF...`);
        setTimeout(() => {
          handleTriggerPrint();
        }, 300);
        return;
      }

      // Single mode
      if (!previewSheetRef.current) return;
      const filename = `${getCleanDocTitle()}_2026-2.pdf`;
      await exportElementToPDF(previewSheetRef.current, {
        filename,
        orientation: printOptions.paperOrientation || 'landscape',
        paperSize: 'letter',
        quality: 0.95,
        fitToSinglePage: printOptions.fitToSinglePage !== false
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
    const targetEl = printScope === 'master_matrix' ? masterMatrixRef.current : previewSheetRef.current;
    if (!targetEl) return;
    setIsExportingImage(true);
    setSuccessMessage(null);
    try {
      const filename = `${getCleanDocTitle()}_2026-2.png`;
      await exportElementToImage(
        targetEl,
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
    setIsPrinting(true);
    setSuccessMessage(null);
    try {
      if (printScope === 'master_matrix') {
        if (!masterMatrixRef.current) return;
        await printWithNativeDialog(
          masterMatrixRef.current.outerHTML,
          getCleanDocTitle(),
          'landscape',
          true,
          false
        );
      } else if (printScope === 'batch') {
        if (!batchHiddenContainerRef.current) return;
        await printWithNativeDialog(
          batchHiddenContainerRef.current.innerHTML,
          getCleanDocTitle(),
          printOptions.paperOrientation || 'landscape',
          true,
          true
        );
      } else {
        if (!previewSheetRef.current) return;
        onChangePrintOptions({
          ...printOptions,
          targetType,
          targetName: selectedEntity
        });
        await printWithNativeDialog(
          previewSheetRef.current.outerHTML,
          getCleanDocTitle(),
          printOptions.paperOrientation || 'landscape',
          printOptions.fitToSinglePage !== false,
          false
        );
      }
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
                Imprime horarios individuales, cuadernillos por lote (todas las aulas/profesores/grupos) o sábanas concentradas en 1 hoja.
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
                Ajustes
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
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          
          {/* ================= LEFT PANEL: CONTROLS & SCOPE ================= */}
          <div className={`w-full sm:w-88 md:w-96 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto ${
            mobileTab === 'preview' ? 'hidden sm:flex' : 'flex'
          }`}>
            <div className="p-4 space-y-4 text-xs">
              
              {/* SCOPE SELECTOR: Individual vs. Cuadernillo Lote vs. Sábana Concentrada */}
              <div className="bg-slate-800/90 p-3 rounded-2xl border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center">1</span>
                    Modo de Impresión
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPrintScope('current')}
                    className={`py-1.5 px-1.5 rounded-lg font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      printScope === 'current'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Individual</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintScope('batch')}
                    className={`py-1.5 px-1.5 rounded-lg font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      printScope === 'batch'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                    title="Imprimir todas las aulas, profesores o grupos al mismo tiempo (1 hoja por cada una)"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Por Lote</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintScope('master_matrix')}
                    className={`py-1.5 px-1.5 rounded-lg font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      printScope === 'master_matrix'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                    title="Tabla concentradora de todas las aulas o grupos en 1 sola hoja de papel"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Sábana (1 Hoja)</span>
                  </button>
                </div>
              </div>

              {/* STEP 2: ENTITY SELECTION & SCOPE-SPECIFIC OPTIONS */}
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center">2</span>
                    {printScope === 'master_matrix' ? 'Entidad y Día de la Sábana' : printScope === 'batch' ? 'Selección del Lote Masivo' : '¿Qué horario deseas imprimir?'}
                  </span>
                  {printScope === 'current' && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {stats.sessionsCount} sesiones
                    </span>
                  )}
                </div>

                {/* Target Type Selector Pills */}
                <div className={`grid gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] ${
                  printScope === 'master_matrix' ? 'grid-cols-2' : 'grid-cols-3'
                }`}>
                  <button
                    type="button"
                    onClick={() => handleTargetTypeChange('aula')}
                    className={`py-1.5 px-1 rounded-lg font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      targetType === 'aula' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Aulas ({activeRooms.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTargetTypeChange('profesor')}
                    className={`py-1.5 px-1 rounded-lg font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      targetType === 'profesor' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Docentes ({activeProfessors.length})</span>
                  </button>

                  {printScope !== 'master_matrix' && (
                    <button
                      type="button"
                      onClick={() => handleTargetTypeChange('grupo')}
                      className={`py-1.5 px-1 rounded-lg font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        targetType === 'grupo' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Grupos ({activeGroups.length})</span>
                    </button>
                  )}
                </div>

                {/* --- A. CONFIG FOR MASTER MATRIX (SÁBANA EN 1 HOJA) --- */}
                {printScope === 'master_matrix' && (
                  <div className="space-y-2 pt-1">
                    <label className="block text-[11px] font-semibold text-slate-300">
                      Día de la Semana:
                    </label>
                    <div className="grid grid-cols-5 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10.5px]">
                      {(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as DayName[]).map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setMatrixDay(d)}
                          className={`py-1 rounded font-bold transition-all cursor-pointer text-center ${
                            matrixDay === d ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {d.slice(0, 3)}
                        </button>
                      ))}
                    </div>

                    {targetType === 'aula' && (
                      <div className="pt-1">
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Filtrar Aulas en la Sábana:
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
                          <button
                            type="button"
                            onClick={() => setBatchFilterMode('main')}
                            className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                              batchFilterMode === 'main'
                                ? 'bg-cyan-950 border-cyan-500 text-cyan-200 font-bold'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Aulas Principales ({mainRooms.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setBatchFilterMode('active')}
                            className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                              batchFilterMode === 'active'
                                ? 'bg-cyan-950 border-cyan-500 text-cyan-200 font-bold'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Con Clases ({activeRooms.length})
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="bg-cyan-950/40 p-2 rounded-xl border border-cyan-800/60 text-[10.5px] text-cyan-200">
                      <strong>● Sábana Concentrada:</strong> Todas las {targetType === 'aula' ? 'aulas' : 'entidades'} caben simultáneamente en <strong>1 sola hoja física</strong> de 07:00 a 21:00 h.
                    </div>
                  </div>
                )}

                {/* --- B. CONFIG FOR BATCH PRINTING (CUADERNILLO POR LOTE) --- */}
                {printScope === 'batch' && (
                  <div className="space-y-2 pt-1">
                    {/* Presets */}
                    <div className="flex items-center justify-between gap-1 text-[10.5px]">
                      {targetType === 'aula' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setBatchFilterMode('active');
                              setSelectedBatchEntities(activeRooms);
                            }}
                            className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                              batchFilterMode === 'active' ? 'bg-cyan-950 border-cyan-500 text-cyan-200 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}
                          >
                            Con Clases ({activeRooms.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setBatchFilterMode('main');
                              setSelectedBatchEntities(mainRooms);
                            }}
                            className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                              batchFilterMode === 'main' ? 'bg-cyan-950 border-cyan-500 text-cyan-200 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}
                          >
                            Principales ({mainRooms.length})
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-400 text-[10.5px]">
                          {selectedBatchEntities.length} {targetType === 'profesor' ? 'docentes' : 'grupos'} seleccionados
                        </span>
                      )}

                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          type="button"
                          onClick={selectAllBatch}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300"
                        >
                          Todos
                        </button>
                        <button
                          type="button"
                          onClick={clearAllBatch}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400"
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>

                    {/* Batch Selection Badge */}
                    <div className="bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-600/50 text-[11px] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-bold text-emerald-200">
                            {selectedBatchEntities.length} Hojas a Imprimir
                          </div>
                          <div className="text-[9.5px] text-emerald-300/80">
                            Cada {targetType} en 1 página individual (7 a 21 h)
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-white bg-emerald-700/80 px-2 py-0.5 rounded-md">
                        {selectedBatchEntities.length} págs
                      </span>
                    </div>

                    {/* Search & Checkbox list */}
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder={`Buscar en lista...`}
                        value={batchSearchQuery}
                        onChange={(e) => setBatchSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                      />

                      <div className="max-h-32 overflow-y-auto space-y-0.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
                        {currentBatchUniverse
                          .filter(name => !batchSearchQuery || name.toLowerCase().includes(batchSearchQuery.toLowerCase()))
                          .map(name => {
                            const isChecked = selectedBatchEntities.includes(name);
                            return (
                              <label
                                key={name}
                                className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors text-[11px] ${
                                  isChecked ? 'bg-cyan-950/60 text-cyan-200' : 'text-slate-400 hover:bg-slate-800'
                                }`}
                              >
                                <span className="truncate">{targetType === 'grupo' ? `Grupo ${name}` : name}</span>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleBatchEntity(name)}
                                  className="rounded text-cyan-500 focus:ring-cyan-400 w-3.5 h-3.5 ml-2"
                                />
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}

                {/* --- C. CONFIG FOR SINGLE ENTITY --- */}
                {printScope === 'current' && (
                  <>
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
                  </>
                )}

              </div>

              {/* STEP 3: ORIENTATION SELECTOR (LANDSCAPE VS PORTRAIT) */}
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center">3</span>
                    Orientación de Página
                  </span>
                  <span className="text-[10px] text-cyan-300 font-mono">
                    Horizontal (11" × 8.5")
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
                      <div className="text-[9px] text-slate-400 mt-0.5">Landscape (1 Hoja)</div>
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

              {/* STEP 4: QUICK TOGGLES */}
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-2.5">
                <span className="font-bold text-cyan-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center">4</span>
                  Ajustes de Impresión
                </span>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2.5 bg-emerald-950/40 border border-emerald-500/50 rounded-xl cursor-pointer hover:bg-emerald-900/30 transition-all">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-emerald-200 flex items-center gap-1.5">
                          <span>Ajustar exactamente en 1 Sola Hoja</span>
                          <span className="text-[9px] bg-emerald-700 text-white px-1.5 py-0.2 rounded font-mono">7 a 21 h</span>
                        </div>
                        <p className="text-[9.5px] text-emerald-400/80 leading-tight">
                          Compacta de 07:00 a 21:00 L-V para que quepa 100% en una hoja tamaño Carta.
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={printOptions.fitToSinglePage !== false}
                      onChange={(e) => updateOption('fitToSinglePage', e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-emerald-400 w-4 h-4 ml-2"
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
            <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold text-slate-200">
                  {printScope === 'master_matrix' ? 'Sábana Concentrada (1 Hoja)' : printScope === 'batch' ? 'Cuadernillo por Lote' : 'Vista Previa'}
                </span>
                
                {printScope === 'batch' && selectedBatchEntities.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setBatchPreviewIndex(prev => Math.max(0, prev - 1))}
                      disabled={batchPreviewIndex === 0}
                      className="p-0.5 hover:text-cyan-400 disabled:opacity-30 cursor-pointer"
                      title="Hoja anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-mono text-cyan-300 font-bold px-1">
                      Hoja {batchPreviewIndex + 1} de {selectedBatchEntities.length}: <strong className="text-white">{currentBatchEntity}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setBatchPreviewIndex(prev => Math.min(selectedBatchEntities.length - 1, prev + 1))}
                      disabled={batchPreviewIndex >= selectedBatchEntities.length - 1}
                      className="p-0.5 hover:text-cyan-400 disabled:opacity-30 cursor-pointer"
                      title="Hoja siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {printScope !== 'batch' && (
                  <span className="text-cyan-400 text-[11px] font-semibold bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/60">
                    Horizontal (11"×8.5")
                  </span>
                )}

                {printOptions.fitToSinglePage !== false && (
                  <span className="hidden xl:flex items-center gap-1 text-emerald-300 text-[11px] font-bold bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-500/60">
                    <Check className="w-3 h-3 text-emerald-400" />
                    1 Sola Hoja (7:00 a 21:00 L-V)
                  </span>
                )}
              </div>

              {/* Toolbar Actions: Open clean tab & Zoom Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerPrint}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                  title="Abrir diálogo de impresión de la computadora"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Impresión del Sistema</span>
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
                {/* 1. MASTER MATRIX PREVIEW */}
                {printScope === 'master_matrix' && (
                  <MasterMatrixPrint
                    ref={masterMatrixRef}
                    type={targetType === 'asignatura' ? 'aula' : targetType}
                    entities={targetType === 'aula' ? allClassrooms : targetType === 'grupo' ? allGroups : allProfessors}
                    sessions={sessions}
                    day={matrixDay}
                    showActivities={printOptions.showActivities}
                    filterMode={batchFilterMode}
                    isPreview={true}
                  />
                )}

                {/* 2. BATCH OR SINGLE PREVIEW */}
                {printScope !== 'master_matrix' && (
                  <PrintSchedule
                    ref={previewSheetRef}
                    viewTitle={viewTitleText}
                    sessions={printableSessions}
                    lastLoadedAt={lastLoadedAt}
                    printOptions={{
                      ...printOptions,
                      targetType,
                      targetName: printScope === 'batch' ? currentBatchEntity : selectedEntity
                    }}
                    isPreview={true}
                  />
                )}
              </div>

            </div>

            {/* Hidden batch container: renders all selected entities in HTML for native batch printing */}
            {printScope === 'batch' && (
              <div ref={batchHiddenContainerRef} style={{ display: 'none' }} aria-hidden="true">
                {selectedBatchEntities.map(ent => {
                  const entSessions = sessions.filter(s => {
                    if (targetType === 'aula') return s.aula === ent;
                    if (targetType === 'profesor') return s.profesor === ent;
                    if (targetType === 'grupo') return s.grupo === ent;
                    if (targetType === 'asignatura') return s.asignatura === ent;
                    return false;
                  }).filter(s => {
                    if (!printOptions.showActivities && isActivityOrResearchSession(s)) return false;
                    return true;
                  });

                  return (
                    <div
                      key={ent}
                      className="single-page-sheet batch-page-container"
                      data-print-sheet="true"
                      style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
                    >
                      <PrintSchedule
                        viewTitle={`${targetType === 'aula' ? 'AULA' : targetType === 'profesor' ? 'DOCENTE' : 'GRUPO'}: ${ent}`}
                        sessions={entSessions}
                        lastLoadedAt={lastLoadedAt}
                        printOptions={{
                          ...printOptions,
                          fitToSinglePage: true,
                          layout: 'matrix',
                          targetType,
                          targetName: ent
                        }}
                        isPreview={false}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Feedback notification toast */}
            {successMessage && (
              <div className="bg-emerald-600 text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>{successMessage}</span>
              </div>
            )}

          </div>

        </div>

        {/* Modal Footer: Action Buttons */}
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
              title="Abre directamente el cuadro de impresión de tu computadora"
            >
              {isPrinting ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <Printer className="w-4 h-4 text-cyan-400" />}
              <span>
                {printScope === 'master_matrix'
                  ? 'Imprimir Sábana (1 Hoja)'
                  : printScope === 'batch'
                  ? `Imprimir Lote (${selectedBatchEntities.length} Hojas)`
                  : 'Imprimir en mi Laptop'}
              </span>
            </button>

            {/* DIRECT PDF DOWNLOAD */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              id="btn-download-pdf-direct"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title="Descargar el archivo .pdf directo"
            >
              {isExportingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>
                    {printScope === 'master_matrix'
                      ? 'Descargar Sábana PDF'
                      : printScope === 'batch'
                      ? `Guardar PDF (${selectedBatchEntities.length} págs)`
                      : 'Descargar PDF'}
                  </span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
