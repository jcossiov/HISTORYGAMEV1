import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  heroChoice: 'richard' | 'juan';
  levelReached: number;
  coins: number;
  greenCards: number;
  medalsCount: number;
  refereeVerified: boolean;
  timestamp: string;
}

const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'pub_1',
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
    id: 'pub_2',
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
    id: 'pub_3',
    playerName: 'Mateo_EcoPro',
    heroChoice: 'richard',
    levelReached: 9,
    coins: 900500,
    greenCards: 27,
    medalsCount: 9,
    refereeVerified: true,
    timestamp: 'Hace 11 min',
  },
  {
    id: 'pub_4',
    playerName: 'Sofia_Estrella',
    heroChoice: 'juan',
    levelReached: 7,
    coins: 700300,
    greenCards: 21,
    medalsCount: 7,
    refereeVerified: true,
    timestamp: 'Hace 18 min',
  },
  {
    id: 'pub_5',
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

let publicLeaderboard: LeaderboardEntry[] = [...INITIAL_LEADERBOARD];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Public Server Status & Referee Health Check
  app.get('/api/server-status', (_req, res) => {
    res.json({
      status: 'online',
      region: 'Global Kids Eco-Server #1',
      tickRate: '60 FPS',
      refereeActive: true,
      refereeName: 'Don Justo (Árbitro Oficial 3D)',
      playersOnline: 128 + publicLeaderboard.length,
    });
  });

  // Get Public Leaderboard
  app.get('/api/leaderboard', (_req, res) => {
    const sorted = [...publicLeaderboard].sort((a, b) => {
      if (b.levelReached !== a.levelReached) return b.levelReached - a.levelReached;
      return b.coins - a.coins;
    });
    res.json({ leaderboard: sorted.slice(0, 20) });
  });

  // Referee Score Certification & Submission
  app.post('/api/submit-score', (req, res) => {
    const {
      playerName,
      heroChoice = 'richard',
      levelReached = 1,
      coins = 100000,
      greenCards = 3,
      medalsCount = 1,
    } = req.body || {};

    const cleanName = String(playerName || 'Guardián').trim().slice(0, 20) || 'Guardián';

    const existingIdx = publicLeaderboard.findIndex(
      (e) => e.playerName.toLowerCase() === cleanName.toLowerCase()
    );

    const entry: LeaderboardEntry = {
      id: `pub_${Date.now()}`,
      playerName: cleanName,
      heroChoice: heroChoice === 'juan' ? 'juan' : 'richard',
      levelReached: Math.max(1, Math.min(15, Number(levelReached) || 1)),
      coins: Math.max(0, Number(coins) || 0),
      greenCards: Math.max(1, Number(greenCards) || 1),
      medalsCount: Math.max(0, Number(medalsCount) || 0),
      refereeVerified: true,
      timestamp: 'Ahora mismo',
    };

    if (existingIdx >= 0) {
      publicLeaderboard[existingIdx] = {
        ...publicLeaderboard[existingIdx],
        heroChoice: entry.heroChoice,
        levelReached: Math.max(publicLeaderboard[existingIdx].levelReached, entry.levelReached),
        coins: Math.max(publicLeaderboard[existingIdx].coins, entry.coins),
        greenCards: Math.max(publicLeaderboard[existingIdx].greenCards, entry.greenCards),
        medalsCount: Math.max(publicLeaderboard[existingIdx].medalsCount, entry.medalsCount),
        timestamp: 'Ahora mismo',
      };
    } else {
      publicLeaderboard.unshift(entry);
    }

    const sorted = [...publicLeaderboard].sort((a, b) => {
      if (b.levelReached !== a.levelReached) return b.levelReached - a.levelReached;
      return b.coins - a.coins;
    });

    res.json({
      success: true,
      certifiedBy: 'Don Justo - Árbitro Oficial',
      leaderboard: sorted.slice(0, 20),
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`History Game Public Server running on http://localhost:${PORT}`);
  });
}

startServer();
