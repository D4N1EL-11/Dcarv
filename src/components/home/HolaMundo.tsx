'use client';

import { motion } from 'framer-motion';

export function HolaMundo() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f0c29] px-6 text-white">
      <motion.div className="absolute inset-0 bg-[linear-gradient(120deg,#0f0c29,#302b63,#24243e,#0f0c29)] bg-[length:300%_300%]" initial={{ backgroundPosition: '0% 50%' }} animate={{ backgroundPosition: '100% 50%' }} transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse' }} />
      <div className="relative z-10 text-center">
        <div className="flex flex-col text-7xl font-extrabold tracking-tighter sm:text-8xl md:text-9xl">
          <motion.span initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.8, delay: 0.2 }}>Hola</motion.span>
          <motion.span className="text-blue-400" initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.8, delay: 0.5 }}>Mundo</motion.span>
        </div>
        <motion.div className="mx-auto mt-8 h-px w-48 origin-center bg-white/40" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: 1, ease: 'easeInOut' }} />
        <motion.p className="mt-6 text-lg font-light tracking-wide text-white/60 sm:text-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 1.3 }}>Una base fullstack TypeScript, lista para crecer.</motion.p>
        <motion.span className="mt-8 inline-block rounded-full border border-white/20 px-4 py-2 font-mono text-sm text-white/80" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 1.6, stiffness: 260, damping: 20 }}>TypeScript + Next.js</motion.span>
      </div>
    </section>
  );
}