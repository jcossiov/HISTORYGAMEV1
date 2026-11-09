import React, { useState } from 'react';
import { HabitCategory, HabitLevel, LifeStage } from '../types/game';
import { ALL_LEVELS } from '../data/levelsData';
import { soundEffects } from '../utils/soundEffects';
import { Villain3DPortrait } from './CharacterCardVisuals';
import {
  Lock,
  Play,
  CheckCircle2,
  MapPin,
  Sparkles,
  Droplets,
  Trees,
  ShieldCheck,
  HeartHandshake,
} from 'lucide-react';

interface LevelSelectorProps {
  unlockedLevelMax: number;
  completedLevels: number[];
  onSelectLevel: (level: HabitLevel) => void;
}

const LIFE_STAGES: { id: LifeStage | 'all'; label: string; emoji: string }[] = [
  { id: 'all', label: 'Todos', emoji: '✨' },
  { id: 'ninez', label: 'Niñez', emoji: '🌱' },
  { id: 'adolescencia', label: 'Adolescencia', emoji: '⚡' },
  { id: 'juventud', label: 'Juventud', emoji: '🌊' },
  { id: 'adultez', label: 'Adultez', emoji: '🛡️' },
  { id: 'vejez', label: 'Sabiduría', emoji: '🌳' },
];

const HABIT_TAGS: { id: HabitCategory | 'all'; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Cualquier Hábito', icon: <Sparkles className="w-3 h-3" /> },
  { id: 'recoger_basura', label: 'Cero Basura', icon: <Droplets className="w-3 h-3 text-cyan-500" /> },
  { id: 'no_tala', label: 'No a la Tala', icon: <Trees className="w-3 h-3 text-emerald-500" /> },
  { id: 'cero_violencia', label: 'Cero Violencia', icon: <ShieldCheck className="w-3 h-3 text-rose-500" /> },
  { id: 'cero_hambre', label: 'Cero Hambre', icon: <HeartHandshake className="w-3 h-3 text-amber-500" /> },
];

function getHabitPill(cat?: HabitCategory) {
  switch (cat) {
    case 'recoger_basura':
      return {
        label: 'Cañón de Agua vs. Basurote',
        classes: 'text-cyan-700 bg-cyan-50/80 border-cyan-200/60',
      };
    case 'no_tala':
      return {
        label: 'Arma de Agua salva Árboles',
        classes: 'text-emerald-700 bg-emerald-50/80 border-emerald-200/60',
      };
    case 'cero_violencia':
      return {
        label: 'Convivencia y Paz',
        classes: 'text-rose-700 bg-rose-50/80 border-rose-200/60',
      };
    case 'cero_hambre':
      return {
        label: 'Huertas y Alimento',
        classes: 'text-amber-700 bg-amber-50/80 border-amber-200/60',
      };
    default:
      return {
        label: 'Cuidado del Agua',
        classes: 'text-sky-700 bg-sky-50/80 border-sky-200/60',
      };
  }
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  unlockedLevelMax,
  completedLevels,
  onSelectLevel,
}) => {
  const [stageFilter, setStageFilter] = useState<LifeStage | 'all'>('all');
  const [habitFilter, setHabitFilter] = useState<HabitCategory | 'all'>('all');

  const filteredLevels = ALL_LEVELS.filter((l) => {
    const matchStage = stageFilter === 'all' || l.lifeStage === stageFilter;
    const matchHabit = habitFilter === 'all' || l.habitCategory === habitFilter;
    return matchStage && matchHabit;
  });

  const handlePlay = (level: HabitLevel) => {
    soundEffects.playClickSound();
    onSelectLevel(level);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Sleek Segmented Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        {/* Life Stages Segmented Pills */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5 no-scrollbar">
          {LIFE_STAGES.map((st) => {
            const active = stageFilter === st.id;
            const count =
              st.id === 'all'
                ? ALL_LEVELS.length
                : ALL_LEVELS.filter((l) => l.lifeStage === st.id).length;
            return (
              <button
                key={st.id}
                onClick={() => {
                  soundEffects.playClickSound();
                  setStageFilter(st.id);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white/80 text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200/60'
                }`}
              >
                <span>{st.emoji}</span>
                <span>{st.label}</span>
                <span className={`text-[10px] ml-0.5 opacity-60`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Minimal Habit Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5 no-scrollbar">
          {HABIT_TAGS.map((hb) => {
            const active = habitFilter === hb.id;
            return (
              <button
                key={hb.id}
                onClick={() => {
                  soundEffects.playClickSound();
                  setHabitFilter(hb.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
                  active
                    ? 'bg-sky-50 text-sky-700 font-bold border border-sky-300'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                }`}
              >
                {hb.icon}
                <span>{hb.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Clean Editorial Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLevels.map((lvl) => {
          const isCompleted = completedLevels.includes(lvl.id);
          const isLocked = lvl.id > unlockedLevelMax;
          const habitMeta = getHabitPill(lvl.habitCategory);

          return (
            <div
              key={lvl.id}
              className={`group relative rounded-2xl p-5 flex flex-col justify-between transition-all ${
                isLocked
                  ? 'bg-slate-100/50 border border-slate-200/60 opacity-60 cursor-not-allowed'
                  : isCompleted
                  ? 'glass-card-interactive border-emerald-200/80 hover:border-emerald-400'
                  : 'glass-card-interactive hover:border-sky-400'
              }`}
            >
              <div>
                {/* Top: Chapter index & status indicator */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400">
                      Capítulo {lvl.id < 10 ? `0${lvl.id}` : lvl.id}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[11px] font-semibold text-slate-500">
                      {lvl.lifeStageLabel.split(' · ')[0]}
                    </span>
                  </div>

                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Superado
                    </span>
                  ) : isLocked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                      <Lock className="w-3 h-3" /> Bloqueado
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </div>

                {/* Center: Title & Portrait */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-heading font-extrabold text-slate-900 leading-snug group-hover:text-sky-600 transition-colors">
                      {lvl.title.split(': ')[1] || lvl.title}
                    </h3>
                    {lvl.locationName && (
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{lvl.locationName.split(' · ')[0]}</span>
                      </p>
                    )}
                  </div>

                  {/* Villain 3D Portrait */}
                  <div className="shrink-0 transition-transform group-hover:scale-105 duration-300">
                    <Villain3DPortrait
                      name={lvl.villainName}
                      title={lvl.villainTitle}
                      color={lvl.villainColor}
                      archetype={lvl.villainArchetype}
                      size={54}
                    />
                  </div>
                </div>

                {/* Habit Mission Tag */}
                <div className="mb-4">
                  <span
                    className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${habitMeta.classes}`}
                  >
                    {habitMeta.label}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                disabled={isLocked}
                onClick={() => handlePlay(lvl)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-2 transition-all ${
                  isLocked
                    ? 'bg-slate-200/60 text-slate-400 cursor-not-allowed'
                    : isCompleted
                    ? 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 active:scale-[0.98]'
                    : 'bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-white shadow-sm shadow-sky-500/20 active:scale-[0.98]'
                }`}
              >
                {isLocked ? (
                  <span>Supera el anterior</span>
                ) : isCompleted ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Jugar de nuevo</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Iniciar Capítulo</span>
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
