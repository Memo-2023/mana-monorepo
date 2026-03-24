<script lang="ts">
	import type { CategoryScores } from '../data/types';

	let {
		categories,
		size = 140,
	}: {
		categories: CategoryScores;
		size?: number;
	} = $props();

	const labels = [
		{ key: 'backend', label: 'Backend' },
		{ key: 'frontend', label: 'Frontend' },
		{ key: 'database', label: 'Database' },
		{ key: 'testing', label: 'Testing' },
		{ key: 'deployment', label: 'Deploy' },
		{ key: 'documentation', label: 'Docs' },
		{ key: 'security', label: 'Security' },
		{ key: 'ux', label: 'UX' },
	] as const;

	let center = $derived(size / 2);
	let maxR = $derived(size / 2 - 24);

	function polarToXY(angle: number, radius: number) {
		const rad = ((angle - 90) * Math.PI) / 180;
		return {
			x: center + Math.cos(rad) * radius,
			y: center + Math.sin(rad) * radius,
		};
	}

	// Grid rings
	let rings = $derived(
		[0.25, 0.5, 0.75, 1].map((pct) => {
			const r = maxR * pct;
			const points = labels.map((_, i) => {
				const angle = (360 / labels.length) * i;
				return polarToXY(angle, r);
			});
			return points.map((p) => `${p.x},${p.y}`).join(' ');
		})
	);

	// Data polygon
	let dataPoints = $derived(
		labels.map((l, i) => {
			const angle = (360 / labels.length) * i;
			const value = categories[l.key] / 100;
			return polarToXY(angle, maxR * value);
		})
	);

	let dataPolygon = $derived(dataPoints.map((p) => `${p.x},${p.y}`).join(' '));

	// Axis lines
	let axes = $derived(
		labels.map((_, i) => {
			const angle = (360 / labels.length) * i;
			return polarToXY(angle, maxR);
		})
	);

	// Label positions (slightly outside)
	let labelPositions = $derived(
		labels.map((l, i) => {
			const angle = (360 / labels.length) * i;
			const pos = polarToXY(angle, maxR + 16);
			return { ...pos, label: l.label, value: categories[l.key] };
		})
	);
</script>

<svg width={size} height={size} viewBox="0 0 {size} {size}">
	<!-- Grid rings -->
	{#each rings as ring}
		<polygon points={ring} fill="none" stroke="rgba(148, 163, 184, 0.15)" stroke-width="0.5" />
	{/each}

	<!-- Axis lines -->
	{#each axes as axis}
		<line
			x1={center}
			y1={center}
			x2={axis.x}
			y2={axis.y}
			stroke="rgba(148, 163, 184, 0.1)"
			stroke-width="0.5"
		/>
	{/each}

	<!-- Data polygon -->
	<polygon
		points={dataPolygon}
		fill="rgba(59, 130, 246, 0.2)"
		stroke="rgba(59, 130, 246, 0.8)"
		stroke-width="1.5"
	/>

	<!-- Data points -->
	{#each dataPoints as point}
		<circle cx={point.x} cy={point.y} r="2.5" fill="#3b82f6" />
	{/each}

	<!-- Labels -->
	{#each labelPositions as lp}
		<text
			x={lp.x}
			y={lp.y}
			text-anchor="middle"
			dominant-baseline="central"
			font-size="8"
			font-family="system-ui, sans-serif"
			fill="#94a3b8"
		>
			{lp.label}
		</text>
	{/each}
</svg>
