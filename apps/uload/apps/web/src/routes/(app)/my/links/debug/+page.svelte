<script lang="ts">
	import { onMount } from 'svelte';

	let debugData = $state<any>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			const response = await fetch('/api/test-pb');
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			debugData = await response.json();
			console.log('[DEBUG PAGE] Data received:', debugData);
		} catch (err: any) {
			error = err?.message || 'Unknown error';
			console.error('[DEBUG PAGE] Error:', err);
		} finally {
			loading = false;
		}
	});
</script>

<div class="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
	<div class="mx-auto max-w-4xl">
		<h1 class="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
			PocketBase Debug Information
		</h1>

		{#if loading}
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
				<p class="text-gray-600 dark:text-gray-400">Loading debug information...</p>
			</div>
		{:else if error}
			<div
				class="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20"
			>
				<h2 class="mb-2 font-semibold text-red-800 dark:text-red-400">Error</h2>
				<p class="text-red-600 dark:text-red-300">{error}</p>
			</div>
		{:else if debugData}
			<div class="space-y-6">
				<!-- User Info -->
				<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
					<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">User Information</h2>
					<pre class="overflow-x-auto rounded bg-gray-100 p-4 text-sm dark:bg-gray-900">
{JSON.stringify(debugData.user, null, 2)}</pre>
				</div>

				<!-- PocketBase Info -->
				<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
					<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
						PocketBase Connection
					</h2>
					<pre class="overflow-x-auto rounded bg-gray-100 p-4 text-sm dark:bg-gray-900">
{JSON.stringify(debugData.pb, null, 2)}</pre>
				</div>

				<!-- Test Results -->
				<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
					<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Test Results</h2>
					{#each Object.entries(debugData.tests) as [testName, result]}
						<div
							class="mb-4 rounded border p-4 {result.success
								? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
								: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'}"
						>
							<h3
								class="mb-2 font-medium {result.success
									? 'text-green-800 dark:text-green-400'
									: 'text-red-800 dark:text-red-400'}"
							>
								{testName}: {result.success ? '✅ Success' : '❌ Failed'}
							</h3>
							<pre
								class="overflow-x-auto text-xs {result.success
									? 'text-green-700 dark:text-green-300'
									: 'text-red-700 dark:text-red-300'}">
{JSON.stringify(result, null, 2)}</pre>
						</div>
					{/each}
				</div>

				<!-- Raw Data -->
				<details class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
					<summary class="cursor-pointer font-semibold text-gray-900 dark:text-white"
						>Raw Debug Data</summary
					>
					<pre class="mt-4 overflow-x-auto rounded bg-gray-100 p-4 text-xs dark:bg-gray-900">
{JSON.stringify(debugData, null, 2)}</pre>
				</details>
			</div>
		{/if}
	</div>
</div>
