<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();

	onMount(() => {
		if (data.session) {
			goto('/memos', { replaceState: true });
		} else {
			goto('/login', { replaceState: true });
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="text-center">
		<h1 class="text-4xl font-bold">Memoro</h1>
		<p class="mt-2 text-gray-600">Loading...</p>
	</div>
</div>
