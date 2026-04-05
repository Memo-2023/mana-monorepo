<script lang="ts">
	import { SCENE } from '../data/layout';

	let { hour = new Date().getHours() + new Date().getMinutes() / 60 }: { hour?: number } = $props();

	// Interpolate between time-of-day color presets
	const presets = [
		{ h: 0, top: '#0B1026', bottom: '#1A2444' }, // midnight
		{ h: 5, top: '#1A1B3A', bottom: '#2D3458' }, // pre-dawn
		{ h: 6.5, top: '#4A3060', bottom: '#E8956A' }, // sunrise
		{ h: 8, top: '#6B9FD4', bottom: '#E0E8F0' }, // morning
		{ h: 12, top: '#87CEEB', bottom: '#E0F0FF' }, // noon
		{ h: 17, top: '#87CEEB', bottom: '#E0F0FF' }, // afternoon
		{ h: 19, top: '#C45030', bottom: '#F0B860' }, // sunset
		{ h: 20.5, top: '#2C1654', bottom: '#4A3060' }, // dusk
		{ h: 22, top: '#0B1026', bottom: '#1A2444' }, // night
		{ h: 24, top: '#0B1026', bottom: '#1A2444' }, // midnight wrap
	];

	function lerp(a: string, b: string, t: number): string {
		const ah = parseInt(a.slice(1), 16);
		const bh = parseInt(b.slice(1), 16);
		const r = Math.round(((ah >> 16) & 0xff) * (1 - t) + ((bh >> 16) & 0xff) * t);
		const g = Math.round(((ah >> 8) & 0xff) * (1 - t) + ((bh >> 8) & 0xff) * t);
		const bl = Math.round((ah & 0xff) * (1 - t) + (bh & 0xff) * t);
		return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')}`;
	}

	function getSkyColors(h: number) {
		for (let i = 0; i < presets.length - 1; i++) {
			if (h >= presets[i].h && h < presets[i + 1].h) {
				const t = (h - presets[i].h) / (presets[i + 1].h - presets[i].h);
				return {
					top: lerp(presets[i].top, presets[i + 1].top, t),
					bottom: lerp(presets[i].bottom, presets[i + 1].bottom, t),
				};
			}
		}
		return { top: presets[0].top, bottom: presets[0].bottom };
	}

	let colors = $derived(getSkyColors(hour));
	let isNight = $derived(hour < 6 || hour > 20.5);
	let isDusk = $derived(hour > 18.5 && hour < 20.5);
	let gradientId = 'sky-gradient-dynamic';
</script>

<defs>
	<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
		<stop offset="0%" stop-color={colors.top} />
		<stop offset="100%" stop-color={colors.bottom} />
	</linearGradient>
</defs>

<rect x="0" y="0" width={SCENE.width} height="360" fill="url(#{gradientId})" />

<!-- Stars (visible at night) -->
{#if isNight}
	<g opacity={hour < 5 ? 0.7 : 0.4}>
		{#each Array(35) as _, i}
			{@const sx = (i * 137 + 42) % SCENE.width}
			{@const sy = (i * 89 + 17) % 250}
			{@const sr = 0.5 + (i % 3) * 0.4}
			<circle cx={sx} cy={sy} r={sr} fill="white">
				<animate
					attributeName="opacity"
					values="0.3;0.9;0.3"
					dur="{2 + (i % 4)}s"
					begin="{(i % 7) * 0.5}s"
					repeatCount="indefinite"
				/>
			</circle>
		{/each}
	</g>
{/if}

<!-- Sun glow (during golden hours) -->
{#if isDusk}
	<circle cx="1400" cy="260" r="80" fill="#F0A040" opacity="0.15">
		<animate attributeName="opacity" values="0.1;0.2;0.1" dur="4s" repeatCount="indefinite" />
	</circle>
	<circle cx="1400" cy="260" r="30" fill="#F0C860" opacity="0.3" />
{/if}
