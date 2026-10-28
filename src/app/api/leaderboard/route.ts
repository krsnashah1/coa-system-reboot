// src/app/api/leaderboard/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

const TMP_FILE = path.join('/tmp', 'coa-leaderboard-store.json');

const globalForLeaderboard = globalThis as unknown as {
  coaLeaderboard?: LeaderboardEntry[];
  lastResetTimestamp?: number;
};

function loadEntries(): LeaderboardEntry[] {
  if (globalForLeaderboard.coaLeaderboard && globalForLeaderboard.coaLeaderboard.length > 0) {
    return globalForLeaderboard.coaLeaderboard;
  }
  try {
    if (fs.existsSync(TMP_FILE)) {
      const raw = fs.readFileSync(TMP_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.entries)) {
        globalForLeaderboard.coaLeaderboard = parsed.entries;
        globalForLeaderboard.lastResetTimestamp = parsed.resetTimestamp || 0;
        return parsed.entries;
      }
    }
  } catch {}
  if (!globalForLeaderboard.coaLeaderboard) {
    globalForLeaderboard.coaLeaderboard = [];
  }
  return globalForLeaderboard.coaLeaderboard;
}

function saveEntries(entries: LeaderboardEntry[], resetTimestamp?: number) {
  globalForLeaderboard.coaLeaderboard = entries;
  if (resetTimestamp !== undefined) {
    globalForLeaderboard.lastResetTimestamp = resetTimestamp;
  }
  try {
    fs.writeFileSync(
      TMP_FILE,
      JSON.stringify({
        entries,
        resetTimestamp: globalForLeaderboard.lastResetTimestamp || 0,
      }),
      'utf-8'
    );
  } catch {}
}

function mergeEntryIntoList(list: LeaderboardEntry[], incoming: LeaderboardEntry) {
  const existingIdx = list.findIndex(
    (e) => e.name === incoming.name && e.regNo === incoming.regNo
  );
  if (existingIdx >= 0) {
    const prev = list[existingIdx];
    if (
      incoming.score > prev.score ||
      (incoming.score === prev.score &&
        (incoming.timeSeconds || 9999) < (prev.timeSeconds || 9999))
    ) {
      list[existingIdx] = incoming;
    }
  } else {
    list.push(incoming);
  }
}

function sortLeaderboard(list: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...list]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.timeSeconds || 9999) - (b.timeSeconds || 9999);
    })
    .slice(0, 40);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Instant browser reset: /api/leaderboard?reset=vitap
  if (searchParams.get('reset') === 'vitap') {
    const now = Date.now();
    saveEntries([], now);
    return NextResponse.json({
      message: 'Leaderboard reset successfully!',
      resetTimestamp: now,
      entries: [],
    });
  }

  const list = loadEntries();
  return NextResponse.json({
    entries: sortLeaderboard(list),
    resetTimestamp: globalForLeaderboard.lastResetTimestamp || 0,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const list = loadEntries();

    // Support self-healing sync from clients if a serverless instance cold-started
    if (Array.isArray(body.knownEntries)) {
      for (const item of body.knownEntries) {
        if (item && item.name && typeof item.score === 'number') {
          mergeEntryIntoList(list, {
            id: item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: item.name.toString().trim().toUpperCase().slice(0, 16),
            regNo: (item.regNo || 'VIT-AP').toString().trim().toUpperCase().slice(0, 12),
            score: Number(item.score) || 0,
            hitRatio: Number(item.hitRatio) || 0,
            cpi: Number(item.cpi) || 1.0,
            timeSeconds: Number(item.timeSeconds) || 0,
            timestamp: Number(item.timestamp) || Date.now(),
          });
        }
      }
    }

    // Standard single player score submission
    if (body.name) {
      const newEntry: LeaderboardEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: body.name.toString().trim().toUpperCase().slice(0, 16),
        regNo: (body.regNo || 'ECE2002').toString().trim().toUpperCase().slice(0, 12),
        score: Number(body.score) || 0,
        hitRatio: Number(body.hitRatio) || 0,
        cpi: Number(body.cpi) || 1.0,
        timeSeconds: Number(body.timeSeconds) || 0,
        timestamp: Date.now(),
      };
      mergeEntryIntoList(list, newEntry);
    }

    const sorted = sortLeaderboard(list);
    saveEntries(sorted);

    return NextResponse.json({
      entries: sorted,
      resetTimestamp: globalForLeaderboard.lastResetTimestamp || 0,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
  }
}