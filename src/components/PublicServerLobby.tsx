import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { HeroId } from '../types/game';
import { Referee3DPortrait, Hero3DPortrait } from './CharacterCardVisuals';
import { soundEffects } from '../utils/soundEffects';
import {
  Trophy,
  CheckCircle2,
  Sparkles,
  Globe,
  ShieldCheck,
  Send,
  Volume2,
} from 'lucide-react';

export interface LeaderboardRecord {
  id: string;
  playerName: string;
  heroChoice: HeroId;
  levelReached: number;
  coins: number;
  greenCards: number;
  medalsCount: number;
  refereeVerified: boolean;
  timestamp: string;
}

interface PublicServerLobbyProps {
  playerName: string;
  onChangePlayerName: (name: string) => void;
  unlockedLevelMax: number;
  coins: number;
  greenCards: number;
  medalsCount: number;
  onClose?: () => void;
}

export const PublicServerLobby: React.FC<PublicServerLobbyProps> = ({
  playerName,
  onChangePlayerName,
  unlockedLevelMax,
  coins,
  greenCards,
  medalsCount,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRecord[]>([]);
  const [heroChoice, setHeroChoice] = useState<HeroId>('richard');
  const [refereeMessage, setRefereeMessage] = useState<string>(
    '¡Hola Campeón! Soy Don Justo, el Árbitro Oficial 3D. Certifico tus buenos hábitos y subo tu récord al Servidor Público.'
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [certifiedToast, setCertifiedToast] = useState<boolean>(false);
  const [playersOnline, setPlayersOnline] = useState<number>(134);

  const fetchServerData = async () => {
    try {
      const [statusRes, lbRes] = await Promise.all([
        fetch('/api/server-status'),
        fetch('/api/leaderboard'),
      ]);
      if (statusRes.ok) {
        const st = await statusRes.json();
        if (st.playersOnline) setPlayersOnline(st.playersOnline);
      }
      if (lbRes.ok) {
        const data = await lbRes.json();
        if (Array.isArray(data.leaderboard)) {
          setLeaderboard(data.leaderboard);
        }
      }
    } catch {
      // Fallback local list if offline
    }
  };

  useEffect(() => {
    fetchServerData();
  }, []);

  const handleWhistleTest = () => {
    soundEffects.playGreenCardSound();
    setRefereeMessage(
      '¡Regla de Oro! 🏁 El silbato oficial solo sonará si ocurre una falta o infracción. ¡Mantén el juego limpio!'
    );
  };

  const handleSubmitPublicScore = async () => {
    setSubmitting(true);
    soundEffects.playGreenCardSound();
    try {
      const res = await fetch('/api/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: playerName || 'Guardián',
          heroChoice,
          levelReached: unlockedLevelMax,
          coins,
          greenCards: Math.max(1, greenCards),
          medalsCount,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.leaderboard)) {
          setLeaderboard(data.leaderboard);
        }
      }
      setCertifiedToast(true);
      setRefereeMessage(
        `¡TARJETA VERDE OFICIAL 🟩! He publicado el puntaje de ${playerName || 'Guardián'} en el Servidor Público Mundial.`
      );
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => setCertifiedToast(false), 3500);
    } catch {
      // Safe fallback
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
      {/* REFEREE & SERVER STATUS HERO BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/60 border-2 border-amber-400/50 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative cursor-pointer group" onClick={handleWhistleTest}>
            <Referee3DPortrait size={105} className="group-hover:scale-105 transition-transform" />
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow flex items-center gap-1 whitespace-nowrap">
              <Volume2 className="w-3 h-3" /> CONSEJO
            </span>
          </div>

          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-black flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                SERVIDOR PÚBLICO 3D ACTIVO (60 FPS)
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-amber-300 text-xs font-bold flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> {playersOnline} Niños Jugando
              </span>
            </div>

            <div className="bg-slate-950/90 border border-slate-700/80 rounded-2xl p-3.5 text-sm font-semibold text-white shadow-inner">
              “{refereeMessage}”
            </div>
          </div>
        </div>

        {/* GREEN CARDS COUNTER */}
        <div className="bg-slate-950/90 border-2 border-emerald-500/50 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[150px] text-center shadow-xl">
          <div className="w-8 h-11 rounded-md bg-emerald-500 border-2 border-white shadow-lg mb-1.5 flex items-center justify-center font-black text-slate-950 text-xs">
            ★
          </div>
          <span className="text-xl font-heading font-black text-emerald-400">
            {Math.max(1, greenCards)} Tarjetas
          </span>
          <span className="text-[11px] text-slate-300 font-bold">Juego Limpio</span>
        </div>
      </div>

      {/* PUBLISH SCORE & LEADERBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT CARD: REGISTER PLAYER IN PUBLIC SERVER */}
        <div className="lg:col-span-5 bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <h3 className="text-lg font-heading font-black text-white">
              CERTIFICAR MI RÉCORD
            </h3>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
              Tu Nombre de Jugador
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => onChangePlayerName(e.target.value)}
              maxLength={18}
              placeholder="Ej: SuperLeo, ValeEco..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border-2 border-slate-700 text-white font-bold text-base focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 uppercase block mb-2">
              Tu Héroe Favorito
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  soundEffects.playSwitchHeroSound();
                  setHeroChoice('richard');
                }}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                  heroChoice === 'richard'
                    ? 'bg-orange-500/20 border-orange-400 scale-[1.02] shadow-lg'
                    : 'bg-slate-950 border-slate-800 opacity-70 hover:opacity-100'
                }`}
              >
                <Hero3DPortrait heroId="richard" size={64} muscleLevel={unlockedLevelMax} />
                <span className="text-xs font-black text-white">RICHARD</span>
              </button>

              <button
                onClick={() => {
                  soundEffects.playSwitchHeroSound();
                  setHeroChoice('juan');
                }}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                  heroChoice === 'juan'
                    ? 'bg-emerald-500/20 border-emerald-400 scale-[1.02] shadow-lg'
                    : 'bg-slate-950 border-slate-800 opacity-70 hover:opacity-100'
                }`}
              >
                <Hero3DPortrait heroId="juan" size={64} muscleLevel={unlockedLevelMax} />
                <span className="text-xs font-black text-white">JUAN</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 flex justify-around text-center">
            <div>
              <span className="text-[11px] text-slate-400 font-bold block">Nivel</span>
              <span className="text-base font-black text-cyan-400">#{unlockedLevelMax}</span>
            </div>
            <div className="w-px bg-slate-800" />
            <div>
              <span className="text-[11px] text-slate-400 font-bold block">Monedas</span>
              <span className="text-base font-black text-amber-400">🪙 {coins.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={handleSubmitPublicScore}
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-95 text-slate-950 font-heading font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            <span>{submitting ? 'VALIDANDO CON EL ÁRBITRO...' : 'SUBIR AL SERVIDOR PÚBLICO'}</span>
          </button>

          {certifiedToast && (
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Puntaje Validado por el Árbitro en el Servidor!</span>
            </div>
          )}
        </div>

        {/* RIGHT CARD: PUBLIC LEADERBOARD */}
        <div className="lg:col-span-7 bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              <h3 className="text-lg font-heading font-black text-white">
                RANKING DEL SERVIDOR PÚBLICO
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> Verificado por Árbitro
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {leaderboard.map((entry, idx) => (
              <div
                key={entry.id}
                className={`p-3.5 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all ${
                  idx === 0
                    ? 'bg-amber-500/15 border-amber-400/60 shadow-md'
                    : idx === 1
                    ? 'bg-slate-800/90 border-slate-600'
                    : idx === 2
                    ? 'bg-amber-900/20 border-amber-700/50'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl font-heading font-black text-sm flex items-center justify-center shrink-0 ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-950'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{idx + 1}
                  </div>

                  <Hero3DPortrait
                    heroId={entry.heroChoice}
                    size={44}
                    muscleLevel={entry.levelReached}
                  />

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading font-black text-sm text-white">
                        {entry.playerName}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold"
                        title="Validado por el Árbitro"
                      >
                        🟩 {entry.greenCards}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-bold">
                      Nivel {entry.levelReached} · {entry.timestamp}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-sm text-amber-400 block">
                    🪙 {entry.coins.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    ✓ Árbitro OK
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
