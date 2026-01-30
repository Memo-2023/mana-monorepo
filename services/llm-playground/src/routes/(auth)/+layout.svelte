<script lang="ts">
	import type { Snippet } from 'svelte';
	let { children }: { children: Snippet } = $props();
</script>

<div
	class="min-h-screen flex items-center justify-center"
	style="background-color: var(--color-bg);"
>
	{@render children()}
</div>
