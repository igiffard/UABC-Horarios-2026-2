import { DayName } from '../types';

/**
 * Normaliza una cadena removiendo espacios duplicados y caracteres mal codificados
 */
export function cleanText(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/¶/g, 'Ñ')
    .replace(/Ã‘/g, 'Ñ')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Convierte una cadena a un término de búsqueda neutral (sin acentos, minúsculas, sin puntuación)
 */
export function normalizeSearchKey(str: string | undefined | null): string {
  if (!str) return '';
  return cleanText(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Verifica coincidencia parcial insensible a mayúsculas y acentos
 */
export function matchesSearchQuery(text: string | undefined | null, query: string): boolean {
  if (!query || !query.trim()) return true;
  if (!text) return false;
  const normText = cleanText(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normQuery = cleanText(query).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Buscar todas las palabras del query
  const queryTokens = normQuery.split(/\s+/).filter(Boolean);
  return queryTokens.every(token => normText.includes(token));
}

/**
 * Normaliza nombres de días al estándar Lunes..Domingo
 */
export function normalizeDay(d: string | undefined | null): DayName | null {
  if (!d) return null;
  const s = cleanText(d).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (s.startsWith('lun')) return 'Lunes';
  if (s.startsWith('mar')) return 'Martes';
  if (s.startsWith('mie') || s.startsWith('mié')) return 'Miércoles';
  if (s.startsWith('jue')) return 'Jueves';
  if (s.startsWith('vie')) return 'Viernes';
  if (s.startsWith('sab') || s.startsWith('sáb')) return 'Sábado';
  if (s.startsWith('dom')) return 'Domingo';
  return null;
}

export function getDayIndex(day: DayName): number {
  const map: Record<DayName, number> = {
    'Lunes': 0,
    'Martes': 1,
    'Miércoles': 2,
    'Jueves': 3,
    'Viernes': 4,
    'Sábado': 5,
    'Domingo': 6
  };
  return map[day] ?? 0;
}

/**
 * Normaliza y estandariza nombres de aulas / espacios físicos
 */
export function normalizeClassroom(rawRoom: string | undefined | null): string {
  if (!rawRoom) return 'Sin Aula Asignada';
  const s = cleanText(rawRoom);
  if (!s || s === '0' || s === '0 ' || s === '-') return 'Sin Aula Asignada';

  // Salón N / S-N / S N -> SN
  const mSalon = s.match(/^sal[oó]n\s*(\d+)/i);
  if (mSalon) return `S${parseInt(mSalon[1])}`;
  
  const mS = s.match(/^s\s*(\d+)$/i);
  if (mS) return `S${parseInt(mS[1])}`;

  const upper = s.toUpperCase();
  if (upper.includes('CPB')) return 'CPB';
  if (upper.includes('SPD')) return 'SPD';
  if (upper.includes('CCL') || upper.includes('CENTRO DE CÓMPUTO') || upper.includes('CENTRO DE COMPUTO')) return 'CCL';
  if (upper.includes('SFF')) return 'SFF';
  if (upper.includes('IIO')) return 'IIO';
  if (upper.includes('ESP')) return 'ESP';
  if (upper.includes('LFQ') || upper.includes('FISICOQU')) return 'LFQ';
  if (upper.includes('LTA')) return 'LTA';
  if (upper.includes('LQO') || upper.includes('QUÍMICA ORGÁNICA') || upper.includes('QUIMICA ORGANICA')) return 'LQO';
  if (upper.includes('LOB')) return 'LOB';
  if (upper.includes('LBQ')) return 'LBQ';
  if (upper.includes('AM1')) return 'AM1';
  if (upper.includes('AM2')) return 'AM2';
  if (upper.includes('TOTOABA') || upper.includes('TOB')) return s.includes('B') ? 'TOB' : 'Totoaba A';
  if (upper.includes('SALA DE ASESOR') || (upper.includes('SA') && upper.includes('E14'))) return 'SA';
  if (upper === 'SB' || upper.includes('SALA DE BIOLOG') || upper.includes('SALA DE BIOLOGÍA')) return 'SB';
  if (upper.includes('GIMNASIO')) return 'Gimnasio';
  if (upper.includes('DIB-E') || upper.includes('DIB')) return 'DIB-E';
  if (upper.includes('S7') || upper.includes('SALÓN 7') || upper.includes('SALON 7')) return 'S7';
  if (upper.includes('S2') || upper.includes('SALÓN 2') || upper.includes('SALON 2')) return 'S2';
  if (upper.includes('S3') || upper.includes('SALÓN 3') || upper.includes('SALON 3')) return 'S3';
  if (upper.includes('S5') || upper.includes('SALÓN 5') || upper.includes('SALON 5')) return 'S5';
  if (upper.includes('S6') || upper.includes('SALÓN 6') || upper.includes('SALON 6')) return 'S6';
  if (upper.includes('S8') || upper.includes('SALÓN 8') || upper.includes('SALON 8')) return 'S8';
  if (upper.includes('S1') || upper.includes('SALÓN 1') || upper.includes('SALON 1')) return 'S1';

  return s;
}

/**
 * Convierte HH:MM a minutos desde medianoche (e.g. "07:30" -> 450)
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * Convierte minutos a formato HH:MM (e.g. 450 -> "07:30")
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Parsea un rango de hora en formato "07:00\n08:00", "07:00 - 08:00", "08:00-09:50", etc.
 */
export function parseTimeRange(timeStr: string | undefined | null): { start: string; end: string } | null {
  if (!timeStr) return null;
  const clean = cleanText(timeStr);
  const matches = clean.match(/(\d{1,2}:\d{2})/g);
  if (matches && matches.length >= 2) {
    const start = matches[0].padStart(5, '0');
    let end = matches[1].padStart(5, '0');
    // Normalizar si la hora final es e.g. 09:50 a 10:00 o mantener precisa
    return { start, end };
  }
  return null;
}

/**
 * Formatea duración en horas amigables (e.g. 3 -> "3 h", 1.5 -> "1.5 h")
 */
export function formatDurationHours(durationMinutes: number): string {
  const hours = durationMinutes / 60;
  if (Number.isInteger(hours)) {
    return `${hours} h`;
  }
  return `${hours.toFixed(1)} h`;
}

/**
 * Determina si una sesión corresponde a horas de investigación o actividades no docentes
 * (Tutorías, Horas de Investigación, Gestión, Asesorías, etc.)
 */
export function isActivityOrResearchSession(session: { tipo?: string; asignatura?: string; claveUA?: string } | null | undefined): boolean {
  if (!session) return false;

  const tipo = (session.tipo || '').toUpperCase().trim();
  if (tipo === 'A' || tipo === 'ACT' || tipo === 'ACTIVIDAD') return true;

  const clave = (session.claveUA || '').trim();
  if (clave.startsWith('0000') || clave === '000000') return true;

  const asig = cleanText(session.asignatura).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!asig) return false;

  if (
    asig.includes('INVESTIGACION') ||
    asig.includes('INVESTIGADOR') ||
    asig.includes('TUTORIA') ||
    asig.includes('ASESORIA') ||
    asig.includes('GESTION') ||
    asig.includes('ACTIVIDAD DE APOYO') ||
    asig.includes('APOYO A LA DOCENCIA') ||
    asig.includes('PREPARACION DE CLASE') ||
    asig.includes('COMISION') ||
    asig.includes('COORDINACION') ||
    asig.includes('DIRECCION DE TESIS') ||
    asig.includes('HORAS DE INVESTIGACION')
  ) {
    return true;
  }

  return false;
}

