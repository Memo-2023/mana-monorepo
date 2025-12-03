<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { worldClocksStore } from '$lib/stores/world-clocks.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { toast } from '$lib/stores/toast';
	import { POPULAR_TIMEZONES } from '@clock/shared';

	// State
	let showAddModal = $state(false);
	let searchQuery = $state('');
	let currentTime = $state(new Date());
	let interval: ReturnType<typeof setInterval> | null = null;

	// Filtered timezones based on search
	let filteredTimezones = $derived(
		searchQuery
			? POPULAR_TIMEZONES.filter(
					(tz) =>
						tz.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
						tz.timezone.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: POPULAR_TIMEZONES
	);

	onMount(async () => {
		if (authStore.isAuthenticated) {
			await worldClocksStore.fetchWorldClocks();
		}

		// Update time every second
		interval = setInterval(() => {
			currentTime = new Date();
		}, 1000);
	});

	onDestroy(() => {
		if (interval) {
			clearInterval(interval);
		}
	});

	function openAddModal() {
		searchQuery = '';
		showAddModal = true;
	}

	function closeAddModal() {
		showAddModal = false;
	}

	async function addCity(timezone: string, cityName: string) {
		const result = await worldClocksStore.addWorldClock({
			timezone,
			cityName,
		});

		if (result.success) {
			toast.success(`${cityName} hinzugefügt`);
			closeAddModal();
		} else {
			toast.error(result.error || 'Fehler beim Hinzufügen');
		}
	}

	async function removeCity(id: string) {
		const result = await worldClocksStore.removeWorldClock(id);
		if (result.success) {
			toast.success('Stadt entfernt');
		}
	}

	function getTimeForTimezone(timezone: string) {
		try {
			const formatter = new Intl.DateTimeFormat('de-DE', {
				timeZone: timezone,
				hour: '2-digit',
				minute: '2-digit',
				hour12: false,
			});
			return formatter.format(currentTime);
		} catch {
			return '--:--';
		}
	}

	function getDateForTimezone(timezone: string) {
		try {
			const formatter = new Intl.DateTimeFormat('de-DE', {
				timeZone: timezone,
				weekday: 'short',
				day: 'numeric',
				month: 'short',
			});
			return formatter.format(currentTime);
		} catch {
			return '';
		}
	}

	function getOffsetText(timezone: string) {
		try {
			// Get local offset
			const localOffset = currentTime.getTimezoneOffset();

			// Get target timezone offset
			const targetDate = new Date(currentTime.toLocaleString('en-US', { timeZone: timezone }));
			const localDate = new Date(currentTime.toLocaleString('en-US', { timeZone: 'UTC' }));
			const utcDate = new Date(currentTime.toUTCString().slice(0, -4));

			const targetOffset = (targetDate.getTime() - utcDate.getTime()) / (1000 * 60);
			const diffMinutes = targetOffset + localOffset;
			const diffHours = Math.round(diffMinutes / 60);

			if (diffHours === 0) {
				return $_('worldClock.same');
			} else if (diffHours > 0) {
				return `+${diffHours}h`;
			} else {
				return `${diffHours}h`;
			}
		} catch {
			return '';
		}
	}

	function isDaytime(timezone: string) {
		try {
			const formatter = new Intl.DateTimeFormat('en-US', {
				timeZone: timezone,
				hour: 'numeric',
				hour12: false,
			});
			const hour = parseInt(formatter.format(currentTime));
			return hour >= 6 && hour < 20;
		} catch {
			return true;
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-foreground">{$_('worldClock.title')}</h1>
		<button class="btn btn-primary" onclick={openAddModal}>
			+ {$_('worldClock.add')}
		</button>
	</div>

	<!-- World Clock List -->
	{#if worldClocksStore.loading}
		<div class="flex justify-center py-12">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"
			></div>
		</div>
	{:else if worldClocksStore.sortedWorldClocks.length === 0}
		<div class="card py-12 text-center">
			<p class="text-lg text-muted-foreground">{$_('worldClock.noClocks')}</p>
			<button class="btn btn-primary mt-4" onclick={openAddModal}>
				{$_('worldClock.add')}
			</button>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each worldClocksStore.sortedWorldClocks as clock (clock.id)}
				{@const isDay = isDaytime(clock.timezone)}
				<div class="world-clock-card relative">
					<!-- Delete button -->
					<button
						class="absolute right-3 top-3 text-muted-foreground hover:text-error"
						onclick={() => removeCity(clock.id)}
					>
						✕
					</button>

					<!-- Day/Night indicator -->
					<div class="mb-2 flex items-center gap-2">
						<span class="text-xl">{isDay ? '☀️' : '🌙'}</span>
						<span class="city-name">{clock.cityName}</span>
					</div>

					<!-- Time -->
					<div class="time-display">
						{getTimeForTimezone(clock.timezone)}
					</div>

					<!-- Date and offset -->
					<div class="mt-2 flex items-center justify-between">
						<span class="timezone-info">
							{getDateForTimezone(clock.timezone)}
						</span>
						<span class="text-sm font-medium text-primary">
							{getOffsetText(clock.timezone)}
						</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Add City Modal -->
	{#if showAddModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div class="card w-full max-w-md max-h-[80vh] flex flex-col">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-xl font-semibold">{$_('worldClock.add')}</h2>
					<button class="text-muted-foreground hover:text-foreground" onclick={closeAddModal}>
						✕
					</button>
				</div>

				<!-- Search -->
				<input
					type="text"
					class="input mb-4"
					placeholder={$_('worldClock.search')}
					bind:value={searchQuery}
				/>

				<!-- Timezone list -->
				<div class="flex-1 overflow-y-auto -mx-4 px-4">
					{#each filteredTimezones as tz}
						{@const alreadyAdded = worldClocksStore.worldClocks.some(
							(wc) => wc.timezone === tz.timezone
						)}
						<button
							class="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-muted transition-colors"
							class:opacity-50={alreadyAdded}
							disabled={alreadyAdded}
							onclick={() => addCity(tz.timezone, tz.city)}
						>
							<div>
								<div class="font-medium">{tz.city}</div>
								<div class="text-sm text-muted-foreground">{tz.timezone}</div>
							</div>
							<div class="text-right">
								<div class="font-mono">{getTimeForTimezone(tz.timezone)}</div>
								<div class="text-xs text-muted-foreground">{tz.region}</div>
							</div>
						</button>
					{/each}

					{#if filteredTimezones.length === 0}
						<p class="py-8 text-center text-muted-foreground">
							Keine Ergebnisse für "{searchQuery}"
						</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
