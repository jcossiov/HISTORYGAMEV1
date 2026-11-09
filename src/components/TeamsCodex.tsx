import React, { useState } from 'react';
import { TeamSquad } from '../types/game';
import { INITIAL_TEAMS } from '../data/levelsData';
import { soundEffects } from '../utils/soundEffects';
import {
  Users,
  Award,
  Plus,
  Shield,
  Check,
  Globe,
  Sparkles,
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

  // Form for creating custom team
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-5xl w-full mx-auto shadow-2xl animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>SEDE DE EQUIPOS & SALÓN DE MEDALLAS</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Únete a brigadas comunitarias globales, forja tu propia escuadra y exhibe tus condecoraciones.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                soundEffects.playClickSound();
                setActiveTab('teams');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'teams'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Equipos Activos
            </button>
            <button
              onClick={() => {
                soundEffects.playClickSound();
                setActiveTab('create');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'create'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Crear Equipo
            </button>
            <button
              onClick={() => {
                soundEffects.playClickSound();
                setActiveTab('medals');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'medals'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Medallas ({playerMedals.length})
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 transition-colors"
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
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                team.isPlayerMember
                  ? 'bg-cyan-950/20 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-2 bg-slate-900 rounded-xl border border-slate-800">
                      {team.emblem}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white font-heading">{team.name}</h4>
                      <span className="text-[11px] text-cyan-400 font-mono">
                        {team.membersCount} Guardianes · {team.reputation} Reputación
                      </span>
                    </div>
                  </div>
                  {team.isPlayerMember && (
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border border-cyan-500/40">
                      <Check className="w-3 h-3" /> Tu Equipo
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 italic mb-2">"{team.motto}"</p>

                <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <span>Causa Principal:</span>
                  <span className="font-semibold text-slate-200">{team.primaryCause}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Bonus de Equipo: +10% Monedas</span>
                {!team.isPlayerMember && (
                  <button
                    onClick={() => handleJoinTeam(team.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                  >
                    Unirse a Brigada
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
            <label className="text-xs font-semibold text-slate-300 block mb-1 uppercase tracking-wider">
              Nombre de tu Escuadra
            </label>
            <input
              type="text"
              required
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Ej: Centinelas del Viento, Alianza Verde..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1 uppercase tracking-wider">
              Lema de Vida / Misión
            </label>
            <input
              type="text"
              required
              value={newTeamMotto}
              onChange={(e) => setNewTeamMotto(e.target.value)}
              placeholder="Ej: Construyendo paz a través de pequeñas acciones diarias."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 uppercase tracking-wider">
                Emblema
              </label>
              <div className="flex gap-2">
                {['🌟', '🛡️', '🌱', '🕊️', '⚡', '🦅'].map((emb) => (
                  <button
                    key={emb}
                    type="button"
                    onClick={() => setNewTeamEmblem(emb)}
                    className={`w-9 h-9 rounded-lg text-lg border flex items-center justify-center transition-all ${
                      newTeamEmblem === emb
                        ? 'bg-cyan-500/20 border-cyan-400 ring-1 ring-cyan-400'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    {emb}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 uppercase tracking-wider">
                Causa Primaria
              </label>
              <select
                value={newTeamCause}
                onChange={(e) => setNewTeamCause(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="Cero Basura & Reforestación">Cero Basura & Reforestación</option>
                <option value="Solidaridad & Cero Violencia">Solidaridad & Cero Violencia</option>
                <option value="Cero Hambre & Nutrición">Cero Hambre & Nutrición</option>
                <option value="Tecnología Limpia & Robótica">Tecnología Limpia & Robótica</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Fundar Escuadra de Héroes</span>
          </button>
        </form>
      )}

      {/* MEDALS HALL OF FAME TAB */}
      {activeTab === 'medals' && (
        <div>
          {playerMedals.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
              <Award className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                Aún no has desbloqueado medallas. Completa los niveles de hábitos y derrota a los villanos para
                ganarlas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {playerMedals.map((medal, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-emerald-500/40 bg-slate-950/80 flex items-center gap-3 shadow-md"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-200 truncate">{medal}</h5>
                    <span className="text-[10px] text-emerald-400 font-mono">Condecoración Oficial</span>
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
