// Export all schemas
export * from './decks.js';
export * from './cards.js';
export * from './studySessions.js';
export * from './cardProgress.js';
export * from './deckTemplates.js';
export * from './aiGenerations.js';
export * from './userStats.js';
export * from './dailyProgress.js';

// Re-export relations for use with Drizzle query builder
export { decksRelations } from './decks.js';
export { cardsRelations } from './cards.js';
export { studySessionsRelations } from './studySessions.js';
export { cardProgressRelations } from './cardProgress.js';
export { aiGenerationsRelations } from './aiGenerations.js';
