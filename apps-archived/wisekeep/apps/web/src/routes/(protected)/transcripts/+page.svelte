<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api/client';
	import { jobList } from '$lib/stores/jobs';

	let loading = $state(true);

	onMount(async () => {
		try {
			const jobs = await api.getAllJobs();
			// Jobs are managed via the store
		} finally {
			loading = false;
		}
	});

	const completedJobs = $derived($jobList.filter((j) => j.status === 'completed'));
</script>

<svelte:head>
	<title>Transcripts | Wisekeep</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-8">Transcripts</h1>

	{#if loading}
		<div class="text-gray-500">Loading...</div>
	{:else if completedJobs.length === 0}
		<div class="bg-gray-50 rounded-lg p-8 text-center">
			<p class="text-gray-500 mb-4">No transcripts yet</p>
			<a
				href="/transcribe"
				class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
			>
				Create your first transcript
			</a>
		</div>
	{:else}
		<div class="grid gap-4">
			{#each completedJobs as job (job.id)}
				<div class="bg-white rounded-lg shadow-sm border p-4">
					<div class="flex justify-between items-start">
						<div>
							<h3 class="font-medium">{job.videoInfo?.title || 'Untitled'}</h3>
							<p class="text-sm text-gray-500">{job.videoInfo?.channel || 'Unknown channel'}</p>
							<p class="text-xs text-gray-400 mt-1">
								Completed: {new Date(job.completedAt || '').toLocaleString()}
							</p>
						</div>
						<span class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
							Completed
						</span>
					</div>
					{#if job.transcriptText}
						<details class="mt-4">
							<summary class="cursor-pointer text-sm text-purple-600 hover:text-purple-700">
								View transcript
							</summary>
							<pre
								class="mt-2 p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap overflow-auto max-h-96">
                {job.transcriptText}
              </pre>
						</details>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
