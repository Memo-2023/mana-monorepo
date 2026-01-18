<script lang="ts">
	/**
	 * ClockTimersWidget - Active timers and alarms
	 */

	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { clockService, type Timer, type Alarm, type ClockStats } from '$lib/api/services';
	import WidgetSkeleton from '../WidgetSkeleton.svelte';
	import WidgetError from '../WidgetError.svelte';

	let state = $state<'loading' | 'success' | 'error'>('loading');
	let timers = $state<Timer[]>([]);
	let alarms = $state<Alarm[]>([]);
	let stats = $state<ClockStats | null>(null);
	let error = $state<string | null>(null);
	let retrying = $state(false);
	let retryCount = $state(0);

	async function load() {
		state = 'loading';
		retrying = true;

		const [timersResult, alarmsResult, statsResult] = await Promise.all([
			clockService.getActiveTimers(),
			clockService.getEnabledAlarms(),
			clockService.getStats(),
		]);

		if (timersResult.data && alarmsResult.data && statsResult.data) {
			timers = timersResult.data;
			alarms = alarmsResult.data.slice(0, 3);
			stats = statsResult.data;
			state = 'success';
			retryCount = 0;
		} else {
			error = timersResult.error || alarmsResult.error || statsResult.error;
			state = 'error';

			// Don't retry if service is unavailable (network error)
			const isServiceUnavailable = error?.includes('nicht erreichbar');
			if (!isServiceUnavailable && retryCount < 3) {
				retryCount++;
				setTimeout(load, 5000 * retryCount);
			}
		}

		retrying = false;
	}

	onMount(load);

	function formatTime(seconds: number): string {
		const hrs = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hrs > 0) {
			return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function formatAlarmDays(days: number[]): string {
		if (days.length === 7) return 'Täglich';
		if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Werktags';
		if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Wochenende';

		const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
		return days.map((d) => dayNames[d]).join(', ');
	}
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>⏰</span>
			{$_('dashboard.widgets.clock.title')}
		</h3>
	</div>

	{#if state === 'loading'}
		<WidgetSkeleton lines={3} />
	{:else if state === 'error'}
		<WidgetError {error} onRetry={load} {retrying} />
	{:else if timers.length === 0 && alarms.length === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">🕐</div>
			<p class="text-sm text-muted-foreground">
				{$_('dashboard.widgets.clock.empty')}
			</p>
			<a
				href="http://localhost:5177"
				target="_blank"
				rel="noopener"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				{$_('dashboard.widgets.clock.open')}
			</a>
		</div>
	{:else}
		<!-- Stats row (if pomodoros today) -->
		{#if stats && stats.pomodorosToday > 0}
			<div class="mb-3 flex items-center justify-center gap-4 rounded-lg bg-surface-hover p-2">
				<div class="flex items-center gap-1">
					<span>🍅</span>
					<span class="font-medium">{stats.pomodorosToday}</span>
					<span class="text-xs text-muted-foreground">Pomodoros</span>
				</div>
				<div class="flex items-center gap-1">
					<span>⏱️</span>
					<span class="font-medium">{stats.focusTimeToday}</span>
					<span class="text-xs text-muted-foreground">min</span>
				</div>
			</div>
		{/if}

		<!-- Active timers -->
		{#if timers.length > 0}
			<div class="mb-3">
				<div class="mb-2 text-xs font-medium uppercase text-muted-foreground">
					{$_('dashboard.widgets.clock.active_timers')}
				</div>
				<div class="space-y-2">
					{#each timers as timer}
						<div
							class="flex items-center justify-between rounded-lg p-2 {timer.isRunning
								? 'bg-primary/10'
								: 'bg-surface-hover'}"
						>
							<div class="flex items-center gap-2">
								{#if timer.isRunning}
									<span class="relative flex h-2 w-2">
										<span
											class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"
										></span>
										<span class="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
									</span>
								{:else}
									<span class="h-2 w-2 rounded-full bg-yellow-500"></span>
								{/if}
								<span class="text-sm font-medium">{timer.name || 'Timer'}</span>
							</div>
							<span class="font-mono text-sm font-bold {timer.isRunning ? 'text-primary' : ''}">
								{formatTime(timer.remaining)}
							</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Alarms -->
		{#if alarms.length > 0}
			<div>
				<div class="mb-2 text-xs font-medium uppercase text-muted-foreground">
					{$_('dashboard.widgets.clock.alarms')}
				</div>
				<div class="space-y-2">
					{#each alarms as alarm}
						<div class="flex items-center justify-between rounded-lg bg-surface-hover p-2">
							<div>
								<div class="font-mono text-lg font-bold">{alarm.time}</div>
								<div class="text-xs text-muted-foreground">
									{alarm.name || formatAlarmDays(alarm.days)}
								</div>
							</div>
							<div class="text-lg">🔔</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<div class="mt-3 text-center">
			<a
				href="http://localhost:5177"
				target="_blank"
				rel="noopener"
				class="text-sm text-primary hover:underline"
			>
				{$_('dashboard.widgets.clock.open')}
			</a>
		</div>
	{/if}
</div>
