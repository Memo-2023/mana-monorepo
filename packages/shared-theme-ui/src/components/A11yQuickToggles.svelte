<script lang="ts">
	import type { A11yStore } from '@mana/shared-theme';

	interface Props {
		/** A11y store instance */
		store: A11yStore;
		/** Contrast toggle title */
		contrastTitle?: string;
		/** Motion toggle title */
		motionTitle?: string;
	}

	let {
		store,
		contrastTitle = 'Hoher Kontrast',
		motionTitle = 'Animationen reduzieren',
	}: Props = $props();
</script>

<div class="a11y-quick-toggles">
	<!-- Contrast Toggle -->
	<button
		type="button"
		onclick={() => store.setContrast(store.contrast === 'high' ? 'normal' : 'high')}
		class="a11y-btn"
		class:active={store.contrast === 'high'}
		title={contrastTitle}
		aria-pressed={store.contrast === 'high'}
	>
		<svg class="a11y-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<circle cx="12" cy="12" r="10" />
			<path d="M12 2v20M12 2a10 10 0 0 1 0 20" fill="currentColor" />
		</svg>
	</button>

	<!-- Reduce Motion Toggle -->
	<button
		type="button"
		onclick={() => store.setReduceMotion(!store.reduceMotion)}
		class="a11y-btn"
		class:active={store.reduceMotion}
		title={motionTitle}
		aria-pressed={store.reduceMotion}
	>
		<svg class="a11y-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			{#if store.reduceMotion}
				<!-- Pause icon when motion is reduced -->
				<rect x="6" y="4" width="4" height="16" rx="1" />
				<rect x="14" y="4" width="4" height="16" rx="1" />
			{:else}
				<!-- Play/motion icon -->
				<polygon points="5 3 19 12 5 21 5 3" />
			{/if}
		</svg>
	</button>
</div>

<style>
	.a11y-quick-toggles {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem;
		border-radius: 9999px;
		background: rgba(245, 245, 245, 0.95);
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .a11y-quick-toggles {
		background: rgba(40, 40, 40, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.a11y-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.375rem;
		border: none;
		background: transparent;
		border-radius: 9999px;
		cursor: pointer;
		color: #6b7280;
		transition: all 0.15s;
	}

	:global(.dark) .a11y-btn {
		color: #9ca3af;
	}

	.a11y-btn:hover:not(.active) {
		background: rgba(0, 0, 0, 0.05);
		color: #374151;
	}

	:global(.dark) .a11y-btn:hover:not(.active) {
		background: rgba(255, 255, 255, 0.1);
		color: #f3f4f6;
	}

	.a11y-btn.active {
		background: hsl(var(--color-primary) / 0.2);
		color: hsl(var(--color-primary));
	}

	:global(.dark) .a11y-btn.active {
		background: hsl(var(--color-primary) / 0.3);
	}

	.a11y-icon {
		width: 1rem;
		height: 1rem;
	}
</style>
