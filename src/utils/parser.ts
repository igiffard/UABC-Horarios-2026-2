import Papa from 'papaparse';
import { ScheduleSession, CorrectionRecord, DayName } from '../types';
import { cleanText, normalizeDay, parseTimeRange, timeToMinutes, normalizeClassroom, getDayIndex } from './normalizer';

/**
 * Parsea tablas estándar (Base 1 y Base 2)
 */
export function parseStandardTable(csvText: string, sourceName: string): ScheduleSession[] {
  const parsed = Papa.parse<string[]>(csvText, { header: false, skipEmptyLines: true }).data;
  if (!parsed || parsed.length === 0) return [];

  let headerRow = -1;
  for (let i = 0; i < Math.min(10, parsed.length); i++) {
    const row = parsed[i];
    if (row.some(c => typeof c === 'string' && (c.includes('Nom. Empleado') || c.includes('Nombre UA') || c.includes('LUNES')))) {
      headerRow = i;
      break;
    }
  }
  if (headerRow === -1) return [];

  const headers = parsed[headerRow].map(h => cleanText(h).toUpperCase());
  const colIdx = {
    pe: headers.findIndex(h => h.includes('NOMBRE PE')),
    claveUA: headers.findIndex(h => h.includes('CLAVE UA')),
    nombreUA: headers.findIndex(h => h.includes('NOMBRE UA')),
    grupo: headers.findIndex(h => h === 'GRUPO'),
    subgrupo: headers.findIndex(h => h.includes('SUBGRUPO') || h === 'SUBGRUPO'),
    noEmpleado: headers.findIndex(h => h.includes('NO. EMPLEADO') || h.includes('NO.EMPLEADO')),
    nomEmpleado: headers.findIndex(h => h.includes('NOM. EMPLEADO') || h.includes('NOM.EMPLEADO') || h.includes('PROFESOR')),
    tipo: headers.findIndex(h => h === 'TIPO'),
    salon: headers.findIndex(h => h.includes('SALÓN') || h.includes('SALON')),
    capacidad: headers.findIndex(h => h.includes('CAPACIDAD')),
    edificio: headers.findIndex(h => h.includes('EDIFICIO')),
    lunes: headers.findIndex(h => h.includes('LUNES')),
    martes: headers.findIndex(h => h.includes('MARTES')),
    miercoles: headers.findIndex(h => h.includes('MIÉRCOLES') || h.includes('MIERCOLES')),
    jueves: headers.findIndex(h => h.includes('JUEVES')),
    viernes: headers.findIndex(h => h.includes('VIERNES')),
    sabado: headers.findIndex(h => h.includes('SÁBADO') || h.includes('SABADO')),
    domingo: headers.findIndex(h => h.includes('DOMINGO'))
  };

  const dayCols: { day: DayName; idx: number }[] = [
    { day: 'Lunes' as DayName, idx: colIdx.lunes },
    { day: 'Martes' as DayName, idx: colIdx.martes },
    { day: 'Miércoles' as DayName, idx: colIdx.miercoles },
    { day: 'Jueves' as DayName, idx: colIdx.jueves },
    { day: 'Viernes' as DayName, idx: colIdx.viernes },
    { day: 'Sábado' as DayName, idx: colIdx.sabado },
    { day: 'Domingo' as DayName, idx: colIdx.domingo }
  ].filter(d => d.idx !== -1);

  const results: ScheduleSession[] = [];

  for (let i = headerRow + 1; i < parsed.length; i++) {
    const row = parsed[i];
    if (!row || row.length === 0) continue;

    const prof = cleanText(row[colIdx.nomEmpleado]);
    const asig = cleanText(row[colIdx.nombreUA]);
    if (!prof && !asig) continue;

    const noEmpleado = cleanText(row[colIdx.noEmpleado]);
    const claveUA = cleanText(row[colIdx.claveUA]);
    const grupo = cleanText(row[colIdx.grupo]);
    const subgrupo = cleanText(row[colIdx.subgrupo]);
    const tipo = cleanText(row[colIdx.tipo]) || 'C';
    const rawSalon = cleanText(row[colIdx.salon]);
    const aula = normalizeClassroom(rawSalon);
    const edificio = cleanText(row[colIdx.edificio]);
    const capacidad = parseInt(cleanText(row[colIdx.capacidad]), 10) || null;
    const programa = cleanText(row[colIdx.pe]);

    for (const d of dayCols) {
      const timeVal = row[d.idx];
      if (!timeVal || !timeVal.trim()) continue;
      const tr = parseTimeRange(timeVal);
      if (!tr) continue;

      const startMinutes = timeToMinutes(tr.start);
      const endMinutes = timeToMinutes(tr.end);
      const durationMinutes = Math.max(0, endMinutes - startMinutes);

      results.push({
        id: `${sourceName}_${i}_${d.day}_${tr.start}`,
        source: sourceName,
        profesor: prof,
        noEmpleado,
        asignatura: asig,
        claveUA,
        grupo,
        subgrupo,
        tipo,
        aula,
        aulaOriginal: rawSalon,
        edificio,
        capacidad,
        programa,
        dia: d.day,
        diaIndex: getDayIndex(d.day),
        horaInicio: tr.start,
        horaFin: tr.end,
        startMinutes,
        endMinutes,
        durationMinutes
      });
    }
  }

  return results;
}

/**
 * Parsea Base 3 (Horarios por Profesor con matrices de 30 min)
 */
export function parseBase3(csvText: string): ScheduleSession[] {
  const parsed = Papa.parse<string[]>(csvText, { header: false, skipEmptyLines: false }).data;
  if (!parsed || parsed.length === 0) return [];

  const results: ScheduleSession[] = [];
  let i = 0;

  while (i < parsed.length) {
    const row = parsed[i];
    const rowStr = row.join(' ');
    if (rowStr.includes('PROFESOR:')) {
      let profFull = '';
      for (const cell of row) {
        if (cell && cell.includes('-') && !cell.includes('PROFESOR:')) {
          profFull = cleanText(cell);
          break;
        }
      }
      if (!profFull) {
        const pIdx = row.findIndex(c => c && c.includes('PROFESOR:'));
        for (let k = pIdx + 1; k < row.length; k++) {
          if (row[k] && row[k].trim()) {
            profFull = cleanText(row[k]);
            break;
          }
        }
      }

      let noEmpleado = '';
      let profName = profFull;
      if (profFull.includes('-')) {
        const parts = profFull.split('-');
        noEmpleado = parts[0].trim();
        profName = parts.slice(1).join('-').trim();
      }

      i++;
      while (i < parsed.length && !parsed[i].some(c => c && c.includes('HORARIO'))) {
        i++;
      }
      if (i >= parsed.length) break;

      const headerRow = parsed[i];
      const dayCols: { day: DayName; col: number }[] = [];
      const daysOrder: DayName[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      for (let c = 0; c < headerRow.length; c++) {
        const cell = cleanText(headerRow[c]).toUpperCase();
        for (const day of daysOrder) {
          const normD = day.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (cell.includes(normD)) {
            dayCols.push({ day, col: c });
          }
        }
      }

      i++;
      const timeSlots: { start: string; end: string; dayCodes: Record<string, string> }[] = [];
      while (i < parsed.length) {
        const tr = parsed[i];
        const firstCell = tr.find(c => c && /\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/.test(c));
        if (!firstCell) {
          if (tr.some(c => c && (c.includes('CLAVE') || c.includes('DESCRIPCIÓN') || c.includes('DESCRIPCION')))) {
            break;
          }
          if (tr.some(c => c && c.includes('PROFESOR:'))) {
            break;
          }
          i++;
          continue;
        }

        const timeMatch = firstCell.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
        if (timeMatch) {
          const start = timeMatch[1].padStart(5, '0');
          const end = timeMatch[2].padStart(5, '0');
          const dayCodes: Record<string, string> = {};
          for (const dc of dayCols) {
            const code = cleanText(tr[dc.col]);
            if (code) {
              dayCodes[dc.day] = code;
            }
          }
          timeSlots.push({ start, end, dayCodes });
        }
        i++;
      }

      // Read subject lookup table in footer of block
      const subjectsMap: Record<string, { clave: string; grupo: string; subgrupo: string; salon: string; descripcion: string; tipo: string }> = {};
      if (i < parsed.length && parsed[i].some(c => c && (c.includes('CLAVE') || c.includes('DESCRIPCIÓN')))) {
        i++;
        while (i < parsed.length) {
          const sr = parsed[i];
          if (sr.some(c => c && c.includes('PROFESOR:'))) break;
          const nonEmpties = sr.map(c => cleanText(c)).filter(Boolean);
          if (nonEmpties.length >= 2) {
            const clave = cleanText(sr[1]);
            const grupo = cleanText(sr[2]);
            const subg = cleanText(sr[4]);
            const salon = cleanText(sr[6]);
            const desc = cleanText(sr.find((c, idx) => idx >= 7 && cleanText(c).length > 3 && !c.includes('FAC.') && !c.includes('CLASE') && !c.includes('TALLER') && !c.includes('LABORATORIO') && !c.includes('ACTIVIDAD') && !c.includes('2026')));
            const tipoCell = cleanText(sr.find(c => c && (c.includes('CLASE') || c.includes('TALLER') || c.includes('LABORATORIO') || c.includes('ACTIVIDAD') || c.includes('P - PRACTICA'))));
            let tipo = 'C';
            if (tipoCell) {
              tipo = tipoCell.split('-')[0].trim();
            }

            if (clave) {
              const fullKey1 = `401-${grupo}-${subg}-${clave}`;
              const fullKey2 = `${clave}-${grupo}-${subg}`;
              const data = { clave, grupo, subgrupo: subg, salon, descripcion: desc, tipo };
              subjectsMap[fullKey1] = data;
              subjectsMap[fullKey2] = data;
              subjectsMap[clave] = data;
              if (clave.startsWith('0000')) {
                subjectsMap[`401- - - ${clave.slice(-2)}`] = data;
                subjectsMap[`401- - - ${parseInt(clave.slice(-2), 10)}`] = data;
              }
            }
          }
          i++;
        }
      }

      // Merge contiguous time slots
      for (const day of daysOrder) {
        let currentSpan: { code: string; start: string; end: string } | null = null;
        for (const slot of timeSlots) {
          const code = slot.dayCodes[day];
          if (code) {
            if (currentSpan && currentSpan.code === code && currentSpan.end === slot.start) {
              currentSpan.end = slot.end;
            } else {
              if (currentSpan) {
                results.push(buildBase3Record(currentSpan, profName, noEmpleado, subjectsMap, day));
              }
              currentSpan = { code, start: slot.start, end: slot.end };
            }
          } else {
            if (currentSpan) {
              results.push(buildBase3Record(currentSpan, profName, noEmpleado, subjectsMap, day));
              currentSpan = null;
            }
          }
        }
        if (currentSpan) {
          results.push(buildBase3Record(currentSpan, profName, noEmpleado, subjectsMap, day));
        }
      }
      continue;
    }
    i++;
  }

  return results;
}

function buildBase3Record(
  span: { code: string; start: string; end: string },
  profName: string,
  noEmpleado: string,
  subjectsMap: Record<string, { clave: string; grupo: string; subgrupo: string; salon: string; descripcion: string; tipo: string }>,
  day: DayName
): ScheduleSession {
  const sub = subjectsMap[span.code] || subjectsMap[span.code.replace(/\s+/g, ' ')] || { clave: '', grupo: '', subgrupo: '', salon: '', descripcion: '', tipo: 'A' };
  const startMinutes = timeToMinutes(span.start);
  const endMinutes = timeToMinutes(span.end);
  const aula = normalizeClassroom(sub.salon);

  return {
    id: `Base3_${noEmpleado}_${day}_${span.start}_${span.code}`,
    source: 'Base 3 (Profesor)',
    profesor: profName,
    noEmpleado,
    asignatura: sub.descripcion || span.code,
    claveUA: sub.clave,
    grupo: sub.grupo,
    subgrupo: sub.subgrupo,
    tipo: sub.tipo || 'C',
    aula,
    aulaOriginal: sub.salon,
    edificio: '',
    capacidad: null,
    programa: '',
    dia: day,
    diaIndex: getDayIndex(day),
    horaInicio: span.start,
    horaFin: span.end,
    startMinutes,
    endMinutes,
    durationMinutes: Math.max(0, endMinutes - startMinutes)
  };
}

/**
 * Parsea Base 4 (Horarios por Salón con matrices de 30 min)
 */
export function parseBase4(csvText: string): ScheduleSession[] {
  const parsed = Papa.parse<string[]>(csvText, { header: false, skipEmptyLines: false }).data;
  if (!parsed || parsed.length === 0) return [];

  const results: ScheduleSession[] = [];
  let i = 0;

  while (i < parsed.length) {
    const row = parsed[i];
    const rowStr = row.join(' ');
    if (rowStr.includes('SALÓN:') || rowStr.includes('SALON:')) {
      let edificio = '';
      let salon = '';
      let capacidad: number | null = null;

      for (let k = Math.max(0, i - 3); k <= i + 1; k++) {
        const rk = parsed[k] || [];
        const rkStr = rk.join(' ');
        if (rkStr.includes('EDIFICIO:')) {
          const edIdx = rk.findIndex(c => c && c.includes('EDIFICIO:'));
          for (let col = edIdx + 1; col < rk.length; col++) {
            if (rk[col] && rk[col].trim()) {
              edificio = cleanText(rk[col]);
              break;
            }
          }
        }
        if (rkStr.includes('SALÓN:') || rkStr.includes('SALON:')) {
          const sIdx = rk.findIndex(c => c && (c.includes('SALÓN:') || c.includes('SALON:')));
          for (let col = sIdx + 1; col < rk.length; col++) {
            if (rk[col] && rk[col].trim() && !rk[col].includes('CAPACIDAD:')) {
              salon = cleanText(rk[col]);
              break;
            }
          }
        }
        if (rkStr.includes('CAPACIDAD:')) {
          const capIdx = rk.findIndex(c => c && c.includes('CAPACIDAD:'));
          for (let col = capIdx + 1; col < rk.length; col++) {
            if (rk[col] && rk[col].trim()) {
              const num = parseInt(cleanText(rk[col]), 10);
              if (!isNaN(num)) capacidad = num;
              break;
            }
          }
        }
      }

      i++;
      while (i < parsed.length && !parsed[i].some(c => c && c.includes('HORARIO'))) {
        i++;
      }
      if (i >= parsed.length) break;

      const headerRow = parsed[i];
      const dayCols: { day: DayName; col: number }[] = [];
      const daysOrder: DayName[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      for (let c = 0; c < headerRow.length; c++) {
        const cell = cleanText(headerRow[c]).toUpperCase();
        for (const day of daysOrder) {
          const normD = day.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (cell.includes(normD)) {
            dayCols.push({ day, col: c });
          }
        }
      }

      i++;
      const timeSlots: { start: string; end: string; dayCodes: Record<string, string> }[] = [];
      while (i < parsed.length) {
        const tr = parsed[i];
        const firstCell = tr.find(c => c && /\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/.test(c));
        if (!firstCell) {
          if (tr.some(c => c && (c.includes('CVE') || c.includes('ASIGNATURA')))) {
            break;
          }
          if (tr.some(c => c && (c.includes('SALÓN:') || c.includes('SALON:')))) {
            break;
          }
          i++;
          continue;
        }

        const timeMatch = firstCell.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
        if (timeMatch) {
          const start = timeMatch[1].padStart(5, '0');
          const end = timeMatch[2].padStart(5, '0');
          const dayCodes: Record<string, string> = {};
          for (const dc of dayCols) {
            const code = cleanText(tr[dc.col]);
            if (code) {
              dayCodes[dc.day] = code;
            }
          }
          timeSlots.push({ start, end, dayCodes });
        }
        i++;
      }

      const subjectsMap: Record<string, { clave: string; asignatura: string; grupo: string; subgrupo: string; tipo: string; profesor: string; noEmpleado: string }> = {};
      if (i < parsed.length && parsed[i].some(c => c && (c.includes('CVE') || c.includes('ASIGNATURA')))) {
        i++;
        while (i < parsed.length) {
          const sr = parsed[i];
          if (sr.some(c => c && (c.includes('SALÓN:') || c.includes('SALON:')))) break;
          const nonEmpties = sr.map(c => cleanText(c)).filter(Boolean);
          if (nonEmpties.length >= 2) {
            const clave = cleanText(sr[1]);
            const asig = cleanText(sr[2]);
            const grupo = cleanText(sr[6]);
            const subg = cleanText(sr[8]);
            const tipo = cleanText(sr[10]);
            const profCell = cleanText(sr.find((c, idx) => idx >= 12 && cleanText(c).length > 3));
            let noEmpleado = '';
            let nomProf = profCell;
            if (profCell) {
              const pMatch = profCell.match(/^(\d+)\s+(.*)$/);
              if (pMatch) {
                noEmpleado = pMatch[1];
                nomProf = pMatch[2];
              }
            }

            if (clave) {
              const fullKey = `${clave}-${grupo}-${subg}-${tipo}-${noEmpleado}`;
              const fullKeyShort = `${clave}-${grupo}-${subg}`;
              const data = { clave, asignatura: asig, grupo, subgrupo: subg, tipo, profesor: nomProf, noEmpleado };
              subjectsMap[fullKey] = data;
              subjectsMap[fullKeyShort] = data;
              subjectsMap[clave] = data;
            }
          }
          i++;
        }
      }

      for (const day of daysOrder) {
        let currentSpan: { code: string; start: string; end: string } | null = null;
        for (const slot of timeSlots) {
          const code = slot.dayCodes[day];
          if (code) {
            if (currentSpan && currentSpan.code === code && currentSpan.end === slot.start) {
              currentSpan.end = slot.end;
            } else {
              if (currentSpan) {
                results.push(buildBase4Record(currentSpan, salon, edificio, capacidad, subjectsMap, day));
              }
              currentSpan = { code, start: slot.start, end: slot.end };
            }
          } else {
            if (currentSpan) {
              results.push(buildBase4Record(currentSpan, salon, edificio, capacidad, subjectsMap, day));
              currentSpan = null;
            }
          }
        }
        if (currentSpan) {
          results.push(buildBase4Record(currentSpan, salon, edificio, capacidad, subjectsMap, day));
        }
      }
      continue;
    }
    i++;
  }

  return results;
}

function buildBase4Record(
  span: { code: string; start: string; end: string },
  salon: string,
  edificio: string,
  capacidad: number | null,
  subjectsMap: Record<string, { clave: string; asignatura: string; grupo: string; subgrupo: string; tipo: string; profesor: string; noEmpleado: string }>,
  day: DayName
): ScheduleSession {
  const sub = subjectsMap[span.code] || subjectsMap[span.code.replace(/\s+/g, ' ')] || { clave: '', asignatura: '', grupo: '', subgrupo: '', tipo: 'C', profesor: '', noEmpleado: '' };
  const startMinutes = timeToMinutes(span.start);
  const endMinutes = timeToMinutes(span.end);
  const aula = normalizeClassroom(salon);

  return {
    id: `Base4_${salon}_${day}_${span.start}_${span.code}`,
    source: 'Base 4 (Salón)',
    profesor: sub.profesor,
    noEmpleado: sub.noEmpleado,
    asignatura: sub.asignatura || span.code,
    claveUA: sub.clave,
    grupo: sub.grupo,
    subgrupo: sub.subgrupo,
    tipo: sub.tipo || 'C',
    aula,
    aulaOriginal: salon,
    edificio,
    capacidad,
    programa: '',
    dia: day,
    diaIndex: getDayIndex(day),
    horaInicio: span.start,
    horaFin: span.end,
    startMinutes,
    endMinutes,
    durationMinutes: Math.max(0, endMinutes - startMinutes)
  };
}

/**
 * Parsea el CSV de Correcciones
 */
export function parseCorrections(csvText: string): CorrectionRecord[] {
  const parsed = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true }).data;
  if (!parsed || parsed.length === 0) return [];

  return parsed.map((row, idx) => ({
    id: cleanText(row['ID'] || String(idx + 1)),
    fuenteRemitente: cleanText(row['Fuente_remitente']),
    profesor: cleanText(row['Profesor_a']),
    asignatura: cleanText(row['Asignatura']),
    grupo: cleanText(row['Grupo_ciclo']),
    tipoActividad: cleanText(row['Tipo_actividad']),
    diaActual: cleanText(row['Dia_actual']),
    horarioActual: cleanText(row['Horario_actual']),
    salonActual: cleanText(row['Salon_actual']),
    diaSolicitado: cleanText(row['Dia_solicitado']),
    horarioSolicitado: cleanText(row['Horario_solicitado']),
    salonSolicitadoNuevo: cleanText(row['Salon_solicitado_nuevo']),
    registroActualCompleto: cleanText(row['Registro_actual_completo']),
    registroSolicitadoCompleto: cleanText(row['Registro_solicitado_completo']),
    tipoAjuste: cleanText(row['Tipo_de_ajuste']),
    estadoAjuste: cleanText(row['Estado_del_ajuste']),
    disponibilidadVerificada: cleanText(row['Disponibilidad_verificada']),
    personasNotificadas: cleanText(row['Personas_grupo_notificadas']),
    motivo: cleanText(row['Motivo']),
    accionPendiente: cleanText(row['Accion_pendiente']),
    observaciones: cleanText(row['Observaciones'])
  }));
}

export interface CapacidadActividadRecord {
  claveUA: string;
  asignatura: string;
  tipo: string;
  grupo: string;
  subgrupo: string;
  cupo: number | null;
  carga: number | null;
  eval: number | null;
  totalInscritos: number | null;
}

export interface GrupoInscritosRecord {
  carrera: string;
  grupo: string;
  subgrupo: string;
  tipo: string;
  claveUA: string;
  cupo: number | null;
  subasta: number | null;
  totalInscritos: number | null;
  noEmpleado: string;
  docente: string;
}

/**
 * Parsea Base 5: Concentrado de capacidades por actividad (Capacidad de grupos e inscritos)
 */
export function parseCapacidadesPorActividad(csvText: string): CapacidadActividadRecord[] {
  const parsed = Papa.parse<string[]>(csvText, { header: false, skipEmptyLines: true }).data;
  if (!parsed || parsed.length === 0) return [];

  const results: CapacidadActividadRecord[] = [];
  let started = false;

  for (let i = 0; i < parsed.length; i++) {
    const row = parsed[i];
    if (row.some(c => c && (c.includes('Actividad') || c.includes('Gpo / Subgpo')) && (c.includes('Capacidad') || c.includes('Inscritos')))) {
      started = true;
      continue;
    }
    if (!started) continue;

    const cells = row.map(c => cleanText(c)).filter(Boolean);
    if (cells.length >= 6) {
      const claveUA = cleanText(cells[0]);
      const asig = cleanText(cells[1]);
      const tipo = cleanText(cells[2]);
      const grupo = cleanText(cells[3]);
      const subgrupo = cleanText(cells[4]) || '0';
      const cupo = parseInt(cleanText(cells[5]), 10) || null;
      const carga = parseInt(cleanText(cells[6]), 10) || 0;
      const evalVal = parseInt(cleanText(cells[7]), 10) || 0;
      const totalInscritos = parseInt(cleanText(cells[cells.length - 1]), 10) || 0;

      if (claveUA && !isNaN(Number(claveUA))) {
        results.push({
          claveUA,
          asignatura: asig,
          tipo,
          grupo,
          subgrupo,
          cupo,
          carga,
          eval: evalVal,
          totalInscritos
        });
      }
    }
  }

  return results;
}

/**
 * Parsea Base 6: Grupos, Docentes e Inscritos
 */
export function parseGruposInscritos(csvText: string): GrupoInscritosRecord[] {
  const parsed = Papa.parse<string[]>(csvText, { header: false, skipEmptyLines: true }).data;
  if (!parsed || parsed.length === 0) return [];

  const results: GrupoInscritosRecord[] = [];
  let currentCarrera = '';

  for (let i = 0; i < parsed.length; i++) {
    const row = parsed[i];
    const rowStr = row.join(' ');
    if (rowStr.includes('Carrera:')) {
      currentCarrera = rowStr.replace(/.*Carrera:/, '').replace(/\s+/g, ' ').trim();
      continue;
    }
    if (
      rowStr.includes('UNIVERSIDAD') ||
      rowStr.includes('Grupo Planta') ||
      rowStr.includes('Sub Gpo') ||
      rowStr.includes('Subasta') ||
      rowStr.includes('COORDINACIÓN')
    ) {
      continue;
    }

    const cells = row.map(c => cleanText(c)).filter(Boolean);
    if (cells.length >= 7) {
      const grupo = cleanText(cells[0]);
      const subgrupo = cleanText(cells[1]) || '0';
      const tipo = cleanText(cells[2]);
      const claveUA = cleanText(cells[3]);
      const cupo = parseInt(cleanText(cells[4]), 10) || null;
      const subasta = parseInt(cleanText(cells[5]), 10) || 0;
      const totalInscritos = parseInt(cleanText(cells[6]), 10) || 0;
      const noEmpleado = cleanText(cells[7]) || '';
      const docente = cleanText(cells[8]) || '';

      if (claveUA && !isNaN(Number(claveUA))) {
        results.push({
          carrera: currentCarrera,
          grupo,
          subgrupo,
          tipo,
          claveUA,
          cupo,
          subasta,
          totalInscritos,
          noEmpleado,
          docente
        });
      }
    }
  }

  return results;
}

/**
 * Extrae el catálogo completo de aulas físicas con su capacidad máxima y edificio desde Base 4
 */
export function extractRoomCapacitiesFromBase4(csvText: string): Map<string, { salon: string; capacidad: number; edificio: string }> {
  const parsed = Papa.parse<string[]>(csvText, { header: false, skipEmptyLines: false }).data;
  const roomMap = new Map<string, { salon: string; capacidad: number; edificio: string }>();
  if (!parsed || parsed.length === 0) return roomMap;

  for (let i = 0; i < parsed.length; i++) {
    const row = parsed[i];
    const str = row.join(' ');
    if (str.includes('SALÓN:') || str.includes('SALON:')) {
      let salon = '';
      let cap: number | null = null;
      let edif = '';

      for (let k = Math.max(0, i - 3); k <= i + 1; k++) {
        const rk = parsed[k] || [];
        const rkStr = rk.join(' ');
        if (rkStr.includes('EDIFICIO:')) {
          const edIdx = rk.findIndex(c => c && c.includes('EDIFICIO:'));
          for (let col = edIdx + 1; col < rk.length; col++) {
            if (rk[col] && rk[col].trim()) {
              edif = cleanText(rk[col]);
              break;
            }
          }
        }
        if (rkStr.includes('SALÓN:') || rkStr.includes('SALON:')) {
          const sIdx = rk.findIndex(c => c && (c.includes('SALÓN:') || c.includes('SALON:')));
          for (let col = sIdx + 1; col < rk.length; col++) {
            if (rk[col] && rk[col].trim() && !rk[col].includes('CAPACIDAD:')) {
              salon = cleanText(rk[col]);
              break;
            }
          }
        }
        if (rkStr.includes('CAPACIDAD:')) {
          const capIdx = rk.findIndex(c => c && c.includes('CAPACIDAD:'));
          for (let col = capIdx + 1; col < rk.length; col++) {
            if (rk[col] && rk[col].trim()) {
              const num = parseInt(cleanText(rk[col]), 10);
              if (!isNaN(num)) cap = num;
              break;
            }
          }
        }
      }

      if (salon && cap !== null) {
        const normCode = normalizeClassroom(salon);
        roomMap.set(normCode, { salon, capacidad: cap, edificio: edif });
        roomMap.set(salon.toUpperCase().trim(), { salon, capacidad: cap, edificio: edif });
      }
    }
  }

  return roomMap;
}
