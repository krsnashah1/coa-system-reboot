// src/components/ui/TopSystemHUD.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

export default function TopSystemHUD() {
  const {
    score,
    streak,
    phase,
    level,
    mappingMode,
    openTutorial,
    requestTacticalHint,
  } = useGameStore();

  const handleOpenManual = () => {
    if (phase === 'PIPELINE') {
      openTutorial(3);
    } else if (mappingMode === 'DIRECT') {
      openTutorial(1);
    } else {
      openTutorial(2);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-slate-950/90 backdrop-blur-md border-b border-emerald-500/30 px-4 md:px-8 flex items-center justify-between font-mono select-none">
      {/* LEFT: System Status & Creator Tag */}
      <div className="flex items-center gap-3">
        <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
        <div>
          <div className="text-[10px] tracking-widest text-emerald-500/80 uppercase flex items-center gap-2">
            <span>SYS.REBOOT // {phase}</span>
            <span className="hidden lg:inline text-slate-500">
              • Made by Krsna Shah (25BCA7363)
            </span>
          </div>
          <div className="text-xs md:text-sm font-bold text-emerald-300 tracking-wider">
            {phase === 'CACHE'
              ? `LVL 0${level} : ${mappingMode} MAP`
              : phase === 'PIPELINE'
              ? 'PHASE 2 : PIPELINE OVERDRIVE'
              : 'PHASE 3 : LEADERBOARD'}
          </div>
        </div>
      </div>

      {/* CENTER: Persistent Score Counter */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1 flex flex-col items-center">
        <div className="bg-slate-900/95 border-2 border-emerald-500/60 px-6 py-1.5 rounded-b-xl shadow-[0_0_25px_rgba(16,185,129,0.25)] flex items-center gap-4">
          <div className="text-center">
            <span className="block text-[9px] uppercase tracking-[0.25em] text-emerald-500/80">
              System Score
            </span>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={score}
                initial={{ scale: 1.35, color: '#6ee7b7' }}
                animate={{ scale: 1, color: '#34d399' }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className="block text-xl md:text-2xl font-extrabold tracking-widest text-emerald-400"
              >
                {score.toString().padStart(6, '0')}
              </motion.span>
            </AnimatePresence>
          </div>

          {streak > 1 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-amber-500/20 border border-amber-400/60 text-amber-300 px-2 py-0.5 rounded text-xs font-bold"
            >
              {streak}x STREAK
            </motion.div>
          )}
        </div>
      </div>

      {/* RIGHT: Persistent Hint & Instructions Buttons */}
      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={requestTacticalHint}
          className="px-3 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/25 border border-amber-400/50 text-amber-300 text-xs font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
          title="Get a hint for the current puzzle"
        >
          <span className="text-amber-400 font-extrabold">[?]</span>
          <span>HINT</span>
        </button>

        <button
          onClick={handleOpenManual}
          className="px-3 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 text-xs font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
          title="Open COA Field Manual & Walkthrough"
        >
          <span className="text-emerald-400 font-extrabold">[i]</span>
          <span className="hidden sm:inline">MANUAL</span>
        </button>
      </div>
    </header>
  );
}