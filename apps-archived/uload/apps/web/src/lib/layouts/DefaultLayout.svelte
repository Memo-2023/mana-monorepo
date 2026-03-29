<script lang="ts">
	// Default Layout for non-blog markdown files
	let { title = '' } = $props<{ title?: string }>();
</script>

<svelte:head>
	{#if title}
		<title>{title} | uload</title>
	{/if}
</svelte:head>

<div class="prose prose-lg container mx-auto max-w-none px-4 py-8">
	<slot />
</div>
