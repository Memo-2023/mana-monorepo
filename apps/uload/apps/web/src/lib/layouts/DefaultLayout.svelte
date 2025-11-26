<script lang="ts">
	// Default Layout for non-blog markdown files
	let { title = '' } = $props<{ title?: string }>();
</script>

<svelte:head>
	{#if title}
		<title>{title} | uload</title>
	{/if}
</svelte:head>

<div class="container mx-auto px-4 py-8 prose prose-lg max-w-none">
	<slot />
</div>