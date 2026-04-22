<!--
  /research-lab/runs/[id] — read-only detail view of a past comparison run.
  Reconstructs CompareEntry shapes from eval_results and reuses CompareColumn.
-->
<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import * as api from '$lib/modules/research-lab/api';
	import CompareColumn from '$lib/modules/research-lab/components/CompareColumn.svelte';
	import type { CompareEntry, RunSummary } from '$lib/modules/research-lab/types';
	import { RoutePage } from '$lib/components/shell';

	const runId = $derived($page.params.id);

	let run = $state<RunSummary | null>(null);
	let entries = $state<CompareEntry<unknown>[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	$effect(() => {
		if (!runId) return;
		loading = true;
		error = null;
		api
			.getRun(runId)
			.then((res) => {
				run = res.run as RunSummary;
				entries = (
					res.results as Array<{
						id: string;
						providerId: string;
						success: boolean;
						latencyMs: number;
						costCredits: number;
						billingMode: string;
						cacheHit: boolean;
						normalizedResult: unknown;
						errorCode: string | null;
						userRating: number | null;
					}>
				).map((r) => ({
					provider: r.providerId,
					success: r.success,
					data: r.normalizedResult,
					resultId: r.id,
					userRating: r.userRating,
					meta: {
						provider: r.providerId,
						category: (run?.category ?? 'search') as 'search' | 'extract' | 'agent',
						latencyMs: r.latencyMs,
						costCredits: r.costCredits,
						cacheHit: r.cacheHit,
						billingMode: r.billingMode as 'server-key' | 'byo-key' | 'free' | 'mixed',
						errorCode: r.errorCode ?? undefined,
					},
				}));
			})
			.catch((err: Error) => {
				error = err.message;
			})
			.finally(() => {
				loading = false;
			});
	});

	function formatDate(iso: string): string {
		try {
			return new Date(iso).toLocaleString('de-DE', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});
		} catch {
			return iso;
		}
	}
</script>

<svelte:head>
	<title>Research Run · Mana</title>
</svelte:head>

<RoutePage appId="research-lab" backHref="/research-lab" title="Run">
	<div class="page">
		<header class="header">
			<button type="button" class="back" onclick={() => void goto('/research-lab')}>
				← Zurück zum Lab
			</button>
			{#if run}
				<div class="meta">
					<span class="badge badge-{run.category}">{run.category}</span>
					<span class="mode">{run.mode}</span>
					{#if run.totalCostCredits > 0}
						<span class="cost">{run.totalCostCredits}¢</span>
					{/if}
					<span class="time">{formatDate(run.createdAt)}</span>
				</div>
			{/if}
		</header>

		{#if loading}
			<p class="loading">Lade Run …</p>
		{:else if error}
			<div class="error">{error}</div>
		{:else if run}
			<h1 class="query">{run.query}</h1>
			<p class="providers-line">
				{run.providersRequested.length} Anbieter · Run <code>{run.id.slice(0, 8)}</code>
			</p>
			<div class="grid">
				{#each entries as entry (entry.resultId)}
					<CompareColumn category={run.category} {entry} {runId} />
				{/each}
			</div>
		{/if}
	</div>
</RoutePage>

<style>
	.page {
		max-width: 100%;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		min-height: 100%;
	}
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.back {
		padding: 0.375rem 0.75rem;
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
		transition: background 0.15s;
	}
	.back:hover {
		background: hsl(var(--color-surface-hover));
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
	.badge {
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.badge-search {
		background: hsl(200 80% 50% / 0.15);
		color: hsl(200 80% 40%);
	}
	.badge-extract {
		background: hsl(270 60% 55% / 0.15);
		color: hsl(270 60% 45%);
	}
	.badge-agent {
		background: hsl(30 90% 55% / 0.15);
		color: hsl(30 90% 40%);
	}
	.cost {
		color: hsl(var(--color-foreground));
		font-weight: 500;
	}
	.query {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0.5rem 0 0;
	}
	.providers-line {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0.25rem 0 0;
	}
	.providers-line code {
		font-family: ui-monospace, SFMono-Regular, monospace;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 0.875rem;
	}
	.loading {
		color: hsl(var(--color-muted-foreground));
	}
	.error {
		padding: 0.75rem 1rem;
		background: hsl(var(--color-error, 0 84% 60%) / 0.1);
		border: 1px solid hsl(var(--color-error, 0 84% 60%) / 0.4);
		color: hsl(var(--color-error, 0 84% 40%));
		border-radius: 0.375rem;
	}
</style>
