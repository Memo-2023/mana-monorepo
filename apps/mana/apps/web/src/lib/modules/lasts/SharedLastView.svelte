<!--
  Shared-Last view — public render of a single last behind an
  unlisted share link.

  Whitelist (set by buildLastBlob): title, status, category, date,
  meaning, whatIKnewThen, whatIKnowNow, tenderness, wouldReclaim.
  note / inferredFrom / personIds / placeId / mediaIds / reclaimedNote
  all stay PRIVATE. Reclaimed lasts are blocked at the resolver layer
  and never reach this view.

  Tone: contemplative, restrained — lasts are intim even when shared.
  Light cream + indigo accent (mirrors the lasts module color), no
  Mana branding except a small footer.
-->
<script lang="ts">
	type LastStatus = 'suspected' | 'confirmed';

	interface LastBlob {
		title: string;
		status: LastStatus;
		category:
			| 'culinary'
			| 'adventure'
			| 'travel'
			| 'people'
			| 'career'
			| 'creative'
			| 'nature'
			| 'culture'
			| 'health'
			| 'tech'
			| 'other';
		date: string | null;
		meaning: string | null;
		whatIKnewThen: string | null;
		whatIKnowNow: string | null;
		tenderness: number | null;
		wouldReclaim: 'no' | 'maybe' | 'yes' | null;
	}

	let {
		blob,
	}: {
		blob: Record<string, unknown>;
		token: string;
		expiresAt: string | null;
	} = $props();

	const entry = $derived(blob as unknown as LastBlob);

	const CATEGORY_LABELS: Record<LastBlob['category'], string> = {
		culinary: 'Kulinarisch',
		adventure: 'Abenteuer',
		travel: 'Reisen',
		people: 'Menschen',
		career: 'Beruf',
		creative: 'Kreativ',
		nature: 'Natur',
		culture: 'Kultur',
		health: 'Gesundheit',
		tech: 'Technik',
		other: 'Sonstiges',
	};

	const CATEGORY_COLORS: Record<LastBlob['category'], string> = {
		culinary: '#f97316',
		adventure: '#ef4444',
		travel: '#0ea5e9',
		people: '#ec4899',
		career: '#6366f1',
		creative: '#a855f7',
		nature: '#22c55e',
		culture: '#eab308',
		health: '#14b8a6',
		tech: '#64748b',
		other: '#9ca3af',
	};

	const STATUS_LABELS: Record<LastStatus, string> = {
		suspected: 'Vermutet',
		confirmed: 'Bestätigt',
	};

	const WOULD_RECLAIM_LABELS: Record<NonNullable<LastBlob['wouldReclaim']>, string> = {
		no: 'Nein',
		maybe: 'Vielleicht',
		yes: 'Ja',
	};

	const RATING_STARS = [1, 2, 3, 4, 5];
</script>

<article class="card" style:--cat={CATEGORY_COLORS[entry.category]}>
	<header>
		<div class="meta">
			<span class="cat">{CATEGORY_LABELS[entry.category]}</span>
			<span class="dot">·</span>
			<span class="status">{STATUS_LABELS[entry.status]}</span>
			{#if entry.date}
				<span class="dot">·</span>
				<span class="date">{entry.date}</span>
			{/if}
		</div>
		<h1 class="title">{entry.title}</h1>
		{#if entry.meaning}
			<p class="meaning">{entry.meaning}</p>
		{/if}
	</header>

	{#if entry.whatIKnewThen || entry.whatIKnowNow}
		<section class="reflection">
			{#if entry.whatIKnewThen}
				<div class="reflection-block">
					<h2>Damals</h2>
					<p>{entry.whatIKnewThen}</p>
				</div>
			{/if}
			{#if entry.whatIKnowNow}
				<div class="reflection-block">
					<h2>Heute</h2>
					<p>{entry.whatIKnowNow}</p>
				</div>
			{/if}
		</section>
	{/if}

	{#if entry.tenderness !== null || entry.wouldReclaim}
		<section class="footer-meta">
			{#if entry.tenderness !== null}
				<div class="rating">
					<span class="rating-label">Berührt heute</span>
					<span class="stars">
						{#each RATING_STARS as star}
							<span class:filled={star <= (entry.tenderness ?? 0)}
								>{star <= (entry.tenderness ?? 0) ? '★' : '☆'}</span
							>
						{/each}
					</span>
				</div>
			{/if}
			{#if entry.wouldReclaim}
				<div class="reclaim">
					<span class="reclaim-label">Würde es zurückholen</span>
					<span class="reclaim-value">{WOULD_RECLAIM_LABELS[entry.wouldReclaim]}</span>
				</div>
			{/if}
		</section>
	{/if}

	<footer>
		<small>via Mana Lasts</small>
	</footer>
</article>

<style>
	.card {
		max-width: 36rem;
		margin: 4rem auto;
		padding: 2rem 2.25rem;
		background: white;
		border-radius: 1rem;
		border: 1px solid #e5e7eb;
		border-left: 5px solid var(--cat);
		box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		color: #0f172a;
	}
	.meta {
		display: flex;
		gap: 0.45rem;
		font-size: 0.78rem;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}
	.cat {
		color: var(--cat);
		font-weight: 600;
	}
	.dot {
		opacity: 0.5;
	}
	.status,
	.date {
		font-weight: 500;
	}
	.title {
		font-size: 1.65rem;
		font-weight: 600;
		margin: 0 0 0.4rem;
		line-height: 1.25;
	}
	.meaning {
		margin: 0 0 0.5rem;
		font-size: 1.05rem;
		color: #334155;
		line-height: 1.55;
		font-style: italic;
	}

	.reflection {
		margin-top: 1.5rem;
		padding-top: 1.25rem;
		border-top: 1px solid #f1f5f9;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}
	@media (max-width: 36rem) {
		.reflection {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
	}
	.reflection-block h2 {
		margin: 0 0 0.4rem;
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #64748b;
		font-weight: 500;
	}
	.reflection-block p {
		margin: 0;
		color: #334155;
		line-height: 1.55;
	}

	.footer-meta {
		margin-top: 1.5rem;
		padding-top: 1.25rem;
		border-top: 1px solid #f1f5f9;
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.rating,
	.reclaim {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.rating-label,
	.reclaim-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #64748b;
	}
	.stars {
		font-size: 1.1rem;
		color: #cbd5e1;
		letter-spacing: 0.1em;
	}
	.stars .filled {
		color: #f59e0b;
	}
	.reclaim-value {
		font-size: 0.95rem;
		color: #334155;
		font-weight: 500;
	}

	footer {
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid #f1f5f9;
		text-align: center;
	}
	footer small {
		color: #94a3b8;
		font-size: 0.72rem;
	}
</style>
