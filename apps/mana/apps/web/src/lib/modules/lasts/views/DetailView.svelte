<!--
  Lasts — Detail View

  Always-editable single-entry view. Field changes save immediately on
  blur (text) or change (selects, status pills). Lifecycle buttons drive
  status transitions (suspected → confirmed, confirmed → reclaimed).
  Delete + back at the top.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { lastsStore } from '../stores/items.svelte';
	import { CATEGORY_COLORS, CATEGORY_LABELS, CONFIDENCE_LABELS, STATUS_LABELS } from '../types';
	import type { Last, LastCategory, LastConfidence, WouldReclaim } from '../types';
	import { MILESTONE_CATEGORIES } from '$lib/data/milestones/categories';
	import {
		VisibilityPicker,
		SharedLinkControls,
		buildShareUrl,
		type VisibilityLevel,
	} from '@mana/shared-privacy';

	let { entry }: { entry: Last } = $props();

	// Local form state, seeded from the entry. Saves on blur / change.
	// The $effect below re-syncs whenever a different entry id is loaded.
	/* svelte-ignore state_referenced_locally */
	let title = $state(entry.title);
	/* svelte-ignore state_referenced_locally */
	let category = $state<LastCategory>(entry.category);
	/* svelte-ignore state_referenced_locally */
	let date = $state(entry.date ?? '');
	/* svelte-ignore state_referenced_locally */
	let confidence = $state<LastConfidence | null>(entry.confidence);
	/* svelte-ignore state_referenced_locally */
	let meaning = $state(entry.meaning ?? '');
	/* svelte-ignore state_referenced_locally */
	let whatIKnewThen = $state(entry.whatIKnewThen ?? '');
	/* svelte-ignore state_referenced_locally */
	let whatIKnowNow = $state(entry.whatIKnowNow ?? '');
	/* svelte-ignore state_referenced_locally */
	let note = $state(entry.note ?? '');
	/* svelte-ignore state_referenced_locally */
	let tenderness = $state<number | null>(entry.tenderness);
	/* svelte-ignore state_referenced_locally */
	let wouldReclaim = $state<WouldReclaim | null>(entry.wouldReclaim);

	// Reclaim flow state — inline form opens when user clicks "Aufheben".
	let reclaimOpen = $state(false);
	let reclaimNote = $state('');

	// Keep local state in sync if the entry changes upstream (e.g. from sync).
	/* svelte-ignore state_referenced_locally */
	let lastSeenId = $state(entry.id);
	$effect(() => {
		if (entry.id !== lastSeenId) {
			lastSeenId = entry.id;
			title = entry.title;
			category = entry.category;
			date = entry.date ?? '';
			confidence = entry.confidence;
			meaning = entry.meaning ?? '';
			whatIKnewThen = entry.whatIKnewThen ?? '';
			whatIKnowNow = entry.whatIKnowNow ?? '';
			note = entry.note ?? '';
			tenderness = entry.tenderness;
			wouldReclaim = entry.wouldReclaim;
			reclaimOpen = false;
			reclaimNote = '';
		}
	});

	const RATING_STARS = [1, 2, 3, 4, 5] as const;
	const WOULD_RECLAIM_OPTS: WouldReclaim[] = ['no', 'maybe', 'yes'];
	const CONFIDENCE_OPTS: LastConfidence[] = ['probably', 'likely', 'certain'];

	async function saveTitle() {
		const next = title.trim();
		if (next && next !== entry.title) {
			await lastsStore.updateLast(entry.id, { title: next });
		}
	}
	async function saveCategory() {
		if (category !== entry.category) {
			await lastsStore.updateLast(entry.id, { category });
		}
	}
	async function saveDate() {
		const next = date || null;
		if (next !== entry.date) {
			await lastsStore.updateLast(entry.id, { date: next });
		}
	}
	async function saveConfidence(next: LastConfidence | null) {
		confidence = next;
		await lastsStore.updateLast(entry.id, { confidence: next });
	}
	async function saveMeaning() {
		const next = meaning.trim() || null;
		if (next !== entry.meaning) {
			await lastsStore.updateLast(entry.id, { meaning: next });
		}
	}
	async function saveWhatIKnewThen() {
		const next = whatIKnewThen.trim() || null;
		if (next !== entry.whatIKnewThen) {
			await lastsStore.updateLast(entry.id, { whatIKnewThen: next });
		}
	}
	async function saveWhatIKnowNow() {
		const next = whatIKnowNow.trim() || null;
		if (next !== entry.whatIKnowNow) {
			await lastsStore.updateLast(entry.id, { whatIKnowNow: next });
		}
	}
	async function saveNote() {
		const next = note.trim() || null;
		if (next !== entry.note) {
			await lastsStore.updateLast(entry.id, { note: next });
		}
	}
	async function saveTenderness(star: number) {
		const next = tenderness === star ? null : star;
		tenderness = next;
		await lastsStore.updateLast(entry.id, { tenderness: next });
	}
	async function saveWouldReclaim(opt: WouldReclaim) {
		const next = wouldReclaim === opt ? null : opt;
		wouldReclaim = next;
		await lastsStore.updateLast(entry.id, { wouldReclaim: next });
	}

	async function handleConfirm() {
		await lastsStore.confirmLast(entry.id, {
			date: date || undefined,
			meaning: meaning.trim() || null,
			whatIKnewThen: whatIKnewThen.trim() || null,
			whatIKnowNow: whatIKnowNow.trim() || null,
			tenderness,
			wouldReclaim,
		});
	}

	function openReclaim() {
		reclaimOpen = true;
		reclaimNote = '';
	}

	async function confirmReclaim() {
		await lastsStore.reclaimLast(entry.id, reclaimNote.trim() || null);
		reclaimOpen = false;
		reclaimNote = '';
	}

	function cancelReclaim() {
		reclaimOpen = false;
		reclaimNote = '';
	}

	async function handleDelete() {
		await lastsStore.deleteLast(entry.id);
		goto('/lasts');
	}

	// ── Visibility / Sharing ──────────────────────────────
	let visibilityError = $state<string | null>(null);

	async function onVisibilityChange(next: VisibilityLevel) {
		visibilityError = null;
		try {
			await lastsStore.setVisibility(entry.id, next);
		} catch (err) {
			visibilityError = err instanceof Error ? err.message : String(err);
		}
	}

	async function handleRegenerate() {
		await lastsStore.regenerateUnlistedToken(entry.id);
	}

	async function handleRevoke() {
		await lastsStore.setVisibility(entry.id, 'private');
	}

	async function handleExpiryChange(expiresAt: Date | null) {
		await lastsStore.setUnlistedExpiry(entry.id, expiresAt);
	}

	const shareUrl = $derived.by(() => {
		if (!entry.unlistedToken) return '';
		const origin = typeof window === 'undefined' ? 'https://mana.how' : window.location.origin;
		return buildShareUrl(origin, entry.unlistedToken);
	});

	function formatDate(iso: string | null): string {
		if (!iso) return '';
		return new Date(iso).toLocaleDateString('de-DE', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		});
	}
</script>

<article class="detail">
	<!-- Header: status badge + category pill -->
	<header class="head">
		<div class="badges">
			<span class="status-pill" data-status={entry.status}>
				{STATUS_LABELS[entry.status].de}
			</span>
			<span class="cat-pill" style="--cat: {CATEGORY_COLORS[category]}">
				<span class="cat-dot" style="background: {CATEGORY_COLORS[category]}"></span>
				{CATEGORY_LABELS[category].de}
			</span>
		</div>

		{#if entry.inferredFrom}
			<p class="inferred">
				{$_('lasts.detail.inferredFrom')}: {entry.inferredFrom.refTable}
				{#if entry.inferredFrom.frequencyHint}
					— <span class="freq">{entry.inferredFrom.frequencyHint}</span>
				{/if}
			</p>
		{/if}
	</header>

	<!-- Title -->
	<input
		class="title-input"
		type="text"
		bind:value={title}
		onblur={saveTitle}
		placeholder={$_('lasts.detail.titlePlaceholder')}
	/>

	<!-- Category + Date row -->
	<div class="row">
		<label class="field">
			<span class="label">{$_('lasts.detail.categoryLabel')}</span>
			<select class="input-sm" bind:value={category} onchange={saveCategory}>
				{#each MILESTONE_CATEGORIES as cat}
					<option value={cat}>{CATEGORY_LABELS[cat].de}</option>
				{/each}
			</select>
		</label>
		<label class="field">
			<span class="label">{$_('lasts.detail.dateLabel')}</span>
			<input class="input-sm" type="date" bind:value={date} onchange={saveDate} />
		</label>
	</div>

	<!-- Confidence (only meaningful for suspected) -->
	{#if entry.status === 'suspected'}
		<div class="field">
			<span class="label">{$_('lasts.detail.confidenceLabel')}</span>
			<div class="picker">
				{#each CONFIDENCE_OPTS as opt}
					<button
						class="picker-btn"
						class:active={confidence === opt}
						onclick={() => saveConfidence(confidence === opt ? null : opt)}
					>
						{CONFIDENCE_LABELS[opt].de}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Meaning -->
	<label class="field">
		<span class="label">{$_('lasts.detail.meaningLabel')}</span>
		<textarea
			class="textarea"
			bind:value={meaning}
			onblur={saveMeaning}
			rows="3"
			placeholder={$_('lasts.detail.meaningPlaceholder')}
		></textarea>
	</label>

	<!-- Reflection: what I knew then / what I know now -->
	<div class="row">
		<label class="field">
			<span class="label">{$_('lasts.detail.whatIKnewThenLabel')}</span>
			<textarea
				class="textarea"
				bind:value={whatIKnewThen}
				onblur={saveWhatIKnewThen}
				rows="3"
				placeholder={$_('lasts.detail.whatIKnewThenPlaceholder')}
			></textarea>
		</label>
		<label class="field">
			<span class="label">{$_('lasts.detail.whatIKnowNowLabel')}</span>
			<textarea
				class="textarea"
				bind:value={whatIKnowNow}
				onblur={saveWhatIKnowNow}
				rows="3"
				placeholder={$_('lasts.detail.whatIKnowNowPlaceholder')}
			></textarea>
		</label>
	</div>

	<!-- Tenderness + WouldReclaim -->
	<div class="row">
		<div class="field">
			<span class="label">{$_('lasts.detail.tendernessLabel')}</span>
			<div class="rating-picker">
				{#each RATING_STARS as star}
					<button
						class="star-btn"
						class:filled={tenderness !== null && star <= tenderness}
						onclick={() => saveTenderness(star)}
						aria-label={String(star)}
					>
						{tenderness !== null && star <= tenderness ? '★' : '☆'}
					</button>
				{/each}
			</div>
		</div>
		<div class="field">
			<span class="label">{$_('lasts.detail.wouldReclaimLabel')}</span>
			<div class="picker">
				{#each WOULD_RECLAIM_OPTS as opt}
					<button
						class="picker-btn"
						class:active={wouldReclaim === opt}
						onclick={() => saveWouldReclaim(opt)}
					>
						{$_(`lasts.wouldReclaim.${opt}`)}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Note -->
	<label class="field">
		<span class="label">{$_('lasts.detail.noteLabel')}</span>
		<textarea
			class="textarea"
			bind:value={note}
			onblur={saveNote}
			rows="3"
			placeholder={$_('lasts.detail.notePlaceholder')}
		></textarea>
	</label>

	<!-- Reclaimed-state context (read-only summary) -->
	{#if entry.status === 'reclaimed'}
		<div class="reclaimed-block">
			{#if entry.reclaimedAt}
				<p class="meta">
					<strong>{$_('lasts.detail.reclaimedAt')}:</strong>
					{formatDate(entry.reclaimedAt.slice(0, 10))}
				</p>
			{/if}
			{#if entry.reclaimedNote}
				<p class="reclaimed-note">{entry.reclaimedNote}</p>
			{/if}
		</div>
	{/if}

	<!-- Visibility / Share-Link controls (M6) -->
	{#if entry.status !== 'reclaimed'}
		<section class="visibility-block">
			<h3 class="vis-label">{$_('lasts.detail.visibilityLabel')}</h3>
			<VisibilityPicker level={entry.visibility} onChange={onVisibilityChange} />
			{#if visibilityError}
				<p class="vis-error">{visibilityError}</p>
			{/if}
			{#if entry.visibility === 'unlisted' && entry.unlistedToken && shareUrl}
				<div class="share-controls">
					<SharedLinkControls
						token={entry.unlistedToken}
						url={shareUrl}
						expiresAt={entry.unlistedExpiresAt}
						onRegenerate={handleRegenerate}
						onRevoke={handleRevoke}
						onExpiryChange={handleExpiryChange}
					/>
				</div>
			{/if}
		</section>
	{/if}

	<!-- Inline reclaim confirmation -->
	{#if reclaimOpen}
		<div class="reclaim-form">
			<label class="field">
				<span class="label">{$_('lasts.detail.reclaimedNotePlaceholder')}</span>
				<textarea class="textarea" bind:value={reclaimNote} rows="2"></textarea>
			</label>
			<div class="reclaim-actions">
				<button class="btn" onclick={cancelReclaim}>
					{$_('lasts.actions.cancel')}
				</button>
				<button class="btn primary" onclick={confirmReclaim}>
					{$_('lasts.actions.reclaim')}
				</button>
			</div>
		</div>
	{/if}

	<!-- Lifecycle action bar -->
	<footer class="actions">
		<button class="btn danger" onclick={handleDelete}>
			{$_('lasts.actions.delete')}
		</button>
		<div class="spacer"></div>
		{#if entry.status === 'suspected'}
			<button class="btn primary" onclick={handleConfirm}>
				{$_('lasts.actions.confirm')}
			</button>
		{:else if entry.status === 'confirmed' && !reclaimOpen}
			<button class="btn" onclick={openReclaim}>
				{$_('lasts.actions.reclaim')}
			</button>
		{/if}
	</footer>
</article>

<style>
	.detail {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		padding: 1rem;
		max-width: 720px;
		margin: 0 auto;
	}

	.head {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.badges {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}
	.status-pill {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-muted-foreground));
	}
	.status-pill[data-status='confirmed'] {
		border-color: hsl(var(--color-primary) / 0.4);
		color: hsl(var(--color-primary));
	}
	.status-pill[data-status='reclaimed'] {
		border-style: dashed;
	}
	.cat-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		border: 1px solid var(--cat);
		color: var(--cat);
	}
	.cat-dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
	}

	.inferred {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}
	.freq {
		font-style: italic;
	}

	.title-input {
		width: 100%;
		font-size: 1.125rem;
		font-weight: 600;
		background: transparent;
		border: none;
		outline: none;
		color: hsl(var(--color-foreground));
		padding: 0.25rem 0;
		border-bottom: 1px solid transparent;
		transition: border-color 0.15s;
	}
	.title-input:focus {
		border-bottom-color: hsl(var(--color-primary) / 0.4);
	}

	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	@media (max-width: 640px) {
		.row {
			grid-template-columns: 1fr;
		}
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.label {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		font-weight: 600;
	}
	.input-sm {
		background: transparent;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.25rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		outline: none;
		font-family: inherit;
	}
	.input-sm:focus {
		border-color: hsl(var(--color-primary));
	}
	.textarea {
		width: 100%;
		background: transparent;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.25rem;
		padding: 0.375rem 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		outline: none;
		resize: vertical;
		font-family: inherit;
		line-height: 1.5;
	}
	.textarea:focus {
		border-color: hsl(var(--color-primary));
	}

	.picker {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}
	.picker-btn {
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.picker-btn.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: hsl(var(--color-primary));
	}

	.rating-picker {
		display: flex;
		gap: 0.125rem;
	}
	.star-btn {
		background: transparent;
		border: none;
		font-size: 1.25rem;
		cursor: pointer;
		color: hsl(var(--color-border));
		padding: 0;
		line-height: 1;
	}
	.star-btn.filled {
		color: #f59e0b;
	}

	.reclaimed-block {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.625rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-surface-hover));
		border: 1px dashed hsl(var(--color-border));
	}
	.meta {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}
	.reclaimed-note {
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		margin: 0;
		font-style: italic;
	}

	.reclaim-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary) / 0.04);
		border: 1px solid hsl(var(--color-primary) / 0.3);
	}
	.reclaim-actions {
		display: flex;
		gap: 0.375rem;
		justify-content: flex-end;
	}

	.visibility-block {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid hsl(var(--color-border));
	}
	.vis-label {
		margin: 0;
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		font-weight: 600;
	}
	.vis-error {
		margin: 0;
		font-size: 0.75rem;
		color: hsl(var(--color-error));
	}
	.share-controls {
		margin-top: 0.5rem;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid hsl(var(--color-border));
	}
	.spacer {
		flex: 1;
	}
	.btn {
		padding: 0.375rem 0.875rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
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
	.btn.danger {
		color: hsl(var(--color-error));
		border-color: hsl(var(--color-error) / 0.3);
	}
	.btn.danger:hover {
		background: hsl(var(--color-error) / 0.08);
	}
</style>
