<!--
  Augur — Oracle View

  Reads the same Witness data through an empirical lens. Three sections:

    1. Overall Stats — total / resolved / hit-rate / Brier
    2. Calibration per Source — ranked table of "Forecaster in your life"
    3. Vibe-Hit-Rate — did your good/bad vibes track reality?

  Below ORACLE_COLD_START_MIN resolved entries, surfaces a cold-start
  empty state ("collect first, evaluate later") rather than misleading
  numbers.

  Correlation Matrix (cross-module mood/sleep mining) is M4-followup —
  needs the mood/sleep query layer pulled in. Not in this PR.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { useAllAugurEntries } from '../queries';
	import {
		calibrationPerSource,
		vibeHitRates,
		overallStats,
		ORACLE_COLD_START_MIN,
	} from '../lib/calibration';
	import { computeCorrelations, type CorrelationFinding } from '../lib/correlation-engine';
	import { useMoodByDate, useSleepByDate } from '../lib/signal-bridge.svelte';
	import { KIND_LABELS, SOURCE_CATEGORY_LABELS, VIBE_LABELS, VIBE_COLORS } from '../types';

	// Metric units stay as constants — they're not translated, just symbolic.
	const METRIC_UNITS = { min: 'min', score: '/10', score5: '/5' } as const;

	const currentYear = new Date().getFullYear();

	const entries$ = useAllAugurEntries();
	const entries = $derived(entries$.value);

	const moodByDate$ = useMoodByDate();
	const moodByDate = $derived(moodByDate$.value);
	const sleepByDate$ = useSleepByDate();
	const sleepByDate = $derived(sleepByDate$.value);

	const stats = $derived(overallStats(entries));
	const sourceRows = $derived(calibrationPerSource(entries));
	const vibeRows = $derived(vibeHitRates(entries));
	const correlations = $derived(computeCorrelations(entries, moodByDate, sleepByDate));

	function metricLabel(f: CorrelationFinding): string {
		switch (f.metric) {
			case 'mood-level':
				return $_('augur.oracle.corrMoodLevel');
			case 'sleep-quality':
				return $_('augur.oracle.corrSleepQuality');
			case 'sleep-duration':
				return $_('augur.oracle.corrSleepDuration');
		}
	}

	function metricUnit(f: CorrelationFinding): string {
		switch (f.metric) {
			case 'mood-level':
				return METRIC_UNITS.score;
			case 'sleep-quality':
				return METRIC_UNITS.score5;
			case 'sleep-duration':
				return METRIC_UNITS.min;
		}
	}

	function bucketLabel(f: CorrelationFinding): string {
		if (f.dimension === 'vibe') return VIBE_LABELS[f.bucket as keyof typeof VIBE_LABELS].de;
		return KIND_LABELS[f.bucket as keyof typeof KIND_LABELS].de;
	}

	function bucketColor(f: CorrelationFinding): string {
		if (f.dimension === 'vibe') return VIBE_COLORS[f.bucket as keyof typeof VIBE_COLORS];
		return '#7c3aed';
	}

	function fmt(value: number, metric: CorrelationFinding['metric']): string {
		if (metric === 'sleep-duration') return Math.round(value).toString();
		return value.toFixed(1);
	}

	function pct(value: number | null): string {
		if (value == null) return $_('augur.common.brierUnknown');
		return `${Math.round(value * 100)}%`;
	}

	function brier(value: number | null): string {
		if (value == null) return $_('augur.common.brierUnknown');
		return value.toFixed(3);
	}

	const isColdStart = $derived(stats.resolved < ORACLE_COLD_START_MIN);
</script>

<div class="oracle">
	<header class="head">
		<div>
			<h2>{$_('augur.oracle.title')}</h2>
			<p class="sub">{$_('augur.oracle.subtitle')}</p>
		</div>
		<a class="recap-link" href="/augur/recap/{currentYear}">{$_('augur.oracle.yearRecapLink')}</a>
	</header>

	<section class="stats">
		<div class="stat">
			<span class="stat-num">{stats.total}</span>
			<span class="stat-label">{$_('augur.oracle.statTotal')}</span>
		</div>
		<div class="stat">
			<span class="stat-num">{stats.resolved}</span>
			<span class="stat-label">{$_('augur.oracle.statResolved')}</span>
		</div>
		<div class="stat">
			<span class="stat-num">{stats.open}</span>
			<span class="stat-label">{$_('augur.oracle.statOpen')}</span>
		</div>
		<div class="stat highlight">
			<span class="stat-num">{pct(stats.hitRate)}</span>
			<span class="stat-label">{$_('augur.oracle.statHitRate')}</span>
		</div>
		<div class="stat" title={$_('augur.oracle.statBrierBaseline')}>
			<span class="stat-num">{brier(stats.brier)}</span>
			<span class="stat-label">{$_('augur.oracle.statBrier')} ({stats.brierN})</span>
		</div>
	</section>

	{#if isColdStart}
		<section class="cold-start">
			<p>{$_('augur.oracle.coldStart')}</p>
			<p class="hint">
				{$_('augur.oracle.coldStartHint')}
				<strong>{ORACLE_COLD_START_MIN}</strong>
				{$_('augur.oracle.coldStartUnit')}
			</p>
			<div class="progress">
				<div
					class="progress-bar"
					style:width="{Math.min(100, (stats.resolved / ORACLE_COLD_START_MIN) * 100)}%"
				></div>
			</div>
		</section>
	{:else}
		<section class="block">
			<header class="block-head">
				<h3>{$_('augur.oracle.sourceTitle')}</h3>
				<p>{$_('augur.oracle.sourceSub')}</p>
			</header>
			{#if sourceRows.length === 0}
				<p class="empty">{$_('augur.oracle.vibeNoData')}</p>
			{:else}
				<table class="ranked">
					<thead>
						<tr>
							<th>{$_('augur.oracle.sourceCol')}</th>
							<th class="num">{$_('augur.oracle.sourceN')}</th>
							<th class="num">{$_('augur.oracle.sourceHit')}</th>
							<th class="num">{$_('augur.oracle.sourceBrier')}</th>
							<th class="mix">{$_('augur.oracle.sourceMix')}</th>
						</tr>
					</thead>
					<tbody>
						{#each sourceRows as row (row.sourceCategory)}
							<tr>
								<td>{SOURCE_CATEGORY_LABELS[row.sourceCategory].de}</td>
								<td class="num">{row.n}</td>
								<td class="num bold">{pct(row.hitRate)}</td>
								<td class="num" title={row.brierN > 0 ? `n=${row.brierN}` : ''}>
									{brier(row.brier)}
								</td>
								<td class="mix">
									<div class="mix-bar">
										<span
											class="seg yes"
											style:flex={row.fulfilled}
											title="{row.fulfilled} fulfilled"
										></span>
										<span class="seg partly" style:flex={row.partly} title="{row.partly} partly"
										></span>
										<span
											class="seg no"
											style:flex={row.notFulfilled}
											title="{row.notFulfilled} not fulfilled"
										></span>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</section>

		<section class="block">
			<header class="block-head">
				<h3>{$_('augur.oracle.corrTitle')}</h3>
				<p>{$_('augur.oracle.corrSub')}</p>
			</header>
			{#if correlations.length === 0}
				<p class="empty">{$_('augur.oracle.corrEmpty')}</p>
			{:else}
				<ul class="corr-list">
					{#each correlations.slice(0, 6) as f (f.dimension + f.bucket + f.metric + f.windowDays)}
						<li class="corr" style:--corr-color={bucketColor(f)}>
							<div class="corr-row">
								<span class="corr-bucket">{bucketLabel(f)}</span>
								<span class="corr-arrow">{f.delta >= 0 ? '↑' : '↓'}</span>
								<span class="corr-delta">
									{f.delta >= 0 ? '+' : ''}{fmt(f.delta, f.metric)}{metricUnit(f)}
								</span>
								<span class="corr-n">n={f.n}</span>
							</div>
							<p class="corr-text">
								{$_('augur.oracle.corrAfter')}
								{bucketLabel(f).toLowerCase()}-Zeichen {metricLabel(f)}
								<strong>{fmt(f.bucketMean, f.metric)}{metricUnit(f)}</strong>
								— {$_('augur.oracle.corrVsBaseline')}
								{fmt(f.baseline, f.metric)}{metricUnit(f)}.
							</p>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="block">
			<header class="block-head">
				<h3>{$_('augur.oracle.vibeTitle')}</h3>
				<p>{$_('augur.oracle.vibeSub')}</p>
			</header>
			<div class="vibe-grid">
				{#each vibeRows as row (row.vibe)}
					<div class="vibe-card" style:--vibe-color={VIBE_COLORS[row.vibe]}>
						<div class="vibe-label">{VIBE_LABELS[row.vibe].de}</div>
						{#if row.n === 0}
							<div class="vibe-empty">{$_('augur.oracle.vibeNoData')}</div>
						{:else}
							<div class="vibe-rate">{pct(row.hitRate)}</div>
							<div class="vibe-meta">{$_('augur.oracle.vibeHit')} (n={row.n})</div>
							{#if row.directionalHitRate != null}
								<div class="vibe-rate small">{pct(row.directionalHitRate)}</div>
								<div class="vibe-meta">{$_('augur.oracle.vibeDir')}</div>
							{/if}
						{/if}
					</div>
				{/each}
			</div>
		</section>
	{/if}
</div>

<style>
	.oracle {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1rem;
		max-width: 64rem;
		margin: 0 auto;
		width: 100%;
	}
	.head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.head h2 {
		margin: 0;
		font-size: 1.4rem;
		font-weight: 600;
	}
	.head .sub {
		margin: 0.15rem 0 0;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
		font-size: 0.95rem;
	}
	.recap-link {
		font-size: 0.9rem;
		color: #c4b5fd;
		text-decoration: none;
		padding: 0.4rem 0.8rem;
		border-radius: 0.5rem;
		border: 1px solid color-mix(in srgb, #7c3aed 40%, transparent);
		background: color-mix(in srgb, #7c3aed 10%, transparent);
	}
	.recap-link:hover {
		background: color-mix(in srgb, #7c3aed 20%, transparent);
	}
	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
		gap: 0.6rem;
	}
	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.85rem 1rem;
		border-radius: 0.75rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.07));
	}
	.stat.highlight {
		border-color: color-mix(in srgb, #7c3aed 60%, transparent);
		background: color-mix(in srgb, #7c3aed 14%, transparent);
	}
	.stat-num {
		font-size: 1.4rem;
		font-weight: 600;
		color: var(--color-text, inherit);
	}
	.stat-label {
		font-size: 0.78rem;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
		text-transform: lowercase;
	}
	.cold-start {
		text-align: center;
		padding: 2.5rem 1rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.03));
		border: 1px dashed var(--color-border, rgba(255, 255, 255, 0.12));
		border-radius: 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		align-items: center;
	}
	.cold-start p {
		margin: 0;
		color: var(--color-text, inherit);
	}
	.cold-start .hint {
		font-size: 0.92rem;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.65));
	}
	.cold-start strong {
		color: #c4b5fd;
	}
	.progress {
		width: 14rem;
		height: 0.45rem;
		border-radius: 999px;
		background: var(--color-surface-muted, rgba(255, 255, 255, 0.06));
		overflow: hidden;
	}
	.progress-bar {
		height: 100%;
		background: linear-gradient(to right, #7c3aed, #c4b5fd);
		transition: width 0.3s ease;
	}
	.block {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}
	.block-head h3 {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 600;
	}
	.block-head p {
		margin: 0.1rem 0 0;
		font-size: 0.85rem;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
	}
	.empty {
		font-size: 0.9rem;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
		padding: 0.5rem 0;
	}
	.ranked {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	.ranked th,
	.ranked td {
		text-align: left;
		padding: 0.55rem 0.7rem;
		border-bottom: 1px solid var(--color-border, rgba(255, 255, 255, 0.06));
	}
	.ranked th {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
		font-weight: 500;
	}
	.ranked tbody tr:last-child td {
		border-bottom: 0;
	}
	.num {
		text-align: right;
	}
	.bold {
		font-weight: 600;
	}
	.mix {
		min-width: 8rem;
	}
	.mix-bar {
		display: flex;
		height: 0.55rem;
		border-radius: 999px;
		overflow: hidden;
		background: var(--color-surface-muted, rgba(255, 255, 255, 0.05));
	}
	.seg.yes {
		background: #10b981;
	}
	.seg.partly {
		background: #f59e0b;
	}
	.seg.no {
		background: #ef4444;
	}
	.seg {
		min-width: 0;
	}
	.vibe-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: 0.75rem;
	}
	.vibe-card {
		padding: 0.85rem 1rem;
		border-radius: 0.75rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.07));
		border-left: 4px solid var(--vibe-color);
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.vibe-label {
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-size: 0.75rem;
		color: var(--vibe-color);
		font-weight: 500;
	}
	.vibe-rate {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-text, inherit);
	}
	.vibe-rate.small {
		font-size: 1.1rem;
		margin-top: 0.4rem;
	}
	.vibe-meta {
		font-size: 0.78rem;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
	}
	.vibe-empty {
		font-size: 0.85rem;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.5));
	}
	.corr-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.corr {
		padding: 0.7rem 0.85rem;
		border-radius: 0.65rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.07));
		border-left: 3px solid var(--corr-color);
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.corr-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.corr-bucket {
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-size: 0.72rem;
		color: var(--corr-color);
		font-weight: 600;
	}
	.corr-arrow {
		font-size: 1rem;
		color: var(--corr-color);
		font-weight: 600;
	}
	.corr-delta {
		font-weight: 600;
		color: var(--color-text, inherit);
	}
	.corr-n {
		margin-left: auto;
		font-size: 0.75rem;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.5));
	}
	.corr-text {
		margin: 0;
		font-size: 0.88rem;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.7));
		line-height: 1.4;
	}
	.corr-text strong {
		color: var(--color-text, inherit);
	}
</style>
