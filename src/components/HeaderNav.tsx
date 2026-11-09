import React from 'react';
import { soundEffects } from '../utils/soundEffects';
import { Volume2, VolumeX, Gamepad2, Trophy, User, Bot } from 'lucide-react';

export type NavTabType = 'levels' | 'server' | 'avatar' | 'mech' | 'teams';

interface HeaderNavProps {
  currentTab: NavTabType;
  onSelectTab: (tab: NavTabType) => void;
  coins: number;
  greenCards: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentTab,
  onSelectTab,
  coins,
  greenCards,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md sticky top-0 z-50">
      {/* Zone 1: Brand Wordmark */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          soundEffects.playClickSound();
          onSelectTab('levels');
        }}
        className="text-lg sm:text-xl font-heading font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-400 select-none whitespace-nowrap"
      >
        HISTORY GAME 3D
      </a>

      {/* Zone 2: Kid-Friendly Big Icon Navigation */}
      <nav className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => {
            soundEffects.playClickSound();
            onSelectTab('levels');
          }}
          className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all ${
            currentTab === 'levels'
              ? 'bg-cyan-500 text-slate-950 shadow-lg scale-105'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>NIVELES</span>
        </button>

        <button
          onClick={() => {
            soundEffects.playClickSound();
            onSelectTab('server');
          }}
          className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all ${
            currentTab === 'server'
              ? 'bg-amber-400 text-slate-950 shadow-lg scale-105'
              : 'bg-slate-900 text-amber-300 border border-amber-500/30 hover:bg-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>ÁRBITRO & SERVIDOR</span>
        </button>

        <button
          onClick={() => {
            soundEffects.playClickSound();
            onSelectTab('avatar');
          }}
          className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all ${
            currentTab === 'avatar'
              ? 'bg-emerald-400 text-slate-950 shadow-lg scale-105'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">HÉROE</span>
        </button>

        <button
          onClick={() => {
            soundEffects.playClickSound();
            onSelectTab('mech');
          }}
          className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all ${
            currentTab === 'mech'
              ? 'bg-purple-400 text-slate-950 shadow-lg scale-105'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span className="hidden sm:inline">ROBOTS</span>
        </button>
      </nav>

      {/* Zone 3: Coins, Green Cards & Audio */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-1.5 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-amber-400 font-black">
            <span>🪙</span>
            <span>{coins.toLocaleString()}</span>
          </div>

          <div className="h-3.5 w-px bg-slate-800" />

          <div
            className="flex items-center gap-1 font-mono text-emerald-400 font-black"
            title="Tarjetas Verdes del Árbitro"
          >
            <span>🟩</span>
            <span>{greenCards}</span>
          </div>
        </div>

        <button
          onClick={onToggleSound}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl text-slate-300 transition-colors"
          title={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
