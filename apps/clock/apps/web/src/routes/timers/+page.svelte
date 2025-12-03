<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { timersStore } from '$lib/stores/timers.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { toast } from '$lib/stores/toast';
	import { QUICK_TIMER_PRESETS, formatDuration } from '@clock/shared';

	// Form state
	let showForm = $state(false);
	let formHours = $state(0);
	let formMinutes = $state(5);
	let formSeconds = $state(0);
	let formLabel = $state('');

	// Local countdown intervals
	let intervals: Map<string, ReturnType<typeof setInterval>> = new Map();

	onMount(async () => {
		if (authStore.isAuthenticated) {
			await timersStore.fetchTimers();
		}
	});

	onDestroy(() => {
		// Clear all intervals
		intervals.forEach((interval) => clearInterval(interval));
	});

	function startLocalCountdown(timerId: string, remainingSeconds: number) {
		// Clear existing interval if any
		if (intervals.has(timerId)) {
			clearInterval(intervals.get(timerId));
		}

		const interval = setInterval(() => {
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
		}, 1000);

		intervals.set(timerId, interval);
	}

	function openForm() {
		formHours = 0;
		formMinutes = 5;
		formSeconds = 0;
		formLabel = '';
		showForm = true;
	}

	function closeForm() {
		showForm = false;
	}

	async function createTimer() {
		const durationSeconds = formHours * 3600 + formMinutes * 60 + formSeconds;
		if (durationSeconds <= 0) {
			toast.error('Bitte eine gültige Zeit eingeben');
			return;
		}

		const result = await timersStore.createTimer({
			durationSeconds,
			label: formLabel || undefined,
		});

		if (result.success) {
			toast.success('Timer erstellt');
			closeForm();
		} else {
			toast.error(result.error || 'Fehler beim Erstellen');
		}
	}

	async function createQuickTimer(seconds: number) {
		const result = await timersStore.createTimer({
			durationSeconds: seconds,
		});

		if (result.success && result.data) {
			await timersStore.startTimer(result.data.id);
			startLocalCountdown(result.data.id, seconds);
		}
	}

	async function handleStart(id: string) {
		const result = await timersStore.startTimer(id);
		if (result.success) {
			const timer = timersStore.timers.find((t) => t.id === id);
			if (timer) {
				startLocalCountdown(id, timer.remainingSeconds || timer.durationSeconds);
			}
		}
	}

	async function handlePause(id: string) {
		if (intervals.has(id)) {
			clearInterval(intervals.get(id));
			intervals.delete(id);
		}
		await timersStore.pauseTimer(id);
	}

	async function handleReset(id: string) {
		if (intervals.has(id)) {
			clearInterval(intervals.get(id));
			intervals.delete(id);
		}
		await timersStore.resetTimer(id);
	}

	async function handleDelete(id: string) {
		if (intervals.has(id)) {
			clearInterval(intervals.get(id));
			intervals.delete(id);
		}
		const result = await timersStore.deleteTimer(id);
		if (result.success) {
			toast.success('Timer gelöscht');
		}
	}

	function getTimerDisplay(timer: any) {
		const remaining = timer.remainingSeconds ?? timer.durationSeconds;
		return formatDuration(remaining);
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-foreground">{$_('timer.title')}</h1>
		<button class="btn btn-primary" onclick={openForm}>
			+ {$_('timer.add')}
		</button>
	</div>

	<!-- Quick Timer Presets -->
	<div class="card">
		<h3 class="mb-3 text-sm font-medium text-muted-foreground">{$_('timer.presets')}</h3>
		<div class="flex flex-wrap gap-2">
			{#each QUICK_TIMER_PRESETS as preset}
				<button class="btn btn-secondary btn-sm" onclick={() => createQuickTimer(preset.seconds)}>
					{preset.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Timer List -->
	{#if timersStore.loading}
		<div class="flex justify-center py-12">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"
			></div>
		</div>
	{:else if timersStore.timers.length === 0}
		<div class="card py-12 text-center">
			<p class="text-lg text-muted-foreground">{$_('timer.noTimers')}</p>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each timersStore.timers as timer (timer.id)}
				<div class="card">
					{#if timer.label}
						<p class="mb-2 text-sm font-medium text-muted-foreground">{timer.label}</p>
					{/if}

					<div class="timer-display text-4xl font-light text-foreground">
						{getTimerDisplay(timer)}
					</div>

					<!-- Progress bar -->
					<div class="mt-3 h-2 overflow-hidden rounded-full bg-muted">
						<div
							class="h-full bg-primary transition-all"
							style="width: {((timer.remainingSeconds || timer.durationSeconds) /
								timer.durationSeconds) *
								100}%"
						></div>
					</div>

					<!-- Controls -->
					<div class="mt-4 flex gap-2">
						{#if timer.status === 'running'}
							<button class="btn btn-secondary flex-1" onclick={() => handlePause(timer.id)}>
								{$_('timer.pause')}
							</button>
						{:else}
							<button class="btn btn-primary flex-1" onclick={() => handleStart(timer.id)}>
								{$_('timer.start')}
							</button>
						{/if}
						<button class="btn btn-ghost" onclick={() => handleReset(timer.id)}> ↺ </button>
						<button class="btn btn-ghost text-error" onclick={() => handleDelete(timer.id)}>
							🗑
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Form Modal -->
	{#if showForm}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div class="card w-full max-w-md">
				<h2 class="mb-4 text-xl font-semibold">{$_('timer.add')}</h2>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						createTimer();
					}}
				>
					<!-- Duration -->
					<div class="mb-4">
						<label class="mb-2 block text-sm font-medium">{$_('timer.duration')}</label>
						<div class="flex gap-2">
							<div class="flex-1">
								<label class="mb-1 block text-xs text-muted-foreground">{$_('timer.hours')}</label>
								<input type="number" class="input" min="0" max="99" bind:value={formHours} />
							</div>
							<div class="flex-1">
								<label class="mb-1 block text-xs text-muted-foreground">{$_('timer.minutes')}</label
								>
								<input type="number" class="input" min="0" max="59" bind:value={formMinutes} />
							</div>
							<div class="flex-1">
								<label class="mb-1 block text-xs text-muted-foreground">{$_('timer.seconds')}</label
								>
								<input type="number" class="input" min="0" max="59" bind:value={formSeconds} />
							</div>
						</div>
					</div>

					<!-- Label -->
					<div class="mb-6">
						<label class="mb-1 block text-sm font-medium">{$_('timer.label')}</label>
						<input type="text" class="input" placeholder="Optional" bind:value={formLabel} />
					</div>

					<!-- Actions -->
					<div class="flex gap-3">
						<button type="button" class="btn btn-secondary flex-1" onclick={closeForm}>
							{$_('common.cancel')}
						</button>
						<button type="submit" class="btn btn-primary flex-1">
							{$_('common.add')}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>
