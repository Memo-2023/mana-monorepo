<script lang="ts">
	import type { AppData, CategoryScores } from '../data/types';
	import RadarChart from './RadarChart.svelte';

	let { apps }: { apps: AppData[] } = $props();

	let selected = $state<string[]>([]);

	const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'];

	const statusColors: Record<string, string> = {
		mature: '#34d399',
		production: '#60a5fa',
		beta: '#fbbf24',
		alpha: '#f97316',
	};

	function toggle(id: string) {
		if (selected.includes(id)) {
			selected = selected.filter((s) => s !== id);
		} else if (selected.length < 4) {
			selected = [...selected, id];
		}
	}

	let selectedApps = $derived(selected.map((id) => apps.find((a) => a.id === id)!).filter(Boolean));

	const categoryKeys: (keyof CategoryScores)[] = [
		'backend',
		'frontend',
		'database',
		'testing',
		'deployment',
		'documentation',
		'security',
		'ux',
	];

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

	const size = 280;
	let center = $derived(size / 2);
	let maxR = $derived(size / 2 - 30);

	function polarToXY(angle: number, radius: number) {
		const rad = ((angle - 90) * Math.PI) / 180;
		return { x: center + Math.cos(rad) * radius, y: center + Math.sin(rad) * radius };
	}

	let rings = $derived(
		[0.25, 0.5, 0.75, 1].map((pct) => {
			const r = maxR * pct;
			return labels
				.map((_, i) => {
					const angle = (360 / labels.length) * i;
					return polarToXY(angle, r);
				})
				.map((p) => `${p.x},${p.y}`)
				.join(' ');
		})
	);

	let axes = $derived(labels.map((_, i) => polarToXY((360 / labels.length) * i, maxR)));

	let labelPositions = $derived(
		labels.map((l, i) => {
			const pos = polarToXY((360 / labels.length) * i, maxR + 20);
			return { ...pos, label: l.label };
		})
	);

	function appPolygon(app: AppData): string {
		return labels
			.map((l, i) => {
				const angle = (360 / labels.length) * i;
				const value = app.categories[l.key] / 100;
				const p = polarToXY(angle, maxR * value);
				return `${p.x},${p.y}`;
			})
			.join(' ');
	}
</script>

<div class="compare-view">
	<!-- App selector -->
	<div class="selector">
		<p class="selector-label">Apps auswahlen (max. 4):</p>
		<div class="selector-chips">
			{#each apps as app (app.id)}
				<button
					type="button"
					class="chip"
					class:active={selected.includes(app.id)}
					style={selected.includes(app.id)
						? `border-color: ${colors[selected.indexOf(app.id)]}; color: ${colors[selected.indexOf(app.id)]}`
						: ''}
					onclick={() => toggle(app.id)}
				>
					<span class="chip-dot" style="background: {statusColors[app.status]}"></span>
					{app.displayName}
					<span class="chip-score">{app.score}</span>
				</button>
			{/each}
		</div>
	</div>

	{#if selectedApps.length >= 2}
		<div class="compare-content">
			<!-- Overlaid radar chart -->
			<div class="radar-section">
				<svg width={size} height={size} viewBox="0 0 {size} {size}">
					{#each rings as ring}
						<polygon
							points={ring}
							fill="none"
							stroke="rgba(148, 163, 184, 0.12)"
							stroke-width="0.5"
						/>
					{/each}
					{#each axes as axis}
						<line
							x1={center}
							y1={center}
							x2={axis.x}
							y2={axis.y}
							stroke="rgba(148, 163, 184, 0.08)"
							stroke-width="0.5"
						/>
					{/each}

					{#each selectedApps as app, i (app.id)}
						<polygon
							points={appPolygon(app)}
							fill="{colors[i]}20"
							stroke={colors[i]}
							stroke-width="2"
							opacity="0.8"
						/>
					{/each}

					{#each labelPositions as lp}
						<text
							x={lp.x}
							y={lp.y}
							text-anchor="middle"
							dominant-baseline="central"
							font-size="9"
							font-family="system-ui, sans-serif"
							fill="#94a3b8"
						>
							{lp.label}
						</text>
					{/each}
				</svg>

				<!-- Legend -->
				<div class="radar-legend">
					{#each selectedApps as app, i (app.id)}
						<span class="legend-item">
							<span class="legend-color" style="background: {colors[i]}"></span>
							{app.displayName} ({app.score})
						</span>
					{/each}
				</div>
			</div>

			<!-- Category comparison bars -->
			<div class="bars-section">
				{#each categoryKeys as cat}
					<div class="bar-group">
						<span class="bar-label">{cat}</span>
						<div class="bar-rows">
							{#each selectedApps as app, i (app.id)}
								<div class="bar-row">
									<div class="bar-track">
										<div
											class="bar-fill"
											style="width: {app.categories[cat]}%; background: {colors[i]}"
										></div>
									</div>
									<span class="bar-value">{app.categories[cat]}</span>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="compare-placeholder">
			<p>Wahle mindestens 2 Apps zum Vergleichen</p>
		</div>
	{/if}
</div>

<style>
	.compare-view {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.selector-label {
		font-size: 12px;
		color: #94a3b8;
		margin: 0 0 10px 0;
	}

	.selector-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 5px 10px;
		border-radius: 16px;
		border: 1px solid rgba(148, 163, 184, 0.15);
		background: rgba(15, 23, 42, 0.4);
		color: #94a3b8;
		font-size: 12px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.chip:hover {
		border-color: rgba(148, 163, 184, 0.3);
		color: #cbd5e1;
	}

	.chip.active {
		background: rgba(59, 130, 246, 0.1);
	}

	.chip-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
	}

	.chip-score {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.compare-content {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 32px;
		align-items: start;
	}

	@media (max-width: 768px) {
		.compare-content {
			grid-template-columns: 1fr;
		}
	}

	.radar-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	.radar-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		justify-content: center;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 11px;
		color: #cbd5e1;
	}

	.legend-color {
		width: 10px;
		height: 10px;
		border-radius: 3px;
	}

	.bars-section {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.bar-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.bar-label {
		font-size: 10px;
		color: #64748b;
		text-transform: capitalize;
		font-weight: 600;
	}

	.bar-rows {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.bar-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.bar-track {
		flex: 1;
		height: 6px;
		background: rgba(148, 163, 184, 0.08);
		border-radius: 3px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		border-radius: 3px;
		transition: width 0.4s ease;
	}

	.bar-value {
		font-size: 10px;
		color: #94a3b8;
		width: 22px;
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}

	.compare-placeholder {
		text-align: center;
		padding: 48px 0;
		color: #64748b;
		font-size: 14px;
	}
</style>
