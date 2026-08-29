/**
 * CONFIG: Fuentes de datos y parámetros del sistema
 * Todas las URLs se encuentran agrupadas aquí y no se muestran directamente en la interfaz.
 */
export const CONFIG = {
  INSTITUTION_NAME: 'Facultad de Ciencias Marinas',
  APP_TITLE: 'Consulta de Horarios',
  
  // Fuentes remotas de datos (Google Sheets publicados en CSV)
  DATA_SOURCES: {
    BASE_1_LICENCIATURA: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSfjdqdhfHPd_vloAyV2-LgvbvHf2d1HTD_ahuJL_8iXRK1p7ZwlAlvZyJoxccSAA/pub?output=csv',
    BASE_2_POSGRADO: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbSSy30YIePo5a-6N7rd7FGkzQMHqsYHLJGJlYhXJm5tb9RLetnZMAXUVqxA45yA/pub?output=csv',
    BASE_3_PROFESORES: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSeXq8IST0VgER_kRayIsMsswnNdj67gq0tA66Vl29m78iAOMdLlykt6_Gb6n1lCQ/pub?output=csv',
    BASE_4_AULAS: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRiOxRC6Esguhjznsj1ti-aWLQjlixq0D4kHXAMjFyqskWhNwhi7fBHz7sSt7SIRA/pub?output=csv',
    BASE_5_CAPACIDADES: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSrm4ABLIx4jmopEug75J6a9qQnLgeOMEaFw3d91jAbId_BUtTZvZiaN-EAUozYig/pub?output=csv',
    BASE_6_GRUPOS_INSCRITOS: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR1QaBfK3kOElC-gtpI9XakqswxgN3QXzF4l3EMXRB4O2o8ujH7G76i_GEH_3xeGg/pub?output=csv',
    CORRECCIONES_CSV: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRHW88co8GcGZzLRyttmDsISqrZC9UutNzqmOaUTBlQyc7XZ3aWukOZF2B1hzjyUP4-oi50tpLVzfwA/pub?output=csv',
    CORRECCIONES_HTML: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRHW88co8GcGZzLRyttmDsISqrZC9UutNzqmOaUTBlQyc7XZ3aWukOZF2B1hzjyUP4-oi50tpLVzfwA/pubhtml'
  },

  // Parámetros de Calendario Semanal
  CALENDAR: {
    START_HOUR: 7,  // 07:00
    END_HOUR: 21,   // 21:00
    START_MINUTES: 7 * 60,   // 420
    END_MINUTES: 21 * 60,    // 1260
    TOTAL_MINUTES: (21 - 7) * 60, // 840 minutes (14 hours)
    DAYS: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const,
    DAYS_SHORT: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'] as const,
    TIME_STEP_MINUTES: 30
  },

  // Mensaje oficial si la fuente de correcciones no responde
  CORRECTIONS_ERROR_MESSAGE: 'No fue posible verificar las correcciones más recientes.'
};
