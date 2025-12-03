<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { browser } from '$app/environment';
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

	// Local timers (for quick timers without backend)
	interface LocalTimer {
		id: string;
		label: string;
		durationSeconds: number;
		remainingSeconds: number;
		status: 'idle' | 'running' | 'paused' | 'finished';
		createdAt: Date;
	}
	let localTimers = $state<LocalTimer[]>([]);

	// Recently used presets (stored in localStorage)
	let recentPresets = $state<{ label: string; seconds: number }[]>([]);
	const RECENT_STORAGE_KEY = 'clock-recent-timers';
	const MAX_RECENT = 5;

	// Local countdown intervals
	let intervals: Map<string, ReturnType<typeof setInterval>> = new Map();

	// Combined timers (backend + local)
	let allTimers = $derived([...timersStore.timers, ...localTimers]);

	onMount(async () => {
		// Load recent presets from localStorage
		if (browser) {
			const saved = localStorage.getItem(RECENT_STORAGE_KEY);
			if (saved) {
				try {
					recentPresets = JSON.parse(saved);
				} catch {
					recentPresets = [];
				}
			}
		}

		// Fetch backend timers if authenticated
		if (authStore.isAuthenticated) {
			await timersStore.fetchTimers();
		}
	});

	onDestroy(() => {
		// Clear all intervals
		intervals.forEach((interval) => clearInterval(interval));
	});

	function saveRecentPreset(preset: { label: string; seconds: number }) {
		// Add to recent, removing duplicates
		recentPresets = [
			preset,
			...recentPresets.filter((p) => p.seconds !== preset.seconds),
		].slice(0, MAX_RECENT);

		if (browser) {
			localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recentPresets));
		}
	}

	function startLocalCountdown(timerId: string, isLocal: boolean = false) {
		// Clear existing interval if any
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
						? { ...t, remainingSeconds: newRemaining, status: newRemaining === 0 ? 'finished' : 'running' }
						: t
				);

				if (newRemaining === 0) {
					clearInterval(interval);
					intervals.delete(timerId);
					toast.success($_('timer.finished'));
					// Play notification sound
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

		if (authStore.isAuthenticated) {
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
		} else {
			// Create local timer
			const newTimer: LocalTimer = {
				id: crypto.randomUUID(),
				label: formLabel || formatDuration(durationSeconds),
				durationSeconds,
				remainingSeconds: durationSeconds,
				status: 'idle',
				createdAt: new Date(),
			};
			localTimers = [...localTimers, newTimer];
			toast.success('Timer erstellt');
			closeForm();
		}
	}

	function createQuickTimer(seconds: number, label: string) {
		// Save to recent
		saveRecentPreset({ label, seconds });

		// Create local timer and start immediately
		const newTimer: LocalTimer = {
			id: crypto.randomUUID(),
			label: label,
			durationSeconds: seconds,
			remainingSeconds: seconds,
			status: 'running',
			createdAt: new Date(),
		};
		localTimers = [...localTimers, newTimer];
		startLocalCountdown(newTimer.id, true);
		toast.success(`Timer ${label} gestartet`);
	}

	async function handleStart(id: string, isLocal: boolean) {
		if (isLocal) {
			localTimers = localTimers.map((t) =>
				t.id === id ? { ...t, status: 'running' as const } : t
			);
			startLocalCountdown(id, true);
		} else {
			const result = await timersStore.startTimer(id);
			if (result.success) {
				const timer = timersStore.timers.find((t) => t.id === id);
				if (timer) {
					startLocalCountdown(id, false);
				}
			}
		}
	}

	async function handlePause(id: string, isLocal: boolean) {
		if (intervals.has(id)) {
			clearInterval(intervals.get(id));
			intervals.delete(id);
		}

		if (isLocal) {
			localTimers = localTimers.map((t) =>
				t.id === id ? { ...t, status: 'paused' as const } : t
			);
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
			toast.success('Timer gelöscht');
		} else {
			const result = await timersStore.deleteTimer(id);
			if (result.success) {
				toast.success('Timer gelöscht');
			}
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

	// Preset icons based on duration
	function getPresetIcon(seconds: number): string {
		if (seconds <= 60) return '⚡';
		if (seconds <= 300) return '☕';
		if (seconds <= 900) return '📝';
		if (seconds <= 1800) return '💪';
		if (seconds <= 2700) return '🎯';
		return '🏃';
	}
</script>

<div class="mx-auto max-w-4xl space-y-8 pb-8">
	<!-- Header -->
	<div class="text-center">
		<h1 class="text-3xl font-bold text-foreground">{$_('timer.title')}</h1>
		<p class="mt-2 text-muted-foreground">Schnelle Timer für jeden Anlass</p>
	</div>

	<!-- Quick Timer Presets - Hero Section -->
	<div class="card bg-gradient-to-br from-primary/10 to-primary/5 p-8">
		<h2 class="mb-6 text-center text-lg font-semibold text-foreground">
			{$_('timer.presets')}
		</h2>
		<div class="grid grid-cols-4 gap-4 sm:grid-cols-4 md:grid-cols-8">
			{#each QUICK_TIMER_PRESETS as preset}
				<button
					class="group flex flex-col items-center gap-2 rounded-2xl bg-background p-4 shadow-sm transition-all hover:scale-105 hover:shadow-md active:scale-95"
					onclick={() => createQuickTimer(preset.seconds, preset.label)}
				>
					<span class="text-2xl transition-transform group-hover:scale-110">
						{getPresetIcon(preset.seconds)}
					</span>
					<span class="text-sm font-medium text-foreground">{preset.label}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Recently Used Section -->
	{#if recentPresets.length > 0}
		<div class="card">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold text-foreground">Zuletzt verwendet</h3>
				<button
					class="text-sm text-muted-foreground hover:text-foreground"
					onclick={() => {
						recentPresets = [];
						if (browser) localStorage.removeItem(RECENT_STORAGE_KEY);
					}}
				>
					Löschen
				</button>
			</div>
			<div class="flex flex-wrap gap-3">
				{#each recentPresets as preset}
					<button
						class="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium transition-all hover:bg-primary hover:text-primary-foreground"
						onclick={() => createQuickTimer(preset.seconds, preset.label)}
					>
						<span class="text-lg">{getPresetIcon(preset.seconds)}</span>
						{preset.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Custom Timer Button -->
	<div class="flex justify-center">
		<button
			class="btn btn-primary btn-lg flex items-center gap-2 px-8"
			onclick={openForm}
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			{$_('timer.add')}
		</button>
	</div>

	<!-- Active Timers -->
	{#if timersStore.loading}
		<div class="flex justify-center py-12">
			<div class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
		</div>
	{:else if allTimers.length === 0}
		<div class="card bg-muted/30 py-16 text-center">
			<div class="mb-4 text-5xl opacity-50">⏱️</div>
			<p class="text-lg text-muted-foreground">{$_('timer.noTimers')}</p>
			<p class="mt-2 text-sm text-muted-foreground">
				Klicke auf einen Preset oben oder erstelle einen eigenen Timer
			</p>
		</div>
	{:else}
		<div class="space-y-4">
			<h3 class="text-lg font-semibold text-foreground">
				Aktive Timer ({allTimers.length})
			</h3>
			<div class="grid gap-4 sm:grid-cols-2">
				{#each allTimers as timer (timer.id)}
					{@const isLocal = isLocalTimer(timer)}
					<div
						class="card relative overflow-hidden transition-all {timer.status === 'running' ? 'ring-2 ring-primary' : ''} {timer.status === 'finished' ? 'bg-green-500/5' : ''}"
					>
						<!-- Progress background -->
						<div
							class="absolute inset-0 bg-primary/10 transition-all duration-1000"
							style="width: {getProgress(timer)}%"
						></div>

						<div class="relative">
							<!-- Label -->
							<div class="mb-3 flex items-center justify-between">
								<span class="text-sm font-medium text-muted-foreground">
									{timer.label || 'Timer'}
								</span>
								<span
									class="rounded-full px-2 py-0.5 text-xs font-medium"
									class:bg-primary={timer.status === 'running'}
									class:text-primary-foreground={timer.status === 'running'}
									class:bg-muted={timer.status !== 'running'}
								>
									{timer.status === 'running' ? 'Läuft' : timer.status === 'paused' ? 'Pausiert' : timer.status === 'finished' ? 'Fertig' : 'Bereit'}
								</span>
							</div>

							<!-- Time Display -->
							<div class="mb-4 text-center">
								<span
									class="font-mono text-5xl font-light tracking-tight {timer.status === 'running' ? 'text-primary' : ''} {timer.status === 'finished' ? 'text-green-500' : ''}"
								>
									{getTimerDisplay(timer)}
								</span>
							</div>

							<!-- Progress bar -->
							<div class="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full transition-all duration-1000 {timer.status === 'finished' ? 'bg-green-500' : 'bg-primary'}"
									style="width: {getProgress(timer)}%"
								></div>
							</div>

							<!-- Controls -->
							<div class="flex items-center gap-2">
								{#if timer.status === 'running'}
									<button
										class="btn btn-secondary flex-1"
										onclick={() => handlePause(timer.id, isLocal)}
									>
										⏸️ {$_('timer.pause')}
									</button>
								{:else if timer.status === 'finished'}
									<button
										class="btn btn-primary flex-1"
										onclick={() => handleReset(timer.id, isLocal)}
									>
										🔄 Neu starten
									</button>
								{:else}
									<button
										class="btn btn-primary flex-1"
										onclick={() => handleStart(timer.id, isLocal)}
									>
										▶️ {$_('timer.start')}
									</button>
								{/if}
								<button
									class="btn btn-ghost"
									onclick={() => handleReset(timer.id, isLocal)}
									title="Zurücksetzen"
								>
									↺
								</button>
								<button
									class="btn btn-ghost text-destructive hover:bg-destructive/10"
									onclick={() => handleDelete(timer.id, isLocal)}
									title="Löschen"
								>
									🗑️
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<!-- Form Modal -->
{#if showForm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
		<div class="card w-full max-w-md animate-in fade-in zoom-in-95">
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-xl font-semibold">{$_('timer.add')}</h2>
				<button class="btn btn-ghost btn-sm" onclick={closeForm}>✕</button>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					createTimer();
				}}
			>
				<!-- Duration -->
				<div class="mb-6">
					<label class="mb-3 block text-sm font-medium">{$_('timer.duration')}</label>
					<div class="grid grid-cols-3 gap-3">
						<div>
							<label class="mb-1.5 block text-xs text-muted-foreground text-center">{$_('timer.hours')}</label>
							<input
								type="number"
								class="input text-center text-2xl font-light"
								min="0"
								max="99"
								bind:value={formHours}
							/>
						</div>
						<div>
							<label class="mb-1.5 block text-xs text-muted-foreground text-center">{$_('timer.minutes')}</label>
							<input
								type="number"
								class="input text-center text-2xl font-light"
								min="0"
								max="59"
								bind:value={formMinutes}
							/>
						</div>
						<div>
							<label class="mb-1.5 block text-xs text-muted-foreground text-center">{$_('timer.seconds')}</label>
							<input
								type="number"
								class="input text-center text-2xl font-light"
								min="0"
								max="59"
								bind:value={formSeconds}
							/>
						</div>
					</div>
				</div>

				<!-- Quick presets in modal -->
				<div class="mb-6">
					<label class="mb-2 block text-xs text-muted-foreground">Schnellauswahl</label>
					<div class="flex flex-wrap gap-2">
						{#each [1, 3, 5, 10, 15, 30] as mins}
							<button
								type="button"
								class="rounded-full bg-muted px-3 py-1 text-sm hover:bg-primary hover:text-primary-foreground"
								onclick={() => {
									formHours = 0;
									formMinutes = mins;
									formSeconds = 0;
								}}
							>
								{mins} min
							</button>
						{/each}
					</div>
				</div>

				<!-- Label -->
				<div class="mb-6">
					<label class="mb-1.5 block text-sm font-medium">{$_('timer.label')}</label>
					<input
						type="text"
						class="input"
						placeholder="z.B. Tee kochen, Pause, Meeting..."
						bind:value={formLabel}
					/>
				</div>

				<!-- Actions -->
				<div class="flex gap-3">
					<button type="button" class="btn btn-secondary flex-1" onclick={closeForm}>
						{$_('common.cancel')}
					</button>
					<button type="submit" class="btn btn-primary flex-1">
						Timer erstellen
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.animate-in {
		animation: animate-in 0.2s ease-out;
	}

	@keyframes animate-in {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
