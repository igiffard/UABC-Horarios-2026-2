import { CorrectionRecord } from '../types';

/**
 * Correcciones y solicitudes de ajuste adicionales integradas al sistema.
 * Se aplican con prioridad sobre las bases oficiales de horarios.
 */
export const ADDITIONAL_CORRECTIONS: CorrectionRecord[] = [
  {
    id: '30',
    fuenteRemitente: 'Medina Romo Evnika Zarina / Solicitud docente',
    profesor: 'MEDINA ROMO EVNIKA ZARINA',
    asignatura: 'ACUAPONÍA E HIDROPONÍA',
    grupo: '110',
    tipoActividad: 'Clase',
    diaActual: 'Jueves',
    horarioActual: '15:00-16:00',
    salonActual: 'LTO',
    diaSolicitado: 'Jueves',
    horarioSolicitado: '12:00-13:00',
    salonSolicitadoNuevo: 'SB',
    registroActualCompleto: 'Acuaponía e Hidroponía Gpo 110 | Clase teórica | Jueves 15:00-16:00 | Laboratorio LTO',
    registroSolicitadoCompleto: 'Acuaponía e Hidroponía Gpo 110 | Clase teórica | Jueves 12:00-13:00 | Sala de Biología (SB, E-17)',
    tipoAjuste: 'Cambio de horario y salón',
    estadoAjuste: 'Aprobado e integrado',
    disponibilidadVerificada: 'Sí, Sala de Biología (SB) verificada libre los jueves de 12:00 a 13:00 h',
    personasNotificadas: 'Docente y alumnado de Grupo 110',
    motivo: 'Evitar el tiempo perdido en el préstamo y devolución de llaves, facilitar el acceso del alumnado y no utilizar innecesariamente un laboratorio con equipo especializado.',
    accionPendiente: 'Actualizar horario oficial UABC',
    observaciones: 'Sesión teórica reubicada de Laboratorio LTO a Sala de Biología (SB, E-17) los jueves de 12:00 a 13:00 h. LTO queda desocupado en ese lapso.'
  },
  {
    id: '31',
    fuenteRemitente: 'Ajuste de continuidad por reubicación teórica',
    profesor: 'MEDINA ROMO EVNIKA ZARINA',
    asignatura: 'ACUAPONÍA E HIDROPONÍA',
    grupo: '110',
    tipoActividad: 'Laboratorio',
    diaActual: 'Jueves',
    horarioActual: '12:00-15:00',
    salonActual: 'LTO',
    diaSolicitado: 'Jueves',
    horarioSolicitado: '13:00-16:00',
    salonSolicitadoNuevo: 'LTO',
    registroActualCompleto: 'Acuaponía e Hidroponía Gpo 110 | Laboratorio | Jueves 12:00-15:00 | Laboratorio LTO',
    registroSolicitadoCompleto: 'Acuaponía e Hidroponía Gpo 110 | Laboratorio | Jueves 13:00-16:00 | Laboratorio LTO (E-20)',
    tipoAjuste: 'Reubicación de bloque de laboratorio',
    estadoAjuste: 'Aprobado e integrado',
    disponibilidadVerificada: 'Sí, Laboratorio LTO disponible de 13:00 a 16:00 h sin colisiones',
    personasNotificadas: 'Docente y alumnado de Grupo 110',
    motivo: 'Continuidad de las 3 horas de práctica inmediatamente después de la sesión teórica en Sala de Biología.',
    accionPendiente: 'Actualizar horario oficial UABC',
    observaciones: 'El bloque continuo de Acuaponía pasa a ser: 12:00-13:00 Teoría (SB) y 13:00-16:00 Laboratorio (LTO).'
  }
];
