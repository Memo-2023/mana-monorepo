<!--
  CompareColumn — one provider's result in the comparison grid.
  Renders the appropriate card content based on category.
-->
<script lang="ts">
	import type {
		AgentAnswer,
		CompareEntry,
		ExtractedContent,
		ResearchCategory,
		SearchHit,
	} from '../types';

	interface Props {
		category: ResearchCategory;
		entry: CompareEntry<unknown>;
	}

	const { category, entry }: Props = $props();

	function fmtLatency(ms: number): string {
		if (ms < 1000) return `${ms}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	}

	const searchResults = $derived(
		category === 'search'
			? ((entry.data as { results: SearchHit[] } | undefined)?.results ?? [])
			: []
	);
	const extractContent = $derived(
		category === 'extract'
			? ((entry.data as { content: ExtractedContent } | undefined)?.content ?? null)
			: null
	);
	const agentAnswer = $derived(
		category === 'agent'
			? ((entry.data as { answer: AgentAnswer } | undefined)?.answer ?? null)
			: null
	);
</script>

<article class="column" class:failed={!entry.success}>
	<header class="column-header">
		<div class="provider">
			<span class="provider-name">{entry.provider}</span>
			{#if entry.meta.cacheHit}
				<span class="tag cache" title="Cache hit">cached</span>
			{/if}
			{#if entry.meta.billingMode === 'byo-key'}
				<span class="tag byo" title="Your own API key">BYO</span>
			{:else if entry.meta.billingMode === 'free'}
				<span class="tag free">free</span>
			{/if}
		</div>
		<div class="metrics">
			<span class="latency">{fmtLatency(entry.meta.latencyMs)}</span>
			{#if entry.meta.costCredits > 0}
				<span class="cost">{entry.meta.costCredits}¢</span>
			{/if}
		</div>
	</header>

	{#if !entry.success}
		<div class="error">
			<strong>Fehler:</strong>
			<code>{entry.meta.errorCode ?? 'UNKNOWN'}</code>
		</div>
	{:else if category === 'search'}
		{#if searchResults.length === 0}
			<p class="empty">Keine Ergebnisse.</p>
		{:else}
			<ol class="hits">
				{#each searchResults as hit, i (hit.url + i)}
					<li class="hit">
						<a href={hit.url} target="_blank" rel="noreferrer" class="hit-title">
							{hit.title || hit.url}
						</a>
						<div class="hit-url">{hit.url}</div>
						{#if hit.snippet}
							<p class="hit-snippet">{hit.snippet}</p>
						{/if}
						<footer class="hit-meta">
							{#if hit.publishedAt}<span>{hit.publishedAt.slice(0, 10)}</span>{/if}
							{#if hit.score !== undefined}<span>score {hit.score.toFixed(2)}</span>{/if}
						</footer>
					</li>
				{/each}
			</ol>
		{/if}
	{:else if category === 'extract' && extractContent}
		<div class="extract">
			<h4 class="extract-title">{extractContent.title || extractContent.url}</h4>
			{#if extractContent.siteName || extractContent.author}
				<div class="extract-meta">
					{extractContent.siteName ?? ''}
					{extractContent.author ? `· ${extractContent.author}` : ''}
				</div>
			{/if}
			<div class="extract-stats">
				<span>{extractContent.wordCount} Wörter</span>
				{#if extractContent.publishedAt}
					<span>· {extractContent.publishedAt.slice(0, 10)}</span>
				{/if}
			</div>
			{#if extractContent.excerpt}
				<p class="extract-excerpt">{extractContent.excerpt}</p>
			{/if}
			<pre class="extract-body">{extractContent.content.slice(0, 2000)}{extractContent.content
					.length > 2000
					? '…'
					: ''}</pre>
		</div>
	{:else if category === 'agent' && agentAnswer}
		<div class="agent">
			<div class="agent-answer">{agentAnswer.answer}</div>
			{#if agentAnswer.citations.length > 0}
				<details class="citations" open>
					<summary>{agentAnswer.citations.length} Quellen</summary>
					<ol>
						{#each agentAnswer.citations as cit (cit.url)}
							<li>
								<a href={cit.url} target="_blank" rel="noreferrer">{cit.title || cit.url}</a>
							</li>
						{/each}
					</ol>
				</details>
			{/if}
			{#if agentAnswer.tokenUsage}
				<div class="agent-tokens">
					{agentAnswer.tokenUsage.input} in / {agentAnswer.tokenUsage.output} out tokens
				</div>
			{/if}
		</div>
	{:else}
		<p class="empty">Keine Daten.</p>
	{/if}
</article>

<style>
	.column {
		display: flex;
		flex-direction: column;
		min-width: 0;
		padding: 0.875rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-surface));
	}

	.column.failed {
		border-color: hsl(var(--color-error, 0 84% 60%) / 0.4);
		background: hsl(var(--color-error, 0 84% 60%) / 0.04);
	}

	.column-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 0.5rem;
		margin-bottom: 0.5rem;
		border-bottom: 1px solid hsl(var(--color-border));
		gap: 0.5rem;
	}

	.provider {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		min-width: 0;
	}

	.provider-name {
		font-family: ui-monospace, SFMono-Regular, monospace;
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tag {
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.tag.cache {
		background: hsl(var(--color-muted-foreground) / 0.15);
		color: hsl(var(--color-muted-foreground));
	}
	.tag.byo {
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
	}
	.tag.free {
		background: hsl(142 71% 45% / 0.15);
		color: hsl(142 71% 35%);
	}

	.metrics {
		display: flex;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
	}

	.cost {
		color: hsl(var(--color-foreground));
		font-weight: 500;
	}

	.error {
		padding: 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-error, 0 84% 40%));
	}

	.empty {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		padding: 0.5rem 0;
	}

	.hits {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.hit-title {
		font-weight: 500;
		color: hsl(var(--color-foreground));
		text-decoration: none;
	}
	.hit-title:hover {
		text-decoration: underline;
	}

	.hit-url {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin-top: 0.125rem;
	}

	.hit-snippet {
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground) / 0.85);
		line-height: 1.45;
		margin: 0.375rem 0 0.25rem;
	}

	.hit-meta {
		display: flex;
		gap: 0.75rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.extract-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0 0 0.25rem;
	}
	.extract-meta,
	.extract-stats {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.extract-excerpt {
		font-size: 0.8125rem;
		font-style: italic;
		color: hsl(var(--color-foreground) / 0.85);
		margin: 0.5rem 0;
	}
	.extract-body {
		margin-top: 0.5rem;
		padding: 0.5rem;
		background: hsl(var(--color-background));
		border-radius: 0.25rem;
		font-size: 0.75rem;
		line-height: 1.5;
		color: hsl(var(--color-foreground) / 0.85);
		white-space: pre-wrap;
		word-break: break-word;
		max-height: 18rem;
		overflow-y: auto;
		font-family: ui-monospace, SFMono-Regular, monospace;
	}

	.agent-answer {
		font-size: 0.875rem;
		line-height: 1.55;
		color: hsl(var(--color-foreground));
		white-space: pre-wrap;
		max-height: 28rem;
		overflow-y: auto;
	}

	.citations {
		margin-top: 0.75rem;
		padding-top: 0.5rem;
		border-top: 1px dashed hsl(var(--color-border));
		font-size: 0.8125rem;
	}
	.citations summary {
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
		user-select: none;
	}
	.citations ol {
		margin: 0.375rem 0 0 1.125rem;
		padding: 0;
	}
	.citations a {
		color: hsl(var(--color-primary));
		text-decoration: none;
	}
	.citations a:hover {
		text-decoration: underline;
	}

	.agent-tokens {
		margin-top: 0.5rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
