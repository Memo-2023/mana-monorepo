<script lang="ts">
	import { SCENE } from '../data/layout';

	let { hour = 12 }: { hour?: number } = $props();

	let isNight = $derived(hour < 6 || hour > 20.5);

	// Bird flight paths (simple arcs)
	const birds = [
		{ startX: -50, startY: 180, endX: SCENE.width + 50, endY: 150, dur: 25, delay: 0 },
		{ startX: -30, startY: 220, endX: SCENE.width + 30, endY: 200, dur: 30, delay: 8 },
		{ startX: SCENE.width + 40, startY: 160, endX: -40, endY: 190, dur: 28, delay: 15 },
	];

	// Firefly positions for night mode
	const fireflies = Array.from({ length: 15 }, (_, i) => ({
		cx: ((i * 137 + 80) % (SCENE.width - 200)) + 100,
		cy: 450 + ((i * 89) % 350),
		dur: 3 + (i % 4),
		delay: (i % 6) * 0.8,
	}));

	// Dragonfly paths over lakes
	const dragonflies = [
		{ cx: 790, cy: 470, rx: 40, ry: 20, dur: 6 },
		{ cx: 340, cy: 410, rx: 25, ry: 15, dur: 5 },
		{ cx: 760, cy: 650, rx: 35, ry: 18, dur: 7 },
	];
</script>

<!-- Birds (daytime only) -->
{#if !isNight}
	{#each birds as bird}
		<g opacity="0.5">
			<!-- Simple V-shape bird -->
			<g>
				<animateMotion
					dur="{bird.dur}s"
					begin="{bird.delay}s"
					repeatCount="indefinite"
					path="M{bird.startX},{bird.startY} Q{SCENE.width / 2},{bird.startY -
						40} {bird.endX},{bird.endY}"
				/>
				<path
					d="M-5,0 L0,-2 L5,0"
					fill="none"
					stroke="#3A4A5A"
					stroke-width="1"
					stroke-linecap="round"
				/>
			</g>
		</g>
	{/each}

	<!-- Dragonflies over lakes -->
	{#each dragonflies as df}
		<g opacity="0.4">
			<circle r="1.5" fill="#60A0C0">
				<animateMotion
					dur="{df.dur}s"
					repeatCount="indefinite"
					path="M{df.cx},{df.cy} Q{df.cx + df.rx},{df.cy - df.ry} {df.cx},{df.cy -
						df.ry * 2} Q{df.cx - df.rx},{df.cy - df.ry} {df.cx},{df.cy}"
				/>
				<animate
					attributeName="opacity"
					values="0.3;0.7;0.3"
					dur="{df.dur / 2}s"
					repeatCount="indefinite"
				/>
			</circle>
		</g>
	{/each}
{/if}

<!-- Fireflies (night only) -->
{#if isNight}
	{#each fireflies as ff}
		<circle cx={ff.cx} cy={ff.cy} r="2" fill="#E8E060">
			<animate
				attributeName="opacity"
				values="0;0.8;0.8;0"
				dur="{ff.dur}s"
				begin="{ff.delay}s"
				repeatCount="indefinite"
			/>
			<animate
				attributeName="cx"
				values="{ff.cx};{ff.cx + 8};{ff.cx - 5};{ff.cx}"
				dur="{ff.dur * 2}s"
				begin="{ff.delay}s"
				repeatCount="indefinite"
			/>
			<animate
				attributeName="cy"
				values="{ff.cy};{ff.cy - 10};{ff.cy - 5};{ff.cy}"
				dur="{ff.dur * 1.5}s"
				begin="{ff.delay}s"
				repeatCount="indefinite"
			/>
		</circle>
	{/each}
{/if}

<!-- Butterflies near plants (daytime, subtle) -->
{#if !isNight}
	<g opacity="0.35">
		<g>
			<animateMotion
				dur="12s"
				repeatCount="indefinite"
				path="M730,400 Q750,380 780,395 Q800,385 790,405 Q770,410 730,400"
			/>
			<path d="M0,0 L-3,-3 L0,-1 L3,-3 Z" fill="#D080C0" />
		</g>
		<g>
			<animateMotion
				dur="10s"
				begin="4s"
				repeatCount="indefinite"
				path="M350,540 Q370,520 390,535 Q380,550 360,555 Q340,550 350,540"
			/>
			<path d="M0,0 L-3,-3 L0,-1 L3,-3 Z" fill="#E0A040" />
		</g>
	</g>
{/if}
