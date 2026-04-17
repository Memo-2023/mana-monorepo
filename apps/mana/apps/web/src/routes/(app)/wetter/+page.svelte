<!--
  /wetter — Weather dashboard with current conditions, hourly/daily
  forecast, DWD alerts, and rain nowcast. Data from Open-Meteo,
  DWD, and Rainbow.ai via the mana-api proxy.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { weatherStore } from '$lib/modules/wetter/stores/weather.svelte';
	import { locationsStore } from '$lib/modules/wetter/stores/locations.svelte';
	import { useLocations } from '$lib/modules/wetter/queries';
	import CurrentConditions from '$lib/modules/wetter/components/CurrentConditions.svelte';
	import HourlyForecast from '$lib/modules/wetter/components/HourlyForecast.svelte';
	import DailyForecast from '$lib/modules/wetter/components/DailyForecast.svelte';
	import WeatherAlerts from '$lib/modules/wetter/components/WeatherAlerts.svelte';
	import NowcastBar from '$lib/modules/wetter/components/NowcastBar.svelte';
	import LocationPicker from '$lib/modules/wetter/components/LocationPicker.svelte';

	const locationsQuery = useLocations();
	let locations = $derived(locationsQuery.value);
	let selectedLat = $state<number | null>(null);
	let selectedLon = $state<number | null>(null);

	function selectLocation(lat: number, lon: number, name: string) {
		selectedLat = lat;
		selectedLon = lon;
		weatherStore.fetchWeather(lat, lon, name);
		weatherStore.fetchNowcast(lat, lon);
	}

	async function saveLocation(name: string, lat: number, lon: number) {
		await locationsStore.addLocation(name, lat, lon);
	}

	// On mount: use default location, or first saved, or GPS
	onMount(() => {
		const defaultLoc = locations.find((l) => l.isDefault) ?? locations[0];
		if (defaultLoc) {
			selectLocation(defaultLoc.lat, defaultLoc.lon, defaultLoc.name);
		} else if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					selectLocation(pos.coords.latitude, pos.coords.longitude, 'Aktueller Standort');
				},
				() => {
					// Default to Berlin if no GPS
					selectLocation(52.52, 13.41, 'Berlin');
				},
				{ enableHighAccuracy: true, timeout: 5000 }
			);
		} else {
			selectLocation(52.52, 13.41, 'Berlin');
		}
	});

	onDestroy(() => {
		weatherStore.stopAutoRefresh();
	});
</script>

<svelte:head>
	<title>Wetter - Mana</title>
</svelte:head>

<div class="wetter-view">
	<LocationPicker
		{locations}
		{selectedLat}
		{selectedLon}
		onSelect={selectLocation}
		onSave={saveLocation}
	/>

	{#if weatherStore.loading && !weatherStore.weatherData}
		<div class="loading-state">
			<span class="loading-icon">🌤</span>
			<span class="loading-text">Wetterdaten werden geladen...</span>
		</div>
	{:else if weatherStore.error && !weatherStore.weatherData}
		<div class="error-state">
			<span class="error-text">{weatherStore.error}</span>
			{#if selectedLat != null && selectedLon != null}
				<button
					class="retry-btn"
					onclick={() => selectLocation(selectedLat!, selectedLon!, 'Erneut versuchen')}
				>
					Erneut versuchen
				</button>
			{/if}
		</div>
	{:else if weatherStore.weatherData}
		{@const data = weatherStore.weatherData}

		<CurrentConditions current={data.current} locationName={data.location.name} />

		<WeatherAlerts alerts={data.alerts} />

		{#if weatherStore.nowcast}
			<NowcastBar nowcast={weatherStore.nowcast} />
		{/if}

		{#if data.hourly.length > 0}
			<HourlyForecast hours={data.hourly} />
		{/if}

		{#if data.daily.length > 0}
			<DailyForecast days={data.daily} />
		{/if}

		{#if weatherStore.loading}
			<div class="refresh-indicator">Aktualisierung...</div>
		{/if}
	{/if}
</div>

<style>
	.wetter-view {
		display: flex;
		flex-direction: column;
		gap: 12px;
		max-width: 600px;
		margin: 0 auto;
		padding: 16px;
	}
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 48px 16px;
	}
	.loading-icon {
		font-size: 3rem;
		animation: pulse 1.5s ease-in-out infinite;
	}
	.loading-text {
		font-size: 0.9rem;
		color: var(--text-secondary, #9ca3af);
	}
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 48px 16px;
	}
	.error-text {
		font-size: 0.9rem;
		color: #ef4444;
		text-align: center;
	}
	.retry-btn {
		padding: 8px 20px;
		border-radius: 8px;
		border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
		background: var(--card-bg, rgba(255, 255, 255, 0.06));
		color: var(--text-primary, #f3f4f6);
		font-size: 0.85rem;
		cursor: pointer;
	}
	.refresh-indicator {
		text-align: center;
		font-size: 0.75rem;
		color: var(--text-tertiary, #6b7280);
		padding: 4px;
	}
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
