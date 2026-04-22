<script lang="ts">
	/**
	 * WorldMap - Interactive world map component for world clock
	 */
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { POPULAR_TIMEZONES } from '../../types';

	interface Props {
		selectedTimezones?: string[];
		onCityClick?: (timezone: string, cityName: string) => void;
	}

	let { selectedTimezones = [], onCityClick }: Props = $props();

	let mapContainer: HTMLDivElement;
	let mapLoaded = $state(false);

	// Get cities from popular timezones
	const cities = POPULAR_TIMEZONES.map((tz) => ({
		timezone: tz.timezone,
		city: tz.city,
		lat: tz.lat,
		lng: tz.lng,
	}));

	function handleCityClick(timezone: string, cityName: string) {
		onCityClick?.(timezone, cityName);
	}

	onMount(() => {
		if (browser) {
			mapLoaded = true;
		}
	});
</script>

<div class="world-map" bind:this={mapContainer}>
	{#if mapLoaded}
		<div class="map-placeholder">
			<svg viewBox="0 0 800 400" class="map-svg">
				<!-- Simple world outline -->
				<rect x="0" y="0" width="800" height="400" fill="hsl(var(--color-muted))" opacity="0.3" />

				<!-- City markers -->
				{#each cities as city}
					{@const x = ((city.lng + 180) / 360) * 800}
					{@const y = ((90 - city.lat) / 180) * 400}
					{@const isSelected = selectedTimezones.includes(city.timezone)}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- SVG group with click handler - no semantic alternative for inline SVG -->
					<g
						class="city-marker"
						onclick={() => handleCityClick(city.timezone, city.city)}
						role="button"
						tabindex="0"
						onkeydown={(e) => e.key === 'Enter' && handleCityClick(city.timezone, city.city)}
					>
						<circle
							cx={x}
							cy={y}
							r={isSelected ? 8 : 5}
							fill={isSelected ? 'hsl(var(--color-primary))' : 'hsl(var(--color-muted-foreground))'}
							class="cursor-pointer hover:opacity-80 transition-opacity"
						/>
						{#if isSelected}
							<text
								{x}
								y={y - 12}
								text-anchor="middle"
								font-size="10"
								fill="hsl(var(--color-foreground))"
								class="pointer-events-none"
							>
								{city.city}
							</text>
						{/if}
					</g>
				{/each}
			</svg>
		</div>
	{:else}
		<div class="map-loading">
			<span class="text-muted-foreground">Karte wird geladen...</span>
		</div>
	{/if}
</div>

<style>
	.world-map {
		width: 100%;
		height: 300px;
		background: hsl(var(--color-card));
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid hsl(var(--color-border));
	}

	.map-placeholder {
		width: 100%;
		height: 100%;
	}

	.map-svg {
		width: 100%;
		height: 100%;
	}

	.city-marker {
		cursor: pointer;
	}

	.map-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}
</style>
