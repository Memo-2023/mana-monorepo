<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: any; children: Snippet } = $props();

	$effect(() => {
		if (data.session) {
			goto('/dashboard');
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-8">
		{@render children()}
	</div>
</div>
