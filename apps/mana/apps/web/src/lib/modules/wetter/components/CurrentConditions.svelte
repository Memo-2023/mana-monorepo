<!--
  Current weather conditions — hero card with dominant temperature,
  conditions, wind, humidity, pressure, UV index, and last-updated time.
-->
<script lang="ts">
	import type { CurrentWeather } from '../types';
	import { getWeatherIcon, getWeatherLabel, windDirectionLabel } from '../weather-icons';

	interface Props {
		current: CurrentWeather;
		locationName: string;
		fetchedAt?: number;
	}

	let { current, locationName, fetchedAt }: Props = $props();

	/** Deduplicate "Berlin, Berlin" → "Berlin" */
	let displayName = $derived(() => {
		const parts = locationName.split(', ');
		if (parts.length === 2 && parts[0].trim() === parts[1].trim()) return parts[0];
		return locationName;
	});

	let lastUpdated = $derived(() => {
		if (!fetchedAt) return '';
		return new Date(fetchedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
	});
</script>

<div class="current-card">
	<!-- Hero: temperature as dominant element -->
	<div class="hero">
		<div class="hero-temp-block">
			<span class="hero-temp">{Math.round(current.temperature)}°</span>
			<span class="hero-icon">{getWeatherIcon(current.weatherCode, current.isDay)}</span>
		</div>
		<div class="hero-meta">
			<span class="hero-condition">{getWeatherLabel(current.weatherCode)}</span>
			<span class="hero-location">{displayName()}</span>
			<span class="hero-feels">Gefühlt {Math.round(current.feelsLike)}°</span>
		</div>
	</div>

	<!-- Detail grid -->
	<div class="detail-grid">
		<div class="detail">
			<span class="detail-icon">💨</span>
			<span class="detail-val">{Math.round(current.windSpeed)} km/h</span>
			<span class="detail-lbl">Wind {windDirectionLabel(current.windDirection)}</span>
		</div>
		<div class="detail">
			<span class="detail-icon">💧</span>
			<span class="detail-val">{current.humidity}%</span>
			<span class="detail-lbl">Feuchtigkeit</span>
		</div>
		<div class="detail">
			<span class="detail-icon">🌡️</span>
			<span class="detail-val">{Math.round(current.pressure)} hPa</span>
			<span class="detail-lbl">Luftdruck</span>
		</div>
		<div class="detail">
			<span class="detail-icon">☀️</span>
			<span class="detail-val">{current.uvIndex}</span>
			<span class="detail-lbl">UV-Index</span>
		</div>
	</div>

	<!-- Timestamp -->
	{#if lastUpdated()}
		<div class="timestamp">Aktualisiert {lastUpdated()}</div>
	{/if}
</div>

<style>
	.current-card {
		background: var(--card-bg, rgba(255, 255, 255, 0.06));
		border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
		border-radius: 16px;
		padding: 20px;
	}

	/* Hero — temperature is the dominant element */
	.hero {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		margin-bottom: 16px;
	}
	.hero-temp-block {
		display: flex;
		align-items: flex-start;
		gap: 4px;
	}
	.hero-temp {
		font-size: 4rem;
		font-weight: 200;
		line-height: 1;
		color: var(--text-primary, #f3f4f6);
		letter-spacing: -2px;
	}
	.hero-icon {
		font-size: 1.8rem;
		margin-top: 4px;
	}
	.hero-meta {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding-top: 8px;
	}
	.hero-condition {
		font-size: 1.1rem;
		font-weight: 500;
		color: var(--text-primary, #f3f4f6);
	}
	.hero-location {
		font-size: 0.8rem;
		color: var(--text-secondary, #9ca3af);
	}
	.hero-feels {
		font-size: 0.8rem;
		color: var(--text-tertiary, #6b7280);
	}

	/* Detail grid */
	.detail-grid {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr;
		gap: 6px;
	}
	.detail {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 8px 4px;
		border-radius: 8px;
		background: var(--card-bg-hover, rgba(255, 255, 255, 0.04));
	}
	.detail-icon {
		font-size: 1rem;
		line-height: 1;
		margin-bottom: 1px;
	}
	.detail-val {
		font-size: 0.82rem;
		font-weight: 500;
		color: var(--text-primary, #f3f4f6);
	}
	.detail-lbl {
		font-size: 0.65rem;
		color: var(--text-tertiary, #6b7280);
		text-align: center;
	}

	/* Timestamp */
	.timestamp {
		margin-top: 10px;
		font-size: 0.65rem;
		color: var(--text-tertiary, #6b7280);
		text-align: right;
	}
</style>
