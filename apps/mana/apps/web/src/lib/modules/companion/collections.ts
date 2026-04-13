import { db } from '$lib/data/database';
import type { LocalConversation, LocalMessage } from './types';

export const conversationTable = db.table<LocalConversation>('companionConversations');
export const messageTable = db.table<LocalMessage>('companionMessages');
