// src/components/leaderboard/LeaderboardView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

export default function LeaderboardView() {
  const { score, resetGame, setPhase } = useGameStore();
  const [entries, setEntries] = useState<{ id: string; name: string; score: number }[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.entries) setEntries(data.entries);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, regNo: 'ECE2002', score }),
    });
    const data = await res.json();
    if (data.entries) setEntries(data.entries);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 font-mono text-center">
      <h2 className="text-2xl font-bold text-amber-400 mb-2">LIVE CLASSROOM LEADERBOARD</h2>
      <p className="text-xs text-slate-400 mb-6">Final System Efficiency Rating: {score}</p>

      <form onSubmit={handleSubmit} className="mb-8 flex gap-2 justify-center">
        <input
          type="text"
          placeholder="ENTER YOUR NAME"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-slate-950 border border-emerald-500/50 px-4 py-2 rounded text-xs text-white"
        />
        <button type="submit" className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded cursor-pointer">
          SUBMIT SCORE
        </button>
      </form>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-left">
        {entries.map((entry, idx) => (
          <div key={entry.id || idx} className="px-6 py-3 border-b border-slate-800 flex justify-between text-xs">
            <span className="text-white font-bold">{idx + 1}. {entry.name}</span>
            <span className="text-amber-400 font-extrabold">{entry.score} PTS</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          resetGame();
          setPhase('CACHE');
        }}
        className="mt-6 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded cursor-pointer"
      >
        RESTART SIMULATION ↻
      </button>
    </div>
  );
}