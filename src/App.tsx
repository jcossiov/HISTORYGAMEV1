import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { HabitLevel, AvatarProfile, MechConfiguration, TeamSquad } from './types/game';
import { ALL_LEVELS, INITIAL_LOGIC_BLOCKS, INITIAL_TEAMS } from './data/levelsData';
import { LevelSelector } from './components/LevelSelector';
import { TeamsCodex } from './components/TeamsCodex';
import { HeaderNav, NavTabType } from './components/HeaderNav';
import { PublicServerLobby } from './components/PublicServerLobby';
import { Hero3DPortrait, Referee3DPortrait } from './components/CharacterCardVisuals';
import { submitScore } from './utils/leaderboard';
import { soundEffects } from './utils/soundEffects';
import { Play, Sparkles } from 'lucide-react';

const ThreeGameArena = lazy(() =>
  import('./components/ThreeGameArena').then((m) => ({ default: m.ThreeGameArena }))
);
const AvatarCustomizer = lazy(() =>
  import('./components/AvatarCustomizer').then((m) => ({ default: m.AvatarCustomizer }))
);
const MechProgrammingStudio = lazy(() =>
  import('./components/MechProgrammingStudio').then((m) => ({ default: m.MechProgrammingStudio }))
);

const STORAGE_KEY = 'story_game_medellin_save_v3';

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="w-full min-h-[55vh] flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-sky-200 border-t-sky-500 animate-spin" />
      <p className="font-heading font-medium text-slate-500 text-xs tracking-wide">{label}</p>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTabType>('levels');
  const [activeGameLevel, setActiveGameLevel] = useState<HabitLevel | null>(null);

  const [playerName, setPlayerName] = useState<string>('SuperGuardián');
  const [coins, setCoins] = useState<number>(100000);
  const [powerPoints, setPowerPoints] = useState<number>(100);
  const [greenCards, setGreenCards] = useState<number>(3);
  const [unlockedLevelMax, setUnlockedLevelMax] = useState<number>(1);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [playerMedals, setPlayerMedals] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [avatar, setAvatar] = useState<AvatarProfile>({
    name: 'SuperGuardián',
    gender: 'heroe',
    characterId: 'richard',
    classId: 'rey-agua',
    suitId: 'eco-ranger',
    primaryColor: '#06b6d4',
    secondaryColor: '#0284c7',
    equippedTool: 'Cañón de Agua Purificadora',
    bio: 'Guardián de los Buenos Hábitos en Medellín y Colombia',
  });

  const [mechConfig, setMechConfig] = useState<MechConfiguration>({
    id: 'mech_01',
    name: 'HidroBot Medellín MK-I',
    chassis: 'ironman',
    primaryColor: '#06b6d4',
    accentColor: '#f59e0b',
    reactorColor: '#10b981',
    programmedBlocks: [
      INITIAL_LOGIC_BLOCKS[0],
      INITIAL_LOGIC_BLOCKS[4],
      INITIAL_LOGIC_BLOCKS[5],
    ],
    stats: {
      firepower: 160,
      shield: 130,
      agility: 110,
      habitEnergy: 95,
    },
  });

  const [currentTeam, setCurrentTeam] = useState<TeamSquad>(INITIAL_TEAMS[0]);

  // Load saved state
  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY) || localStorage.getItem('history_game_save_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.playerName) setPlayerName(parsed.playerName);
        if (parsed.coins !== undefined) setCoins(parsed.coins);
        if (parsed.powerPoints !== undefined) setPowerPoints(parsed.powerPoints);
        if (parsed.greenCards !== undefined) setGreenCards(parsed.greenCards);
        if (parsed.unlockedLevelMax !== undefined)
          setUnlockedLevelMax(parsed.unlockedLevelMax);
        if (parsed.completedLevels !== undefined)
          setCompletedLevels(parsed.completedLevels);
        if (parsed.playerMedals !== undefined) setPlayerMedals(parsed.playerMedals);
        if (parsed.avatar) {
          const a = parsed.avatar;
          if (a.gender === 'mujer') a.gender = 'heroina';
          else if (a.gender !== 'heroina' && a.gender !== 'heroe') a.gender = 'heroe';
          setAvatar(a);
        }
        if (parsed.mechConfig) setMechConfig(parsed.mechConfig);
        if (parsed.currentTeam) setCurrentTeam(parsed.currentTeam);
      }
    } catch {
      // Safe fallback
    }
  }, []);

  // Save state
  useEffect(() => {
    try {
      const dataToSave = {
        playerName,
        coins,
        powerPoints,
        greenCards,
        unlockedLevelMax,
        completedLevels,
        playerMedals,
        avatar,
        mechConfig,
        currentTeam,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch {
      // Safe fallback
    }
  }, [
    playerName,
    coins,
    powerPoints,
    greenCards,
    unlockedLevelMax,
    completedLevels,
    playerMedals,
    avatar,
    mechConfig,
    currentTeam,
  ]);

  const handleLevelComplete = useCallback(
    (levelId: number, rewardedCoins: number, rewardedPower: number, medal: string) => {
      setCoins((c) => c + rewardedCoins);
      setPowerPoints((p) => p + rewardedPower);
      setGreenCards((g) => g + 3);
      setCompletedLevels((prev) => (prev.includes(levelId) ? prev : [...prev, levelId]));
      setUnlockedLevelMax((prev) => Math.max(prev, Math.min(15, levelId + 1)));
      setPlayerMedals((prev) => (medal && !prev.includes(medal) ? [...prev, medal] : prev));

      try {
        submitScore({
          playerName,
          heroChoice: avatar.characterId || 'richard',
          levelReached: Math.min(15, levelId + 1),
          coins: coins + rewardedCoins,
          greenCards: greenCards + 3,
          medalsCount: playerMedals.includes(medal) ? playerMedals.length : playerMedals.length + 1,
        });
      } catch {
        // Safe fallback
      }
    },
    [playerName, avatar.characterId, coins, greenCards, playerMedals]
  );

  const handleAddCoins = useCallback((amount: number) => {
    setCoins((c) => c + amount);
  }, []);

  const handleAddGreenCard = useCallback(() => {
    setGreenCards((g) => g + 1);
  }, []);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    soundEffects.enabled = next;
    setSoundEnabled(next);
  };

  const currentHeroId = avatar.characterId || 'richard';
  const nextLevelToPlay =
    ALL_LEVELS.find((l) => l.id === unlockedLevelMax) || ALL_LEVELS[0];

  return (
    <div className="min-h-screen text-slate-800 flex flex-col font-sans">
      <HeaderNav
        currentTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setActiveGameLevel(null);
        }}
        coins={coins}
        greenCards={greenCards}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* MAIN VIEWPORT */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col">
        <Suspense
          fallback={<LoadingScreen label={activeGameLevel ? 'Cargando el escenario 3D…' : 'Cargando…'} />}
        >
          {activeGameLevel ? (
            <ThreeGameArena
              level={activeGameLevel}
              playerCoins={coins}
              onAddCoins={handleAddCoins}
              onAddGreenCard={handleAddGreenCard}
              avatar={avatar}
              onLevelComplete={handleLevelComplete}
              onExitArena={() => setActiveGameLevel(null)}
            />
          ) : (
            <>
              {/* EDITORIAL HERO SECTION (Only on Levels Tab) */}
              {activeTab === 'levels' && (
                <section className="relative rounded-3xl p-6 sm:p-8 mb-8 glass-panel overflow-hidden">
                  {/* Subtle decorative glow */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-sky-400/10 via-emerald-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="flex-1 text-center lg:text-left max-w-2xl">
                      {/* Eyebrow badge */}
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/5 border border-slate-900/10 text-slate-700 text-xs font-semibold mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Medellín & Colombia · 15 Capítulos</span>
                      </div>

                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-slate-900 tracking-tight leading-tight">
                        La aventura de tus buenos hábitos en cada etapa de la vida
                      </h1>

                      <p className="text-sm text-slate-500 font-normal mt-2 leading-relaxed max-w-xl">
                        Frena al <strong>Basurote</strong> y a los <strong>Taladores</strong> con tu Cañón de Agua, cultiva huertas solidarias y vive con <strong>Cero Violencia</strong>.
                      </p>

                      {/* Primary CTA and Hero quick toggle */}
                      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-5">
                        <button
                          onClick={() => {
                            soundEffects.playClickSound();
                            setActiveGameLevel(nextLevelToPlay);
                          }}
                          className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center gap-2"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Jugar Capítulo {unlockedLevelMax}</span>
                        </button>

                        <button
                          onClick={() => {
                            soundEffects.playSwitchHeroSound();
                            setAvatar((prev) => ({
                              ...prev,
                              characterId: prev.characterId === 'richard' ? 'juan' : 'richard',
                            }));
                          }}
                          className="px-4 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 font-heading font-semibold text-xs transition-all active:scale-[0.98] flex items-center gap-2"
                          title="Alternar héroe activo"
                        >
                          <span>Héroe:</span>
                          <span className="font-bold text-slate-900">
                            {currentHeroId === 'richard' ? 'Richard (Naranja)' : 'Juan (Verde)'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Minimalist interactive character spotlight */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div
                        onClick={() => {
                          soundEffects.playSwitchHeroSound();
                          setAvatar((prev) => ({ ...prev, characterId: 'richard' }));
                        }}
                        className={`cursor-pointer p-3 rounded-2xl transition-all border ${
                          currentHeroId === 'richard'
                            ? 'bg-white border-orange-300 shadow-md scale-105'
                            : 'bg-white/40 border-slate-200/60 opacity-60 hover:opacity-100'
                        }`}
                        title="Seleccionar a Richard"
                      >
                        <Hero3DPortrait heroId="richard" size={68} muscleLevel={unlockedLevelMax} />
                        <span className="text-[11px] font-bold text-center block mt-1.5 text-orange-600">
                          Richard
                        </span>
                      </div>

                      <div
                        onClick={() => {
                          soundEffects.playSwitchHeroSound();
                          setAvatar((prev) => ({ ...prev, characterId: 'juan' }));
                        }}
                        className={`cursor-pointer p-3 rounded-2xl transition-all border ${
                          currentHeroId === 'juan'
                            ? 'bg-white border-emerald-300 shadow-md scale-105'
                            : 'bg-white/40 border-slate-200/60 opacity-60 hover:opacity-100'
                        }`}
                        title="Seleccionar a Juan"
                      >
                        <Hero3DPortrait heroId="juan" size={68} muscleLevel={unlockedLevelMax} />
                        <span className="text-[11px] font-bold text-center block mt-1.5 text-emerald-600">
                          Juan
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'levels' && (
                <LevelSelector
                  unlockedLevelMax={unlockedLevelMax}
                  completedLevels={completedLevels}
                  onSelectLevel={(lvl) => setActiveGameLevel(lvl)}
                />
              )}

              {activeTab === 'server' && (
                <PublicServerLobby
                  playerName={playerName}
                  onChangePlayerName={setPlayerName}
                  unlockedLevelMax={unlockedLevelMax}
                  coins={coins}
                  greenCards={greenCards}
                  medalsCount={playerMedals.length}
                />
              )}

              {activeTab === 'avatar' && (
                <AvatarCustomizer
                  avatar={avatar}
                  playerPower={powerPoints}
                  onSaveAvatar={(updated) => {
                    setAvatar(updated);
                    if (updated.name) setPlayerName(updated.name);
                  }}
                  onClose={() => setActiveTab('levels')}
                />
              )}

              {activeTab === 'mech' && (
                <MechProgrammingStudio
                  mechConfig={mechConfig}
                  playerPower={powerPoints}
                  onSaveMech={(updated: MechConfiguration) => setMechConfig(updated)}
                  onClose={() => setActiveTab('levels')}
                />
              )}

              {activeTab === 'teams' && (
                <TeamsCodex
                  currentTeam={currentTeam}
                  playerMedals={playerMedals}
                  onUpdateTeam={(team: TeamSquad) => setCurrentTeam(team)}
                  onClose={() => setActiveTab('levels')}
                />
              )}
            </>
          )}
        </Suspense>
      </main>

      {/* Clean minimal footer */}
      <footer className="py-6 text-center text-xs text-slate-400 font-medium">
        <p>Story Game · Medellín & Colombia · Cero Basura, No Tala, Cero Violencia y Cero Hambre.</p>
      </footer>
    </div>
  );
}
