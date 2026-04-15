<!--
  AI Workbench app — timeline of AI activity, grouped per mission
  iteration. Per-bucket Revert button.
-->
<script lang="ts">
	import { ArrowSquareOut, ArrowCounterClockwise } from '@mana/shared-icons';
	import { useAiTimeline, bucketByIteration } from '$lib/data/ai/timeline/queries';
	import { useMissions } from '$lib/data/ai/missions/queries';
	import { revertIteration } from '$lib/data/ai/revert/revert-iteration';
	import type { DomainEvent } from '$lib/data/events/types';

	let moduleFilter = $state<string | null>(null);
	let missionFilter = $state<string | null>(null);

	const events = $derived(
		useAiTimeline({
			missionId: missionFilter ?? undefined,
			module: moduleFilter ?? undefined,
			limit: 500,
		})
	);
	const buckets = $derived(bucketByIteration(events.value));
	const missions = $derived(useMissions());
	const missionTitleById = $derived(new Map(missions.value.map((m) => [m.id, m.title])));
	const allModules = $derived(Array.from(new Set(events.value.map((e) => e.meta.appId))).sort());

	function describeEvent(e: DomainEvent): string {
		const payload = e.payload as Record<string, unknown> | undefined;
		const title =
			payload && 'title' in payload && typeof payload.title === 'string'
				? payload.title
				: undefined;
		return title ? `${e.type} · ${title}` : e.type;
	}
	function formatTime(iso: string) {
		return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
	}
	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
	}

	let revertingKey = $state<string | null>(null);
	async function handleRevert(key: string, missionId: string, iterationId: string) {
		if (!confirm('Alle AI-Writes dieser Iteration zurücknehmen?')) return;
		revertingKey = key;
		try {
			const stats = await revertIteration(missionId, iterationId);
			const parts = [`${stats.reverted} zurückgenommen`];
			if (stats.skippedUnsupported > 0) parts.push(`${stats.skippedUnsupported} nicht unterstützt`);
			if (stats.failed > 0) parts.push(`${stats.failed} fehlgeschlagen`);
			alert(parts.join(' · '));
		} catch (err) {
			console.error(err);
			alert('Revert fehlgeschlagen — siehe Console.');
		} finally {
			revertingKey = null;
		}
	}
</script>

<div class="wb">
	<div class="filters">
		<label>
			<span class="lbl">Modul</span>
			<select bind:value={moduleFilter}>
				<option value={null}>alle</option>
				{#each allModules as m}
					<option value={m}>{m}</option>
				{/each}
			</select>
		</label>
		<label>
			<span class="lbl">Mission</span>
			<select bind:value={missionFilter}>
				<option value={null}>alle</option>
				{#each missions.value as m (m.id)}
					<option value={m.id}>{m.title}</option>
				{/each}
			</select>
		</label>
	</div>

	{#if buckets.length === 0}
		<p class="empty">
			Noch keine AI-Aktivität. Sobald eine Mission läuft und Proposals approved werden, erscheinen
			hier die Änderungen.
		</p>
	{:else}
		<ol class="timeline">
			{#each buckets as b (b.key)}
				<li class="bucket">
					<header class="bucket-head">
						<div class="when">
							<span class="date">{formatDate(b.firstTimestamp)}</span>
							<span class="time">{formatTime(b.firstTimestamp)}</span>
						</div>
						<div class="title-col">
							<span class="mission-title">
								{missionTitleById.get(b.missionId) ?? b.missionId}
							</span>
							{#if b.rationale}
								<p class="rationale">{b.rationale}</p>
							{/if}
						</div>
						<button
							type="button"
							class="revert"
							disabled={revertingKey !== null}
							onclick={() => handleRevert(b.key, b.missionId, b.iterationId)}
						>
							<ArrowCounterClockwise size={12} />
							<span>{revertingKey === b.key ? 'Läuft…' : 'Revert'}</span>
						</button>
					</header>
					<ul class="events">
						{#each b.events as e (e.meta.id)}
							<li class="event">
								<span class="mod">{e.meta.appId}</span>
								<span class="desc">{describeEvent(e)}</span>
								<a class="link" href={`/${e.meta.appId}`} title="Zum Modul">
									<ArrowSquareOut size={11} />
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
	.wb {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.75rem 1rem 1.25rem;
	}
	.filters {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.filters label {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
	}
	.lbl {
		font-size: 0.6875rem;
		text-transform: uppercase;
		color: hsl(var(--color-muted-foreground));
	}
	.filters select {
		padding: 0.25rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.25rem;
		font: inherit;
		font-size: 0.8125rem;
	}
	.empty {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		text-align: center;
		padding: 2rem 0;
	}
	.timeline {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}
	.bucket {
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		padding: 0.625rem 0.75rem;
	}
	.bucket-head {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.5rem;
		margin-bottom: 0.375rem;
	}
	.when {
		display: flex;
		flex-direction: column;
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
	}
	.when .date {
		font-size: 0.75rem;
	}
	.when .time {
		font-size: 0.6875rem;
	}
	.mission-title {
		font-weight: 600;
		color: hsl(var(--color-primary));
	}
	.rationale {
		margin: 0.125rem 0 0;
		font-size: 0.75rem;
		font-style: italic;
		color: hsl(var(--color-muted-foreground));
	}
	.revert {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.25rem;
		background: hsl(var(--color-surface));
		color: hsl(var(--color-muted-foreground));
		font: inherit;
		font-size: 0.6875rem;
		cursor: pointer;
	}
	.revert:hover:not(:disabled) {
		color: #8a1b1b;
		border-color: #e99;
		background: #fff0f0;
	}
	.events {
		list-style: none;
		padding: 0 0 0 3.5rem;
		margin: 0;
	}
	.event {
		display: grid;
		grid-template-columns: 4.5rem 1fr auto;
		gap: 0.375rem;
		padding: 0.25rem 0;
		align-items: center;
		font-size: 0.8125rem;
		border-top: 1px dashed hsl(var(--color-border));
	}
	.event:first-child {
		border-top: none;
	}
	.mod {
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.625rem;
		text-transform: uppercase;
		color: hsl(var(--color-muted-foreground));
	}
	.link {
		color: hsl(var(--color-muted-foreground));
	}
</style>
