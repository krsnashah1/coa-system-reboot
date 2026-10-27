// src/app/api/leaderboard/route.ts
import { NextResponse } from 'next/server';

export interface LeaderboardEntry {
  id: string;
  name: string;
  regNo: string;
  score: number;
  hitRatio: number;
  cpi: number;
  timestamp: number;
}

// Global in-memory store so scores persist across requests during your live class presentation
const globalForLeaderboard = globalThis as unknown as {
  coaLeaderboard?: LeaderboardEntry[];
};

if (!globalForLeaderboard.coaLeaderboard) {
  globalForLeaderboard.coaLeaderboard = [
    {
      id: 'seed-1',
      name: 'KRSNA',
      regNo: '24BCE',
      score: 1450,
      hitRatio: 92.5,
      cpi: 1.05,
      timestamp: Date.now() - 360000,
    },
    {
      id: 'seed-2',
      name: 'ARJUN',
      regNo: '24BCE',
      score: 1225,
      hitRatio: 88.0,
      cpi: 1.15,
      timestamp: Date.now() - 240000,
    },
    {
      id: 'seed-3',
      name: 'SAI',
      regNo: '24BCE',
      score: 1100,
      hitRatio: 84.2,
      cpi: 1.2,
      timestamp: Date.now() - 120000,
    },
  ];
}

export async function GET() {
  const sorted = [...(globalForLeaderboard.coaLeaderboard || [])]
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);
  return NextResponse.json({ entries: sorted });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = (body.name || 'ANON').toString().trim().toUpperCase().slice(0, 16);
    const regNo = (body.regNo || 'VIT-AP').toString().trim().toUpperCase().slice(0, 12);
    const score = Number(body.score) || 0;
    const hitRatio = Number(body.hitRatio) || 0;
    const cpi = Number(body.cpi) || 1.0;

    const newEntry: LeaderboardEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      regNo,
      score,
      hitRatio,
      cpi,
      timestamp: Date.now(),
    };

    const list = globalForLeaderboard.coaLeaderboard || [];
    // Update existing player if higher score, or insert new
    const existingIdx = list.findIndex(
      (e) => e.name === name && e.regNo === regNo
    );
    if (existingIdx >= 0) {
      if (score >= list[existingIdx].score) {
        list[existingIdx] = newEntry;
      }
    } else {
      list.push(newEntry);
    }

    globalForLeaderboard.coaLeaderboard = list;

    const sorted = [...list].sort((a, b) => b.score - a.score).slice(0, 15);
    return NextResponse.json({ entries: sorted, submitted: newEntry });
  } catch {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
  }
}