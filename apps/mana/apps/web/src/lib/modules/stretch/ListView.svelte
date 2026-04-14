<!--
  Stretch — ListView (Dashboard)
  Streak, quick-start routines, assessment recommendation, recent sessions.
-->
<script lang="ts">
	import {
		useAllStretchExercises,
		useAllStretchRoutines,
		useAllStretchSessions,
		useAllStretchAssessments,
		useAllStretchReminders,
		getCurrentStreak,
		getTodayMinutes,
		getWeekSessionCount,
		getSessionsPerDay,
		getLatestAssessment,
		getWeakAreas,
		getRecommendedRoutine,
		relativeDays,
		getTodaySessions,
	} from './queries';
	import { ROUTINE_TYPE_LABELS, BODY_REGION_LABELS } from './types';
	import SessionPlayer from './components/SessionPlayer.svelte';
	import AssessmentWizard from './components/AssessmentWizard.svelte';
	import RoutineCreator from './components/RoutineCreator.svelte';
	import ReminderManager from './components/ReminderManager.svelte';
	import SessionHistory from './components/SessionHistory.svelte';

	const exercisesQuery = useAllStretchExercises();
	const routinesQuery = useAllStretchRoutines();
	const sessionsQuery = useAllStretchSessions();
	const assessmentsQuery = useAllStretchAssessments();
	const remindersQuery = useAllStretchReminders();

	let exercises = $derived(exercisesQuery.value);
	let routines = $derived(routinesQuery.value);
	let sessions = $derived(sessionsQuery.value);
	let assessments = $derived(assessmentsQuery.value);
	let reminders = $derived(remindersQuery.value);

	let streak = $derived(getCurrentStreak(sessions));
	let todayMinutes = $derived(Math.round(getTodayMinutes(sessions)));
	let weekCount = $derived(getWeekSessionCount(sessions));
	let todaySessions = $derived(getTodaySessions(sessions));
	let latestAssessment = $derived(getLatestAssessment(assessments));
	let weakAreas = $derived(getWeakAreas(latestAssessment));
	let recommended = $derived(getRecommendedRoutine(routines, weakAreas));
	let pinnedRoutines = $derived(routines.filter((r) => r.isPinned));
	let last7Days = $derived(getSessionsPerDay(sessions, 7));

	// UI state
	let activeRoutineId = $state<string | null>(null);
	let showAssessment = $state(false);
	let showCreateRoutine = $state(false);
	let showReminders = $state(false);
	let showHistory = $state(false);
	let activeTab = $state<'dashboard' | 'routines' | 'exercises'>('dashboard');

	function startRoutine(routineId: string) {
		activeRoutineId = routineId;
	}

	function handleSessionComplete() {
		activeRoutineId = null;
	}
</script>

<!-- Session Player (fullscreen overlay when active) -->
{#if activeRoutineId}
	{@const routine = routines.find((r) => r.id === activeRoutineId)}
	{#if routine}
		<SessionPlayer
			{routine}
			{exercises}
			onComplete={handleSessionComplete}
			onCancel={() => (activeRoutineId = null)}
		/>
	{/if}
{:else if showAssessment}
	<AssessmentWizard
		onComplete={() => (showAssessment = false)}
		onCancel={() => (showAssessment = false)}
	/>
{:else if showCreateRoutine}
	<RoutineCreator
		{exercises}
		onComplete={() => (showCreateRoutine = false)}
		onCancel={() => (showCreateRoutine = false)}
	/>
{:else if showReminders}
	<ReminderManager {reminders} {routines} onClose={() => (showReminders = false)} />
{:else if showHistory}
	<SessionHistory {sessions} {routines} onClose={() => (showHistory = false)} />
{:else}
	<div class="stretch-view">
		<!-- Tab Bar -->
		<div class="tab-bar">
			<button
				class="tab"
				class:active={activeTab === 'dashboard'}
				onclick={() => (activeTab = 'dashboard')}>Dashboard</button
			>
			<button
				class="tab"
				class:active={activeTab === 'routines'}
				onclick={() => (activeTab = 'routines')}>Routinen</button
			>
			<button
				class="tab"
				class:active={activeTab === 'exercises'}
				onclick={() => (activeTab = 'exercises')}>Übungen</button
			>
		</div>

		{#if activeTab === 'dashboard'}
			<!-- Stats Row -->
			<div class="stats-row">
				<div class="stat-card">
					<span class="stat-value">{streak}</span>
					<span class="stat-label">Tage Streak</span>
				</div>
				<div class="stat-card">
					<span class="stat-value">{todayMinutes}</span>
					<span class="stat-label">Min heute</span>
				</div>
				<div class="stat-card">
					<span class="stat-value">{weekCount}</span>
					<span class="stat-label">Diese Woche</span>
				</div>
			</div>

			<!-- Mini Heatmap (last 7 days) -->
			<div class="heatmap-row">
				{#each last7Days as day}
					<div class="heatmap-day" title="{day.date}: {day.minutes} Min">
						<div class="heatmap-dot" class:active={day.count > 0} class:multi={day.count > 1}></div>
						<span class="heatmap-label"
							>{new Date(day.date + 'T00:00').toLocaleDateString('de', { weekday: 'narrow' })}</span
						>
					</div>
				{/each}
			</div>

			<!-- Quick Start -->
			<div class="section">
				<div class="section-header">
					<span class="section-title">Schnellstart</span>
				</div>
				<div class="routine-grid">
					{#each pinnedRoutines as routine (routine.id)}
						<button class="routine-card" onclick={() => startRoutine(routine.id)}>
							<span class="routine-name">{routine.name}</span>
							<span class="routine-meta">{routine.estimatedDurationMin} Min</span>
							<span class="routine-type"
								>{ROUTINE_TYPE_LABELS[routine.routineType]?.de ?? routine.routineType}</span
							>
						</button>
					{/each}
				</div>
			</div>

			<!-- Assessment Recommendation -->
			{#if recommended}
				<div class="recommendation">
					<div class="rec-header">
						{#if weakAreas.length > 0}
							<span class="rec-title">Empfohlen für dich</span>
							<span class="rec-detail">
								Schwachstellen: {weakAreas.map((r) => BODY_REGION_LABELS[r]?.de ?? r).join(', ')}
							</span>
						{:else}
							<span class="rec-title">Vorschlag</span>
						{/if}
					</div>
					<button class="rec-btn" onclick={() => startRoutine(recommended.id)}>
						{recommended.name} starten ({recommended.estimatedDurationMin} Min)
					</button>
				</div>
			{/if}

			<!-- Assessment CTA -->
			<button class="action-btn" onclick={() => (showAssessment = true)}>
				{latestAssessment ? 'Bestandsaufnahme wiederholen' : 'Erste Bestandsaufnahme starten'}
				{#if latestAssessment}
					<span class="action-meta"
						>Letzte: {relativeDays(latestAssessment.assessedAt)} — Score: {latestAssessment.overallScore}%</span
					>
				{/if}
			</button>

			<!-- Recent Sessions -->
			{#if todaySessions.length > 0}
				<div class="section">
					<div class="section-header">
						<span class="section-title">Heute</span>
						<button class="link-btn" onclick={() => (showHistory = true)}>Alle</button>
					</div>
					{#each todaySessions.slice(0, 3) as session (session.id)}
						<div class="session-row">
							<span class="session-name">{session.routineName}</span>
							<span class="session-duration">{Math.round(session.totalDurationSec / 60)} Min</span>
							<span class="session-time">{session.startedAt.split('T')[1]?.slice(0, 5)}</span>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Quick Actions -->
			<div class="quick-actions">
				<button class="action-link" onclick={() => (showReminders = true)}>Erinnerungen</button>
				<button class="action-link" onclick={() => (showHistory = true)}>Verlauf</button>
			</div>
		{:else if activeTab === 'routines'}
			<!-- All Routines -->
			<div class="routines-list">
				{#each routines as routine (routine.id)}
					<button class="routine-list-item" onclick={() => startRoutine(routine.id)}>
						<div class="rli-left">
							<span class="rli-name">{routine.name}</span>
							<span class="rli-desc">{routine.description}</span>
						</div>
						<div class="rli-right">
							<span class="rli-duration">{routine.estimatedDurationMin} Min</span>
							<span class="rli-type">{ROUTINE_TYPE_LABELS[routine.routineType]?.de ?? ''}</span>
						</div>
					</button>
				{/each}
				<button class="add-routine-btn" onclick={() => (showCreateRoutine = true)}>
					+ Eigene Routine erstellen
				</button>
			</div>
		{:else if activeTab === 'exercises'}
			<!-- Exercise Library -->
			<div class="exercises-list">
				{#each exercises.filter((e) => !e.isArchived) as ex (ex.id)}
					<div class="exercise-item">
						<div class="ex-left">
							<span class="ex-name">{ex.name}</span>
							<span class="ex-desc">{ex.description}</span>
						</div>
						<div class="ex-right">
							<span class="ex-region">{BODY_REGION_LABELS[ex.bodyRegion]?.de ?? ex.bodyRegion}</span
							>
							<span class="ex-duration"
								>{ex.defaultDurationSec}s{ex.bilateral ? ' /Seite' : ''}</span
							>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.stretch-view {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.5rem;
	}

	/* ── Tab Bar ──────────────────────────────────── */
	.tab-bar {
		display: flex;
		gap: 0.25rem;
		background: hsl(var(--color-muted));
		border-radius: 0.5rem;
		padding: 0.125rem;
	}

	.tab {
		flex: 1;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		background: transparent;
		border: none;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}

	.tab.active {
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	/* ── Stats ────────────────────────────────────── */
	.stats-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.5rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
	}

	.stat-value {
		font-size: 1.25rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-foreground));
	}

	.stat-label {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* ── Heatmap ──────────────────────────────────── */
	.heatmap-row {
		display: flex;
		justify-content: space-between;
		gap: 0.25rem;
		padding: 0.375rem 0.5rem;
	}

	.heatmap-day {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
	}

	.heatmap-dot {
		width: 12px;
		height: 12px;
		border-radius: 3px;
		background: hsl(var(--color-border));
		transition: background 0.2s;
	}

	.heatmap-dot.active {
		background: #10b981;
	}

	.heatmap-dot.multi {
		background: #059669;
	}

	.heatmap-label {
		font-size: 0.5625rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* ── Section ──────────────────────────────────── */
	.section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.section-title {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}

	.link-btn {
		font-size: 0.6875rem;
		color: hsl(var(--color-primary));
		background: none;
		border: none;
		cursor: pointer;
		text-decoration: underline;
	}

	/* ── Routine Grid ─────────────────────────────── */
	.routine-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 0.5rem;
	}

	.routine-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
		padding: 0.625rem 0.375rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		cursor: pointer;
		transition:
			transform 0.15s,
			box-shadow 0.15s;
		color: hsl(var(--color-foreground));
	}

	.routine-card:hover {
		transform: scale(1.03);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
	}

	.routine-card:active {
		transform: scale(0.97);
	}

	.routine-name {
		font-size: 0.75rem;
		font-weight: 600;
		text-align: center;
	}

	.routine-meta {
		font-size: 0.6875rem;
		color: #10b981;
		font-weight: 600;
	}

	.routine-type {
		font-size: 0.5625rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* ── Recommendation ───────────────────────────── */
	.recommendation {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: hsl(160 60% 96%);
		border: 1px solid hsl(160 40% 88%);
	}

	:global(.dark) .recommendation {
		background: hsl(160 30% 12%);
		border-color: hsl(160 30% 20%);
	}

	.rec-header {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.rec-title {
		font-size: 0.6875rem;
		font-weight: 600;
		color: #059669;
	}

	.rec-detail {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.rec-btn {
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: #10b981;
		color: white;
		border: none;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		transition: filter 0.15s;
	}

	.rec-btn:hover {
		filter: brightness(1.1);
	}

	/* ── Action Button ────────────────────────────── */
	.action-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
	}

	.action-btn:hover {
		background: hsl(var(--color-muted) / 0.8);
	}

	.action-meta {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		font-weight: 400;
	}

	/* ── Session Row ──────────────────────────────── */
	.session-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.375rem;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
	}

	.session-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.session-duration {
		color: #10b981;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		font-size: 0.75rem;
	}

	.session-time {
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
		font-size: 0.75rem;
	}

	/* ── Quick Actions ────────────────────────────── */
	.quick-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
		padding: 0.375rem 0;
	}

	.action-link {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		background: none;
		border: none;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.action-link:hover {
		color: hsl(var(--color-foreground));
	}

	/* ── Routines List ────────────────────────────── */
	.routines-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.routine-list-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.625rem 0.75rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		cursor: pointer;
		text-align: left;
		color: hsl(var(--color-foreground));
		transition: transform 0.15s;
	}

	.routine-list-item:hover {
		transform: translateX(2px);
	}

	.rli-left {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
		flex: 1;
	}

	.rli-name {
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.rli-desc {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.rli-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.125rem;
		flex-shrink: 0;
	}

	.rli-duration {
		font-size: 0.75rem;
		font-weight: 600;
		color: #10b981;
	}

	.rli-type {
		font-size: 0.5625rem;
		color: hsl(var(--color-muted-foreground));
	}

	.add-routine-btn {
		padding: 0.625rem 0.75rem;
		border-radius: 0.75rem;
		border: 2px dashed hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
		transition:
			border-color 0.15s,
			color 0.15s;
	}

	.add-routine-btn:hover {
		border-color: #10b981;
		color: #10b981;
	}

	/* ── Exercises List ────────────────────────────── */
	.exercises-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.exercise-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.625rem;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
	}

	.exercise-item:hover {
		background: hsl(var(--color-muted));
	}

	.ex-left {
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
		min-width: 0;
		flex: 1;
	}

	.ex-name {
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}

	.ex-desc {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ex-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.0625rem;
		flex-shrink: 0;
	}

	.ex-region {
		font-size: 0.625rem;
		color: #10b981;
		font-weight: 500;
	}

	.ex-duration {
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
	}
</style>
