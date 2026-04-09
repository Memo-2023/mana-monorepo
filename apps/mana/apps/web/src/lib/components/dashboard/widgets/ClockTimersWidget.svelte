<script lang="ts">
	/**
	 * ClockTimersWidget - Active timers and alarms (local-first)
	 */

	import { _ } from 'svelte-i18n';
	import { useEnabledAlarms, useActiveTimers } from '$lib/data/cross-app-queries';

	const alarms = useEnabledAlarms();
	const timers = useActiveTimers();

	const DAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

	function formatRepeatDays(days?: number[] | null): string {
		if (!days || days.length === 0) return 'Einmalig';
		if (days.length === 7) return 'Täglich';
		if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Werktags';
		return days.map((d) => DAY_NAMES[d]).join(', ');
	}

	function formatRemaining(seconds: number | null | undefined): string {
		if (seconds == null) return '—';
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = seconds % 60;
		if (h > 0) return `${h}h ${m}m`;
		if (m > 0) return `${m}m ${s}s`;
		return `${s}s`;
	}
</script>

<div>
	<div class="mb-3">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>⏰</span>
			{$_('dashboard.widgets.clock.title')}
		</h3>
	</div>

	{#if alarms.loading && timers.loading}
		<div class="space-y-2">
			{#each Array(3) as _}
				<div class="h-8 animate-pulse rounded bg-surface-hover"></div>
			{/each}
		</div>
	{:else}
		<!-- Active Timers -->
		{#if (timers.value ?? []).length > 0}
			<div class="mb-3 space-y-1">
				{#each timers.value ?? [] as timer (timer.id)}
					<div class="flex items-center justify-between rounded-lg px-2 py-1.5 bg-surface-hover">
						<span class="text-sm font-medium">{timer.label || 'Timer'}</span>
						<span class="text-sm font-mono text-primary">
							{formatRemaining(timer.remainingSeconds)}
						</span>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Alarms -->
		{#if (alarms.value ?? []).length > 0}
			<div class="space-y-1">
				{#each (alarms.value ?? []).slice(0, 3) as alarm (alarm.id)}
					<div class="flex items-center justify-between rounded-lg px-2 py-1.5">
						<div>
							<span class="text-sm font-medium">{alarm.time}</span>
							{#if alarm.label}
								<span class="ml-2 text-xs text-muted-foreground">{alarm.label}</span>
							{/if}
						</div>
						<span class="text-xs text-muted-foreground">
							{formatRepeatDays(alarm.repeatDays)}
						</span>
					</div>
				{/each}
			</div>
		{/if}

		{#if (alarms.value ?? []).length === 0 && (timers.value ?? []).length === 0}
			<div class="py-6 text-center">
				<div class="mb-2 text-3xl">⏰</div>
				<p class="text-sm text-muted-foreground">{$_('dashboard.widgets.clock.empty')}</p>
			</div>
		{/if}

		<a href="/times/clock" class="mt-2 block text-center text-sm text-primary hover:underline">
			Uhr öffnen →
		</a>
	{/if}
</div>
