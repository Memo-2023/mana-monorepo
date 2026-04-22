<!--
  /news/preferences — topics, languages, reset weights, onboarding rerun.
  Reached via the ⚙ button in the news module; not a workbench card.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { usePreferences } from '$lib/modules/news/queries';
	import { preferencesStore } from '$lib/modules/news/stores/preferences.svelte';
	import { ALL_TOPICS, type Topic, type Language } from '$lib/modules/news/types';
	import { TOPIC_LABELS } from '$lib/modules/news/sources-meta';
	import { RoutePage } from '$lib/components/shell';

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
		await preferencesStore.applyWeightDiff({});
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
	<title>News-Einstellungen — Mana</title>
</svelte:head>

<RoutePage appId="news" backHref="/news">
	<div class="pane">
		<header class="bar">
			<div class="title">
				<strong>News-Einstellungen</strong>
				<span class="sub">Themen · Sprachen · Gewichtungen</span>
			</div>
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
			<button type="button" class="btn-secondary" onclick={resetWeights}>Zurücksetzen</button>
		</section>

		<section class="card">
			<h2>Onboarding</h2>
			<p class="hint">Themen, Sprachen und Quellen neu wählen.</p>
			<button type="button" class="btn-secondary" onclick={rerunOnboarding}>
				Onboarding neu starten
			</button>
		</section>
	</div>
</RoutePage>

<style>
	.pane {
		max-width: 720px;
		margin: 0 auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		color: hsl(var(--color-foreground));
	}

	.bar .title strong {
		font-size: 1rem;
		font-weight: 600;
	}

	.bar .sub {
		margin-left: 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	.card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.125rem;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 12px;
	}

	.card h2 {
		font-size: 0.9375rem;
		font-weight: 600;
		margin: 0;
	}

	.hint {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 0.5rem;
	}

	.row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 10px;
		background: hsl(var(--color-background, var(--color-card)));
		border: 2px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font: inherit;
		font-size: 0.875rem;
		cursor: pointer;
		transition:
			background 120ms ease,
			border-color 120ms ease;
	}

	.pill.selected {
		border-color: hsl(var(--color-primary, 230 80% 55%));
		background: hsl(var(--color-primary, 230 80% 55%) / 0.12);
	}

	.emoji {
		font-size: 1rem;
	}

	.btn-secondary {
		align-self: flex-start;
		padding: 0.5rem 0.875rem;
		border-radius: 8px;
		background: hsl(var(--color-background, var(--color-card)));
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font: inherit;
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.btn-secondary:hover {
		background: hsl(var(--color-muted) / 0.5);
	}

	.btn-link {
		align-self: flex-start;
		color: hsl(var(--color-primary, 230 80% 55%));
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.btn-link:hover {
		text-decoration: underline;
	}
</style>
