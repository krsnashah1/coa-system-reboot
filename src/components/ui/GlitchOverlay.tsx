// src/components/ui/GlitchOverlay.tsx
'use client';

import React from 'react';
import { useGameStore } from '@/store/gameStore';

export default function GlitchOverlay() {
  const { isGlitching } = useGameStore();

  if (!isGlitching) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none bg-rose-500/15 mix-blend-screen animate-pulse border-4 border-rose-500/60" />
  );
}