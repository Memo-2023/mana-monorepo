<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/my/links');
	});
</script>

<div class="flex min-h-screen items-center justify-center">
	<div
		class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"
	></div>
</div>
