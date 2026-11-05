'use client';

import { useState, type InputHTMLAttributes, type KeyboardEvent } from 'react';
import { Icono } from '@/components/ui/Icono';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  id: string;
  label: string;
  error?: string | undefined;
  helperText?: string | undefined;
  // Contenido bajo el campo (p. ej. el medidor de seguridad).
  children?: React.ReactNode;
};

// Campo de contraseña de las pantallas de acceso y de la cuenta: botón para mostrarla u ocultarla
// y aviso de Bloq Mayús activado, la causa más común de "contraseña incorrecta".
export function CampoContrasena({ id, label, error, helperText, children, className = '', onKeyUp, onBlur, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const [mayusculas, setMayusculas] = useState(false);
  const idMensaje = `${id}-mensaje`;
  const idMayus = `${id}-mayus`;
  const descritoPor = [error || helperText ? idMensaje : '', mayusculas ? idMayus : ''].filter(Boolean).join(' ');

  function revisarMayusculas(evento: KeyboardEvent<HTMLInputElement>) {
    setMayusculas(evento.getModifierState('CapsLock'));
    onKeyUp?.(evento);
  }

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-secondary)]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={descritoPor || undefined}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onKeyUp={revisarMayusculas}
          onKeyDown={(evento) => setMayusculas(evento.getModifierState('CapsLock'))}
          onBlur={(evento) => {
            setMayusculas(false);
            onBlur?.(evento);
          }}
          className={`w-full rounded-lg border bg-[var(--bg-primary)]/60 py-3 pl-3.5 pr-12 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)]/60 focus:border-[var(--accent)]/70 focus:ring-2 focus:ring-[var(--accent)]/20 ${error ? 'border-[var(--danger)]/60' : 'border-[var(--line)]'} ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((actual) => !actual)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-[var(--text-secondary)] transition hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        >
          <Icono nombre={visible ? 'ojoTachado' : 'ojo'} className="size-[1.1rem]" />
        </button>
      </div>
      {mayusculas ? (
        <span id={idMayus} role="status" className="flex items-center gap-1.5 text-xs text-reparacion">
          <Icono nombre="incidencias" className="size-3.5" /> Bloq Mayús está activado.
        </span>
      ) : null}
      {error ? (
        <span id={idMensaje} className="text-xs text-[var(--danger)]">{error}</span>
      ) : helperText ? (
        <span id={idMensaje} className="text-xs text-[var(--text-secondary)]">{helperText}</span>
      ) : null}
      {children}
    </div>
  );
}
