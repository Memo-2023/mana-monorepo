<script lang="ts">
	import SeenplatteScene from '$lib/components/observatory/SeenplatteScene.svelte';
	import PlantCard from '$lib/components/observatory/ui/PlantCard.svelte';
	import LakeCard from '$lib/components/observatory/ui/LakeCard.svelte';
	import DetailPanel from '$lib/components/observatory/ui/DetailPanel.svelte';
	import { createMockEcosystem } from '$lib/components/observatory/data/mockData';
	import { LAKES } from '$lib/components/observatory/data/layout';
	import type { AppData } from '$lib/components/observatory/data/types';

	type Tab = 'scene' | 'plants' | 'lakes';
	let activeTab = $state<Tab>('scene');
	let selectedApp = $state<AppData | null>(null);

	const apps = createMockEcosystem();
	const lakes = LAKES;

	// Sort apps by score descending for gallery
	const sortedApps = apps.toSorted((a, b) => b.score - a.score);

	// Group by status
	const matureApps = sortedApps.filter((a) => a.status === 'mature');
	const productionApps = sortedApps.filter((a) => a.status === 'production');
	const betaApps = sortedApps.filter((a) => a.status === 'beta');
	const alphaApps = sortedApps.filter((a) => a.status === 'alpha');

	const tabs: { id: Tab; label: string; count?: number }[] = [
		{ id: 'scene', label: 'Seenplatte' },
		{ id: 'plants', label: 'Pflanzen', count: apps.length },
		{ id: 'lakes', label: 'Seen', count: lakes.length },
	];
</script>

<div class="observatory-page">
	<!-- Tab bar -->
	<div class="tab-bar">
		{#each tabs as tab}
			<button
				type="button"
				class="tab-btn"
				class:active={activeTab === tab.id}
				onclick={() => (activeTab = tab.id)}
			>
				{tab.label}
				{#if tab.count}
					<span class="tab-count">{tab.count}</span>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Tab content -->
	{#if activeTab === 'scene'}
		<div class="scene-container">
			<SeenplatteScene />
		</div>
	{:else if activeTab === 'plants'}
		<div class="gallery-section">
			<div class="gallery-header">
				<h2 class="gallery-title">Alle Pflanzen</h2>
				<p class="gallery-subtitle">
					Jede App im Mana-Okosystem als Pflanze — Grosse und Art spiegeln den ManaScore wider
				</p>
			</div>

			{#if matureApps.length}
				<div class="gallery-group">
					<h3 class="group-label">
						<span class="group-dot" style="background: #34d399"></span>
						Mature
					</h3>
					<div class="gallery-scroll">
						{#each matureApps as app (app.id)}
							<PlantCard {app} onclick={() => (selectedApp = app)} />
						{/each}
					</div>
				</div>
			{/if}

			{#if productionApps.length}
				<div class="gallery-group">
					<h3 class="group-label">
						<span class="group-dot" style="background: #60a5fa"></span>
						Production
					</h3>
					<div class="gallery-scroll">
						{#each productionApps as app (app.id)}
							<PlantCard {app} onclick={() => (selectedApp = app)} />
						{/each}
					</div>
				</div>
			{/if}

			{#if betaApps.length}
				<div class="gallery-group">
					<h3 class="group-label">
						<span class="group-dot" style="background: #fbbf24"></span>
						Beta
					</h3>
					<div class="gallery-scroll">
						{#each betaApps as app (app.id)}
							<PlantCard {app} onclick={() => (selectedApp = app)} />
						{/each}
					</div>
				</div>
			{/if}

			{#if alphaApps.length}
				<div class="gallery-group">
					<h3 class="group-label">
						<span class="group-dot" style="background: #f97316"></span>
						Alpha
					</h3>
					<div class="gallery-scroll">
						{#each alphaApps as app (app.id)}
							<PlantCard {app} onclick={() => (selectedApp = app)} />
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{:else if activeTab === 'lakes'}
		<div class="gallery-section">
			<div class="gallery-header">
				<h2 class="gallery-title">Alle Seen</h2>
				<p class="gallery-subtitle">
					Infrastruktur-Services als Gewasser — Klarheit und Fullstand zeigen den Systemzustand
				</p>
			</div>

			<div class="gallery-scroll lakes-scroll">
				{#each lakes as lake (lake.id)}
					<LakeCard {lake} />
				{/each}
			</div>
		</div>
	{/if}
</div>

<!-- Detail panel (shared across tabs) -->
<DetailPanel app={selectedApp} onclose={() => (selectedApp = null)} />

<style>
	.observatory-page {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	/* Tab bar */
	.tab-bar {
		display: flex;
		gap: 2px;
		background: rgba(15, 23, 42, 0.4);
		padding: 4px;
		border-radius: 10px;
		margin-bottom: 12px;
	}

	.tab-btn {
		flex: 1;
		padding: 8px 16px;
		border: none;
		background: transparent;
		color: #94a3b8;
		font-size: 13px;
		font-weight: 500;
		border-radius: 7px;
		cursor: pointer;
		transition:
			background 0.2s,
			color 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
	}

	.tab-btn:hover {
		color: #cbd5e1;
		background: rgba(148, 163, 184, 0.08);
	}

	.tab-btn.active {
		background: rgba(59, 130, 246, 0.15);
		color: #60a5fa;
		font-weight: 600;
	}

	.tab-count {
		font-size: 10px;
		background: rgba(148, 163, 184, 0.15);
		padding: 1px 6px;
		border-radius: 8px;
		font-weight: 600;
	}

	.tab-btn.active .tab-count {
		background: rgba(59, 130, 246, 0.2);
		color: #93c5fd;
	}

	/* Scene tab */
	.scene-container {
		height: calc(100vh - 14rem);
		min-height: 500px;
		width: 100%;
	}

	/* Gallery sections */
	.gallery-section {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.gallery-header {
		margin-bottom: 4px;
	}

	.gallery-title {
		font-size: 20px;
		font-weight: 700;
		color: var(--color-foreground, #f1f5f9);
		margin: 0 0 4px 0;
	}

	.gallery-subtitle {
		font-size: 13px;
		color: var(--color-muted-foreground, #94a3b8);
		margin: 0;
	}

	/* Horizontal scroll container */
	.gallery-scroll {
		display: flex;
		gap: 14px;
		overflow-x: auto;
		padding-bottom: 12px;
		scroll-snap-type: x mandatory;
		-webkit-overflow-scrolling: touch;
	}

	.gallery-scroll > :global(*) {
		scroll-snap-align: start;
	}

	/* Hide scrollbar but keep functionality */
	.gallery-scroll::-webkit-scrollbar {
		height: 6px;
	}

	.gallery-scroll::-webkit-scrollbar-track {
		background: rgba(148, 163, 184, 0.05);
		border-radius: 3px;
	}

	.gallery-scroll::-webkit-scrollbar-thumb {
		background: rgba(148, 163, 184, 0.15);
		border-radius: 3px;
	}

	.gallery-scroll::-webkit-scrollbar-thumb:hover {
		background: rgba(148, 163, 184, 0.25);
	}

	/* Group headers */
	.gallery-group {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.group-label {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-muted-foreground, #94a3b8);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.group-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}
</style>
