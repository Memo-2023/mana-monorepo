<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	// Redirect to the main reset-password page, preserving the token query parameter
	onMount(() => {
		const token = $page.url.searchParams.get('token');
		const redirectUrl = token ? `/reset-password?token=${token}` : '/reset-password';
		goto(redirectUrl, { replaceState: true });
	});
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8"
>
	<div class="text-center">
		<div
			class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"
		></div>
		<p class="text-gray-600 dark:text-gray-400">Redirecting...</p>
	</div>
</div>
