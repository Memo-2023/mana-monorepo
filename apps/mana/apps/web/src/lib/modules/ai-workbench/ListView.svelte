<!--
  AI Workbench app — timeline of AI activity, grouped per mission
  iteration. Per-bucket Revert button.
-->
<script lang="ts">
	import { ArrowSquareOut, ArrowCounterClockwise } from '@mana/shared-icons';
	import { useAiTimeline, bucketByIteration } from '$lib/data/ai/timeline/queries';
	import { useMissions } from '$lib/data/ai/missions/queries';
	import { useAgents } from '$lib/data/ai/agents/queries';
	import { revertIteration } from '$lib/data/ai/revert/revert-iteration';
	import { fetchDecryptAudit, type AuditRow } from '$lib/data/ai/audit/queries';
	import { isMissionGrantsEnabled } from '$lib/api/config';
	import type { DomainEvent } from '$lib/data/events/types';

	let moduleFilter = $state<string | null>(null);
	let missionFilter = $state<string | null>(null);
	let agentFilter = $state<string | null>(null);
	let timeRangeFilter = $state<'24h' | '7d' | 'all'>('all');

	const events = $derived(
		useAiTimeline({
			missionId: missionFilter ?? undefined,
			module: moduleFilter ?? undefined,
			limit: 500,
		})
	);
	const allBuckets = $derived(bucketByIteration(events.value));
	// Agent + time-range filters are applied client-side after bucketing
	// because the useAiTimeline query is keyed by module/mission only
	// today. If the volume ever grows large enough for this to matter,
	// push them into the query.
	const buckets = $derived(
		allBuckets
			.filter((b) => (agentFilter ? b.agentId === agentFilter : true))
			.filter((b) => {
				if (timeRangeFilter === 'all') return true;
				const ageMs = Date.now() - new Date(b.firstTimestamp).getTime();
				const cutoff = timeRangeFilter === '24h' ? 86_400_000 : 7 * 86_400_000;
				return ageMs <= cutoff;
			})
	);
	const missions = $derived(useMissions());
	const missionTitleById = $derived(new Map(missions.value.map((m) => [m.id, m.title])));
	const agents = $derived(useAgents());
	const agentById = $derived(new Map(agents.value.map((a) => [a.id, a])));
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

	// ── Tab switcher: timeline ↔ decrypt audit ─────────────
	const grantsEnabled = $derived(isMissionGrantsEnabled());
	let tab = $state<'timeline' | 'audit'>('timeline');
	let auditRows = $state<AuditRow[]>([]);
	let auditLoading = $state(false);
	let auditError = $state<string | null>(null);

	async function loadAudit() {
		auditLoading = true;
		auditError = null;
		try {
			auditRows = await fetchDecryptAudit({
				missionId: missionFilter ?? undefined,
				limit: 500,
			});
		} catch (err) {
			auditError = err instanceof Error ? err.message : String(err);
			auditRows = [];
		} finally {
			auditLoading = false;
		}
	}

	// Reload audit when user switches to audit tab OR changes mission filter
	// while on it. No effect while on timeline — no need to poll.
	$effect(() => {
		if (tab === 'audit') {
			void loadAudit();
		}
	});

	function formatAuditTs(iso: string): string {
		return new Date(iso).toLocaleString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		});
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
	<div class="tabs" role="tablist">
		<button
			type="button"
			role="tab"
			class="tab"
			class:tab-active={tab === 'timeline'}
			aria-selected={tab === 'timeline'}
			onclick={() => (tab = 'timeline')}
		>
			Timeline
		</button>
		{#if grantsEnabled}
			<button
				type="button"
				role="tab"
				class="tab"
				class:tab-active={tab === 'audit'}
				aria-selected={tab === 'audit'}
				onclick={() => (tab = 'audit')}
			>
				Datenzugriff
			</button>
		{/if}
	</div>

	<div class="filters">
		{#if tab === 'timeline'}
			<label>
				<span class="lbl">Modul</span>
				<select bind:value={moduleFilter}>
					<option value={null}>alle</option>
					{#each allModules as m}
						<option value={m}>{m}</option>
					{/each}
				</select>
			</label>
		{/if}
		<label>
			<span class="lbl">Mission</span>
			<select bind:value={missionFilter}>
				<option value={null}>alle</option>
				{#each missions.value as m (m.id)}
					<option value={m.id}>{m.title}</option>
				{/each}
			</select>
		</label>
		<label>
			<span class="lbl">Agent</span>
			<select bind:value={agentFilter}>
				<option value={null}>alle</option>
				{#each agents.value as a (a.id)}
					<option value={a.id}>{a.avatar ?? '🤖'} {a.name}</option>
				{/each}
			</select>
		</label>
		{#if tab === 'timeline'}
			<div class="range-group" role="tablist" aria-label="Zeitraum">
				{#each [{ id: '24h', label: '24h' }, { id: '7d', label: '7T' }, { id: 'all', label: 'alle' }] as const as opt}
					<button
						type="button"
						class="range-btn"
						class:range-active={timeRangeFilter === opt.id}
						aria-pressed={timeRangeFilter === opt.id}
						onclick={() => (timeRangeFilter = opt.id)}
					>
						{opt.label}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	{#if tab === 'audit'}
		{#if auditLoading}
			<p class="empty">Lade Audit…</p>
		{:else if auditError}
			<p class="empty error">Fehler: {auditError}</p>
		{:else if auditRows.length === 0}
			<p class="empty">
				Keine serverseitigen Entschlüsselungen. Der mana-ai Runner hat für diese Mission noch keine
				Records gelesen — entweder ist kein Key-Grant erteilt, oder die Mission nutzt nur plaintext
				Inputs (goals).
			</p>
		{:else}
			<table class="audit-table">
				<thead>
					<tr>
						<th>Zeit</th>
						<th>Mission</th>
						<th>Record</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{#each auditRows as r (r.id)}
						<tr class="audit-{r.status}">
							<td class="audit-ts">{formatAuditTs(r.ts)}</td>
							<td>{missionTitleById.get(r.missionId) ?? r.missionId}</td>
							<td><code>{r.tableName}:{r.recordId}</code></td>
							<td>
								<span class="audit-pill audit-pill-{r.status}">{r.status}</span>
								{#if r.reason}<span class="audit-reason">{r.reason}</span>{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	{:else if buckets.length === 0}
		<p class="empty">
			Noch keine AI-Aktivität. Sobald eine Mission läuft und Proposals approved werden, erscheinen
			hier die Änderungen.
		</p>
	{:else}
		<ol class="timeline">
			{#each buckets as b (b.key)}
				{@const bucketAgent = agentById.get(b.agentId)}
				<li class="bucket">
					<header class="bucket-head">
						<div class="when">
							<span class="date">{formatDate(b.firstTimestamp)}</span>
							<span class="time">{formatTime(b.firstTimestamp)}</span>
						</div>
						<div class="title-col">
							<span class="mission-title">
								<span class="agent-avatar" title={bucketAgent?.name ?? b.agentDisplayName}>
									{bucketAgent?.avatar ?? '🤖'}
								</span>
								<span class="agent-name">{bucketAgent?.name ?? b.agentDisplayName}</span>
								<span class="mission-sep">·</span>
								{missionTitleById.get(b.missionId) ?? b.missionId}
								<span class="event-count" title="{b.events.length} Änderungen in dieser Iteration"
									>{b.events.length}</span
								>
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
							title="Alle Änderungen dieser Iteration zurücknehmen"
						>
							<ArrowCounterClockwise size={13} weight="bold" />
							<span>{revertingKey === b.key ? 'Läuft…' : 'Rückgängig'}</span>
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
	.tabs {
		display: flex;
		gap: 0;
		border-bottom: 1px solid hsl(var(--color-border));
	}
	.tab {
		border: none;
		background: transparent;
		padding: 0.375rem 0.75rem;
		font: inherit;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
	}
	.tab-active {
		color: hsl(var(--color-foreground));
		border-bottom-color: hsl(var(--color-primary));
		font-weight: 600;
	}
	.audit-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8125rem;
	}
	.audit-table th,
	.audit-table td {
		text-align: left;
		padding: 0.375rem 0.5rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}
	.audit-table th {
		font-weight: 600;
		font-size: 0.6875rem;
		text-transform: uppercase;
		color: hsl(var(--color-muted-foreground));
	}
	.audit-table code {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.audit-ts {
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}
	.audit-pill {
		display: inline-block;
		padding: 0.0625rem 0.375rem;
		border-radius: 999px;
		font-size: 0.6875rem;
		font-weight: 600;
	}
	.audit-pill-ok {
		background: #d7f7e3;
		color: #1b7a3a;
	}
	.audit-pill-failed {
		background: #fde7c8;
		color: #8a4f00;
	}
	.audit-pill-scope-violation {
		background: #f7d7d7;
		color: #8a1b1b;
	}
	.audit-reason {
		margin-left: 0.25rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.error {
		color: hsl(var(--color-error));
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
	.range-group {
		display: inline-flex;
		gap: 0.125rem;
		margin-left: auto;
		background: hsl(var(--color-muted));
		border-radius: 0.375rem;
		padding: 0.125rem;
	}
	.range-btn {
		padding: 0.25rem 0.5rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font: inherit;
		font-size: 0.75rem;
		cursor: pointer;
		border-radius: 0.25rem;
	}
	.range-btn:hover {
		background: hsl(var(--color-surface));
	}
	.range-active {
		background: hsl(var(--color-surface));
		color: hsl(var(--color-foreground));
		font-weight: 600;
	}
	.event-count {
		display: inline-block;
		margin-left: 0.5rem;
		padding: 0 0.375rem;
		font-size: 0.6875rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		background: hsl(var(--color-muted));
		border-radius: 999px;
		font-variant-numeric: tabular-nums;
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
	.agent-avatar {
		display: inline-block;
		margin-right: 0.25rem;
	}
	.agent-name {
		font-weight: 600;
	}
	.mission-sep {
		margin: 0 0.25rem;
		color: hsl(var(--color-muted-foreground));
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
		gap: 0.375rem;
		padding: 0.4rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-surface));
		color: hsl(var(--color-foreground));
		font: inherit;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s,
			color 0.15s;
		align-self: start;
		white-space: nowrap;
	}
	.revert:hover:not(:disabled) {
		color: hsl(0 72% 45%);
		border-color: hsl(0 72% 60%);
		background: hsl(0 72% 95%);
	}
	.revert:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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
