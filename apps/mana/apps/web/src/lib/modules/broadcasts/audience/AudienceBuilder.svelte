<!--
  AudienceBuilder — M2.
  Tag-Filter-Chips + Live-Empfänger-Count.

  Binds the parent's `audience: AudienceDefinition`. Every change
  re-evaluates the count against the live contacts list so the user
  sees the segment size as they build it.
-->
<script lang="ts">
	import { useAllContacts } from '$lib/modules/contacts/queries';
	import { useAllTags } from '@mana/shared-stores';
	import { countAudience } from './segment-builder';
	import type { AudienceDefinition, AudienceFilter } from '../types';

	interface Props {
		audience: AudienceDefinition;
	}

	let { audience = $bindable({ filters: [], estimatedCount: 0 }) }: Props = $props();

	const contacts$ = useAllContacts();
	const contacts = $derived(contacts$.value ?? []);
	const allTags = $derived(useAllTags().value ?? []);

	const matchedCount = $derived(countAudience(contacts, audience));

	// Keep the cached count in sync with the live computation so the
	// cached number doesn't go stale between edits and the next save.
	$effect(() => {
		if (audience.estimatedCount !== matchedCount) {
			audience = { ...audience, estimatedCount: matchedCount };
		}
	});

	function addTagFilter(tagId: string, op: 'has' | 'not-has') {
		// Dedupe: if a filter with the same tag exists, toggle the op rather
		// than pile on duplicates.
		const existing = audience.filters.findIndex((f) => f.field === 'tag' && f.value === tagId);
		let nextFilters: AudienceFilter[];
		if (existing >= 0) {
			nextFilters = audience.filters.map((f, i) =>
				i === existing ? ({ field: 'tag', op, value: tagId } as AudienceFilter) : f
			);
		} else {
			nextFilters = [...audience.filters, { field: 'tag', op, value: tagId }];
		}
		audience = { ...audience, filters: nextFilters };
	}

	function removeFilter(index: number) {
		audience = {
			...audience,
			filters: audience.filters.filter((_, i) => i !== index),
		};
	}

	function tagName(tagId: string): string {
		return allTags.find((t) => t.id === tagId)?.name ?? tagId.slice(0, 8);
	}

	function filterLabel(f: AudienceFilter): string {
		if (f.field === 'tag') {
			return f.op === 'has' ? `Tag: ${tagName(f.value)}` : `nicht Tag: ${tagName(f.value)}`;
		}
		if (f.field === 'email') return `E-Mail: ${f.value}`;
		return `${f.field} ${f.op} ${f.value}`;
	}

	// Which tags are already referenced (greys them out in the picker).
	const usedTagIds = $derived(
		new Set(audience.filters.filter((f) => f.field === 'tag').map((f) => f.value))
	);

	const contactsWithEmail = $derived(
		contacts.filter((c) => typeof c.email === 'string' && c.email.includes('@')).length
	);
</script>

<div class="audience">
	<header class="audience-head">
		<h3>Empfänger</h3>
		<div class="count-chip" class:empty={matchedCount === 0}>
			<strong>{matchedCount}</strong>
			<span>{matchedCount === 1 ? 'Empfänger' : 'Empfänger'}</span>
		</div>
	</header>

	<p class="hint">
		{#if audience.filters.length === 0}
			Ohne Filter: alle {contactsWithEmail} Kontakte mit E-Mail-Adresse.
		{:else}
			{audience.filters.length} Filter — nur Kontakte, die ALLE erfüllen.
		{/if}
	</p>

	{#if audience.filters.length > 0}
		<div class="filter-chips">
			{#each audience.filters as f, i (i)}
				<span class="chip" class:chip-negate={f.op === 'not-has'}>
					{filterLabel(f)}
					<button
						type="button"
						class="chip-remove"
						onclick={() => removeFilter(i)}
						aria-label="Filter entfernen">×</button
					>
				</span>
			{/each}
		</div>
	{/if}

	<section class="tag-picker">
		<h4>Nach Tag filtern</h4>
		{#if allTags.length === 0}
			<p class="empty">
				Keine Tags vorhanden. Lege in Kontakten Tags an, um nach ihnen zu segmentieren.
			</p>
		{:else}
			<div class="tag-grid">
				{#each allTags as tag (tag.id)}
					{@const used = usedTagIds.has(tag.id)}
					<div class="tag-row">
						<span class="tag-color" style="--c: {tag.color ?? '#64748b'}"></span>
						<span class="tag-name">{tag.name}</span>
						<button
							type="button"
							class="tag-btn"
							disabled={used}
							onclick={() => addTagFilter(tag.id, 'has')}
							title="Nur Kontakte mit diesem Tag">+ hat</button
						>
						<button
							type="button"
							class="tag-btn tag-btn-negate"
							disabled={used}
							onclick={() => addTagFilter(tag.id, 'not-has')}
							title="Nur Kontakte ohne diesen Tag">− ohne</button
						>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.audience {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.audience-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.audience-head h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.count-chip {
		display: inline-flex;
		align-items: baseline;
		gap: 0.3rem;
		padding: 0.3rem 0.75rem;
		background: #eef2ff;
		border: 1px solid #c7d2fe;
		border-radius: 999px;
		color: #3730a3;
		font-size: 0.85rem;
	}

	.count-chip strong {
		font-size: 1.1rem;
		font-weight: 600;
	}

	.count-chip.empty {
		background: #fef2f2;
		border-color: #fecaca;
		color: #991b1b;
	}

	.hint {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
	}

	.filter-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.6rem 0.3rem 0.75rem;
		background: #e0e7ff;
		border: 1px solid #c7d2fe;
		border-radius: 999px;
		font-size: 0.85rem;
		color: #3730a3;
	}

	.chip.chip-negate {
		background: #fef2f2;
		border-color: #fecaca;
		color: #991b1b;
	}

	.chip-remove {
		background: transparent;
		border: 0;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		color: inherit;
		opacity: 0.6;
		padding: 0;
	}

	.chip-remove:hover {
		opacity: 1;
	}

	.tag-picker {
		background: var(--color-surface-muted, #f8fafc);
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
	}

	.tag-picker h4 {
		margin: 0 0 0.5rem;
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.tag-picker .empty {
		margin: 0.25rem 0;
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
	}

	.tag-grid {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		max-height: 20rem;
		overflow-y: auto;
	}

	.tag-row {
		display: grid;
		grid-template-columns: 14px 1fr auto auto;
		gap: 0.5rem;
		align-items: center;
	}

	.tag-color {
		width: 14px;
		height: 14px;
		border-radius: 3px;
		background: var(--c);
	}

	.tag-name {
		font-size: 0.9rem;
	}

	.tag-btn {
		padding: 0.25rem 0.65rem;
		background: white;
		border: 1px solid var(--color-border, #e2e8f0);
		border-radius: 0.3rem;
		cursor: pointer;
		font-size: 0.8rem;
	}

	.tag-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.tag-btn-negate {
		color: #b91c1c;
		border-color: #fecaca;
	}
</style>
