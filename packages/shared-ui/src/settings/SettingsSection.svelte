<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Section title */
		title?: string;
		/** Optional icon (Snippet for flexibility) */
		icon?: Snippet;
		/** Additional CSS classes */
		class?: string;
		/** Content (SettingsCard components) */
		children: Snippet;
	}

	let {
		title,
		icon,
		class: className = '',
		children,
	}: Props = $props();
</script>

<section class="settings-section {className}">
	{#if title}
		<header class="settings-section__header">
			{#if icon}
				<span class="settings-section__icon">
					{@render icon()}
				</span>
			{/if}
			<h2 class="settings-section__title">{title}</h2>
		</header>
	{/if}

	<div class="settings-section__content">
		{@render children()}
	</div>
</section>

<style>
	.settings-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.settings-section__header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-left: 0.25rem;
	}

	.settings-section__icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.5rem;
		background: rgba(0, 0, 0, 0.04);
		color: hsl(var(--primary));
	}

	:global(.dark) .settings-section__icon {
		background: rgba(255, 255, 255, 0.08);
	}

	.settings-section__icon :global(svg) {
		width: 1rem;
		height: 1rem;
	}

	.settings-section__title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: #374151;
		margin: 0;
		letter-spacing: -0.01em;
	}

	:global(.dark) .settings-section__title {
		color: #f3f4f6;
	}

	.settings-section__content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
</style>
