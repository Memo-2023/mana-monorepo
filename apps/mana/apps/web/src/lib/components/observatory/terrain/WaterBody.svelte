<script lang="ts">
	import type { LakeData } from '../data/types';

	let { lake }: { lake: LakeData } = $props();

	// Unique IDs for gradients
	let gradientId = $derived(`lake-gradient-${lake.id}`);
	let reflectionId = $derived(`lake-reflection-${lake.id}`);
</script>

<defs>
	<!-- Radial gradient for depth effect -->
	<radialGradient id={gradientId} cx="50%" cy="40%" r="60%">
		<stop offset="0%" stop-color={lake.color} stop-opacity={lake.clarity} />
		<stop offset="100%" stop-color={lake.colorDeep} stop-opacity={lake.clarity * 0.9} />
	</radialGradient>

	<!-- Subtle shimmer/reflection -->
	<radialGradient id={reflectionId} cx="40%" cy="30%" r="30%">
		<stop offset="0%" stop-color="white" stop-opacity="0.15" />
		<stop offset="100%" stop-color="white" stop-opacity="0" />
	</radialGradient>
</defs>

<g class="lake" data-lake={lake.id}>
	<!-- Lake body -->
	<path
		d={lake.path}
		fill="url(#{gradientId})"
		stroke="#3A8A9A"
		stroke-width="0.5"
		stroke-opacity="0.3"
	/>

	<!-- Light reflection on surface -->
	<path d={lake.path} fill="url(#{reflectionId})" />

	<!-- Animated wave lines on the surface -->
	<g opacity="0.15" stroke="white" stroke-width="0.8" fill="none">
		<path d={lake.path} stroke-dasharray="4 12" stroke-dashoffset="0">
			<animate attributeName="stroke-dashoffset" values="0;16" dur="4s" repeatCount="indefinite" />
		</path>
	</g>

	<!-- Second wave layer (offset timing) -->
	<g opacity="0.1" stroke="white" stroke-width="0.5" fill="none">
		<path d={lake.path} stroke-dasharray="3 15" stroke-dashoffset="8">
			<animate
				attributeName="stroke-dashoffset"
				values="8;26"
				dur="5.5s"
				repeatCount="indefinite"
			/>
		</path>
	</g>

	<!-- Lake label -->
	<text
		x={lake.position.x}
		y={lake.position.y}
		text-anchor="middle"
		font-size="11"
		font-family="serif"
		font-style="italic"
		fill="#1A5666"
		opacity="0.6"
	>
		{lake.label}
	</text>
</g>
