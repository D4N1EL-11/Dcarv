import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const styles = {
  primary: 'bg-[var(--accent)] text-[var(--accent-ink)] hover:brightness-110',
  secondary: 'border border-[var(--line)] bg-transparent text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]',
  danger: 'border border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20',
};

const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-3 text-sm' };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = '', variant = 'primary', size = 'md', loading = false, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`rounded-lg font-medium tracking-wide transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Cargando...' : children}
    </button>
  );
});
