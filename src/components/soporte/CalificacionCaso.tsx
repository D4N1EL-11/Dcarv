'use client';

import { useState, type FormEvent } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { useAvisos } from '@/components/ui/Avisos';
import { Boton } from '@/components/ui/Boton';
import { CampoTexto } from '@/components/ui/Campo';
import { Icono } from '@/components/ui/Icono';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';
import { LARGO_MAXIMO_COMENTARIO_CALIFICACION } from '@/lib/config/soporte';

const TEXTO_ESTRELLAS = ['', 'Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'];

// Estrellas de solo lectura (texto para lectores de pantalla: el valor no depende del dibujo).
export function Estrellas({ valor, className = 'size-4' }: { valor: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${valor} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} aria-hidden="true" viewBox="0 0 24 24" className={`${className} ${n <= valor ? 'fill-primario text-primario' : 'fill-none text-borde'}`} stroke="currentColor" strokeWidth={1.5}>
          <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z" />
        </svg>
      ))}
    </span>
  );
}

// Quien reportó un caso cerrado califica la atención (una sola vez).
export function CalificarCaso({ numeroCaso }: { numeroCaso: string }) {
  const { refrescar, refrescando } = useRefrescar();
  const { mostrar } = useAvisos();
  const [estrellas, setEstrellas] = useState(0);
  const [encima, setEncima] = useState(0);
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!estrellas) {
      setError('Elija de 1 a 5 estrellas.');
      return;
    }
    setCargando(true);
    const respuesta = await llamarApi(`/api/soporte/incidencias/${encodeURIComponent(numeroCaso)}/calificacion`, 'POST', {
      estrellas,
      ...(comentario.trim() ? { comentario } : {}),
    });
    setCargando(false);
    if (!respuesta.ok) {
      setError(respuesta.mensaje);
      return;
    }
    mostrar('exito', '¡Gracias por calificar la atención!');
    refrescar();
  }

  const mostrada = encima || estrellas;
  return (
    <form onSubmit={enviar} className="grid gap-3" noValidate>
      <p className="text-sm text-texto-suave">¿Cómo fue la atención de su caso?</p>
      <div role="radiogroup" aria-label="Calificación de 1 a 5 estrellas" className="flex items-center gap-1" onMouseLeave={() => setEncima(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={estrellas === n}
            aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}: ${TEXTO_ESTRELLAS[n]}`}
            onMouseEnter={() => setEncima(n)}
            onClick={() => {
              setEstrellas(n);
              setError('');
            }}
            className="rounded p-0.5 transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-primario"
          >
            <Icono nombre="estrella" className={`size-8 ${n <= mostrada ? 'fill-primario text-primario' : 'text-borde'}`} />
          </button>
        ))}
        <span className="ml-2 text-sm font-medium text-texto">{TEXTO_ESTRELLAS[mostrada]}</span>
      </div>
      <CampoTexto
        etiqueta="Comentario (opcional)"
        value={comentario}
        rows={2}
        maxLength={LARGO_MAXIMO_COMENTARIO_CALIFICACION}
        placeholder="¿Qué estuvo bien o qué se puede mejorar?"
        onChange={(evento) => setComentario(evento.target.value)}
      />
      {error ? <Aviso tipo="error">{error}</Aviso> : null}
      <Boton type="submit" cargando={cargando || refrescando}>
        Enviar calificación
      </Boton>
    </form>
  );
}
