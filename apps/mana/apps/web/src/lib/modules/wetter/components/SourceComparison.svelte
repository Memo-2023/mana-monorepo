<!--
  Multi-model weather comparison — shows the same location queried
  from different weather models (DWD ICON-D2, ICON-EU, ECMWF, GFS,
  Open-Meteo Best Match) stacked for easy comparison.
-->
<script lang="ts">
	import { getComparison, type CompareResponse, type ModelComparison } from '../api';
	import { getWeatherIcon, getWeatherLabel } from '../weather-icons';

	interface Props {
		lat: number;
		lon: number;
		locationName: string;
	}

	let { lat, lon, locationName }: Props = $props();

	let data = $state<CompareResponse | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);

	$effect(() => {
		if (lat && lon) {
			loadComparison(lat, lon);
		}
	});

	async function loadComparison(lt: number, ln: number) {
		loading = true;
		error = null;
		try {
			data = await getComparison(lt, ln);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Vergleichsdaten nicht verfuegbar';
		} finally {
			loading = false;
		}
	}

	function sourceColor(source: string): string {
		switch (source) {
			case 'DWD':
				return '#38bdf8';
			case 'ECMWF':
				return '#a78bfa';
			case 'NOAA':
				return '#34d399';
			case 'Open-Meteo':
				return '#f59e0b';
			default:
				return '#9ca3af';
		}
	}
</script>

<div class="comparison-section">
	<div class="section-header">
		<span class="section-label">Modell-Vergleich</span>
		<span class="section-sub">{locationName}</span>
	</div>

	{#if loading}
		<div class="loading">Modelle werden verglichen...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else if data}
		<!-- Current conditions comparison -->
		<div class="compare-block">
			<span class="block-label">Aktuell</span>
			<div class="model-cards">
				{#each data.models as model (model.id)}
					{@const c = model.current}
					<div class="model-card" class:has-error={model.error}>
						<div class="model-header">
							<span class="model-badge" style:background={sourceColor(model.source)}>
								{model.source}
							</span>
							<span class="model-name">{model.label}</span>
						</div>
						<div class="model-desc">{model.description}</div>
						{#if model.error || !c}
							<div class="model-error">Nicht verfuegbar</div>
						{:else}
							<div class="model-current">
								<span class="mc-icon"
									>{getWeatherIcon(c.weather_code ?? 0, (c.is_day ?? 1) === 1)}</span
								>
								<span class="mc-temp">{Math.round(c.temperature_2m ?? 0)}°</span>
								<span class="mc-condition">{getWeatherLabel(c.weather_code ?? 0)}</span>
							</div>
							<div class="model-details">
								<div class="md-row">
									<span class="md-label">Gefuehlt</span>
									<span class="md-val">{Math.round(c.apparent_temperature ?? 0)}°</span>
								</div>
								<div class="md-row">
									<span class="md-label">Wind</span>
									<span class="md-val">{Math.round(c.wind_speed_10m ?? 0)} km/h</span>
								</div>
								<div class="md-row">
									<span class="md-label">Niederschlag</span>
									<span class="md-val">{(c.precipitation ?? 0).toFixed(1)} mm</span>
								</div>
								<div class="md-row">
									<span class="md-label">Feuchtigkeit</span>
									<span class="md-val">{c.relative_humidity_2m ?? 0}%</span>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Daily forecast comparison -->
		<div class="compare-block">
			<span class="block-label">7-Tage-Vergleich</span>
			{#each Array.from( { length: Math.min(7, data.models[0]?.daily?.time?.length ?? 0) } ) as _, dayIdx}
				{@const dateStr = data.models[0]?.daily?.time?.[dayIdx] ?? ''}
				{@const dayLabel =
					dayIdx === 0
						? 'Heute'
						: dayIdx === 1
							? 'Morgen'
							: new Date(dateStr).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' })}
				<div class="day-compare">
					<div class="day-compare-header">{dayLabel}</div>
					<div class="day-models">
						{#each data.models as model (model.id)}
							{@const d = model.daily}
							<div class="day-model-row">
								<span class="dmr-badge" style:color={sourceColor(model.source)}>
									{model.source}
								</span>
								{#if model.error || !d}
									<span class="dmr-na">—</span>
								{:else}
									<span class="dmr-icon">{getWeatherIcon(d.weather_code?.[dayIdx] ?? 0)}</span>
									<span class="dmr-temps">
										{Math.round(d.temperature_2m_min?.[dayIdx] ?? 0)}° / {Math.round(
											d.temperature_2m_max?.[dayIdx] ?? 0
										)}°
									</span>
									<span class="dmr-precip">
										{(d.precipitation_sum?.[dayIdx] ?? 0).toFixed(1)} mm
									</span>
									{#if (d.precipitation_probability_max?.[dayIdx] ?? 0) > 0}
										<span class="dmr-prob">
											({d.precipitation_probability_max?.[dayIdx]}%)
										</span>
									{/if}
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<!-- DWD Alerts -->
		{#if data.alerts.length > 0}
			<div class="compare-block">
				<span class="block-label">DWD Wetterwarnungen</span>
				{#each data.alerts.slice(0, 5) as alert}
					<div class="alert-row">
						<span
							class="alert-sev"
							class:severe={alert.severity === 'severe' || alert.severity === 'extreme'}
						>
							{alert.severity}
						</span>
						<span class="alert-text">{alert.headline}</span>
					</div>
				{/each}
			</div>
		{/if}

		<div class="fetched-at">
			Abgerufen: {new Date(data.fetchedAt).toLocaleTimeString('de-DE')}
			<button class="refresh-btn" onclick={() => loadComparison(lat, lon)} disabled={loading}>
				Aktualisieren
			</button>
		</div>
	{/if}
</div>

<style>
	.comparison-section {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.section-header {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}
	.section-label {
		font-size: 1rem;
		font-weight: 500;
		color: var(--text-primary, #f3f4f6);
	}
	.section-sub {
		font-size: 0.8rem;
		color: var(--text-secondary, #9ca3af);
	}
	.loading,
	.error {
		padding: 24px;
		text-align: center;
		font-size: 0.85rem;
		color: var(--text-secondary, #9ca3af);
	}
	.error {
		color: #ef4444;
	}

	.compare-block {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.block-label {
		font-size: 0.8rem;
		color: var(--text-secondary, #9ca3af);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Current conditions cards */
	.model-cards {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.model-card {
		background: var(--card-bg, rgba(255, 255, 255, 0.06));
		border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
		border-radius: 12px;
		padding: 12px;
	}
	.model-card.has-error {
		opacity: 0.5;
	}
	.model-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 2px;
	}
	.model-badge {
		font-size: 0.6rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 1px 6px;
		border-radius: 4px;
		color: #0c1221;
	}
	.model-name {
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-primary, #f3f4f6);
	}
	.model-desc {
		font-size: 0.7rem;
		color: var(--text-tertiary, #6b7280);
		margin-bottom: 8px;
	}
	.model-error {
		font-size: 0.8rem;
		color: var(--text-tertiary, #6b7280);
		font-style: italic;
	}
	.model-current {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}
	.mc-icon {
		font-size: 1.5rem;
	}
	.mc-temp {
		font-size: 1.8rem;
		font-weight: 300;
		color: var(--text-primary, #f3f4f6);
	}
	.mc-condition {
		font-size: 0.85rem;
		color: var(--text-secondary, #9ca3af);
	}
	.model-details {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4px 16px;
	}
	.md-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
	}
	.md-label {
		color: var(--text-tertiary, #6b7280);
	}
	.md-val {
		color: var(--text-primary, #f3f4f6);
		font-weight: 500;
	}

	/* Daily comparison */
	.day-compare {
		background: var(--card-bg, rgba(255, 255, 255, 0.06));
		border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
		border-radius: 12px;
		padding: 10px 12px;
	}
	.day-compare-header {
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-primary, #f3f4f6);
		margin-bottom: 6px;
	}
	.day-models {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.day-model-row {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.75rem;
	}
	.dmr-badge {
		width: 55px;
		font-size: 0.65rem;
		font-weight: 600;
		flex-shrink: 0;
	}
	.dmr-icon {
		font-size: 0.9rem;
		width: 20px;
		text-align: center;
		flex-shrink: 0;
	}
	.dmr-temps {
		width: 70px;
		color: var(--text-primary, #f3f4f6);
		flex-shrink: 0;
	}
	.dmr-precip {
		color: #38bdf8;
		width: 50px;
		flex-shrink: 0;
	}
	.dmr-prob {
		color: var(--text-tertiary, #6b7280);
		font-size: 0.65rem;
	}
	.dmr-na {
		color: var(--text-tertiary, #6b7280);
	}

	/* Alerts */
	.alert-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 0;
		font-size: 0.8rem;
	}
	.alert-sev {
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		color: #f59e0b;
		width: 60px;
		flex-shrink: 0;
	}
	.alert-sev.severe {
		color: #ef4444;
	}
	.alert-text {
		color: var(--text-primary, #f3f4f6);
	}

	/* Footer */
	.fetched-at {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.7rem;
		color: var(--text-tertiary, #6b7280);
	}
	.refresh-btn {
		padding: 3px 10px;
		border-radius: 6px;
		border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
		background: none;
		color: var(--text-secondary, #9ca3af);
		font-size: 0.7rem;
		cursor: pointer;
	}
	.refresh-btn:hover {
		background: var(--card-bg-hover, rgba(255, 255, 255, 0.06));
	}
</style>
