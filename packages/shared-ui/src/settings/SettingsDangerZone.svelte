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

	let { title = 'Danger Zone', class: className = '', children }: Props = $props();
</script>

<section
	class="bg-red-500/[0.08] dark:bg-red-500/[0.12] backdrop-blur-xl border border-red-500/20 dark:border-red-500/25 rounded-2xl overflow-hidden shadow-md {className}"
>
	<header
		class="px-5 py-4 border-b border-red-500/[0.15] dark:border-red-500/20 bg-red-500/10 dark:bg-red-500/[0.15]"
	>
		<h2 class="text-base font-semibold text-red-500 dark:text-red-400 m-0">{title}</h2>
	</header>

	<div class="flex flex-col">
		{@render children()}
	</div>
</section>
