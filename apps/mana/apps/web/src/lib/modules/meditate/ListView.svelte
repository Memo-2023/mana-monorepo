<!--
  Meditate — ListView (workbench-embedded view).
  Quick-start presets, today's stats, recent sessions.
-->
<script lang="ts">
	import {
		useAllPresets,
		useAllSessions,
		getTodayMinutes,
		getTodaySessions,
		getCurrentStreak,
		formatDuration,
		formatDurationLong,
	} from './queries';
	import { CATEGORY_LABELS } from './types';
	import type { MeditatePreset, MeditateSession } from './types';
	import SessionPlayer from './components/SessionPlayer.svelte';

	let presets$ = useAllPresets();
	let sessions$ = useAllSessions();
	let presets = $derived(presets$.value);
	let sessions = $derived(sessions$.value);

	let todayMinutes = $derived(getTodayMinutes(sessions));
	let todaySessions = $derived(getTodaySessions(sessions));
	let streak = $derived(getCurrentStreak(sessions));

	let activePreset = $state<MeditatePreset | null>(null);

	function startSession(preset: MeditatePreset) {
		activePreset = preset;
	}

	function handleComplete() {
		activePreset = null;
	}

	function handleCancel() {
		activePreset = null;
	}

	const categoryIcon: Record<string, string> = {
		silence: '🧘',
		breathing: '🌬️',
		bodyscan: '✨',
	};
</script>

{#if activePreset}
	<SessionPlayer preset={activePreset} onComplete={handleComplete} onCancel={handleCancel} />
{/if}

<div class="meditate-list">
	<!-- Today stats -->
	{#if sessions.length > 0}
		<div class="today-stats">
			<div class="stat">
				<span class="stat-value">{todayMinutes}</span>
				<span class="stat-unit">min heute</span>
			</div>
			{#if streak > 0}
				<div class="stat">
					<span class="stat-value">{streak}</span>
					<span class="stat-unit">{streak === 1 ? 'Tag' : 'Tage'} Streak</span>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Preset buttons -->
	<div class="preset-grid">
		{#each presets as preset (preset.id)}
			<button type="button" class="preset-btn" onclick={() => startSession(preset)}>
				<span class="preset-icon">{categoryIcon[preset.category] ?? '🧘'}</span>
				<span class="preset-name">{preset.name}</span>
				<span class="preset-duration">{formatDurationLong(preset.defaultDurationSec)}</span>
			</button>
		{/each}
	</div>

	<!-- Recent sessions -->
	{#if todaySessions.length > 0}
		<div class="recent-header">Heute</div>
		<div class="recent-list">
			{#each todaySessions as session (session.id)}
				{@const preset = presets.find((p) => p.id === session.presetId)}
				<div class="recent-item">
					<span class="recent-name">{preset?.name ?? CATEGORY_LABELS[session.category].de}</span>
					<span class="recent-duration">{formatDuration(session.durationSec)}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.meditate-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.75rem;
	}

	/* Today stats */
	.today-stats {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.stat {
		display: flex;
		align-items: baseline;
		gap: 0.3rem;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
		font-variant-numeric: tabular-nums;
	}

	.stat-unit {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* Preset grid */
	.preset-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 0.5rem;
	}

	.preset-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.75rem 0.5rem;
		border-radius: 0.75rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.preset-btn:hover {
		border-color: hsl(var(--color-primary) / 0.5);
		box-shadow: 0 2px 8px hsl(var(--color-primary) / 0.1);
	}

	.preset-icon {
		font-size: 1.25rem;
	}

	.preset-name {
		font-size: 0.8rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		text-align: center;
		line-height: 1.2;
	}

	.preset-duration {
		font-size: 0.7rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* Recent sessions */
	.recent-header {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.recent-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.recent-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.4rem 0.5rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted) / 0.3);
	}

	.recent-name {
		font-size: 0.8rem;
		color: hsl(var(--color-foreground));
	}

	.recent-duration {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
	}
</style>
