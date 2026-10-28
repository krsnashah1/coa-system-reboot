// src/store/gameStore.ts
import { create } from 'zustand';
import { CacheLineState } from '@/lib/mapping';

export type GamePhase = 'CACHE' | 'PIPELINE' | 'LEADERBOARD';
export type CacheMappingMode = 'DIRECT' | 'ASSOCIATIVE' | 'SET_ASSOCIATIVE';

interface HintData {
  title: string;
  message: string;
  formula?: string;
  type: 'ERROR' | 'TACTICAL';
}

export interface CacheLevelScenario {
  level: number;
  mode: CacheMappingMode;
  title: string;
  subtitle: string;
  sequence: number[];
  waysPerSet: number;
}

const INITIAL_CACHE_LINES: CacheLineState[] = [0, 1, 2, 3].map((idx) => ({
  lineIndex: idx,
  valid: false,
  tag: '',
  blockNumber: null,
  dataHex: null,
  lastUsedStep: 0,
}));

interface GameState {
  // Player Identity
  playerName: string;
  playerRegNo: string;
  hasRegistered: boolean;

  // Stopwatch / Timer
  elapsedSeconds: number;
  isTimerRunning: boolean;

  // Progression & Locks
  phase: GamePhase;
  isCacheCompleted: boolean;
  isPipelineCompleted: boolean;
  level: number;
  mappingMode: CacheMappingMode;
  score: number;
  streak: number;

  // Persistent Cache Progress (So Levels 2 & 3 keep blocks from Level 1!)
  cacheLevels: CacheLevelScenario[];
  cacheLevelIdx: number;
  cacheStepIdx: number;
  cacheLines: CacheLineState[];
  cacheStepCounter: number;

  // Telemetry Metrics
  hits: number;
  misses: number;
  cpi: number;

  // Active Game Context
  activeBlockAddress: number | null;
  totalCacheLines: number;
  waysPerSet: number;

  // UI Overlays
  isTutorialOpen: boolean;
  tutorialStep: number;
  isLeaderboardModalOpen: boolean;
  activeHint: HintData | null;
  isGlitching: boolean;

  // Actions
  setPlayerInfo: (name: string, regNo: string) => void;
  tickTimer: () => void;
  stopTimer: () => void;
  setPhase: (phase: GamePhase) => void;
  completeCachePhase: () => void;
  completePipelinePhase: () => void;
  setLevelConfig: (level: number, mode: CacheMappingMode, lines: number, ways?: number) => void;
  setActiveBlock: (address: number | null) => void;

  // Persistent Cache Actions
  initCacheLevels: (levels: CacheLevelScenario[]) => void;
  setCacheProgress: (
    levelIdx: number,
    stepIdx: number,
    lines: CacheLineState[],
    stepCounter: number
  ) => void;

  addScore: (points: number) => void;
  recordHit: () => void;
  recordMiss: (reason: string, formula?: string) => void;
  updateCPI: (delta: number) => void;

  openTutorial: (step?: number) => void;
  closeTutorial: () => void;
  setTutorialStep: (step: number) => void;
  openLeaderboardModal: () => void;
  closeLeaderboardModal: () => void;
  triggerHint: (hint: HintData) => void;
  requestTacticalHint: () => void;
  clearHint: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  playerName: '',
  playerRegNo: '',
  hasRegistered: false,

  elapsedSeconds: 0,
  isTimerRunning: false,

  phase: 'CACHE',
  isCacheCompleted: false,
  isPipelineCompleted: false,
  level: 1,
  mappingMode: 'DIRECT',
  score: 0,
  streak: 0,

  cacheLevels: [],
  cacheLevelIdx: 0,
  cacheStepIdx: 0,
  cacheLines: INITIAL_CACHE_LINES,
  cacheStepCounter: 1,

  hits: 0,
  misses: 0,
  cpi: 1.0,

  activeBlockAddress: null,
  totalCacheLines: 4,
  waysPerSet: 1,

  isTutorialOpen: true,
  tutorialStep: 0,
  isLeaderboardModalOpen: false,
  activeHint: null,
  isGlitching: false,

  setPlayerInfo: (name, regNo) =>
    set({
      playerName: name.trim().toUpperCase(),
      playerRegNo: (regNo.trim() || 'VIT-AP').toUpperCase(),
      hasRegistered: true,
      isTimerRunning: true,
    }),

  tickTimer: () =>
    set((state) => ({
      elapsedSeconds: state.isTimerRunning
        ? state.elapsedSeconds + 1
        : state.elapsedSeconds,
    })),

  stopTimer: () => set({ isTimerRunning: false }),

  setPhase: (phase) => {
    const { isCacheCompleted, isPipelineCompleted } = get();
    if (phase === 'CACHE' && isCacheCompleted) return;
    if (phase === 'PIPELINE' && isPipelineCompleted) return;
    set({ phase });
  },

  completeCachePhase: () => set({ isCacheCompleted: true }),
  completePipelinePhase: () =>
    set({ isPipelineCompleted: true, isTimerRunning: false }),

  setLevelConfig: (level, mappingMode, totalCacheLines, waysPerSet = 1) =>
    set({ level, mappingMode, totalCacheLines, waysPerSet }),

  setActiveBlock: (address) => set({ activeBlockAddress: address }),

  initCacheLevels: (levels) =>
    set((state) =>
      state.cacheLevels.length > 0 ? state : { cacheLevels: levels }
    ),

  setCacheProgress: (cacheLevelIdx, cacheStepIdx, cacheLines, cacheStepCounter) =>
    set({ cacheLevelIdx, cacheStepIdx, cacheLines, cacheStepCounter }),

  addScore: (points) =>
    set((state) => ({
      score: Math.max(0, state.score + points),
    })),

  recordHit: () =>
    set((state) => {
      const newStreak = state.streak + 1;
      const bonus = 100 + newStreak * 25;
      return {
        hits: state.hits + 1,
        streak: newStreak,
        score: state.score + bonus,
        activeHint: null,
      };
    }),

  recordMiss: (reason, formula) => {
    set((state) => ({
      misses: state.misses + 1,
      streak: 0,
      score: Math.max(0, state.score - 50),
      isGlitching: true,
      activeHint: {
        title: 'SYSTEM FAULT // PENALTY -50 PTS',
        message: reason,
        formula,
        type: 'ERROR',
      },
    }));
    setTimeout(() => set({ isGlitching: false }), 500);
  },

  updateCPI: (delta) =>
    set((state) => ({
      cpi: Number(Math.max(1.0, state.cpi + delta).toFixed(2)),
    })),

  openTutorial: (step = 0) => set({ isTutorialOpen: true, tutorialStep: step }),
  closeTutorial: () =>
    set((state) => ({
      isTutorialOpen: false,
      isTimerRunning: state.hasRegistered && !state.isPipelineCompleted,
    })),
  setTutorialStep: (step) => set({ tutorialStep: step }),

  openLeaderboardModal: () => set({ isLeaderboardModalOpen: true }),
  closeLeaderboardModal: () => set({ isLeaderboardModalOpen: false }),

  triggerHint: (hint) => set({ activeHint: hint }),

  requestTacticalHint: () => {
    const { phase, mappingMode, activeBlockAddress, totalCacheLines, waysPerSet } = get();

    if (phase === 'CACHE') {
      if (mappingMode === 'DIRECT') {
        const exampleBlock = activeBlockAddress ?? 4;
        const targetLine = exampleBlock % totalCacheLines;
        set({
          activeHint: {
            title: 'TACTICAL HINT // DIRECT MAPPING',
            message: `Divide Block #${exampleBlock} by ${totalCacheLines} total cache lines. The remainder is the ONLY line where this block can go!`,
            formula: `Line = ${exampleBlock} mod ${totalCacheLines} = CACHE LINE ${targetLine}`,
            type: 'TACTICAL',
          },
        });
      } else if (mappingMode === 'ASSOCIATIVE') {
        set({
          activeHint: {
            title: 'TACTICAL HINT // FULLY ASSOCIATIVE + LRU',
            message:
              'If the requested block is already in a line, click it for a Hit! Otherwise, use any empty line (V:0), or overwrite the line marked "LRU (OLDEST)"!',
            formula: 'Hit -> Click Matching Line | Full -> Evict LRU (OLDEST)',
            type: 'TACTICAL',
          },
        });
      } else {
        const totalSets = totalCacheLines / waysPerSet;
        const exampleBlock = activeBlockAddress ?? 2;
        const targetSet = exampleBlock % totalSets;
        set({
          activeHint: {
            title: 'TACTICAL HINT // 2-WAY SET-ASSOCIATIVE',
            message: `Block #${exampleBlock} maps to Set ${targetSet} (Lines ${targetSet * 2} & ${targetSet * 2 + 1}). Use an empty line in Set ${targetSet} first, or evict Set ${targetSet}'s LRU (OLDEST) line!`,
            formula: `Set = ${exampleBlock} mod ${totalSets} = SET ${targetSet}`,
            type: 'TACTICAL',
          },
        });
      }
    } else {
      set({
        activeHint: {
          title: 'TACTICAL HINT // PIPELINE TIMING METHODS',
          message:
            'Check the Question Badge! For NON-PIPELINED (Non-Overlapping), I2 starts only AFTER I1 finishes E (Cycles = N × C1). For PIPELINED (Overlapping), I2 starts after Δ = max(IF, D, E) cycles!',
          formula: 'Non-Pipe = N × C1 | Pipelined = C1 + (N - 1) × Δ',
          type: 'TACTICAL',
        },
      });
    }
  },

  clearHint: () => set({ activeHint: null }),

  resetGame: () =>
    set((state) => ({
      score: 0,
      streak: 0,
      hits: 0,
      misses: 0,
      cpi: 1.0,
      level: 1,
      mappingMode: 'DIRECT',
      isCacheCompleted: false,
      isPipelineCompleted: false,
      elapsedSeconds: 0,
      isTimerRunning: state.hasRegistered,
      cacheLevels: [],
      cacheLevelIdx: 0,
      cacheStepIdx: 0,
      cacheLines: INITIAL_CACHE_LINES,
      cacheStepCounter: 1,
      activeHint: null,
    })),
}));