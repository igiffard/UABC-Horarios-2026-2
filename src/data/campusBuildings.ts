export interface CampusRoomInfo {
  code: string;
  name: string;
  buildingId: string;
  buildingName: string;
  buildingNumber: string;
  floor?: 'Planta Baja' | 'Planta Alta' | 'Parte Posterior' | 'Piso 2' | 'General';
  type: 'Aula / Salón' | 'Laboratorio' | 'Centro de Cómputo' | 'Taller' | 'Audiovisual' | 'Administrativo / Apoyo' | 'Virtual';
}

export interface CampusBuildingInfo {
  id: string; // 'E-13', 'E-14', 'E-15', etc.
  number: string; // '13', '14', etc.
  name: string;
  title: string;
  description: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  rooms: string[];
  floors: {
    plantaBaja?: { code: string; name: string }[];
    plantaAlta?: { code: string; name: string }[];
    partePosterior?: { code: string; name: string }[];
    otros?: { code: string; name: string }[];
  };
  // Position on Campus Map (coordinates relative to viewBox 0 0 1000 650)
  mapRect: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    sublabel?: string;
  };
}

export const ROOM_CATALOG: Record<string, CampusRoomInfo> = {
  // E-13
  'BUC': { code: 'BUC', name: 'Almacén de Buceo', buildingId: 'E-13', buildingName: 'Edificio 13', buildingNumber: '13', floor: 'Planta Baja', type: 'Administrativo / Apoyo' },
  'ALM': { code: 'ALM', name: 'Almacén General de la FCM', buildingId: 'E-13', buildingName: 'Edificio 13', buildingNumber: '13', floor: 'Planta Baja', type: 'Administrativo / Apoyo' },

  // E-14
  'SC': { code: 'SC', name: 'Sala de Consejo', buildingId: 'E-14', buildingName: 'Edificio 14 (Dirección FCM)', buildingNumber: '14', floor: 'Planta Baja', type: 'Administrativo / Apoyo' },
  'SA': { code: 'SA', name: 'Salón de Asesorías', buildingId: 'E-14', buildingName: 'Edificio 14 (Dirección FCM)', buildingNumber: '14', floor: 'Planta Baja', type: 'Aula / Salón' },
  'CPB': { code: 'CPB', name: 'Centro de Cómputo de Posgrado, Sala B', buildingId: 'E-14', buildingName: 'Edificio 14 (Dirección FCM)', buildingNumber: '14', floor: 'Planta Baja', type: 'Centro de Cómputo' },
  'CPA': { code: 'CPA', name: 'Centro de Cómputo de Posgrado, Sala A', buildingId: 'E-14', buildingName: 'Edificio 14 (Dirección FCM)', buildingNumber: '14', floor: 'Planta Baja', type: 'Centro de Cómputo' },
  'CCL': { code: 'CCL', name: 'Centro de Cómputo de Licenciatura', buildingId: 'E-14', buildingName: 'Edificio 14 (Dirección FCM)', buildingNumber: '14', floor: 'Planta Baja', type: 'Centro de Cómputo' },
  'SPD': { code: 'SPD', name: 'Sala de Procesamiento de Datos Oceanográficos', buildingId: 'E-14', buildingName: 'Edificio 14 (Dirección FCM)', buildingNumber: '14', floor: 'Planta Baja', type: 'Centro de Cómputo' },
  'DOM': { code: 'DOM', name: 'Domo Central FCM', buildingId: 'E-14', buildingName: 'Edificio 14 (Dirección FCM)', buildingNumber: '14', floor: 'Planta Baja', type: 'Aula / Salón' },
  'P5': { code: 'P5', name: 'Salón de Posgrado 5', buildingId: 'E-14', buildingName: 'Edificio 14 (Dirección FCM)', buildingNumber: '14', floor: 'Planta Baja', type: 'Aula / Salón' },

  // E-15
  'LZ': { code: 'LZ', name: 'Laboratorio de Zoología', buildingId: 'E-15', buildingName: 'Edificio 15', buildingNumber: '15', floor: 'Planta Baja', type: 'Laboratorio' },
  'LOB': { code: 'LOB', name: 'Laboratorio de Oceanografía Biológica', buildingId: 'E-15', buildingName: 'Edificio 15', buildingNumber: '15', floor: 'Planta Baja', type: 'Laboratorio' },
  'LMB': { code: 'LMB', name: 'Laboratorio de Microbiología', buildingId: 'E-15', buildingName: 'Edificio 15', buildingNumber: '15', floor: 'Planta Baja', type: 'Laboratorio' },
  'LQO': { code: 'LQO', name: 'Laboratorio de Química Orgánica', buildingId: 'E-15', buildingName: 'Edificio 15', buildingNumber: '15', floor: 'Planta Alta', type: 'Laboratorio' },
  'LBQ': { code: 'LBQ', name: 'Laboratorio de Bioquímica', buildingId: 'E-15', buildingName: 'Edificio 15', buildingNumber: '15', floor: 'Planta Alta', type: 'Laboratorio' },

  // E-16
  'SFE': { code: 'SFE', name: 'Sala de Física Experimental', buildingId: 'E-16', buildingName: 'Edificio 16', buildingNumber: '16', floor: 'Planta Baja', type: 'Laboratorio' },
  'SFF': { code: 'SFF', name: 'Sala de Física de Fluidos', buildingId: 'E-16', buildingName: 'Edificio 16', buildingNumber: '16', floor: 'Planta Baja', type: 'Laboratorio' },
  'LFQ': { code: 'LFQ', name: 'Laboratorio de Fisicoquímica', buildingId: 'E-16', buildingName: 'Edificio 16', buildingNumber: '16', floor: 'Planta Baja', type: 'Laboratorio' },
  'LPA': { code: 'LPA', name: 'Lab. de Procesamiento de Productos Acuáticos', buildingId: 'E-16', buildingName: 'Edificio 16', buildingNumber: '16', floor: 'Planta Baja', type: 'Laboratorio' },
  'LT': { code: 'LT', name: 'Laboratorio de Tamices', buildingId: 'E-16', buildingName: 'Edificio 16', buildingNumber: '16', floor: 'Planta Alta', type: 'Laboratorio' },
  'LOS': { code: 'LOS', name: 'Laboratorio de Oc. Geológica / Sedimentología', buildingId: 'E-16', buildingName: 'Edificio 16', buildingNumber: '16', floor: 'Planta Alta', type: 'Laboratorio' },
  'SGP': { code: 'SGP', name: 'Sala de Geología y Procesos Costeros', buildingId: 'E-16', buildingName: 'Edificio 16', buildingNumber: '16', floor: 'Planta Alta', type: 'Laboratorio' },

  // E-17
  'SFL': { code: 'SFL', name: 'Sala de Fluidos', buildingId: 'E-17', buildingName: 'Edificio 17', buildingNumber: '17', floor: 'Planta Baja', type: 'Laboratorio' },
  'SB': { code: 'SB', name: 'Sala de Biología', buildingId: 'E-17', buildingName: 'Edificio 17', buildingNumber: '17', floor: 'Planta Baja', type: 'Laboratorio' },
  'LG': { code: 'LG', name: 'Laboratorio de Genética', buildingId: 'E-17', buildingName: 'Edificio 17', buildingNumber: '17', floor: 'Planta Baja', type: 'Laboratorio' },
  'NUT': { code: 'NUT', name: 'Laboratorio de Nutrición', buildingId: 'E-17', buildingName: 'Edificio 17', buildingNumber: '17', floor: 'Planta Baja', type: 'Laboratorio' },
  'LNU': { code: 'LNU', name: 'Laboratorio de Nutrición', buildingId: 'E-17', buildingName: 'Edificio 17', buildingNumber: '17', floor: 'Planta Baja', type: 'Laboratorio' },
  'S8': { code: 'S8', name: 'Salón 8', buildingId: 'E-17', buildingName: 'Edificio 17', buildingNumber: '17', floor: 'Planta Alta', type: 'Aula / Salón' },
  'AM1': { code: 'AM1', name: 'Aula Magna I', buildingId: 'E-17', buildingName: 'Edificio 17', buildingNumber: '17', floor: 'Planta Alta', type: 'Aula / Salón' },
  'AM': { code: 'AM', name: 'Aula Magna I', buildingId: 'E-17', buildingName: 'Edificio 17', buildingNumber: '17', floor: 'Planta Alta', type: 'Aula / Salón' },
  'AM2': { code: 'AM2', name: 'Aula Magna II', buildingId: 'E-17', buildingName: 'Edificio 17', buildingNumber: '17', floor: 'Planta Alta', type: 'Aula / Salón' },
  'AF1': { code: 'AF1', name: 'Aula / Anexo de Física 1', buildingId: 'E-17', buildingName: 'Edificio 17', buildingNumber: '17', floor: 'Planta Baja', type: 'Aula / Salón' },
  'AF2': { code: 'AF2', name: 'Aula / Anexo de Física 2', buildingId: 'E-17', buildingName: 'Edificio 17', buildingNumber: '17', floor: 'Planta Baja', type: 'Aula / Salón' },
  'AF3': { code: 'AF3', name: 'Aula / Anexo de Física 3', buildingId: 'E-17', buildingName: 'Edificio 17', buildingNumber: '17', floor: 'Planta Baja', type: 'Aula / Salón' },

  // E-18
  'S1': { code: 'S1', name: 'Salón 1', buildingId: 'E-18', buildingName: 'Edificio 18', buildingNumber: '18', floor: 'Planta Baja', type: 'Aula / Salón' },
  'S2': { code: 'S2', name: 'Salón 2', buildingId: 'E-18', buildingName: 'Edificio 18', buildingNumber: '18', floor: 'Planta Baja', type: 'Aula / Salón' },
  'S3': { code: 'S3', name: 'Salón 3', buildingId: 'E-18', buildingName: 'Edificio 18', buildingNumber: '18', floor: 'Planta Baja', type: 'Aula / Salón' },
  'SG': { code: 'SG', name: 'Sala de Geología', buildingId: 'E-18', buildingName: 'Edificio 18', buildingNumber: '18', floor: 'Planta Baja', type: 'Aula / Salón' },
  'LTA': { code: 'LTA', name: 'Laboratorio de Tópicos de Acuacultura', buildingId: 'E-18', buildingName: 'Edificio 18', buildingNumber: '18', floor: 'Planta Baja', type: 'Laboratorio' },
  'S5': { code: 'S5', name: 'Salón 5', buildingId: 'E-18', buildingName: 'Edificio 18', buildingNumber: '18', floor: 'Planta Alta', type: 'Aula / Salón' },
  'S6': { code: 'S6', name: 'Salón 6', buildingId: 'E-18', buildingName: 'Edificio 18', buildingNumber: '18', floor: 'Planta Alta', type: 'Aula / Salón' },
  'S7': { code: 'S7', name: 'Salón 7', buildingId: 'E-18', buildingName: 'Edificio 18', buildingNumber: '18', floor: 'Planta Alta', type: 'Aula / Salón' },
  'LT2': { code: 'LT2', name: 'Laboratorio de Tamices II', buildingId: 'E-18', buildingName: 'Edificio 18', buildingNumber: '18', floor: 'Planta Alta', type: 'Laboratorio' },
  'ECO': { code: 'ECO', name: 'Taller de Ecotecnias', buildingId: 'E-18', buildingName: 'Edificio 18', buildingNumber: '18', floor: 'Parte Posterior', type: 'Taller' },
  'REU': { code: 'REU', name: 'Taller de Reutilización', buildingId: 'E-18', buildingName: 'Edificio 18', buildingNumber: '18', floor: 'Parte Posterior', type: 'Taller' },

  // E-20
  'LMO': { code: 'LMO', name: 'Laboratorio de Moluscos', buildingId: 'E-20', buildingName: 'Edificio 20', buildingNumber: '20', floor: 'Planta Baja', type: 'Laboratorio' },
  'LTO': { code: 'LTO', name: 'Laboratorio de Totoaba', buildingId: 'E-20', buildingName: 'Edificio 20', buildingNumber: '20', floor: 'Planta Alta', type: 'Laboratorio' },

  // E-21
  'ESP': { code: 'ESP', name: 'Salón de Especialidad', buildingId: 'E-21', buildingName: 'Edificio 21', buildingNumber: '21', floor: 'Planta Baja', type: 'Aula / Salón' },
  'PT': { code: 'PT', name: 'Prácticas de Topografía', buildingId: 'E-21', buildingName: 'Edificio 21', buildingNumber: '21', floor: 'Planta Baja', type: 'Laboratorio' },
  'GEO': { code: 'GEO', name: 'Salón de Geomática', buildingId: 'E-21', buildingName: 'Edificio 21', buildingNumber: '21', floor: 'Planta Alta', type: 'Aula / Salón' },
  'SJG': { code: 'SJG', name: 'Sala de Sistemas de Información Geográfica', buildingId: 'E-21', buildingName: 'Edificio 21', buildingNumber: '21', floor: 'Planta Alta', type: 'Centro de Cómputo' },
  'Ex oficina de José Luis Fermán, piso 2 de E21': { code: 'Ex oficina de José Luis Fermán, piso 2 de E21', name: 'Oficina y Espacio Académico (Piso 2 E21)', buildingId: 'E-21', buildingName: 'Edificio 21', buildingNumber: '21', floor: 'Piso 2', type: 'Aula / Salón' },

  // E-25 (IIO)
  'AVI': { code: 'AVI', name: 'Audiovisual IIO', buildingId: 'E-25', buildingName: 'Edificio 25 (IIO)', buildingNumber: '25', floor: 'Planta Baja', type: 'Audiovisual' },
  'AV': { code: 'AV', name: 'Audiovisual IIO', buildingId: 'E-25', buildingName: 'Edificio 25 (IIO)', buildingNumber: '25', floor: 'Planta Baja', type: 'Audiovisual' },
  'MAL': { code: 'MAL', name: 'Laboratorio de Macroalgas', buildingId: 'E-25', buildingName: 'Edificio 25 (IIO)', buildingNumber: '25', floor: 'Planta Baja', type: 'Laboratorio' },
  'MAI': { code: 'MAI', name: 'Laboratorio de Macroalgas (IIO)', buildingId: 'E-25', buildingName: 'Edificio 25 (IIO)', buildingNumber: '25', floor: 'Planta Baja', type: 'Laboratorio' },
  'MOL': { code: 'MOL', name: 'Laboratorio de Moluscos (IIO)', buildingId: 'E-25', buildingName: 'Edificio 25 (IIO)', buildingNumber: '25', floor: 'Planta Baja', type: 'Laboratorio' },
  'MOI': { code: 'MOI', name: 'Laboratorio de Moluscos (IIO)', buildingId: 'E-25', buildingName: 'Edificio 25 (IIO)', buildingNumber: '25', floor: 'Planta Baja', type: 'Laboratorio' },
  'CAI': { code: 'CAI', name: 'Laboratorio de Cultivos de Apoyo (IIO)', buildingId: 'E-25', buildingName: 'Edificio 25 (IIO)', buildingNumber: '25', floor: 'Planta Baja', type: 'Laboratorio' },
  'SP1': { code: 'SP1', name: 'Salón de Posgrado 1 (IIO)', buildingId: 'E-25', buildingName: 'Edificio 25 (IIO)', buildingNumber: '25', floor: 'Planta Baja', type: 'Aula / Salón' },
  'P1': { code: 'P1', name: 'Salón de Posgrado 1 (IIO)', buildingId: 'E-25', buildingName: 'Edificio 25 (IIO)', buildingNumber: '25', floor: 'Planta Baja', type: 'Aula / Salón' },
  'SP2': { code: 'SP2', name: 'Salón de Posgrado 2 (IIO)', buildingId: 'E-25', buildingName: 'Edificio 25 (IIO)', buildingNumber: '25', floor: 'Planta Baja', type: 'Aula / Salón' },
  'P2': { code: 'P2', name: 'Salón de Posgrado 2 (IIO)', buildingId: 'E-25', buildingName: 'Edificio 25 (IIO)', buildingNumber: '25', floor: 'Planta Baja', type: 'Aula / Salón' },
  'P3': { code: 'P3', name: 'Salón de Posgrado 3 (IIO)', buildingId: 'E-25', buildingName: 'Edificio 25 (IIO)', buildingNumber: '25', floor: 'Planta Baja', type: 'Aula / Salón' },
  'SPI': { code: 'SPI', name: 'Sala de Posgrado IIO', buildingId: 'E-25', buildingName: 'Edificio 25 (IIO)', buildingNumber: '25', floor: 'Planta Baja', type: 'Aula / Salón' },
  'IIO': { code: 'IIO', name: 'Auditorio / Espacio IIO', buildingId: 'E-25', buildingName: 'Edificio 25 (IIO)', buildingNumber: '25', floor: 'Planta Baja', type: 'Aula / Salón' },

  // E-41
  'LCA': { code: 'LCA', name: 'Lab. de Cultivos de Apoyo', buildingId: 'E-41', buildingName: 'Edificio 41', buildingNumber: '41', floor: 'Planta Baja', type: 'Laboratorio' },
  'LEO': { code: 'LEO', name: 'Laboratorio de Especies Ornamentales', buildingId: 'E-41', buildingName: 'Edificio 41', buildingNumber: '41', floor: 'Planta Baja', type: 'Laboratorio' },
  'CRU': { code: 'CRU', name: 'Laboratorio de Crustáceos', buildingId: 'E-41', buildingName: 'Edificio 41', buildingNumber: '41', floor: 'Planta Baja', type: 'Laboratorio' },
  'SIS': { code: 'SIS', name: 'Laboratorio de Sistemas', buildingId: 'E-41', buildingName: 'Edificio 41', buildingNumber: '41', floor: 'Planta Baja', type: 'Laboratorio' },
  'FIS': { code: 'FIS', name: 'Laboratorio de Fisiología', buildingId: 'E-41', buildingName: 'Edificio 41', buildingNumber: '41', floor: 'Planta Baja', type: 'Laboratorio' },
  'DIE': { code: 'DIE', name: 'Área de Ingeniería / Docencia', buildingId: 'E-41', buildingName: 'Edificio 41', buildingNumber: '41', floor: 'Planta Baja', type: 'Aula / Salón' },

  // E-56
  'TOA': { code: 'TOA', name: 'Salón Totoaba A', buildingId: 'E-56', buildingName: 'Edificio 56', buildingNumber: '56', floor: 'Planta Baja', type: 'Aula / Salón' },
  'Totoaba A': { code: 'Totoaba A', name: 'Salón Totoaba A', buildingId: 'E-56', buildingName: 'Edificio 56', buildingNumber: '56', floor: 'Planta Baja', type: 'Aula / Salón' },
  'TOB': { code: 'TOB', name: 'Salón Totoaba B', buildingId: 'E-56', buildingName: 'Edificio 56', buildingNumber: '56', floor: 'Planta Baja', type: 'Aula / Salón' },
  'PEC': { code: 'PEC', name: 'Laboratorio de Peces', buildingId: 'E-56', buildingName: 'Edificio 56', buildingNumber: '56', floor: 'Planta Baja', type: 'Laboratorio' },
  'LPE': { code: 'LPE', name: 'Laboratorio de Peces', buildingId: 'E-56', buildingName: 'Edificio 56', buildingNumber: '56', floor: 'Planta Baja', type: 'Laboratorio' },
  'SJT': { code: 'SJT', name: 'Sala / Laboratorio de Totoaba', buildingId: 'E-56', buildingName: 'Edificio 56', buildingNumber: '56', floor: 'Planta Baja', type: 'Laboratorio' },

  // Modalidad Virtual
  'VIR': { code: 'VIR', name: 'Aula Virtual (En Línea)', buildingId: 'VIRTUAL', buildingName: 'Modalidad Virtual', buildingNumber: 'V', floor: 'General', type: 'Virtual' },
};

export const CAMPUS_BUILDINGS: CampusBuildingInfo[] = [
  {
    id: 'E-13',
    number: '13',
    name: 'Edificio 13',
    title: 'Edificio 13 — Almacén General y Buceo',
    description: 'Instalaciones de almacenamiento de equipo oceanográfico y buceo científico de la facultad.',
    color: '#0284c7', // Sky
    badgeBg: 'bg-sky-50 border-sky-200 text-sky-800',
    badgeText: 'text-sky-700',
    rooms: ['BUC', 'ALM'],
    floors: {
      plantaBaja: [
        { code: 'BUC', name: 'Almacén de Buceo' },
        { code: 'ALM', name: 'Almacén General de la FCM' }
      ]
    },
    mapRect: { x: 145, y: 290, width: 32, height: 125, label: 'E-13', sublabel: 'Almacén / Buceo' }
  },
  {
    id: 'E-14',
    number: '14',
    name: 'Edificio 14 (Dirección)',
    title: 'Edificio 14 — Dirección y Cómputo FCM',
    description: 'Dirección de la FCM, Sala de Consejo, Salón de Asesorías, Domo y Centros de Cómputo de Licenciatura y Posgrado (CCL, CPB, CPA, SPD).',
    color: '#dc2626', // Red
    badgeBg: 'bg-red-50 border-red-200 text-red-800',
    badgeText: 'text-red-700',
    rooms: ['SC', 'SA', 'CPB', 'CCL', 'SPD', 'CPA', 'P5', 'DOM'],
    floors: {
      plantaBaja: [
        { code: 'SC', name: 'Sala de Consejo' },
        { code: 'SA', name: 'Salón de Asesorías' },
        { code: 'CPB', name: 'Centro de Cómputo de Posgrado, Sala B' },
        { code: 'CCL', name: 'Centro de Cómputo de Licenciatura' },
        { code: 'SPD', name: 'Sala de Procesamiento de Datos Oceanográficos' },
        { code: 'CPA', name: 'Centro de Cómputo de Posgrado, Sala A' },
        { code: 'DOM', name: 'Domo Central FCM' },
        { code: 'P5', name: 'Salón de Posgrado 5' }
      ]
    },
    mapRect: { x: 55, y: 240, width: 80, height: 120, label: 'E-14', sublabel: 'Dirección FCM' }
  },
  {
    id: 'E-15',
    number: '15',
    name: 'Edificio 15 (Biología y Química)',
    title: 'Edificio 15 — Laboratorios de Biología y Química',
    description: 'Laboratorios de Zoología, Oceanografía Biológica, Microbiología, Química Orgánica y Bioquímica.',
    color: '#059669', // Emerald
    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    badgeText: 'text-emerald-700',
    rooms: ['LZ', 'LOB', 'LMB', 'LQO', 'LBQ'],
    floors: {
      plantaBaja: [
        { code: 'LZ', name: 'Laboratorio de Zoología' },
        { code: 'LOB', name: 'Laboratorio de Oceanografía Biológica' },
        { code: 'LMB', name: 'Laboratorio de Microbiología' }
      ],
      plantaAlta: [
        { code: 'LQO', name: 'Laboratorio de Química Orgánica' },
        { code: 'LBQ', name: 'Laboratorio de Bioquímica' }
      ]
    },
    mapRect: { x: 0, y: 215, width: 40, height: 165, label: 'E-15', sublabel: 'Bio / Quím' }
  },
  {
    id: 'E-16',
    number: '16',
    name: 'Edificio 16 (Física y Geología)',
    title: 'Edificio 16 — Física, Fisicoquímica y Geología Marina',
    description: 'Salas de Física Experimental y de Fluidos, Laboratorio de Fisicoquímica, Procesamiento de Productos Acuáticos, Tamices y Geología Costera.',
    color: '#2563eb', // Blue
    badgeBg: 'bg-blue-50 border-blue-200 text-blue-800',
    badgeText: 'text-blue-700',
    rooms: ['SFE', 'SFF', 'LFQ', 'LPA', 'LT', 'LOS', 'SGP'],
    floors: {
      plantaBaja: [
        { code: 'SFE', name: 'Sala de Física Experimental' },
        { code: 'SFF', name: 'Sala de Física de Fluidos' },
        { code: 'LFQ', name: 'Laboratorio de Fisicoquímica' },
        { code: 'LPA', name: 'Lab. de Procesamiento de Productos Acuáticos' }
      ],
      plantaAlta: [
        { code: 'LT', name: 'Laboratorio de Tamices' },
        { code: 'LOS', name: 'Laboratorio de Oc. Geológica/Sedimentología' },
        { code: 'SGP', name: 'Sala de Geología y Procesos Costeros' }
      ]
    },
    mapRect: { x: 0, y: 385, width: 40, height: 160, label: 'E-16', sublabel: 'Física / Geo' }
  },
  {
    id: 'E-17',
    number: '17',
    name: 'Edificio 17 (Aulas Magnas y Genética)',
    title: 'Edificio 17 — Aulas Magnas, Genética y Nutrición',
    description: 'Salas de Biología y Fluidos, Laboratorios de Genética y Nutrición, Salón 8 y las Aulas Magnas I y II de la facultad.',
    color: '#d97706', // Amber
    badgeBg: 'bg-amber-50 border-amber-200 text-amber-800',
    badgeText: 'text-amber-700',
    rooms: ['SFL', 'SB', 'LG', 'NUT', 'LNU', 'S8', 'AM1', 'AM', 'AM2', 'AF1', 'AF2', 'AF3'],
    floors: {
      plantaBaja: [
        { code: 'SFL', name: 'Sala de Fluidos' },
        { code: 'SB', name: 'Sala de Biología' },
        { code: 'LG', name: 'Laboratorio de Genética' },
        { code: 'NUT', name: 'Laboratorio de Nutrición (LNU)' },
        { code: 'AF1', name: 'Aula Anexo de Física 1' },
        { code: 'AF2', name: 'Aula Anexo de Física 2' },
        { code: 'AF3', name: 'Aula Anexo de Física 3' }
      ],
      plantaAlta: [
        { code: 'S8', name: 'Salón 8' },
        { code: 'AM1', name: 'Aula Magna I' },
        { code: 'AM2', name: 'Aula Magna II' }
      ]
    },
    mapRect: { x: 60, y: 495, width: 125, height: 55, label: 'E-17', sublabel: 'Aulas Magnas' }
  },
  {
    id: 'E-18',
    number: '18',
    name: 'Edificio 18 (Aulas S1-S7 y Ecotecnias)',
    title: 'Edificio 18 — Aulas Troncales (S1-S7) y Acuacultura',
    description: 'Principal edificio de aulas de docencia (S1, S2, S3, S5, S6, S7), Sala de Geología, Tópicos de Acuacultura, Tamices II y Talleres de Ecotecnias y Reutilización.',
    color: '#b91c1c', // Crimson
    badgeBg: 'bg-rose-50 border-rose-200 text-rose-800',
    badgeText: 'text-rose-700',
    rooms: ['S1', 'S2', 'S3', 'SG', 'LTA', 'S5', 'S6', 'S7', 'LT2', 'ECO', 'REU'],
    floors: {
      plantaBaja: [
        { code: 'S1', name: 'Salón 1' },
        { code: 'S2', name: 'Salón 2' },
        { code: 'S3', name: 'Salón 3' },
        { code: 'SG', name: 'Sala de Geología' },
        { code: 'LTA', name: 'Laboratorio de Tópicos de Acuacultura' }
      ],
      plantaAlta: [
        { code: 'S5', name: 'Salón 5' },
        { code: 'S6', name: 'Salón 6' },
        { code: 'S7', name: 'Salón 7' },
        { code: 'LT2', name: 'Laboratorio de Tamices II' }
      ],
      partePosterior: [
        { code: 'ECO', name: 'Taller de Ecotecnias' },
        { code: 'REU', name: 'Taller de Reutilización' }
      ]
    },
    mapRect: { x: 60, y: 590, width: 125, height: 60, label: 'E-18', sublabel: 'Salones 1-7' }
  },
  {
    id: 'E-20',
    number: '20',
    name: 'Edificio 20 (Moluscos y Totoaba)',
    title: 'Edificio 20 — Moluscos y Totoaba',
    description: 'Laboratorio de Moluscos (Planta Baja) y Laboratorio de Totoaba (Planta Alta).',
    color: '#0d9488', // Teal
    badgeBg: 'bg-teal-50 border-teal-200 text-teal-800',
    badgeText: 'text-teal-700',
    rooms: ['LMO', 'LTO'],
    floors: {
      plantaBaja: [
        { code: 'LMO', name: 'Laboratorio de Moluscos' }
      ],
      plantaAlta: [
        { code: 'LTO', name: 'Laboratorio de Totoaba' }
      ]
    },
    mapRect: { x: 0, y: 675, width: 40, height: 130, label: 'E-20', sublabel: 'Moluscos / Totoaba' }
  },
  {
    id: 'E-21',
    number: '21',
    name: 'Edificio 21 (Especialidad y Geomática)',
    title: 'Edificio 21 — Especialidad, Geomática y Topografía',
    description: 'Salón de Especialidad (ESP), Prácticas de Topografía (PT), Salón de Geomática (GEO), Sala de SIG (SJG) y espacios docentes del Piso 2.',
    color: '#7c3aed', // Purple
    badgeBg: 'bg-purple-50 border-purple-200 text-purple-800',
    badgeText: 'text-purple-700',
    rooms: ['ESP', 'GEO', 'PT', 'SJG', 'Ex oficina de José Luis Fermán, piso 2 de E21'],
    floors: {
      plantaBaja: [
        { code: 'ESP', name: 'Salón de Especialidad' },
        { code: 'PT', name: 'Prácticas de Topografía' }
      ],
      plantaAlta: [
        { code: 'GEO', name: 'Salón de Geomática' },
        { code: 'SJG', name: 'Sala de Sistemas de Información Geográfica' }
      ],
      otros: [
        { code: 'Ex oficina de José Luis Fermán, piso 2 de E21', name: 'Espacio Académico (Piso 2 E21)' }
      ]
    },
    mapRect: { x: 80, y: 760, width: 60, height: 55, label: 'E-21', sublabel: 'ESP / GEO' }
  },
  {
    id: 'E-41',
    number: '41',
    name: 'Edificio 41 (Sistemas y Crustáceos)',
    title: 'Edificio 41 — Sistemas, Crustáceos y Fisiología',
    description: 'Laboratorio de Cultivos de Apoyo, Especies Ornamentales, Crustáceos, Sistemas y Fisiología.',
    color: '#0891b2', // Cyan
    badgeBg: 'bg-cyan-50 border-cyan-200 text-cyan-800',
    badgeText: 'text-cyan-700',
    rooms: ['LCA', 'LEO', 'CRU', 'SIS', 'FIS', 'DIE'],
    floors: {
      plantaBaja: [
        { code: 'LCA', name: 'Lab. de Cultivos de Apoyo' },
        { code: 'LEO', name: 'Laboratorio de Especies Ornamentales' },
        { code: 'CRU', name: 'Laboratorio de Crustáceos' },
        { code: 'SIS', name: 'Laboratorio de Sistemas' },
        { code: 'FIS', name: 'Laboratorio de Fisiología' }
      ]
    },
    mapRect: { x: 50, y: 740, width: 30, height: 115, label: 'E-41', sublabel: 'Sistemas / Fisio' }
  },
  {
    id: 'E-25',
    number: '25',
    name: 'Edificio 25 (IIO)',
    title: 'Edificio 25 — Instituto de Investigaciones Oceanológicas (IIO)',
    description: 'Audiovisual IIO, Laboratorios de Macroalgas, Moluscos y Cultivos de Apoyo, y Aulas de Posgrado (SP1, SP2, P3, SPI).',
    color: '#1d4ed8', // Royal Blue
    badgeBg: 'bg-blue-50 border-blue-200 text-blue-900',
    badgeText: 'text-blue-800',
    rooms: ['AVI', 'AV', 'MAL', 'MAI', 'MOL', 'MOI', 'CAI', 'SP1', 'P1', 'SP2', 'P2', 'P3', 'SPI', 'IIO'],
    floors: {
      plantaBaja: [
        { code: 'AVI', name: 'Audiovisual IIO' },
        { code: 'MAL', name: 'Laboratorio de Macroalgas' },
        { code: 'MOL', name: 'Laboratorio de Moluscos' },
        { code: 'CAI', name: 'Laboratorio de Cultivos de Apoyo' },
        { code: 'SP1', name: 'Salón de Posgrado 1 (P1)' },
        { code: 'SP2', name: 'Salón de Posgrado 2 (P2)' },
        { code: 'P3', name: 'Salón de Posgrado 3' },
        { code: 'SPI', name: 'Sala de Posgrado IIO' }
      ]
    },
    mapRect: { x: 410, y: 390, width: 115, height: 175, label: 'IIO (E-25)', sublabel: 'Investigaciones Oceanológicas' }
  },
  {
    id: 'E-56',
    number: '56',
    name: 'Edificio 56 (Totoaba y Peces)',
    title: 'Edificio 56 — Unidades de Totoaba y Peces',
    description: 'Aulas Totoaba A (TOA), Totoaba B (TOB), Laboratorio de Peces (PEC / LPE) y Sala Totoaba (SJT).',
    color: '#c026d3', // Fuchsia
    badgeBg: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800',
    badgeText: 'text-fuchsia-700',
    rooms: ['TOA', 'Totoaba A', 'TOB', 'PEC', 'LPE', 'SJT'],
    floors: {
      plantaBaja: [
        { code: 'TOA', name: 'Salón Totoaba A' },
        { code: 'TOB', name: 'Salón Totoaba B' },
        { code: 'PEC', name: 'Laboratorio de Peces' },
        { code: 'SJT', name: 'Sala / Laboratorio Totoaba' }
      ]
    },
    mapRect: { x: 540, y: 265, width: 95, height: 120, label: 'E-56', sublabel: 'Totoaba / Peces' }
  }
];

/**
 * Returns classroom details from the campus catalog, or creates a fallback if unlisted
 */
export function getClassroomDetails(roomCode: string): CampusRoomInfo {
  const normalized = (roomCode || '').trim();
  const upper = normalized.toUpperCase();

  if (ROOM_CATALOG[normalized]) return ROOM_CATALOG[normalized];
  if (ROOM_CATALOG[upper]) return ROOM_CATALOG[upper];

  // Try to match building prefix or numbers
  for (const b of CAMPUS_BUILDINGS) {
    if (b.rooms.some(r => r.toUpperCase() === upper)) {
      return {
        code: normalized,
        name: `Aula ${normalized}`,
        buildingId: b.id,
        buildingName: b.name,
        buildingNumber: b.number,
        floor: 'Planta Baja',
        type: 'Aula / Salón'
      };
    }
  }

  return {
    code: normalized,
    name: normalized || 'Sin Especificar',
    buildingId: 'OTRO',
    buildingName: 'Instalaciones FCM',
    buildingNumber: '',
    floor: 'General',
    type: 'Aula / Salón'
  };
}

/**
 * Returns the building info for a classroom code
 */
export function getBuildingForClassroom(roomCode: string): CampusBuildingInfo | undefined {
  const room = getClassroomDetails(roomCode);
  return CAMPUS_BUILDINGS.find(b => b.id === room.buildingId || b.number === room.buildingNumber);
}

/**
 * Returns a building by ID ('E-21') or number ('21')
 */
export function getBuildingById(idOrNumber: string): CampusBuildingInfo | undefined {
  if (!idOrNumber) return undefined;
  const clean = idOrNumber.trim().toUpperCase();
  return CAMPUS_BUILDINGS.find(b => 
    b.id.toUpperCase() === clean || 
    b.number === clean || 
    `E-${b.number}` === clean ||
    `EDIFICIO ${b.number}` === clean
  );
}
