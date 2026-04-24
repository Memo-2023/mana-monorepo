/**
 * Writing generations store — orchestrates the "Generate" button end-to-end.
 *
 * startDraftGeneration flow:
 *   1. Write a LocalGeneration with status='queued' → UI shows pending.
 *   2. Build the prompt from the draft's briefing + any attached style.
 *   3. Flip to status='running', call the mana-api /generations endpoint.
 *   4. On success: create a new LocalDraftVersion with the output, point
 *      the draft at it (currentVersionId flip), mark generation succeeded
 *      and link it to the version.
 *   5. On failure: mark generation failed with the error message so the
 *      UI can surface it; leave the current version untouched.
 *
 * Selection-refinements (M6) will add a second entrypoint that writes
 * back into the same current version in-place.
 */

import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { generationTable, draftTable, draftVersionTable, writingStyleTable } from '../collections';
import { callWritingGeneration } from '../api';
import { buildDraftPrompt, estimateMaxTokens } from '../utils/prompt-builder';
import { getStylePreset } from '../presets/styles';
import type {
	LocalDraftVersion,
	LocalGeneration,
	LocalWritingStyle,
	GenerationKind,
	GenerationProvider,
} from '../types';

const PROVIDER: GenerationProvider = 'mana-llm';

function wordCountOf(text: string): number {
	const trimmed = text.trim();
	if (!trimmed) return 0;
	return trimmed.split(/\s+/).length;
}

async function loadStyle(styleId: string | null | undefined): Promise<LocalWritingStyle | null> {
	if (!styleId) return null;
	const row = await writingStyleTable.get(styleId);
	return row && !row.deletedAt ? row : null;
}

async function nextVersionNumber(draftId: string): Promise<number> {
	const existing = await draftVersionTable.where('draftId').equals(draftId).toArray();
	return Math.max(0, ...existing.map((v) => v.versionNumber)) + 1;
}

export interface StartDraftGenerationOptions {
	/** Override the default ghostwriter temperature (0.7). */
	temperature?: number;
	/** Override the auto-computed max-token ceiling. */
	maxTokens?: number;
	/** Override the default model. Leave unset to use the server default. */
	model?: string;
}

export const generationsStore = {
	/**
	 * Generate a fresh draft from the briefing attached to the draft.
	 * Writes a new LocalDraftVersion and points the draft at it on success.
	 * Returns the generation id so the caller can subscribe for UI status.
	 */
	async startDraftGeneration(
		draftId: string,
		opts: StartDraftGenerationOptions = {}
	): Promise<string> {
		const draft = await draftTable.get(draftId);
		if (!draft) throw new Error(`Draft ${draftId} not found`);

		const generationId = crypto.randomUUID();
		const kind: GenerationKind =
			draft.currentVersionId &&
			(await draftVersionTable.get(draft.currentVersionId))?.content?.trim()
				? 'full-regenerate'
				: 'draft-from-brief';
		const style = await loadStyle(draft.styleId);
		const stylePreset =
			style?.source === 'preset' && style.presetId ? getStylePreset(style.presetId) : undefined;

		const { system, user } = buildDraftPrompt({
			kind: draft.kind,
			title: draft.title,
			briefing: draft.briefing,
			stylePreset,
			styleExtracted: style?.extractedPrinciples ?? undefined,
		});

		const maxTokens = opts.maxTokens ?? estimateMaxTokens(draft.briefing);
		const temperature = opts.temperature ?? 0.7;

		// 1. Queued record. Prompt is stored so a later audit knows exactly
		//    what went to the model; it's encrypted alongside the output.
		const now = new Date().toISOString();
		const queued: LocalGeneration = {
			id: generationId,
			draftId,
			kind,
			status: 'queued',
			prompt: `SYSTEM:\n${system}\n\nUSER:\n${user}`,
			provider: PROVIDER,
			model: opts.model ?? null,
			params: { temperature, maxTokens },
			inputSelection: null,
			output: null,
			outputVersionId: null,
			startedAt: null,
			completedAt: null,
			durationMs: null,
			tokenUsage: null,
			error: null,
			missionId: null,
		};
		await encryptRecord('writingGenerations', queued);
		await generationTable.add(queued);

		emitDomainEvent(
			'WritingDraftGenerationStarted',
			'writing',
			'writingGenerations',
			generationId,
			{ generationId, draftId, kind }
		);

		// 2. Flip to running before the fetch so the UI gets a progress tick.
		await generationTable.update(generationId, {
			status: 'running',
			startedAt: now,
			updatedAt: new Date().toISOString(),
		});
		await draftTable.update(draftId, {
			status: 'refining',
			updatedAt: new Date().toISOString(),
		});

		try {
			const result = await callWritingGeneration({
				systemPrompt: system,
				userPrompt: user,
				kind: draft.kind,
				temperature,
				maxTokens,
				model: opts.model,
			});

			const versionId = crypto.randomUUID();
			const versionNumber = await nextVersionNumber(draftId);
			const newVersion: LocalDraftVersion = {
				id: versionId,
				draftId,
				versionNumber,
				content: result.output,
				wordCount: wordCountOf(result.output),
				generationId,
				isAiGenerated: true,
				parentVersionId: draft.currentVersionId ?? null,
				summary: null,
			};
			await encryptRecord('writingDraftVersions', newVersion);
			await draftVersionTable.add(newVersion);

			const completedAt = new Date().toISOString();
			const successPatch: Record<string, unknown> = {
				status: 'succeeded',
				output: result.output,
				outputVersionId: versionId,
				model: result.model,
				tokenUsage: result.tokenUsage ?? null,
				completedAt,
				durationMs: result.durationMs,
				updatedAt: completedAt,
			};
			await encryptRecord('writingGenerations', successPatch);
			await generationTable.update(generationId, successPatch);

			// Point the draft at the new version. Keep status='refining'
			// because the user typically reviews + tweaks after a generate.
			await draftTable.update(draftId, {
				currentVersionId: versionId,
				updatedAt: completedAt,
			});

			emitDomainEvent('WritingDraftVersionCreated', 'writing', 'writingDraftVersions', versionId, {
				draftId,
				versionId,
				versionNumber,
				isAiGenerated: true,
				generationId,
			});

			return generationId;
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			const completedAt = new Date().toISOString();
			await generationTable.update(generationId, {
				status: 'failed',
				error: message,
				completedAt,
				durationMs: Date.now() - new Date(now).getTime(),
				updatedAt: completedAt,
			});
			emitDomainEvent(
				'WritingDraftGenerationFailed',
				'writing',
				'writingGenerations',
				generationId,
				{ generationId, draftId, error: message }
			);
			throw err;
		}
	},

	/**
	 * Mark a generation as cancelled client-side. We don't abort the
	 * server call in M3 (the fetch runs to completion and the result is
	 * just ignored); a proper AbortSignal pass-through can come with the
	 * streaming path in M7.
	 */
	async cancelGeneration(generationId: string) {
		const existing = await generationTable.get(generationId);
		if (!existing) return;
		if (existing.status === 'succeeded' || existing.status === 'failed') return;
		await generationTable.update(generationId, {
			status: 'cancelled',
			completedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},
};
