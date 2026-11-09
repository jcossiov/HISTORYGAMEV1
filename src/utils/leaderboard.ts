import { HeroId } from '../types/game';

export interface LeaderboardEntry {
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

const STORAGE_KEY = 'history_game_leaderboard_v1';

// Friendly seed records so the ranking never looks empty for kids.
const SEED_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'seed_1',
    playerName: 'Valeria_Solar',
    heroChoice: 'juan',
    levelReached: 15,
    coins: 1500400,
    greenCards: 42,
    medalsCount: 15,
    refereeVerified: true,
    timestamp: 'Hace 2 min',
  },
  {
    id: 'seed_2',
    playerName: 'Leo_Guardian',
    heroChoice: 'richard',
    levelReached: 12,
    coins: 1200800,
    greenCards: 35,
    medalsCount: 12,
    refereeVerified: true,
    timestamp: 'Hace 5 min',
  },
  {
    id: 'seed_3',
    playerName: 'Mateo_Eco',
    heroChoice: 'richard',
    levelReached: 9,
    coins: 900500,
    greenCards: 27,
    medalsCount: 9,
    refereeVerified: true,
    timestamp: 'Hace 11 min',
  },
  {
    id: 'seed_4',
    playerName: 'Sofi_Estrella',
    heroChoice: 'juan',
    levelReached: 7,
    coins: 700300,
    greenCards: 21,
    medalsCount: 7,
    refereeVerified: true,
    timestamp: 'Hace 18 min',
  },
  {
    id: 'seed_5',
    playerName: 'Lucas_Veloz',
    heroChoice: 'richard',
    levelReached: 5,
    coins: 500200,
    greenCards: 15,
    medalsCount: 5,
    refereeVerified: true,
    timestamp: 'Hace 25 min',
  },
];

function loadAll(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as LeaderboardEntry[];
    }
  } catch {
    // ignore corrupted storage
  }
  return [...SEED_LEADERBOARD];
}

function saveAll(entries: LeaderboardEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // storage full or blocked — the game still works, we just skip persisting
  }
}

function sortEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (b.levelReached !== a.levelReached) return b.levelReached - a.levelReached;
    return b.coins - a.coins;
  });
}

export function getLeaderboard(): LeaderboardEntry[] {
  return sortEntries(loadAll()).slice(0, 20);
}

export function submitScore(input: {
  playerName: string;
  heroChoice?: HeroId;
  levelReached?: number;
  coins?: number;
  greenCards?: number;
  medalsCount?: number;
}): LeaderboardEntry[] {
  const cleanName = String(input.playerName || 'Guardián').trim().slice(0, 20) || 'Guardián';
  const entries = loadAll();

  const entry: LeaderboardEntry = {
    id: `local_${Date.now()}`,
    playerName: cleanName,
    heroChoice: input.heroChoice === 'juan' ? 'juan' : 'richard',
    levelReached: Math.max(1, Math.min(15, Number(input.levelReached) || 1)),
    coins: Math.max(0, Number(input.coins) || 0),
    greenCards: Math.max(1, Number(input.greenCards) || 1),
    medalsCount: Math.max(0, Number(input.medalsCount) || 0),
    refereeVerified: true,
    timestamp: 'Ahora mismo',
  };

  const existingIdx = entries.findIndex(
    (e) => e.playerName.toLowerCase() === cleanName.toLowerCase()
  );

  if (existingIdx >= 0) {
    entries[existingIdx] = {
      ...entries[existingIdx],
      heroChoice: entry.heroChoice,
      levelReached: Math.max(entries[existingIdx].levelReached, entry.levelReached),
      coins: Math.max(entries[existingIdx].coins, entry.coins),
      greenCards: Math.max(entries[existingIdx].greenCards, entry.greenCards),
      medalsCount: Math.max(entries[existingIdx].medalsCount, entry.medalsCount),
      timestamp: 'Ahora mismo',
    };
  } else {
    entries.unshift(entry);
  }

  saveAll(entries);
  return sortEntries(entries).slice(0, 20);
}

export function getServerStatus(): { playersOnline: number } {
  // Static-friendly "online" count for the lobby status badge.
  return { playersOnline: 128 + getLeaderboard().length };
}
