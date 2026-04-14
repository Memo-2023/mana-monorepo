<!--
  Sleep — ListView (Dashboard)
  Last night summary, week bars, sleep goal, debt, stats, hygiene.
-->
<script lang="ts">
	import {
		useAllSleepEntries,
		useAllSleepHygieneLogs,
		useAllSleepHygieneChecks,
		useSleepSettings,
		getLastNight,
		hasLoggedToday,
		getAvgDuration,
		getAvgQuality,
		getWeekSleepDebt,
		getConsistencyScore,
		getCurrentStreak,
		getWeekData,
		getQualityHeatmap,
		getHygieneCorrelation,
		getEffectiveSettings,
		formatDuration,
		formatTime,
	} from './queries';
	import { QUALITY_LABELS } from './types';
	import MorningLog from './components/MorningLog.svelte';
	import HygieneChecklist from './components/HygieneChecklist.svelte';

	const entriesQuery = useAllSleepEntries();
	const hygieneLogsQuery = useAllSleepHygieneLogs();
	const hygieneChecksQuery = useAllSleepHygieneChecks();
	const settingsQuery = useSleepSettings();

	let entries = $derived(entriesQuery.value);
	let hygieneLogs = $derived(hygieneLogsQuery.value);
	let hygieneChecks = $derived(hygieneChecksQuery.value);
	let settingsRaw = $derived(settingsQuery.value);

	let settings = $derived(getEffectiveSettings(settingsRaw));
	let lastNight = $derived(getLastNight(entries));
	let logged = $derived(hasLoggedToday(entries));
	let avgDuration7 = $derived(getAvgDuration(entries, 7));
	let avgQuality7 = $derived(getAvgQuality(entries, 7));
	let sleepDebt = $derived(getWeekSleepDebt(entries, settings.goalMin));
	let consistency = $derived(getConsistencyScore(entries, 14));
	let streak = $derived(getCurrentStreak(entries));
	let weekData = $derived(getWeekData(entries));
	let heatmap = $derived(getQualityHeatmap(entries, 30));
	let hygieneCorr = $derived(getHygieneCorrelation(entries, hygieneLogs));

	// UI state
	let showMorningLog = $state(false);
	let showHygiene = $state(false);

	function goalProgress(durationMin: number): number {
		return Math.min(durationMin / settings.goalMin, 1);
	}

	function qualityColor(q: number): string {
		if (q >= 4) return '#22c55e';
		if (q >= 3) return '#f59e0b';
		if (q >= 1) return '#ef4444';
		return 'transparent';
	}

	// Max bar height for week chart
	let maxWeekMin = $derived(Math.max(...weekData.map((d) => d.durationMin), settings.goalMin));
</script>

{#if showMorningLog}
	<MorningLog
		defaultBedtime={settings.targetBedtime}
		onComplete={() => (showMorningLog = false)}
		onCancel={() => (showMorningLog = false)}
	/>
{:else if showHygiene}
	<HygieneChecklist
		checks={hygieneChecks}
		onComplete={() => (showHygiene = false)}
		onCancel={() => (showHygiene = false)}
	/>
{:else}
	<div class="sleep-view">
		<!-- Log CTA if not logged -->
		{#if !logged}
			<button class="log-cta" onclick={() => (showMorningLog = true)}>
				<span class="cta-icon">🌙</span>
				<span class="cta-text">Wie hast du geschlafen?</span>
				<span class="cta-sub">Jetzt loggen</span>
			</button>
		{/if}

		<!-- Last Night -->
		{#if lastNight}
			<div class="last-night">
				<div class="ln-header">
					<span class="ln-label">Letzte Nacht</span>
					{#if logged}
						<button class="edit-btn" onclick={() => (showMorningLog = true)}>Bearbeiten</button>
					{/if}
				</div>
				<div class="ln-bar-container">
					<span class="ln-time">{formatTime(lastNight.bedtime)}</span>
					<div class="ln-bar">
						<div
							class="ln-bar-fill"
							style:width="{goalProgress(lastNight.durationMin) * 100}%"
						></div>
					</div>
					<span class="ln-time">{formatTime(lastNight.wakeTime)}</span>
				</div>
				<div class="ln-stats">
					<span class="ln-duration">{formatDuration(lastNight.durationMin)}</span>
					<span class="ln-quality">
						{#each [1, 2, 3, 4, 5] as val}
							<span class="mini-star" class:filled={lastNight.quality >= val}>★</span>
						{/each}
					</span>
					{#if lastNight.interruptions > 0}
						<span class="ln-interruptions">{lastNight.interruptions}× aufgewacht</span>
					{/if}
				</div>
				<div class="ln-goal">
					{formatDuration(lastNight.durationMin)} / {formatDuration(settings.goalMin)}
					<span class="goal-pct">{Math.round(goalProgress(lastNight.durationMin) * 100)}%</span>
				</div>
			</div>
		{/if}

		<!-- Week Chart -->
		<div class="week-section">
			<span class="section-label">Diese Woche</span>
			<div class="week-chart">
				{#each weekData as day}
					<div class="week-col">
						<div class="bar-wrapper">
							{#if day.durationMin > 0}
								<div
									class="bar"
									style:height="{(day.durationMin / maxWeekMin) * 100}%"
									style:background={qualityColor(day.quality)}
								></div>
							{/if}
							<!-- Goal line -->
							<div class="goal-line" style:bottom="{(settings.goalMin / maxWeekMin) * 100}%"></div>
						</div>
						<span class="week-label">{day.dayLabel}</span>
						{#if day.durationMin > 0}
							<span class="week-dur">{Math.floor(day.durationMin / 60)}h</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Stats Grid -->
		<div class="stats-grid">
			<div class="stat">
				<span class="stat-val">{formatDuration(avgDuration7)}</span>
				<span class="stat-lbl">Ø Dauer (7T)</span>
			</div>
			<div class="stat">
				<span class="stat-val">{avgQuality7}</span>
				<span class="stat-lbl">Ø Qualität</span>
			</div>
			<div class="stat">
				<span class="stat-val" class:debt={sleepDebt > 0}
					>{sleepDebt > 0 ? '-' : '+'}{formatDuration(Math.abs(sleepDebt))}</span
				>
				<span class="stat-lbl">Schlafschuld</span>
			</div>
			<div class="stat">
				<span class="stat-val">{consistency}%</span>
				<span class="stat-lbl">Konsistenz</span>
			</div>
			<div class="stat">
				<span class="stat-val">{streak}</span>
				<span class="stat-lbl">Streak</span>
			</div>
		</div>

		<!-- Quality Heatmap -->
		<div class="heatmap-section">
			<span class="section-label">Qualität (30 Tage)</span>
			<div class="heatmap-grid">
				{#each heatmap as day}
					<div
						class="heat-cell"
						style:background={day.quality > 0 ? qualityColor(day.quality) : ''}
						title="{day.date}: {QUALITY_LABELS[day.quality]?.de ?? '—'}"
					></div>
				{/each}
			</div>
		</div>

		<!-- Hygiene Correlation -->
		{#if hygieneCorr}
			<div class="correlation-card">
				<span class="section-label">Schlafhygiene-Effekt</span>
				<div class="corr-row">
					<span class="corr-label">Mit Hygiene (≥70%):</span>
					<span class="corr-val good">{hygieneCorr.withHygiene} ★</span>
				</div>
				<div class="corr-row">
					<span class="corr-label">Ohne:</span>
					<span class="corr-val">{hygieneCorr.withoutHygiene} ★</span>
				</div>
			</div>
		{/if}

		<!-- Actions -->
		<div class="actions-row">
			<button class="action-btn" onclick={() => (showMorningLog = true)}> Schlaf loggen </button>
			<button class="action-btn secondary" onclick={() => (showHygiene = true)}>
				Hygiene-Check
			</button>
		</div>
	</div>
{/if}

<style>
	.sleep-view {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.5rem;
	}

	.section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}

	/* ── Log CTA ─────────────────────────────────── */
	.log-cta {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 1rem;
		border-radius: 0.75rem;
		background: linear-gradient(135deg, hsl(245 60% 96%), hsl(260 50% 94%));
		border: 1px solid hsl(245 40% 88%);
		cursor: pointer;
		transition: transform 0.15s;
		color: hsl(var(--color-foreground));
	}

	:global(.dark) .log-cta {
		background: linear-gradient(135deg, hsl(245 30% 14%), hsl(260 25% 16%));
		border-color: hsl(245 30% 22%);
	}

	.log-cta:hover {
		transform: scale(1.02);
	}

	.cta-icon {
		font-size: 1.5rem;
	}

	.cta-text {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.cta-sub {
		font-size: 0.6875rem;
		color: #6366f1;
		font-weight: 500;
	}

	/* ── Last Night ──────────────────────────────── */
	.last-night {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
	}

	.ln-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.ln-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}

	.edit-btn {
		font-size: 0.6875rem;
		color: #6366f1;
		background: none;
		border: none;
		cursor: pointer;
		text-decoration: underline;
	}

	.ln-bar-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.ln-time {
		font-size: 0.75rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-foreground));
		flex-shrink: 0;
	}

	.ln-bar {
		flex: 1;
		height: 8px;
		border-radius: 4px;
		background: hsl(var(--color-border));
		overflow: hidden;
	}

	.ln-bar-fill {
		height: 100%;
		border-radius: 4px;
		background: #6366f1;
		transition: width 0.4s ease-out;
	}

	.ln-stats {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.ln-duration {
		font-size: 1.125rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
	}

	.ln-quality {
		display: flex;
		gap: 0.0625rem;
	}

	.mini-star {
		font-size: 0.75rem;
		color: hsl(var(--color-border));
	}

	.mini-star.filled {
		color: #f59e0b;
	}

	.ln-interruptions {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.ln-goal {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
	}

	.goal-pct {
		font-weight: 600;
		color: #6366f1;
		margin-left: 0.25rem;
	}

	/* ── Week Chart ──────────────────────────────── */
	.week-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.week-chart {
		display: flex;
		gap: 0.375rem;
		height: 100px;
		align-items: flex-end;
	}

	.week-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
	}

	.bar-wrapper {
		flex: 1;
		width: 100%;
		position: relative;
		display: flex;
		align-items: flex-end;
	}

	.bar {
		width: 100%;
		border-radius: 3px 3px 0 0;
		min-height: 2px;
		transition: height 0.3s ease;
	}

	.goal-line {
		position: absolute;
		left: -2px;
		right: -2px;
		height: 1px;
		background: hsl(var(--color-muted-foreground));
		opacity: 0.4;
	}

	.week-label {
		font-size: 0.5625rem;
		color: hsl(var(--color-muted-foreground));
	}

	.week-dur {
		font-size: 0.5625rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-foreground));
	}

	/* ── Stats Grid ──────────────────────────────── */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
		gap: 0.375rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.375rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
	}

	.stat-val {
		font-size: 0.875rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-foreground));
	}

	.stat-val.debt {
		color: #ef4444;
	}

	.stat-lbl {
		font-size: 0.5rem;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		text-align: center;
	}

	/* ── Heatmap ──────────────────────────────────── */
	.heatmap-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.heatmap-grid {
		display: grid;
		grid-template-columns: repeat(10, 1fr);
		gap: 3px;
	}

	.heat-cell {
		aspect-ratio: 1;
		border-radius: 3px;
		background: hsl(var(--color-border));
	}

	/* ── Correlation ──────────────────────────────── */
	.correlation-card {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
	}

	.corr-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
	}

	.corr-label {
		color: hsl(var(--color-muted-foreground));
	}

	.corr-val {
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.corr-val.good {
		color: #22c55e;
	}

	/* ── Actions ──────────────────────────────────── */
	.actions-row {
		display: flex;
		gap: 0.5rem;
	}

	.action-btn {
		flex: 1;
		padding: 0.625rem 0.75rem;
		border-radius: 0.75rem;
		background: #6366f1;
		color: white;
		border: none;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		transition: filter 0.15s;
	}

	.action-btn:hover {
		filter: brightness(1.1);
	}

	.action-btn.secondary {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
		border: 1px solid hsl(var(--color-border));
	}

	.action-btn.secondary:hover {
		background: hsl(var(--color-border));
		filter: none;
	}
</style>
