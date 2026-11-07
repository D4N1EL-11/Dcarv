export const ESTADOS_EQUIPO = ['funcional', 'en_reparacion', 'dado_de_baja'] as const;
export const ESTADOS_INCIDENCIA = ['abierta', 'en_revision', 'cerrada'] as const;
export const DIAS_VENTANA_ALERTA = 30; // RN-09
export const INCIDENCIAS_PARA_ALERTA = 3; // RN-09
export const DIAS_REASIGNACION = 5; // RN-10 (F5)
export const ZONA_HORARIA = 'America/Bogota';
export const LIMITE_LISTADO = 500;
export const MAXIMO_LOTE_EQUIPOS = 50; // registro de varios equipos a la vez
export const TAMANO_PAGINA_EQUIPOS = 50; // filas por página en el panel
export const TAMANO_PAGINA_INCIDENCIAS = 25; // tarjetas por página en el listado de incidencias
export const LIMITE_EXPORTACION = 5000; // filas máximas de un CSV

// Clasificación de incidencias (M10). La categoría la elige quien reporta; la prioridad, soporte.
export const CATEGORIAS_INCIDENCIA = ['hardware', 'software', 'red', 'perifericos', 'otro'] as const;
export const PRIORIDADES_INCIDENCIA = ['alta', 'media', 'baja'] as const;
export const PRIORIDAD_INICIAL = 'media';

// Comentarios de una incidencia (M8).
export const LARGO_MINIMO_COMENTARIO = 2;
export const LARGO_MAXIMO_COMENTARIO = 1000;

// Avisos de la campana (M9).
export const AVISOS_EN_CAMPANA = 8; // los más recientes en el menú desplegable
export const AVISOS_POR_PAGINA = 30; // en /soporte/avisos
export const SEGUNDOS_ENTRE_CONSULTAS_AVISOS = 60; // la campana vuelve a preguntar mientras la pestaña está visible

// Mantenimiento preventivo (M11).
export const FRECUENCIAS_MANTENIMIENTO = [7, 15, 30, 60, 90, 180] as const; // opciones sugeridas (días)
export const MINIMO_DIAS_MANTENIMIENTO = 7;
export const MAXIMO_DIAS_MANTENIMIENTO = 365;
export const DIAS_AVISO_MANTENIMIENTO = 7; // "Próximo": vence dentro de esta cantidad de días
export const LARGO_MAXIMO_NOTAS_MANTENIMIENTO = 500;

// Mapa de cada sala (M12).
export const COLUMNAS_MAPA_INICIAL = 6;
export const MINIMO_COLUMNAS_MAPA = 2;
export const MAXIMO_COLUMNAS_MAPA = 16;
export const MAXIMO_FILAS_MAPA = 40;

// Tiempos de atención (SLA): horas máximas entre el reporte y el cierre según la prioridad.
// "Por vencer" desde este porcentaje de la meta consumido.
export const META_HORAS_PRIORIDAD = { alta: 24, media: 72, baja: 168 } as const;
export const FRACCION_POR_VENCER = 0.75;

// Modo monitor (pantalla de la oficina de soporte).
export const SEGUNDOS_REFRESCO_MONITOR = 30;

// Repuestos (M13).
export const MAXIMO_CANTIDAD_REPUESTO = 100; // por registro de uso o de entrada
export const MAXIMO_EXISTENCIAS_REPUESTO = 100_000;

// Hoja de vida de los equipos (M15).
export const ANIOS_OBSOLESCENCIA = 5; // desde la compra, el equipo se marca para renovar
export const DIAS_AVISO_GARANTIA = 60; // "Por vencer": la garantía termina dentro de estos días

// Calificación del servicio (M16).
export const LARGO_MAXIMO_COMENTARIO_CALIFICACION = 500;

// Base de conocimiento (M17).
export const LARGO_MAXIMO_ARTICULO = 5000;
export const GUIAS_SUGERIDAS = 3; // al reportar una falla

// Analítica.
export const DIAS_ANALITICA = 90; // ventana del mapa de calor y del riesgo de falla
export const DIAS_MTBF = 180; // ventana para el tiempo medio entre fallas

// Asistente con IA (lib/ia.ts). Sin ANTHROPIC_API_KEY las opciones de IA no aparecen.
export const MODELO_IA = 'claude-opus-5-5';
export const CASOS_SIMILARES_IA = 5;
