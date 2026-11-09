import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { HeroId } from '../types/game';
import { Referee3DPortrait, Hero3DPortrait } from './CharacterCardVisuals';
import { soundEffects } from '../utils/soundEffects';
import { getLeaderboard, submitScore, getServerStatus, LeaderboardEntry } from '../utils/leaderboard';
import {
  Trophy,
  CheckCircle2,
  Sparkles,
  Globe,
  ShieldCheck,
  Send,
  Volume2,
} from 'lucide-react';

interface PublicServerLobbyProps {
  playerName: string;
  onChangePlayerName: (name: string) => void;
  unlockedLevelMax: number;
  coins: number;
  greenCards: number;
  medalsCount: number;
}

export const PublicServerLobby: React.FC<PublicServerLobbyProps> = ({
  playerName,
  onChangePlayerName,
  unlockedLevelMax,
  coins,
  greenCards,
  medalsCount,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [heroChoice, setHeroChoice] = useState<HeroId>('richard');
  const [refereeMessage, setRefereeMessage] = useState<string>(
    '¡Hola Campeón! Soy Don Justo, el Árbitro. Yo felicito tus buenos hábitos y guardo tu récord aquí.'
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [certifiedToast, setCertifiedToast] = useState<boolean>(false);
  const [playersOnline, setPlayersOnline] = useState<number>(134);

  useEffect(() => {
    setLeaderboard(getLeaderboard());
    setPlayersOnline(getServerStatus().playersOnline);
  }, []);

  const handleWhistleTest = () => {
    soundEffects.playGreenCardSound();
    setRefereeMessage(
      '¡Regla de Oro! 🏁 El silbato solo suena si haces una falta. ¡Juega limpio y gana tarjetas verdes!'
    );
  };

  const handleSubmitPublicScore = () => {
    setSubmitting(true);
    soundEffects.playGreenCardSound();
    try {
      const next = submitScore({
        playerName: playerName || 'Guardián',
        heroChoice,
        levelReached: unlockedLevelMax,
        coins,
        greenCards: Math.max(1, greenCards),
        medalsCount,
      });
      setLeaderboard(next);
      setCertifiedToast(true);
      setRefereeMessage(
        `¡TARJETA VERDE 🟩! Guardé el récord de ${playerName || 'Guardián'} en el ranking.`
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
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* REFEREE & STATUS HERO BAR */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative cursor-pointer group animate-float" onClick={handleWhistleTest}>
            <Referee3DPortrait size={90} className="group-hover:scale-105 transition-transform" />
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow flex items-center gap-1 whitespace-nowrap">
              <Volume2 className="w-2.5 h-2.5" /> DON JUSTO
            </span>
          </div>

          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Juego Limpio Certificado
              </span>
              <span className="px-3 py-1 rounded-full bg-sky-100/80 text-sky-800 text-xs font-semibold flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> {playersOnline} Guardianes
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 text-xs sm:text-sm font-medium text-slate-700">
              “{refereeMessage}”
            </div>
          </div>
        </div>

        {/* GREEN CARDS COUNTER */}
        <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[140px] text-center shadow-sm">
          <div className="w-8 h-10 rounded-md bg-emerald-500 mb-1.5 flex items-center justify-center font-extrabold text-white text-xs">
            ★
          </div>
          <span className="text-lg font-heading font-extrabold text-emerald-600">
            {Math.max(1, greenCards)} Tarjetas
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Juego Limpio</span>
        </div>
      </div>

      {/* REGISTER + LEADERBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT CARD */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-heading font-extrabold text-slate-900">
              Guardar mi récord
            </h3>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">
              Tu nombre de jugador
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => onChangePlayerName(e.target.value)}
              maxLength={18}
              placeholder="Ej: SuperLeo, ValeEco…"
              className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-sky-200 text-slate-800 font-bold text-base focus:outline-none focus:border-sky-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">
              Tu héroe favorito
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  soundEffects.playSwitchHeroSound();
                  setHeroChoice('richard');
                }}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                  heroChoice === 'richard'
                    ? 'bg-orange-50 border-orange-300 scale-[1.02] shadow-sm'
                    : 'bg-white border-slate-200 opacity-70 hover:opacity-100'
                }`}
              >
                <Hero3DPortrait heroId="richard" size={64} muscleLevel={unlockedLevelMax} />
                <span className="text-xs font-extrabold text-slate-800">RICHARD</span>
              </button>

              <button
                onClick={() => {
                  soundEffects.playSwitchHeroSound();
                  setHeroChoice('juan');
                }}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                  heroChoice === 'juan'
                    ? 'bg-emerald-50 border-emerald-300 scale-[1.02] shadow-sm'
                    : 'bg-white border-slate-200 opacity-70 hover:opacity-100'
                }`}
              >
                <Hero3DPortrait heroId="juan" size={64} muscleLevel={unlockedLevelMax} />
                <span className="text-xs font-extrabold text-slate-800">JUAN</span>
              </button>
            </div>
          </div>

          <div className="bg-sky-50 rounded-2xl p-3.5 border border-sky-100 flex justify-around text-center">
            <div>
              <span className="text-[11px] text-slate-500 font-bold block">Nivel</span>
              <span className="text-base font-extrabold text-sky-600">#{unlockedLevelMax}</span>
            </div>
            <div className="w-px bg-sky-100" />
            <div>
              <span className="text-[11px] text-slate-500 font-bold block">Monedas</span>
              <span className="text-base font-extrabold text-amber-500">🪙 {coins.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={handleSubmitPublicScore}
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-95 text-white font-heading font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            <span>{submitting ? 'Guardando…' : 'Guardar en el ranking'}</span>
          </button>

          {certifiedToast && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-bold flex items-center justify-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Récord guardado por el Árbitro!</span>
            </div>
          )}
        </div>

        {/* RIGHT CARD: LEADERBOARD */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-heading font-extrabold text-slate-900">
                Ranking de Guardianes
              </h3>
            </div>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Verificado por Don Justo
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {leaderboard.map((entry, idx) => (
              <div
                key={entry.id}
                className={`p-3.5 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all ${
                  idx === 0
                    ? 'bg-amber-50 border-amber-300 shadow-sm'
                    : idx === 1
                    ? 'bg-slate-50 border-slate-200'
                    : idx === 2
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-white border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl font-heading font-extrabold text-sm flex items-center justify-center shrink-0 ${
                      idx === 0
                        ? 'bg-amber-400 text-white'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-800'
                        : idx === 2
                        ? 'bg-orange-300 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    #{idx + 1}
                  </div>

                  <Hero3DPortrait heroId={entry.heroChoice} size={44} muscleLevel={entry.levelReached} />

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading font-extrabold text-sm text-slate-900">
                        {entry.playerName}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 text-[10px] font-bold"
                        title="Validado por el Árbitro"
                      >
                        🟩 {entry.greenCards}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-bold">
                      Nivel {entry.levelReached} · {entry.timestamp}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-sm text-amber-500 block">
                    🪙 {entry.coins.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">✓ Árbitro OK</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
