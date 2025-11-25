<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// If no password required and we're in the browser, something went wrong with the redirect
	onMount(() => {
		if (!data.requiresPassword && browser) {
			// This shouldn't happen - the server should have redirected
			console.error('Redirect failed - no password required but still on page');
		}
	});
</script>

{#if data.requiresPassword}
	<div class="flex min-h-screen items-center justify-center bg-gray-50 p-4">
		<div class="w-full max-w-md">
			<div class="rounded-lg bg-white p-8 shadow-md">
				<h1 class="mb-6 text-center text-2xl font-bold text-gray-900">Password Protected Link</h1>
				<p class="mb-4 text-center text-gray-600">This link requires a password to access.</p>

				<form method="POST" action="?/unlock" use:enhance>
					<div class="space-y-4">
						<div>
							<label for="password" class="mb-1 block text-sm font-medium text-gray-700">
								Password
							</label>
							<input
								type="password"
								id="password"
								name="password"
								required
								class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>
						</div>

						{#if form?.error}
							<div class="rounded border border-red-400 bg-red-100 p-3 text-red-700">
								{form.error}
							</div>
						{/if}

						<button
							type="submit"
							class="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition duration-200 hover:bg-blue-700"
						>
							Continue
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{:else}
	<!-- Fallback content if no redirect happened -->
	<div class="flex min-h-screen items-center justify-center bg-gray-50 p-4">
		<div class="w-full max-w-md text-center">
			<p class="text-gray-600">Redirecting...</p>
			<p class="mt-2 text-sm text-gray-500">
				If you are not redirected, there may be an issue with this link.
			</p>
		</div>
	</div>
{/if}
