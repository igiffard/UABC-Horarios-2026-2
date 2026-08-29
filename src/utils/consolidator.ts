import { ScheduleSession, CorrectionRecord, ConsolidatedData, ConflictInfo, DayName } from '../types';
import { 
  parseStandardTable, 
  parseBase3, 
  parseBase4, 
  parseCorrections, 
  parseCapacidadesPorActividad, 
  parseGruposInscritos, 
  extractRoomCapacitiesFromBase4,
  CapacidadActividadRecord,
  GrupoInscritosRecord 
} from './parser';
import { cleanText, normalizeSearchKey, normalizeClassroom, normalizeDay, parseTimeRange, timeToMinutes, getDayIndex } from './normalizer';
import { CONFIG } from '../config';

/**
 * Normaliza y empareja nombres de profesores considerando nombres parciales o formatos apellido-nombre
 */
function isSameProfessor(nameA: string, nameB: string): boolean {
  if (!nameA || !nameB) return false;
  const keyA = normalizeSearchKey(nameA);
  const keyB = normalizeSearchKey(nameB);
  if (keyA === keyB) return true;
  if (keyA.includes(keyB) || keyB.includes(keyA)) return true;

  // Comparar tokens individuales
  const tokensA = cleanText(nameA).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(t => t.length > 2);
  const tokensB = cleanText(nameB).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(t => t.length > 2);

  const matches = tokensA.filter(ta => tokensB.some(tb => tb.includes(ta) || ta.includes(tb)));
  return matches.length >= 2;
}

/**
 * Normaliza y empareja asignaturas
 */
function isSameSubject(subA: string, subB: string): boolean {
  if (!subA || !subB) return false;
  const keyA = normalizeSearchKey(subA);
  const keyB = normalizeSearchKey(subB);
  if (keyA === keyB) return true;
  if (keyA.includes(keyB) || keyB.includes(keyA)) return true;

  const tokensA = cleanText(subA).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(t => t.length > 3);
  const tokensB = cleanText(subB).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(t => t.length > 3);
  const matches = tokensA.filter(ta => tokensB.some(tb => tb.includes(ta) || ta.includes(tb)));
  return matches.length >= 1 && (matches.length >= Math.min(tokensA.length, tokensB.length) * 0.5);
}

/**
 * Normaliza grupos
 */
function isSameGroup(grpA: string, grpB: string): boolean {
  if (!grpA || !grpB) return true; // Si alguno no especifica grupo, no descartar
  const cleanA = cleanText(grpA).replace(/^g/i, '').trim();
  const cleanB = cleanText(grpB).replace(/^g/i, '').trim();
  return cleanA === cleanB;
}

/**
 * Fusiona y unifica las 4 bases de datos en un catálogo base consolidado
 */
export function mergeFourBases(
  base1Sessions: ScheduleSession[],
  base2Sessions: ScheduleSession[],
  base3Sessions: ScheduleSession[],
  base4Sessions: ScheduleSession[]
): ScheduleSession[] {
  // Empezar con Base 1 (Licenciatura) y Base 2 (Posgrado) que tienen la estructura de materias más rica
  const consolidated: ScheduleSession[] = [];
  const primarySessions = [...base1Sessions, ...base2Sessions];

  for (const s of primarySessions) {
    consolidated.push({ ...s });
  }

  // Complementar con Base 3 (Profesores: actividades, tutorías, investigación y clases no presentes)
  for (const b3 of base3Sessions) {
    // Verificar si ya existe una sesión equivalente en consolidated
    const existingIndex = consolidated.findIndex(cs => {
      if (cs.dia !== b3.dia) return false;
      const sameProf = isSameProfessor(cs.profesor, b3.profesor);
      if (!sameProf) return false;
      
      // Mismo horario solapado
      const overlap = cs.startMinutes < b3.endMinutes && cs.endMinutes > b3.startMinutes;
      return overlap;
    });

    if (existingIndex !== -1) {
      // Enriquecer registro existente con aula si faltaba
      if ((!consolidated[existingIndex].aula || consolidated[existingIndex].aula === 'Sin Aula Asignada') && b3.aula && b3.aula !== 'Sin Aula Asignada') {
        consolidated[existingIndex].aula = b3.aula;
        consolidated[existingIndex].aulaOriginal = b3.aulaOriginal;
      }
    } else {
      // Agregar como nueva sesión (p.ej. horas de investigación, tutorías, otras clases)
      consolidated.push({ ...b3 });
    }
  }

  // Complementar con Base 4 (Aulas: reservas y clases)
  for (const b4 of base4Sessions) {
    const existingIndex = consolidated.findIndex(cs => {
      if (cs.dia !== b4.dia) return false;
      const sameRoom = cs.aula === b4.aula && cs.aula !== 'Sin Aula Asignada';
      if (!sameRoom) return false;

      const overlap = cs.startMinutes < b4.endMinutes && cs.endMinutes > b4.startMinutes;
      return overlap;
    });

    if (existingIndex !== -1) {
      // Enriquecer profesor o asignatura si faltaba
      if (!consolidated[existingIndex].profesor && b4.profesor) {
        consolidated[existingIndex].profesor = b4.profesor;
        consolidated[existingIndex].noEmpleado = b4.noEmpleado;
      }
      if (!consolidated[existingIndex].capacidad && b4.capacidad) {
        consolidated[existingIndex].capacidad = b4.capacidad;
      }
      if (!consolidated[existingIndex].edificio && b4.edificio) {
        consolidated[existingIndex].edificio = b4.edificio;
      }
    } else {
      // Agregar como nueva reserva de aula
      consolidated.push({ ...b4 });
    }
  }

  return consolidated;
}

/**
 * Aplica las correcciones con prioridad absoluta reemplazando los registros originales
 */
export function applyCorrections(
  baseSessions: ScheduleSession[],
  corrections: CorrectionRecord[]
): { sessions: ScheduleSession[]; appliedCount: number } {
  let sessions = [...baseSessions];
  let appliedCount = 0;

  for (const corr of corrections) {
    const tipoAjuste = corr.tipoAjuste.toLowerCase();
    const isCancelacion = tipoAjuste.includes('cancelac') || corr.estadoAjuste.toLowerCase().includes('cancelad') || corr.diaSolicitado.toLowerCase().includes('no aplica');

    // Extraer campos de búsqueda para identificar el registro actual
    const profKey = corr.profesor;
    const asigKey = corr.asignatura;
    const grpKey = corr.grupo;
    const diaActual = normalizeDay(corr.diaActual);
    const timeActual = parseTimeRange(corr.horarioActual);
    const roomActual = normalizeClassroom(corr.salonActual);

    // Buscar el registro original más específico
    let matchedIndices: number[] = [];

    // Estrategia 1: Coincidencia por Profesor + Asignatura + Día (si existe) + Horario (si existe)
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];

      const matchProf = profKey ? isSameProfessor(s.profesor, profKey) : true;
      const matchAsig = asigKey ? isSameSubject(s.asignatura, asigKey) : true;
      const matchGrp = grpKey && s.grupo ? isSameGroup(s.grupo, grpKey) : true;
      const matchDay = diaActual ? s.dia === diaActual : true;
      
      let matchTime = true;
      if (timeActual) {
        const sStart = timeToMinutes(timeActual.start);
        const sEnd = timeToMinutes(timeActual.end);
        // Solapamiento o coincidencia cercana
        matchTime = s.startMinutes < sEnd + 15 && s.endMinutes > sStart - 15;
      }

      let matchRoom = true;
      if (roomActual && roomActual !== 'Sin Aula Asignada') {
        matchRoom = s.aula === roomActual || (s.aulaOriginal && s.aulaOriginal.includes(corr.salonActual));
      }

      // Si tenemos profesor y asignatura coincidentes, y día/horario concuerdan
      if (matchProf && matchAsig && (profKey || asigKey)) {
        if (diaActual && matchDay && matchTime) {
          matchedIndices.push(i);
        } else if (!diaActual && (matchRoom || matchTime || matchGrp)) {
          matchedIndices.push(i);
        }
      }
    }

    // Si no se encontró por combinación estricta, relajar búsqueda por profesor y día/horario
    if (matchedIndices.length === 0 && profKey && (diaActual || timeActual)) {
      for (let i = 0; i < sessions.length; i++) {
        const s = sessions[i];
        if (isSameProfessor(s.profesor, profKey)) {
          const matchDay = diaActual ? s.dia === diaActual : true;
          let matchTime = true;
          if (timeActual) {
            const sStart = timeToMinutes(timeActual.start);
            const sEnd = timeToMinutes(timeActual.end);
            matchTime = s.startMinutes < sEnd + 15 && s.endMinutes > sStart - 15;
          }
          if (matchDay && matchTime) {
            matchedIndices.push(i);
          }
        }
      }
    }

    // Si es una cancelación, remover los registros encontrados
    if (isCancelacion) {
      if (matchedIndices.length > 0) {
        sessions = sessions.filter((_, idx) => !matchedIndices.includes(idx));
        appliedCount++;
      }
      continue;
    }

    // Determinar los nuevos valores solicitados
    const diaNuevo = normalizeDay(corr.diaSolicitado) || diaActual;
    const timeNuevo = parseTimeRange(corr.horarioSolicitado) || timeActual;
    const roomNuevo = corr.salonSolicitadoNuevo ? normalizeClassroom(corr.salonSolicitadoNuevo) : null;

    if (matchedIndices.length > 0) {
      // Reemplazar los registros coincidentes
      for (const idx of matchedIndices) {
        const orig = sessions[idx];
        const updatedDia = diaNuevo || orig.dia;
        const updatedStart = timeNuevo ? timeNuevo.start : orig.horaInicio;
        const updatedEnd = timeNuevo ? timeNuevo.end : orig.horaFin;
        const startMinutes = timeToMinutes(updatedStart);
        const endMinutes = timeToMinutes(updatedEnd);
        const updatedRoom = (roomNuevo && roomNuevo !== 'Sin Aula Asignada') ? roomNuevo : orig.aula;

        sessions[idx] = {
          ...orig,
          dia: updatedDia,
          diaIndex: getDayIndex(updatedDia),
          horaInicio: updatedStart,
          horaFin: updatedEnd,
          startMinutes,
          endMinutes,
          durationMinutes: Math.max(0, endMinutes - startMinutes),
          aula: updatedRoom,
          aulaOriginal: corr.salonSolicitadoNuevo || orig.aulaOriginal,
          isCorrection: true,
          correctionId: corr.id,
          correctionNote: corr.observaciones || `${corr.tipoAjuste}: ${corr.estadoAjuste}`
        };
      }
      appliedCount++;
    } else if (diaNuevo && timeNuevo) {
      // Si no existía en la base original pero es una adición o cambio explícito, insertarlo como nuevo
      const startMinutes = timeToMinutes(timeNuevo.start);
      const endMinutes = timeToMinutes(timeNuevo.end);
      sessions.push({
        id: `Corr_${corr.id}`,
        source: 'Corrección',
        profesor: corr.profesor || 'Docente por Asignar',
        noEmpleado: '',
        asignatura: corr.asignatura || 'Asignatura en Corrección',
        claveUA: '',
        grupo: corr.grupo || '',
        subgrupo: '',
        tipo: corr.tipoActividad || 'C',
        aula: roomNuevo || 'Sin Aula Asignada',
        aulaOriginal: corr.salonSolicitadoNuevo,
        edificio: '',
        capacidad: null,
        programa: '',
        dia: diaNuevo,
        diaIndex: getDayIndex(diaNuevo),
        horaInicio: timeNuevo.start,
        horaFin: timeNuevo.end,
        startMinutes,
        endMinutes,
        durationMinutes: Math.max(0, endMinutes - startMinutes),
        isCorrection: true,
        correctionId: corr.id,
        correctionNote: corr.observaciones || `${corr.tipoAjuste}: ${corr.estadoAjuste}`
      });
      appliedCount++;
    }
  }

  return { sessions, appliedCount };
}

/**
 * Determina si una sesión es una Práctica de Campo (P) o Investigación Dirigida (I)
 * Las cuales están exentas de considerarse choques/conflictos de horario según normativa FCM.
 */
export function isConflictExempt(s: ScheduleSession): boolean {
  if (!s) return false;

  // 1. Tipo de actividad
  const tipo = cleanText(s.tipo || '').toUpperCase();
  if (
    tipo === 'P' || 
    tipo.startsWith('P ') || 
    tipo.startsWith('P-') || 
    tipo.startsWith('P -') || 
    tipo === 'PRAC' || 
    tipo === 'PRACTICA' || 
    tipo === 'PRÁCTICA'
  ) {
    return true;
  }
  if (
    tipo === 'I' || 
    tipo.startsWith('I ') || 
    tipo.startsWith('I-') || 
    tipo.startsWith('I -') || 
    tipo === 'INV' || 
    tipo === 'INVESTIGACION' || 
    tipo === 'INVESTIGACIÓN'
  ) {
    return true;
  }

  // 2. Nombre de la asignatura / actividad
  const asig = cleanText(s.asignatura || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (
    asig.includes('PRACTICA DE CAMPO') ||
    asig.includes('PRACTICAS DE CAMPO') ||
    asig.includes('PRAC. CAMPO') ||
    asig.includes('PRAC CAMPO') ||
    asig.includes('PRACTICA CAMPO') ||
    asig.includes('INVESTIGACION DIRIGIDA') ||
    asig.includes('INVESTIGACIONES DIRIGIDAS') ||
    asig.includes('INV DIRIGIDA') ||
    asig.includes('INV. DIRIGIDA') ||
    asig.includes('INV.DIRIGIDA') ||
    asig.includes('INVESTIGACION') ||
    asig.includes('DE CAMPO')
  ) {
    return true;
  }

  // 3. Aula o espacio físico
  const aula = cleanText(s.aula || '').toUpperCase();
  const aulaOrig = cleanText(s.aulaOriginal || '').toUpperCase();
  if (aula.includes('CAMPO') || aulaOrig.includes('CAMPO')) {
    return true;
  }

  return false;
}

/**
 * Calcula conflictos sobre el horario consolidado:
 * - Choque de profesor: mismo profesor, mismo día, horarios que se empalmen (inicioA < finB && finA > inicioB).
 * - Choque de aula: misma aula, mismo día, horarios que se empalmen.
 * - Choque de grupo: mismo grupo, mismo día, horarios que se empalmen.
 * NOTA: Las prácticas de campo (P) y las investigaciones dirigidas están exentas de marcarse como choque.
 */
export function calculateConflicts(sessions: ScheduleSession[]): { sessions: ScheduleSession[]; totalConflicts: number } {
  let totalConflicts = 0;

  // Reset conflict flags
  const updated = sessions.map(s => ({
    ...s,
    hasConflict: false,
    conflicts: [] as ConflictInfo[]
  }));

  for (let i = 0; i < updated.length; i++) {
    for (let j = i + 1; j < updated.length; j++) {
      const a = updated[i];
      const b = updated[j];

      // Mismo día requerido
      if (a.dia !== b.dia) continue;

      // Horarios que se empalman: inicioA < finB && finA > inicioB
      const overlap = a.startMinutes < b.endMinutes && a.endMinutes > b.startMinutes;
      if (!overlap) continue;

      // EXENCIÓN: Las prácticas de campo (P) y las investigaciones dirigidas
      // no se consideran como choque de conflicto
      if (isConflictExempt(a) || isConflictExempt(b)) {
        continue;
      }

      // 1. Choque de Profesor
      if (a.profesor && b.profesor && isSameProfessor(a.profesor, b.profesor)) {
        const descA = `Choque de profesor (${a.profesor}) con la materia "${b.asignatura}" (${b.horaInicio} - ${b.horaFin})`;
        const descB = `Choque de profesor (${b.profesor}) con la materia "${a.asignatura}" (${a.horaInicio} - ${a.horaFin})`;

        a.hasConflict = true;
        b.hasConflict = true;
        totalConflicts++;

        a.conflicts.push({
          type: 'profesor',
          description: descA,
          conflictingSession: {
            id: b.id,
            profesor: b.profesor,
            asignatura: b.asignatura,
            grupo: b.grupo,
            aula: b.aula,
            dia: b.dia,
            horaInicio: b.horaInicio,
            horaFin: b.horaFin
          }
        });

        b.conflicts.push({
          type: 'profesor',
          description: descB,
          conflictingSession: {
            id: a.id,
            profesor: a.profesor,
            asignatura: a.asignatura,
            grupo: a.grupo,
            aula: a.aula,
            dia: a.dia,
            horaInicio: a.horaInicio,
            horaFin: a.horaFin
          }
        });
      }

      // 2. Choque de Aula
      if (a.aula && b.aula && a.aula !== 'Sin Aula Asignada' && a.aula === b.aula) {
        const descA = `Choque de aula (${a.aula}) con "${b.asignatura}" / ${b.profesor} (${b.horaInicio} - ${b.horaFin})`;
        const descB = `Choque de aula (${b.aula}) con "${a.asignatura}" / ${a.profesor} (${a.horaInicio} - ${a.horaFin})`;

        a.hasConflict = true;
        b.hasConflict = true;
        totalConflicts++;

        a.conflicts.push({
          type: 'aula',
          description: descA,
          conflictingSession: {
            id: b.id,
            profesor: b.profesor,
            asignatura: b.asignatura,
            grupo: b.grupo,
            aula: b.aula,
            dia: b.dia,
            horaInicio: b.horaInicio,
            horaFin: b.horaFin
          }
        });

        b.conflicts.push({
          type: 'aula',
          description: descB,
          conflictingSession: {
            id: a.id,
            profesor: a.profesor,
            asignatura: a.asignatura,
            grupo: a.grupo,
            aula: a.aula,
            dia: a.dia,
            horaInicio: a.horaInicio,
            horaFin: a.horaFin
          }
        });
      }

      // 3. Choque de Grupo
      if (a.grupo && b.grupo && a.grupo.trim() !== '' && a.grupo === b.grupo && a.asignatura !== b.asignatura) {
        const descA = `Choque de grupo (${a.grupo}) con "${b.asignatura}" (${b.horaInicio} - ${b.horaFin})`;
        const descB = `Choque de grupo (${b.grupo}) con "${a.asignatura}" (${a.horaInicio} - ${a.horaFin})`;

        a.hasConflict = true;
        b.hasConflict = true;
        totalConflicts++;

        a.conflicts.push({
          type: 'grupo',
          description: descA,
          conflictingSession: {
            id: b.id,
            profesor: b.profesor,
            asignatura: b.asignatura,
            grupo: b.grupo,
            aula: b.aula,
            dia: b.dia,
            horaInicio: b.horaInicio,
            horaFin: b.horaFin
          }
        });

        b.conflicts.push({
          type: 'grupo',
          description: descB,
          conflictingSession: {
            id: a.id,
            profesor: a.profesor,
            asignatura: a.asignatura,
            grupo: a.grupo,
            aula: a.aula,
            dia: a.dia,
            horaInicio: a.horaInicio,
            horaFin: a.horaFin
          }
        });
      }
    }
  }

  return { sessions: updated, totalConflicts };
}

/**
 * Enriquece las sesiones con capacidad de grupos, alumnos inscritos y capacidad física del aula
 */
export function enrichSessionsWithCapacitiesAndEnrollment(
  sessions: ScheduleSession[],
  capList: CapacidadActividadRecord[],
  groupList: GrupoInscritosRecord[],
  roomCapMap: Map<string, { salon: string; capacidad: number; edificio: string }>
): ScheduleSession[] {
  // Indexar Base 5 (Capacidades por actividad)
  const capMap = new Map<string, CapacidadActividadRecord>();
  for (const c of capList) {
    const k1 = `${c.claveUA}_${c.grupo}_${c.subgrupo}`;
    const k2 = `${c.claveUA}_${c.grupo}`;
    const k3 = `${c.claveUA}`;
    if (!capMap.has(k1)) capMap.set(k1, c);
    if (!capMap.has(k2)) capMap.set(k2, c);
    if (!capMap.has(k3)) capMap.set(k3, c);
  }

  // Indexar Base 6 (Grupos e Inscritos)
  const groupMap = new Map<string, GrupoInscritosRecord>();
  for (const g of groupList) {
    const k1 = `${g.claveUA}_${g.grupo}_${g.subgrupo}`;
    const k2 = `${g.claveUA}_${g.grupo}`;
    const k3 = `${g.grupo}_${g.claveUA}`;
    const k4 = `${g.claveUA}`;
    if (!groupMap.has(k1)) groupMap.set(k1, g);
    if (!groupMap.has(k2)) groupMap.set(k2, g);
    if (!groupMap.has(k3)) groupMap.set(k3, g);
    if (!groupMap.has(k4)) groupMap.set(k4, g);
  }

  return sessions.map(session => {
    const s = { ...session };
    const clave = s.claveUA?.trim() || '';
    const grp = s.grupo?.trim() || '';
    const subg = s.subgrupo?.trim() || '0';

    // 1. Buscar en Base 5
    let matchedCap: CapacidadActividadRecord | undefined = undefined;
    if (clave && grp && subg && subg !== '0') {
      matchedCap = capMap.get(`${clave}_${grp}_${subg}`);
    }
    if (!matchedCap && clave && grp) {
      matchedCap = capMap.get(`${clave}_${grp}`);
    }
    if (!matchedCap && clave) {
      matchedCap = capMap.get(clave);
    }

    // 2. Buscar en Base 6
    let matchedGroup: GrupoInscritosRecord | undefined = undefined;
    if (clave && grp && subg && subg !== '0') {
      matchedGroup = groupMap.get(`${clave}_${grp}_${subg}`);
    }
    if (!matchedGroup && clave && grp) {
      matchedGroup = groupMap.get(`${clave}_${grp}`);
    }
    if (!matchedGroup && grp && clave) {
      matchedGroup = groupMap.get(`${grp}_${clave}`);
    }
    if (!matchedGroup && clave) {
      matchedGroup = groupMap.get(clave);
    }

    // Extraer cupo de grupo e inscritos
    let cupoGrupo: number | null = null;
    let inscritos: number | null = null;
    let carga: number | null = null;
    let evalVal: number | null = null;
    let subasta: number | null = null;

    if (matchedCap) {
      cupoGrupo = matchedCap.cupo;
      inscritos = matchedCap.totalInscritos;
      carga = matchedCap.carga;
      evalVal = matchedCap.eval;
    }

    if (matchedGroup) {
      if (cupoGrupo === null && matchedGroup.cupo !== null) {
        cupoGrupo = matchedGroup.cupo;
      }
      if (inscritos === null && matchedGroup.totalInscritos !== null) {
        inscritos = matchedGroup.totalInscritos;
      }
      subasta = matchedGroup.subasta;
      if (!s.programa && matchedGroup.carrera) {
        s.programa = matchedGroup.carrera;
      }
      if (!s.profesor && matchedGroup.docente) {
        s.profesor = matchedGroup.docente;
        s.noEmpleado = matchedGroup.noEmpleado;
      }
    }

    // 3. Buscar Capacidad Física del Salón / Aula
    let capacidadSalon: number | null = s.capacidad || null;
    if (s.aula && s.aula !== 'Sin Aula Asignada') {
      const normRoom = normalizeClassroom(s.aula);
      const roomInfo = roomCapMap.get(normRoom) || roomCapMap.get(s.aula.toUpperCase().trim());
      if (roomInfo) {
        capacidadSalon = roomInfo.capacidad;
        if (!s.edificio && roomInfo.edificio) {
          s.edificio = roomInfo.edificio;
        }
      }
    }

    // Cálculos de porcentajes y alerta de sobrecupo
    const porcentajeOcupacionGrupo = (cupoGrupo && cupoGrupo > 0 && inscritos !== null) 
      ? Math.round((inscritos / cupoGrupo) * 100) 
      : null;

    const porcentajeOcupacionSalon = (capacidadSalon && capacidadSalon > 0 && inscritos !== null) 
      ? Math.round((inscritos / capacidadSalon) * 100) 
      : null;

    const alertaSobrecupo = Boolean(capacidadSalon && inscritos !== null && inscritos > capacidadSalon);

    s.cupoGrupo = cupoGrupo;
    s.inscritos = inscritos;
    s.capacidadSalon = capacidadSalon;
    s.cargaInscritos = carga;
    s.evalInscritos = evalVal;
    s.subastaInscritos = subasta;
    s.porcentajeOcupacionGrupo = porcentajeOcupacionGrupo;
    s.porcentajeOcupacionSalon = porcentajeOcupacionSalon;
    s.alertaSobrecupo = alertaSobrecupo;

    return s;
  });
}

/**
 * Orquestador principal de carga y consolidación de datos
 */
export async function loadConsolidatedSchedule(): Promise<ConsolidatedData> {
  const sourcesStatus = {
    base1: false,
    base2: false,
    base3: false,
    base4: false,
    base5: false,
    base6: false,
    corrections: false,
    errorMessage: undefined as string | undefined,
    correctionsWarning: undefined as string | undefined
  };

  let b1Text = '';
  let b2Text = '';
  let b3Text = '';
  let b4Text = '';
  let b5Text = '';
  let b6Text = '';
  let cText = '';

  // 1. Cargar Base 1
  try {
    const res = await fetch(CONFIG.DATA_SOURCES.BASE_1_LICENCIATURA);
    if (res.ok) {
      b1Text = await res.text();
      sourcesStatus.base1 = true;
    }
  } catch {
    console.warn('Error al cargar Base 1');
  }

  // 2. Cargar Base 2
  try {
    const res = await fetch(CONFIG.DATA_SOURCES.BASE_2_POSGRADO);
    if (res.ok) {
      b2Text = await res.text();
      sourcesStatus.base2 = true;
    }
  } catch {
    console.warn('Error al cargar Base 2');
  }

  // 3. Cargar Base 3
  try {
    const res = await fetch(CONFIG.DATA_SOURCES.BASE_3_PROFESORES);
    if (res.ok) {
      b3Text = await res.text();
      sourcesStatus.base3 = true;
    }
  } catch {
    console.warn('Error al cargar Base 3');
  }

  // 4. Cargar Base 4
  try {
    const res = await fetch(CONFIG.DATA_SOURCES.BASE_4_AULAS);
    if (res.ok) {
      b4Text = await res.text();
      sourcesStatus.base4 = true;
    }
  } catch {
    console.warn('Error al cargar Base 4');
  }

  // 5. Cargar Base 5 (Capacidades e Inscritos por Actividad)
  try {
    const res = await fetch(CONFIG.DATA_SOURCES.BASE_5_CAPACIDADES);
    if (res.ok) {
      b5Text = await res.text();
      sourcesStatus.base5 = true;
    }
  } catch {
    console.warn('Error al cargar Base 5');
  }

  // 6. Cargar Base 6 (Grupos, Docentes e Inscritos)
  try {
    const res = await fetch(CONFIG.DATA_SOURCES.BASE_6_GRUPOS_INSCRITOS);
    if (res.ok) {
      b6Text = await res.text();
      sourcesStatus.base6 = true;
    }
  } catch {
    console.warn('Error al cargar Base 6');
  }

  // 7. Cargar Correcciones
  try {
    const res = await fetch(CONFIG.DATA_SOURCES.CORRECCIONES_CSV);
    if (res.ok) {
      cText = await res.text();
      sourcesStatus.corrections = true;
    } else {
      sourcesStatus.correctionsWarning = CONFIG.CORRECTIONS_ERROR_MESSAGE;
    }
  } catch {
    sourcesStatus.correctionsWarning = CONFIG.CORRECTIONS_ERROR_MESSAGE;
  }

  // Parsea cada fuente
  const s1 = b1Text ? parseStandardTable(b1Text, 'Base 1 (Licenciatura)') : [];
  const s2 = b2Text ? parseStandardTable(b2Text, 'Base 2 (Posgrado)') : [];
  const s3 = b3Text ? parseBase3(b3Text) : [];
  const s4 = b4Text ? parseBase4(b4Text) : [];
  const s5Caps = b5Text ? parseCapacidadesPorActividad(b5Text) : [];
  const s6Groups = b6Text ? parseGruposInscritos(b6Text) : [];
  const roomCapMap = b4Text ? extractRoomCapacitiesFromBase4(b4Text) : new Map();
  const corrections = cText ? parseCorrections(cText) : [];

  // Paso 1: Unificar 4 bases
  const merged = mergeFourBases(s1, s2, s3, s4);

  // Paso 2: Enriquecer con capacidades de grupo, inscritos y capacidad de aulas (Base 5 y 6)
  const enriched = enrichSessionsWithCapacitiesAndEnrollment(merged, s5Caps, s6Groups, roomCapMap);

  // Paso 3: Aplicar correcciones prioritarias
  const { sessions: correctedSessions, appliedCount } = applyCorrections(enriched, corrections);

  // Paso 4: Re-enriquecer aulas si cambiaron con las correcciones
  const finalEnriched = correctedSessions.map(sess => {
    if (sess.aula && sess.aula !== 'Sin Aula Asignada') {
      const normRoom = normalizeClassroom(sess.aula);
      const roomInfo = roomCapMap.get(normRoom) || roomCapMap.get(sess.aula.toUpperCase().trim());
      if (roomInfo) {
        sess.capacidadSalon = roomInfo.capacidad;
        if (sess.inscritos && roomInfo.capacidad) {
          sess.porcentajeOcupacionSalon = Math.round((sess.inscritos / roomInfo.capacidad) * 100);
          sess.alertaSobrecupo = sess.inscritos > roomInfo.capacidad;
        }
      }
    }
    return sess;
  });

  // Paso 5: Calcular conflictos sobre el horario consolidado
  const { sessions: finalSessions, totalConflicts } = calculateConflicts(finalEnriched);

  // Extraer listas únicas ordenadas para los autocompletados
  const profSet = new Set<string>();
  const roomSet = new Set<string>();
  const subjSet = new Set<string>();
  const grpSet = new Set<string>();
  const progSet = new Set<string>();

  for (const s of finalSessions) {
    if (s.profesor && s.profesor.trim().length > 2) profSet.add(s.profesor.trim());
    if (s.aula && s.aula !== 'Sin Aula Asignada' && s.aula.trim().length > 0) roomSet.add(s.aula.trim());
    if (s.asignatura && s.asignatura.trim().length > 2) subjSet.add(s.asignatura.trim());
    if (s.grupo && s.grupo.trim().length > 0 && s.grupo !== '-') grpSet.add(s.grupo.trim());
    if (s.programa && s.programa.trim().length > 2) progSet.add(s.programa.trim());
  }

  return {
    sessions: finalSessions,
    professors: Array.from(profSet).sort((a, b) => a.localeCompare(b, 'es')),
    classrooms: Array.from(roomSet).sort((a, b) => a.localeCompare(b, 'es', { numeric: true })),
    subjects: Array.from(subjSet).sort((a, b) => a.localeCompare(b, 'es')),
    groups: Array.from(grpSet).sort((a, b) => a.localeCompare(b, 'es', { numeric: true })),
    programs: Array.from(progSet).sort((a, b) => a.localeCompare(b, 'es')),
    corrections,
    appliedCorrectionsCount: appliedCount,
    conflictsCount: totalConflicts,
    sourcesStatus,
    lastLoadedAt: new Date()
  };
}
