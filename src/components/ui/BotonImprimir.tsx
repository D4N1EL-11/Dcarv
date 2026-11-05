'use client';

import { Boton } from './Boton';
import { Icono } from './Icono';

// La hoja de impresión (globals.css, @media print) pasa a fondo blanco y oculta la navegación.
export function BotonImprimir({ texto = 'Imprimir' }: { texto?: string }) {
  return (
    <Boton variante="secundario" onClick={() => window.print()} className="gap-2">
      <Icono nombre="imprimir" /> {texto}
    </Boton>
  );
}
