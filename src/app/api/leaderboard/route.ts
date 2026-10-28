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

const globalForLeaderboard = globalThis as unknown as {
  coaLeaderboard?: LeaderboardEntry[];
};

// EDIT THIS ARRAY IF YOU WANT DEFAULT STARTING SCORES, OR LEAVE EMPTY []
if (!globalForLeaderboard.coaLeaderboard) {
  globalForLeaderboard.coaLeaderboard = [];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Instant browser reset: visit /api/leaderboard?reset=vitap to clear all scores!
  if (searchParams.get('reset') === 'vitap') {
    globalForLeaderboard.coaLeaderboard = [];
    return NextResponse.json({
      message: 'Leaderboard reset successfully!',
      entries: [],
    });
  }

  const sorted = [...(globalForLeaderboard.coaLeaderboard || [])]
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);

  return NextResponse.json({ entries: sorted });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = (body.name || 'TECHNICIAN').toString().trim().toUpperCase().slice(0, 16);
    const regNo = (body.regNo || 'ECE2002').toString().trim().toUpperCase().slice(0, 12);
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

    const sorted = [...list].sort((a, b) => b.score - a.score).slice(0, 25);
    return NextResponse.json({ entries: sorted, submitted: newEntry });
  } catch {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
  }
}