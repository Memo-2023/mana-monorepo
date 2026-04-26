<script lang="ts">
	import RoadmapView from '$lib/modules/community/views/RoadmapView.svelte';
</script>

<svelte:head>
	<title>Mana Roadmap — Was wir bauen</title>
	<meta
		name="description"
		content="Welche Wünsche aus der Community wir geplant, in Arbeit oder bereits geliefert haben — sortiert nach Status."
	/>
</svelte:head>

<header class="hero">
	<h1>Roadmap</h1>
	<p class="lead">
		Was wir geplant, in Arbeit oder bereits geliefert haben. Sortiert nach Status, sichtbar für
		alle.
	</p>
</header>

<RoadmapView />

<style>
	.hero {
		padding: 1rem 0 0.5rem;
	}

	.hero h1 {
		margin: 0 0 0.5rem 0;
		font-size: 1.75rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.lead {
		margin: 0;
		font-size: 0.9375rem;
		color: hsl(var(--color-muted-foreground));
		max-width: 60ch;
		line-height: 1.5;
	}
</style>
