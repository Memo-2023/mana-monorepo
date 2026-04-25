<!--
  Shared-Library-Entry view — public render of a book / film / series /
  comic behind an unlisted share link.

  Whitelist (set by buildLibraryEntryBlob): title, kind, creators, year,
  coverUrl, rating. Review, status, tags, progress all stay private.
-->
<script lang="ts">
	interface LibraryEntryBlob {
		title: string;
		kind: 'book' | 'movie' | 'series' | 'comic';
		creators: string[];
		year: number | null;
		coverUrl: string | null;
		rating: number | null;
	}

	let {
		blob,
	}: {
		blob: Record<string, unknown>;
		token: string;
		expiresAt: string | null;
	} = $props();

	const entry = $derived(blob as unknown as LibraryEntryBlob);

	const KIND_LABELS: Record<LibraryEntryBlob['kind'], string> = {
		book: 'Buch',
		movie: 'Film',
		series: 'Serie',
		comic: 'Comic',
	};

	const KIND_EMOJI: Record<LibraryEntryBlob['kind'], string> = {
		book: '📖',
		movie: '🎬',
		series: '📺',
		comic: '💥',
	};

	const creatorsLine = $derived(entry.creators?.join(' · ') ?? '');
	const meta = $derived(
		[creatorsLine, entry.year ? String(entry.year) : ''].filter(Boolean).join(' · ')
	);

	const ratingStars = $derived(
		typeof entry.rating === 'number' ? '★'.repeat(entry.rating) + '☆'.repeat(5 - entry.rating) : ''
	);

	const ogDescription = $derived(meta || KIND_LABELS[entry.kind]);
</script>

<svelte:head>
	<title>{entry.title} · Mana</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta property="og:title" content={entry.title} />
	<meta property="og:description" content={ogDescription} />
	{#if entry.coverUrl}<meta property="og:image" content={entry.coverUrl} />{/if}
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<article class="entry">
	<span class="entry__kind">{KIND_EMOJI[entry.kind]} {KIND_LABELS[entry.kind]}</span>

	<div class="entry__hero">
		{#if entry.coverUrl}
			<img class="entry__cover" src={entry.coverUrl} alt={entry.title} />
		{:else}
			<div class="entry__cover entry__cover--placeholder">
				<span class="entry__cover-emoji">{KIND_EMOJI[entry.kind]}</span>
			</div>
		{/if}

		<div class="entry__head">
			<h1 class="entry__title">{entry.title}</h1>
			{#if meta}
				<p class="entry__meta">{meta}</p>
			{/if}
			{#if ratingStars}
				<p class="entry__rating" title={`${entry.rating}/5`}>{ratingStars}</p>
			{/if}
		</div>
	</div>
</article>

<style>
	.entry {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.entry__kind {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #6b7280;
		font-weight: 600;
	}
	.entry__hero {
		display: grid;
		grid-template-columns: minmax(160px, 200px) 1fr;
		gap: 1.5rem;
		align-items: start;
	}
	@media (max-width: 480px) {
		.entry__hero {
			grid-template-columns: 1fr;
		}
	}
	.entry__cover {
		width: 100%;
		aspect-ratio: 2 / 3;
		object-fit: cover;
		border-radius: 0.625rem;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
	}
	.entry__cover--placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.04);
	}
	.entry__cover-emoji {
		font-size: 4rem;
	}
	.entry__title {
		margin: 0;
		font-size: 1.85rem;
		line-height: 1.15;
		font-weight: 700;
	}
	.entry__meta {
		margin: 0.5rem 0 0;
		color: #6b7280;
		font-size: 0.9375rem;
	}
	.entry__rating {
		margin: 0.75rem 0 0;
		color: #f59e0b;
		font-size: 1.25rem;
		letter-spacing: 0.1em;
	}

	@media (prefers-color-scheme: dark) {
		.entry__kind,
		.entry__meta {
			color: #9ca3af;
		}
		.entry__cover--placeholder {
			background: rgba(255, 255, 255, 0.06);
		}
	}
</style>
