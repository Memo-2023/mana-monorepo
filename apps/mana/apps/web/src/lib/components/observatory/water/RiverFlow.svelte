<script lang="ts">
	import type { RiverData } from '../data/types';
	import { water } from '../data/colors';

	let { river }: { river: RiverData } = $props();

	let duration = $derived(`${3 + (1 - river.flowSpeed) * 4}s`);
	let dashLength = $derived(river.width * 1.5);
	let gapLength = $derived(river.width * 3);
</script>

<g class="river" data-river={river.id}>
	<!-- River bed (wider, darker) -->
	<path
		d={river.path}
		fill="none"
		stroke={water.deep}
		stroke-width={river.width + 4}
		stroke-linecap="round"
		stroke-linejoin="round"
		opacity="0.3"
	/>

	<!-- River water -->
	<path
		d={river.path}
		fill="none"
		stroke={water.river}
		stroke-width={river.width}
		stroke-linecap="round"
		stroke-linejoin="round"
		opacity="0.7"
	/>

	<!-- Animated flow particles -->
	<path
		d={river.path}
		fill="none"
		stroke={water.highlight}
		stroke-width={river.width * 0.4}
		stroke-linecap="round"
		stroke-dasharray="{dashLength} {gapLength}"
		opacity="0.4"
	>
		<animate
			attributeName="stroke-dashoffset"
			values="{dashLength + gapLength};0"
			dur={duration}
			repeatCount="indefinite"
		/>
	</path>

	<!-- Surface shimmer -->
	<path
		d={river.path}
		fill="none"
		stroke="white"
		stroke-width={river.width * 0.2}
		stroke-dasharray="2 {gapLength * 1.5}"
		opacity="0.2"
	>
		<animate
			attributeName="stroke-dashoffset"
			values="{gapLength * 1.5 + 2};0"
			dur={duration}
			repeatCount="indefinite"
		/>
	</path>
</g>
