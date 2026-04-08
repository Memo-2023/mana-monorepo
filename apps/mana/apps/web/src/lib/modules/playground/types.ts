/**
 * Playground module types.
 *
 * The playground itself is stateless (no chat history is persisted —
 * that's what the chat module is for), but the user can save reusable
 * **snippets**: a name, a system prompt, and the model + temperature
 * defaults to test it with. Snippets are the only persisted surface in
 * the module.
 */

import type { BaseRecord } from '@mana/local-store';

export interface LocalPlaygroundSnippet extends BaseRecord {
	/** User-given label, e.g. "JSON extractor" or "Tone of voice". */
	name: string;
	/** The actual system prompt text — the thing the user iterates on. */
	systemPrompt: string;
	/** Last model the snippet was used with. Used as the default when
	 *  the user clicks the snippet. */
	model: string;
	/** Last temperature the snippet was used with (0–2). */
	temperature: number;
	/** Pinned snippets sort to the top of the list. */
	isPinned?: boolean;
	/** Manual sort order within (pinned / unpinned) groups. */
	order?: number;
}

export interface PlaygroundSnippet {
	id: string;
	name: string;
	systemPrompt: string;
	model: string;
	temperature: number;
	isPinned: boolean;
	order: number;
	createdAt: string;
	updatedAt: string;
}
