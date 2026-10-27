// src/components/leaderboard/LeaderboardView.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

interface LeaderboardEntry {
  id: string;
  name: string;
  regNo: string;
  score: number;
  hitRatio: number;
  cpi: number;
}

export default function LeaderboardView() {
  const { score, hits, misses, cpi, setPhase, resetGame } = useGameStore();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [name, setName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const totalAccesses = hits + misses;
  const hitRatio = totalAccesses > 0 ? Number(((hits / totalAccesses) * 100).toFixed(1)) : 100;

  // Efficiency bonus calculation combining Cache Hit Ratio and Pipeline CPI
  const efficiencyBonus = Math.round(hitRatio * 3 + Math.max(0, (2.0 - cpi) * 200));
  const finalEfficiencyScore = score + efficiencyBonus;

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/leaderboard', { cache: 'no-store' });
      const data = await res.json();
      if (data.entries) setEntries(data.entries);
    } catch {}
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 4000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          regNo: regNo || 'ECE2002',
          score: finalEfficiencyScore,
          hitRatio,
          cpi,
        }),
      });
      const data = await res.json();
      if (data.entries) setEntries(data.entries);
      setHasSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="max-w-5xl mx-auto w-full px-4 py-8 font-mono flex flex-col gap-6">
      {/* Top Summary Banner */}
      <div className="bg-slate-900/95 border-2 border-emerald-400 rounded-2xl p-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded bg-emerald-400 text-slate-950 uppercase">
              SYSTEM REBOOT COMPLETE // ECE 2002 COA
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2">
              LIVE CLASSROOM LEADERBOARD
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Modules 5 &amp; 6: Cache Memory Organization &amp; Instruction Level Pipelining
            </p>
          </div>

          <div className="flex gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/40 text-center min-w-[110px]">
              <div className="text-[10px] text-slate-400 uppercase">Hit Ratio</div>
              <div className="text-lg font-extrabold text-emerald-400">{hitRatio}%</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-cyan-500/40 text-center min-w-[110px]">
              <div className="text-[10px] text-slate-400 uppercase">Final CPI</div>
              <div className="text-lg font-extrabold text-cyan-300">{cpi.toFixed(2)}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-amber-400/60 text-center min-w-[130px]">
              <div className="text-[10px] text-amber-300 uppercase">Total Rating</div>
              <div className="text-xl font-extrabold text-amber-400">{finalEfficiencyScore}</div>
            </div>
          </div>
        </div>

        {/* Score Submission Form */}
        {!hasSubmitted ? (
          <form
            onSubmit={handleSubmitScore}
            className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              placeholder="YOUR NAME / CALLSIGN (e.g. KRSNA)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={16}
              required
              className="flex-1 bg-slate-950 border border-emerald-500/50 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
            />
            <input
              type="text"
              placeholder="REG NO / SLOT (e.g. 24BCE...)"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
              maxLength={12}
              className="sm:w-48 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs tracking-wider cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              {isLoading ? 'TRANSMITTING...' : 'POST TO LIVE BOARD →'}
            </button>
          </form>
        ) : (
          <div className="mt-5 p-3 rounded-lg bg-emerald-950/60 border border-emerald-400/50 text-center text-xs text-emerald-300 font-bold">
            ✅ SCORE LOGGED TO GLOBAL TELEMETRY! Live rankings refresh automatically every 4 seconds.
          </div>
        )}
      </div>

      {/* Live Rankings Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            // TOP SYSTEM ARCHITECTS (LIVE FEED)
          </span>
          <span className="text-[10px] text-slate-500">AUTO-SYNC ACTIVE</span>
        </div>

        <div className="divide-y divide-slate-800/70">
          {entries.map((entry, idx) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`px-6 py-3.5 flex items-center justify-between text-xs ${
                idx === 0
                  ? 'bg-amber-500/10 text-amber-200'
                  : idx === 1
                  ? 'bg-slate-800/40 text-slate-200'
                  : idx === 2
                  ? 'bg-amber-950/20 text-amber-300/90'
                  : 'text-slate-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs ${
                    idx === 0
                      ? 'bg-amber-400 text-slate-950'
                      : idx === 1
                      ? 'bg-slate-300 text-slate-950'
                      : idx === 2
                      ? 'bg-amber-700 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {idx + 1}
                </span>
                <div>
                  <div className="font-extrabold text-sm tracking-wide text-white">
                    {entry.name}
                  </div>
                  <div className="text-[10px] text-slate-400">{entry.regNo}</div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="hidden sm:block text-right">
                  <div className="text-[10px] text-slate-500">HIT RATIO</div>
                  <div className="font-bold text-emerald-400">{entry.hitRatio}%</div>
                </div>
                <div className="hidden sm:block text-right">
                  <div className="text-[10px] text-slate-500">CPI</div>
                  <div className="font-bold text-cyan-300">{entry.cpi}</div>
                </div>
                <div className="text-right min-w-[80px]">
                  <div className="text-[10px] text-slate-500">SCORE</div>
                  <div className="text-base font-extrabold text-amber-400">
                    {entry.score}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation & Academic References Footer (Required by Guidelines!) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-900/70 border border-slate-800 p-4 rounded-xl text-xs">
        <div className="text-slate-400 space-y-1">
          <div className="text-emerald-400 font-bold uppercase">
            Academic References &amp; Citations (COA Guidelines):
          </div>
          <div>
            1. William Stallings, <em>Computer Organization and Architecture (8th Edition)</em>, Ch. 4 (Cache Memory) &amp; Ch. 12–14 (Pipelining).
          </div>
          <div>
            2. Dr. Agam Das Goswami, <em>ECE 2002 Modules 5 &amp; 6 Lecture Notes</em>, SENSE, VIT-AP University.
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setPhase('CACHE')}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:border-emerald-400 font-bold cursor-pointer"
          >
            PHASE 1: CACHE
          </button>
          <button
            onClick={() => setPhase('PIPELINE')}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:border-emerald-400 font-bold cursor-pointer"
          >
            PHASE 2: PIPELINE
          </button>
          <button
            onClick={() => {
              resetGame();
              setPhase('CACHE');
            }}
            className="px-5 py-2 rounded-lg bg-emerald-500 text-slate-950 font-extrabold hover:bg-emerald-400 cursor-pointer"
          >
            NEW RUN ↻
          </button>
        </div>
      </div>
    </section>
  );
}