// src/app/api/leaderboard/route.ts
import { NextResponse } from 'next/server';

export interface LeaderboardEntry {
  id: string;
  name: string;
  regNo: string;
  score: number;
  hitRatio: number;
  cpi: number;
  timeSeconds: number;
  timestamp: number;
}

const globalForLeaderboard = globalThis as unknown as {
  coaLeaderboard?: LeaderboardEntry[];
};

if (!globalForLeaderboard.coaLeaderboard) {
  globalForLeaderboard.coaLeaderboard = [];
}

function sortLeaderboard(list: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...list]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.timeSeconds || 9999) - (b.timeSeconds || 9999);
    })
    .slice(0, 30);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get('reset') === 'vitap') {
    globalForLeaderboard.coaLeaderboard = [];
    return NextResponse.json({
      message: 'Leaderboard reset successfully!',
      entries: [],
    });
  }

  return NextResponse.json({
    entries: sortLeaderboard(globalForLeaderboard.coaLeaderboard || []),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = (body.name || 'TECHNICIAN')
      .toString()
      .trim()
      .toUpperCase()
      .slice(0, 16);
    const regNo = (body.regNo || 'ECE2002')
      .toString()
      .trim()
      .toUpperCase()
      .slice(0, 12);
    const score = Number(body.score) || 0;
    const hitRatio = Number(body.hitRatio) || 0;
    const cpi = Number(body.cpi) || 1.0;
    const timeSeconds = Number(body.timeSeconds) || 0;

    const newEntry: LeaderboardEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      regNo,
      score,
      hitRatio,
      cpi,
      timeSeconds,
      timestamp: Date.now(),
    };

    const list = globalForLeaderboard.coaLeaderboard || [];
    const existingIdx = list.findIndex(
      (e) => e.name === name && e.regNo === regNo
    );

    if (existingIdx >= 0) {
      const prev = list[existingIdx];
      if (
        score > prev.score ||
        (score === prev.score && timeSeconds < prev.timeSeconds)
      ) {
        list[existingIdx] = newEntry;
      }
    } else {
      list.push(newEntry);
    }

    globalForLeaderboard.coaLeaderboard = list;

    return NextResponse.json({
      entries: sortLeaderboard(list),
      submitted: newEntry,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
  }
}