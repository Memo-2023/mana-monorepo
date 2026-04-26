<!--
  SessionHistory — Past stretch sessions with calendar heatmap and stats.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { StretchSession, StretchRoutine } from '../types';
	import {
		getSessionsPerDay,
		getBodyRegionBalance,
		getCurrentStreak,
		relativeDays,
	} from '../queries';
	import { BODY_REGION_LABELS } from '../types';
	import { stretchStore } from '../stores/stretch.svelte';

	interface Props {
		sessions: StretchSession[];
		routines: StretchRoutine[];
		onClose: () => void;
	}

	let { sessions, routines, onClose }: Props = $props();

	let last30 = $derived(getSessionsPerDay(sessions, 30));
	let streak = $derived(getCurrentStreak(sessions));
	let totalSessions = $derived(sessions.length);
	let totalMinutes = $derived(
		Math.round(sessions.reduce((sum, s) => sum + s.totalDurationSec, 0) / 60)
	);
	let regionBalance = $derived(getBodyRegionBalance(sessions, routines));

	async function deleteSession(id: string) {
		await stretchStore.deleteSession(id);
	}
</script>

<div class="history-overlay">
	<div class="history-header">
		<button class="back-btn" onclick={onClose}>←</button>
		<span class="header-title">{$_('stretch.history.header_title')}</span>
	</div>

	<div class="history-body">
		<!-- Stats Summary -->
		<div class="stats-row">
			<div class="stat">
				<span class="stat-val">{totalSessions}</span>
				<span class="stat-lbl">{$_('stretch.history.stat_sessions')}</span>
			</div>
			<div class="stat">
				<span class="stat-val">{totalMinutes}</span>
				<span class="stat-lbl">{$_('stretch.history.stat_minutes')}</span>
			</div>
			<div class="stat">
				<span class="stat-val">{streak}</span>
				<span class="stat-lbl">{$_('stretch.history.stat_streak')}</span>
			</div>
		</div>

		<!-- 30-Day Heatmap -->
		<div class="heatmap-section">
			<span class="section-label">{$_('stretch.history.section_30_days')}</span>
			<div class="heatmap-grid">
				{#each last30 as day}
					<div
						class="heat-cell"
						class:l1={day.count === 1}
						class:l2={day.count === 2}
						class:l3={day.count >= 3}
						title="{day.date}: {day.count} Sessions, {day.minutes} Min"
					></div>
				{/each}
			</div>
		</div>

		<!-- Body Region Balance -->
		{#if regionBalance.length > 0}
			<div class="balance-section">
				<span class="section-label">{$_('stretch.history.section_balance')}</span>
				{#each regionBalance.slice(0, 6) as rb}
					{@const maxCount = regionBalance[0]?.count ?? 1}
					<div class="balance-row">
						<span class="bal-name">{BODY_REGION_LABELS[rb.region]?.de ?? rb.region}</span>
						<div class="bal-bar-track">
							<div class="bal-bar-fill" style:width="{(rb.count / maxCount) * 100}%"></div>
						</div>
						<span class="bal-count">{rb.count}</span>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Session List -->
		<div class="session-list">
			<span class="section-label">{$_('stretch.history.section_all_sessions')}</span>
			{#each sessions.slice(0, 50) as session (session.id)}
				<div class="session-item">
					<div class="si-left">
						<span class="si-name">{session.routineName}</span>
						<span class="si-meta">
							{$_('stretch.history.session_meta', {
								values: {
									minutes: Math.round(session.totalDurationSec / 60),
									completed: session.completedExercises,
									total: session.totalExercises,
								},
							})}
							{#if session.mood}
								&middot; {['😫', '😕', '😐', '😊', '🤩'][session.mood - 1]}
							{/if}
						</span>
					</div>
					<div class="si-right">
						<span class="si-date">{relativeDays(session.startedAt)}</span>
						<button class="si-delete" onclick={() => deleteSession(session.id)}>×</button>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.history-overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: hsl(var(--color-background));
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.history-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.back-btn {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: hsl(var(--color-muted));
		border: none;
		font-size: 1.125rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.header-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.history-body {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

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
		padding: 0.5rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
	}

	.stat-val {
		font-size: 1.25rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-foreground));
	}

	.stat-lbl {
		font-size: 0.5625rem;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
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

	.heat-cell.l1 {
		background: hsl(160 50% 70%);
	}
	.heat-cell.l2 {
		background: hsl(160 60% 50%);
	}
	.heat-cell.l3 {
		background: hsl(160 70% 35%);
	}

	/* ── Balance ──────────────────────────────────── */
	.balance-section {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.balance-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
	}

	.bal-name {
		width: 6rem;
		flex-shrink: 0;
		color: hsl(var(--color-foreground));
	}

	.bal-bar-track {
		flex: 1;
		height: 6px;
		border-radius: 3px;
		background: hsl(var(--color-border));
		overflow: hidden;
	}

	.bal-bar-fill {
		height: 100%;
		border-radius: 3px;
		background: #10b981;
		transition: width 0.3s;
	}

	.bal-count {
		width: 1.5rem;
		text-align: right;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-muted-foreground));
	}

	/* ── Session List ─────────────────────────────── */
	.session-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.session-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
	}

	.session-item:hover {
		background: hsl(var(--color-muted));
	}

	.si-left {
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
		min-width: 0;
		flex: 1;
	}

	.si-name {
		font-weight: 500;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.si-meta {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.si-right {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
	}

	.si-date {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.si-delete {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		background: transparent;
		border: none;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		font-size: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.15s;
	}

	.session-item:hover .si-delete {
		opacity: 1;
	}

	.si-delete:hover {
		color: #ef4444;
	}
</style>
