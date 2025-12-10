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

	// Base card classes using Tailwind
	const baseCardClasses =
		'rounded-2xl overflow-hidden shadow-md border backdrop-blur-xl ' +
		'bg-white/85 border-black/10 ' +
		'dark:bg-white/[0.06] dark:border-white/10 dark:shadow-lg';

	const dangerCardClasses =
		'rounded-2xl overflow-hidden shadow-md border backdrop-blur-xl ' +
		'bg-red-500/[0.08] border-red-500/30 ' +
		'dark:bg-red-500/[0.12] dark:border-red-500/25 dark:shadow-lg';

	const headerClasses = 'px-5 py-4 border-b border-black/[0.08] dark:border-white/10';

	const dangerHeaderClasses = 'px-5 py-4 border-b border-red-500/20 bg-red-500/10';
</script>

<div class="{variant === 'danger' ? dangerCardClasses : baseCardClasses} {className}">
	{#if title || description}
		<header class={variant === 'danger' ? dangerHeaderClasses : headerClasses}>
			{#if title}
				<h3
					class="text-base font-semibold text-foreground {variant === 'danger'
						? 'text-red-500 dark:text-red-400'
						: ''}"
				>
					{title}
				</h3>
			{/if}
			{#if description}
				<p class="text-sm text-muted-foreground mt-1">{description}</p>
			{/if}
		</header>
	{/if}

	<div class="flex flex-col">
		{@render children()}
	</div>
</div>
