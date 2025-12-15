<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	$effect(() => {
		// Redirect to dashboard if already logged in, otherwise go to login
		// Auth is handled client-side via Mana Core Auth
		goto('/dashboard');
	});
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="text-center">
		<h1 class="mb-4">ManaCore</h1>
		<p class="text-gray-600 dark:text-gray-400">Loading...</p>
	</div>
</div>
