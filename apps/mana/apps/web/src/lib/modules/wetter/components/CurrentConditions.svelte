<!--
  Current weather conditions card — shows temperature, conditions,
  wind, humidity, pressure, UV index.
-->
<script lang="ts">
	import type { CurrentWeather } from '../types';
	import { getWeatherIcon, getWeatherLabel, windDirectionLabel } from '../weather-icons';

	interface Props {
		current: CurrentWeather;
		locationName: string;
	}

	let { current, locationName }: Props = $props();
</script>

<div class="current-card">
	<div class="location-name">{locationName}</div>
	<div class="main-row">
		<span class="weather-icon">{getWeatherIcon(current.weatherCode, current.isDay)}</span>
		<span class="temperature">{Math.round(current.temperature)}°</span>
		<div class="condition-info">
			<span class="condition-label">{getWeatherLabel(current.weatherCode)}</span>
			<span class="feels-like">Gefuehlt {Math.round(current.feelsLike)}°</span>
		</div>
	</div>
	<div class="detail-grid">
		<div class="detail">
			<span class="detail-icon">💨</span>
			<span class="detail-val">{Math.round(current.windSpeed)} km/h</span>
			<span class="detail-lbl">{windDirectionLabel(current.windDirection)}</span>
		</div>
		<div class="detail">
			<span class="detail-icon">💧</span>
			<span class="detail-val">{current.humidity}%</span>
			<span class="detail-lbl">Feuchtigkeit</span>
		</div>
		<div class="detail">
			<span class="detail-icon">🌡</span>
			<span class="detail-val">{Math.round(current.pressure)} hPa</span>
			<span class="detail-lbl">Druck</span>
		</div>
		<div class="detail">
			<span class="detail-icon">☀️</span>
			<span class="detail-val">{current.uvIndex}</span>
			<span class="detail-lbl">UV-Index</span>
		</div>
	</div>
</div>

<style>
	.current-card {
		background: var(--card-bg, rgba(255, 255, 255, 0.06));
		border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
		border-radius: 16px;
		padding: 20px;
	}
	.location-name {
		font-size: 0.85rem;
		color: var(--text-secondary, #9ca3af);
		margin-bottom: 8px;
	}
	.main-row {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
	}
	.weather-icon {
		font-size: 3rem;
		line-height: 1;
	}
	.temperature {
		font-size: 3.5rem;
		font-weight: 300;
		line-height: 1;
		color: var(--text-primary, #f3f4f6);
	}
	.condition-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.condition-label {
		font-size: 1rem;
		color: var(--text-primary, #f3f4f6);
	}
	.feels-like {
		font-size: 0.85rem;
		color: var(--text-secondary, #9ca3af);
	}
	.detail-grid {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr;
		gap: 8px;
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
		font-size: 1.1rem;
	}
	.detail-val {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-primary, #f3f4f6);
	}
	.detail-lbl {
		font-size: 0.7rem;
		color: var(--text-secondary, #9ca3af);
	}
</style>
