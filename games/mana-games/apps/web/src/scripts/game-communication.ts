import { statsService } from '../services/statsService';

export interface GameMessage {
  type: 'GAME_EVENT' | 'GAME_LOADED' | 'GAME_ENDED';
  gameId: string;
  event?: string;
  data?: any;
}

export function initGameCommunication(gameSlug: string) {
  let gameStartTime: number | null = null;
  
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    
    const message = event.data as GameMessage;
    if (!message.type || message.gameId !== gameSlug) return;
    
    switch (message.type) {
      case 'GAME_LOADED':
        gameStartTime = Date.now();
        statsService.incrementGamesPlayed(gameSlug);
        break;
        
      case 'GAME_EVENT':
        handleGameEvent(gameSlug, message.event!, message.data);
        break;
        
      case 'GAME_ENDED':
        if (gameStartTime) {
          const playTime = Math.floor((Date.now() - gameStartTime) / 1000);
          statsService.addPlayTime(gameSlug, playTime);
          gameStartTime = null;
        }
        break;
    }
  });
  
  window.addEventListener('beforeunload', () => {
    if (gameStartTime) {
      const playTime = Math.floor((Date.now() - gameStartTime) / 1000);
      statsService.addPlayTime(gameSlug, playTime);
    }
  });
}

function handleGameEvent(gameId: string, event: string, data: any) {
  switch (event) {
    case 'SCORE_UPDATE':
      if (data.score) {
        statsService.updateStats(gameId, {
          lastScore: data.score
        });
      }
      break;
      
    case 'ACHIEVEMENT_UNLOCKED':
      if (data.achievement) {
        statsService.unlockAchievement(gameId, data.achievement);
      }
      break;
      
    case 'GAME_OVER':
      if (data.score) {
        statsService.updateStats(gameId, {
          lastScore: data.score
        });
      }
      break;
  }
}