<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Card title (optional) */
		title?: string;
		/** Card description (optional) */
		description?: string;
		/** Visual variant */
		variant?: 'default' | 'danger';
		/** Additional CSS classes */
		class?: string;
		/** Content (SettingsRow components) */
		children: Snippet;
	}

	let {
		title,
		description,
		variant = 'default',
		class: className = '',
		children,
	}: Props = $props();
</script>

<div class="settings-card settings-card--{variant} {className}">
	{#if title || description}
		<header class="settings-card__header">
			{#if title}
				<h3 class="settings-card__title">{title}</h3>
			{/if}
			{#if description}
				<p class="settings-card__description">{description}</p>
			{/if}
		</header>
	{/if}

	<div class="settings-card__content">
		{@render children()}
	</div>
</div>

<style>
	.settings-card {
		/* Glass effect */
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 1rem;
		overflow: hidden;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .settings-card {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
	}

	.settings-card--danger {
		border-color: hsl(var(--destructive) / 0.3);
		background: rgba(239, 68, 68, 0.08);
	}

	:global(.dark) .settings-card--danger {
		background: rgba(239, 68, 68, 0.12);
		border-color: rgba(239, 68, 68, 0.25);
	}

	.settings-card__header {
		padding: 1rem 1.25rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}

	:global(.dark) .settings-card__header {
		border-bottom-color: rgba(255, 255, 255, 0.1);
	}

	.settings-card--danger .settings-card__header {
		border-bottom-color: hsl(var(--destructive) / 0.2);
		background: rgba(239, 68, 68, 0.1);
	}

	.settings-card__title {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.settings-card--danger .settings-card__title {
		color: hsl(var(--destructive));
	}

	.settings-card__description {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin: 0.25rem 0 0 0;
	}

	.settings-card__content {
		display: flex;
		flex-direction: column;
	}
</style>
