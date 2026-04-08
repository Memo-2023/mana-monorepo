<!--
  AnswerCitations — render an answer body that contains [n]-style
  citation tokens (where n is 1-indexed and maps to source.rank).

  - Splits content into text/citation segments via a regex tokenizer
  - Lazy-loads sources for `researchResultId` on first hover (session cache)
  - Shows a small popover with title, snippet, host, and an external link
  - Falls back to plain text rendering when there is no researchResultId
    (manual answers don't have citations)
-->
<script lang="ts">
	import { ArrowSquareOut } from '@mana/shared-icons';
	import { loadSources } from '../stores/sources.svelte';
	import type { ResearchSource } from '$lib/api/research';

	type Props = {
		content: string;
		researchResultId: string | null;
	};

	let { content, researchResultId }: Props = $props();

	let sources = $state<ResearchSource[]>([]);
	let loaded = $state(false);
	let loading = $state(false);
	let loadError = $state<string | null>(null);
	let hoveredRank = $state<number | null>(null);

	// Tokenize once per content change. Citation tokens are matched as
	// [n] surrounded by non-word characters or string boundaries so we
	// don't accidentally pick up [foo] or markdown link labels.
	type Segment = { kind: 'text'; text: string } | { kind: 'cite'; rank: number };
	let segments = $derived<Segment[]>(tokenize(content));

	function tokenize(input: string): Segment[] {
		const result: Segment[] = [];
		const re = /\[(\d+)\]/g;
		let last = 0;
		let match: RegExpExecArray | null;
		while ((match = re.exec(input)) !== null) {
			if (match.index > last) {
				result.push({ kind: 'text', text: input.slice(last, match.index) });
			}
			result.push({ kind: 'cite', rank: parseInt(match[1], 10) });
			last = match.index + match[0].length;
		}
		if (last < input.length) {
			result.push({ kind: 'text', text: input.slice(last) });
		}
		return result;
	}

	async function ensureLoaded() {
		if (loaded || loading || !researchResultId) return;
		loading = true;
		try {
			sources = await loadSources(researchResultId);
			loaded = true;
		} catch (err) {
			loadError = (err as Error).message;
		} finally {
			loading = false;
		}
	}

	function sourceForRank(rank: number): ResearchSource | undefined {
		return sources.find((s) => s.rank === rank);
	}

	function hostFromUrl(url: string): string {
		try {
			return new URL(url).hostname.replace(/^www\./, '');
		} catch {
			return url;
		}
	}

	function showPopover(rank: number) {
		hoveredRank = rank;
		void ensureLoaded();
	}

	function hidePopover() {
		hoveredRank = null;
	}
</script>

<div class="answer-citations whitespace-pre-wrap text-[hsl(var(--foreground))]">
	{#each segments as segment, i (i)}
		{#if segment.kind === 'text'}{segment.text}{:else}
			{@const src = sourceForRank(segment.rank)}
			<span class="citation-wrap">
				<button
					type="button"
					class="citation-pill"
					onmouseenter={() => showPopover(segment.rank)}
					onmouseleave={hidePopover}
					onfocus={() => showPopover(segment.rank)}
					onblur={hidePopover}
					aria-label="Quelle {segment.rank}"
				>
					[{segment.rank}]
				</button>
				{#if hoveredRank === segment.rank}
					<span
						class="citation-popover"
						role="tooltip"
						onmouseenter={() => showPopover(segment.rank)}
						onmouseleave={hidePopover}
					>
						{#if loading && !src}
							<span class="text-xs text-[hsl(var(--muted-foreground))]">Lade Quelle…</span>
						{:else if loadError}
							<span class="text-xs text-red-500">Fehler: {loadError}</span>
						{:else if src}
							<span class="block text-xs font-semibold text-[hsl(var(--foreground))]">
								{src.title ?? hostFromUrl(src.url)}
							</span>
							<span class="mt-1 block text-[10px] uppercase text-[hsl(var(--muted-foreground))]">
								{hostFromUrl(src.url)}
							</span>
							{#if src.snippet}
								<span class="mt-2 block text-xs text-[hsl(var(--muted-foreground))]">
									{src.snippet}
								</span>
							{/if}
							<a
								href={src.url}
								target="_blank"
								rel="noopener noreferrer"
								class="mt-2 inline-flex items-center gap-1 text-xs text-[hsl(var(--primary))] hover:underline"
							>
								Öffnen <ArrowSquareOut class="h-3 w-3" />
							</a>
						{:else if loaded}
							<span class="text-xs text-[hsl(var(--muted-foreground))]">
								Quelle {segment.rank} nicht gefunden
							</span>
						{/if}
					</span>
				{/if}
			</span>
		{/if}
	{/each}
</div>

<style>
	.citation-wrap {
		position: relative;
		display: inline;
	}

	.citation-pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.4em;
		padding: 0 0.35em;
		margin: 0 0.1em;
		border-radius: 9999px;
		background: hsl(var(--primary) / 0.15);
		color: hsl(var(--primary));
		font-size: 0.7em;
		font-weight: 600;
		line-height: 1.5;
		vertical-align: super;
		cursor: help;
		transition: background 120ms ease;
		border: none;
	}

	.citation-pill:hover,
	.citation-pill:focus-visible {
		background: hsl(var(--primary) / 0.3);
		outline: none;
	}

	.citation-popover {
		position: absolute;
		bottom: calc(100% + 0.4rem);
		left: 50%;
		transform: translateX(-50%);
		z-index: 50;
		display: block;
		width: 18rem;
		max-width: calc(100vw - 2rem);
		padding: 0.75rem 0.85rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--border));
		background: hsl(var(--card));
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
		text-align: left;
		white-space: normal;
	}
</style>
