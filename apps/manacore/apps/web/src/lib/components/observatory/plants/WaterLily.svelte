<script lang="ts">
	import type { AppData } from '../data/types';
	import { vegetation } from '../data/colors';

	let { app, onclick }: { app: AppData; onclick?: () => void } = $props();

	let padSize = $derived(8 + (app.score / 100) * 10); // 8-18px radius
	let petalCount = $derived(app.score >= 70 ? 8 : app.score >= 40 ? 6 : 4);
	let bloomAmount = $derived(app.score / 100); // 0-1 how open the flower is
	let animDelay = $derived(`${(app.id.charCodeAt(0) % 6) * 0.5}s`);

	function petals(count: number) {
		const result = [];
		for (let i = 0; i < count; i++) {
			const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
			result.push({ angle, i });
		}
		return result;
	}

	let petalData = $derived(petals(petalCount));
</script>

<g
	class="plant-lily"
	transform="translate({app.position.x}, {app.position.y})"
	style="cursor: pointer;"
	role="button"
	tabindex="0"
	{onclick}
	onkeydown={(e) => e.key === 'Enter' && onclick?.()}
>
	<!-- Gentle bob animation -->
	<g>
		<animateTransform
			attributeName="transform"
			type="translate"
			values="0,0; 0,-1.5; 0,0; 0,1; 0,0"
			dur="5s"
			begin={animDelay}
			repeatCount="indefinite"
		/>

		<!-- Shadow under pad -->
		<ellipse cx="1" cy="2" rx={padSize + 1} ry={padSize * 0.5 + 1} fill="black" opacity="0.1" />

		<!-- Lily pad (circle with notch) -->
		<path
			d="M{padSize},0
				A{padSize},{padSize * 0.55} 0 1,0 {-padSize},0
				A{padSize},{padSize * 0.55} 0 1,0 {padSize},0
				L0,0 L{padSize * 0.3},{-padSize * 0.15} Z"
			fill={vegetation.lilyPad}
			opacity="0.85"
		/>
		<!-- Pad vein -->
		<line
			x1="0"
			y1="0"
			x2={-padSize * 0.6}
			y2={padSize * 0.15}
			stroke="#3A7040"
			stroke-width="0.5"
			opacity="0.4"
		/>
		<line
			x1="0"
			y1="0"
			x2={-padSize * 0.5}
			y2={-padSize * 0.2}
			stroke="#3A7040"
			stroke-width="0.5"
			opacity="0.4"
		/>

		<!-- Flower (if score > 20) -->
		{#if app.score > 20}
			<g transform="translate({-padSize * 0.2}, {-padSize * 0.1})">
				<!-- Petals -->
				{#each petalData as petal}
					{@const px = Math.cos(petal.angle) * 5 * bloomAmount}
					{@const py = Math.sin(petal.angle) * 3 * bloomAmount}
					<ellipse
						cx={px}
						cy={py - 2}
						rx={3.5 * bloomAmount + 1}
						ry={2 * bloomAmount + 0.5}
						fill={vegetation.lilyFlower}
						opacity={0.7 + bloomAmount * 0.3}
						transform="rotate({(petal.angle * 180) / Math.PI}, {px}, {py - 2})"
					/>
				{/each}

				<!-- Center -->
				<circle
					cx="0"
					cy="-2"
					r={2 * bloomAmount + 0.5}
					fill={vegetation.lilyFlowerCenter}
					opacity="0.9"
				/>
			</g>
		{/if}
	</g>

	<!-- Label -->
	<text
		y={padSize * 0.55 + 14}
		text-anchor="middle"
		font-size="9"
		font-family="system-ui, sans-serif"
		font-weight="500"
		fill="#3A5040"
		opacity="0.7"
	>
		{app.displayName}
	</text>
</g>
