<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Section title */
		title?: string;
		/** Additional CSS classes */
		class?: string;
		/** Content (danger actions) */
		children: Snippet;
	}

	let {
		title = 'Danger Zone',
		class: className = '',
		children,
	}: Props = $props();
</script>

<section class="settings-danger-zone {className}">
	<header class="settings-danger-zone__header">
		<h2 class="settings-danger-zone__title">{title}</h2>
	</header>

	<div class="settings-danger-zone__content">
		{@render children()}
	</div>
</section>

<style>
	.settings-danger-zone {
		/* Glass effect with danger tint */
		background: rgba(239, 68, 68, 0.08);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: 1rem;
		overflow: hidden;
		box-shadow:
			0 4px 6px -1px rgba(239, 68, 68, 0.1),
			0 2px 4px -1px rgba(239, 68, 68, 0.06);
	}

	:global(.dark) .settings-danger-zone {
		background: rgba(239, 68, 68, 0.12);
		border-color: rgba(239, 68, 68, 0.25);
	}

	.settings-danger-zone__header {
		padding: 1rem 1.25rem;
		border-bottom: 1px solid rgba(239, 68, 68, 0.15);
		background: rgba(239, 68, 68, 0.1);
	}

	:global(.dark) .settings-danger-zone__header {
		border-bottom-color: rgba(239, 68, 68, 0.2);
		background: rgba(239, 68, 68, 0.15);
	}

	.settings-danger-zone__title {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--destructive));
		margin: 0;
	}

	.settings-danger-zone__content {
		display: flex;
		flex-direction: column;
	}
</style>
