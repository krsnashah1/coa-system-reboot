// src/components/pipeline/PipelineGame.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { sound } from '@/lib/sound';

interface HazardChallenge {
  id: number;
  roundTitle: string;
  badge: string;
  instructions: {
    id: string;
    asm: string;
    stages: string[];
    highlight?: boolean;
  }[];
  problemStatement: string;
  coaConceptNote: string;
  options: {
    label: string;
    subtext: string;
    isOptimal: boolean;
    cpiImpact: number;
    scoreDelta: number;
    feedback: string;
    formula: string;
  }[];
}

const PIPELINE_ROUNDS: HazardChallenge[] = [
  {
    id: 1,
    roundTitle: 'ROUND 01 // DATA DEPENDENCY HAZARD (RAW)',
    badge: 'MODULE 6.2 // DATA HAZARD',
    instructions: [
      { id: 'I1', asm: 'INC [4000H]', stages: ['IF', 'ID', 'AG', 'OF', 'EX', 'WR'], highlight: true },
      { id: 'I2', asm: 'MOV BL, [4000H]', stages: ['  ', 'IF', 'ID', 'AG', 'OF ⚠️', 'EX', 'WR'], highlight: true },
      { id: 'I3', asm: 'ADD AL, BL', stages: ['  ', '  ', 'IF', 'ID', 'AG', 'OF', 'EX', 'WR'] },
    ],
    problemStatement:
      'I2 (MOV BL, [4000H]) reaches Operand Fetch (OF) at Cycle 5 before I1 (INC [4000H]) has finished Writing Back (WR) the incremented value to [4000H] at Cycle 6!',
    coaConceptNote:
      'Data Dependency Hazard (Read-After-Write): Occurs when the destination of one instruction is used as the source operand of the next instruction.',
    options: [
      {
        label: 'ENGAGE OPERAND FORWARDING + NOP BUBBLE',
        subtext: 'Bypass stale memory read by forwarding I1 result & stalling 1 cycle',
        isOptimal: true,
        cpiImpact: 0.0,
        scoreDelta: 250,
        feedback: 'OPTIMAL! You prevented I2 from loading stale data at [4000H] while keeping the pipeline running smoothly.',
        formula: 'RAW Resolved: I1 Execution Output -> I2 Operand Input',
      },
      {
        label: 'FORCE IMMEDIATE SEQUENTIAL READ (NO STALL)',
        subtext: 'Let I2 read [4000H] during Cycle 5 before I1 writes back',
        isOptimal: false,
        cpiImpact: 0.45,
        scoreDelta: -75,
        feedback: 'DATA CORRUPTION FAULT! Register BL received the old, un-incremented value of [4000H]!',
        formula: 'Fault: OF(I2) occurred prior to WR(I1)',
      },
    ],
  },
  {
    id: 2,
    roundTitle: 'ROUND 02 // CONTROL / BRANCH HAZARD',
    badge: 'MODULE 6.2 // CONTROL HAZARD',
    instructions: [
      { id: 'I1', asm: 'JMP Down', stages: ['IF', 'ID', 'EX (Jump!)'], highlight: true },
      { id: 'I2', asm: 'INC BL (Sequential)', stages: ['  ', 'IF ⚠️', 'ID ⚠️', 'FLUSH'], highlight: true },
      { id: 'I3', asm: 'MOV CL, DL (Sequential)', stages: ['  ', '  ', 'IF ⚠️', 'FLUSH'] },
      { id: 'I4', asm: 'Down: DEC CH (Target)', stages: ['  ', '  ', '  ', 'IF', 'ID', 'EX', 'WR'], highlight: true },
    ],
    problemStatement:
      'JMP Down jumps directly to "Down: DEC CH". However, the pipeline already prefetched and decoded sequential instructions INC BL and MOV CL, DL!',
    coaConceptNote:
      'Control Hazard: Unconditional/conditional branches break sequential flow. Solved by flushing wrong-path instructions and using Branch Prediction (Pentium).',
    options: [
      {
        label: 'FLUSH WRONG-PATH FETCHES & ENGAGE BRANCH PREDICTION',
        subtext: 'Discard prefetched INC BL / MOV CL, DL and predict target DEC CH',
        isOptimal: true,
        cpiImpact: 0.05,
        scoreDelta: 250,
        feedback: 'EXCELLENT! Wrong-path instructions were flushed and the Branch Target Buffer locked onto Down: DEC CH.',
        formula: 'Control Hazard Cleared via Pipeline Flush + Branch Prediction',
      },
      {
        label: 'ALLOW PREFETCHED INSTRUCTIONS TO COMPLETE WRITEBACK',
        subtext: 'Let INC BL and MOV CL, DL finish before jumping to Down',
        isOptimal: false,
        cpiImpact: 0.6,
        scoreDelta: -75,
        feedback: 'CONTROL FAULT! Registers BL and CL were illegally overwritten by instructions that should have been skipped!',
        formula: 'Fault: Unflushed Sequential Instructions Executed After Branch',
      },
    ],
  },
  {
    id: 3,
    roundTitle: 'ROUND 03 // PIPELINE SUB-STAGE OPTIMIZATION & BUS HAZARD',
    badge: 'MODULE 6.3 // DR. GOSWAMI MODEL-4 PROBLEM',
    instructions: [
      { id: 'Design A', asm: 'IF(1) | D(1) | EX(4 Cycles)', stages: ['F', 'D', 'E', 'E', 'E', 'E'], highlight: true },
      { id: 'Design B', asm: 'IF(1) | D(1) | Ex1(2) | Ex2(2)', stages: ['F', 'D', 'Ex1', 'Ex1', 'Ex2', 'Ex2'], highlight: true },
    ],
    problemStatement:
      'A 1 GHz processor has IF = 1 cycle, D = 1 cycle, and a bottleneck Execution stage EX = 4 cycles (42 cycles for 10 instructions). How do you optimize this pipeline and prevent structural memory bus collisions?',
    coaConceptNote:
      'From Module 6.3 Model-4: Partitioning a slow 4-cycle Execution stage into two 2-cycle sub-stages (Ex1=2, Ex2=2) cuts 10-instruction execution from 42 cycles to 24 cycles, and Harvard split buses prevent structural fetch/data collisions!',
    options: [
      {
        label: 'SPLIT EX(4) INTO Ex1(2)+Ex2(2) & USE HARVARD SPLIT BUS',
        subtext: 'Reduces inter-instruction delay from 4 to 2 cycles + separate code/data buses',
        isOptimal: true,
        cpiImpact: -0.05,
        scoreDelta: 300,
        feedback: 'MASTER ARCHITECT! Total cycles for 10 instructions dropped from 42 to 24 cycles, and max operating frequency doubled from 0.25 GHz to 0.50 GHz!',
        formula: 'Cycles = 6 + (10 - 1)×2 = 24 Cycles | f_max = 1GHz / 2 = 0.50 GHz',
      },
      {
        label: 'KEEP SINGLE 4-CYCLE EX STAGE & SINGLE SHARED BUS',
        subtext: 'Wait 4 cycles between instructions and stall IF during memory operand access',
        isOptimal: false,
        cpiImpact: 0.5,
        scoreDelta: -75,
        feedback: 'BOTTLENECK FAULT! The 4-cycle stage limits throughput to 42 cycles and causes structural bus hazards.',
        formula: 'Unoptimized = 6 + (10 - 1)×4 = 42 Cycles (f_max = 0.25 GHz)',
      },
    ],
  },
];

export default function PipelineGame() {
  const { cpi, updateCPI, addScore, recordMiss, setPhase } = useGameStore();

  const [roundIdx, setRoundIdx] = useState(0);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    text: string;
    formula: string;
    good: boolean;
  } | null>(null);

  const [numInstructions, setNumInstructions] = useState(10);
  const [ifCycles, setIfCycles] = useState(2);
  const [idCycles, setIdCycles] = useState(1);
  const [exCycles, setExCycles] = useState(3);

  const currentRound = PIPELINE_ROUNDS[roundIdx];

  const singleInstrCycles = ifCycles + idCycles + exCycles;
  const maxStageDiff = Math.max(ifCycles, idCycles, exCycles);
  const nonPipelinedCycles = numInstructions * singleInstrCycles;
  const pipelinedCycles = singleInstrCycles + (numInstructions - 1) * maxStageDiff;
  const speedupRatio = (nonPipelinedCycles / pipelinedCycles).toFixed(2);
  const maxOpFreqGHz = (1 / maxStageDiff).toFixed(2);

  const handleOptionSelect = (option: HazardChallenge['options'][0]) => {
    updateCPI(option.cpiImpact);

    if (option.isOptimal) {
      sound.playHit();
      addScore(option.scoreDelta);
      setFeedbackBanner({
        text: option.feedback,
        formula: option.formula,
        good: true,
      });
    } else {
      sound.playFault();
      recordMiss(option.feedback, option.formula);
      setFeedbackBanner({
        text: option.feedback,
        formula: option.formula,
        good: false,
      });
    }
  };

  const handleNextRound = () => {
    setFeedbackBanner(null);
    if (roundIdx + 1 < PIPELINE_ROUNDS.length) {
      setRoundIdx(roundIdx + 1);
    } else {
      setPhase('LEADERBOARD');
    }
  };

  return (
    <section className="max-w-6xl mx-auto w-full px-4 py-6 font-mono flex flex-col gap-6">
      <div className="bg-slate-900/90 border border-emerald-500/40 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500 text-slate-950 uppercase">
            {currentRound.badge}
          </span>
          <h1 className="text-lg md:text-xl font-extrabold text-white mt-1">
            {currentRound.roundTitle}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-950 px-4 py-2 rounded-lg border border-cyan-500/40 text-right">
            <div className="text-[10px] text-slate-400 uppercase">Processor CPI</div>
            <div className="text-lg font-extrabold text-cyan-300">{cpi.toFixed(2)}</div>
          </div>

          <div className="flex gap-1.5">
            {PIPELINE_ROUNDS.map((r, idx) => (
              <button
                key={r.id}
                onClick={() => {
                  setRoundIdx(idx);
                  setFeedbackBanner(null);
                }}
                className={`px-3 py-1.5 rounded text-xs font-bold border cursor-pointer ${
                  roundIdx === idx
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                R{idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Pipeline Hazard Conveyor */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
              // INSTRUCTION PIPELINE TIMING DIAGRAM
            </div>

            <div className="space-y-2.5 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto">
              {currentRound.instructions.map((inst) => (
                <div key={inst.id} className="flex items-center gap-3 min-w-[460px]">
                  <div
                    className={`w-48 px-2.5 py-1.5 rounded text-xs font-bold border truncate ${
                      inst.highlight
                        ? 'bg-amber-500/15 border-amber-400/50 text-amber-200'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="text-emerald-400 mr-1.5">{inst.id}:</span>
                    {inst.asm}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {inst.stages.map((st, sIdx) => (
                      <motion.div
                        key={sIdx}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: sIdx * 0.05 }}
                        className={`px-2.5 py-1.5 rounded text-xs font-extrabold border text-center min-w-[44px] ${
                          st.trim() === ''
                            ? 'border-transparent text-transparent'
                            : st.includes('⚠️') || st === 'FLUSH'
                            ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                            : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                        }`}
                      >
                        {st}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3.5 rounded-lg bg-rose-950/25 border border-rose-500/40 text-xs text-rose-100 leading-relaxed">
              <strong className="text-rose-400 uppercase block mb-1">
                ⚠️ ACTIVE PIPELINE HAZARD DETECTED:
              </strong>
              {currentRound.problemStatement}
            </div>

            <div className="mt-3 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
              <strong className="text-emerald-400">COA Architecture Note: </strong>
              {currentRound.coaConceptNote}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3">
              {currentRound.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(opt)}
                  className="text-left p-4 rounded-xl bg-slate-950 hover:bg-emerald-950/40 border-2 border-emerald-500/40 hover:border-emerald-400 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-extrabold text-emerald-300 group-hover:text-white">
                      [{idx + 1}] {opt.label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">
                      EXECUTE &rarr;
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{opt.subtext}</p>
                </button>
              ))}
            </div>
          </div>

          {feedbackBanner && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-5 p-4 rounded-xl border-2 ${
                feedbackBanner.good
                  ? 'bg-emerald-950/70 border-emerald-400 text-emerald-100'
                  : 'bg-rose-950/70 border-rose-500 text-rose-100'
              }`}
            >
              <div className="text-xs font-bold leading-relaxed">{feedbackBanner.text}</div>
              <div className="mt-2 p-2 rounded bg-slate-950 text-center text-xs font-extrabold text-amber-300">
                {feedbackBanner.formula}
              </div>
              {feedbackBanner.good && (
                <button
                  onClick={handleNextRound}
                  className="mt-3 w-full py-2.5 rounded-lg bg-emerald-400 text-slate-950 font-extrabold text-xs hover:bg-emerald-300 cursor-pointer"
                >
                  {roundIdx + 1 < PIPELINE_ROUNDS.length
                    ? 'NEXT PIPELINE CHALLENGE →'
                    : 'COMPLETE REBOOT & AUTO-SUBMIT TO LEADERBOARD →'}
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* RIGHT: Module 6.3 Pipeline Calculator */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-emerald-500/30 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
              <span className="text-xs font-bold text-emerald-400 uppercase">
                // MODULE 6.3 PIPELINE LAB SIMULATOR
              </span>
              <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-400/30">
                f_mc = 1 GHz
              </span>
            </div>

            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300">Instructions (N):</span>
                  <span className="font-bold text-emerald-400">{numInstructions}</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={100}
                  value={numInstructions}
                  onChange={(e) => setNumInstructions(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="bg-slate-900 p-2 rounded border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">Fetch (IF)</div>
                  <div className="text-sm font-extrabold text-white my-1">{ifCycles} cyc</div>
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() => setIfCycles(Math.max(1, ifCycles - 1))}
                      className="px-2 bg-slate-800 rounded cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setIfCycles(Math.min(4, ifCycles + 1))}
                      className="px-2 bg-slate-800 rounded cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 p-2 rounded border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">Decode (D)</div>
                  <div className="text-sm font-extrabold text-white my-1">{idCycles} cyc</div>
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() => setIdCycles(Math.max(1, idCycles - 1))}
                      className="px-2 bg-slate-800 rounded cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setIdCycles(Math.min(4, idCycles + 1))}
                      className="px-2 bg-slate-800 rounded cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 p-2 rounded border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">Execute (E)</div>
                  <div className="text-sm font-extrabold text-amber-300 my-1">{exCycles} cyc</div>
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() => setExCycles(Math.max(1, exCycles - 1))}
                      className="px-2 bg-slate-800 rounded cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setExCycles(Math.min(6, exCycles + 1))}
                      className="px-2 bg-slate-800 rounded cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Non-Pipelined</div>
                <div className="text-lg font-extrabold text-rose-400 mt-0.5">
                  {nonPipelinedCycles} <span className="text-[10px]">cyc</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {numInstructions} × {singleInstrCycles}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-emerald-500/40">
                <div className="text-[10px] text-slate-400 uppercase">Pipelined</div>
                <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
                  {pipelinedCycles} <span className="text-[10px]">cyc</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {singleInstrCycles} + ({numInstructions}-1)×{maxStageDiff}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-cyan-500/30">
                <div className="text-[10px] text-slate-400 uppercase">Speedup Ratio</div>
                <div className="text-lg font-extrabold text-cyan-300 mt-0.5">
                  {speedupRatio}x
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-amber-500/30">
                <div className="text-[10px] text-slate-400 uppercase">Max Op Freq</div>
                <div className="text-lg font-extrabold text-amber-300 mt-0.5">
                  {maxOpFreqGHz} GHz
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}