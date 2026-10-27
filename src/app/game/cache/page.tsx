// src/app/page.tsx
'use client';

import React from 'react';
import { useGameStore } from '@/store/gameStore';
import CacheGame from '@/components/cache/CacheGame';

export default function HomePage() {
  const { phase } = useGameStore();

  return (
    <div className="flex-1 flex flex-col justify-between pb-12">
      {phase === 'CACHE' && <CacheGame />}
      {phase === 'PIPELINE' && (
        <div className="max-w-xl mx-auto my-20 p-6 bg-slate-900 border border-emerald-500/40 rounded-xl text-center">
          <h2 className="text-lg font-bold text-emerald-400">
            PHASE 2 // PIPELINE OVERDRIVE READY FOR INTEGRATION
          </h2>
        </div>
      )}
    </div>
  );
}