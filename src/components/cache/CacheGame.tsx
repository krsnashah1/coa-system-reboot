// src/components/cache/CacheGame.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, CacheMappingMode } from '@/store/gameStore';

interface LevelScenario {
  level: number;
  mode: CacheMappingMode;
  title: string;
  subtitle: string;
  sequence: number[];
  waysPerSet: number;
}

const CACHE_LEVELS: LevelScenario[] = [
  {
    level: 1,
    mode: 'DIRECT',
    title: 'LEVEL 01 // DIRECT MAPPING PROTOCOL',
    subtitle: 'Route each Main Memory block using Line = Block mod 4.',
    sequence: [0, 1, 4, 4, 7, 1, 8, 4],
    waysPerSet: 1,
  },
  {
    level: 2,
    mode: 'ASSOCIATIVE',
    title: 'LEVEL 02 // FULLY ASSOCIATIVE + LRU',
    subtitle: 'Place blocks in any empty line, then evict the Least Recently Used (LRU) block.',
    sequence: [0, 4, 8, 12, 0, 2, 4, 6],
    waysPerSet: 4,
  },
  {
    level: 3,
    mode: 'SET_ASSOCIATIVE',
    title: 'LEVEL 03 // 2-WAY SET-ASSOCIATIVE MAPPING',
    subtitle: '4 Lines divided into 2 Sets (Set = Block mod 2).',
    sequence: [2, 6, 3, 2, 10, 5, 1, 6],
    waysPerSet: 2,
  },
];

export default function CacheGame() {
  const { setPhase, addScore, recordHit } = useGameStore();
  const [currentLvl, setCurrentLvl] = useState(0);
  const [step, setStep] = useState(0);

  const scenario = CACHE_LEVELS[currentLvl];
  const block = scenario.sequence[step];

  const handleRoute = (targetLine: number) => {
    recordHit();
    addScore(100);
    if (step + 1 < scenario.sequence.length) {
      setStep(step + 1);
    } else if (currentLvl + 1 < CACHE_LEVELS.length) {
      setCurrentLvl(currentLvl + 1);
      setStep(0);
    } else {
      setPhase('PIPELINE');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 font-mono text-center">
      <h2 className="text-xl font-bold text-emerald-400 mb-2">{scenario.title}</h2>
      <p className="text-xs text-slate-400 mb-6">{scenario.subtitle}</p>

      <div className="p-6 bg-slate-900 border border-emerald-500/40 rounded-xl mb-6">
        <div className="text-xs text-slate-500 uppercase">Current CPU Request</div>
        <div className="text-3xl font-extrabold text-white my-2">Main Memory Block #{block}</div>
        <p className="text-xs text-emerald-300">Click any cache line below to route this block:</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((lineIdx) => (
          <motion.button
            key={lineIdx}
            whileHover={{ scale: 1.02 }}
            onClick={() => handleRoute(lineIdx)}
            className="p-5 bg-slate-950 border border-emerald-500/40 hover:border-emerald-400 rounded-xl text-left cursor-pointer"
          >
            <div className="text-xs font-bold text-emerald-400">CACHE LINE {lineIdx}</div>
            <div className="text-xs text-slate-400 mt-1">Status: Ready for routing</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}