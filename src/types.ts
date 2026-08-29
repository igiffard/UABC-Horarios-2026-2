export type DayName = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';

export type ViewTab = 'profesor' | 'aula' | 'asignatura' | 'grupo' | 'disponibilidad';

export type DirectoryCategory = 'profesores' | 'aulas' | 'asignaturas' | 'grupos';

export interface CalendarDisplayOptions {
  viewMode: 'asc' | 'modern'; // 'asc' = official UABC aSc grid format; 'modern' = colorful rounded cards
  showTeacher: boolean;
  showRoom: boolean;
  showGroup: boolean;
  showTime: boolean;
  showType: boolean;
  showCapacity: boolean;
  showActivities: boolean; // Muestra u oculta actividades no docentes (Investigación, Tutorías, Gestión, etc.)
  density: 'compact' | 'comfortable';
}

export const DEFAULT_DISPLAY_OPTIONS: CalendarDisplayOptions = {
  viewMode: 'asc',
  showTeacher: true,
  showRoom: true,
  showGroup: true,
  showTime: true,
  showType: true,
  showCapacity: true,
  showActivities: true,
  density: 'comfortable',
};

export interface PrintOptions {
  layout: 'full' | 'matrix' | 'table'; // 'full' = Matriz + Tabla + Firmas; 'matrix' = Solo Matriz; 'table' = Solo Lista de Clases
  scope: 'current' | 'custom' | 'batch';
  targetType: 'profesor' | 'aula' | 'grupo' | 'asignatura';
  targetName: string;
  showActivities: boolean; // Incluir Horas de Investigación / Actividades
  showSignatures: boolean; // Incluir espacio de firmas oficiales
  showStats: boolean; // Incluir caja de resumen de horas y asignaturas
  showRoomCapacity: boolean;
  colorMode: 'color' | 'grayscale' | 'contrast';
  fontSize: 'compact' | 'standard' | 'large';
  paperOrientation: 'landscape' | 'portrait';
  includeNotes: boolean;
  customNotes: string;
  signerTeacher: string;
  signerCoord: string;
  signerDirector: string;
}

export const DEFAULT_PRINT_OPTIONS: PrintOptions = {
  layout: 'full',
  scope: 'current',
  targetType: 'profesor',
  targetName: '',
  showActivities: true,
  showSignatures: true,
  showStats: true,
  showRoomCapacity: true,
  colorMode: 'color',
  fontSize: 'standard',
  paperOrientation: 'landscape',
  includeNotes: true,
  customNotes: 'Horario oficial sujeto a validación y cambios por la Coordinación Académica de la FCM.',
  signerTeacher: 'Docente Titular',
  signerCoord: 'Coordinación de Carrera',
  signerDirector: 'Dirección de la FCM',
};

export interface ScheduleSession {
  id: string;
  source: string; // 'Base 1', 'Base 2', 'Base 3', 'Base 4', 'Base 5', 'Base 6', 'Corrección'
  profesor: string;
  noEmpleado: string;
  asignatura: string;
  claveUA: string;
  grupo: string;
  subgrupo: string;
  tipo: string; // 'C' (Clase), 'T' (Taller), 'L' (Laboratorio), 'P' (Práctica), 'A' (Actividad)
  aula: string; // Normalized room code, e.g. "S1", "CPB", "SPD", "CCL"
  aulaOriginal?: string;
  edificio: string;
  capacidad: number | null; // Capacidad original si venía en la fila
  capacidadSalon?: number | null; // Capacidad física del salón / aula
  cupoGrupo?: number | null; // Capacidad / Cupo máximo asignado al grupo
  inscritos?: number | null; // Total de estudiantes inscritos en la clase
  cargaInscritos?: number | null; // Estudiantes por carga regular
  evalInscritos?: number | null; // Estudiantes en evaluación
  subastaInscritos?: number | null; // Estudiantes en subasta
  carrera?: string; // Programa académico / Carrera
  porcentajeOcupacionGrupo?: number | null;
  porcentajeOcupacionSalon?: number | null;
  alertaSobrecupo?: boolean;
  programa: string;
  dia: DayName;
  diaIndex: number; // 0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves, 4=Viernes
  horaInicio: string; // "07:00"
  horaFin: string; // "09:00"
  startMinutes: number; // 420
  endMinutes: number; // 540
  durationMinutes: number;
  isCorrection?: boolean;
  correctionId?: string;
  correctionNote?: string;
  hasConflict?: boolean;
  conflicts?: ConflictInfo[];
}

export interface ConflictInfo {
  type: 'profesor' | 'aula' | 'grupo';
  description: string;
  conflictingSession: {
    id: string;
    profesor: string;
    asignatura: string;
    grupo: string;
    aula: string;
    dia: DayName;
    horaInicio: string;
    horaFin: string;
  };
}

export interface CorrectionRecord {
  id: string;
  fuenteRemitente: string;
  profesor: string;
  asignatura: string;
  grupo: string;
  tipoActividad: string;
  diaActual: string;
  horarioActual: string;
  salonActual: string;
  diaSolicitado: string;
  horarioSolicitado: string;
  salonSolicitadoNuevo: string;
  registroActualCompleto: string;
  registroSolicitadoCompleto: string;
  tipoAjuste: string;
  estadoAjuste: string;
  disponibilidadVerificada: string;
  personasNotificadas: string;
  motivo: string;
  accionPendiente: string;
  observaciones: string;
}

export interface ConsolidatedData {
  sessions: ScheduleSession[];
  professors: string[];
  classrooms: string[];
  subjects: string[];
  groups: string[];
  programs: string[];
  corrections: CorrectionRecord[];
  appliedCorrectionsCount: number;
  conflictsCount: number;
  sourcesStatus: {
    base1: boolean;
    base2: boolean;
    base3: boolean;
    base4: boolean;
    base5: boolean;
    base6: boolean;
    corrections: boolean;
    errorMessage?: string;
    correctionsWarning?: string;
  };
  lastLoadedAt: Date;
}

export interface TimeSlotInterval {
  start: string; // "07:00"
  end: string;   // "10:00"
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  durationHours: number;
}

export interface AvailabilityEntityResult {
  entityName: string;
  day: DayName;
  freeIntervals: TimeSlotInterval[];
  occupiedSessions: ScheduleSession[];
}

export interface DurationMatchResult {
  entityType: 'aula' | 'profesor';
  entityName: string;
  day: DayName;
  start: string;
  end: string;
  durationHours: number;
  durationFormatted: string;
}
