<!--
  /news/preferences — adjust topics, languages, and reset learned weights.

  Source-level blocking lives at /news/sources. Onboarding can be
  re-run from here too.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { usePreferences } from '$lib/modules/news/queries';
	import { preferencesStore } from '$lib/modules/news/stores/preferences.svelte';
	import { ALL_TOPICS, type Topic, type Language } from '$lib/modules/news/types';
	import { TOPIC_LABELS } from '$lib/modules/news/sources-meta';

	const prefs$ = usePreferences();
	const prefs = $derived(prefs$.value);

	let topicWeightCount = $derived(Object.keys(prefs.topicWeights).length);
	let sourceWeightCount = $derived(Object.keys(prefs.sourceWeights).length);

	async function toggleTopic(t: Topic) {
		const next = prefs.selectedTopics.includes(t)
			? prefs.selectedTopics.filter((x) => x !== t)
			: [...prefs.selectedTopics, t];
		await preferencesStore.setTopics(next);
	}
	async function toggleLang(l: Language) {
		const next = prefs.preferredLanguages.includes(l)
			? prefs.preferredLanguages.filter((x) => x !== l)
			: [...prefs.preferredLanguages, l];
		await preferencesStore.setLanguages(next);
	}
	async function resetWeights() {
		if (!confirm('Alle gelernten Gewichtungen zurücksetzen?')) return;
		await preferencesStore.resetWeights();
	}
	async function rerunOnboarding() {
		// Flip the flag back so the main +page.svelte renders the wizard.
		await preferencesStore.applyWeightDiff({});
		// Need a separate setter — re-using completeOnboarding inverted.
		const { preferencesTable } = await import('$lib/modules/news/collections');
		const { encryptRecord } = await import('$lib/data/crypto');
		const { PREFERENCES_ID } = await import('$lib/modules/news/types');
		const diff = { onboardingCompleted: false, updatedAt: new Date().toISOString() };
		await encryptRecord('newsPreferences', diff);
		await preferencesTable.update(PREFERENCES_ID, diff);
		goto('/news');
	}
</script>

<svelte:head>
	<title>Einstellungen — News — Mana</title>
</svelte:head>

<div class="page">
	<header class="header">
		<button type="button" class="back" onclick={() => goto('/news')}>← Feed</button>
		<h1>News-Einstellungen</h1>
	</header>

	<section class="card">
		<h2>Themen</h2>
		<p class="hint">Welche Themen sollen im Feed auftauchen?</p>
		<div class="grid">
			{#each ALL_TOPICS as topic}
				<button
					type="button"
					class="pill"
					class:selected={prefs.selectedTopics.includes(topic)}
					onclick={() => toggleTopic(topic)}
				>
					<span class="emoji">{TOPIC_LABELS[topic].emoji}</span>
					<span>{TOPIC_LABELS[topic].de}</span>
				</button>
			{/each}
		</div>
	</section>

	<section class="card">
		<h2>Sprachen</h2>
		<div class="row">
			<button
				type="button"
				class="pill"
				class:selected={prefs.preferredLanguages.includes('de')}
				onclick={() => toggleLang('de')}
			>
				🇩🇪 Deutsch
			</button>
			<button
				type="button"
				class="pill"
				class:selected={prefs.preferredLanguages.includes('en')}
				onclick={() => toggleLang('en')}
			>
				🇬🇧 English
			</button>
		</div>
	</section>

	<section class="card">
		<h2>Quellen</h2>
		<p class="hint">
			Du blockst aktuell <strong>{prefs.blockedSources.length}</strong> Quellen.
		</p>
		<a class="btn-link" href="/news/sources">Quellen verwalten →</a>
	</section>

	<section class="card">
		<h2>Gelernte Gewichtungen</h2>
		<p class="hint">
			Über Reaktionen lernt der Feed deine Vorlieben:
			{topicWeightCount} Themen-Gewichte, {sourceWeightCount} Quellen-Gewichte.
		</p>
		<button type="button" class="btn-secondary" onclick={resetWeights}> Zurücksetzen </button>
	</section>

	<section class="card">
		<h2>Onboarding</h2>
		<p class="hint">Themen, Sprachen und Quellen neu wählen.</p>
		<button type="button" class="btn-secondary" onclick={rerunOnboarding}>
			Onboarding neu starten
		</button>
	</section>
</div>

<style>
	.page {
		max-width: 720px;
		margin: 0 auto;
		padding: 0 1rem 4rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.header {
		padding-top: 0.5rem;
	}
	.back {
		background: none;
		border: none;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		font-size: 0.875rem;
	}
	.header h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
		margin-top: 0.25rem;
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.25rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
	}
	.card h2 {
		font-size: 1.0625rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}
	.hint {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 0.5rem;
	}
	.row {
		display: flex;
		gap: 0.5rem;
	}
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 0.875rem;
		border-radius: 0.625rem;
		background: hsl(var(--color-background));
		border: 2px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		cursor: pointer;
	}
	.pill.selected {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.12);
	}
	.emoji {
		font-size: 1.125rem;
	}
	.btn-secondary {
		align-self: flex-start;
		padding: 0.5rem 0.875rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-background));
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
	}
	.btn-link {
		align-self: flex-start;
		color: hsl(var(--color-primary));
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
	}
	.btn-link:hover {
		text-decoration: underline;
	}
</style>
