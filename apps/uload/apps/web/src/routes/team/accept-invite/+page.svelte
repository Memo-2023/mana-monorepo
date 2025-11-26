<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	
	let loading = true;
	let error = '';
	let success = false;

	onMount(async () => {
		const token = $page.url.searchParams.get('token');
		
		if (!token) {
			error = 'Invalid invitation link';
			loading = false;
			return;
		}

		if (data.result?.success) {
			success = true;
			loading = false;
			setTimeout(() => {
				goto('/dashboard');
			}, 3000);
		} else if (data.result?.error) {
			error = data.result.error;
			loading = false;
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="max-w-md w-full mx-auto p-6">
		<div class="bg-white rounded-2xl shadow-xl p-8">
			<!-- Logo -->
			<div class="text-center mb-8">
				<h1 class="text-4xl font-bold text-sky-500">ulo.ad</h1>
			</div>

			{#if loading}
				<div class="text-center">
					<div class="inline-flex items-center justify-center w-16 h-16 mb-4">
						<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
					</div>
					<p class="text-gray-600">Processing invitation...</p>
				</div>
			{:else if success}
				<div class="text-center">
					<div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
						<svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
					</div>
					<h2 class="text-2xl font-semibold text-gray-800 mb-2">Invitation Accepted!</h2>
					<p class="text-gray-600 mb-4">You've successfully joined the team.</p>
					<p class="text-sm text-gray-500">Redirecting to dashboard...</p>
				</div>
			{:else if error}
				<div class="text-center">
					<div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
						<svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</div>
					<h2 class="text-2xl font-semibold text-gray-800 mb-2">Invitation Error</h2>
					<p class="text-red-600 mb-6">{error}</p>
					<div class="space-y-3">
						<a href="/login" class="block w-full px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-center">
							Go to Login
						</a>
						<a href="/" class="block w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-center">
							Back to Home
						</a>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>