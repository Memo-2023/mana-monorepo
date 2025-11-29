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

<div class="flex min-h-screen items-center justify-center bg-gray-50">
	<div class="mx-auto w-full max-w-md p-6">
		<div class="rounded-2xl bg-white p-8 shadow-xl">
			<!-- Logo -->
			<div class="mb-8 text-center">
				<h1 class="text-4xl font-bold text-sky-500">ulo.ad</h1>
			</div>

			{#if loading}
				<div class="text-center">
					<div class="mb-4 inline-flex h-16 w-16 items-center justify-center">
						<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-sky-500"></div>
					</div>
					<p class="text-gray-600">Processing invitation...</p>
				</div>
			{:else if success}
				<div class="text-center">
					<div
						class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
					>
						<svg
							class="h-8 w-8 text-green-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							></path>
						</svg>
					</div>
					<h2 class="mb-2 text-2xl font-semibold text-gray-800">Invitation Accepted!</h2>
					<p class="mb-4 text-gray-600">You've successfully joined the team.</p>
					<p class="text-sm text-gray-500">Redirecting to dashboard...</p>
				</div>
			{:else if error}
				<div class="text-center">
					<div
						class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100"
					>
						<svg class="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						</svg>
					</div>
					<h2 class="mb-2 text-2xl font-semibold text-gray-800">Invitation Error</h2>
					<p class="mb-6 text-red-600">{error}</p>
					<div class="space-y-3">
						<a
							href="/login"
							class="block w-full rounded-lg bg-sky-500 px-4 py-2 text-center text-white transition-colors hover:bg-sky-600"
						>
							Go to Login
						</a>
						<a
							href="/"
							class="block w-full rounded-lg bg-gray-200 px-4 py-2 text-center text-gray-700 transition-colors hover:bg-gray-300"
						>
							Back to Home
						</a>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
