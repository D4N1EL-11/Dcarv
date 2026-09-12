import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; loading?: boolean; }
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className = '', variant = 'primary', size = 'md', loading = false, children, disabled, ...props }, ref) {
  const styles = { primary: 'bg-[var(--accent)] text-white', secondary: 'bg-[var(--accent-soft)] text-[var(--accent)]', ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-black/5', danger: 'bg-red-600 text-white' };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-3' };
  return <button ref={ref} className={`rounded-lg font-semibold transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${sizes[size]} ${className}`} disabled={disabled || loading} {...props}>{loading ? 'Cargando...' : children}</button>;
});