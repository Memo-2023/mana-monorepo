<!--
  AiProposalInbox — renders pending AI proposals inline inside a module.

  Drop this component anywhere in a module page. It shows zero UI when no
  proposals are pending (so the module layout is unaffected when the AI is
  idle) and a list of approval cards when the AI has staged intents.

  Each card displays:
    - the rationale ("why" from the AI)
    - a human-readable preview of the intent (tool name + params)
    - Approve / Reject buttons that run `approveProposal` / `rejectProposal`
      and close themselves via Dexie's live query

  The cards use a "ghost" style (semi-transparent, dashed border) so they
  read as "not real yet" — inspired by Figma's multiplayer cursors and
  Google Docs suggestions.
-->
<script lang="ts">
	import { Check, X, Sparkle } from '@mana/shared-icons';
	import { useAiProposals } from '$lib/data/ai/proposals/queries';
	import { approveProposal, rejectProposal } from '$lib/data/ai/proposals/store';
	import { getTool } from '$lib/data/tools/registry';
	import type { Proposal } from '$lib/data/ai/proposals/types';

	interface Props {
		/** Filter proposals to tools belonging to this module (e.g. 'todo').
		 *  Omit when filtering by mission only — the inbox will then render
		 *  every pending proposal across modules and add a module badge to
		 *  each card so the user knows where it'll land on approve. */
		module?: string;
		/** Filter to proposals from a specific mission. Combine with `module`
		 *  to scope to that mission's proposals for a single module. */
		missionId?: string;
	}

	let { module, missionId }: Props = $props();

	const proposals = $derived(useAiProposals({ status: 'pending', module, missionId }));
	/** Show module badge whenever the inbox is cross-module (i.e. the
	 *  caller didn't pin it to a single module). */
	const showModuleBadge = $derived(!module);

	let busyId = $state<string | null>(null);
	/** Proposal whose reject-feedback textarea is currently open. */
	let rejectingId = $state<string | null>(null);
	let rejectDraft = $state('');

	async function handleApprove(p: Proposal) {
		busyId = p.id;
		try {
			await approveProposal(p.id);
		} catch (err) {
			console.error('[AiProposalInbox] approve failed:', err);
		} finally {
			busyId = null;
		}
	}

	function openRejectForm(p: Proposal) {
		rejectingId = p.id;
		rejectDraft = '';
	}

	function cancelReject() {
		rejectingId = null;
		rejectDraft = '';
	}

	async function confirmReject(p: Proposal) {
		busyId = p.id;
		try {
			// Trimmed feedback, or undefined when empty — downstream planner
			// sees the field as absent rather than as an empty string.
			const feedback = rejectDraft.trim().length > 0 ? rejectDraft.trim() : undefined;
			await rejectProposal(p.id, feedback);
			rejectingId = null;
			rejectDraft = '';
		} catch (err) {
			console.error('[AiProposalInbox] reject failed:', err);
		} finally {
			busyId = null;
		}
	}

	function formatIntent(p: Proposal): string {
		if (p.intent.kind !== 'toolCall') return JSON.stringify(p.intent);
		const tool = getTool(p.intent.toolName);
		const label = tool?.description ?? p.intent.toolName;
		const paramsPreview = Object.entries(p.intent.params)
			.filter(([, v]) => v !== undefined && v !== null && v !== '')
			.map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
			.join(' · ');
		return paramsPreview ? `${label} — ${paramsPreview}` : label;
	}
</script>

{#if proposals.value.length > 0}
	<section class="inbox" aria-label="Vorschläge der KI">
		{#each proposals.value as p (p.id)}
			<article class="card" class:busy={busyId === p.id}>
				<header class="header">
					<Sparkle size={16} weight="fill" />
					<span class="label">KI schlägt vor</span>
					{#if showModuleBadge && p.intent.kind === 'toolCall'}
						{@const mod = getTool(p.intent.toolName)?.module ?? '?'}
						<span class="module-badge">{mod}</span>
					{/if}
				</header>

				<p class="intent">{formatIntent(p)}</p>

				{#if p.rationale}
					<p class="rationale">{p.rationale}</p>
				{/if}

				{#if rejectingId === p.id}
					<form class="reject-form" onsubmit={(e) => (e.preventDefault(), confirmReject(p))}>
						<label class="reject-label" for={`reject-${p.id}`}>
							Warum ablehnen? (optional — hilft der KI beim nächsten Versuch)
						</label>
						<textarea
							id={`reject-${p.id}`}
							bind:value={rejectDraft}
							rows="2"
							placeholder="z.B. zu aggressiv, oder: falsches Datum gewählt"
						></textarea>
						<div class="reject-actions">
							<button type="button" class="btn" disabled={busyId !== null} onclick={cancelReject}>
								Abbrechen
							</button>
							<button type="submit" class="btn reject-confirm" disabled={busyId !== null}>
								Ablehnen
							</button>
						</div>
					</form>
				{:else}
					<footer class="actions">
						<button
							type="button"
							class="btn reject"
							disabled={busyId !== null}
							onclick={() => openRejectForm(p)}
							aria-label="Ablehnen"
						>
							<X size={16} weight="bold" />
							<span>Ablehnen</span>
						</button>
						<button
							type="button"
							class="btn approve"
							disabled={busyId !== null}
							onclick={() => handleApprove(p)}
							aria-label="Übernehmen"
						>
							<Check size={16} weight="bold" />
							<span>Übernehmen</span>
						</button>
					</footer>
				{/if}
			</article>
		{/each}
	</section>
{/if}

<style>
	.inbox {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.card {
		position: relative;
		padding: 0.75rem 1rem;
		border: 1px dashed color-mix(in oklab, var(--color-primary, #6b5bff) 55%, transparent);
		border-radius: 0.625rem;
		background: color-mix(in oklab, var(--color-primary, #6b5bff) 6%, var(--color-bg, transparent));
		transition: opacity 150ms ease;
	}

	.card.busy {
		opacity: 0.55;
		pointer-events: none;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		color: color-mix(in oklab, var(--color-primary, #6b5bff) 85%, var(--color-fg, #000));
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.module-badge {
		margin-left: auto;
		padding: 0.0625rem 0.375rem;
		border-radius: 0.25rem;
		background: color-mix(in oklab, var(--color-primary, #6b5bff) 18%, transparent);
		color: color-mix(in oklab, var(--color-primary, #6b5bff) 90%, var(--color-fg, #000));
		font-size: 0.6875rem;
		letter-spacing: 0.02em;
		text-transform: lowercase;
	}

	.intent {
		margin: 0.375rem 0 0;
		font-size: 0.9375rem;
		line-height: 1.4;
		color: var(--color-fg, inherit);
	}

	.rationale {
		margin: 0.25rem 0 0;
		font-size: 0.8125rem;
		line-height: 1.35;
		color: var(--color-muted, #666);
		font-style: italic;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.625rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border: 1px solid var(--color-border, #ddd);
		border-radius: 0.375rem;
		background: var(--color-bg, #fff);
		color: var(--color-fg, inherit);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 120ms ease,
			border-color 120ms ease;
	}

	.btn:hover:not(:disabled) {
		border-color: color-mix(in oklab, var(--color-fg, #000) 30%, transparent);
	}

	.btn:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.btn.approve {
		background: color-mix(in oklab, var(--color-primary, #6b5bff) 12%, var(--color-bg, #fff));
		border-color: color-mix(in oklab, var(--color-primary, #6b5bff) 45%, transparent);
		color: color-mix(in oklab, var(--color-primary, #6b5bff) 85%, var(--color-fg, #000));
	}

	.btn.approve:hover:not(:disabled) {
		background: color-mix(in oklab, var(--color-primary, #6b5bff) 20%, var(--color-bg, #fff));
	}

	.reject-form {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		margin-top: 0.625rem;
	}
	.reject-label {
		font-size: 0.75rem;
		color: var(--color-muted, #666);
	}
	.reject-form textarea {
		padding: 0.375rem 0.5rem;
		border: 1px solid var(--color-border, #ddd);
		border-radius: 0.375rem;
		font: inherit;
		resize: vertical;
		background: var(--color-bg, #fff);
		color: var(--color-fg, inherit);
	}
	.reject-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
	.btn.reject-confirm {
		background: #fff0f0;
		border-color: #e99;
		color: #8a1b1b;
	}
	.btn.reject-confirm:hover:not(:disabled) {
		background: #ffe4e4;
	}
</style>
