<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		// Redirect to login after a moment
		setTimeout(() => goto('/login'), 2000);
	});
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<div
		class="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-xl dark:border-gray-700 dark:bg-gray-800"
	>
		<div
			class="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"
		></div>
		<h1 class="mb-2 text-2xl font-bold">E-Mail wird verifiziert</h1>
		<p class="opacity-60">Bitte warten...</p>
	</div>
</div>
