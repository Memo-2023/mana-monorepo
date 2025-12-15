<script lang="ts">
	import { ChevronDown, ChevronUp } from '@lucide/svelte';

	interface Props {
		/** Whether immersive mode is currently enabled */
		isImmersive: boolean;
		/** Callback to toggle immersive mode */
		onToggle: () => void;
		/** Whether to show the toggle (e.g., only on main page) */
		visible?: boolean;
	}

	let { isImmersive, onToggle, visible = true }: Props = $props();
</script>

{#if visible}
	<button
		class="immersive-toggle"
		class:immersive={isImmersive}
		onclick={onToggle}
		title={isImmersive ? 'UI anzeigen (F)' : 'UI verstecken (F)'}
	>
		{#if isImmersive}
			<ChevronUp size={20} />
		{:else}
			<ChevronDown size={20} />
		{/if}
	</button>
{/if}

<style>
	.immersive-toggle {
		position: fixed;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 80px;
		height: 24px;
		border-radius: 8px 8px 0 0;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		pointer-events: auto;
		transition:
			opacity 300ms ease,
			background 150ms ease,
			color 150ms ease;
	}

	.immersive-toggle:hover {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		color: #374151;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -2px rgba(0, 0, 0, 0.1);
	}

	.immersive-toggle:active {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
	}

	/* Dark mode hover */
	:global(.dark) .immersive-toggle:hover {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #f3f4f6;
	}

	:global(.dark) .immersive-toggle:active {
		background: rgba(255, 255, 255, 0.2);
	}

	/* Immersive mode: even more subtle, full opacity on hover */
	.immersive-toggle.immersive {
		opacity: 0.2;
		color: hsl(var(--color-muted-foreground));
	}

	.immersive-toggle.immersive:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		color: #374151;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -2px rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .immersive-toggle.immersive:hover {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #f3f4f6;
	}

	/* Mobile adjustments */
	@media (max-width: 640px) {
		.immersive-toggle {
			bottom: env(safe-area-inset-bottom);
		}
	}
</style>
