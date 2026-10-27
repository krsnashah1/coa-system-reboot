// src/components/cache/CacheGame.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, CacheMappingMode } from '@/store/gameStore';
import {
  CacheLineState,
  getAddressBreakdown,
  validateCachePlacement,
} from '@/lib/mapping';
import DraggableBlock from './DraggableBlock';
import CacheLine from './CacheLine';
import LiveTelemetryDashboard from '../ui/LiveTelemetryDashboard';

interface LevelScenario {
  level: number;
  mode: CacheMappingMode;
  title: string;
  subtitle: string;
  sequence: number[]; // Sequence of Main Memory block requests
  waysPerSet: number;
}

const CACHE_LEVELS: LevelScenario[] = [
  {
    level: 1,
    mode: 'DIRECT',
    title: 'LEVEL 01 // DIRECT MAPPING PROTOCOL',
    subtitle: 'Route each Main Memory block using Line = Block mod 4. Watch for Conflict Thrashing!',
    // Includes repeat hits (4, 1) and conflict thrashing on Line 0 (0 -> 4 -> 8 -> 4)
    sequence: [0, 1, 4, 4, 7, 1, 8, 4],
    waysPerSet: 1,
  },
  {
    level: 2,
    mode: 'ASSOCIATIVE',
    title: 'LEVEL 02 // FULLY ASSOCIATIVE + LRU',
    subtitle: 'Place blocks in ANY empty line! When full, evict the Least Recently Used (LRU) block.',
    // Fills 4 lines (0, 4, 8, 12), hits 0 (so 4 becomes oldest LRU), then requests 2 & 6
    sequence: [0, 4, 8, 12, 0, 2, 4, 6],
    waysPerSet: 4,
  },
  {
    level: 3,
    mode: 'SET_ASSOCIATIVE',
    title: 'LEVEL 03 // 2-WAY SET-ASSOCIATIVE MAPPING',
    subtitle: '4 Lines divided into 2 Sets (Set = Block mod 2). Fill free ways first, then evict Set LRU!',
    // Even blocks map to Set 0 (Lines 0,1); Odd blocks map to Set 1 (Lines 2,3)
    sequence: [2, 6, 3, 2, 10, 5, 1, 6],
    waysPerSet: 2,
  },
];

const INITIAL_LINES: CacheLineState[] = [0, 1, 2, 3].map((idx) => ({
  lineIndex: idx,
  valid: false,
  tag: '',
  blockNumber: null,
  dataHex: null,
  lastUsedStep: 0,
}));

export default function CacheGame() {
  const {
    setLevelConfig,
    setActiveBlock,
    recordHit,
    recordMiss,
    triggerHint,
    setPhase,
  } = useGameStore();

  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [lines, setLines] = useState<CacheLineState[]>(INITIAL_LINES);
  const [stepCounter, setStepCounter] = useState(1);
  const [lastEventBanner, setLastEventBanner] = useState<string | null>(null);
  const [isPhaseComplete, setIsPhaseComplete] = useState(false);

  const scenario = CACHE_LEVELS[currentLevelIdx];
  const currentBlock = scenario.sequence[stepIdx];

  // Sync store with active level & active block for smart hints
  useEffect(() => {
    setLevelConfig(scenario.level, scenario.mode, 4, scenario.waysPerSet);
  }, [currentLevelIdx, scenario, setLevelConfig]);

  useEffect(() => {
    setActiveBlock(currentBlock ?? null);
  }, [currentBlock, setActiveBlock]);

  // Identify if current block is already in cache
  const existingHitLine =
    lines.find((l) => l.valid && l.blockNumber === currentBlock)?.lineIndex ??
    null;

  // Determine which line(s) are currently the LRU eviction candidates
  const getIsLruCandidate = (line: CacheLineState): boolean => {
    if (!line.valid) return false;
    if (scenario.mode === 'ASSOCIATIVE') {
      if (lines.some((l) => !l.valid)) return false;
      const oldest = lines.reduce((min, curr) =>
        curr.lastUsedStep < min.lastUsedStep ? curr : min
      );
      return oldest.lineIndex === line.lineIndex;
    }
    if (scenario.mode === 'SET_ASSOCIATIVE') {
      const targetSet = Math.floor(line.lineIndex / scenario.waysPerSet);
      const setLines = lines.filter(
        (l) => Math.floor(l.lineIndex / scenario.waysPerSet) === targetSet
      );
      if (setLines.some((l) => !l.valid)) return false;
      const oldestInSet = setLines.reduce((min, curr) =>
        curr.lastUsedStep < min.lastUsedStep ? curr : min
      );
      return oldestInSet.lineIndex === line.lineIndex;
    }
    return false;
  };

  const handleDropIntoLine = (targetLineIndex: number) => {
    if (currentBlock === undefined) return;

    const result = validateCachePlacement(
      currentBlock,
      targetLineIndex,
      lines,
      scenario.mode,
      scenario.waysPerSet
    );

    if (!result.valid) {
      recordMiss(result.errorReason || 'Invalid placement', result.formula);
      setLastEventBanner(`❌ FAULT: ${result.errorReason}`);
      return;
    }

    const breakdown = getAddressBreakdown(
      currentBlock,
      scenario.mode,
      4,
      scenario.waysPerSet
    );
    const hexPayload = `0x${((currentBlock + 1) * 4369)
      .toString(16)
      .toUpperCase()
      .padStart(4, '0')}`;

    const updatedLines = lines.map((l) =>
      l.lineIndex === targetLineIndex
        ? {
            ...l,
            valid: true,
            tag: breakdown.tagBits,
            blockNumber: currentBlock,
            dataHex: hexPayload,
            lastUsedStep: stepCounter,
          }
        : l
    );

    setLines(updatedLines);
    setStepCounter((c) => c + 1);
    recordHit();

    if (result.isCacheHit) {
      setLastEventBanner(
        `⚡ CACHE HIT! Block ${currentBlock} was already in Line ${targetLineIndex} — Zero Main Memory wait!`
      );
    } else if (result.missType === 'CONFLICT') {
      setLastEventBanner(
        `🔄 CONFLICT REPLACEMENT: Loaded Block ${currentBlock} into Line ${targetLineIndex} (Evicted previous block).`
      );
    } else if (result.missType === 'CAPACITY') {
      setLastEventBanner(
        `♻️ CAPACITY LRU REPLACEMENT: Evicted oldest block in Line ${targetLineIndex} for Block ${currentBlock}.`
      );
    } else {
      setLastEventBanner(
        `✅ COLD LOAD: Routed Block ${currentBlock} into Cache Line ${targetLineIndex}.`
      );
    }

    // Advance to next request or next level
    if (stepIdx + 1 < scenario.sequence.length) {
      setStepIdx(stepIdx + 1);
    } else if (currentLevelIdx + 1 < CACHE_LEVELS.length) {
      const nextLvl = CACHE_LEVELS[currentLevelIdx + 1];
      setCurrentLevelIdx(currentLevelIdx + 1);
      setStepIdx(0);
      setLines(INITIAL_LINES);
      triggerHint({
        title: `UNLOCKED: ${nextLvl.title}`,
        message: nextLvl.subtitle,
        type: 'TACTICAL',
      });
    } else {
      setIsPhaseComplete(true);
    }
  };

  if (isPhaseComplete) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 bg-slate-900/95 border-2 border-emerald-400 rounded-2xl text-center font-mono shadow-[0_0_50px_rgba(16,185,129,0.3)]">
        <div className="text-xs text-emerald-400 tracking-widest uppercase mb-2">
          // MODULE 05 COMPLETE
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
          CACHE SUBSYSTEM STABILIZED
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto mb-6 leading-relaxed">
          You have mastered Direct Mapping, Fully Associative LRU Replacement, and 2-Way Set-Associative Cache
          Organization. The CPU instruction stream is now ready for Phase 2: Pipeline Overdrive.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              setCurrentLevelIdx(0);
              setStepIdx(0);
              setLines(INITIAL_LINES);
              setIsPhaseComplete(false);
            }}
            className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-xs font-bold hover:border-emerald-400 cursor-pointer"
          >
            REPLAY CACHE LEVELS
          </button>
          <button
            onClick={() => setPhase('PIPELINE')}
            className="px-6 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-extrabold hover:bg-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-pointer"
          >
            LAUNCH PHASE 2: PIPELINE OVERDRIVE &rarr;
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="max-w-6xl mx-auto w-full px-4 py-6 font-mono flex flex-col gap-6">
      {/* Top Level Banner & Level Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-emerald-500/30 p-4 rounded-xl">
        <div>
          <h1 className="text-base md:text-lg font-extrabold text-white tracking-wide">
            {scenario.title}
          </h1>
          <p className="text-xs text-emerald-400/90 mt-0.5">{scenario.subtitle}</p>
        </div>

        {/* Quick Level Selector for Classroom Demonstration */}
        <div className="flex items-center gap-2">
          {CACHE_LEVELS.map((lvl, idx) => (
            <button
              key={lvl.level}
              onClick={() => {
                setCurrentLevelIdx(idx);
                setStepIdx(0);
                setLines(INITIAL_LINES);
                setLastEventBanner(null);
              }}
              className={`px-3 py-1.5 rounded text-xs font-bold border transition-all cursor-pointer ${
                currentLevelIdx === idx
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-emerald-500/50'
              }`}
            >
              LVL {lvl.level}
            </button>
          ))}
        </div>
      </div>

      {/* Live Telemetry Bar */}
      <LiveTelemetryDashboard />

      {/* Main Split Game Chamber */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Main Memory Request Queue */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              // MAIN MEMORY STREAM
            </span>
            <span className="text-xs text-slate-400">
              Request {stepIdx + 1} of {scenario.sequence.length}
            </span>
          </div>

          <DraggableBlock
            blockNumber={currentBlock}
            dataHex={`0x${((currentBlock + 1) * 4369)
              .toString(16)
              .toUpperCase()
              .padStart(4, '0')}`}
            binaryBlock={currentBlock.toString(2).padStart(4, '0')}
            isSelected={true}
            alreadyInCacheLine={existingHitLine}
            onSelect={() => {}}
          />

          {/* Upcoming Request Queue Preview */}
          <div className="mt-5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
              Upcoming CPU Address Queue
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {scenario.sequence.map((blk, idx) => (
                <span
                  key={idx}
                  className={`px-2.5 py-1 rounded text-xs font-bold border ${
                    idx < stepIdx
                      ? 'bg-slate-950/40 border-slate-900 text-slate-600 line-through'
                      : idx === stepIdx
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 scale-105'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  B{blk}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Cache Memory Lines */}
        <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              // L1 CACHE MEMORY (4 LINES)
            </span>
            <span className="text-[11px] text-slate-400">
              Drop or Click target line to route Block B{currentBlock}
            </span>
          </div>

          <div className="space-y-3">
            {lines.map((line) => (
              <CacheLine
                key={line.lineIndex}
                line={line}
                mode={scenario.mode}
                waysPerSet={scenario.waysPerSet}
                isLruCandidate={getIsLruCandidate(line)}
                isMatchingHit={existingHitLine === line.lineIndex}
                onDropBlock={handleDropIntoLine}
              />
            ))}
          </div>

          {/* Live Status Feedback Banner */}
          {lastEventBanner && (
            <motion.div
              key={lastEventBanner}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-lg bg-slate-950 border border-emerald-500/40 text-xs text-emerald-300"
            >
              {lastEventBanner}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}