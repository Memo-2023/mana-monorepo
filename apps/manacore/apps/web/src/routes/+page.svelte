<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	$effect(() => {
		if (!data.session) {
			goto('/login');
		} else {
			goto('/dashboard');
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="text-center">
		<h1 class="mb-4">ManaCore</h1>
		<p class="text-gray-600 dark:text-gray-400">Loading...</p>
	</div>
</div>
