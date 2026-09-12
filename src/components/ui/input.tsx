import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; helperText?: string; }
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, helperText, className = '', id, ...props }, ref) {
  return <label className="grid gap-1.5 text-sm font-medium" htmlFor={id}>{label}<input ref={ref} id={id} className={`rounded-lg border border-[var(--line)] bg-[var(--bg-secondary)] px-3 py-2.5 text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] ${className}`} {...props} />{error ? <span className="text-xs text-red-600">{error}</span> : helperText ? <span className="text-xs text-[var(--text-secondary)]">{helperText}</span> : null}</label>;
});