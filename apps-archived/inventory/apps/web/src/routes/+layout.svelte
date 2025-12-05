<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import { isLoading } from 'svelte-i18n';

	let { children } = $props();
</script>

{#if $isLoading}
	<div class="flex h-screen items-center justify-center">
		<div
			class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
		></div>
	</div>
{:else}
	{@render children()}
{/if}
