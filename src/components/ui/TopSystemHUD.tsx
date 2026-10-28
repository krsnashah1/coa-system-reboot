// src/components/ui/TopSystemHUD.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

export function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

interface HudLeaderboardEntry {
  id: string;
  name: string;
  regNo: string;
  score: number;
  hitRatio: number;
  cpi: number;
  timeSeconds: number;
}

const STORAGE_KEY = 'coa_leaderboard_backup_v1';

function mergeHudEntries(
  localList: HudLeaderboardEntry[],
  serverList: HudLeaderboardEntry[]
): HudLeaderboardEntry[] {
  const map = new Map<string, HudLeaderboardEntry>();
  for (const item of [...localList, ...serverList]) {
    if (!item || !item.name) continue;
    const key = `${item.name.toUpperCase()}::${(item.regNo || 'VIT-AP').toUpperCase()}`;
    const existing = map.get(key);
    if (
      !existing ||
      item.score > existing.score ||
      (item.score === existing.score &&
        (item.timeSeconds || 9999) < (existing.timeSeconds || 9999))
    ) {
      map.set(key, item);
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.timeSeconds || 9999) - (b.timeSeconds || 9999);
  });
}

export default function TopSystemHUD() {
  const {
    score,
    streak,
    phase,
    level,
    elapsedSeconds,
    isTimerRunning,
    tickTimer,
    openTutorial,
    requestTacticalHint,
    isLeaderboardModalOpen,
    openLeaderboardModal,
    closeLeaderboardModal,
    playerName,
  } = useGameStore();

  const [liveEntries, setLiveEntries] = useState<HudLeaderboardEntry[]>([]);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, tickTimer]);

  const fetchLiveRanks = useCallback(async () => {
    try {
      const res = await fetch('/api/leaderboard', { cache: 'no-store' });
      const data = await res.json();
      const serverEntries: HudLeaderboardEntry[] = Array.isArray(data.entries)
        ? data.entries
        : [];
      let localCached: HudLeaderboardEntry[] = [];
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) localCached = JSON.parse(raw);
      } catch {}

      const merged = mergeHudEntries(localCached, serverEntries);
      setLiveEntries(merged);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {}
    } catch {}
  }, []);

  useEffect(() => {
    if (!isLeaderboardModalOpen) return;
    fetchLiveRanks();
    const interval = setInterval(fetchLiveRanks, 4000);
    return () => clearInterval(interval);
  }, [isLeaderboardModalOpen, fetchLiveRanks]);

  const handleOpenManual = () => {
    if (phase === 'PIPELINE') {
      openTutorial(3);
    } else if (level === 1) {
      openTutorial(1);
    } else {
      openTutorial(2);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-slate-950/90 backdrop-blur-md border-b border-emerald-500/30 px-3 md:px-6 flex items-center justify-between font-mono select-none">
        <div className="flex items-center gap-2.5">
          <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
          <div>
            <div className="text-[10px] tracking-widest text-emerald-500/80 uppercase flex items-center gap-2">
              <span>SYS.REBOOT // {phase}</span>
              <span className="hidden xl:inline text-slate-500">
                • Made by Krsna Shah (25BCA7363)
              </span>
            </div>
            <div className="text-xs md:text-sm font-bold text-emerald-300 tracking-wider">
              {phase === 'CACHE'
                ? `MODULE 5 : LEVEL 0${level} OF 02`
                : phase === 'PIPELINE'
                ? 'MODULE 6 : PIPELINE OVERDRIVE'
                : 'FINAL : LIVE LEADERBOARD'}
            </div>
          </div>
        </div>

        {/* CENTER: Persistent Score Counter + Stopwatch */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1 flex flex-col items-center">
          <div className="bg-slate-900/95 border-2 border-emerald-500/60 px-4 md:px-6 py-1 rounded-b-xl shadow-[0_0_25px_rgba(16,185,129,0.25)] flex items-center gap-4 md:gap-6">
            <div className="text-center">
              <span className="block text-[9px] uppercase tracking-[0.2em] text-emerald-500/80">
                System Score
              </span>
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={score}
                  initial={{ scale: 1.3, color: '#6ee7b7' }}
                  animate={{ scale: 1, color: '#34d399' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  className="block text-lg md:text-2xl font-extrabold tracking-widest text-emerald-400"
                >
                  {score.toString().padStart(6, '0')}
                </motion.span>
              </AnimatePresence>
            </div>

            <div className="h-7 w-[1px] bg-slate-800" />

            <div className="text-center">
              <span className="block text-[9px] uppercase tracking-[0.2em] text-cyan-400/80">
                Elapsed Time
              </span>
              <span className="block text-lg md:text-2xl font-extrabold tracking-widest text-cyan-300">
                {formatTime(elapsedSeconds)}
              </span>
            </div>

            {streak > 1 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="hidden sm:block bg-amber-500/20 border border-amber-400/60 text-amber-300 px-2 py-0.5 rounded text-xs font-bold"
              >
                {streak}x
              </motion.div>
            )}
          </div>
        </div>

        {/* RIGHT: Leaderboard Tab, Hint Button & Manual Button */}
        <div className="flex items-center gap-1.5 md:gap-2.5">
          <button
            onClick={openLeaderboardModal}
            className="px-2.5 md:px-3 py-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-400/50 text-cyan-300 text-xs font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            title="View Live Classroom Leaderboard"
          >
            <span>🏆</span>
            <span className="hidden md:inline">RANKS</span>
          </button>

          <button
            onClick={requestTacticalHint}
            className="px-2.5 md:px-3 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/25 border border-amber-400/50 text-amber-300 text-xs font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            title="Get a hint for the current puzzle"
          >
            <span className="text-amber-400 font-extrabold">[?]</span>
            <span className="hidden sm:inline">HINT</span>
          </button>

          <button
            onClick={handleOpenManual}
            className="px-2.5 md:px-3 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 text-xs font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            title="Open COA Field Manual & Walkthrough"
          >
            <span className="text-emerald-400 font-extrabold">[i]</span>
            <span className="hidden sm:inline">MANUAL</span>
          </button>
        </div>
      </header>

      {/* LIVE LEADERBOARD OVERLAY MODAL */}
      <AnimatePresence>
        {isLeaderboardModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 font-mono"
          >
            <motion.div
              initial={{ scale: 0.92, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 15 }}
              className="w-full max-w-2xl bg-slate-900 border-2 border-cyan-400/60 rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.25)] overflow-hidden"
            >
              <div className="bg-slate-950 px-5 py-3.5 border-b border-cyan-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>🏆</span>
                  <span className="text-xs font-extrabold tracking-widest text-cyan-300 uppercase">
                    LIVE CLASSROOM STANDINGS (PERSISTENT SYNC)
                  </span>
                </div>
                <button
                  onClick={closeLeaderboardModal}
                  className="text-xs text-slate-400 hover:text-rose-400 font-bold px-2.5 py-1 rounded border border-slate-800 hover:border-rose-500/40 cursor-pointer"
                >
                  [CLOSE &amp; RESUME]
                </button>
              </div>

              <div className="bg-cyan-950/25 px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Your Active Run: </span>
                  <strong className="text-white">{playerName || 'TECHNICIAN'}</strong>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-emerald-400 font-bold">
                    Score: {score} PTS
                  </span>
                  <span className="text-cyan-300 font-bold">
                    Time: {formatTime(elapsedSeconds)}
                  </span>
                </div>
              </div>

              <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-800/70">
                {liveEntries.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No finished runs posted yet. Finish Phase 2 to claim #1 on the board!
                  </div>
                ) : (
                  liveEntries.map((entry, idx) => (
                    <div
                      key={`${entry.name}-${entry.regNo}`}
                      className="px-5 py-3 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-[11px] ${
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
                          <div className="font-bold text-white">{entry.name}</div>
                          <div className="text-[10px] text-slate-500">{entry.regNo}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-5">
                        <div className="text-right">
                          <div className="text-[9px] text-slate-500">TIME</div>
                          <div className="font-bold text-cyan-300">
                            {formatTime(entry.timeSeconds ?? 0)}
                          </div>
                        </div>
                        <div className="text-right min-w-[70px]">
                          <div className="text-[9px] text-slate-500">FINAL SCORE</div>
                          <div className="font-extrabold text-amber-400 text-sm">
                            {entry.score}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Rankings factor in Accuracy, CPI &amp; Completion Speed!</span>
                <button
                  onClick={closeLeaderboardModal}
                  className="px-4 py-1.5 rounded bg-emerald-500 text-slate-950 font-extrabold text-xs cursor-pointer"
                >
                  BACK TO GAME &rarr;
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}