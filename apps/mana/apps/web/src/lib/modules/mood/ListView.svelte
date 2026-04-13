<!--
  Mood — ListView (Dashboard)
  Today's check-ins, week trend, emotion distribution, patterns, insights.
-->
<script lang="ts">
	import { getContext } from 'svelte';
	import type { Observable } from 'dexie';
	import type { MoodEntry, MoodSettings } from './types';
	import {
		getTodayEntries,
		getAvgLevel,
		getTopEmotion,
		getEmotionDistribution,
		getValenceRatio,
		getActivityInsights,
		getWeekdayPattern,
		getWeekMoodData,
		getCurrentStreak,
		getEffectiveSettings,
	} from './queries';
	import { EMOTION_META, ACTIVITY_LABELS } from './types';
	import QuickLog from './components/QuickLog.svelte';

	const entries$: Observable<MoodEntry[]> = getContext('moodEntries');
	const settings$: Observable<MoodSettings | null> = getContext('moodSettings');

	let entries = $state<MoodEntry[]>([]);
	let settingsRaw = $state<MoodSettings | null>(null);

	$effect(() => { const sub = entries$.subscribe((v) => (entries = v)); return () => sub.unsubscribe(); });
	$effect(() => { const sub = settings$.subscribe((v) => (settingsRaw = v)); return () => sub.unsubscribe(); });

	let settings = $derived(getEffectiveSettings(settingsRaw));
	let todayEntries = $derived(getTodayEntries(entries));
	let avgLevel7 = $derived(getAvgLevel(entries, 7));
	let avgLevel30 = $derived(getAvgLevel(entries, 30));
	let topEmotion = $derived(getTopEmotion(entries, 30));
	let distribution = $derived(getEmotionDistribution(entries.slice(0, 100)));
	let valence = $derived(getValenceRatio(entries.slice(0, 100)));
	let activityInsights = $derived(getActivityInsights(entries.slice(0, 100)));
	let weekdayPattern = $derived(getWeekdayPattern(entries.slice(0, 200)));
	let weekData = $derived(getWeekMoodData(entries));
	let streak = $derived(getCurrentStreak(entries));

	let showQuickLog = $state(false);
	let showInsights = $state(false);

	function levelColor(val: number): string {
		if (val >= 8) return '#22c55e';
		if (val >= 6) return '#84cc16';
		if (val >= 4) return '#f59e0b';
		if (val >= 2) return '#f97316';
		return '#ef4444';
	}
</script>

{#if showQuickLog}
	<QuickLog
		onComplete={() => (showQuickLog = false)}
		onCancel={() => (showQuickLog = false)}
	/>
{:else}
	<div class="mood-view">
		<!-- Log CTA -->
		<button class="log-cta" onclick={() => (showQuickLog = true)}>
			<span class="cta-emoji">
				{#if topEmotion}
					{EMOTION_META[topEmotion].emoji}
				{:else}
					😊
				{/if}
			</span>
			<span class="cta-text">Wie geht es dir?</span>
			<span class="cta-sub">
				{todayEntries.length}/{settings.dailyTarget} Check-ins heute
			</span>
		</button>

		<!-- Today's Entries -->
		{#if todayEntries.length > 0}
			<div class="today-section">
				<span class="section-label">Heute</span>
				<div class="today-entries">
					{#each todayEntries as entry (entry.id)}
						<div class="entry-pill">
							<span class="ep-emoji">{EMOTION_META[entry.emotion]?.emoji ?? '😐'}</span>
							<span class="ep-level" style:color={levelColor(entry.level)}>{entry.level}</span>
							<span class="ep-time">{entry.time}</span>
							{#if entry.activity}
								<span class="ep-activity">{ACTIVITY_LABELS[entry.activity]?.emoji ?? ''}</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Stats Row -->
		<div class="stats-row">
			<div class="stat">
				<span class="stat-val" style:color={levelColor(avgLevel7)}>{avgLevel7 || '—'}</span>
				<span class="stat-lbl">Ø 7 Tage</span>
			</div>
			<div class="stat">
				<span class="stat-val" style:color={levelColor(avgLevel30)}>{avgLevel30 || '—'}</span>
				<span class="stat-lbl">Ø 30 Tage</span>
			</div>
			<div class="stat">
				<span class="stat-val">{streak}</span>
				<span class="stat-lbl">Streak</span>
			</div>
		</div>

		<!-- Week Mood Chart -->
		{#if weekData.some((d) => d.avgLevel > 0)}
			<div class="week-section">
				<span class="section-label">Diese Woche</span>
				<div class="week-chart">
					{#each weekData as day}
						<div class="week-col">
							{#if day.avgLevel > 0}
								<div class="week-dot" style:background={levelColor(day.avgLevel)} title="{String(day.avgLevel)}">
									{day.avgLevel}
								</div>
							{:else}
								<div class="week-dot empty"></div>
							{/if}
							<span class="week-label">{day.dayLabel}</span>
							{#if day.count > 0}
								<span class="week-count">{day.count}×</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Valence Bar -->
		{#if entries.length >= 5}
			<div class="valence-section">
				<span class="section-label">Stimmungsbilanz</span>
				<div class="valence-bar">
					<div class="v-pos" style:width="{valence.positive}%"></div>
					<div class="v-neu" style:width="{valence.neutral}%"></div>
					<div class="v-neg" style:width="{valence.negative}%"></div>
				</div>
				<div class="valence-labels">
					<span class="vl-pos">{valence.positive}% positiv</span>
					<span class="vl-neg">{valence.negative}% negativ</span>
				</div>
			</div>
		{/if}

		<!-- Top Emotions -->
		{#if distribution.length > 0}
			<div class="dist-section">
				<span class="section-label">Häufigste Emotionen</span>
				<div class="dist-list">
					{#each distribution.slice(0, 5) as item}
						<div class="dist-row">
							<span class="dist-emoji">{EMOTION_META[item.emotion]?.emoji ?? '😐'}</span>
							<span class="dist-name">{EMOTION_META[item.emotion]?.de ?? item.emotion}</span>
							<div class="dist-bar-track">
								<div
									class="dist-bar-fill"
									style:width="{item.pct}%"
									style:background={EMOTION_META[item.emotion]?.color ?? '#6b7280'}
								></div>
							</div>
							<span class="dist-pct">{item.pct}%</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Weekday Pattern -->
		{#if weekdayPattern.some((d) => d.avgLevel > 0)}
			<div class="pattern-section">
				<span class="section-label">Wochentag-Muster</span>
				<div class="pattern-row">
					{#each weekdayPattern as day}
						<div class="pattern-col">
							<div
								class="pattern-dot"
								class:empty={day.avgLevel === 0}
								style:background={day.avgLevel > 0 ? levelColor(day.avgLevel) : ''}
							>
								{day.avgLevel > 0 ? day.avgLevel : ''}
							</div>
							<span class="pattern-label">{day.label}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Activity Insights -->
		{#if activityInsights.length >= 2}
			<div class="insights-section">
				<span class="section-label">Aktivitäten & Stimmung</span>
				{#each activityInsights.slice(0, 4) as insight}
					<div class="insight-row">
						<span class="ins-emoji">{ACTIVITY_LABELS[insight.activity]?.emoji ?? ''}</span>
						<span class="ins-name">{ACTIVITY_LABELS[insight.activity]?.de ?? insight.activity}</span>
						<span class="ins-val" style:color={levelColor(insight.avgLevel)}>Ø {insight.avgLevel}</span>
						<span class="ins-count">({insight.count}×)</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.mood-view {
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
		background: linear-gradient(135deg, hsl(40 80% 96%), hsl(350 60% 96%));
		border: 1px solid hsl(40 60% 88%);
		cursor: pointer;
		transition: transform 0.15s;
		color: hsl(var(--color-foreground));
	}

	:global(.dark) .log-cta {
		background: linear-gradient(135deg, hsl(40 30% 12%), hsl(350 25% 14%));
		border-color: hsl(40 30% 20%);
	}

	.log-cta:hover { transform: scale(1.02); }

	.cta-emoji { font-size: 1.75rem; }
	.cta-text { font-size: 0.875rem; font-weight: 600; }
	.cta-sub { font-size: 0.6875rem; color: #f59e0b; font-weight: 500; }

	/* ── Today ────────────────────────────────────── */
	.today-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.today-entries {
		display: flex;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.entry-pill {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border-radius: 1rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		font-size: 0.75rem;
	}

	.ep-emoji { font-size: 0.875rem; }
	.ep-level { font-weight: 700; font-variant-numeric: tabular-nums; }
	.ep-time { color: hsl(var(--color-muted-foreground)); font-variant-numeric: tabular-nums; }
	.ep-activity { font-size: 0.75rem; }

	/* ── Stats ────────────────────────────────────── */
	.stats-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
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
		font-size: 1.125rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.stat-lbl {
		font-size: 0.5rem;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
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
		justify-content: space-between;
	}

	.week-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
	}

	.week-dot {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.625rem;
		font-weight: 700;
		color: white;
	}

	.week-dot.empty {
		background: hsl(var(--color-border));
	}

	.week-label {
		font-size: 0.5625rem;
		color: hsl(var(--color-muted-foreground));
	}

	.week-count {
		font-size: 0.5rem;
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
	}

	/* ── Valence ──────────────────────────────────── */
	.valence-section {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.valence-bar {
		display: flex;
		height: 8px;
		border-radius: 4px;
		overflow: hidden;
	}

	.v-pos { background: #22c55e; }
	.v-neu { background: #9ca3af; }
	.v-neg { background: #ef4444; }

	.valence-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.5625rem;
		color: hsl(var(--color-muted-foreground));
	}

	.vl-pos { color: #22c55e; }
	.vl-neg { color: #ef4444; }

	/* ── Distribution ─────────────────────────────── */
	.dist-section {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.dist-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.dist-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
	}

	.dist-emoji { font-size: 0.875rem; flex-shrink: 0; }
	.dist-name { width: 5rem; flex-shrink: 0; color: hsl(var(--color-foreground)); }

	.dist-bar-track {
		flex: 1;
		height: 6px;
		border-radius: 3px;
		background: hsl(var(--color-border));
		overflow: hidden;
	}

	.dist-bar-fill {
		height: 100%;
		border-radius: 3px;
		transition: width 0.3s;
	}

	.dist-pct {
		width: 2rem;
		text-align: right;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.6875rem;
	}

	/* ── Weekday Pattern ──────────────────────────── */
	.pattern-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.pattern-row {
		display: flex;
		justify-content: space-between;
		gap: 0.25rem;
	}

	.pattern-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
	}

	.pattern-dot {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.5625rem;
		font-weight: 700;
		color: white;
	}

	.pattern-dot.empty {
		background: hsl(var(--color-border));
	}

	.pattern-label {
		font-size: 0.5625rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* ── Insights ─────────────────────────────────── */
	.insights-section {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.insight-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		padding: 0.25rem 0;
	}

	.ins-emoji { font-size: 0.875rem; }
	.ins-name { flex: 1; color: hsl(var(--color-foreground)); }
	.ins-val { font-weight: 600; font-variant-numeric: tabular-nums; }
	.ins-count { font-size: 0.625rem; color: hsl(var(--color-muted-foreground)); }
</style>
