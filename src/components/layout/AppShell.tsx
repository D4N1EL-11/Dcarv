'use client';
import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
export function AppShell({ children }: { children: React.ReactNode }) { const [menuOpen, setMenuOpen] = useState(false); return <div className="flex min-h-screen flex-col"><Header onMenu={() => setMenuOpen((open) => !open)} /><div className="flex flex-1"><Sidebar open={menuOpen} /><main className="min-w-0 flex-1">{children}</main></div><Footer /></div>; }