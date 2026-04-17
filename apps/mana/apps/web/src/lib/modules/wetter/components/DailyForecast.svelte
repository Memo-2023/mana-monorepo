<!--
  7-day daily forecast — shows min/max temp, weather icon, precipitation.
-->
<script lang="ts">
	import type { DailyForecast } from '../types';
	import { getWeatherIcon, getWeatherLabel } from '../weather-icons';

	interface Props {
		days: DailyForecast[];
	}

	let { days }: Props = $props();

	let visibleDays = $derived(days.slice(0, 7));

	function dayLabel(dateStr: string, idx: number): string {
		if (idx === 0) return 'Heute';
		if (idx === 1) return 'Morgen';
		return new Date(dateStr).toLocaleDateString('de-DE', { weekday: 'short' });
	}

	function tempBarStyle(min: number, max: number): string {
		// Normalize to a 0-100 range for visual bar, based on typical DACH range
		const rangeMin = -10;
		const rangeMax = 40;
		const left = Math.max(0, ((min - rangeMin) / (rangeMax - rangeMin)) * 100);
		const right = Math.min(100, ((max - rangeMin) / (rangeMax - rangeMin)) * 100);
		return `left: ${left}%; width: ${Math.max(right - left, 5)}%`;
	}
</script>

<div class="daily-section">
	<span class="section-label">7-Tage-Vorhersage</span>
	<div class="daily-list">
		{#each visibleDays as day, idx (day.date)}
			<div class="day-row">
				<span class="day-name">{dayLabel(day.date, idx)}</span>
				<span class="day-icon" title={getWeatherLabel(day.weatherCode)}>
					{getWeatherIcon(day.weatherCode)}
				</span>
				{#if day.precipitationProbabilityMax > 10}
					<span class="day-precip">{day.precipitationProbabilityMax}%</span>
				{:else}
					<span class="day-precip"></span>
				{/if}
				<span class="day-temp-min">{Math.round(day.temperatureMin)}°</span>
				<div class="temp-bar-track">
					<div
						class="temp-bar-fill"
						style={tempBarStyle(day.temperatureMin, day.temperatureMax)}
					></div>
				</div>
				<span class="day-temp-max">{Math.round(day.temperatureMax)}°</span>
			</div>
		{/each}
	</div>
</div>

<style>
	.daily-section {
		background: var(--card-bg, rgba(255, 255, 255, 0.06));
		border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
		border-radius: 16px;
		padding: 16px;
	}
	.section-label {
		font-size: 0.8rem;
		color: var(--text-secondary, #9ca3af);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		display: block;
		margin-bottom: 12px;
	}
	.daily-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.day-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 0;
	}
	.day-name {
		width: 56px;
		font-size: 0.85rem;
		color: var(--text-primary, #f3f4f6);
		flex-shrink: 0;
	}
	.day-icon {
		font-size: 1.1rem;
		width: 28px;
		text-align: center;
		flex-shrink: 0;
	}
	.day-precip {
		width: 32px;
		font-size: 0.7rem;
		color: #38bdf8;
		text-align: right;
		flex-shrink: 0;
	}
	.day-temp-min {
		width: 28px;
		font-size: 0.8rem;
		color: var(--text-secondary, #9ca3af);
		text-align: right;
		flex-shrink: 0;
	}
	.temp-bar-track {
		flex: 1;
		height: 4px;
		border-radius: 2px;
		background: var(--card-bg-hover, rgba(255, 255, 255, 0.06));
		position: relative;
		min-width: 60px;
	}
	.temp-bar-fill {
		position: absolute;
		top: 0;
		height: 100%;
		border-radius: 2px;
		background: linear-gradient(to right, #38bdf8, #f59e0b);
	}
	.day-temp-max {
		width: 28px;
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-primary, #f3f4f6);
		flex-shrink: 0;
	}
</style>
