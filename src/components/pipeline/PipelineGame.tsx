// src/components/pipeline/PipelineGame.tsx
'use client';

import React from 'react';
import { useGameStore } from '@/store/gameStore';

export default function PipelineGame() {
  const { setPhase, cpi } = useGameStore();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 font-mono text-center">
      <h2 className="text-xl font-bold text-emerald-400 mb-2">PHASE 2 // INSTRUCTION PIPELINE OVERDRIVE</h2>
      <p className="text-xs text-slate-400 mb-6">Manage data hazards, control hazards, and structural bus constraints.</p>

      <div className="p-6 bg-slate-900 border border-cyan-500/40 rounded-xl mb-6 text-left">
        <div className="text-xs text-cyan-300 font-bold mb-2">MODULE 6.3 SIMULATOR SUMMARY</div>
        <div className="text-xs text-slate-300 space-y-1">
          <div>• Pipelined Execution Speedup Achieved</div>
          <div>• Current System CPI: <span className="text-emerald-400 font-bold">{cpi}</span></div>
        </div>
      </div>

      <button
        onClick={() => setPhase('LEADERBOARD')}
        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl cursor-pointer"
      >
        PROCEED TO LIVE LEADERBOARD →
      </button>
    </div>
  );
}