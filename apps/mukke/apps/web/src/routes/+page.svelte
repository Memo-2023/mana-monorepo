<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';

	onMount(() => {
		if (authStore.isAuthenticated) {
			goto('/library');
		}
	});
</script>

<svelte:head>
	<title>Mukke - Music Workspace</title>
</svelte:head>

<div class="min-h-screen">
	<header class="border-b border-border">
		<div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
			<h1 class="text-2xl font-bold">
				<span class="text-primary">Mukke</span>
			</h1>
			<a
				href="/login"
				class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
			>
				Login
			</a>
		</div>
	</header>

	<main class="max-w-6xl mx-auto px-4 py-8">
		<div class="text-center py-16">
			<h2 class="text-4xl font-bold mb-4">Your Music Workspace</h2>
			<p class="text-xl text-foreground-secondary mb-8 max-w-2xl mx-auto">
				Upload your music, manage your library, write and sync lyrics, and play your tracks.
			</p>
			<div class="flex items-center justify-center gap-4">
				<a
					href="/login"
					class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
				>
					Get Started
				</a>
			</div>

			<div class="grid md:grid-cols-4 gap-6 mt-16">
				<div class="p-6 bg-surface rounded-lg">
					<div
						class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto"
					>
						<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
							/>
						</svg>
					</div>
					<h3 class="font-semibold mb-2">Music Library</h3>
					<p class="text-foreground-secondary text-sm">
						Organize songs by album, artist, and genre.
					</p>
				</div>

				<div class="p-6 bg-surface rounded-lg">
					<div
						class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto"
					>
						<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<h3 class="font-semibold mb-2">Web Player</h3>
					<p class="text-foreground-secondary text-sm">
						Queue, shuffle, repeat with persistent playback.
					</p>
				</div>

				<div class="p-6 bg-surface rounded-lg">
					<div
						class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto"
					>
						<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
							/>
						</svg>
					</div>
					<h3 class="font-semibold mb-2">Lyrics Editor</h3>
					<p class="text-foreground-secondary text-sm">Sync lyrics with waveform visualization.</p>
				</div>

				<div class="p-6 bg-surface rounded-lg">
					<div
						class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto"
					>
						<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
							/>
						</svg>
					</div>
					<h3 class="font-semibold mb-2">Export</h3>
					<p class="text-foreground-secondary text-sm">Export to LRC, SRT, JSON formats.</p>
				</div>
			</div>
		</div>
	</main>
</div>
