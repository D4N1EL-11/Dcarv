'use client';
import { useTheme } from './ThemeProvider';
export function ThemeToggle() { const { theme, toggleTheme } = useTheme(); return <button type="button" onClick={toggleTheme} aria-label="Cambiar tema" className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm">{theme === 'light' ? 'Luna' : 'Sol'}</button>; }