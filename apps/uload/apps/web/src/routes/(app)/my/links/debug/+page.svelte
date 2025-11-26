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

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
	<div class="max-w-4xl mx-auto">
		<h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">PocketBase Debug Information</h1>
		
		{#if loading}
			<div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
				<p class="text-gray-600 dark:text-gray-400">Loading debug information...</p>
			</div>
		{:else if error}
			<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
				<h2 class="text-red-800 dark:text-red-400 font-semibold mb-2">Error</h2>
				<p class="text-red-600 dark:text-red-300">{error}</p>
			</div>
		{:else if debugData}
			<div class="space-y-6">
				<!-- User Info -->
				<div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
					<h2 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">User Information</h2>
					<pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-sm">
{JSON.stringify(debugData.user, null, 2)}</pre>
				</div>
				
				<!-- PocketBase Info -->
				<div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
					<h2 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">PocketBase Connection</h2>
					<pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-sm">
{JSON.stringify(debugData.pb, null, 2)}</pre>
				</div>
				
				<!-- Test Results -->
				<div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
					<h2 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Test Results</h2>
					{#each Object.entries(debugData.tests) as [testName, result]}
						<div class="mb-4 p-4 rounded border {result.success ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}">
							<h3 class="font-medium mb-2 {result.success ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}">
								{testName}: {result.success ? '✅ Success' : '❌ Failed'}
							</h3>
							<pre class="text-xs overflow-x-auto {result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}">
{JSON.stringify(result, null, 2)}</pre>
						</div>
					{/each}
				</div>
				
				<!-- Raw Data -->
				<details class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
					<summary class="cursor-pointer font-semibold text-gray-900 dark:text-white">Raw Debug Data</summary>
					<pre class="mt-4 bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-xs">
{JSON.stringify(debugData, null, 2)}</pre>
				</details>
			</div>
		{/if}
	</div>
</div>