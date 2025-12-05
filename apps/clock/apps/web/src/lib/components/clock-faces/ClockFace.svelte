<script lang="ts">
	import type { ClockFaceType } from '$lib/stores/clock-face.svelte';
	import ClockFaceClassic from './ClockFaceClassic.svelte';
	import ClockFaceMinimalist from './ClockFaceMinimalist.svelte';
	import ClockFaceModern from './ClockFaceModern.svelte';
	import ClockFaceElegant from './ClockFaceElegant.svelte';
	import ClockFaceSporty from './ClockFaceSporty.svelte';
	import ClockFaceVintage from './ClockFaceVintage.svelte';
	import ClockFaceNautical from './ClockFaceNautical.svelte';
	import ClockFaceIndustrial from './ClockFaceIndustrial.svelte';
	import ClockFaceBauhaus from './ClockFaceBauhaus.svelte';
	import ClockFaceRailway from './ClockFaceRailway.svelte';
	import ClockFaceLCD from './ClockFaceLCD.svelte';
	import ClockFaceFlip from './ClockFaceFlip.svelte';
	import ClockFaceMatrix from './ClockFaceMatrix.svelte';
	import ClockFaceNeon from './ClockFaceNeon.svelte';
	import ClockFaceBinary from './ClockFaceBinary.svelte';
	import ClockFaceRetro from './ClockFaceRetro.svelte';
	import ClockFaceGradient from './ClockFaceGradient.svelte';
	import ClockFaceTerminal from './ClockFaceTerminal.svelte';
	import ClockFaceTypewriter from './ClockFaceTypewriter.svelte';
	import ClockFaceRadar from './ClockFaceRadar.svelte';

	interface Props {
		type: ClockFaceType;
		hours: number;
		minutes: number;
		seconds: number;
		size?: number;
	}

	let { type, hours, minutes, seconds, size = 280 }: Props = $props();

	// Map of clock face types to components
	const clockFaceComponents = {
		classic: ClockFaceClassic,
		minimalist: ClockFaceMinimalist,
		modern: ClockFaceModern,
		elegant: ClockFaceElegant,
		sporty: ClockFaceSporty,
		vintage: ClockFaceVintage,
		nautical: ClockFaceNautical,
		industrial: ClockFaceIndustrial,
		bauhaus: ClockFaceBauhaus,
		railway: ClockFaceRailway,
		lcd: ClockFaceLCD,
		flip: ClockFaceFlip,
		matrix: ClockFaceMatrix,
		neon: ClockFaceNeon,
		binary: ClockFaceBinary,
		retro: ClockFaceRetro,
		gradient: ClockFaceGradient,
		terminal: ClockFaceTerminal,
		typewriter: ClockFaceTypewriter,
		radar: ClockFaceRadar,
	} as const;

	let ClockComponent = $derived(clockFaceComponents[type] || ClockFaceModern);
</script>

<ClockComponent {hours} {minutes} {seconds} {size} />
