<!--
  Augur — DueBanner

  Surfaces entries whose reminder date has passed and outcome is still
  'open'. Two states:
    - Collapsed: a one-line banner "X Zeichen warten auf deine Aufloesung".
    - Expanded: inline list with quick-resolve buttons, ordered by
      most-overdue first.

  Click a row → navigates to detail. The quick "ja/teils/nein" buttons
  resolve in-place without a note (use detail for the full flow).
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { augurStore } from '../stores/entries.svelte';
	import { reminderDate, daysUntilDue } from '../lib/reminders';
	import type { AugurEntry, AugurOutcome } from '../types';

	let { entries }: { entries: AugurEntry[] } = $props();

	let expanded = $state(false);

	const T = {
		single: 'Zeichen wartet auf Aufloesung',
		plural: 'Zeichen warten auf Aufloesung',
		hide: 'verbergen',
		show: 'oeffnen',
		yes: 'ja',
		partly: 'teils',
		no: 'nein',
		overdue: 'Tage faellig',
		dueToday: 'heute',
	} as const;

	function dueLabel(e: AugurEntry): string {
		const d = daysUntilDue(e);
		if (d == null) return '';
		if (d === 0) return T.dueToday;
		if (d < 0) return `${-d} ${T.overdue}`;
		return reminderDate(e) ?? '';
	}

	async function quickResolve(id: string, outcome: AugurOutcome) {
		await augurStore.resolveEntry(id, outcome, null);
	}
</script>

{#if entries.length > 0}
	<div class="banner" class:expanded>
		<button type="button" class="header" onclick={() => (expanded = !expanded)}>
			<span class="dot"></span>
			<span class="text">
				<strong>{entries.length}</strong>
				{entries.length === 1 ? T.single : T.plural}
			</span>
			<span class="toggle">{expanded ? T.hide : T.show}</span>
		</button>

		{#if expanded}
			<ul class="list">
				{#each entries as entry (entry.id)}
					<li class="row">
						<button type="button" class="row-main" onclick={() => goto(`/augur/entry/${entry.id}`)}>
							<span class="row-source">{entry.source}</span>
							<span class="row-claim">{entry.claim}</span>
							<span class="row-due">{dueLabel(entry)}</span>
						</button>
						<div class="row-actions">
							<button
								type="button"
								class="qb yes"
								onclick={() => quickResolve(entry.id, 'fulfilled')}
								title={T.yes}
							>
								✓
							</button>
							<button
								type="button"
								class="qb partly"
								onclick={() => quickResolve(entry.id, 'partly')}
								title={T.partly}
							>
								~
							</button>
							<button
								type="button"
								class="qb no"
								onclick={() => quickResolve(entry.id, 'not-fulfilled')}
								title={T.no}
							>
								✗
							</button>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{/if}

<style>
	.banner {
		border-radius: 0.75rem;
		border: 1px solid color-mix(in srgb, #f59e0b 35%, transparent);
		background: color-mix(in srgb, #f59e0b 10%, transparent);
		overflow: hidden;
	}
	.header {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		width: 100%;
		padding: 0.65rem 0.85rem;
		background: transparent;
		border: 0;
		cursor: pointer;
		font: inherit;
		color: var(--color-text, inherit);
		text-align: left;
	}
	.dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 999px;
		background: #f59e0b;
		box-shadow: 0 0 0 4px color-mix(in srgb, #f59e0b 22%, transparent);
		flex-shrink: 0;
	}
	.text {
		flex: 1;
		font-size: 0.92rem;
		color: #fcd34d;
	}
	.text strong {
		font-weight: 600;
		color: #fde68a;
		margin-right: 0.2rem;
	}
	.toggle {
		font-size: 0.78rem;
		opacity: 0.75;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid color-mix(in srgb, #f59e0b 25%, transparent);
		display: flex;
		flex-direction: column;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.55rem 0.85rem;
		border-bottom: 1px solid color-mix(in srgb, #f59e0b 12%, transparent);
	}
	.row:last-child {
		border-bottom: 0;
	}
	.row-main {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr 1.4fr auto;
		gap: 0.6rem;
		align-items: center;
		background: transparent;
		border: 0;
		cursor: pointer;
		font: inherit;
		color: var(--color-text, inherit);
		text-align: left;
		padding: 0;
	}
	.row-main:hover .row-source {
		text-decoration: underline;
	}
	.row-source {
		font-size: 0.9rem;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.row-claim {
		font-size: 0.85rem;
		opacity: 0.75;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.row-due {
		font-size: 0.78rem;
		color: #fcd34d;
		white-space: nowrap;
	}
	.row-actions {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}
	.qb {
		width: 1.85rem;
		height: 1.85rem;
		border-radius: 0.45rem;
		font: inherit;
		font-size: 0.95rem;
		cursor: pointer;
		border: 1px solid transparent;
	}
	.qb.yes {
		background: color-mix(in srgb, #10b981 18%, transparent);
		border-color: color-mix(in srgb, #10b981 50%, transparent);
		color: #6ee7b7;
	}
	.qb.partly {
		background: color-mix(in srgb, #f59e0b 18%, transparent);
		border-color: color-mix(in srgb, #f59e0b 50%, transparent);
		color: #fcd34d;
	}
	.qb.no {
		background: color-mix(in srgb, #ef4444 18%, transparent);
		border-color: color-mix(in srgb, #ef4444 50%, transparent);
		color: #fca5a5;
	}

	@media (max-width: 36rem) {
		.row-main {
			grid-template-columns: 1fr auto;
		}
		.row-claim {
			display: none;
		}
	}
</style>
