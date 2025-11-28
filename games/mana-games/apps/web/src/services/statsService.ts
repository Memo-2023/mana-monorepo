export interface GameStats {
  gameId: string;
  highScore: number;
  lastScore: number;
  gamesPlayed: number;
  totalPlayTime: number;
  lastPlayed: string;
  achievements?: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt?: string;
}

export interface GlobalStats {
  totalGamesPlayed: number;
  totalPlayTime: number;
  favoriteGame?: string;
  lastPlayedGame?: string;
  gamesWithStats: number;
}

class StatsService {
  private readonly STATS_KEY = 'mana-games-stats';

  private getStoredStats(): Record<string, GameStats> {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(this.STATS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading stats:', error);
      return {};
    }
  }

  private saveStats(stats: Record<string, GameStats>): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  }

  getStats(gameId: string): GameStats | null {
    const allStats = this.getStoredStats();
    return allStats[gameId] || null;
  }

  updateStats(gameId: string, update: Partial<GameStats>): void {
    const allStats = this.getStoredStats();
    const currentStats = allStats[gameId] || {
      gameId,
      highScore: 0,
      lastScore: 0,
      gamesPlayed: 0,
      totalPlayTime: 0,
      lastPlayed: new Date().toISOString(),
      achievements: []
    };

    allStats[gameId] = {
      ...currentStats,
      ...update,
      gameId,
      lastPlayed: new Date().toISOString()
    };

    if (update.lastScore && update.lastScore > currentStats.highScore) {
      allStats[gameId].highScore = update.lastScore;
    }

    this.saveStats(allStats);
  }

  getAllStats(): Record<string, GameStats> {
    return this.getStoredStats();
  }

  getGlobalStats(): GlobalStats {
    const allStats = this.getStoredStats();
    const statsArray = Object.values(allStats);

    if (statsArray.length === 0) {
      return {
        totalGamesPlayed: 0,
        totalPlayTime: 0,
        gamesWithStats: 0
      };
    }

    const totalGamesPlayed = statsArray.reduce((sum, stat) => sum + stat.gamesPlayed, 0);
    const totalPlayTime = statsArray.reduce((sum, stat) => sum + stat.totalPlayTime, 0);

    const favoriteGame = statsArray.reduce((fav, stat) => 
      (!fav || stat.gamesPlayed > fav.gamesPlayed) ? stat : fav
    ).gameId;

    const lastPlayedGame = statsArray.reduce((last, stat) => 
      (!last || new Date(stat.lastPlayed) > new Date(last.lastPlayed)) ? stat : last
    ).gameId;

    return {
      totalGamesPlayed,
      totalPlayTime,
      favoriteGame,
      lastPlayedGame,
      gamesWithStats: statsArray.length
    };
  }

  incrementGamesPlayed(gameId: string): void {
    const stats = this.getStats(gameId) || {
      gameId,
      highScore: 0,
      lastScore: 0,
      gamesPlayed: 0,
      totalPlayTime: 0,
      lastPlayed: new Date().toISOString()
    };

    this.updateStats(gameId, {
      gamesPlayed: stats.gamesPlayed + 1
    });
  }

  addPlayTime(gameId: string, seconds: number): void {
    const stats = this.getStats(gameId) || {
      gameId,
      highScore: 0,
      lastScore: 0,
      gamesPlayed: 0,
      totalPlayTime: 0,
      lastPlayed: new Date().toISOString()
    };

    this.updateStats(gameId, {
      totalPlayTime: stats.totalPlayTime + seconds
    });
  }

  unlockAchievement(gameId: string, achievement: Achievement): void {
    const stats = this.getStats(gameId);
    if (!stats) return;

    const achievements = stats.achievements || [];
    const exists = achievements.find(a => a.id === achievement.id);
    
    if (!exists) {
      achievements.push({
        ...achievement,
        unlockedAt: new Date().toISOString()
      });

      this.updateStats(gameId, { achievements });
    }
  }

  formatPlayTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `Vor ${diffMins} Minuten`;
    if (diffHours < 24) return `Vor ${diffHours} Stunden`;
    if (diffDays < 7) return `Vor ${diffDays} Tagen`;
    
    return date.toLocaleDateString('de-DE');
  }
}

export const statsService = new StatsService();