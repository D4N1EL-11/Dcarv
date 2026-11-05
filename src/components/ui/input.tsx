import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string | undefined;
  error?: string | undefined;
  helperText?: string | undefined;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, className = '', id, ...props },
  ref,
) {
  const idMensaje = id ? `${id}-mensaje` : undefined;
  const hayMensaje = Boolean(error || helperText);
  return (
    <label className="grid gap-2" htmlFor={id}>
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-secondary)]">{label}</span>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={hayMensaje ? idMensaje : undefined}
        className={`rounded-lg border bg-[var(--bg-primary)]/60 px-3.5 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)]/60 focus:border-[var(--accent)]/70 focus:ring-2 focus:ring-[var(--accent)]/20 ${error ? 'border-[var(--danger)]/60' : 'border-[var(--line)]'} ${className}`}
        {...props}
      />
      {error ? (
        <span id={idMensaje} className="text-xs text-[var(--danger)]">{error}</span>
      ) : helperText ? (
        <span id={idMensaje} className="text-xs text-[var(--text-secondary)]">{helperText}</span>
      ) : null}
    </label>
  );
});
