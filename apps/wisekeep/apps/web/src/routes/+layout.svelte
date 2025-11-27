<script lang="ts">
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { initWebSocket, cleanup, isConnected } from '$lib/stores/jobs';

	onMount(() => {
		initWebSocket();
	});

	onDestroy(() => {
		cleanup();
	});
</script>

<div class="min-h-screen flex flex-col">
	<header class="bg-white shadow-sm border-b">
		<div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
			<a href="/" class="text-xl font-bold text-primary-600"> Transcriber </a>
			<nav class="flex items-center gap-6">
				<a href="/" class="text-gray-600 hover:text-gray-900">Dashboard</a>
				<a href="/transcribe" class="text-gray-600 hover:text-gray-900">Transcribe</a>
				<a href="/transcripts" class="text-gray-600 hover:text-gray-900">Transcripts</a>
				<a href="/playlists" class="text-gray-600 hover:text-gray-900">Playlists</a>
			</nav>
			<div class="flex items-center gap-2">
				<span class="w-2 h-2 rounded-full {$isConnected ? 'bg-green-500' : 'bg-red-500'}"></span>
				<span class="text-sm text-gray-500">
					{$isConnected ? 'Connected' : 'Disconnected'}
				</span>
			</div>
		</div>
	</header>

	<main class="flex-1">
		<slot />
	</main>

	<footer class="bg-gray-100 border-t py-4">
		<div class="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
			YouTube Transcriber - AI-powered video transcription
		</div>
	</footer>
</div>
