<!--
  Wetter — ListView (Workbench panel)
  Full weather view with tabs: overview (current + hourly + daily + alerts + nowcast)
  and source comparison (multi-model). Same functionality as /wetter page.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { weatherStore } from './stores/weather.svelte';
	import { locationsStore } from './stores/locations.svelte';
	import { useLocations } from './queries';
	import CurrentConditions from './components/CurrentConditions.svelte';
	import HourlyForecast from './components/HourlyForecast.svelte';
	import DailyForecast from './components/DailyForecast.svelte';
	import WeatherAlerts from './components/WeatherAlerts.svelte';
	import NowcastBar from './components/NowcastBar.svelte';
	import LocationPicker from './components/LocationPicker.svelte';
	import SourceComparison from './components/SourceComparison.svelte';

	const locationsQuery = useLocations();
	let locations = $derived(locationsQuery.value);
	let selectedLat = $state<number | null>(null);
	let selectedLon = $state<number | null>(null);
	let selectedName = $state('');
	let activeTab = $state<'overview' | 'compare'>('overview');

	function selectLocation(lat: number, lon: number, name: string) {
		selectedLat = lat;
		selectedLon = lon;
		selectedName = name;
		weatherStore.fetchWeather(lat, lon, name);
		weatherStore.fetchNowcast(lat, lon);
	}

	async function saveLocation(name: string, lat: number, lon: number) {
		await locationsStore.addLocation(name, lat, lon);
	}

	async function removeLocation(id: string) {
		await locationsStore.removeLocation(id);
	}

	async function setDefaultLocation(id: string) {
		await locationsStore.setDefault(id);
	}

	onMount(() => {
		if (weatherStore.weatherData) return;

		const defaultLoc = locations.find((l) => l.isDefault) ?? locations[0];
		if (defaultLoc) {
			selectLocation(defaultLoc.lat, defaultLoc.lon, defaultLoc.name);
		} else if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					selectLocation(pos.coords.latitude, pos.coords.longitude, 'Aktueller Standort');
				},
				() => selectLocation(52.52, 13.41, 'Berlin'),
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

<div class="wetter-list">
	<LocationPicker
		{locations}
		{selectedLat}
		{selectedLon}
		onSelect={selectLocation}
		onSave={saveLocation}
		onRemove={removeLocation}
		onSetDefault={setDefaultLocation}
	/>

	<!-- Tab switcher -->
	<div class="tab-bar">
		<button
			class="tab"
			class:active={activeTab === 'overview'}
			onclick={() => (activeTab = 'overview')}
		>
			Übersicht
		</button>
		<button
			class="tab"
			class:active={activeTab === 'compare'}
			onclick={() => (activeTab = 'compare')}
		>
			Quellen-Vergleich
		</button>
	</div>

	{#if activeTab === 'compare' && selectedLat != null && selectedLon != null}
		<SourceComparison lat={selectedLat} lon={selectedLon} locationName={selectedName} />
	{:else if weatherStore.loading && !weatherStore.weatherData}
		<div class="loading">
			<span class="loading-icon">🌤</span>
			<span class="loading-text">Wetterdaten werden geladen...</span>
		</div>
	{:else if weatherStore.error && !weatherStore.weatherData}
		<div class="error">{weatherStore.error}</div>
	{:else if weatherStore.weatherData}
		{@const data = weatherStore.weatherData}

		<CurrentConditions
			current={data.current}
			locationName={data.location.name}
			fetchedAt={data.fetchedAt}
		/>

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
	.wetter-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 12px;
	}
	.tab-bar {
		display: flex;
		gap: 4px;
		background: var(--card-bg, rgba(255, 255, 255, 0.06));
		border-radius: 10px;
		padding: 3px;
	}
	.tab {
		flex: 1;
		padding: 8px 12px;
		border: none;
		border-radius: 8px;
		background: none;
		color: var(--text-secondary, #9ca3af);
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}
	.tab.active {
		background: var(--card-bg-hover, rgba(255, 255, 255, 0.1));
		color: var(--text-primary, #f3f4f6);
		font-weight: 500;
	}
	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 32px 16px;
	}
	.loading-icon {
		font-size: 2rem;
		animation: pulse 1.5s ease-in-out infinite;
	}
	.loading-text {
		font-size: 0.8rem;
		color: var(--text-secondary, #9ca3af);
	}
	.error {
		padding: 16px;
		font-size: 0.8rem;
		color: #ef4444;
		text-align: center;
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
