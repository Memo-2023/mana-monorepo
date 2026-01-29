<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { browser } from '$app/environment';
	import { PageHeader, toast } from '@manacore/shared-ui';
	import { timersStore } from '$lib/stores/timers.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { QUICK_TIMER_PRESETS, formatDuration } from '@clock/shared';
	import { TimersSkeleton } from '$lib/components/skeletons';

	// Form state (inline on page)
	let formMinutes = $state(5);
	let formSeconds = $state(0);
	let formLabel = $state('');

	// Local timers
	interface LocalTimer {
		id: string;
		label: string;
		durationSeconds: number;
		remainingSeconds: number;
		status: 'idle' | 'running' | 'paused' | 'finished';
		createdAt: Date;
	}
	let localTimers = $state<LocalTimer[]>([]);
	let intervals: Map<string, ReturnType<typeof setInterval>> = new Map();
	let allTimers = $derived([...timersStore.timers, ...localTimers]);

	onMount(async () => {
		// Load timers - works for both authenticated and guest mode
		await timersStore.fetchTimers();
	});

	onDestroy(() => {
		intervals.forEach((interval) => clearInterval(interval));
	});

	function startLocalCountdown(timerId: string, isLocal: boolean = false) {
		if (intervals.has(timerId)) {
			clearInterval(intervals.get(timerId));
		}

		const interval = setInterval(() => {
			if (isLocal) {
				const timer = localTimers.find((t) => t.id === timerId);
				if (!timer || timer.status !== 'running') {
					clearInterval(interval);
					intervals.delete(timerId);
					return;
				}

				const newRemaining = Math.max(0, timer.remainingSeconds - 1);
				localTimers = localTimers.map((t) =>
					t.id === timerId
						? {
								...t,
								remainingSeconds: newRemaining,
								status: newRemaining === 0 ? 'finished' : 'running',
							}
						: t
				);

				if (newRemaining === 0) {
					clearInterval(interval);
					intervals.delete(timerId);
					toast.success($_('timer.finished'));
					if (browser && 'Notification' in window && Notification.permission === 'granted') {
						new Notification('Timer', { body: 'Timer abgelaufen!' });
					}
				}
			} else {
				const timer = timersStore.timers.find((t) => t.id === timerId);
				if (!timer || timer.status !== 'running') {
					clearInterval(interval);
					intervals.delete(timerId);
					return;
				}

				const newRemaining = Math.max(0, (timer.remainingSeconds || 0) - 1);
				timersStore.updateLocalTimer(timerId, newRemaining);

				if (newRemaining === 0) {
					clearInterval(interval);
					intervals.delete(timerId);
					toast.success($_('timer.finished'));
				}
			}
		}, 1000);

		intervals.set(timerId, interval);
	}

	function createAndStartTimer() {
		const durationSeconds = formMinutes * 60 + formSeconds;
		if (durationSeconds <= 0) {
			toast.error('Bitte eine gültige Zeit eingeben');
			return;
		}

		const newTimer: LocalTimer = {
			id: crypto.randomUUID(),
			label: formLabel || formatDuration(durationSeconds),
			durationSeconds,
			remainingSeconds: durationSeconds,
			status: 'running',
			createdAt: new Date(),
		};
		localTimers = [...localTimers, newTimer];
		startLocalCountdown(newTimer.id, true);
		toast.success('Timer gestartet');
		formLabel = '';
	}

	function setPreset(seconds: number) {
		formMinutes = Math.floor(seconds / 60);
		formSeconds = seconds % 60;
	}

	async function handleStart(id: string, isLocal: boolean) {
		if (isLocal) {
			localTimers = localTimers.map((t) =>
				t.id === id ? { ...t, status: 'running' as const } : t
			);
			startLocalCountdown(id, true);
		} else {
			const result = await timersStore.startTimer(id);
			if (result.success) startLocalCountdown(id, false);
		}
	}

	async function handlePause(id: string, isLocal: boolean) {
		if (intervals.has(id)) {
			clearInterval(intervals.get(id));
			intervals.delete(id);
		}
		if (isLocal) {
			localTimers = localTimers.map((t) => (t.id === id ? { ...t, status: 'paused' as const } : t));
		} else {
			await timersStore.pauseTimer(id);
		}
	}

	async function handleReset(id: string, isLocal: boolean) {
		if (intervals.has(id)) {
			clearInterval(intervals.get(id));
			intervals.delete(id);
		}
		if (isLocal) {
			localTimers = localTimers.map((t) =>
				t.id === id ? { ...t, remainingSeconds: t.durationSeconds, status: 'idle' as const } : t
			);
		} else {
			await timersStore.resetTimer(id);
		}
	}

	async function handleDelete(id: string, isLocal: boolean) {
		if (intervals.has(id)) {
			clearInterval(intervals.get(id));
			intervals.delete(id);
		}
		if (isLocal) {
			localTimers = localTimers.filter((t) => t.id !== id);
		} else {
			await timersStore.deleteTimer(id);
		}
	}

	function getTimerDisplay(timer: any) {
		const remaining = timer.remainingSeconds ?? timer.durationSeconds;
		return formatDuration(remaining);
	}

	function getProgress(timer: any) {
		const remaining = timer.remainingSeconds ?? timer.durationSeconds;
		return (remaining / timer.durationSeconds) * 100;
	}

	function isLocalTimer(timer: any): boolean {
		return localTimers.some((t) => t.id === timer.id);
	}
</script>

<PageHeader title={$_('timer.title')} size="md" centered />

<div class="space-y-4">
	<!-- Quick Create Form -->
	<div class="quick-create">
		<div class="flex items-center gap-1">
			<input
				type="number"
				class="time-input-inline w-12 text-center"
				min="0"
				max="99"
				bind:value={formMinutes}
			/>
			<span class="text-muted-foreground">:</span>
			<input
				type="number"
				class="time-input-inline w-12 text-center"
				min="0"
				max="59"
				bind:value={formSeconds}
			/>
		</div>
		<input type="text" class="label-input" placeholder="Bezeichnung" bind:value={formLabel} />
		<button class="btn btn-primary btn-sm" onclick={createAndStartTimer}> Start </button>
	</div>

	<!-- Quick Presets -->
	<div class="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
		{#each QUICK_TIMER_PRESETS as preset}
			<button class="alarm-tile text-center" onclick={() => setPreset(preset.seconds)}>
				<span class="text-lg font-light tabular-nums">{preset.label}</span>
			</button>
		{/each}
	</div>

	<!-- Loading State -->
	{#if timersStore.loading}
		<TimersSkeleton />
	{:else if allTimers.length > 0}
		<!-- Active Timers -->
		<div>
			<h2 class="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
				Aktiv ({allTimers.length})
			</h2>
			<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
				{#each allTimers as timer (timer.id)}
					{@const isLocal = isLocalTimer(timer)}
					<div class="alarm-tile" class:active={timer.status === 'running'}>
						<div class="flex items-start justify-between mb-1">
							<span
								class="text-xl font-light tabular-nums"
								class:text-primary={timer.status === 'running'}
								class:text-green-500={timer.status === 'finished'}
							>
								{getTimerDisplay(timer)}
							</span>
							<button
								class="text-muted-foreground hover:text-error p-0.5 -mr-1"
								onclick={(e) => {
									e.stopPropagation();
									handleDelete(timer.id, isLocal);
								}}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-3.5 w-3.5"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
						</div>
						<div class="text-[10px] text-muted-foreground truncate mb-2">{timer.label}</div>
						<div class="h-1 bg-muted rounded-full overflow-hidden mb-2">
							<div
								class="h-full rounded-full transition-all duration-1000"
								class:bg-primary={timer.status !== 'finished'}
								class:bg-green-500={timer.status === 'finished'}
								style="width: {getProgress(timer)}%"
							></div>
						</div>
						<div class="flex gap-1">
							{#if timer.status === 'running'}
								<button
									class="btn btn-secondary btn-sm flex-1 text-xs"
									onclick={() => handlePause(timer.id, isLocal)}
								>
									Pause
								</button>
							{:else}
								<button
									class="btn btn-primary btn-sm flex-1 text-xs"
									onclick={() => handleStart(timer.id, isLocal)}
								>
									{timer.status === 'finished' ? 'Neu' : 'Start'}
								</button>
							{/if}
							<button
								class="btn btn-ghost btn-sm text-xs"
								onclick={() => handleReset(timer.id, isLocal)}
							>
								Reset
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
