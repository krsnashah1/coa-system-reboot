// src/app/page.tsx
'use client';

import React from 'react';
import { useGameStore } from '@/store/gameStore';
import CacheGame from '@/components/cache/CacheGame';
import PipelineGame from '@/components/pipeline/PipelineGame';
import LeaderboardView from '@/components/leaderboard/LeaderboardView';

export default function HomePage() {
  const { phase, setPhase } = useGameStore();

  return (
    <div className="flex-1 flex flex-col justify-between pb-16">
      {phase === 'CACHE' && <CacheGame />}
      {phase === 'PIPELINE' && <PipelineGame />}
      {phase === 'LEADERBOARD' && <LeaderboardView />}

      {/* Bottom Dock for Instant Classroom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 px-4 py-2 flex items-center justify-center gap-3 font-mono text-xs">
        <span className="text-slate-500 hidden sm:inline text-[11px]">
          MODULE JUMP:
        </span>
        <button
          onClick={() => setPhase('CACHE')}
          className={`px-3 py-1 rounded font-bold transition-all cursor-pointer ${
            phase === 'CACHE'
              ? 'bg-emerald-500 text-slate-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          01 // CACHE MAPPING (MOD 5)
        </button>
        <button
          onClick={() => setPhase('PIPELINE')}
          className={`px-3 py-1 rounded font-bold transition-all cursor-pointer ${
            phase === 'PIPELINE'
              ? 'bg-emerald-500 text-slate-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          02 // PIPELINE HAZARDS (MOD 6)
        </button>
        <button
          onClick={() => setPhase('LEADERBOARD')}
          className={`px-3 py-1 rounded font-bold transition-all cursor-pointer ${
            phase === 'LEADERBOARD'
              ? 'bg-amber-400 text-slate-950'
              : 'bg-slate-900 text-amber-300/80 hover:text-amber-300 border border-slate-800'
          }`}
        >
          03 // LIVE LEADERBOARD 🏆
        </button>
      </footer>
    </div>
  );
}