// src/app/page.tsx
'use client';

import React from 'react';
import { useGameStore } from '@/store/gameStore';
import CacheGame from '@/components/cache/CacheGame';
import PipelineGame from '@/components/pipeline/PipelineGame';
import LeaderboardView from '@/components/leaderboard/LeaderboardView';

export default function HomePage() {
  const { phase, setPhase, isCacheCompleted, isPipelineCompleted } = useGameStore();

  return (
    <div className="flex-1 flex flex-col justify-between pb-16">
      {phase === 'CACHE' && <CacheGame />}
      {phase === 'PIPELINE' && <PipelineGame />}
      {phase === 'LEADERBOARD' && <LeaderboardView />}

      {/* Persistent Bottom Bar with Locked Phase Progression & Subtle Creator Credit */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 hidden md:inline text-[11px]">
            PROGRESSION:
          </span>

          <button
            onClick={() => setPhase('CACHE')}
            disabled={isCacheCompleted}
            className={`px-3 py-1 rounded font-bold transition-all ${
              isCacheCompleted
                ? 'bg-slate-900/50 text-slate-600 border border-slate-800/60 cursor-not-allowed line-through'
                : phase === 'CACHE'
                ? 'bg-emerald-500 text-slate-950 cursor-pointer'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer'
            }`}
          >
            {isCacheCompleted ? '🔒 01 // CACHE DONE' : '01 // CACHE MAPPING'}
          </button>

          <button
            onClick={() => setPhase('PIPELINE')}
            disabled={isPipelineCompleted}
            className={`px-3 py-1 rounded font-bold transition-all ${
              isPipelineCompleted
                ? 'bg-slate-900/50 text-slate-600 border border-slate-800/60 cursor-not-allowed line-through'
                : phase === 'PIPELINE'
                ? 'bg-emerald-500 text-slate-950 cursor-pointer'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer'
            }`}
          >
            {isPipelineCompleted ? '🔒 02 // PIPELINE DONE' : '02 // PIPELINE HAZARDS'}
          </button>

          <button
            onClick={() => setPhase('LEADERBOARD')}
            className={`px-3 py-1 rounded font-bold transition-all cursor-pointer ${
              phase === 'LEADERBOARD'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-900 text-amber-300/80 hover:text-amber-300 border border-slate-800'
            }`}
          >
            03 // LEADERBOARD 🏆
          </button>
        </div>

        {/* Subtle Persistent Creator Watermark */}
        <div className="text-[11px] text-slate-400 tracking-wider select-none">
          Made by <span className="text-emerald-400 font-bold">Krsna Shah</span>{' '}
          <span className="text-slate-600">|</span>{' '}
          <span className="text-amber-300/90 font-semibold">25BCA7363</span>
        </div>
      </footer>
    </div>
  );
}