<script lang="ts">
  import { onMount } from 'svelte';
  import { api, type Stats } from '$lib/api/client';
  import { activeJobs, jobList } from '$lib/stores/jobs';

  let stats: Stats | null = $state(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  onMount(async () => {
    try {
      stats = await api.getStats();
      const jobs = await api.getAllJobs();
      // Initialize jobs store with existing jobs
      jobs.forEach((job) => {
        jobList; // trigger reactivity
      });
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load stats';
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Transcriber - Dashboard</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-8">Dashboard</h1>

  {#if loading}
    <div class="text-gray-500">Loading...</div>
  {:else if error}
    <div class="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
  {:else if stats}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <div class="text-sm text-gray-500 mb-1">Total Transcripts</div>
        <div class="text-3xl font-bold text-primary-600">{stats.totalTranscripts}</div>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <div class="text-sm text-gray-500 mb-1">Storage Used</div>
        <div class="text-3xl font-bold">{stats.totalSizeMB} MB</div>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <div class="text-sm text-gray-500 mb-1">Active Jobs</div>
        <div class="text-3xl font-bold text-yellow-600">{stats.activeJobs}</div>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <div class="text-sm text-gray-500 mb-1">Completed</div>
        <div class="text-3xl font-bold text-green-600">{stats.completedJobs}</div>
      </div>
    </div>
  {/if}

  <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
    <h2 class="text-xl font-semibold mb-4">Quick Start</h2>
    <a
      href="/transcribe"
      class="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
    >
      Start New Transcription
    </a>
  </div>

  {#if $activeJobs.length > 0}
    <div class="bg-white rounded-lg shadow-sm border p-6">
      <h2 class="text-xl font-semibold mb-4">Active Jobs</h2>
      <div class="space-y-4">
        {#each $activeJobs as job (job.id)}
          <div class="border rounded-lg p-4">
            <div class="flex justify-between items-start mb-2">
              <div>
                <div class="font-medium">{job.videoInfo?.title || job.url}</div>
                <div class="text-sm text-gray-500">{job.videoInfo?.channel || 'Loading...'}</div>
              </div>
              <span
                class="px-2 py-1 text-xs rounded-full
                  {job.status === 'downloading' ? 'bg-blue-100 text-blue-700' : ''}
                  {job.status === 'transcribing' ? 'bg-yellow-100 text-yellow-700' : ''}
                  {job.status === 'pending' ? 'bg-gray-100 text-gray-700' : ''}"
              >
                {job.status}
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-primary-600 h-2 rounded-full transition-all"
                style="width: {job.progress}%"
              ></div>
            </div>
            <div class="text-sm text-gray-500 mt-1">{job.progress}%</div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
