<!--
  Wetter — ListView (Workbench panel)
  Compact weather card showing current conditions, hourly preview,
  and alerts. Uses the same stores as the full /wetter page.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { weatherStore } from './stores/weather.svelte';
	import { locationsStore } from './stores/locations.svelte';
	import { useLocations } from './queries';
	import { getWeatherIcon, getWeatherLabel, windDirectionLabel } from './weather-icons';

	const locationsQuery = useLocations();
	let locations = $derived(locationsQuery.value);

	onMount(() => {
		// If weather is already loaded, skip. Otherwise load default location.
		if (weatherStore.weatherData) return;

		const defaultLoc = locations.find((l) => l.isDefault) ?? locations[0];
		if (defaultLoc) {
			weatherStore.fetchWeather(defaultLoc.lat, defaultLoc.lon, defaultLoc.name);
			weatherStore.fetchNowcast(defaultLoc.lat, defaultLoc.lon);
		} else if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					weatherStore.fetchWeather(
						pos.coords.latitude,
						pos.coords.longitude,
						'Aktueller Standort'
					);
					weatherStore.fetchNowcast(pos.coords.latitude, pos.coords.longitude);
				},
				() => weatherStore.fetchWeather(52.52, 13.41, 'Berlin'),
				{ enableHighAccuracy: true, timeout: 5000 }
			);
		} else {
			weatherStore.fetchWeather(52.52, 13.41, 'Berlin');
		}
	});

	onDestroy(() => {
		weatherStore.stopAutoRefresh();
	});

	async function addCurrentAsLocation() {
		const data = weatherStore.weatherData;
		if (!data) return;
		await locationsStore.addLocation(data.location.name, data.location.lat, data.location.lon);
	}
</script>

{#if weatherStore.loading && !weatherStore.weatherData}
	<div class="loading">
		<span class="loading-icon">🌤</span>
		<span class="loading-text">Laden...</span>
	</div>
{:else if weatherStore.weatherData}
	{@const data = weatherStore.weatherData}
	{@const c = data.current}

	<!-- Current conditions compact -->
	<div class="current-compact">
		<div class="current-main">
			<span class="icon">{getWeatherIcon(c.weatherCode, c.isDay)}</span>
			<span class="temp">{Math.round(c.temperature)}°</span>
			<div class="info">
				<span class="condition">{getWeatherLabel(c.weatherCode)}</span>
				<span class="location">{data.location.name}</span>
			</div>
		</div>
		<div class="details">
			<span>Gefuehlt {Math.round(c.feelsLike)}°</span>
			<span>💨 {Math.round(c.windSpeed)} km/h {windDirectionLabel(c.windDirection)}</span>
			<span>💧 {c.humidity}%</span>
		</div>
	</div>

	<!-- Alerts (if any) -->
	{#if data.alerts.length > 0}
		<div class="alerts">
			{#each data.alerts.slice(0, 2) as alert (alert.id)}
				<div
					class="alert-badge"
					class:severe={alert.severity === 'severe' || alert.severity === 'extreme'}
				>
					⚠ {alert.event}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Hourly mini-preview -->
	{#if data.hourly.length > 0}
		<div class="hourly-mini">
			{#each data.hourly.slice(0, 8) as hour (hour.time)}
				{@const time = new Date(hour.time).toLocaleTimeString('de-DE', { hour: '2-digit' })}
				<div class="hour-mini">
					<span class="hm-time">{time}</span>
					<span class="hm-icon">{getWeatherIcon(hour.weatherCode, hour.isDay)}</span>
					<span class="hm-temp">{Math.round(hour.temperature)}°</span>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Daily mini-preview -->
	{#if data.daily.length > 0}
		<div class="daily-mini">
			{#each data.daily.slice(0, 5) as day, idx (day.date)}
				{@const label =
					idx === 0
						? 'Heute'
						: new Date(day.date).toLocaleDateString('de-DE', { weekday: 'short' })}
				<div class="day-mini">
					<span class="dm-day">{label}</span>
					<span class="dm-icon">{getWeatherIcon(day.weatherCode)}</span>
					<span class="dm-temps"
						>{Math.round(day.temperatureMin)}° / {Math.round(day.temperatureMax)}°</span
					>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Nowcast summary -->
	{#if weatherStore.nowcast}
		<div class="nowcast-mini">
			<span class="nowcast-text">{weatherStore.nowcast.summary}</span>
		</div>
	{/if}
{:else if weatherStore.error}
	<div class="error">{weatherStore.error}</div>
{/if}

<style>
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

	.current-compact {
		padding: 12px;
	}
	.current-main {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}
	.icon {
		font-size: 2.2rem;
		line-height: 1;
	}
	.temp {
		font-size: 2.5rem;
		font-weight: 300;
		line-height: 1;
		color: var(--text-primary, #f3f4f6);
	}
	.info {
		display: flex;
		flex-direction: column;
		gap: 1px;
		margin-left: 4px;
	}
	.condition {
		font-size: 0.85rem;
		color: var(--text-primary, #f3f4f6);
	}
	.location {
		font-size: 0.7rem;
		color: var(--text-secondary, #9ca3af);
	}
	.details {
		display: flex;
		gap: 12px;
		font-size: 0.75rem;
		color: var(--text-secondary, #9ca3af);
		padding: 0 4px;
	}

	.alerts {
		display: flex;
		gap: 6px;
		padding: 0 12px 8px;
		flex-wrap: wrap;
	}
	.alert-badge {
		font-size: 0.7rem;
		padding: 2px 8px;
		border-radius: 10px;
		background: rgba(245, 158, 11, 0.15);
		color: #f59e0b;
	}
	.alert-badge.severe {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}

	.hourly-mini {
		display: flex;
		gap: 2px;
		padding: 0 12px 8px;
		overflow-x: auto;
	}
	.hourly-mini::-webkit-scrollbar {
		height: 0;
	}
	.hour-mini {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		min-width: 40px;
		flex-shrink: 0;
	}
	.hm-time {
		font-size: 0.6rem;
		color: var(--text-tertiary, #6b7280);
	}
	.hm-icon {
		font-size: 0.9rem;
	}
	.hm-temp {
		font-size: 0.7rem;
		color: var(--text-primary, #f3f4f6);
	}

	.daily-mini {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 4px 12px 8px;
	}
	.day-mini {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.dm-day {
		width: 40px;
		font-size: 0.75rem;
		color: var(--text-secondary, #9ca3af);
	}
	.dm-icon {
		font-size: 0.9rem;
	}
	.dm-temps {
		font-size: 0.75rem;
		color: var(--text-primary, #f3f4f6);
	}

	.nowcast-mini {
		padding: 4px 12px 12px;
	}
	.nowcast-text {
		font-size: 0.75rem;
		color: var(--text-secondary, #9ca3af);
	}

	.error {
		padding: 16px;
		font-size: 0.8rem;
		color: #ef4444;
		text-align: center;
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
