<!--
  Rain nowcast — bar chart showing minute-level precipitation forecast.
-->
<script lang="ts">
	import { formatTime } from '$lib/i18n/format';
	import type { RainNowcast } from '../types';

	interface Props {
		nowcast: RainNowcast;
	}

	let { nowcast }: Props = $props();

	let maxPrecip = $derived(Math.max(0.5, ...nowcast.minutely.map((m) => m.precipitation)));
</script>

<div class="nowcast-section">
	<span class="section-label">Niederschlagsprognose</span>
	<div class="nowcast-summary">{nowcast.summary}</div>
	{#if nowcast.minutely.length > 0}
		<div class="nowcast-chart">
			{#each nowcast.minutely as point (point.time)}
				{@const height = Math.max(2, (point.precipitation / maxPrecip) * 100)}
				{@const time = formatTime(new Date(point.time), {
					hour: '2-digit',
					minute: '2-digit',
				})}
				<div class="bar-wrapper" title="{time}: {point.precipitation.toFixed(1)} mm">
					<div class="bar" class:has-rain={point.precipitation > 0} style:height="{height}%"></div>
				</div>
			{/each}
		</div>
		<div class="nowcast-time-labels">
			<span
				>{formatTime(new Date(nowcast.minutely[0].time), {
					hour: '2-digit',
					minute: '2-digit',
				})}</span
			>
			<span
				>{formatTime(new Date(nowcast.minutely[nowcast.minutely.length - 1].time), {
					hour: '2-digit',
					minute: '2-digit',
				})}</span
			>
		</div>
	{/if}
</div>

<style>
	.nowcast-section {
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
		margin-bottom: 4px;
	}
	.nowcast-summary {
		font-size: 0.85rem;
		color: var(--text-primary, #f3f4f6);
		margin-bottom: 12px;
	}
	.nowcast-chart {
		display: flex;
		align-items: flex-end;
		gap: 1px;
		height: 60px;
	}
	.bar-wrapper {
		flex: 1;
		height: 100%;
		display: flex;
		align-items: flex-end;
	}
	.bar {
		width: 100%;
		border-radius: 1px 1px 0 0;
		background: var(--card-bg-hover, rgba(255, 255, 255, 0.1));
		transition: height 0.2s ease;
	}
	.bar.has-rain {
		background: #38bdf8;
	}
	.nowcast-time-labels {
		display: flex;
		justify-content: space-between;
		margin-top: 4px;
		font-size: 0.65rem;
		color: var(--text-tertiary, #6b7280);
	}
</style>
