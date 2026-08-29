import { ScheduleSession } from '../types';
import { isActivityOrResearchSession } from './normalizer';

/**
 * Genera y descarga un archivo CSV compatible con Excel de las sesiones dadas.
 */
export function exportSessionsToCSV(sessions: ScheduleSession[], filenamePrefix: string = 'Horario_FCM'): void {
  if (!sessions || sessions.length === 0) {
    alert('No hay sesiones para exportar.');
    return;
  }

  const headers = [
    'Día',
    'Hora Inicio',
    'Hora Fin',
    'Duración (hrs)',
    'Asignatura / Actividad',
    'Clave UA',
    'Tipo',
    'Grupo',
    'Subgrupo',
    'Profesor',
    'No. Empleado',
    'Aula',
    'Edificio',
    'Cupo Grupo',
    'Capacidad Salón',
    'Inscritos',
    'Carrera / Programa',
    'Fuente'
  ];

  const escapeCSV = (str: any) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = sessions.map(s => {
    const durHours = (s.durationMinutes / 60).toFixed(1);
    return [
      escapeCSV(s.dia),
      escapeCSV(s.horaInicio),
      escapeCSV(s.horaFin),
      escapeCSV(durHours),
      escapeCSV(s.asignatura),
      escapeCSV(s.claveUA || ''),
      escapeCSV(s.tipo || 'C'),
      escapeCSV(s.grupo || ''),
      escapeCSV(s.subgrupo || ''),
      escapeCSV(s.profesor || ''),
      escapeCSV(s.noEmpleado || ''),
      escapeCSV(s.aula || ''),
      escapeCSV(s.edificio || ''),
      escapeCSV(s.cupoGrupo ?? ''),
      escapeCSV(s.capacidadSalon ?? ''),
      escapeCSV(s.inscritos ?? ''),
      escapeCSV(s.carrera || s.programa || ''),
      escapeCSV(s.source || '')
    ].join(',');
  });

  // UTF-8 BOM so Excel opens it with correct accents
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  const sanitizedName = filenamePrefix.replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `${sanitizedName}_2026-2.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
