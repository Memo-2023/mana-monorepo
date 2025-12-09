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

<div class="min-h-[calc(100vh-4rem)] p-8 px-4 sm:px-6 bg-background {className}">
	<div class="mx-auto {maxWidthClasses[maxWidth]}">
		<header class="mb-8">
			<h1 class="text-2xl sm:text-[1.75rem] font-bold text-foreground m-0">{title}</h1>
			{#if subtitle}
				<p class="text-sm text-muted-foreground mt-1">{subtitle}</p>
			{/if}
		</header>

		<div class="flex flex-col gap-6">
			{@render children()}
		</div>
	</div>
</div>
