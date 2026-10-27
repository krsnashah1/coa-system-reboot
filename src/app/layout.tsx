// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import TopSystemHUD from '@/components/ui/TopSystemHUD';
import TutorialOverlay from '@/components/ui/TutorialOverlay';
import HintTooltip from '@/components/ui/HintTooltip';
import GlitchOverlay from '@/components/ui/GlitchOverlay';

export const metadata: Metadata = {
  title: 'SYSTEM REBOOT // COA Interactive Simulation',
  description: 'Interactive Cache Mapping and Instruction Pipeline Simulator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-emerald-400 font-mono min-h-screen overflow-x-hidden selection:bg-emerald-500 selection:text-slate-950">
        {/* Global HUD, Walkthrough Modal & Smart Hints */}
        <TopSystemHUD />
        <TutorialOverlay />
        <HintTooltip />
        <GlitchOverlay />

        {/* Main Viewport shifted down by pt-16 for the Top HUD */}
        <main className="pt-16 min-h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}