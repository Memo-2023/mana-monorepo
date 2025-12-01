<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Page title */
		title: string;
		/** Optional subtitle/description */
		subtitle?: string;
		/** Maximum width of the content */
		maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
		/** Additional CSS classes */
		class?: string;
		/** Main content */
		children: Snippet;
	}

	let { title, subtitle, maxWidth = 'md', class: className = '', children }: Props = $props();

	const maxWidthClasses = {
		sm: 'max-w-lg',
		md: 'max-w-2xl',
		lg: 'max-w-3xl',
		xl: 'max-w-4xl',
	};
</script>

<div class="settings-page {className}">
	<div class="settings-page__container {maxWidthClasses[maxWidth]}">
		<header class="settings-page__header">
			<h1 class="settings-page__title">{title}</h1>
			{#if subtitle}
				<p class="settings-page__subtitle">{subtitle}</p>
			{/if}
		</header>

		<div class="settings-page__content">
			{@render children()}
		</div>
	</div>
</div>

<style>
	.settings-page {
		min-height: calc(100vh - 4rem);
		padding: 2rem 1rem;
		background-color: hsl(var(--background));
	}

	.settings-page__container {
		margin-left: auto;
		margin-right: auto;
	}

	.settings-page__header {
		margin-bottom: 2rem;
	}

	.settings-page__title {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.settings-page__subtitle {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin: 0.25rem 0 0 0;
	}

	.settings-page__content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	@media (min-width: 640px) {
		.settings-page {
			padding: 2rem 1.5rem;
		}

		.settings-page__title {
			font-size: 1.75rem;
		}
	}
</style>
