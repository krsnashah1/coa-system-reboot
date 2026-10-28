// src/store/gameStore.ts
import { create } from 'zustand';

export type GamePhase = 'CACHE' | 'PIPELINE' | 'LEADERBOARD';
export type CacheMappingMode = 'DIRECT' | 'ASSOCIATIVE' | 'SET_ASSOCIATIVE';

interface HintData {
  title: string;
  message: string;
  formula?: string;
  type: 'ERROR' | 'TACTICAL';
}

interface GameState {
  playerName: string;
  playerRegNo: string;
  hasRegistered: boolean;

  elapsedSeconds: number;
  isTimerRunning: boolean;

  phase: GamePhase;
  isCacheCompleted: boolean;
  isPipelineCompleted: boolean;
  level: number;
  mappingMode: CacheMappingMode;
  score: number;
  streak: number;

  hits: number;
  misses: number;
  cpi: number;

  activeBlockAddress: number | null;
  totalCacheLines: number;
  waysPerSet: number;

  isTutorialOpen: boolean;
  tutorialStep: number;
  isLeaderboardModalOpen: boolean;
  activeHint: HintData | null;
  isGlitching: boolean;

  setPlayerInfo: (name: string, regNo: string) => void;
  tickTimer: () => void;
  stopTimer: () => void;
  setPhase: (phase: GamePhase) => void;
  completeCachePhase: () => void;
  completePipelinePhase: () => void;
  setLevelConfig: (level: number, mode: CacheMappingMode, lines: number, ways?: number) => void;
  setActiveBlock: (address: number | null) => void;

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
    const { phase, level, activeBlockAddress, totalCacheLines } = get();

    if (phase === 'CACHE') {
      if (level === 1) {
        const exampleBlock = activeBlockAddress ?? 4;
        const targetLine = exampleBlock % totalCacheLines;
        set({
          activeHint: {
            title: 'TACTICAL HINT // LVL 1: DIRECT MAPPING',
            message: `Divide Block #${exampleBlock} by ${totalCacheLines} total cache lines. The remainder is the ONLY line where this block can go!`,
            formula: `Line = ${exampleBlock} mod ${totalCacheLines} = CACHE LINE ${targetLine}`,
            type: 'TACTICAL',
          },
        });
      } else if (level === 2) {
        set({
          activeHint: {
            title: 'TACTICAL HINT // LVL 2: MEMORY HIERARCHY PYRAMID',
            message:
              'Order from TOP (Fastest Access Time & Highest Cost/Bit) to BOTTOM (Largest Capacity & Slowest Access): L0 = CPU Registers -> L1 = Cache (SRAM) -> L2 = Main Memory (DRAM) -> L3 = Magnetic Disk -> L4 = Magnetic Tape!',
            formula: 'Top-to-Bottom: Registers < SRAM < DRAM < Disk < Tape',
            type: 'TACTICAL',
          },
        });
      } else {
        set({
          activeHint: {
            title: 'TACTICAL HINT // LVL 3: PA BIT SPLIT & 3Cs MISSES',
            message:
              '1) Offset Bits = log2(Block Size). 2) Cache Lines = Cache Size / Block Size. 3) Sets = Lines / k-Way -> Set Bits = log2(Sets). 4) Tag Bits = Total PA Bits - Set Bits - Offset Bits!',
            formula: 'PA Bits = Tag Bits + Set Index Bits + Word Offset Bits',
            type: 'TACTICAL',
          },
        });
      }
    } else {
      set({
        activeHint: {
          title: 'TACTICAL HINT // PIPELINE TIMING METHODS',
          message:
            'Check the Question Banner! For NON-PIPELINED (Non-Overlapping), I2 starts only AFTER I1 finishes E (Cycles = N × C1). For PIPELINED (Overlapping), I2 starts after Δ = max(IF, D, E) cycles!',
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
      activeHint: null,
    })),
}));