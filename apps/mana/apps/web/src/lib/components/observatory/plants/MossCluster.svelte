<script lang="ts">
	import type { AppData } from '../data/types';
	import { vegetation } from '../data/colors';

	let { app, onclick }: { app: AppData; onclick?: () => void } = $props();

	let spread = $derived(10 + (app.score / 100) * 15);

	function mossPatches(seed: string) {
		const patches = [];
		let hash = 0;
		for (let i = 0; i < seed.length; i++) {
			hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
		}
		const count = 4 + (Math.abs(hash) % 5);
		for (let i = 0; i < count; i++) {
			hash = ((hash << 5) - hash + i * 17) | 0;
			patches.push({
				cx: ((hash & 0xff) / 255 - 0.5) * spread * 2,
				cy: (((hash >> 8) & 0xff) / 255 - 0.5) * spread * 0.8,
				rx: 3 + ((hash >> 16) & 0x7),
				ry: 2 + ((hash >> 20) & 0x5),
				light: i % 3 === 0,
			});
		}
		return patches;
	}

	let patches = $derived(mossPatches(app.id));
</script>

<g
	class="plant-moss"
	transform="translate({app.position.x}, {app.position.y})"
	style="cursor: pointer;"
	role="button"
	tabindex="0"
	{onclick}
	onkeydown={(e) => e.key === 'Enter' && onclick?.()}
>
	{#each patches as patch}
		<ellipse
			cx={patch.cx}
			cy={patch.cy}
			rx={patch.rx}
			ry={patch.ry}
			fill={patch.light ? vegetation.mossLight : vegetation.moss}
			opacity="0.6"
		/>
	{/each}

	<!-- Label -->
	<text
		y={spread * 0.5 + 12}
		text-anchor="middle"
		font-size="8"
		font-family="system-ui, sans-serif"
		fill="#5A7060"
		opacity="0.5"
	>
		{app.displayName}
	</text>
</g>
