<script lang="ts">
	import type { RiverData } from '../data/types';
	import { LAKES } from '../data/layout';
	import { water } from '../data/colors';

	let { river }: { river: RiverData } = $props();

	function lakeName(id: string): string {
		const lake = LAKES.find((l) => l.id === id);
		return lake?.label || id;
	}

	let fromLabel = $derived(river.from === 'source' ? 'User Requests' : lakeName(river.from));
	let toLabel = $derived(lakeName(river.to));
	let speedLabel = $derived(
		river.flowSpeed >= 0.8 ? 'Schnell' : river.flowSpeed >= 0.5 ? 'Mittel' : 'Ruhig'
	);
	let speedColor = $derived(
		river.flowSpeed >= 0.8 ? '#34d399' : river.flowSpeed >= 0.5 ? '#fbbf24' : '#60a5fa'
	);
</script>

<div class="river-card">
	<!-- SVG preview -->
	<div class="river-preview">
		<svg width="240" height="60" viewBox="0 0 240 60" xmlns="http://www.w3.org/2000/svg">
			<!-- River line -->
			<path
				d="M20,30 Q80,15 120,30 Q160,45 220,30"
				fill="none"
				stroke={water.river}
				stroke-width={river.width * 0.8}
				stroke-linecap="round"
				opacity="0.7"
			/>
			<!-- Flow particles -->
			<path
				d="M20,30 Q80,15 120,30 Q160,45 220,30"
				fill="none"
				stroke={water.highlight}
				stroke-width={river.width * 0.3}
				stroke-linecap="round"
				stroke-dasharray="8 16"
				opacity="0.5"
			>
				<animate
					attributeName="stroke-dashoffset"
					values="24;0"
					dur="{2 + (1 - river.flowSpeed) * 3}s"
					repeatCount="indefinite"
				/>
			</path>
			<!-- Endpoints -->
			<circle cx="20" cy="30" r="4" fill={water.deep} />
			<circle cx="220" cy="30" r="4" fill={water.deep} />
			<!-- Arrow -->
			<path
				d="M210,26 L220,30 L210,34"
				fill="none"
				stroke={water.highlight}
				stroke-width="1.5"
				opacity="0.6"
			/>
		</svg>
	</div>

	<div class="river-info">
		<div class="river-flow">
			<span class="river-from">{fromLabel}</span>
			<span class="river-arrow">→</span>
			<span class="river-to">{toLabel}</span>
		</div>
		<div class="river-stats">
			<span class="river-stat">
				<span class="stat-label">Geschwindigkeit</span>
				<span class="stat-value" style="color: {speedColor}">{speedLabel}</span>
			</span>
			<span class="river-stat">
				<span class="stat-label">Breite</span>
				<span class="stat-value">{river.width}px</span>
			</span>
		</div>
	</div>
</div>

<style>
	.river-card {
		flex-shrink: 0;
		width: 260px;
		background: rgba(15, 23, 42, 0.6);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(148, 163, 184, 0.1);
		border-radius: 12px;
		overflow: hidden;
		transition:
			transform 0.2s,
			border-color 0.2s;
	}

	.river-card:hover {
		transform: translateY(-3px);
		border-color: rgba(59, 130, 246, 0.2);
	}

	.river-preview {
		display: flex;
		justify-content: center;
		background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
		padding: 8px 0;
	}

	.river-info {
		padding: 12px 14px;
	}

	.river-flow {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 10px;
	}

	.river-from,
	.river-to {
		font-size: 12px;
		font-weight: 600;
		color: #e2e8f0;
	}

	.river-arrow {
		color: #60a5fa;
		font-size: 14px;
	}

	.river-stats {
		display: flex;
		gap: 16px;
	}

	.river-stat {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.stat-label {
		font-size: 9px;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-size: 12px;
		font-weight: 600;
		color: #cbd5e1;
	}
</style>
