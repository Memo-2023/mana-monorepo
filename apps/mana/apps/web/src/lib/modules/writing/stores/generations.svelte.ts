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
import {
	buildDraftPrompt,
	buildShortenPrompt,
	buildExpandPrompt,
	buildChangeTonePrompt,
	buildRewritePrompt,
	buildTranslatePrompt,
	estimateMaxTokens,
	type SelectionContext,
	type ChangeToneParams,
	type RewriteParams,
	type TranslateParams,
} from '../utils/prompt-builder';
import { getStylePreset, type StylePreset } from '../presets/styles';
import type {
	LocalDraftVersion,
	LocalGeneration,
	LocalWritingStyle,
	DraftSelection,
	GenerationKind,
	GenerationProvider,
} from '../types';

const PROVIDER: GenerationProvider = 'mana-llm';

function wordCountOf(text: string): number {
	const trimmed = text.trim();
	if (!trimmed) return 0;
	return trimmed.split(/\s+/).length;
}

/**
 * Resolve the `draft.styleId` reference. A draft can point at either a
 * preset (serialised as `preset:<id>`, no Dexie row needed) or a custom
 * WritingStyle row (uuid). Presets are static code, so no DB write is
 * required for first-time selection — the picker just sets the id.
 */
async function loadStyle(
	styleId: string | null | undefined
): Promise<
	{ source: 'preset'; preset: StylePreset } | { source: 'custom'; row: LocalWritingStyle } | null
> {
	if (!styleId) return null;
	if (styleId.startsWith('preset:')) {
		const preset = getStylePreset(styleId.slice('preset:'.length));
		return preset ? { source: 'preset', preset } : null;
	}
	const row = await writingStyleTable.get(styleId);
	if (!row || row.deletedAt) return null;
	return { source: 'custom', row };
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
		const resolved = await loadStyle(draft.styleId);
		const stylePreset =
			resolved?.source === 'preset'
				? resolved.preset
				: resolved?.source === 'custom' && resolved.row.presetId
					? getStylePreset(resolved.row.presetId)
					: undefined;
		const styleExtracted =
			resolved?.source === 'custom' ? (resolved.row.extractedPrinciples ?? undefined) : undefined;

		const { system, user } = buildDraftPrompt({
			kind: draft.kind,
			title: draft.title,
			briefing: draft.briefing,
			stylePreset,
			styleExtracted,
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
	 * Run a selection-refinement against the LLM. Does NOT mutate the
	 * version — the UI decides whether to accept the result via
	 * `VersionEditor.applyReplacement()`. Returns the refined text so the
	 * RefinementPanel can render it alongside the original. The
	 * LocalGeneration record is written either way so every refine-attempt
	 * stays auditable, including rejected ones.
	 *
	 * `params` shape depends on `kind`:
	 *   - selection-shorten / selection-expand: no params
	 *   - selection-tone:                        { targetTone }
	 *   - selection-rewrite:                     { instruction }
	 *   - selection-translate:                   { targetLanguage }
	 */
	async refineSelection(
		draftId: string,
		versionId: string,
		selection: DraftSelection & { text: string },
		kind:
			| 'selection-shorten'
			| 'selection-expand'
			| 'selection-tone'
			| 'selection-rewrite'
			| 'selection-translate',
		params?: ChangeToneParams | RewriteParams | TranslateParams
	): Promise<{ generationId: string; refined: string }> {
		const draft = await draftTable.get(draftId);
		if (!draft) throw new Error(`Draft ${draftId} not found`);

		const resolved = await loadStyle(draft.styleId);
		const stylePreset =
			resolved?.source === 'preset'
				? resolved.preset
				: resolved?.source === 'custom' && resolved.row.presetId
					? getStylePreset(resolved.row.presetId)
					: undefined;
		const styleExtracted =
			resolved?.source === 'custom' ? (resolved.row.extractedPrinciples ?? undefined) : undefined;

		const ctx: SelectionContext = {
			selectionText: selection.text,
			language: draft.briefing.language,
			stylePreset,
			styleExtracted,
		};

		let prompt;
		switch (kind) {
			case 'selection-shorten':
				prompt = buildShortenPrompt(ctx);
				break;
			case 'selection-expand':
				prompt = buildExpandPrompt(ctx);
				break;
			case 'selection-tone':
				prompt = buildChangeTonePrompt(ctx, params as ChangeToneParams);
				break;
			case 'selection-rewrite':
				prompt = buildRewritePrompt(ctx, params as RewriteParams);
				break;
			case 'selection-translate':
				prompt = buildTranslatePrompt(ctx, params as TranslateParams);
				break;
		}

		// Size the token budget to the selection, not the whole draft —
		// the output is a replacement for the selected text, so the input
		// size is the right anchor. Leave 2x headroom for expand.
		const selectionWords = selection.text.trim().split(/\s+/).filter(Boolean).length;
		const maxTokens = Math.min(4000, Math.max(200, Math.round(selectionWords * 4 + 200)));
		// Refinements are deliberately less creative than fresh generations —
		// the user picked a narrow operation, don't wander.
		const temperature = 0.4;

		const generationId = crypto.randomUUID();
		const nowIso = new Date().toISOString();
		const queued: LocalGeneration = {
			id: generationId,
			draftId,
			kind,
			status: 'queued',
			prompt: `SYSTEM:\n${prompt.system}\n\nUSER:\n${prompt.user}`,
			provider: PROVIDER,
			model: null,
			params: { temperature, maxTokens },
			inputSelection: { start: selection.start, end: selection.end },
			output: null,
			outputVersionId: null,
			startedAt: nowIso,
			completedAt: null,
			durationMs: null,
			tokenUsage: null,
			error: null,
			missionId: null,
		};
		await encryptRecord('writingGenerations', queued);
		await generationTable.add(queued);

		emitDomainEvent(
			'WritingSelectionRefineStarted',
			'writing',
			'writingGenerations',
			generationId,
			{ generationId, draftId, versionId, kind }
		);

		await generationTable.update(generationId, {
			status: 'running',
			updatedAt: new Date().toISOString(),
		});

		try {
			const result = await callWritingGeneration({
				systemPrompt: prompt.system,
				userPrompt: prompt.user,
				kind,
				temperature,
				maxTokens,
			});
			const completedAt = new Date().toISOString();
			const successPatch: Record<string, unknown> = {
				status: 'succeeded',
				output: result.output,
				model: result.model,
				tokenUsage: result.tokenUsage ?? null,
				completedAt,
				durationMs: result.durationMs,
				updatedAt: completedAt,
			};
			await encryptRecord('writingGenerations', successPatch);
			await generationTable.update(generationId, successPatch);
			return { generationId, refined: result.output };
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			const completedAt = new Date().toISOString();
			await generationTable.update(generationId, {
				status: 'failed',
				error: message,
				completedAt,
				durationMs: Date.now() - new Date(nowIso).getTime(),
				updatedAt: completedAt,
			});
			throw err;
		}
	},

	/**
	 * Commit a refinement: replace the selection range in the current
	 * version's content with `replacement` and link the source generation
	 * to the updated version. Returns the pre-refinement content so the
	 * caller can offer a one-step undo.
	 */
	async applyRefinement(
		versionId: string,
		selection: DraftSelection,
		replacement: string,
		generationId: string
	): Promise<{ before: string; after: string }> {
		const existing = await draftVersionTable.get(versionId);
		if (!existing) throw new Error(`Version ${versionId} not found`);
		const before = existing.content;
		const after = before.slice(0, selection.start) + replacement + before.slice(selection.end);

		const wrapped: Record<string, unknown> = {
			content: after,
			wordCount: wordCountOf(after),
		};
		await encryptRecord('writingDraftVersions', wrapped);
		const now = new Date().toISOString();
		await draftVersionTable.update(versionId, { ...wrapped, updatedAt: now });
		await draftTable.update(existing.draftId, { updatedAt: now });

		// Mark the generation as "applied" by pointing it at the version
		// whose content it modified. The version isn't a new row — it's
		// the same version with replaced content — but having the back-
		// reference makes the generation record useful for audits.
		await generationTable.update(generationId, {
			outputVersionId: versionId,
			updatedAt: now,
		});

		emitDomainEvent('WritingSelectionRefineApplied', 'writing', 'writingDraftVersions', versionId, {
			versionId,
			draftId: existing.draftId,
			generationId,
		});

		return { before, after };
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
