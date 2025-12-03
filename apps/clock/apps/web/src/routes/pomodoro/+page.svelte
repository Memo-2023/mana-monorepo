<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { pomodoroStore } from '$lib/stores/pomodoro.svelte';
	import { POMODORO_PRESETS } from '@clock/shared';

	// SVG circle properties
	const radius = 120;
	const circumference = 2 * Math.PI * radius;

	let strokeDashoffset = $derived(circumference - (pomodoroStore.progress / 100) * circumference);

	let phaseLabel = $derived(
		{
			work: $_('pomodoro.work'),
			break: $_('pomodoro.break'),
			longBreak: $_('pomodoro.longBreak'),
		}[pomodoroStore.phase]
	);

	let phaseColor = $derived(
		{
			work: 'hsl(var(--color-primary))',
			break: 'hsl(var(--color-success))',
			longBreak: 'hsl(var(--color-info))',
		}[pomodoroStore.phase]
	);

	onMount(() => {
		// Request notification permission
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

<div class="flex flex-col items-center space-y-8">
	<!-- Header -->
	<h1 class="text-2xl font-bold text-foreground">{$_('pomodoro.title')}</h1>

	<!-- Phase indicator -->
	<div class="text-center">
		<span
			class="inline-block rounded-full px-4 py-1 text-sm font-medium"
			style="background-color: {phaseColor}; color: white;"
		>
			{phaseLabel}
		</span>
	</div>

	<!-- Progress Ring -->
	<div class="relative">
		<svg width="280" height="280" class="-rotate-90">
			<!-- Background circle -->
			<circle
				cx="140"
				cy="140"
				r={radius}
				fill="none"
				stroke="hsl(var(--color-muted))"
				stroke-width="8"
			/>
			<!-- Progress circle -->
			<circle
				cx="140"
				cy="140"
				r={radius}
				fill="none"
				stroke={phaseColor}
				stroke-width="8"
				stroke-linecap="round"
				stroke-dasharray={circumference}
				stroke-dashoffset={strokeDashoffset}
				class="transition-all duration-1000 ease-linear"
			/>
		</svg>

		<!-- Time display -->
		<div class="absolute inset-0 flex flex-col items-center justify-center">
			<span class="digital-clock text-5xl font-light text-foreground">
				{pomodoroStore.formattedTime}
			</span>
			<span class="mt-2 text-sm text-muted-foreground">
				{$_('pomodoro.sessionsCompleted', {
					values: {
						count: pomodoroStore.completedSessions,
						total: pomodoroStore.sessionsBeforeLongBreak,
					},
				})}
			</span>
		</div>
	</div>

	<!-- Controls -->
	<div class="flex gap-4">
		{#if pomodoroStore.isRunning}
			<button class="btn btn-secondary btn-xl" onclick={() => pomodoroStore.pause()}>
				{$_('pomodoro.pause')}
			</button>
		{:else}
			<button class="btn btn-primary btn-xl" onclick={() => pomodoroStore.start()}>
				{$_('pomodoro.start')}
			</button>
		{/if}
		<button class="btn btn-ghost btn-xl" onclick={() => pomodoroStore.skip()}>
			{$_('pomodoro.skip')}
		</button>
		<button class="btn btn-ghost btn-xl" onclick={() => pomodoroStore.reset()}>
			{$_('pomodoro.reset')}
		</button>
	</div>

	<!-- Sessions Progress -->
	<div class="flex gap-2">
		{#each Array(pomodoroStore.sessionsBeforeLongBreak) as _, i}
			<div
				class="h-3 w-3 rounded-full transition-colors"
				class:bg-primary={i <
					pomodoroStore.completedSessions % pomodoroStore.sessionsBeforeLongBreak}
				class:bg-muted={i >=
					pomodoroStore.completedSessions % pomodoroStore.sessionsBeforeLongBreak}
			></div>
		{/each}
	</div>

	<!-- Presets -->
	<div class="card w-full max-w-md">
		<h3 class="mb-3 text-sm font-medium text-muted-foreground">{$_('timer.presets')}</h3>
		<div class="grid gap-2 sm:grid-cols-3">
			{#each POMODORO_PRESETS as preset}
				<button class="btn btn-secondary btn-sm text-left" onclick={() => loadPreset(preset)}>
					<div>
						<div class="font-medium">{preset.nameDE}</div>
						<div class="text-xs text-muted-foreground">
							{preset.workDuration / 60}:{preset.breakDuration / 60} min
						</div>
					</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- Current Settings -->
	<div class="card w-full max-w-md">
		<h3 class="mb-3 text-sm font-medium text-muted-foreground">Aktuelle Einstellungen</h3>
		<div class="grid grid-cols-2 gap-4 text-sm">
			<div>
				<span class="text-muted-foreground">{$_('pomodoro.settings.workDuration')}:</span>
				<span class="ml-1 font-medium">{pomodoroStore.settings.workDuration / 60} min</span>
			</div>
			<div>
				<span class="text-muted-foreground">{$_('pomodoro.settings.breakDuration')}:</span>
				<span class="ml-1 font-medium">{pomodoroStore.settings.breakDuration / 60} min</span>
			</div>
			<div>
				<span class="text-muted-foreground">{$_('pomodoro.settings.longBreakDuration')}:</span>
				<span class="ml-1 font-medium">{pomodoroStore.settings.longBreakDuration / 60} min</span>
			</div>
			<div>
				<span class="text-muted-foreground">Sitzungen:</span>
				<span class="ml-1 font-medium">{pomodoroStore.settings.sessionsBeforeLongBreak}</span>
			</div>
		</div>
	</div>
</div>
