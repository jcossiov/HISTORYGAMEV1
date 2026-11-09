import React, { useState, useEffect, useCallback } from 'react';
import { HabitLevel, AvatarProfile, MechConfiguration, TeamSquad } from './types/game';
import { ALL_LEVELS, INITIAL_LOGIC_BLOCKS, INITIAL_TEAMS } from './data/levelsData';
import { ThreeGameArena } from './components/ThreeGameArena';
import { AvatarCustomizer } from './components/AvatarCustomizer';
import { MechProgrammingStudio } from './components/MechProgrammingStudio';
import { LevelSelector } from './components/LevelSelector';
import { TeamsCodex } from './components/TeamsCodex';
import { HeaderNav, NavTabType } from './components/HeaderNav';
import { PublicServerLobby } from './components/PublicServerLobby';
import {
  Hero3DPortrait,
  Referee3DPortrait,
} from './components/CharacterCardVisuals';
import { soundEffects } from './utils/soundEffects';
import { Play, Trophy, Volume2 } from 'lucide-react';

const STORAGE_KEY = 'history_game_save_v2';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTabType>('levels');
  const [activeGameLevel, setActiveGameLevel] = useState<HabitLevel | null>(null);

  // Kid-friendly Progression State
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
    gender: 'hombre',
    characterId: 'richard',
    classId: 'rey-fuego',
    suitId: 'eco-ranger',
    primaryColor: '#f97316',
    secondaryColor: '#ea580c',
    equippedTool: 'Cañón Purificador',
    bio: 'Guardián de los Buenos Hábitos',
  });

  const [mechConfig, setMechConfig] = useState<MechConfiguration>({
    id: 'mech_01',
    name: 'IronMech Guardián MK-I',
    chassis: 'ironman',
    primaryColor: '#ef4444',
    accentColor: '#f59e0b',
    reactorColor: '#06b6d4',
    programmedBlocks: [
      INITIAL_LOGIC_BLOCKS[0],
      INITIAL_LOGIC_BLOCKS[4],
      INITIAL_LOGIC_BLOCKS[5],
    ],
    stats: {
      firepower: 150,
      shield: 120,
      agility: 100,
      habitEnergy: 90,
    },
  });

  const [currentTeam, setCurrentTeam] = useState<TeamSquad>(INITIAL_TEAMS[0]);

  // Load saved state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
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
        if (parsed.avatar) setAvatar(parsed.avatar);
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

  // Handle level completion & auto-certify with Referee on Public Server
  const handleLevelComplete = async (
    levelId: number,
    rewardedCoins: number,
    rewardedPower: number,
    medal: string
  ) => {
    const nextCoins = coins + rewardedCoins;
    const nextLevelMax = Math.max(unlockedLevelMax, Math.min(15, levelId + 1));
    const nextGreenCards = greenCards + 3;
    const nextMedals =
      medal && !playerMedals.includes(medal)
        ? [...playerMedals, medal]
        : playerMedals;

    setCoins(nextCoins);
    setPowerPoints((p) => p + rewardedPower);
    setGreenCards(nextGreenCards);
    setCompletedLevels((prev) => (prev.includes(levelId) ? prev : [...prev, levelId]));
    setUnlockedLevelMax(nextLevelMax);
    setPlayerMedals(nextMedals);

    // Auto-submit verified score to Public Server
    try {
      await fetch('/api/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName,
          heroChoice: 'richard',
          levelReached: nextLevelMax,
          coins: nextCoins,
          greenCards: nextGreenCards,
          medalsCount: nextMedals.length,
        }),
      });
    } catch {
      // Safe fallback
    }
  };

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

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* CLEAN TOP BAR */}
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
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col">
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
            {/* ULTRA-CLEAN KID-FRIENDLY CONSOLE BANNER (Only on Levels tab) */}
            {activeTab === 'levels' && (
              <div className="rounded-3xl border-2 border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/60 p-5 sm:p-6 mb-6 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
                {/* Left: Play Now + Referee Badge */}
                <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                  <div
                    onClick={() => soundEffects.playClickSound()}
                    className="relative cursor-pointer hover:scale-105 transition-transform shrink-0"
                    title="Árbitro Oficial Don Justo"
                  >
                    <Referee3DPortrait size={92} />
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow flex items-center gap-1 whitespace-nowrap">
                      <Volume2 className="w-3 h-3" /> ÁRBITRO 3D
                    </span>
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black mb-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      SERVIDOR PÚBLICO LISTO · 60 FPS
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-heading font-black text-white">
                      ¡ELIGE TU NIVEL Y SALVA EL MUNDO!
                    </h1>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                      <button
                        onClick={() => {
                          soundEffects.playClickSound();
                          const nextLevel =
                            ALL_LEVELS.find((l) => l.id === unlockedLevelMax) ||
                            ALL_LEVELS[0];
                          setActiveGameLevel(nextLevel);
                        }}
                        className="px-6 py-3.5 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 active:scale-95 text-slate-950 font-heading font-black text-sm rounded-2xl shadow-xl flex items-center gap-2"
                      >
                        <Play className="w-5 h-5 fill-slate-950" />
                        <span>¡JUGAR NIVEL #{unlockedLevelMax} AHORA!</span>
                      </button>

                      <button
                        onClick={() => {
                          soundEffects.playClickSound();
                          setActiveTab('server');
                        }}
                        className="px-5 py-3.5 bg-amber-400/20 hover:bg-amber-400/30 border-2 border-amber-400/60 text-amber-300 font-heading font-black text-xs rounded-2xl flex items-center gap-2 transition-all"
                      >
                        <Trophy className="w-4 h-4" />
                        <span>RANKING PÚBLICO</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Richard & Juan Visual Cards */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="bg-slate-950/90 border-2 border-orange-500/50 rounded-2xl p-3 flex flex-col items-center">
                    <Hero3DPortrait
                      heroId="richard"
                      size={68}
                      muscleLevel={unlockedLevelMax}
                    />
                    <span className="font-heading font-black text-xs text-orange-400 mt-1.5">
                      RICHARD
                    </span>
                  </div>

                  <div className="bg-slate-950/90 border-2 border-emerald-500/50 rounded-2xl p-3 flex flex-col items-center">
                    <Hero3DPortrait
                      heroId="juan"
                      size={68}
                      muscleLevel={unlockedLevelMax}
                    />
                    <span className="font-heading font-black text-xs text-emerald-400 mt-1.5">
                      JUAN
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVE TAB VIEW */}
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
      </main>
    </div>
  );
};
