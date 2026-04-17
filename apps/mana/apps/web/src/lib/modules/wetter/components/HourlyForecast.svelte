<!--
  Horizontal scrolling hourly forecast — next 24 hours.
-->
<script lang="ts">
	import type { HourlyForecast } from '../types';
	import { getWeatherIcon } from '../weather-icons';

	interface Props {
		hours: HourlyForecast[];
	}

	let { hours }: Props = $props();

	let visibleHours = $derived(hours.slice(0, 24));
</script>

<div class="hourly-section">
	<span class="section-label">Stundenvorhersage</span>
	<div class="hourly-scroll">
		{#each visibleHours as hour (hour.time)}
			{@const time = new Date(hour.time).toLocaleTimeString('de-DE', {
				hour: '2-digit',
				minute: '2-digit',
			})}
			{@const isNow = Math.abs(Date.now() - new Date(hour.time).getTime()) < 30 * 60 * 1000}
			<div class="hour-item" class:now={isNow}>
				<span class="hour-time">{isNow ? 'Jetzt' : time}</span>
				<span class="hour-icon">{getWeatherIcon(hour.weatherCode, hour.isDay)}</span>
				<span class="hour-temp">{Math.round(hour.temperature)}°</span>
				{#if hour.precipitationProbability > 0}
					<span class="hour-precip">
						{hour.precipitationProbability}%
					</span>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.hourly-section {
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
	.hourly-scroll {
		display: flex;
		gap: 4px;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		-webkit-overflow-scrolling: touch;
		padding-bottom: 4px;
	}
	.hourly-scroll::-webkit-scrollbar {
		height: 4px;
	}
	.hourly-scroll::-webkit-scrollbar-thumb {
		background: var(--border-subtle, rgba(255, 255, 255, 0.1));
		border-radius: 2px;
	}
	.hour-item {
		scroll-snap-align: start;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		min-width: 56px;
		padding: 8px 6px;
		border-radius: 10px;
		flex-shrink: 0;
	}
	.hour-item.now {
		background: var(--accent-subtle, rgba(56, 189, 248, 0.15));
	}
	.hour-time {
		font-size: 0.7rem;
		color: var(--text-secondary, #9ca3af);
		white-space: nowrap;
	}
	.hour-icon {
		font-size: 1.2rem;
	}
	.hour-temp {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-primary, #f3f4f6);
	}
	.hour-precip {
		font-size: 0.65rem;
		color: #38bdf8;
	}
</style>
