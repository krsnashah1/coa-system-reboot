// src/components/cache/CacheGame.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  useGameStore,
  CacheLevelScenario,
} from '@/store/gameStore';
import {
  CacheLineState,
  getAddressBreakdown,
  validateCachePlacement,
} from '@/lib/mapping';
import { sound } from '@/lib/sound';
import DraggableBlock from './DraggableBlock';
import CacheLine from './CacheLine';
import LiveTelemetryDashboard from '../ui/LiveTelemetryDashboard';

function generateRandomizedLevels(): CacheLevelScenario[] {
  const randInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const remPool = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
  const bA1 = remPool[0] + 4 * randInt(0, 1);
  const bB1 = remPool[1] + 4 * randInt(0, 2);
  const bA2 = remPool[0] + 4 * randInt(2, 3);
  const bC1 = remPool[2] + 4 * randInt(0, 3);
  const bB2 = (remPool[1] + 4 * ((Math.floor(bB1 / 4) + 1) % 4)) % 16;
  const directSeq = [bA1, bB1, bA1, bA2, bC1, bB1, bB2, bA2];

  const allBlocks = Array.from({ length: 16 }, (_, i) => i).sort(
    () => Math.random() - 0.5
  );
  const [f0, f1, f2, f3, f4, f5] = allBlocks;
  const assocSeq = [f0, f1, f2, f3, f0, f4, f1, f5];

  const evens = [0, 2, 4, 6, 8, 10, 12, 14].sort(() => Math.random() - 0.5);
  const odds = [1, 3, 5, 7, 9, 11, 13, 15].sort(() => Math.random() - 0.5);
  const setAssocSeq = [
    evens[0],
    evens[1],
    odds[0],
    evens[0],
    evens[2],
    odds[1],
    odds[2],
    evens[2],
  ];

  return [
    {
      level: 1,
      mode: 'DIRECT',
      title: 'LEVEL 01 // DIRECT MAPPING PROTOCOL (RANDOMIZED)',
      subtitle:
        'Route each Main Memory block using Line = Block mod 4. Watch for Hits & Conflict Thrashing!',
      sequence: directSeq,
      waysPerSet: 1,
    },
    {
      level: 2,
      mode: 'ASSOCIATIVE',
      title: 'LEVEL 02 // FULLY ASSOCIATIVE + LRU (CONTINUOUS CACHE)',
      subtitle:
        'Your cache blocks from Level 1 are preserved! Place new blocks in any empty line, or evict the LRU (OLDEST) block.',
      sequence: assocSeq,
      waysPerSet: 4,
    },
    {
      level: 3,
      mode: 'SET_ASSOCIATIVE',
      title: 'LEVEL 03 // 2-WAY SET-ASSOCIATIVE (CONTINUOUS CACHE)',
      subtitle:
        '4 Lines divided into 2 Sets (Set = Block mod 2). Existing blocks remain active—fill free ways first or evict Set LRU!',
      sequence: setAssocSeq,
      waysPerSet: 2,
    },
  ];
}

export default function CacheGame() {
  const {
    isCacheCompleted,
    completeCachePhase,
    setLevelConfig,
    setActiveBlock,
    recordHit,
    recordMiss,
    triggerHint,
    setPhase,
    cacheLevels,
    cacheLevelIdx,
    cacheStepIdx,
    cacheLines,
    cacheStepCounter,
    initCacheLevels,
    setCacheProgress,
  } = useGameStore();

  const [isMounted, setIsMounted] = useState(false);
  const [lastEventBanner, setLastEventBanner] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  useEffect(() => {
    if (cacheLevels.length === 0) {
      initCacheLevels(generateRandomizedLevels());
    }
    setIsMounted(true);
  }, [cacheLevels.length, initCacheLevels]);

  const scenario = cacheLevels[cacheLevelIdx];
  const currentBlock = scenario?.sequence[cacheStepIdx];

  useEffect(() => {
    if (scenario) {
      setLevelConfig(scenario.level, scenario.mode, 4, scenario.waysPerSet);
    }
  }, [cacheLevelIdx, scenario, setLevelConfig]);

  useEffect(() => {
    if (isMounted) {
      setActiveBlock(currentBlock ?? null);
    }
  }, [currentBlock, setActiveBlock, isMounted]);

  const getIsLruCandidate = useCallback(
    (line: CacheLineState): boolean => {
      if (!line.valid || !scenario) return false;
      if (scenario.mode === 'ASSOCIATIVE') {
        if (cacheLines.some((l) => !l.valid)) return false;
        const oldest = cacheLines.reduce((min, curr) =>
          curr.lastUsedStep < min.lastUsedStep ? curr : min
        );
        return oldest.lineIndex === line.lineIndex;
      }
      if (scenario.mode === 'SET_ASSOCIATIVE') {
        const targetSet = Math.floor(line.lineIndex / scenario.waysPerSet);
        const setLines = cacheLines.filter(
          (l) => Math.floor(l.lineIndex / scenario.waysPerSet) === targetSet
        );
        if (setLines.some((l) => !l.valid)) return false;
        const oldestInSet = setLines.reduce((min, curr) =>
          curr.lastUsedStep < min.lastUsedStep ? curr : min
        );
        return oldestInSet.lineIndex === line.lineIndex;
      }
      return false;
    },
    [cacheLines, scenario]
  );

  if (!isMounted || cacheLevels.length === 0 || currentBlock === undefined) {
    return (
      <div className="flex h-64 items-center justify-center font-mono text-emerald-400 animate-pulse text-xs uppercase tracking-widest">
        INITIALIZING CACHE SUBSYSTEM...
      </div>
    );
  }

  const existingHitLine =
    cacheLines.find((l) => l.valid && l.blockNumber === currentBlock)?.lineIndex ??
    null;

  const handleDropIntoLine = (targetLineIndex: number) => {
    if (isCacheCompleted || currentBlock === undefined) return;

    const result = validateCachePlacement(
      currentBlock,
      targetLineIndex,
      cacheLines,
      scenario.mode,
      scenario.waysPerSet
    );

    if (!result.valid) {
      sound.playFault();
      recordMiss(result.errorReason || 'Invalid placement', result.formula);
      setLastEventBanner({
        text: `❌ MAPPING FAULT (-50 PTS): ${result.errorReason} [${result.formula}]`,
        isError: true,
      });
      return;
    }

    sound.playHit();
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

    const nextStepCounter = cacheStepCounter + 1;
    let updatedLines = cacheLines.map((l) =>
      l.lineIndex === targetLineIndex
        ? {
            ...l,
            valid: true,
            tag: breakdown.tagBits,
            blockNumber: currentBlock,
            dataHex: hexPayload,
            lastUsedStep: cacheStepCounter,
          }
        : l
    );

    recordHit();

    if (result.isCacheHit) {
      setLastEventBanner({
        text: `⚡ CACHE HIT! Block #${currentBlock} was already in Line ${targetLineIndex} — Zero Main Memory wait!`,
        isError: false,
      });
    } else if (result.missType === 'CONFLICT') {
      setLastEventBanner({
        text: `🔄 CONFLICT REPLACEMENT: Loaded Block #${currentBlock} into Line ${targetLineIndex} (Overwrote previous block).`,
        isError: false,
      });
    } else if (result.missType === 'CAPACITY') {
      setLastEventBanner({
        text: `♻️ CAPACITY LRU REPLACEMENT: Evicted oldest block in Line ${targetLineIndex} for Block #${currentBlock}.`,
        isError: false,
      });
    } else {
      setLastEventBanner({
        text: `✅ COMPULSORY LOAD: Routed Block #${currentBlock} into Cache Line ${targetLineIndex}.`,
        isError: false,
      });
    }

    if (cacheStepIdx + 1 < scenario.sequence.length) {
      setCacheProgress(
        cacheLevelIdx,
        cacheStepIdx + 1,
        updatedLines,
        nextStepCounter
      );
    } else if (cacheLevelIdx + 1 < cacheLevels.length) {
      const nextLvl = cacheLevels[cacheLevelIdx + 1];

      // KEEP EXISTING BLOCKS IN THE CACHE! Simply update their Tag bits to match the new mapping mode's bit split!
      const preservedLines = updatedLines.map((line) => {
        if (!line.valid || line.blockNumber === null) return line;
        const newBd = getAddressBreakdown(
          line.blockNumber,
          nextLvl.mode,
          4,
          nextLvl.waysPerSet
        );
        return {
          ...line,
          tag: newBd.tagBits,
        };
      });

      setCacheProgress(cacheLevelIdx + 1, 0, preservedLines, nextStepCounter);
      triggerHint({
        title: `LEVEL COMPLETE! UNLOCKED: ${nextLvl.title}`,
        message: `${nextLvl.subtitle} (Your existing cache blocks have been carried over!)`,
        type: 'TACTICAL',
      });
    } else {
      setCacheProgress(
        cacheLevelIdx,
        cacheStepIdx,
        updatedLines,
        nextStepCounter
      );
      completeCachePhase();
    }
  };

  return (
    <section className="relative max-w-6xl mx-auto w-full px-4 py-6 font-mono flex flex-col gap-6">
      {isCacheCompleted && (
        <div className="fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-xl w-full p-8 bg-slate-900 border-2 border-emerald-400 rounded-2xl text-center shadow-[0_0_60px_rgba(16,185,129,0.35)]"
          >
            <div className="inline-block px-3 py-1 rounded bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-extrabold uppercase mb-3">
              🔒 PHASE 1 LOCKED &amp; COMPLETED
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
              CACHE SUBSYSTEM STABILIZED
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mb-6 leading-relaxed">
              All 3 Cache Mapping levels are locked in. You must now advance to{' '}
              <strong className="text-emerald-400">Phase 2: Instruction Pipeline Overdrive</strong> to complete your
              system reboot!
            </p>
            <button
              onClick={() => setPhase('PIPELINE')}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-extrabold tracking-wider shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-pointer transition-all"
            >
              PROCEED TO PHASE 2: PIPELINE OVERDRIVE &rarr;
            </button>
          </motion.div>
        </div>
      )}

      <div
        className={`flex flex-col gap-6 transition-all ${
          isCacheCompleted ? 'opacity-25 pointer-events-none grayscale' : ''
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-emerald-500/30 p-4 rounded-xl">
          <div>
            <h1 className="text-base md:text-lg font-extrabold text-white tracking-wide">
              {scenario.title}
            </h1>
            <p className="text-xs text-emerald-400/90 mt-0.5">{scenario.subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            {cacheLevels.map((lvl, idx) => {
              const isCompletedLvl = idx < cacheLevelIdx;
              const isCurrentLvl = idx === cacheLevelIdx;
              return (
                <div
                  key={lvl.level}
                  className={`px-3 py-1.5 rounded text-xs font-bold border select-none flex items-center gap-1.5 ${
                    isCurrentLvl
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : isCompletedLvl
                      ? 'bg-slate-900/60 text-emerald-500/60 border-emerald-500/20'
                      : 'bg-slate-950/60 text-slate-600 border-slate-800'
                  }`}
                >
                  <span>{isCompletedLvl ? '✓' : `LVL ${lvl.level}`}</span>
                </div>
              );
            })}
          </div>
        </div>

        <LiveTelemetryDashboard />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                // MAIN MEMORY STREAM
              </span>
              <span className="text-xs text-slate-400">
                Request {cacheStepIdx + 1} of {scenario.sequence.length}
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

            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider mb-2.5">
                <span>Upcoming CPU Block Request Queue</span>
                <span className="text-emerald-400 font-bold">
                  Active: B{currentBlock}
                </span>
              </div>

              <div className="grid grid-cols-8 gap-1.5">
                {scenario.sequence.map((blk, idx) => {
                  const isPast = idx < cacheStepIdx;
                  const isCurrent = idx === cacheStepIdx;
                  return (
                    <div
                      key={idx}
                      className={`h-8 rounded-md text-xs font-bold border flex items-center justify-center transition-all select-none ${
                        isPast
                          ? 'bg-slate-950/40 border-slate-900 text-slate-600 line-through'
                          : isCurrent
                          ? 'bg-emerald-500 text-slate-950 border-emerald-300 font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      B{blk}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                // L1 CACHE MEMORY (4 LINES — CONTINUOUS STATE)
              </span>
              <span className="text-[11px] text-slate-400">
                Drag Block B{currentBlock} onto a line (or Click a line)
              </span>
            </div>

            <div className="space-y-3">
              {cacheLines.map((line) => (
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

            {lastEventBanner && (
              <motion.div
                key={lastEventBanner.text}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-3 rounded-lg border text-xs font-bold ${
                  lastEventBanner.isError
                    ? 'bg-rose-950/70 border-rose-500 text-rose-200'
                    : 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                }`}
              >
                {lastEventBanner.text}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}