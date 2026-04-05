<script lang="ts">
	import type { AppData } from '../data/types';
	import RadarChart from './RadarChart.svelte';

	let {
		app,
		onclose,
	}: {
		app: AppData | null;
		onclose: () => void;
	} = $props();

	const statusLabels: Record<string, string> = {
		mature: 'Mature',
		production: 'Production',
		beta: 'Beta',
		alpha: 'Alpha',
		prototype: 'Prototype',
	};

	const statusColors: Record<string, string> = {
		mature: '#34d399',
		production: '#60a5fa',
		beta: '#fbbf24',
		alpha: '#f97316',
		prototype: '#94a3b8',
	};

	const appUrls: Record<string, string> = {
		calendar: 'https://calendar.mana.how',
		todo: 'https://todo.mana.how',
		contacts: 'https://contacts.mana.how',
		chat: 'https://chat.mana.how',
		storage: 'https://storage.mana.how',
		picture: 'https://picture.mana.how',
		presi: 'https://presi.mana.how',
		music: 'https://music.mana.how',
		clock: 'https://clock.mana.how',
		nutriphi: 'https://nutriphi.mana.how',
		photos: 'https://photos.mana.how',
		zitare: 'https://zitare.mana.how',
		manacore: 'https://mana.how',
		cards: 'https://cards.mana.how',
		planta: 'https://planta.mana.how',
		matrix: 'https://element.mana.how',
		playground: 'https://playground.mana.how',
	};

	function scoreColor(score: number): string {
		if (score >= 85) return '#34d399';
		if (score >= 70) return '#60a5fa';
		if (score >= 55) return '#fbbf24';
		if (score >= 40) return '#f97316';
		return '#ef4444';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if app}
	<!-- Backdrop -->
	<button
		type="button"
		class="panel-backdrop"
		onclick={onclose}
		tabindex="-1"
		aria-label="Close panel"
	></button>

	<div class="panel" class:open={!!app}>
		<!-- Header -->
		<div class="panel-header">
			<div>
				<h3 class="panel-title">{app.displayName}</h3>
				<span class="panel-status" style="color: {statusColors[app.status]}">
					{statusLabels[app.status]}
				</span>
			</div>
			<div class="panel-score" style="color: {scoreColor(app.score)}">
				{app.score}
			</div>
		</div>

		<!-- Score bar -->
		<div class="score-bar-container">
			<div class="score-bar" style="width: {app.score}%; background: {scoreColor(app.score)}"></div>
		</div>

		<!-- Radar Chart -->
		<div class="panel-section">
			<h4 class="section-label">Kategorien</h4>
			<div class="radar-container">
				<RadarChart categories={app.categories} size={200} />
			</div>
		</div>

		<!-- Category scores list -->
		<div class="panel-section">
			<div class="category-list">
				{#each Object.entries(app.categories) as [key, value]}
					<div class="category-row">
						<span class="category-label">{key}</span>
						<div class="category-bar-wrap">
							<div
								class="category-bar-fill"
								style="width: {value}%; background: {scoreColor(value)}"
							></div>
						</div>
						<span class="category-value">{value}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Links -->
		<div class="panel-section">
			<div class="panel-links">
				{#if appUrls[app.id]}
					<a href={appUrls[app.id]} target="_blank" rel="noopener" class="panel-link">
						App offnen
					</a>
				{/if}
				<a href="/manascore/{app.id}" class="panel-link secondary"> ManaScore Details </a>
			</div>
		</div>

		<!-- Close button -->
		<button type="button" class="panel-close" onclick={onclose} aria-label="Close">
			&times;
		</button>
	</div>
{/if}

<style>
	.panel-backdrop {
		position: fixed;
		inset: 0;
		z-index: 40;
		background: rgba(0, 0, 0, 0.2);
		border: none;
		cursor: default;
	}

	.panel {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		z-index: 45;
		width: 340px;
		max-width: 90vw;
		background: rgba(15, 23, 42, 0.95);
		backdrop-filter: blur(16px);
		border-left: 1px solid rgba(148, 163, 184, 0.1);
		overflow-y: auto;
		padding: 24px;
		box-shadow: -8px 0 32px rgba(0, 0, 0, 0.3);
		animation: slideIn 0.25s ease-out;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 12px;
	}

	.panel-title {
		font-size: 20px;
		font-weight: 700;
		color: #f1f5f9;
		margin: 0;
	}

	.panel-status {
		font-size: 12px;
		font-weight: 500;
	}

	.panel-score {
		font-size: 36px;
		font-weight: 800;
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}

	.score-bar-container {
		height: 4px;
		background: rgba(148, 163, 184, 0.1);
		border-radius: 2px;
		margin-bottom: 24px;
		overflow: hidden;
	}

	.score-bar {
		height: 100%;
		border-radius: 2px;
		transition: width 0.5s ease;
	}

	.panel-section {
		margin-bottom: 20px;
	}

	.section-label {
		font-size: 10px;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin: 0 0 10px 0;
	}

	.radar-container {
		display: flex;
		justify-content: center;
	}

	.category-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.category-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.category-label {
		font-size: 11px;
		color: #94a3b8;
		width: 90px;
		text-transform: capitalize;
		flex-shrink: 0;
	}

	.category-bar-wrap {
		flex: 1;
		height: 5px;
		background: rgba(148, 163, 184, 0.1);
		border-radius: 3px;
		overflow: hidden;
	}

	.category-bar-fill {
		height: 100%;
		border-radius: 3px;
		transition: width 0.4s ease;
	}

	.category-value {
		font-size: 11px;
		color: #cbd5e1;
		width: 24px;
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}

	.panel-links {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.panel-link {
		display: block;
		text-align: center;
		padding: 8px 16px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
		text-decoration: none;
		background: #3b82f6;
		color: white;
		transition: background 0.2s;
	}

	.panel-link:hover {
		background: #2563eb;
	}

	.panel-link.secondary {
		background: rgba(148, 163, 184, 0.1);
		color: #94a3b8;
	}

	.panel-link.secondary:hover {
		background: rgba(148, 163, 184, 0.2);
		color: #cbd5e1;
	}

	.panel-close {
		position: absolute;
		top: 16px;
		right: 16px;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: rgba(148, 163, 184, 0.1);
		color: #94a3b8;
		border-radius: 6px;
		font-size: 18px;
		cursor: pointer;
		transition:
			background 0.2s,
			color 0.2s;
	}

	.panel-close:hover {
		background: rgba(148, 163, 184, 0.2);
		color: #f1f5f9;
	}
</style>
