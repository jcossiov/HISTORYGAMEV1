import React from 'react';
import { soundEffects } from '../utils/soundEffects';
import { Volume2, VolumeX, Gamepad2, Trophy, User, Bot, Users } from 'lucide-react';

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
  const tabs: { id: NavTabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'levels',
      label: 'Capítulos',
      icon: <Gamepad2 className="w-3.5 h-3.5" />,
    },
    {
      id: 'server',
      label: 'Ranking',
      icon: <Trophy className="w-3.5 h-3.5" />,
    },
    {
      id: 'avatar',
      label: 'Héroe',
      icon: <User className="w-3.5 h-3.5" />,
    },
    {
      id: 'mech',
      label: 'Robots',
      icon: <Bot className="w-3.5 h-3.5" />,
    },
    {
      id: 'teams',
      label: 'Brigadas',
      icon: <Users className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <header className="sticky top-0 z-50 px-4 sm:px-6 py-2.5 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl glass-panel">
        {/* Brand / Logo */}
        <button
          onClick={() => {
            soundEffects.playClickSound();
            onSelectTab('levels');
          }}
          className="flex items-center gap-2.5 select-none group text-left transition-transform active:scale-95"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 via-teal-400 to-emerald-400 flex items-center justify-center text-white shadow-sm shadow-sky-500/20 font-heading font-black text-xs">
            SG
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-sm sm:text-base font-heading font-extrabold tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
                Story Game
              </span>
              <span className="text-[9px] font-bold text-sky-700 bg-sky-100/80 px-1.5 py-0.5 rounded-md">
                Medellín
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
              Buenos Hábitos 3D
            </span>
          </div>
        </button>

        {/* Segmented Floating Pill Tabs */}
        <nav className="flex items-center bg-slate-100/70 p-1 rounded-xl border border-slate-200/50">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEffects.playClickSound();
                  onSelectTab(tab.id);
                }}
                className={`relative px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm shadow-slate-900/5 font-bold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                {tab.icon}
                <span className={tab.id === 'avatar' || tab.id === 'mech' ? 'hidden sm:inline' : ''}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Micro Stats & Audio Switch */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2.5 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200/60 text-xs">
            <span className="font-bold text-amber-600 flex items-center gap-1">
              <span className="text-sm">🪙</span>
              <span>{coins.toLocaleString()}</span>
            </span>
            <span className="w-px h-3 bg-slate-200" />
            <span
              className="font-bold text-emerald-600 flex items-center gap-1"
              title="Tarjetas Verdes del Árbitro"
            >
              <span className="w-2 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              <span>{greenCards}</span>
            </span>
          </div>

          <button
            onClick={onToggleSound}
            className="w-8 h-8 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center border border-slate-200/60"
            title={soundEnabled ? 'Silenciar audio' : 'Activar audio'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-sky-600" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
