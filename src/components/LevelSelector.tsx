import React, { useState } from 'react';
import { HabitLevel, LifeStage } from '../types/game';
import { ALL_LEVELS } from '../data/levelsData';
import { soundEffects } from '../utils/soundEffects';
import { Villain3DPortrait } from './CharacterCardVisuals';
import { Lock, Play, CheckCircle, Sparkles } from 'lucide-react';

interface LevelSelectorProps {
  unlockedLevelMax: number;
  completedLevels: number[];
  onSelectLevel: (level: HabitLevel) => void;
}

const LIFE_STAGES: { id: LifeStage | 'all'; label: string; emoji: string; color: string }[] = [
  { id: 'all', label: 'Todos (15)', emoji: '🌍', color: '#38bdf8' },
  { id: 'ninez', label: 'Niñez', emoji: '🌱', color: '#eab308' },
  { id: 'adolescencia', label: 'Adolescencia', emoji: '⚡', color: '#f97316' },
  { id: 'juventud', label: 'Juventud', emoji: '🌊', color: '#0284c7' },
  { id: 'adultez', label: 'Adultez', emoji: '🛡️', color: '#9333ea' },
  { id: 'vejez', label: 'Vejez', emoji: '🌳', color: '#15803d' },
];

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  unlockedLevelMax,
  completedLevels,
  onSelectLevel,
}) => {
  const [stageFilter, setStageFilter] = useState<LifeStage | 'all'>('all');

  const filteredLevels =
    stageFilter === 'all'
      ? ALL_LEVELS
      : ALL_LEVELS.filter((l) => l.lifeStage === stageFilter);

  const handlePlay = (level: HabitLevel) => {
    soundEffects.playClickSound();
    onSelectLevel(level);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
      {/* STAGE OF LIFE VISUAL FILTER PILLS */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {LIFE_STAGES.map((st) => {
          const active = stageFilter === st.id;
          return (
            <button
              key={st.id}
              onClick={() => {
                soundEffects.playClickSound();
                setStageFilter(st.id);
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all border-2 ${
                active
                  ? 'bg-slate-800 text-white scale-105 shadow-xl'
                  : 'bg-slate-950/90 text-slate-400 border-slate-800 hover:text-white'
              }`}
              style={{
                borderColor: active ? st.color : undefined,
              }}
            >
              <span className="text-base">{st.emoji}</span>
              <span>{st.label}</span>
            </button>
          );
        })}
      </div>

      {/* KID-FRIENDLY DIRECT 1-CLICK LEVEL CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLevels.map((lvl) => {
          const isCompleted = completedLevels.includes(lvl.id);
          const isLocked = lvl.id > unlockedLevelMax;

          return (
            <div
              key={lvl.id}
              className={`rounded-3xl border-2 p-5 flex flex-col justify-between gap-4 transition-all relative overflow-hidden ${
                isLocked
                  ? 'bg-slate-950/50 border-slate-900 opacity-50'
                  : isCompleted
                  ? 'bg-slate-900/95 border-emerald-500/60 shadow-xl hover:scale-[1.02]'
                  : 'bg-slate-900 border-cyan-400/70 shadow-2xl hover:scale-[1.02]'
              }`}
            >
              {/* Top Row: Level Number & Life Stage Badge */}
              <div className="flex items-center justify-between gap-2">
                <span
                  className="px-3 py-1 rounded-xl text-xs font-black uppercase text-slate-950 shadow"
                  style={{ backgroundColor: lvl.lifeStageColor }}
                >
                  Nivel {lvl.id} · {lvl.lifeStage.toUpperCase()}
                </span>

                {isCompleted ? (
                  <span className="flex items-center gap-1 text-xs font-black text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> ¡SUPERADO!
                  </span>
                ) : isLocked ? (
                  <Lock className="w-4 h-4 text-slate-500" />
                ) : (
                  <span className="text-xs font-black text-amber-400 animate-pulse">
                    ¡LISTO!
                  </span>
                )}
              </div>

              {/* Center Row: Title, Short Mission & Villain Portrait */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-heading font-black text-white truncate">
                    {lvl.title.split(': ')[1] || lvl.title}
                  </h3>
                  <p className="text-xs text-cyan-300 font-bold mt-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      Meta: {lvl.objectiveCount} {lvl.objectiveItemName.split(' ')[0]}
                    </span>
                  </p>
                  <span className="text-[11px] text-amber-400 font-mono font-bold block mt-1">
                    Premio: +{lvl.coinsReward.toLocaleString()} 🪙
                  </span>
                </div>

                <Villain3DPortrait
                  name={lvl.villainName.split(' ')[0]}
                  title={lvl.villainTitle}
                  color={lvl.villainColor}
                  size={68}
                  className="shrink-0"
                />
              </div>

              {/* Big Play Button */}
              <button
                disabled={isLocked}
                onClick={() => handlePlay(lvl)}
                className={`w-full py-3.5 rounded-2xl font-heading font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                  isLocked
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 active:scale-95 text-slate-950'
                }`}
              >
                {isLocked ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>BLOQUEADO</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-slate-950" />
                    <span>¡JUGAR NIVEL {lvl.id}!</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
