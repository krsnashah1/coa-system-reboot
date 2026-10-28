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
  // Player Identity
  playerName: string;
  playerRegNo: string;
  hasRegistered: boolean;

  // Progression & Locks
  phase: GamePhase;
  isCacheCompleted: boolean;
  isPipelineCompleted: boolean;
  level: number;
  mappingMode: CacheMappingMode;
  score: number;
  streak: number;

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
  activeHint: HintData | null;
  isGlitching: boolean;

  // Actions
  setPlayerInfo: (name: string, regNo: string) => void;
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
  triggerHint: (hint: HintData) => void;
  requestTacticalHint: () => void;
  clearHint: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  playerName: '',
  playerRegNo: '',
  hasRegistered: false,

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
  activeHint: null,
  isGlitching: false,

  setPlayerInfo: (name, regNo) =>
    set({
      playerName: name.trim().toUpperCase(),
      playerRegNo: (regNo.trim() || 'VIT-AP').toUpperCase(),
      hasRegistered: true,
    }),

  setPhase: (phase) => {
    const { isCacheCompleted, isPipelineCompleted } = get();
    // Prevent returning to a locked/completed phase
    if (phase === 'CACHE' && isCacheCompleted) return;
    if (phase === 'PIPELINE' && isPipelineCompleted) return;
    set({ phase });
  },

  completeCachePhase: () => set({ isCacheCompleted: true }),
  completePipelinePhase: () => set({ isPipelineCompleted: true }),

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
  closeTutorial: () => set({ isTutorialOpen: false }),
  setTutorialStep: (step) => set({ tutorialStep: step }),

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
            title: 'TACTICAL HINT // FULLY ASSOCIATIVE',
            message:
              'Place the block in ANY empty cache line (V:0). Once all 4 lines are full, overwrite the line marked "LRU (OLDEST)"!',
            formula: 'Empty Available -> Any Free Line | Full -> Evict LRU Line',
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
            message: `Block #${exampleBlock} maps to Set ${targetSet} (Lines ${targetSet * 2} & ${targetSet * 2 + 1}). Fill empty ways in Set ${targetSet} first, or evict Set ${targetSet}'s LRU line!`,
            formula: `Set = ${exampleBlock} mod ${totalSets} = SET ${targetSet}`,
            type: 'TACTICAL',
          },
        });
      }
    } else {
      set({
        activeHint: {
          title: 'TACTICAL HINT // PIPELINE TIMING & HAZARDS',
          message:
            'In diagram questions, shift each instruction right until no execution stages (E) overlap in the same column! Then use Total Cycles = First_Instr_Cycles + (N - 1) × Max_Stage_Cycles.',
          formula: 'Cycles = C1 + (N - 1) × Δ | f_max = f_mc / Δ',
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
      isCacheCompleted: false,
      isPipelineCompleted: false,
      activeHint: null,
    }),
}));