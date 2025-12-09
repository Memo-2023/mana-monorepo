<script context="module" lang="ts">
	function getInitials(name: string): string {
		const parts = name.split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
		}
		return name.substring(0, 2).toUpperCase();
	}

	function stringToColor(str: string): string {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		const hue = hash % 360;
		return `hsl(${hue}, 70%, 50%)`;
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { networkStore, type SimulationNode } from '$lib/stores/network.svelte';
	import NetworkGraph from '$lib/components/network/NetworkGraph.svelte';
	import NetworkControls from '$lib/components/network/NetworkControls.svelte';
	import { NetworkGraphSkeleton } from '$lib/components/skeletons';
	import '$lib/i18n';

	let graphComponent: NetworkGraph;

	function handleNodeClick(node: SimulationNode) {
		// Select node (highlight connections)
		networkStore.selectNode(node.id);
	}

	function handleZoomIn() {
		graphComponent?.zoomIn();
	}

	function handleZoomOut() {
		graphComponent?.zoomOut();
	}

	function handleResetZoom() {
		graphComponent?.resetZoom();
	}

	function handleViewContact() {
		if (networkStore.selectedNodeId) {
			goto(`/contacts/${networkStore.selectedNodeId}`);
		}
	}

	onMount(() => {
		networkStore.loadGraph();
	});
</script>

<svelte:head>
	<title>Netzwerk - Contacts</title>
</svelte:head>

<div class="network-page">
	<!-- Controls (floating) -->
	<div class="controls-wrapper">
		<NetworkControls
			onZoomIn={handleZoomIn}
			onZoomOut={handleZoomOut}
			onResetZoom={handleResetZoom}
		/>
	</div>

	<!-- Error Banner -->
	{#if networkStore.error}
		<div class="error-banner" role="alert">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/>
			</svg>
			<span>{networkStore.error}</span>
		</div>
	{/if}

	<!-- Main Content -->
	<div class="graph-container">
		{#if networkStore.loading}
			<NetworkGraphSkeleton />
		{:else}
			<NetworkGraph bind:this={graphComponent} onNodeClick={handleNodeClick} />
		{/if}
	</div>

	<!-- Selected Node Sidebar -->
	{#if networkStore.selectedNode}
		{@const node = networkStore.selectedNode}
		{@const connectedNodes = networkStore.getConnectedNodes(node.id)}
		{@const nodeLinks = networkStore.getNodeLinks(node.id)}

		<div class="sidebar">
			<div class="sidebar-header">
				<h2 class="sidebar-title">Ausgewählter Kontakt</h2>
				<button
					class="sidebar-close"
					onclick={() => networkStore.selectNode(null)}
					aria-label="Schließen"
				>
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="sidebar-content">
				<!-- Contact Info -->
				<div class="contact-card">
					<div class="contact-avatar" style="background: {stringToColor(node.name)}">
						{#if node.photoUrl}
							<img src={node.photoUrl} alt={node.name} />
						{:else}
							{getInitials(node.name)}
						{/if}
					</div>
					<div class="contact-info">
						<h3 class="contact-name">{node.name}</h3>
						{#if node.company}
							<p class="contact-company">{node.company}</p>
						{/if}
					</div>
					{#if node.isFavorite}
						<span class="favorite-badge">⭐</span>
					{/if}
				</div>

				<!-- Tags -->
				{#if node.tags.length > 0}
					<div class="section">
						<h4 class="section-title">Tags</h4>
						<div class="tags-list">
							{#each node.tags as tag}
								<span class="tag" style="background: {tag.color || 'hsl(var(--muted))'}">
									{tag.name}
								</span>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Connections -->
				{#if connectedNodes.length > 0}
					<div class="section">
						<h4 class="section-title">
							Verbindungen ({connectedNodes.length})
						</h4>
						<div class="connections-list">
							{#each connectedNodes as connected}
								{@const link = nodeLinks.find((l) => {
									const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
									const targetId = typeof l.target === 'string' ? l.target : l.target.id;
									return sourceId === connected.id || targetId === connected.id;
								})}
								<button
									class="connection-item"
									onclick={() => networkStore.selectNode(connected.id)}
								>
									<div
										class="connection-avatar"
										style="background: {stringToColor(connected.name)}"
									>
										{getInitials(connected.name)}
									</div>
									<div class="connection-info">
										<span class="connection-name">{connected.name}</span>
										{#if link}
											<span class="connection-tags">
												{link.sharedTags.join(', ')}
											</span>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Actions -->
				<div class="sidebar-actions">
					<button class="btn-primary" onclick={handleViewContact}>
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							/>
						</svg>
						Kontakt anzeigen
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.network-page {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
	}

	/* Floating Controls */
	.controls-wrapper {
		position: absolute;
		top: 5rem; /* Below the nav */
		left: 50%;
		transform: translateX(-50%);
		z-index: 10;
		max-width: calc(100% - 2rem);
	}

	/* Error Banner */
	.error-banner {
		position: absolute;
		top: 5rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		background: hsl(var(--destructive) / 0.1);
		border: 1px solid hsl(var(--destructive) / 0.3);
		border-radius: 0.875rem;
		color: hsl(var(--destructive));
		backdrop-filter: blur(8px);
	}

	/* Graph Container - Full screen */
	.graph-container {
		flex: 1;
		width: 100%;
		height: 100%;
		overflow: hidden;
		position: relative;
	}

	/* Sidebar */
	.sidebar {
		position: fixed;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
		width: 320px;
		max-height: calc(100vh - 100px);
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 1rem;
		box-shadow: 0 8px 32px hsl(var(--foreground) / 0.1);
		z-index: 50;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid hsl(var(--border));
	}

	.sidebar-title {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.sidebar-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		background: none;
		border: none;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		border-radius: 0.5rem;
		transition: all 0.2s;
	}

	.sidebar-close:hover {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
	}

	.sidebar-close svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.sidebar-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.25rem;
	}

	/* Contact Card */
	.contact-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: hsl(var(--muted) / 0.3);
		border-radius: 0.75rem;
		margin-bottom: 1.25rem;
	}

	.contact-avatar {
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 600;
		font-size: 1.125rem;
		overflow: hidden;
	}

	.contact-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.contact-info {
		flex: 1;
		min-width: 0;
	}

	.contact-name {
		font-size: 1.0625rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin-bottom: 0.125rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.contact-company {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.favorite-badge {
		font-size: 1rem;
	}

	/* Sections */
	.section {
		margin-bottom: 1.25rem;
	}

	.section-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.75rem;
	}

	/* Tags */
	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		color: white;
	}

	/* Connections */
	.connections-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.connection-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.625rem;
		background: none;
		border: 1px solid hsl(var(--border));
		border-radius: 0.625rem;
		cursor: pointer;
		text-align: left;
		transition: all 0.2s;
	}

	.connection-item:hover {
		background: hsl(var(--muted) / 0.5);
		border-color: hsl(var(--primary) / 0.3);
	}

	.connection-avatar {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 600;
		font-size: 0.75rem;
		flex-shrink: 0;
	}

	.connection-info {
		flex: 1;
		min-width: 0;
	}

	.connection-name {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.connection-tags {
		display: block;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Actions */
	.sidebar-actions {
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--border));
	}

	.btn-primary {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.75rem 1rem;
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		border: none;
		border-radius: 0.625rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary:hover {
		opacity: 0.9;
	}

	.btn-primary svg {
		width: 1.125rem;
		height: 1.125rem;
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.sidebar {
			position: fixed;
			right: 0;
			top: auto;
			bottom: 0;
			transform: none;
			width: 100%;
			max-height: 50vh;
			border-radius: 1rem 1rem 0 0;
		}
	}

	@media (max-width: 768px) {
		.controls-wrapper {
			top: 6rem; /* Larger nav on mobile */
			width: calc(100% - 1rem);
			max-width: none;
		}
	}
</style>
