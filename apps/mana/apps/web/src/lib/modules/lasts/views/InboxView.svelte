<!--
  Lasts — Inbox View

  Displays AI-inferred candidates (suspected with inferredFrom != null)
  awaiting user review. Two actions per row:
    - Akzeptieren → strips inferredFrom, entry stays as suspected
      in the main feed (user vouches for it).
    - Verwerfen → soft-delete + cooldown so the same candidate
      isn't re-suggested for ~12 months.

  "Jetzt scannen" button manually triggers the inference engine.
  Cron-based auto-scans land in M5 (mana-ai mission).
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { useInboxLasts } from '../queries';
	import { lastsStore } from '../stores/items.svelte';
	import { CATEGORY_COLORS, CATEGORY_LABELS } from '../types';

	let inbox$ = useInboxLasts();
	let inbox = $derived(inbox$.value);

	let scanning = $state(false);
	let scanSummary = $state<string | null>(null);

	async function handleScan() {
		if (scanning) return;
		scanning = true;
		scanSummary = null;
		try {
			const result = await lastsStore.suggestLasts();
			scanSummary = $_('lasts.inbox.scanSummary', {
				values: {
					written: result.written,
					cooldown: result.cooldownFiltered,
					existing: result.existingFiltered,
				},
			});
		} finally {
			scanning = false;
		}
	}

	async function handleAccept(id: string) {
		await lastsStore.acceptCandidate(id);
		// Take user to the now-accepted entry so they can edit/confirm.
		goto(`/lasts/entry/${id}`);
	}

	async function handleDismiss(id: string) {
		await lastsStore.dismissCandidate(id);
	}

	function formatDate(iso: string | null): string {
		if (!iso) return '';
		return new Date(iso).toLocaleDateString('de-DE', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		});
	}
</script>

<section class="inbox">
	<header class="head">
		<div class="head-text">
			<h1 class="title">{$_('lasts.inbox.title')}</h1>
			<p class="tagline">{$_('lasts.inbox.tagline')}</p>
		</div>
		<button class="scan-btn" onclick={handleScan} disabled={scanning}>
			{scanning ? $_('lasts.inbox.scanning') : $_('lasts.inbox.scanNow')}
		</button>
	</header>

	{#if scanSummary}
		<p class="scan-summary">{scanSummary}</p>
	{/if}

	{#if inbox.length === 0}
		<p class="empty">{$_('lasts.inbox.empty')}</p>
	{:else}
		<ul class="entry-list">
			{#each inbox as last (last.id)}
				<li class="card">
					<div class="card-head">
						<span class="cat-dot" style="background: {CATEGORY_COLORS[last.category]}"></span>
						<span class="card-title">{last.title}</span>
					</div>
					<p class="card-meta">
						{#if last.inferredFrom?.frequencyHint}
							<span class="freq">{last.inferredFrom.frequencyHint}</span>
						{/if}
						{#if last.date}
							<span class="dot">{'·'}</span>
							<span>{formatDate(last.date)}</span>
						{/if}
						<span class="cat-label" style="color: {CATEGORY_COLORS[last.category]}">
							{CATEGORY_LABELS[last.category].de}
						</span>
					</p>
					<p class="provenance">
						{$_('lasts.detail.inferredFrom')}: <strong>{last.inferredFrom?.refTable}</strong>
					</p>
					<div class="actions">
						<button class="btn ghost" onclick={() => handleDismiss(last.id)}>
							{$_('lasts.inbox.dismiss')}
						</button>
						<button class="btn primary" onclick={() => handleAccept(last.id)}>
							{$_('lasts.inbox.accept')}
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.inbox {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		padding: 1rem;
		max-width: 720px;
		margin: 0 auto;
	}

	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.5rem;
	}
	.head-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.title {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0;
	}
	.tagline {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.scan-btn {
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-primary) / 0.4);
		background: hsl(var(--color-primary) / 0.08);
		color: hsl(var(--color-primary));
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}
	.scan-btn:hover:not(:disabled) {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}
	.scan-btn:disabled {
		opacity: 0.5;
		cursor: progress;
	}

	.scan-summary {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		padding: 0.375rem 0.625rem;
		border-left: 2px solid hsl(var(--color-primary) / 0.4);
		background: hsl(var(--color-primary) / 0.04);
		border-radius: 0 0.25rem 0.25rem 0;
		margin: 0;
	}

	.entry-list {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.card {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		border: 1px dashed hsl(var(--color-primary) / 0.3);
		background: hsl(var(--color-primary) / 0.02);
	}
	.card-head {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.cat-dot {
		width: 8px;
		height: 8px;
		border-radius: 9999px;
	}
	.card-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.card-meta {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}
	.freq {
		font-style: italic;
	}
	.dot {
		opacity: 0.5;
	}
	.cat-label {
		margin-left: auto;
		font-size: 0.5625rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-weight: 600;
	}
	.provenance {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.375rem;
		padding-top: 0.25rem;
	}
	.btn {
		padding: 0.25rem 0.625rem;
		border-radius: 0.25rem;
		font-size: 0.6875rem;
		font-weight: 600;
		cursor: pointer;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-foreground));
		transition: all 0.15s;
	}
	.btn:hover {
		background: hsl(var(--color-surface-hover));
	}
	.btn.primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: hsl(var(--color-primary));
	}
	.btn.primary:hover {
		filter: brightness(0.92);
	}
	.btn.ghost {
		color: hsl(var(--color-muted-foreground));
		border-color: transparent;
	}
	.btn.ghost:hover {
		color: hsl(var(--color-foreground));
	}

	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
