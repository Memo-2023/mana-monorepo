<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { PageHeader } from '@manacore/shared-ui';
	import { pomodoroStore } from '$lib/stores/pomodoro.svelte';
	import { POMODORO_PRESETS } from '@clock/shared';

	const radius = 90;
	const circumference = 2 * Math.PI * radius;

	let strokeDashoffset = $derived(circumference - (pomodoroStore.progress / 100) * circumference);

	let phaseLabel = $derived(
		{
			work: 'Arbeit',
			break: 'Pause',
			longBreak: 'Lange Pause',
		}[pomodoroStore.phase]
	);

	let phaseColor = $derived(
		{
			work: 'hsl(var(--color-primary))',
			break: 'hsl(142, 71%, 45%)',
			longBreak: 'hsl(199, 89%, 48%)',
		}[pomodoroStore.phase]
	);

	onMount(() => {
		pomodoroStore.requestNotificationPermission();
	});

	function loadPreset(preset: (typeof POMODORO_PRESETS)[number]) {
		pomodoroStore.loadPreset({
			workDuration: preset.workDuration,
			breakDuration: preset.breakDuration,
			longBreakDuration: preset.longBreakDuration,
			sessionsBeforeLongBreak: preset.sessionsBeforeLongBreak,
		});
	}
</script>

<PageHeader title={$_('pomodoro.title')} size="md" centered />

<div class="pomodoro-container">
	<!-- Progress Ring with Time -->
	<div class="pomodoro-ring-wrapper">
		<svg width="200" height="200" class="-rotate-90">
			<circle
				cx="100"
				cy="100"
				r={radius}
				fill="none"
				stroke="hsl(var(--color-muted))"
				stroke-width="6"
			/>
			<circle
				cx="100"
				cy="100"
				r={radius}
				fill="none"
				stroke={phaseColor}
				stroke-width="6"
				stroke-linecap="round"
				stroke-dasharray={circumference}
				stroke-dashoffset={strokeDashoffset}
				class="transition-all duration-1000 ease-linear"
			/>
		</svg>
		<div class="pomodoro-time">
			<span class="text-4xl font-light tabular-nums">{pomodoroStore.formattedTime}</span>
			<span class="text-xs text-muted-foreground mt-1">{phaseLabel}</span>
		</div>
	</div>

	<!-- Session dots -->
	<div class="flex justify-center gap-1.5 mb-4">
		{#each Array(pomodoroStore.sessionsBeforeLongBreak) as _, i}
			<div
				class="h-2 w-2 rounded-full transition-colors"
				class:bg-primary={i <
					pomodoroStore.completedSessions % pomodoroStore.sessionsBeforeLongBreak}
				class:bg-muted={i >=
					pomodoroStore.completedSessions % pomodoroStore.sessionsBeforeLongBreak}
			></div>
		{/each}
	</div>

	<!-- Controls -->
	<div class="flex justify-center gap-2 mb-6">
		{#if pomodoroStore.isRunning}
			<button class="btn btn-secondary" onclick={() => pomodoroStore.pause()}> Pause </button>
		{:else}
			<button class="btn btn-primary" onclick={() => pomodoroStore.start()}> Start </button>
		{/if}
		<button class="btn btn-ghost" onclick={() => pomodoroStore.skip()}> Skip </button>
		<button class="btn btn-ghost" onclick={() => pomodoroStore.reset()}> Reset </button>
	</div>

	<!-- Presets -->
	<div class="grid grid-cols-3 gap-1.5">
		{#each POMODORO_PRESETS as preset}
			<button class="alarm-tile text-center" onclick={() => loadPreset(preset)}>
				<span class="text-sm font-medium">{preset.nameDE}</span>
				<span class="text-[10px] text-muted-foreground block">
					{preset.workDuration / 60}/{preset.breakDuration / 60} min
				</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.pomodoro-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 1rem;
	}

	.pomodoro-ring-wrapper {
		position: relative;
		width: 200px;
		height: 200px;
		margin-bottom: 1rem;
	}

	.pomodoro-time {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
</style>
