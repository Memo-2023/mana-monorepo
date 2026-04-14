<!--
  /companion/workbench — Cross-module timeline of AI activity.

  Renders all events with `meta.actor.kind === 'ai'`, grouped into buckets
  by mission iteration. Each bucket shows the rationale once (on the
  iteration header) and lists the resulting record-level events below
  with a link back into the originating module.

  Filters: mission (via query-string `?mission=…`), module (dropdown).
-->
<script lang="ts">
	import { Sparkle, ArrowLeft, ArrowSquareOut } from '@mana/shared-icons';
	import { page } from '$app/stores';
	import { useAiTimeline, bucketByIteration } from '$lib/data/ai/timeline/queries';
	import { useMissions } from '$lib/data/ai/missions/queries';
	import type { DomainEvent } from '$lib/data/events/types';

	const missionId = $derived($page.url.searchParams.get('mission') ?? undefined);
	let moduleFilter = $state<string | null>(null);

	const events = $derived(
		useAiTimeline({ missionId, module: moduleFilter ?? undefined, limit: 500 })
	);
	const buckets = $derived(bucketByIteration(events.value));
	const missions = $derived(useMissions());
	const missionTitleById = $derived(new Map(missions.value.map((m) => [m.id, m.title])));

	const allModules = $derived(Array.from(new Set(events.value.map((e) => e.meta.appId))).sort());

	function moduleRoute(event: DomainEvent): string {
		// Most module pages live at /{module} — a best-effort deep link.
		return `/${event.meta.appId}`;
	}

	function describeEvent(e: DomainEvent): string {
		const payload = e.payload as Record<string, unknown> | undefined;
		const title =
			payload &&
			typeof payload === 'object' &&
			'title' in payload &&
			typeof payload.title === 'string'
				? payload.title
				: undefined;
		return title ? `${e.type} · ${title}` : e.type;
	}

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleTimeString('de-DE', {
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('de-DE', {
			day: 'numeric',
			month: 'short',
		});
	}
</script>

<svelte:head>
	<title>Workbench - Companion</title>
</svelte:head>

<div class="page">
	<header class="page-header">
		<a href="/companion" class="back">
			<ArrowLeft size={16} />
			<span>Companion</span>
		</a>
		<div class="title">
			<Sparkle size={20} weight="fill" />
			<h1>AI Workbench</h1>
		</div>
		<div class="filters">
			<label>
				<span class="small">Modul</span>
				<select bind:value={moduleFilter}>
					<option value={null}>alle</option>
					{#each allModules as mod}
						<option value={mod}>{mod}</option>
					{/each}
				</select>
			</label>
			{#if missionId}
				<a class="chip" href="/companion/workbench">
					Mission: {missionTitleById.get(missionId) ?? missionId} ✕
				</a>
			{/if}
		</div>
	</header>

	{#if buckets.length === 0}
		<p class="empty">
			Noch keine AI-Aktivität{moduleFilter ? ` in ${moduleFilter}` : ''}. Sobald eine Mission läuft
			und Proposals approved werden, erscheinen die Änderungen hier.
		</p>
	{:else}
		<ol class="timeline">
			{#each buckets as b (b.key)}
				<li class="bucket">
					<header class="bucket-head">
						<div class="bucket-when">
							<span class="date">{formatDate(b.firstTimestamp)}</span>
							<span class="time">{formatTime(b.firstTimestamp)}</span>
						</div>
						<div class="bucket-title">
							<a href="/companion/missions?m={b.missionId}" class="mission-link">
								{missionTitleById.get(b.missionId) ?? b.missionId}
							</a>
							{#if b.rationale}
								<p class="rationale">{b.rationale}</p>
							{/if}
						</div>
					</header>
					<ul class="events">
						{#each b.events as e (e.meta.id)}
							<li class="event">
								<span class="event-mod">{e.meta.appId}</span>
								<span class="event-desc">{describeEvent(e)}</span>
								<a class="event-link" href={moduleRoute(e)} title="Zum Modul">
									<ArrowSquareOut size={12} />
								</a>
							</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ol>
	{/if}
</div>

<style>
	.page {
		max-width: 960px;
		margin: 0 auto;
		padding: 1.5rem;
	}
	.page-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--color-muted, #888);
		text-decoration: none;
		font-size: 0.875rem;
	}
	.title {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
	}
	.title h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	.filters {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
	}
	.filters label {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
	}
	.filters select {
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--color-border, #ddd);
		border-radius: 0.25rem;
		font: inherit;
	}
	.small {
		font-size: 0.75rem;
		color: var(--color-muted, #888);
	}
	.chip {
		display: inline-flex;
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--color-border, #ddd);
		border-radius: 999px;
		font-size: 0.75rem;
		color: var(--color-fg, inherit);
		text-decoration: none;
		background: color-mix(in oklab, var(--color-primary, #6b5bff) 8%, transparent);
	}

	.empty {
		color: var(--color-muted, #888);
		font-size: 0.9rem;
		padding: 2rem 0;
		text-align: center;
	}

	.timeline {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.bucket {
		border: 1px solid var(--color-border, #ddd);
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		background: var(--color-bg, #fff);
	}
	.bucket-head {
		display: grid;
		grid-template-columns: 4.5rem 1fr;
		gap: 0.75rem;
		align-items: start;
		margin-bottom: 0.5rem;
	}
	.bucket-when {
		display: flex;
		flex-direction: column;
		color: var(--color-muted, #888);
		font-variant-numeric: tabular-nums;
	}
	.bucket-when .date {
		font-size: 0.8125rem;
	}
	.bucket-when .time {
		font-size: 0.6875rem;
	}
	.mission-link {
		font-weight: 600;
		color: color-mix(in oklab, var(--color-primary, #6b5bff) 85%, var(--color-fg, #000));
		text-decoration: none;
	}
	.mission-link:hover {
		text-decoration: underline;
	}
	.rationale {
		margin: 0.25rem 0 0;
		color: var(--color-muted, #666);
		font-size: 0.8125rem;
		font-style: italic;
	}

	.events {
		list-style: none;
		padding: 0 0 0 5.25rem;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.event {
		display: grid;
		grid-template-columns: 5rem 1fr auto;
		gap: 0.5rem;
		align-items: center;
		font-size: 0.8125rem;
		padding: 0.25rem 0;
		border-top: 1px dashed color-mix(in oklab, var(--color-border, #ddd) 70%, transparent);
	}
	.event:first-child {
		border-top: none;
	}
	.event-mod {
		color: var(--color-muted, #888);
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.6875rem;
		text-transform: uppercase;
	}
	.event-link {
		color: var(--color-muted, #888);
		display: inline-flex;
	}
	.event-link:hover {
		color: var(--color-primary, #6b5bff);
	}
</style>
