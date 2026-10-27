// src/components/ui/TutorialOverlay.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

const WALKTHROUGH_STEPS = [
  {
    id: 0,
    tag: '01 // BRIEFING',
    title: 'Welcome, System Technician',
    subtitle: 'Understanding the Memory Hierarchy & Reboot Sequence',
    content: (
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <p>
          The central processor is stalling because its <strong className="text-emerald-400">Cache Memory</strong> and{' '}
          <strong className="text-emerald-400">Instruction Pipeline</strong> are desynchronized. Your job is to manually
          route memory blocks and prevent pipeline hazards until the system stabilizes.
        </p>
        <div className="grid grid-cols-3 gap-3 bg-slate-900/90 p-3 rounded-lg border border-emerald-500/30 text-center">
          <div className="p-2 bg-emerald-950/40 rounded border border-emerald-500/20">
            <div className="text-xs text-emerald-400 font-bold">CPU REGISTERS</div>
            <div className="text-[11px] text-slate-400 mt-1">Fastest (~0.5ns)</div>
            <div className="text-[10px] text-emerald-500">Smallest Size</div>
          </div>
          <div className="p-2 bg-amber-950/40 rounded border border-amber-500/30">
            <div className="text-xs text-amber-300 font-bold">CACHE (SRAM)</div>
            <div className="text-[11px] text-slate-400 mt-1">Fast (~2-10ns)</div>
            <div className="text-[10px] text-amber-400">Your Workspace!</div>
          </div>
          <div className="p-2 bg-cyan-950/40 rounded border border-cyan-500/20">
            <div className="text-xs text-cyan-300 font-bold">MAIN RAM (DRAM)</div>
            <div className="text-[11px] text-slate-400 mt-1">Slow (~100ns)</div>
            <div className="text-[10px] text-cyan-400">Large Capacity</div>
          </div>
        </div>
        <p className="text-xs text-emerald-300/90 bg-emerald-950/30 p-3 rounded border-l-2 border-emerald-400">
          <strong>Core Goal:</strong> Keep frequently requested data inside the Cache so the CPU gets a{' '}
          <strong>Cache Hit</strong> instead of waiting on slow Main Memory!
        </p>
      </div>
    ),
  },
  {
    id: 1,
    tag: '02 // DIRECT MAP',
    title: 'Level 1: Direct Mapping Protocol',
    subtitle: 'One-to-One Modulo Routing',
    content: (
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <p>
          In <strong className="text-emerald-400">Direct Mapping</strong>, every block from Main Memory can only be
          placed into <strong>one specific Cache Line</strong>.
        </p>
        <div className="bg-slate-900 p-4 rounded-lg border border-emerald-500/40 font-mono text-center">
          <div className="text-xs text-slate-400 uppercase mb-1">The Golden Formula</div>
          <div className="text-lg text-emerald-300 font-bold">
            Cache Line = (Block Address) modulo (Total Cache Lines)
          </div>
        </div>
        <div className="space-y-2 text-xs bg-slate-900/60 p-3 rounded border border-slate-800">
          <div className="font-bold text-amber-300">Interactive Example (4 Cache Lines: 0, 1, 2, 3):</div>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li>
              Incoming <strong className="text-white">Block 4</strong> &rarr; <code>4 mod 4 = 0</code> &rarr; Drop into{' '}
              <strong className="text-emerald-400">Line 0</strong>.
            </li>
            <li>
              Incoming <strong className="text-white">Block 7</strong> &rarr; <code>7 mod 4 = 3</code> &rarr; Drop into{' '}
              <strong className="text-emerald-400">Line 3</strong>.
            </li>
            <li>
              <strong className="text-rose-400">Conflict Miss (Thrashing):</strong> If Block 8 arrives next,{' '}
              <code>8 mod 4 = 0</code>. You must overwrite Block 4 in Line 0, even if Lines 1 and 2 are empty!
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    tag: '03 // ASSOCIATIVE',
    title: 'Levels 2 & 3: Associative & Set-Associative',
    subtitle: 'Eliminating Thrashing with Flexibility & LRU',
    content: (
      <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
        <div className="p-3 bg-slate-900/80 rounded border border-cyan-500/30">
          <h4 className="font-bold text-cyan-300 text-xs uppercase tracking-wider">
            Fully Associative Mapping (Level 2)
          </h4>
          <p className="text-xs mt-1">
            Any Main Memory block can go into <strong>ANY cache line</strong>! Hardware comparators check all tags in
            parallel. When full, evict the <strong>LRU (Least Recently Used)</strong> line—the block that hasn&apos;t
            been accessed for the longest time.
          </p>
        </div>

        <div className="p-3 bg-slate-900/80 rounded border border-amber-500/30">
          <h4 className="font-bold text-amber-300 text-xs uppercase tracking-wider">
            k-Way Set-Associative Mapping (Level 3)
          </h4>
          <p className="text-xs mt-1">
            The best of both worlds! The cache is divided into <strong>Sets</strong> (each holding 2 lines).
          </p>
          <div className="mt-2 bg-slate-950 p-2 rounded text-center font-mono text-xs text-amber-200">
            Target Set = (Block Address) mod (Total Sets)
          </div>
          <p className="text-xs mt-1 text-slate-400">
            Once you find the right Set, you can place the block into <em>either</em> free line inside that Set!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    tag: '04 // PIPELINE',
    title: 'Phase 2: Instruction Level Pipelining',
    subtitle: 'Overlapping Fetch, Decode, Execute & Writeback',
    content: (
      <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
        <p className="text-xs">
          Pipelining overlaps instruction stages like an assembly line to keep the{' '}
          <strong className="text-emerald-400">CPI (Cycles Per Instruction)</strong> close to 1.0. Watch out for
          hazards!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-rose-950/30 border border-rose-500/40 rounded">
            <div className="font-bold text-rose-300">1. Data Hazard (RAW)</div>
            <p className="mt-1 text-slate-300">
              Instruction 2 needs a register value that Instruction 1 hasn&apos;t finished calculating yet (e.g.,{' '}
              <code>ADD R1, R2</code> followed immediately by <code>SUB R3, R1</code>).
            </p>
            <div className="mt-2 text-emerald-300 font-bold">
              Fix: Enable Operand Forwarding or inject a NOP Bubble!
            </div>
          </div>
          <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded">
            <div className="font-bold text-amber-300">2. Control Hazard (Branch)</div>
            <p className="mt-1 text-slate-300">
              A <code>JMP</code> or <code>BEQ</code> instruction alters sequential flow, invalidating instructions
              fetched after it.
            </p>
            <div className="mt-2 text-emerald-300 font-bold">
              Fix: Flush the pipeline or engage Branch Prediction!
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function TutorialOverlay() {
  const { isTutorialOpen, tutorialStep, setTutorialStep, closeTutorial } = useGameStore();

  if (!isTutorialOpen) return null;

  const currentStep = WALKTHROUGH_STEPS[tutorialStep] || WALKTHROUGH_STEPS[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 font-mono"
      >
        <motion.div
          initial={{ scale: 0.92, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 20 }}
          className="w-full max-w-2xl bg-slate-900 border-2 border-emerald-500/60 rounded-xl shadow-[0_0_50px_rgba(16,185,129,0.25)] overflow-hidden"
        >
          {/* Top Terminal Bar */}
          <div className="bg-slate-950 px-5 py-3 border-b border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
                COA FIELD MANUAL // INTERACTIVE WALKTHROUGH
              </span>
            </div>
            <button
              onClick={closeTutorial}
              className="text-xs text-slate-400 hover:text-rose-400 font-bold px-2 py-0.5 rounded border border-transparent hover:border-rose-500/40 transition-colors cursor-pointer"
            >
              [ESC / CLOSE]
            </button>
          </div>

          {/* Step Navigation Tabs */}
          <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950/50">
            {WALKTHROUGH_STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setTutorialStep(index)}
                className={`py-2.5 px-2 text-[10px] md:text-xs font-bold tracking-wider border-b-2 transition-all cursor-pointer ${
                  tutorialStep === index
                    ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {step.tag}
              </button>
            ))}
          </div>

          {/* Step Body */}
          <div className="p-6 min-h-[290px] flex flex-col justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-white tracking-wide">
                {currentStep.title}
              </h2>
              <p className="text-xs text-emerald-400/80 mb-4">{currentStep.subtitle}</p>
              {currentStep.content}
            </div>

            {/* Footer Controls */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setTutorialStep(Math.max(0, tutorialStep - 1))}
                disabled={tutorialStep === 0}
                className="px-4 py-2 rounded text-xs font-bold border border-slate-700 text-slate-300 disabled:opacity-30 hover:border-emerald-500/50 cursor-pointer disabled:cursor-not-allowed"
              >
                &larr; PREV
              </button>

              <div className="text-xs text-slate-500">
                STEP {tutorialStep + 1} OF {WALKTHROUGH_STEPS.length}
              </div>

              {tutorialStep < WALKTHROUGH_STEPS.length - 1 ? (
                <button
                  onClick={() => setTutorialStep(tutorialStep + 1)}
                  className="px-5 py-2 rounded text-xs font-bold bg-emerald-500/20 border border-emerald-400 text-emerald-300 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer"
                >
                  NEXT &rarr;
                </button>
              ) : (
                <button
                  onClick={closeTutorial}
                  className="px-6 py-2 rounded text-xs font-extrabold bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer"
                >
                  INITIALIZE SYSTEM &rarr;
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}