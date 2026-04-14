<!--
  Meditate History — full session history with category filter.
-->
<script lang="ts">
	import { getContext } from 'svelte';
	import type {
		MeditatePreset,
		MeditateSession,
		MeditateCategory,
	} from '$lib/modules/meditate/types';
	import { CATEGORY_LABELS } from '$lib/modules/meditate/types';
	import SessionCard from '$lib/modules/meditate/components/SessionCard.svelte';
	import { getTotalMinutes, getTotalSessions } from '$lib/modules/meditate/queries';

	const presetsQuery = getContext<{ value: MeditatePreset[] }>('meditatePresets');
	const sessionsQuery = getContext<{ value: MeditateSession[] }>('meditateSessions');

	let presets = $derived(presetsQuery.value);
	let sessions = $derived(sessionsQuery.value);

	let categoryFilter = $state<MeditateCategory | 'all'>('all');

	let filtered = $derived(
		categoryFilter === 'all' ? sessions : sessions.filter((s) => s.category === categoryFilter)
	);

	let totalMin = $derived(getTotalMinutes(filtered));
	let totalCount = $derived(getTotalSessions(filtered));
</script>

<svelte:head>
	<title>Meditation History - Mana</title>
</svelte:head>

<div class="page">
	<header class="page-header">
		<a href="/meditate" class="back-link">← Meditate</a>
		<h1 class="page-title">Verlauf</h1>
		<p class="page-subtitle">{totalCount} Sessions · {totalMin} Minuten</p>
	</header>

	<!-- Filter -->
	<div class="filter-bar">
		<button
			type="button"
			class="filter-btn"
			class:active={categoryFilter === 'all'}
			onclick={() => (categoryFilter = 'all')}
		>
			Alle
		</button>
		{#each Object.entries(CATEGORY_LABELS) as [key, label]}
			<button
				type="button"
				class="filter-btn"
				class:active={categoryFilter === key}
				onclick={() => (categoryFilter = key as MeditateCategory)}
			>
				{label.de}
			</button>
		{/each}
	</div>

	<!-- Session list -->
	{#if filtered.length === 0}
		<div class="empty">
			<p class="empty-text">Noch keine Sessions.</p>
		</div>
	{:else}
		<div class="session-list">
			{#each filtered as session (session.id)}
				<SessionCard {session} {presets} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 640px;
		margin: 0 auto;
		padding: 1.5rem 1rem 3rem;
	}

	.page-header {
		margin-bottom: 1rem;
	}

	.back-link {
		font-size: 0.8rem;
		color: hsl(var(--color-muted-foreground));
		text-decoration: none;
	}

	.back-link:hover {
		color: hsl(var(--color-primary));
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
		margin-top: 0.25rem;
	}

	.page-subtitle {
		font-size: 0.85rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.15rem;
	}

	.filter-bar {
		display: flex;
		gap: 0.35rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.filter-btn {
		padding: 0.4rem 0.85rem;
		border-radius: 9999px;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.filter-btn:hover {
		border-color: hsl(var(--color-primary) / 0.5);
	}

	.filter-btn.active {
		background: hsl(var(--color-primary) / 0.15);
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
	}

	.session-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.empty {
		text-align: center;
		padding: 3rem 1rem;
	}

	.empty-text {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.9rem;
	}
</style>
