<script lang="ts">
	import { POPULAR_TIMEZONES } from '@clock/shared';

	// Props
	interface Props {
		selectedCities?: string[];
		onCityClick?: (timezone: string, cityName: string) => void;
		currentTime?: Date;
	}

	let { selectedCities = [], onCityClick, currentTime = new Date() }: Props = $props();

	// State
	let hoveredCity: (typeof POPULAR_TIMEZONES)[number] | null = $state(null);

	// Map dimensions
	const width = 900;
	const height = 450;

	// Convert lat/lng to x/y coordinates (simple equirectangular projection)
	function latLngToXY(lat: number, lng: number): { x: number; y: number } {
		const x = ((lng + 180) / 360) * width;
		const y = ((90 - lat) / 180) * height;
		return { x, y };
	}

	// Get time for a timezone
	function getTimeForTimezone(timezone: string): string {
		try {
			return new Intl.DateTimeFormat('de-DE', {
				timeZone: timezone,
				hour: '2-digit',
				minute: '2-digit',
				hour12: false,
			}).format(currentTime);
		} catch {
			return '--:--';
		}
	}

	// Get timezone offset relative to local time
	function getTimezoneOffset(timezone: string): string {
		try {
			// Get local offset in minutes
			const localOffset = currentTime.getTimezoneOffset();

			// Get target timezone time
			const targetFormatter = new Intl.DateTimeFormat('en-US', {
				timeZone: timezone,
				hour: 'numeric',
				minute: 'numeric',
				hour12: false,
			});
			const localFormatter = new Intl.DateTimeFormat('en-US', {
				hour: 'numeric',
				minute: 'numeric',
				hour12: false,
			});

			// Parse times to calculate difference
			const targetParts = targetFormatter.formatToParts(currentTime);
			const localParts = localFormatter.formatToParts(currentTime);

			const targetHour = parseInt(targetParts.find((p) => p.type === 'hour')?.value || '0');
			const targetMin = parseInt(targetParts.find((p) => p.type === 'minute')?.value || '0');
			const localHour = parseInt(localParts.find((p) => p.type === 'hour')?.value || '0');
			const localMin = parseInt(localParts.find((p) => p.type === 'minute')?.value || '0');

			let diffMinutes = targetHour * 60 + targetMin - (localHour * 60 + localMin);

			// Handle day boundary
			if (diffMinutes > 720) diffMinutes -= 1440;
			if (diffMinutes < -720) diffMinutes += 1440;

			const diffHours = Math.round(diffMinutes / 60);

			if (diffHours === 0) {
				return 'Gleiche Zeit';
			} else if (diffHours > 0) {
				return `+${diffHours}h`;
			} else {
				return `${diffHours}h`;
			}
		} catch {
			return '';
		}
	}

	// Get date for timezone
	function getDateForTimezone(timezone: string): string {
		try {
			return new Intl.DateTimeFormat('de-DE', {
				timeZone: timezone,
				weekday: 'short',
				day: 'numeric',
				month: 'short',
			}).format(currentTime);
		} catch {
			return '';
		}
	}

	// Check if location is in daylight (simplified)
	function isDaytime(lat: number, lng: number): boolean {
		const hours = currentTime.getUTCHours() + currentTime.getUTCMinutes() / 60;
		const solarNoon = 12;
		const sunLng = ((solarNoon - hours) * 15) % 360;

		// Simplified day/night calculation
		let lngDiff = Math.abs(lng - sunLng);
		if (lngDiff > 180) lngDiff = 360 - lngDiff;

		return lngDiff < 90;
	}

	// Calculate terminator line points
	function getTerminatorPath(): string {
		const hours = currentTime.getUTCHours() + currentTime.getUTCMinutes() / 60;
		const dayOfYear = Math.floor(
			(currentTime.getTime() - new Date(currentTime.getFullYear(), 0, 0).getTime()) /
				(1000 * 60 * 60 * 24)
		);
		const declination = -23.45 * Math.cos((360 / 365) * (dayOfYear + 10) * (Math.PI / 180));
		const sunLng = -((hours - 12) * 15);

		const points: string[] = [];

		// Calculate terminator for each latitude
		for (let lat = 90; lat >= -90; lat -= 2) {
			const latRad = (lat * Math.PI) / 180;
			const decRad = (declination * Math.PI) / 180;

			// Hour angle at terminator
			const cosH = -Math.tan(latRad) * Math.tan(decRad);

			let lng: number;
			if (cosH >= 1) {
				// Polar night
				lng = sunLng + 180;
			} else if (cosH <= -1) {
				// Polar day
				lng = sunLng;
			} else {
				const H = (Math.acos(cosH) * 180) / Math.PI;
				lng = sunLng + H;
			}

			// Normalize longitude
			lng = ((lng + 180) % 360) - 180;
			if (lng < -180) lng += 360;

			const { x, y } = latLngToXY(lat, lng);
			points.push(`${x},${y}`);
		}

		// Close the path on the night side
		points.push(`${width},${height}`);
		points.push(`${width},0`);
		points.push(`${points[0].split(',')[0]},0`);

		return `M${points.join(' L')} Z`;
	}

	function handleCityClick(city: (typeof POPULAR_TIMEZONES)[number]) {
		if (onCityClick) {
			onCityClick(city.timezone, city.city);
		}
	}
</script>

<div class="world-map-container">
	<svg viewBox="0 0 {width} {height}" class="world-map-svg">
		<!-- Ocean background -->
		<rect x="0" y="0" {width} {height} class="ocean-bg" />

		<!-- Grid lines -->
		{#each [-60, -30, 0, 30, 60] as lat}
			{@const y = ((90 - lat) / 180) * height}
			<line x1="0" y1={y} x2={width} y2={y} class="grid-line" />
		{/each}
		{#each [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180] as lng}
			{@const x = ((lng + 180) / 360) * width}
			<line x1={x} y1="0" x2={x} y2={height} class="grid-line" />
		{/each}

		<!-- Simplified continent outlines -->
		<g class="continents">
			<!-- North America -->
			<path
				d="M 50,50 L 180,50 L 200,80 L 220,100 L 200,150 L 160,180 L 120,190 L 80,180 L 60,150 L 40,100 Z"
			/>
			<!-- South America -->
			<path
				d="M 160,200 L 200,210 L 210,250 L 200,320 L 170,380 L 150,390 L 140,350 L 150,280 L 140,220 Z"
			/>
			<!-- Europe -->
			<path d="M 420,60 L 480,50 L 520,70 L 500,100 L 480,120 L 440,130 L 420,110 L 400,80 Z" />
			<!-- Africa -->
			<path
				d="M 420,150 L 500,140 L 540,180 L 550,250 L 520,330 L 470,350 L 420,320 L 400,250 L 410,180 Z"
			/>
			<!-- Asia -->
			<path
				d="M 500,40 L 700,30 L 800,60 L 820,120 L 780,180 L 700,200 L 620,190 L 560,160 L 520,120 L 500,80 Z"
			/>
			<!-- Australia -->
			<path d="M 720,280 L 800,270 L 840,300 L 830,350 L 780,370 L 720,350 L 700,310 Z" />
			<!-- Indonesia/Southeast Asia -->
			<path d="M 680,200 L 750,190 L 800,210 L 780,240 L 720,250 L 680,230 Z" />
		</g>

		<!-- Night overlay (simplified) -->
		<rect
			x={(() => {
				const hours = currentTime.getUTCHours() + currentTime.getUTCMinutes() / 60;
				const sunLng = -((hours - 12) * 15);
				const nightCenterX = (((sunLng + 180 + 180) % 360) / 360) * width;
				return nightCenterX - width / 2;
			})()}
			y="0"
			width={width / 2}
			{height}
			class="night-overlay"
		/>

		<!-- City markers -->
		{#each POPULAR_TIMEZONES as city}
			{@const pos = latLngToXY(city.lat, city.lng)}
			{@const isSelected = selectedCities.includes(city.timezone)}
			{@const isDay = isDaytime(city.lat, city.lng)}
			{@const isHovered = hoveredCity?.timezone === city.timezone}
			<g
				class="city-marker"
				class:hovered={isHovered}
				transform="translate({pos.x}, {pos.y})"
				role="button"
				tabindex="0"
				onclick={() => handleCityClick(city)}
				onkeydown={(e) => e.key === 'Enter' && handleCityClick(city)}
				onpointerenter={() => (hoveredCity = city)}
				onpointerleave={() => (hoveredCity = null)}
			>
				<!-- Larger hit area (invisible) -->
				<circle r="15" fill="transparent" class="hit-area" />
				{#if isSelected}
					<circle r="12" fill="hsl(var(--color-primary) / 0.25)" class="city-glow" />
				{/if}
				{#if isHovered}
					<circle r="10" fill="hsl(var(--color-foreground) / 0.15)" />
				{/if}
				<circle
					r={isSelected ? 6 : isHovered ? 5 : 4}
					fill={isSelected ? 'hsl(var(--color-primary))' : isDay ? '#fbbf24' : '#818cf8'}
					stroke="hsl(var(--color-background))"
					stroke-width={isHovered ? 2 : 1.5}
				/>
			</g>
		{/each}
	</svg>

	<!-- Tooltip -->
	{#if hoveredCity}
		{@const pos = latLngToXY(hoveredCity.lat, hoveredCity.lng)}
		{@const offset = getTimezoneOffset(hoveredCity.timezone)}
		{@const isDay = isDaytime(hoveredCity.lat, hoveredCity.lng)}
		<div
			class="map-tooltip"
			style="left: {(pos.x / width) * 100}%; top: {(pos.y / height) * 100}%;"
		>
			<div class="tooltip-header">
				<span class="tooltip-city">{hoveredCity.city}</span>
				<span class="tooltip-indicator" class:day={isDay}>{isDay ? '☀️' : '🌙'}</span>
			</div>
			<div class="tooltip-time">{getTimeForTimezone(hoveredCity.timezone)}</div>
			<div class="tooltip-details">
				<span class="tooltip-date">{getDateForTimezone(hoveredCity.timezone)}</span>
				<span class="tooltip-offset" class:same={offset === 'Gleiche Zeit'}>{offset}</span>
			</div>
		</div>
	{/if}

	<!-- Legend -->
	<div class="map-legend">
		<div class="legend-item">
			<span class="legend-dot day"></span>
			<span>Tag</span>
		</div>
		<div class="legend-item">
			<span class="legend-dot night"></span>
			<span>Nacht</span>
		</div>
		<div class="legend-item">
			<span class="legend-dot selected"></span>
			<span>Ausgewählt</span>
		</div>
	</div>
</div>

<style>
	.world-map-container {
		position: relative;
		width: 100%;
		background: hsl(var(--color-card));
		overflow: hidden;
	}

	.world-map-svg {
		display: block;
		width: 100%;
		height: auto;
	}

	.city-marker {
		cursor: pointer;
	}

	.city-marker .hit-area {
		cursor: pointer;
	}

	.city-marker:focus {
		outline: none;
	}

	.city-marker:focus circle:not(.hit-area) {
		stroke: hsl(var(--color-primary));
		stroke-width: 2;
	}

	.city-glow {
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.6;
		}
		50% {
			opacity: 0.3;
		}
	}

	.night-overlay {
		pointer-events: none;
	}

	.map-tooltip {
		position: absolute;
		background: hsl(var(--color-popover));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		padding: 0.625rem 0.875rem;
		pointer-events: none;
		transform: translate(-50%, calc(-100% - 20px));
		z-index: 20;
		box-shadow: 0 4px 16px rgb(0 0 0 / 0.2);
		white-space: nowrap;
		min-width: 120px;
	}

	.tooltip-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.tooltip-city {
		font-weight: 600;
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
	}

	.tooltip-indicator {
		font-size: 0.875rem;
	}

	.tooltip-time {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-primary));
		font-variant-numeric: tabular-nums;
		line-height: 1.2;
	}

	.tooltip-details {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-top: 0.25rem;
		padding-top: 0.375rem;
		border-top: 1px solid hsl(var(--color-border) / 0.5);
	}

	.tooltip-date {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.tooltip-offset {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.tooltip-offset.same {
		color: hsl(var(--color-muted-foreground));
		background: hsl(var(--color-muted) / 0.5);
	}

	.map-legend {
		position: absolute;
		bottom: 0.5rem;
		right: 0.5rem;
		display: flex;
		gap: 0.75rem;
		background: hsl(var(--color-card) / 0.9);
		padding: 0.375rem 0.625rem;
		border-radius: 0.375rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.legend-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.legend-dot.day {
		background: #fbbf24;
	}

	.legend-dot.night {
		background: #818cf8;
	}

	.legend-dot.selected {
		background: hsl(var(--color-primary));
	}
</style>
