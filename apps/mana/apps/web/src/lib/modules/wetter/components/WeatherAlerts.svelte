<!--
  DWD weather alerts — shows active warnings with severity color coding.
-->
<script lang="ts">
	import type { WeatherAlert } from '../types';

	interface Props {
		alerts: WeatherAlert[];
	}

	let { alerts }: Props = $props();

	function severityColor(severity: string): string {
		switch (severity) {
			case 'extreme':
				return '#dc2626';
			case 'severe':
				return '#ea580c';
			case 'moderate':
				return '#f59e0b';
			default:
				return '#eab308';
		}
	}

	function severityLabel(severity: string): string {
		switch (severity) {
			case 'extreme':
				return 'Extrem';
			case 'severe':
				return 'Schwer';
			case 'moderate':
				return 'Markant';
			default:
				return 'Gering';
		}
	}
</script>

{#if alerts.length > 0}
	<div class="alerts-section">
		<span class="section-label">Wetterwarnungen</span>
		{#each alerts.slice(0, 5) as alert (alert.id)}
			<div class="alert-card" style:border-left-color={severityColor(alert.severity)}>
				<div class="alert-header">
					<span class="alert-severity" style:color={severityColor(alert.severity)}>
						{severityLabel(alert.severity)}
					</span>
					<span class="alert-event">{alert.event}</span>
				</div>
				<div class="alert-headline">{alert.headline}</div>
				{#if alert.regionName}
					<div class="alert-region">{alert.regionName}</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	.alerts-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.section-label {
		font-size: 0.8rem;
		color: var(--text-secondary, #9ca3af);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.alert-card {
		background: var(--card-bg, rgba(255, 255, 255, 0.06));
		border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
		border-left: 3px solid;
		border-radius: 10px;
		padding: 12px;
	}
	.alert-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}
	.alert-severity {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.alert-event {
		font-size: 0.8rem;
		color: var(--text-secondary, #9ca3af);
	}
	.alert-headline {
		font-size: 0.85rem;
		color: var(--text-primary, #f3f4f6);
		line-height: 1.4;
	}
	.alert-region {
		font-size: 0.75rem;
		color: var(--text-tertiary, #6b7280);
		margin-top: 4px;
	}
</style>
