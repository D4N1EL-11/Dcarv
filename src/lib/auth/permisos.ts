// Permisos por rol. Módulo puro (sin red, sin base, sin Node): lo usan el middleware (Edge),
// las rutas API, las páginas y las pruebas.
//
// - Soporte (admin, editor): todo el módulo.
// - Reporte (viewer): solo reporta fallas de un equipo y sigue sus propios casos.
//   No cambia estados, no registra ni edita salas, equipos o técnicos, no asigna ni cierra.

export type Rol = 'admin' | 'editor' | 'viewer';

// Dominios institucionales que pueden pedir el acceso de soporte. Como el correo no se verifica,
// el dominio no da permisos por sí solo: toda cuenta nace como cuenta de reporte y, con uno de
// estos dominios, queda con una solicitud que un administrador aprueba o rechaza.
export const DOMINIOS_SOPORTE = ['usa.edu.co'] as const;

export const INICIO_SOPORTE = '/soporte';
export const INICIO_REPORTE = '/soporte/reportar';

export function esRolValido(valor: unknown): valor is Rol {
  return valor === 'admin' || valor === 'editor' || valor === 'viewer';
}

export function esSoporte(rol: Rol | null | undefined): boolean {
  return rol === 'admin' || rol === 'editor';
}

export function dominioDe(email: string): string {
  return email.trim().toLowerCase().split('@').pop() ?? '';
}

// Solo el dominio exacto: "usa.edu.co.otro.com" o "x@otrousa.edu.co" no cuentan.
export function puedeSolicitarSoporte(email: string): boolean {
  return (DOMINIOS_SOPORTE as readonly string[]).includes(dominioDe(email));
}

// Toda cuenta nueva nace como cuenta de reporte; el rol de soporte lo da un administrador.
export const ROL_INICIAL: Rol = 'viewer';

export function nombreRol(rol: Rol): string {
  if (rol === 'admin') return 'Administrador';
  if (rol === 'editor') return 'Soporte técnico';
  return 'Cuenta de reporte';
}

export function inicioPara(rol: Rol): string {
  return esSoporte(rol) ? INICIO_SOPORTE : INICIO_REPORTE;
}

// Páginas de /soporte que abre una cuenta de reporte.
const PAGINAS_REPORTE = [
  '/soporte/reportar',
  '/soporte/mis-reportes',
  '/soporte/ayuda',
  '/soporte/cuenta',
  '/soporte/avisos',
  '/soporte/conocimiento',
];

// La ficha de un caso (/soporte/incidencias/INC-0001): una cuenta de reporte solo abre las de sus
// propios casos; eso lo comprueba la página, que conoce la incidencia. El listado general
// (/soporte/incidencias) sigue siendo de soporte.
const FICHA_CASO = /^\/soporte\/incidencias\/[^/]+$/;

function coincide(ruta: string, base: string): boolean {
  return ruta === base || ruta.startsWith(`${base}/`);
}

// Páginas solo de administración (cambiar roles y aprobar solicitudes).
const PAGINAS_ADMIN = ['/soporte/usuarios'];

export function puedeVerPagina(rol: Rol, ruta: string): boolean {
  if (PAGINAS_ADMIN.some((base) => coincide(ruta, base))) return rol === 'admin';
  if (esSoporte(rol)) return true;
  return PAGINAS_REPORTE.some((base) => coincide(ruta, base)) || FICHA_CASO.test(ruta);
}

// Lo que una cuenta de reporte puede pedir a la API. La propiedad de cada caso (solo los suyos)
// se comprueba además en la ruta, que conoce la incidencia.
const API_REPORTE: { metodo: string; patron: RegExp }[] = [
  { metodo: 'GET', patron: /^\/api\/soporte\/sesion$/ },
  { metodo: 'GET', patron: /^\/api\/soporte\/salas$/ },
  { metodo: 'GET', patron: /^\/api\/soporte\/equipos$/ },
  { metodo: 'POST', patron: /^\/api\/soporte\/equipos\/[^/]+\/incidencias$/ },
  { metodo: 'GET', patron: /^\/api\/soporte\/incidencias\/[^/]+\/foto$/ },
  { metodo: 'POST', patron: /^\/api\/soporte\/incidencias\/[^/]+\/foto$/ },
  { metodo: 'GET', patron: /^\/api\/soporte\/incidencias\/[^/]+\/comentarios$/ },
  { metodo: 'POST', patron: /^\/api\/soporte\/incidencias\/[^/]+\/comentarios$/ },
  { metodo: 'GET', patron: /^\/api\/soporte\/avisos$/ },
  { metodo: 'POST', patron: /^\/api\/soporte\/avisos\/leidos$/ },
  { metodo: 'POST', patron: /^\/api\/soporte\/cuenta\/solicitud$/ },
  { metodo: 'POST', patron: /^\/api\/soporte\/push$/ },
  { metodo: 'DELETE', patron: /^\/api\/soporte\/push$/ },
  // Calificar la atención de un caso propio (la ruta comprueba que sea de quien califica).
  { metodo: 'POST', patron: /^\/api\/soporte\/incidencias\/[^/]+\/calificacion$/ },
  // Base de conocimiento: leer y votar guías; sugerencia de clasificación con IA al reportar.
  { metodo: 'GET', patron: /^\/api\/soporte\/conocimiento$/ },
  { metodo: 'GET', patron: /^\/api\/soporte\/conocimiento\/[^/]+$/ },
  { metodo: 'POST', patron: /^\/api\/soporte\/conocimiento\/[^/]+\/voto$/ },
  { metodo: 'POST', patron: /^\/api\/soporte\/ia\/clasificar$/ },
];

export function puedeUsarApi(rol: Rol, metodo: string, ruta: string): boolean {
  if (esSoporte(rol)) return true;
  const metodoMayus = metodo.toUpperCase();
  return API_REPORTE.some((permiso) => permiso.metodo === metodoMayus && permiso.patron.test(ruta));
}

// A dónde llevar a quien abre una página que su rol no permite.
export function redireccionSinPermiso(rol: Rol, ruta: string): string {
  return esSoporte(rol) ? INICIO_SOPORTE : redireccionReporte(ruta);
}

// A dónde llevar a una cuenta de reporte que abre una página de soporte. La ficha de un equipo
// (por ejemplo, desde un enlace compartido) lleva al reporte de ese equipo.
export function redireccionReporte(ruta: string): string {
  const ficha = /^\/soporte\/equipos\/([^/]+)$/.exec(ruta);
  if (ficha && ficha[1] !== 'nuevo') return `${INICIO_REPORTE}?equipo=${ficha[1]}`;
  return INICIO_REPORTE;
}
