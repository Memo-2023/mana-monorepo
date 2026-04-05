<script lang="ts">
	import { mountains } from '../data/colors';
	import { SCENE, MOUNTAIN_PATHS } from '../data/layout';
	import Sky from '../atmosphere/Sky.svelte';

	let { hour = new Date().getHours() + new Date().getMinutes() / 60 }: { hour?: number } = $props();
</script>

<defs>
	<!-- Subtle haze filter -->
	<filter id="mountain-haze">
		<feGaussianBlur stdDeviation="1.5" />
	</filter>
	<filter id="mountain-haze-light">
		<feGaussianBlur stdDeviation="0.8" />
	</filter>
</defs>

<!-- Dynamic sky -->
<Sky {hour} />

<!-- Clouds (subtle, decorative) -->
<g opacity="0.35">
	<ellipse cx="300" cy="120" rx="120" ry="30" fill="white" />
	<ellipse cx="340" cy="115" rx="80" ry="25" fill="white" />
	<ellipse cx="260" cy="118" rx="60" ry="20" fill="white" />

	<ellipse cx="1100" cy="90" rx="100" ry="25" fill="white" />
	<ellipse cx="1140" cy="85" rx="70" ry="22" fill="white" />

	<ellipse cx="700" cy="150" rx="90" ry="22" fill="white" />
	<ellipse cx="740" cy="145" rx="65" ry="18" fill="white" />
</g>

<!-- Mountain layers (back to front) -->
<g>
	<!-- Far mountains (lightest, most hazy) -->
	<path d={MOUNTAIN_PATHS.far} fill={mountains.far} opacity="0.6" filter="url(#mountain-haze)" />
	<!-- Snow caps on far mountains -->
	<path
		d="M740,165 Q755,155 770,168 Q782,158 795,170 L790,180 Q775,172 760,180 Q748,172 740,178 Z"
		fill={mountains.snow}
		opacity="0.5"
		filter="url(#mountain-haze)"
	/>

	<!-- Mid mountains -->
	<path
		d={MOUNTAIN_PATHS.mid}
		fill={mountains.mid}
		opacity="0.75"
		filter="url(#mountain-haze-light)"
	/>

	<!-- Near mountains (darkest, sharpest) -->
	<path d={MOUNTAIN_PATHS.near} fill={mountains.near} opacity="0.85" />
</g>

<!-- Tree line on near mountains (tiny triangles) -->
<g opacity="0.4" fill="#3A6050">
	{#each Array(60) as _, i}
		{@const x = i * 28 + 10}
		{@const baseY = 335 + Math.sin(i * 0.8) * 15}
		{@const h = 12 + Math.sin(i * 1.3) * 5}
		<polygon points="{x},{baseY} {x + 4},{baseY - h} {x + 8},{baseY}" />
	{/each}
</g>
