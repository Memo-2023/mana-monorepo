<!--
  Meditate Hub — quick start, stats, presets, recent sessions.
-->
<script lang="ts">
	import { getContext } from 'svelte';
	import type {
		MeditatePreset,
		MeditateSession,
		MeditateSettings,
	} from '$lib/modules/meditate/types';
	import PresetCard from '$lib/modules/meditate/components/PresetCard.svelte';
	import SessionCard from '$lib/modules/meditate/components/SessionCard.svelte';
	import StatsOverview from '$lib/modules/meditate/components/StatsOverview.svelte';
	import SessionPlayer from '$lib/modules/meditate/components/SessionPlayer.svelte';
	import { RoutePage } from '$lib/components/shell';

	const presetsQuery = getContext<{ value: MeditatePreset[] }>('meditatePresets');
	const sessionsQuery = getContext<{ value: MeditateSession[] }>('meditateSessions');

	let presets = $derived(presetsQuery.value);
	let sessions = $derived(sessionsQuery.value);
	let recentSessions = $derived(sessions.slice(0, 5));

	// Session player state
	let activePreset = $state<MeditatePreset | null>(null);

	function startSession(preset: MeditatePreset) {
		activePreset = preset;
	}

	function handleComplete() {
		activePreset = null;
	}

	function handleCancel() {
		activePreset = null;
	}
</script>

<svelte:head>
	<title>Meditate - Mana</title>
</svelte:head>

{#if activePreset}
	<SessionPlayer preset={activePreset} onComplete={handleComplete} onCancel={handleCancel} />
{/if}

<RoutePage appId="meditate">
	<div class="page">
		<header class="page-header">
			<h1 class="page-title">Meditate</h1>
			<p class="page-subtitle">Finde deine Ruhe</p>
		</header>

		<!-- Stats -->
		{#if sessions.length > 0}
			<section class="section">
				<StatsOverview {sessions} />
			</section>
		{/if}

		<!-- Presets -->
		<section class="section">
			<div class="section-header">
				<h2 class="section-title">Meditationen</h2>
			</div>
			<div class="preset-list">
				{#each presets as preset (preset.id)}
					<PresetCard {preset} onStart={startSession} />
				{/each}
			</div>
		</section>

		<!-- Recent sessions -->
		{#if recentSessions.length > 0}
			<section class="section">
				<div class="section-header">
					<h2 class="section-title">Letzte Sessions</h2>
					<a href="/meditate/history" class="section-link">Alle →</a>
				</div>
				<div class="session-list">
					{#each recentSessions as session (session.id)}
						<SessionCard {session} {presets} />
					{/each}
				</div>
			</section>
		{/if}
	</div>
</RoutePage>

<style>
	.page {
		max-width: 640px;
		margin: 0 auto;
		padding: 1.5rem 1rem 3rem;
	}

	.page-header {
		margin-bottom: 1.5rem;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
	}

	.page-subtitle {
		font-size: 0.9rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.2rem;
	}

	.section {
		margin-bottom: 1.5rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.section-title {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.section-link {
		font-size: 0.8rem;
		color: hsl(var(--color-primary));
		text-decoration: none;
	}

	.section-link:hover {
		text-decoration: underline;
	}

	.preset-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.session-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
</style>
