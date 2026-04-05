<script lang="ts">
	import type { AppData } from '../data/types';
	import { vegetation } from '../data/colors';

	let { app, onclick }: { app: AppData; onclick?: () => void } = $props();

	let height = $derived(25 + (app.score / 100) * 30); // 25-55px tall
	let stalkCount = $derived(3 + Math.floor(app.score / 20)); // 3-8 stalks
	let animDelay = $derived(`${(app.id.charCodeAt(0) % 8) * 0.4}s`);

	function stalks(count: number) {
		const result = [];
		for (let i = 0; i < count; i++) {
			const offset = (i - (count - 1) / 2) * 5;
			const h = height + (i % 3) * 5 - 5;
			const curve = offset * 0.5;
			result.push({ offset, h, curve, hasBulrush: i % 2 === 0 });
		}
		return result;
	}

	let stalkData = $derived(stalks(stalkCount));
</script>

<g
	class="plant-reed"
	transform="translate({app.position.x}, {app.position.y})"
	style="cursor: pointer;"
	role="button"
	tabindex="0"
	{onclick}
	onkeydown={(e) => e.key === 'Enter' && onclick?.()}
>
	<g>
		<animateTransform
			attributeName="transform"
			type="rotate"
			values="-2,0,0; 2,0,0; -2,0,0"
			dur="4s"
			begin={animDelay}
			repeatCount="indefinite"
		/>

		{#each stalkData as stalk}
			<!-- Stalk -->
			<path
				d="M{stalk.offset},0 Q{stalk.offset + stalk.curve},{-stalk.h * 0.5} {stalk.offset +
					stalk.curve * 1.2},{-stalk.h}"
				fill="none"
				stroke={vegetation.reed}
				stroke-width="2"
				stroke-linecap="round"
			/>

			<!-- Bulrush head (on some stalks) -->
			{#if stalk.hasBulrush}
				<ellipse
					cx={stalk.offset + stalk.curve * 1.2}
					cy={-stalk.h - 5}
					rx="2.5"
					ry="6"
					fill={vegetation.reedDark}
				/>
			{/if}
		{/each}

		<!-- Leaf blades at base -->
		<path
			d="M-4,0 Q-10,-15 -8,-25"
			fill="none"
			stroke={vegetation.reed}
			stroke-width="2.5"
			stroke-linecap="round"
			opacity="0.7"
		/>
		<path
			d="M4,0 Q12,-12 10,-22"
			fill="none"
			stroke={vegetation.reed}
			stroke-width="2.5"
			stroke-linecap="round"
			opacity="0.7"
		/>
	</g>

	<!-- Label -->
	<text
		y="15"
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
