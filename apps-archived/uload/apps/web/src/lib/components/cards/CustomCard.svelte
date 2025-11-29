<script lang="ts">
	import { onMount } from 'svelte';
	import type { CardConstraints } from './types';
	import { cardSanitizer } from '$lib/services/cardSanitizer';
	import { iframePool } from '$lib/services/iframePool';

	interface Props {
		html: string;
		css: string;
		constraints?: CardConstraints;
		className?: string;
	}

	let { html, css, constraints = {}, className = '' }: Props = $props();

	let container: HTMLDivElement;
	let iframe: HTMLIFrameElement | null = null;
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	// Get aspect ratio style
	let aspectRatioStyle = $derived(() => {
		const ratio = constraints?.aspectRatio || '16/9';
		return ratio === 'auto' ? '' : `aspect-ratio: ${ratio};`;
	});

	// Create safe iframe content
	let iframeContent = $derived(() => {
		try {
			return cardSanitizer.createSafeIframeContent(html, css, constraints);
		} catch (e) {
			console.error('Error creating iframe content:', e);
			error = 'Failed to render card content';
			return '';
		}
	});

	onMount(() => {
		// Get iframe from pool
		iframe = iframePool.acquire();

		if (iframe && container) {
			// Configure iframe
			iframe.style.width = '100%';
			iframe.style.height = '100%';
			iframe.style.border = 'none';
			iframe.style.position = 'absolute';
			iframe.style.top = '0';
			iframe.style.left = '0';

			// Set content
			iframe.srcdoc = iframeContent();

			// Handle load event
			iframe.onload = () => {
				isLoading = false;

				// Auto-adjust height if no aspect ratio
				if (!constraints?.aspectRatio || constraints.aspectRatio === 'auto') {
					try {
						const doc = iframe!.contentDocument || iframe!.contentWindow?.document;
						if (doc && container) {
							const height = doc.body.scrollHeight;
							container.style.height = `${height}px`;
						}
					} catch (e) {
						// Cross-origin restriction, ignore
					}
				}
			};

			// Add to container
			container.appendChild(iframe);
		}

		return () => {
			// Return iframe to pool
			if (iframe) {
				iframePool.release(iframe);
				iframe = null;
			}
		};
	});

	// Update iframe content when props change
	$effect(() => {
		if (iframe && !isLoading) {
			iframe.srcdoc = iframeContent();
		}
	});
</script>

<div bind:this={container} class="custom-card {className}" style={aspectRatioStyle()}>
	{#if error}
		<div class="error-state">
			<svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<p>{error}</p>
		</div>
	{:else if isLoading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading...</p>
		</div>
	{/if}
</div>

<style>
	.custom-card {
		position: relative;
		width: 100%;
		min-height: 100px;
		background: white;
		overflow: hidden;
	}

	.loading-state,
	.error-state {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		color: #6b7280;
		z-index: 1;
	}

	.spinner {
		width: 32px;
		height: 32px;
		margin: 0 auto 0.5rem;
		border: 3px solid #e5e7eb;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-icon {
		width: 48px;
		height: 48px;
		margin: 0 auto 0.5rem;
		color: #ef4444;
	}
</style>
