import { cache } from 'react';
import { listarCandidatosABaja, listarTecnicos } from '@/lib/dataService';

// Deduplicación por petición (React cache): el menú (layout) y la página piden los mismos datos
// al renderizar; con esto la base se consulta una sola vez por carga de página.
// Solo para componentes de servidor; las rutas API llaman a dataService directamente.
export const candidatosDeLaPeticion = cache(listarCandidatosABaja);
export const tecnicosDeLaPeticion = cache(listarTecnicos);
