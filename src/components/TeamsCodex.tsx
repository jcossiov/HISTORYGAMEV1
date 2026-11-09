import React, { useState } from 'react';
import { TeamSquad } from '../types/game';
import { INITIAL_TEAMS } from '../data/levelsData';
import { soundEffects } from '../utils/soundEffects';
import {
  Users,
  Award,
  Plus,
  Check,
  Trophy,
} from 'lucide-react';

interface TeamsCodexProps {
  playerMedals: string[];
  currentTeam: TeamSquad;
  onUpdateTeam: (team: TeamSquad) => void;
  onClose: () => void;
}

export const TeamsCodex: React.FC<TeamsCodexProps> = ({
  playerMedals,
  currentTeam,
  onUpdateTeam,
  onClose,
}) => {
  const [teams, setTeams] = useState<TeamSquad[]>(INITIAL_TEAMS);
  const [activeTab, setActiveTab] = useState<'teams' | 'medals' | 'create'>('teams');

  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamMotto, setNewTeamMotto] = useState<string>('');
  const [newTeamCause, setNewTeamCause] = useState<string>('Cero Basura & Reforestación');
  const [newTeamEmblem, setNewTeamEmblem] = useState<string>('🌟');

  const handleJoinTeam = (teamId: string) => {
    soundEffects.playCollectSound();
    const updated = teams.map((t) => ({
      ...t,
      isPlayerMember: t.id === teamId,
    }));
    setTeams(updated);

    const target = updated.find((t) => t.id === teamId);
    if (target) {
      onUpdateTeam(target);
    }
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !newTeamMotto.trim()) return;

    soundEffects.playCollectSound();
    const created: TeamSquad = {
      id: `team_${Date.now()}`,
      name: newTeamName.trim(),
      motto: newTeamMotto.trim(),
      emblem: newTeamEmblem,
      membersCount: 1,
      reputation: 100,
      primaryCause: newTeamCause,
      isPlayerMember: true,
    };

    const nextTeams = [created, ...teams.map((t) => ({ ...t, isPlayerMember: false }))];
    setTeams(nextTeams);
    onUpdateTeam(created);
    setActiveTab('teams');
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-5xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200/60 pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-500" />
            <span>Brigadas y Medallas</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Únete a una causa comunitaria por Medellín y colecciona tus medallas oficiales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-sky-50 p-1 rounded-xl border border-sky-100">
            <button
              onClick={() => {
                soundEffects.playClickSound();
                setActiveTab('teams');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'teams'
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Equipos
            </button>
            <button
              onClick={() => {
                soundEffects.playClickSound();
                setActiveTab('create');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'create'
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Crear equipo
            </button>
            <button
              onClick={() => {
                soundEffects.playClickSound();
                setActiveTab('medals');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'medals'
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Medallas ({playerMedals.length})
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-100 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* TEAMS TAB */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                team.isPlayerMember
                  ? 'bg-sky-50 border-sky-300 shadow-sm'
                  : 'bg-white border-sky-100 hover:border-sky-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-2 bg-white rounded-xl border border-sky-100 shadow-sm">
                      {team.emblem}
                    </span>
                    <div>
                      <h4 className="text-sm font-heading font-extrabold text-slate-900">{team.name}</h4>
                      <span className="text-[11px] text-sky-600 font-bold">
                        {team.membersCount} Guardianes · {team.reputation} Puntos
                      </span>
                    </div>
                  </div>
                  {team.isPlayerMember && (
                    <span className="text-[10px] bg-sky-100 text-sky-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-sky-200">
                      <Check className="w-3 h-3" /> Tu equipo
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 italic mb-2">"{team.motto}"</p>

                <div className="text-[11px] text-slate-500 bg-sky-50 p-2 rounded-lg border border-sky-100 flex items-center justify-between">
                  <span>Causa:</span>
                  <span className="font-bold text-slate-700">{team.primaryCause}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-sky-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold">Bonus: +10% monedas</span>
                {!team.isPlayerMember && (
                  <button
                    onClick={() => handleJoinTeam(team.id)}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Unirse
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE TEAM TAB */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateTeam} className="max-w-xl mx-auto flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">
              Nombre de tu equipo
            </label>
            <input
              type="text"
              required
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Ej: Centinelas del Viento, Alianza Verde…"
              className="w-full px-4 py-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">
              Lema / misión
            </label>
            <input
              type="text"
              required
              value={newTeamMotto}
              onChange={(e) => setNewTeamMotto(e.target.value)}
              placeholder="Ej: Cuidar el planeta con pequeñas acciones."
              className="w-full px-4 py-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                Emblema
              </label>
              <div className="flex flex-wrap gap-2">
                {['🌟', '🛡️', '🌱', '🕊️', '⚡', '🦅'].map((emb) => (
                  <button
                    key={emb}
                    type="button"
                    onClick={() => setNewTeamEmblem(emb)}
                    className={`w-9 h-9 rounded-lg text-lg border flex items-center justify-center transition-all ${
                      newTeamEmblem === emb
                        ? 'bg-sky-100 border-sky-400 ring-1 ring-sky-400'
                        : 'bg-white border-sky-200'
                    }`}
                  >
                    {emb}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                Causa principal
              </label>
              <select
                value={newTeamCause}
                onChange={(e) => setNewTeamCause(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-sky-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="Cero Basura & Reforestación">Cero Basura & Reforestación</option>
                <option value="Solidaridad & Cero Violencia">Solidaridad & Paz</option>
                <option value="Cero Hambre & Nutrición">Comida para todos</option>
                <option value="Tecnología Limpia & Robótica">Tecnología limpia</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 py-3 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Crear mi equipo</span>
          </button>
        </form>
      )}

      {/* MEDALS TAB */}
      {activeTab === 'medals' && (
        <div>
          {playerMedals.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-sky-200 rounded-2xl bg-sky-50/50">
              <Award className="w-10 h-10 text-sky-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">
                Todavía no tienes medallas. ¡Completa los niveles para ganarlas!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {playerMedals.map((medal, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 flex items-center gap-3 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-800 truncate">{medal}</h5>
                    <span className="text-[10px] text-emerald-600 font-bold">Medalla oficial</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
