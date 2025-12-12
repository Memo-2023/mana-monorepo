<script lang="ts">
	/**
	 * AppPanel Component
	 * iFrame container for displaying an app in split-screen.
	 */

	import type { PanelConfig } from '../types.js';

	interface Props {
		panel: PanelConfig;
		class?: string;
	}

	let { panel, class: className = '' }: Props = $props();

	let isLoading = $state(true);
	let hasError = $state(false);

	function handleLoad() {
		isLoading = false;
		hasError = false;
	}

	function handleError() {
		isLoading = false;
		hasError = true;
	}

	// iFrame sandbox permissions
	const sandboxPermissions = [
		'allow-same-origin',
		'allow-scripts',
		'allow-forms',
		'allow-popups',
		'allow-popups-to-escape-sandbox',
		'allow-storage-access-by-user-activation',
	].join(' ');
</script>

<div class="app-panel {className}">
	{#if isLoading}
		<div class="loading-state">
			<div class="spinner"></div>
			<span>Loading {panel.name || panel.appId}...</span>
		</div>
	{/if}

	{#if hasError}
		<div class="error-state">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="8" x2="12" y2="12" />
				<line x1="12" y1="16" x2="12.01" y2="16" />
			</svg>
			<span>Failed to load {panel.name || panel.appId}</span>
			<button
				onclick={() => {
					isLoading = true;
					hasError = false;
				}}
			>
				Retry
			</button>
		</div>
	{/if}

	<iframe
		src={panel.url}
		title={panel.name || panel.appId}
		sandbox={sandboxPermissions}
		class:hidden={hasError}
		onload={handleLoad}
		onerror={handleError}
	></iframe>
</div>

<style>
	.app-panel {
		position: relative;
		width: 100%;
		height: 100%;
		background: var(--color-bg-secondary, #1a1a1a);
		overflow: hidden;
		border-radius: 8px;
	}

	iframe {
		width: 100%;
		height: 100%;
		border: none;
		background: var(--color-bg-primary, #0a0a0a);
	}

	iframe.hidden {
		display: none;
	}

	.loading-state,
	.error-state {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		color: var(--color-text-secondary, #888);
		font-size: 14px;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--color-border, rgba(255, 255, 255, 0.1));
		border-top-color: var(--color-primary, #3b82f6);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-state {
		color: var(--color-error, #ef4444);
	}

	.error-state button {
		margin-top: 8px;
		padding: 8px 16px;
		background: var(--color-primary, #3b82f6);
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		transition: opacity 0.15s ease;
	}

	.error-state button:hover {
		opacity: 0.9;
	}
</style>
