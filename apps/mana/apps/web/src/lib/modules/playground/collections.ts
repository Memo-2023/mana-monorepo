/**
 * Playground module — collection accessors.
 *
 * Only one table: snippets (saved system prompts). The chat history
 * itself is intentionally NOT persisted — playground is for one-off
 * exploration; chat module owns the persisted-conversation surface.
 */

import { db } from '$lib/data/database';
import type { LocalPlaygroundSnippet } from './types';

export const playgroundSnippetTable = db.table<LocalPlaygroundSnippet>('playgroundSnippets');
