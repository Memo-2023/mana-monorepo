// Export all schemas
export * from './decks';
export * from './cards';
export * from './studySessions';
export * from './cardProgress';
export * from './deckTemplates';
export * from './aiGenerations';
export * from './userStats';
export * from './dailyProgress';

// Re-export relations for use with Drizzle query builder
export { decksRelations } from './decks';
export { cardsRelations } from './cards';
export { studySessionsRelations } from './studySessions';
export { cardProgressRelations } from './cardProgress';
export { aiGenerationsRelations } from './aiGenerations';
