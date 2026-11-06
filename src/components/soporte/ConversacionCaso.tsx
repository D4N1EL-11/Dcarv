'use client';

import { useState, type FormEvent } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { Boton } from '@/components/ui/Boton';
import { CampoTexto } from '@/components/ui/Campo';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Icono } from '@/components/ui/Icono';
import { llamarApi } from '@/lib/clienteApi';
import { LARGO_MAXIMO_COMENTARIO, LARGO_MINIMO_COMENTARIO } from '@/lib/config/soporte';
import type { FilaComentario } from '@/lib/datos/comentarios';
import { EVENTO_DATOS_CAMBIARON } from '@/lib/alertasVistas';
import { tiempoRelativo } from '@/lib/formato';

type Props = {
  numeroCaso: string;
  comentarios: FilaComentario[];
  miEmail: string;
  // Quien mira es de soporte: cambia cómo se nombra a cada lado de la conversación.
  soporte: boolean;
  // null: puede escribir; si no, por qué no (caso cerrado).
  motivoSinEscribir: string | null;
};

const formatoMomento = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
});

function nombreAutor(comentario: FilaComentario, miEmail: string, soporte: boolean): string {
  if (comentario.autor === miEmail) return 'Usted';
  // Quien reportó ve "Soporte técnico"; soporte ve el correo de su compañero o de quien reportó.
  if (comentario.deSoporte) return soporte ? comentario.autor : 'Soporte técnico';
  return soporte ? `${comentario.autor} (reportó la falla)` : comentario.autor;
}

function Mensaje({ comentario, miEmail, soporte }: { comentario: FilaComentario; miEmail: string; soporte: boolean }) {
  const propio = comentario.autor === miEmail;
  const cierre = comentario.tipo === 'cierre';
  return (
    <li className={`flex ${propio ? 'justify-end' : 'justify-start'}`}>
      <article
        className={`grid max-w-[min(36rem,100%)] gap-1.5 rounded-2xl border px-4 py-3 ${
          cierre
            ? 'border-funcional/35 bg-funcional/10'
            : propio
              ? 'border-primario/35 bg-primario-suave'
              : 'border-borde bg-superficie-alta'
        }`}
      >
        <header className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span className={`font-semibold ${comentario.deSoporte ? 'text-primario' : 'text-texto'}`}>
            {nombreAutor(comentario, miEmail, soporte)}
          </span>
          {cierre ? (
            <span className="inline-flex items-center gap-1 font-medium text-funcional">
              <Icono nombre="check" className="size-3.5" /> Solución al cerrar
            </span>
          ) : null}
          <time dateTime={comentario.momento} title={formatoMomento.format(new Date(comentario.momento))} className="text-texto-suave">
            {tiempoRelativo(comentario.momento)}
          </time>
        </header>
        <p className="whitespace-pre-line break-words text-sm text-texto">{comentario.texto}</p>
      </article>
    </li>
  );
}

// Conversación entre soporte y quien reportó la falla. Cada lado recibe un aviso en la campana
// cuando el otro escribe (lib/datos/comentarios.ts).
export function ConversacionCaso({ numeroCaso, comentarios: iniciales, miEmail, soporte, motivoSinEscribir }: Props) {
  const [comentarios, setComentarios] = useState(iniciales);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const largo = texto.trim().length;

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (largo < LARGO_MINIMO_COMENTARIO) {
      setError(`Escriba al menos ${LARGO_MINIMO_COMENTARIO} caracteres.`);
      return;
    }
    setEnviando(true);
    setError('');
    const respuesta = await llamarApi<FilaComentario>(
      `/api/soporte/incidencias/${encodeURIComponent(numeroCaso)}/comentarios`,
      'POST',
      { texto: texto.trim() },
    );
    setEnviando(false);
    if (!respuesta.ok) {
      setError(respuesta.mensaje);
      return;
    }
    setComentarios((lista) => [...lista, respuesta.datos]);
    setTexto('');
    window.dispatchEvent(new Event(EVENTO_DATOS_CAMBIARON));
  }

  return (
    <div className="grid gap-4">
      {comentarios.length ? (
        <ol className="grid gap-3" aria-label={`Conversación del caso ${numeroCaso}`}>
          {comentarios.map((comentario) => (
            <Mensaje key={comentario.id} comentario={comentario} miEmail={miEmail} soporte={soporte} />
          ))}
        </ol>
      ) : (
        <EstadoVacio titulo="Todavía no hay comentarios" icono="comentario">
          {soporte
            ? 'Anote aquí el avance (lo que se revisó, lo que falta). Quien reportó la falla lo verá en su caso.'
            : 'Si tiene algo que agregar sobre la falla, escríbalo aquí. Soporte recibe un aviso.'}
        </EstadoVacio>
      )}

      {motivoSinEscribir ? (
        <p className="flex items-center gap-2 rounded-lg border border-borde bg-superficie px-4 py-3 text-sm text-texto-suave print:hidden">
          <Icono nombre="candado" className="size-4" /> {motivoSinEscribir}
        </p>
      ) : (
        <form onSubmit={enviar} className="grid gap-2 print:hidden" noValidate>
          <CampoTexto
            etiqueta={soporte ? 'Comentario para el caso' : 'Escribir a soporte'}
            placeholder={soporte ? 'Ej.: Se revisó la fuente; falta el repuesto, llega el lunes.' : 'Ej.: Sigue sin encender después del reinicio.'}
            rows={3}
            maxLength={LARGO_MAXIMO_COMENTARIO}
            value={texto}
            error={error || undefined}
            onChange={(evento) => {
              setTexto(evento.target.value);
              setError('');
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-texto-suave">
              {texto.length}/{LARGO_MAXIMO_COMENTARIO}
            </span>
            <Boton type="submit" cargando={enviando}>
              <Icono nombre="enviar" /> {enviando ? 'Enviando…' : 'Enviar comentario'}
            </Boton>
          </div>
        </form>
      )}
      {!soporte && !motivoSinEscribir ? (
        <Aviso tipo="info">Soporte ve sus comentarios y le responde aquí mismo; le llegará un aviso a la campana.</Aviso>
      ) : null}
    </div>
  );
}
