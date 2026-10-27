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
  // Progression & Scoring
  phase: GamePhase;
  level: number;
  mappingMode: CacheMappingMode;
  score: number;
  streak: number;

  // Telemetry Metrics
  hits: number;
  misses: number;
  cpi: number;

  // Active Game Context (used for smart hints)
  activeBlockAddress: number | null;
  totalCacheLines: number;
  waysPerSet: number;

  // UI Overlays
  isTutorialOpen: boolean;
  tutorialStep: number;
  activeHint: HintData | null;
  isGlitching: boolean;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setLevelConfig: (level: number, mode: CacheMappingMode, lines: number, ways?: number) => void;
  setActiveBlock: (address: number | null) => void;
  addScore: (points: number) => void;
  recordHit: () => void;
  recordMiss: (reason: string, formula?: string) => void;
  updateCPI: (delta: number) => void;

  // Tutorial & Hint Actions
  openTutorial: (step?: number) => void;
  closeTutorial: () => void;
  setTutorialStep: (step: number) => void;
  triggerHint: (hint: HintData) => void;
  requestTacticalHint: () => void;
  clearHint: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'CACHE',
  level: 1,
  mappingMode: 'DIRECT',
  score: 0,
  streak: 0,

  hits: 0,
  misses: 0,
  cpi: 1.0,

  activeBlockAddress: null,
  totalCacheLines: 4,
  waysPerSet: 2,

  isTutorialOpen: true, // Opens automatically on first launch
  tutorialStep: 0,
  activeHint: null,
  isGlitching: false,

  setPhase: (phase) => set({ phase }),

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
        title: 'CACHE MISS // MAPPING FAULT',
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
  closeTutorial: () => set({ isTutorialOpen: false }),
  setTutorialStep: (step) => set({ tutorialStep: step }),

  triggerHint: (hint) => set({ activeHint: hint }),

  requestTacticalHint: () => {
    const { phase, mappingMode, activeBlockAddress, totalCacheLines, waysPerSet } = get();

    if (phase === 'CACHE') {
      if (mappingMode === 'DIRECT') {
        const exampleBlock = activeBlockAddress ?? 6;
        const targetLine = exampleBlock % totalCacheLines;
        set({
          activeHint: {
            title: 'TACTICAL HINT // DIRECT MAPPING',
            message:
              activeBlockAddress !== null
                ? `Take Block ${activeBlockAddress} and divide by total cache lines (${totalCacheLines}). The remainder is your target line!`
                : `In Direct Mapping, each main memory block maps to exactly one cache line using the modulo operator.`,
            formula: `Line = Block ${exampleBlock} mod ${totalCacheLines} = Line ${targetLine}`,
            type: 'TACTICAL',
          },
        });
      } else if (mappingMode === 'ASSOCIATIVE') {
        set({
          activeHint: {
            title: 'TACTICAL HINT // FULLY ASSOCIATIVE',
            message:
              'Any block can go into ANY available cache line! If the cache is full, overwrite the line at the top of the LRU (Least Recently Used) queue.',
            formula: 'Target = Any Free Line | Full = Evict Oldest (LRU)',
            type: 'TACTICAL',
          },
        });
      } else {
        const totalSets = totalCacheLines / waysPerSet;
        const exampleBlock = activeBlockAddress ?? 5;
        const targetSet = exampleBlock % totalSets;
        set({
          activeHint: {
            title: 'TACTICAL HINT // SET-ASSOCIATIVE',
            message: `First find the correct Set using modulo (${totalSets} sets total). Then drop the block into ANY free line inside Set ${targetSet}.`,
            formula: `Set = Block ${exampleBlock} mod ${totalSets} = Set ${targetSet}`,
            type: 'TACTICAL',
          },
        });
      }
    } else if (phase === 'PIPELINE') {
      set({
        activeHint: {
          title: 'TACTICAL HINT // PIPELINE HAZARDS',
          message:
            'Watch the source and destination registers! If Instruction 2 reads a register that Instruction 1 is still writing to, trigger Forwarding or insert a NOP bubble.',
          formula: 'RAW Hazard: I2 Source == I1 Destination',
          type: 'TACTICAL',
        },
      });
    }
  },

  clearHint: () => set({ activeHint: null }),

  resetGame: () =>
    set({
      score: 0,
      streak: 0,
      hits: 0,
      misses: 0,
      cpi: 1.0,
      level: 1,
      mappingMode: 'DIRECT',
      activeHint: null,
    }),
}));