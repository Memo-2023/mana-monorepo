<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { PageHeader, toast } from '@manacore/shared-ui';
	import { worldClocksStore } from '$lib/stores/world-clocks.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { POPULAR_TIMEZONES } from '@clock/shared';
	import WorldMap from '$lib/components/WorldMap.svelte';
	import { WorldClockSkeleton } from '$lib/components/skeletons';

	// State
	let showAddModal = $state(false);
	let searchQuery = $state('');
	let currentTime = $state(new Date());
	let interval: ReturnType<typeof setInterval> | null = null;
	let showMap = $state(true);

	// Selected city timezones for map highlighting
	let selectedTimezones = $derived(worldClocksStore.worldClocks.map((wc) => wc.timezone));

	// Handle map city click
	function handleMapCityClick(timezone: string, cityName: string) {
		const alreadyAdded = worldClocksStore.worldClocks.some((wc) => wc.timezone === timezone);
		if (alreadyAdded) {
			toast.info(`${cityName} ist bereits hinzugefügt`);
		} else {
			addCity(timezone, cityName);
		}
	}

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

<PageHeader title={$_('worldClock.title')} size="md" centered>
	{#snippet actions()}
		<div class="flex items-center gap-2">
			<button
				class="btn btn-ghost btn-sm px-2"
				onclick={() => (showMap = !showMap)}
				title={showMap ? 'Karte ausblenden' : 'Karte anzeigen'}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="12" cy="12" r="10" />
					<path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
					<path d="M2 12h20" />
				</svg>
			</button>
			<button class="btn btn-primary btn-sm" onclick={openAddModal}>
				+ {$_('worldClock.add')}
			</button>
		</div>
	{/snippet}
</PageHeader>

<div class="world-clock-page">
	<!-- World Map (Full Width) -->
	{#if showMap}
		<div class="map-section">
			<div class="map-container">
				<WorldMap
					selectedCities={selectedTimezones}
					onCityClick={handleMapCityClick}
					{currentTime}
				/>
			</div>
			<p class="text-center text-xs text-muted-foreground py-2">
				Klicke auf eine Stadt um sie hinzuzufügen
			</p>
		</div>
	{/if}

	<!-- World Clock List -->
	{#if worldClocksStore.loading}
		<WorldClockSkeleton />
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
						class="absolute right-3 top-3 text-muted-foreground hover:text-error p-0.5"
						onclick={() => removeCity(clock.id)}
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

					<!-- Day/Night indicator -->
					<div class="mb-2 flex items-center gap-2">
						<span class="text-xs text-muted-foreground">{isDay ? 'Tag' : 'Nacht'}</span>
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
					<button class="text-muted-foreground hover:text-foreground p-0.5" onclick={closeAddModal}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
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

<style>
	.world-clock-page {
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - 180px);
	}

	.map-section {
		display: flex;
		flex-direction: column;
		margin: 0 -1rem 1rem -1rem;
		background: hsl(var(--color-card));
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.map-container {
		width: 100%;
		max-height: 50vh;
		overflow: hidden;
	}

	.map-container :global(.world-map-container) {
		border-radius: 0;
		box-shadow: none;
	}

	@media (min-width: 768px) {
		.map-section {
			margin: 0 -1.5rem 1.5rem -1.5rem;
		}

		.map-container {
			max-height: 60vh;
		}
	}

	.world-clock-card {
		background: hsl(var(--color-card));
		border-radius: var(--radius-lg);
		padding: 1rem;
		border: 1px solid hsl(var(--color-border));
	}

	.city-name {
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}

	.time-display {
		font-size: 2.5rem;
		font-weight: 300;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-foreground));
		line-height: 1;
	}

	.timezone-info {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
