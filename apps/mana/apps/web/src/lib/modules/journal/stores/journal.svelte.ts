/**
 * Journal Store — Mutation-Only Service
 *
 * Title and content are encrypted at rest. Tags, mood, entryDate,
 * isPinned/isArchived/isFavorite stay plaintext for indexing.
 */

import { journalEntryTable } from '../collections';
import { toJournalEntry } from '../queries';
import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { transcribeAudio } from '$lib/voice/transcribe';
import type { JournalEntry, JournalMood, LocalJournalEntry } from '../types';

function todayIsoDate(): string {
	return new Date().toISOString().slice(0, 10);
}

function countWords(text: string): number {
	return text
		.trim()
		.split(/\s+/)
		.filter((w) => w.length > 0).length;
}

export const journalStore = {
	async createEntry(data: {
		title?: string | null;
		content?: string;
		entryDate?: string;
		mood?: JournalMood | null;
		tags?: string[];
	}): Promise<JournalEntry> {
		const content = data.content ?? '';

		const newLocal: LocalJournalEntry = {
			id: crypto.randomUUID(),
			title: data.title ?? null,
			content,
			entryDate: data.entryDate ?? todayIsoDate(),
			mood: data.mood ?? null,
			tags: data.tags ?? [],
			isPinned: false,
			isArchived: false,
			isFavorite: false,
			wordCount: countWords(content),
		};

		const plaintextSnapshot = toJournalEntry(newLocal);
		await encryptRecord('journalEntries', newLocal);
		await journalEntryTable.add(newLocal);
		emitDomainEvent('JournalEntryCreated', 'journal', 'journalEntries', newLocal.id, {
			entryId: newLocal.id,
			title: data.title ?? undefined,
			mood: data.mood ?? undefined,
			hasContent: content.length > 0,
		});
		return plaintextSnapshot;
	},

	async updateEntry(
		id: string,
		data: Partial<
			Pick<
				LocalJournalEntry,
				| 'title'
				| 'content'
				| 'entryDate'
				| 'mood'
				| 'tags'
				| 'isPinned'
				| 'isArchived'
				| 'isFavorite'
			>
		>
	) {
		const diff: Partial<LocalJournalEntry> = {
			...data,
		};

		// Recompute word count when content changes
		if (data.content !== undefined) {
			diff.wordCount = countWords(data.content);
		}

		await encryptRecord('journalEntries', diff);
		await journalEntryTable.update(id, diff);
	},

	/**
	 * Create an entry from a voice recording. Returns the placeholder
	 * immediately so the UI can open the editor; the transcript is
	 * filled in asynchronously once mana-stt returns.
	 */
	async createFromVoice(blob: Blob, _durationMs: number, language = 'de'): Promise<JournalEntry> {
		const entry = await this.createEntry({ title: 'Spracheintrag', content: '\u2026' });
		void this.transcribeIntoEntry(entry.id, blob, language);
		return entry;
	},

	/**
	 * Upload an audio blob to /api/v1/voice/transcribe and write the
	 * transcript into an existing entry. On failure, surfaces the error
	 * inline as the entry content.
	 */
	async transcribeIntoEntry(entryId: string, blob: Blob, language?: string): Promise<void> {
		try {
			const result = await transcribeAudio(blob, language);
			const transcript = result.text;

			const firstLine = transcript.split('\n')[0]?.trim() ?? '';
			const title = firstLine.length > 0 && firstLine.length <= 80 ? firstLine : 'Spracheintrag';

			const diff: Partial<LocalJournalEntry> = {
				title,
				content: transcript,
				transcriptModel: result.model,
				wordCount: countWords(transcript),
			};
			await encryptRecord('journalEntries', diff);
			await journalEntryTable.update(entryId, diff);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			await this.updateEntry(entryId, {
				title: 'Spracheintrag (Fehler)',
				content: `Transkription fehlgeschlagen: ${msg}`,
			});
		}
	},

	async deleteEntry(id: string) {
		await journalEntryTable.update(id, {
			deletedAt: new Date().toISOString(),
		});
		emitDomainEvent('JournalEntryDeleted', 'journal', 'journalEntries', id, { entryId: id });
	},

	async togglePin(id: string) {
		const entry = await journalEntryTable.get(id);
		if (!entry) return;
		await journalEntryTable.update(id, {
			isPinned: !entry.isPinned,
		});
	},

	async toggleFavorite(id: string) {
		const entry = await journalEntryTable.get(id);
		if (!entry) return;
		await journalEntryTable.update(id, {
			isFavorite: !entry.isFavorite,
		});
	},

	async setMood(id: string, mood: JournalMood | null) {
		await journalEntryTable.update(id, {
			mood,
		});
		if (mood)
			emitDomainEvent('JournalMoodSet', 'journal', 'journalEntries', id, { entryId: id, mood });
	},

	async archiveEntry(id: string) {
		await journalEntryTable.update(id, {
			isArchived: true,
		});
	},
};
