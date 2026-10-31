import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

const CLASES =
  'w-full rounded-lg border border-borde bg-superficie px-3 py-2 text-sm text-texto focus-visible:outline-2 focus-visible:outline-primario';

type Comun = { etiqueta: string; error?: string | undefined };

function Envoltura({
  id,
  etiqueta,
  error,
  children,
}: Comun & { id: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-texto">
        {etiqueta}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-baja">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Campo({ etiqueta, error, ...resto }: Comun & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Envoltura id={id} etiqueta={etiqueta} error={error}>
      <input
        id={id}
        className={CLASES}
        aria-invalid={Boolean(error)}
        {...(error ? { 'aria-describedby': `${id}-error` } : {})}
        {...resto}
      />
    </Envoltura>
  );
}

export function CampoTexto({
  etiqueta,
  error,
  ...resto
}: Comun & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Envoltura id={id} etiqueta={etiqueta} error={error}>
      <textarea
        id={id}
        rows={4}
        className={CLASES}
        aria-invalid={Boolean(error)}
        {...(error ? { 'aria-describedby': `${id}-error` } : {})}
        {...resto}
      />
    </Envoltura>
  );
}
