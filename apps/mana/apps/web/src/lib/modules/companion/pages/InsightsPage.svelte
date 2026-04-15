<!--
  Insights page — local aggregation over `_events` and mission
  iterations. No server calls; everything comes from Dexie liveQueries.
-->
<script lang="ts">
	import { PageShell } from '$lib/components/page-carousel';
	import { COMPANION_PAGE_META } from './page-meta';
	import { useAiTimeline } from '$lib/data/ai/timeline/queries';
	import { useMissions } from '$lib/data/ai/missions/queries';

	interface Props {
		widthPx: number;
		maximized?: boolean;
		onClose: () => void;
		onMaximize: () => void;
		onResize: (widthPx: number, heightPx?: number) => void;
		onMoveLeft?: () => void;
		onMoveRight?: () => void;
	}

	let {
		widthPx,
		maximized = false,
		onClose,
		onMaximize,
		onResize,
		onMoveLeft,
		onMoveRight,
	}: Props = $props();

	const meta = COMPANION_PAGE_META.insights;
	const events = $derived(useAiTimeline({ limit: 1000 }));
	const missions = $derived(useMissions());

	// Count events per day across the last 14 days.
	const perDay = $derived.by(() => {
		const now = Date.now();
		const buckets: { day: string; count: number }[] = [];
		for (let i = 13; i >= 0; i--) {
			const d = new Date(now - i * 86_400_000);
			buckets.push({ day: d.toISOString().slice(0, 10), count: 0 });
		}
		for (const e of events.value) {
			const day = e.meta.timestamp.slice(0, 10);
			const b = buckets.find((x) => x.day === day);
			if (b) b.count++;
		}
		return buckets;
	});
	const maxPerDay = $derived(Math.max(1, ...perDay.map((b) => b.count)));

	// Aggregate iteration outcomes per mission.
	const missionStats = $derived.by(() =>
		missions.value.map((m) => {
			let approved = 0;
			let rejected = 0;
			let failed = 0;
			let awaiting = 0;
			for (const it of m.iterations) {
				if (it.overallStatus === 'approved') approved++;
				else if (it.overallStatus === 'rejected') rejected++;
				else if (it.overallStatus === 'failed') failed++;
				else if (it.overallStatus === 'awaiting-review') awaiting++;
			}
			return {
				id: m.id,
				title: m.title,
				approved,
				rejected,
				failed,
				awaiting,
				total: m.iterations.length,
			};
		})
	);

	// Top recurring feedback strings from iteration.userFeedback.
	const topFeedback = $derived.by(() => {
		const freq = new Map<string, number>();
		for (const m of missions.value) {
			for (const it of m.iterations) {
				if (!it.userFeedback) continue;
				// Normalize: lowercase + trim. Short strings, no ML tokenizer.
				const key = it.userFeedback.trim().toLowerCase().slice(0, 80);
				freq.set(key, (freq.get(key) ?? 0) + 1);
			}
		}
		return [...freq.entries()]
			.sort(([, a], [, b]) => b - a)
			.slice(0, 5)
			.map(([text, count]) => ({ text, count }));
	});

	// Simple approval rate: approved / (approved + rejected), ignoring
	// awaiting/failed.
	const approvalRate = $derived.by(() => {
		let a = 0;
		let r = 0;
		for (const m of missionStats) {
			a += m.approved;
			r += m.rejected;
		}
		if (a + r === 0) return null;
		return Math.round((a / (a + r)) * 100);
	});
</script>

<PageShell
	{widthPx}
	{maximized}
	{onClose}
	{onMaximize}
	{onResize}
	{onMoveLeft}
	{onMoveRight}
	title={meta.title}
	color={meta.color}
	icon={meta.icon}
>
	<div class="ins">
		<section>
			<h3>Approval-Rate</h3>
			{#if approvalRate === null}
				<p class="empty">Noch nicht genug Daten.</p>
			{:else}
				<div class="big">{approvalRate}%</div>
				<p class="sub">über alle Missions + alle Iterationen</p>
			{/if}
		</section>

		<section>
			<h3>AI-Events / Tag (14 Tage)</h3>
			<div class="chart">
				{#each perDay as b (b.day)}
					<div class="bar" title={`${b.day}: ${b.count}`}>
						<span
							class="fill"
							style="height: {(b.count / maxPerDay) * 100}%;"
							class:has-value={b.count > 0}
						></span>
					</div>
				{/each}
			</div>
		</section>

		<section>
			<h3>Pro Mission</h3>
			{#if missionStats.length === 0}
				<p class="empty">Keine Missions angelegt.</p>
			{:else}
				<ul class="m-stats">
					{#each missionStats as m (m.id)}
						<li>
							<span class="m-title">{m.title}</span>
							<span class="m-nums">
								<span class="n ok">{m.approved}</span>
								·
								<span class="n ko">{m.rejected}</span>
								·
								<span class="n wait">{m.awaiting}</span>
								·
								<span class="n err">{m.failed}</span>
							</span>
						</li>
					{/each}
				</ul>
				<p class="legend">
					<span class="n ok">●</span>approved ·
					<span class="n ko">●</span>rejected ·
					<span class="n wait">●</span>awaiting ·
					<span class="n err">●</span>failed
				</p>
			{/if}
		</section>

		<section>
			<h3>Häufigstes Feedback</h3>
			{#if topFeedback.length === 0}
				<p class="empty">Noch keine Freitext-Reviews.</p>
			{:else}
				<ul class="fb-list">
					{#each topFeedback as fb}
						<li>
							<span class="fb-count">{fb.count}×</span>
							<span class="fb-text">"{fb.text}"</span>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</PageShell>

<style>
	.ins {
		padding: 0.75rem 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	section h3 {
		margin: 0 0 0.375rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		color: hsl(var(--color-muted-foreground));
	}
	.empty {
		margin: 0;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
	}
	.big {
		font-size: 2.25rem;
		font-weight: 700;
		color: hsl(var(--color-primary));
		font-variant-numeric: tabular-nums;
	}
	.sub {
		margin: 0;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.chart {
		display: grid;
		grid-template-columns: repeat(14, 1fr);
		gap: 0.125rem;
		height: 64px;
		align-items: end;
	}
	.bar {
		display: flex;
		align-items: end;
		justify-content: center;
		height: 100%;
	}
	.fill {
		display: inline-block;
		width: 100%;
		background: hsl(var(--color-muted));
		border-radius: 0.125rem;
		min-height: 2px;
	}
	.fill.has-value {
		background: hsl(var(--color-primary));
	}
	.m-stats {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.m-stats li {
		display: flex;
		justify-content: space-between;
		padding: 0.375rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		font-size: 0.8125rem;
	}
	.m-title {
		font-weight: 600;
	}
	.m-nums {
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-muted-foreground));
	}
	.n {
		font-weight: 600;
	}
	.n.ok {
		color: #1b7a3a;
	}
	.n.ko {
		color: #8a1b1b;
	}
	.n.wait {
		color: #8a5a00;
	}
	.n.err {
		color: #8a1b1b;
		opacity: 0.7;
	}
	.legend {
		margin: 0.25rem 0 0;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.fb-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.fb-list li {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.5rem;
		font-size: 0.8125rem;
	}
	.fb-count {
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-primary));
	}
	.fb-text {
		font-style: italic;
		color: hsl(var(--color-muted-foreground));
	}
</style>
