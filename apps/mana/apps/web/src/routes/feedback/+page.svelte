<!--
  /community — Public community feed.
  SSR pre-renders the items from the anonymous endpoint; once mounted,
  the client-side ListView (auth-enriched if logged in) takes over with
  filters + reactions.
-->
<script lang="ts">
	import ListView from '$lib/modules/community/views/ListView.svelte';

	// data is from +page.server.ts — used as initial paint for SEO/non-JS,
	// but the ListView re-fetches on mount (client-side, possibly authenticated).
	let { data } = $props();
</script>

<svelte:head>
	<title>Mana Community — Feedback &amp; Wünsche</title>
	<meta
		name="description"
		content="Was Nutzer sich von Mana wünschen — anonym, aber persistent als Tier-Pseudonym. Lies alles, mach mit, sobald du eingeloggt bist."
	/>
	<meta property="og:title" content="Mana Community — Feedback &amp; Wünsche" />
	<meta property="og:type" content="website" />
</svelte:head>

<div class="community-public">
	<header class="hero">
		<h1>Was Mana-Nutzer sich wünschen</h1>
		<p class="lead">
			Echte Stimmen, anonym aber konsistent. Lies, was andere bewegt — wenn du Lust hast, mach mit.
		</p>
	</header>

	{#if data.error && data.items.length === 0}
		<div class="state error">Konnte den Feed gerade nicht laden — versuch's gleich nochmal.</div>
	{/if}

	<!-- ListView fetches client-side; SSR data is the initial bundle for SEO. -->
	<ListView />

	{#if data.items.length > 0}
		<noscript>
			<div class="ssr-fallback">
				<h2>Aktuelle Wünsche</h2>
				<ul>
					{#each data.items as item (item.id)}
						<li>
							<strong>{item.title ?? item.feedbackText.slice(0, 80)}</strong>
							<small>— {item.displayName}</small>
						</li>
					{/each}
				</ul>
			</div>
		</noscript>
	{/if}
</div>

<style>
	.community-public {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

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

	.state {
		padding: 1rem;
		border-radius: 0.625rem;
		border: 1px solid hsl(var(--color-border));
		font-size: 0.875rem;
	}

	.state.error {
		border-color: hsl(var(--color-error, 0 84% 60%) / 0.4);
		color: hsl(var(--color-error, 0 84% 60%));
	}

	.ssr-fallback {
		padding: 1rem;
		border: 1px dashed hsl(var(--color-border));
		border-radius: 0.625rem;
	}
</style>
