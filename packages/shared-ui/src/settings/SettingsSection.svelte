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

	let { title, icon, class: className = '', children }: Props = $props();
</script>

<section class="flex flex-col gap-3 {className}">
	{#if title}
		<header class="flex items-center gap-2 pl-1">
			{#if icon}
				<span
					class="flex items-center justify-center w-7 h-7 rounded-lg bg-black/[0.04] dark:bg-white/[0.08] text-primary [&>svg]:w-4 [&>svg]:h-4"
				>
					{@render icon()}
				</span>
			{/if}
			<h2 class="text-[0.9375rem] font-semibold text-gray-700 dark:text-gray-100 m-0 tracking-tight">
				{title}
			</h2>
		</header>
	{/if}

	<div class="flex flex-col gap-2">
		{@render children()}
	</div>
</section>
