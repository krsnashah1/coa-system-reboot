const WALKTHROUGH_STEPS = [
  {
    id: 0,
    tag: '01 // BRIEFING',
    title: 'Welcome, System Technician',
    subtitle: 'Understanding the Memory Hierarchy & Reboot Sequence',
    content: (
      <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
        <p className="text-xs md:text-sm">
          The central processor is stalling because its <strong className="text-emerald-400">Memory Subsystem</strong> and{' '}
          <strong className="text-emerald-400">Instruction Pipeline</strong> are desynchronized. Complete the 2 Memory
          levels and the Pipeline Overdrive challenges as fast as possible!
        </p>
        <div className="grid grid-cols-3 gap-2.5 bg-slate-950 p-3 rounded-lg border border-emerald-500/30 text-center">
          <div className="p-2 bg-emerald-950/40 rounded border border-emerald-500/20">
            <div className="text-xs text-emerald-400 font-bold">CPU REGISTERS</div>
            <div className="text-[10px] text-slate-400 mt-1">Fastest (~0.5ns)</div>
          </div>
          <div className="p-2 bg-amber-950/40 rounded border border-amber-500/30">
            <div className="text-xs text-amber-300 font-bold">CACHE (SRAM)</div>
            <div className="text-[10px] text-amber-400 mt-1">Fast (~2–25ns)</div>
          </div>
          <div className="p-2 bg-cyan-950/40 rounded border border-cyan-500/20">
            <div className="text-xs text-cyan-300 font-bold">MAIN RAM (DRAM)</div>
            <div className="text-[10px] text-slate-400 mt-1">Slow (~100ns)</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 1,
    tag: '02 // DIRECT MAP',
    title: 'Level 1: Direct Mapping Protocol',
    subtitle: 'One-to-One Modulo Routing',
    content: (
      <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
        <p className="text-xs md:text-sm">
          In <strong className="text-emerald-400">Direct Mapping</strong>, every block from Main Memory can only be
          placed into <strong>one specific Cache Line</strong>:
        </p>
        <div className="bg-slate-950 p-3 rounded-lg border border-emerald-500/40 font-mono text-center">
          <div className="text-base text-emerald-300 font-bold">
            Cache Line = (Block Address) mod 4
          </div>
        </div>
        <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 bg-slate-950/60 p-3 rounded border border-slate-800">
          <li>
            Incoming <strong className="text-white">Block 4</strong> &rarr; <code>4 mod 4 = 0</code> &rarr; Drop into{' '}
            <strong className="text-emerald-400">Line 0</strong>.
          </li>
          <li>
            Incoming <strong className="text-white">Block 7</strong> &rarr; <code>7 mod 4 = 3</code> &rarr; Drop into{' '}
            <strong className="text-emerald-400">Line 3</strong>.
          </li>
          <li>
            <strong className="text-amber-300">Cache Hit:</strong> If a block is <em>already</em> in a line, click that
            line to score an instant Cache Hit!
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 2,
    tag: '03 // HIERARCHY',
    title: 'Level 2: Memory Hierarchy Pyramid',
    subtitle: 'Balancing Speed, Capacity, and Cost Per Bit',
    content: (
      <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
        <div className="p-3 bg-slate-950 rounded border border-cyan-500/30">
          <h4 className="font-bold text-cyan-300 uppercase">Top to Bottom Trade-offs</h4>
          <p className="mt-1">
            As you move <strong>down</strong> the pyramid (from Level 0 to Level 4), <strong>Capacity increases</strong>{' '}
            and <strong>Cost per bit decreases</strong>, while <strong>Access Time becomes slower</strong>.
          </p>
        </div>
        <div className="p-3 bg-slate-950 rounded border border-amber-500/30">
          <h4 className="font-bold text-amber-300 uppercase">The 5 Hierarchy Levels (L0 &rarr; L4)</h4>
          <p className="mt-1">
            <strong>L0:</strong> CPU Registers (0.25–0.5ns) &rarr; <strong>L1:</strong> Cache SRAM (0.5–25ns) &rarr;{' '}
            <strong>L2:</strong> Main Memory DRAM (80–250ns) &rarr; <strong>L3:</strong> Magnetic Disk (~5ms) &rarr;{' '}
            <strong>L4:</strong> Magnetic Tape (Archival).
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    tag: '04 // PIPELINE',
    title: 'Phase 2: Instruction Level Pipelining',
    subtitle: 'Non-Pipelined vs. Pipelined Execution & Hazards',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
        <div className="p-3 bg-cyan-950/30 border border-cyan-500/40 rounded">
          <div className="font-bold text-cyan-300">1. Non-Pipelined vs. Pipelined</div>
          <p className="mt-1">
            <strong>Non-Pipelined:</strong> I2 starts only after I1 finishes E (<code>Cycles = N × C1</code>).
            <br />
            <strong>Pipelined:</strong> Instructions overlap by <code>Δ = max(IF, D, E)</code> (
            <code>Cycles = C1 + (N - 1) × Δ</code>).
          </p>
        </div>
        <div className="p-3 bg-rose-950/30 border border-rose-500/40 rounded">
          <div className="font-bold text-rose-300">2. Data &amp; Control Hazards</div>
          <p className="mt-1">
            Use <strong>Operand Forwarding / NOP Bubbles</strong> for Read-After-Write (RAW) Data Hazards, and{' '}
            <strong>Pipeline Flush + Branch Prediction</strong> for Jump/Branch Control Hazards!
          </p>
        </div>
      </div>
    ),
  },
];