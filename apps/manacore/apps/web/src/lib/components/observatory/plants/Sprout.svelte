<script lang="ts">
	import type { AppData } from '../data/types';
	import { vegetation } from '../data/colors';

	let { app, onclick }: { app: AppData; onclick?: () => void } = $props();

	let height = $derived(12 + (app.score / 100) * 18); // 12-30px
	let animDelay = $derived(`${(app.id.charCodeAt(0) % 5) * 0.6}s`);
</script>

<g
	class="plant-sprout"
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
			values="-3,0,0; 3,0,0; -3,0,0"
			dur="3.5s"
			begin={animDelay}
			repeatCount="indefinite"
		/>

		<!-- Support stake -->
		<line
			x1="3"
			y1="2"
			x2="3"
			y2={-height - 5}
			stroke={vegetation.sproutStake}
			stroke-width="1.5"
			stroke-linecap="round"
		/>

		<!-- Stem -->
		<path
			d="M0,0 Q-1,{-height * 0.5} 0,{-height}"
			fill="none"
			stroke={vegetation.sprout}
			stroke-width="2"
			stroke-linecap="round"
		/>

		<!-- Two small leaves -->
		<path
			d="M0,{-height * 0.6} Q-8,{-height * 0.7} -6,{-height * 0.85}"
			fill={vegetation.sprout}
			stroke={vegetation.sprout}
			stroke-width="1"
			opacity="0.8"
		/>
		<path
			d="M0,{-height * 0.75} Q6,{-height * 0.8} 5,{-height * 0.95}"
			fill={vegetation.sprout}
			stroke={vegetation.sprout}
			stroke-width="1"
			opacity="0.8"
		/>

		<!-- Tiny leaf at top -->
		<ellipse cx="0" cy={-height - 3} rx="3" ry="4" fill={vegetation.sprout} opacity="0.9" />
	</g>

	<!-- Label -->
	<text
		y="14"
		text-anchor="middle"
		font-size="8"
		font-family="system-ui, sans-serif"
		fill="#5A7060"
		opacity="0.6"
	>
		{app.displayName}
	</text>
</g>
