<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Content to render inside the card */
		children: Snippet;
		/** Additional CSS classes */
		class?: string;
	}

	let { children, class: className = '' }: Props = $props();
</script>

<div
	class="glass-card relative overflow-hidden rounded-3xl border border-theme bg-black/[0.02] dark:bg-white/[0.02] p-6 shadow-lg {className}"
>
	{@render children()}
</div>

<style>
	/* Glassmorphism effect */
	.glass-card {
		backdrop-filter: blur(10px);
	}
</style>
