'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function HolaMundo() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#f3efe7] text-[#172033]">
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(#d8d1c5_1px,transparent_1px),linear-gradient(90deg,#d8d1c5_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
      <motion.div className="absolute -right-24 top-28 h-72 w-72 rounded-full bg-[#e15f3d]/15 blur-3xl" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2 }} />
      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-14 sm:px-8">
        <header className="flex items-center justify-between border-b border-[#172033]/15 py-5">
          <Link href="/" className="text-lg font-black tracking-[-0.04em]">DCARV<span className="text-[#e15f3d]">.</span></Link>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <span className="hidden text-[#657086] sm:inline">Workspace operativo</span>
            <Link className="rounded-full border border-[#172033]/20 px-4 py-2 transition hover:bg-[#172033] hover:text-white" href="/login">Entrar</Link>
          </div>
        </header>

        <div className="grid items-center gap-12 pb-14 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:pt-24">
          <div>
            <motion.p className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#e15f3d]" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}><span className="h-2 w-2 rounded-full bg-[#e15f3d]" /> Sistema listo para trabajar</motion.p>
            <motion.h1 className="max-w-3xl text-6xl font-black leading-[0.92] tracking-[-0.065em] sm:text-8xl" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>Ordena tus ideas.<br /><span className="text-[#e15f3d]">Mueve el trabajo.</span></motion.h1>
            <motion.p className="mt-7 max-w-xl text-lg leading-8 text-[#657086] sm:text-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }}>Dcarv reúne notas, estado del sistema y operaciones diarias en un espacio rápido, claro y construido para crecer.</motion.p>
            <motion.div className="mt-9 flex flex-wrap items-center gap-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }}><Link className="rounded-full bg-[#172033] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#172033]/15 transition hover:-translate-y-0.5 hover:bg-[#e15f3d]" href="/dashboard">Abrir workspace <span aria-hidden="true">→</span></Link><Link className="rounded-full px-5 py-3.5 text-sm font-bold text-[#657086] transition hover:text-[#172033]" href="/dashboard/status">Ver estado del sistema</Link></motion.div>
          </div>

          <motion.div className="relative" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.35 }}>
            <div className="overflow-hidden rounded-2xl border border-[#172033]/15 bg-[#fffdf8] shadow-2xl shadow-[#172033]/15">
              <div className="flex items-center justify-between border-b border-[#172033]/10 px-5 py-4"><div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#e15f3d]" /><span className="h-2.5 w-2.5 rounded-full bg-[#d8ad4b]" /><span className="h-2.5 w-2.5 rounded-full bg-[#57a87e]" /></div><span className="font-mono text-[10px] uppercase tracking-widest text-[#657086]">dcarv / overview</span></div>
              <div className="grid grid-cols-[0.34fr_0.66fr]">
                <div className="border-r border-[#172033]/10 bg-[#f7f3eb] p-4"><div className="mb-8 h-3 w-16 rounded bg-[#172033]" /><div className="grid gap-3 text-[11px] text-[#657086]"><span className="rounded bg-[#e15f3d]/10 px-2 py-2 font-bold text-[#e15f3d]">Overview</span><span className="px-2 py-1">Notas</span><span className="px-2 py-1">Estado</span></div></div>
                <div className="p-5 sm:p-7"><div className="flex items-end justify-between"><div><p className="text-[11px] uppercase tracking-widest text-[#657086]">Resumen operativo</p><p className="mt-2 text-2xl font-black tracking-tight">Todo en orden.</p></div><span className="rounded-full bg-[#dcefe4] px-2.5 py-1 text-[10px] font-bold text-[#28744f]">Operativo</span></div><div className="mt-7 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-[#f7f3eb] p-4"><p className="text-[10px] uppercase tracking-widest text-[#657086]">Notas</p><p className="mt-3 text-3xl font-black">01</p></div><div className="rounded-xl bg-[#172033] p-4 text-white"><p className="text-[10px] uppercase tracking-widest text-white/60">Uptime</p><p className="mt-3 text-3xl font-black">99.9<span className="text-base">%</span></p></div></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f0ebe1]"><motion.div className="h-full w-3/4 rounded-full bg-[#e15f3d]" initial={{ scaleX: 0, transformOrigin: 'left' }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: 1 }} /></div></div>
              </div>
            </div>
            <p className="mt-4 text-right font-mono text-[10px] uppercase tracking-widest text-[#657086]">TypeScript / Next.js / JSON-DB</p>
          </motion.div>
        </div>

        <div className="grid gap-4 border-t border-[#172033]/15 pt-7 text-sm sm:grid-cols-3"><div><p className="font-bold">01 / Claridad</p><p className="mt-1 text-[#657086]">Información que se encuentra rápido.</p></div><div><p className="font-bold">02 / Ritmo</p><p className="mt-1 text-[#657086]">Flujos simples para avanzar sin fricción.</p></div><div><p className="font-bold">03 / Control</p><p className="mt-1 text-[#657086]">Una base técnica lista para escalar.</p></div></div>
      </div>
    </section>
  );
}