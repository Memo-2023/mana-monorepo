<script lang="ts">
	import type { AppData } from '../data/types';
	import { vegetation, getHealthColor } from '../data/colors';

	let { app, onclick }: { app: AppData; onclick?: () => void } = $props();

	let crownColor = $derived(getHealthColor(app.score));
	let size = $derived(0.6 + (app.score / 100) * 0.6); // 0.6 - 1.2 scale
	let isOak = $derived(app.plantType === 'oak');

	// Generate pseudo-random but deterministic crown blobs
	function crownBlobs(seed: string, count: number) {
		const blobs = [];
		let hash = 0;
		for (let i = 0; i < seed.length; i++) {
			hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
		}
		for (let i = 0; i < count; i++) {
			hash = ((hash << 5) - hash + i * 37) | 0;
			const angle = ((hash & 0xff) / 255) * Math.PI * 2;
			const dist = ((hash >> 8) & 0xff) / 255;
			blobs.push({
				cx: Math.cos(angle) * dist * (isOak ? 22 : 16),
				cy: -30 - Math.sin(angle) * dist * (isOak ? 18 : 14) - i * 3,
				rx: (isOak ? 18 : 14) + ((hash >> 16) & 0xf) - 8,
				ry: (isOak ? 14 : 11) + ((hash >> 20) & 0xf) - 8,
			});
		}
		return blobs;
	}

	let blobs = $derived(crownBlobs(app.id, isOak ? 7 : 5));
	let animDelay = $derived(`${(app.id.charCodeAt(0) % 10) * 0.3}s`);
</script>

<g
	class="plant-tree"
	transform="translate({app.position.x}, {app.position.y}) scale({size})"
	style="cursor: pointer;"
	role="button"
	tabindex="0"
	{onclick}
	onkeydown={(e) => e.key === 'Enter' && onclick?.()}
>
	<!-- Wind sway animation wrapper -->
	<g>
		<animateTransform
			attributeName="transform"
			type="rotate"
			values="-1,0,0; 1,0,0; -1,0,0"
			dur="6s"
			begin={animDelay}
			repeatCount="indefinite"
		/>

		<!-- Shadow -->
		<ellipse cx="8" cy="2" rx={isOak ? 20 : 14} ry="5" fill="black" opacity="0.1" />

		<!-- Trunk -->
		<path d="M-3,0 Q-4,-15 -2,-25 L2,-25 Q4,-15 3,0 Z" fill={vegetation.trunk} />
		{#if isOak}
			<!-- Branch left -->
			<path d="M-2,-18 Q-12,-22 -16,-28 L-14,-30 Q-10,-24 -1,-20 Z" fill={vegetation.trunkLight} />
			<!-- Branch right -->
			<path d="M2,-20 Q10,-24 15,-30 L17,-28 Q12,-22 3,-18 Z" fill={vegetation.trunkLight} />
		{/if}

		<!-- Crown (cluster of ellipses) -->
		<g>
			{#each blobs as blob, i}
				{@const lightness = i % 3 === 0 ? 15 : i % 3 === 1 ? 0 : -10}
				<ellipse
					cx={blob.cx}
					cy={blob.cy}
					rx={blob.rx}
					ry={blob.ry}
					fill={crownColor}
					opacity={0.75 + (i % 3) * 0.08}
					style="filter: brightness({100 + lightness}%)"
				/>
			{/each}

			<!-- Highlight on top -->
			<ellipse
				cx={-4}
				cy={-42}
				rx={isOak ? 10 : 8}
				ry={isOak ? 7 : 5}
				fill="white"
				opacity="0.08"
			/>
		</g>
	</g>

	<!-- Label -->
	<text
		y="18"
		text-anchor="middle"
		font-size="10"
		font-family="system-ui, sans-serif"
		font-weight="500"
		fill="#3A5040"
		opacity="0.8"
	>
		{app.displayName}
	</text>
	<text
		y="30"
		text-anchor="middle"
		font-size="9"
		font-family="system-ui, sans-serif"
		fill="#5A7060"
		opacity="0.6"
	>
		{app.score}
	</text>
</g>
