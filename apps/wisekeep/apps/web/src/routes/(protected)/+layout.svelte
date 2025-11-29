<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { initWebSocket, cleanup, isConnected } from '$lib/stores/jobs';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	let isChecking = $state(true);

	// Check auth on mount and redirect if not authenticated
	onMount(async () => {
		let shouldRedirect = false;

		try {
			await authStore.initialize();
			shouldRedirect = !authStore.isAuthenticated;

			if (!shouldRedirect) {
				// Initialize WebSocket after auth check
				initWebSocket();
			}
		} catch (error) {
			console.error('Protected layout init error:', error);
			shouldRedirect = true;
		}

		// Always set isChecking to false
		isChecking = false;

		if (shouldRedirect) {
			const redirectTo = encodeURIComponent(data.pathname || '/dashboard');
			goto(`/login?redirectTo=${redirectTo}`);
		}

		// Return cleanup function
		return () => cleanup();
	});

	async function handleSignOut() {
		await authStore.signOut();
		goto('/login');
	}
</script>

{#if isChecking}
	<!-- Loading state while checking auth -->
	<div class="min-h-screen bg-gray-50 flex items-center justify-center">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
	</div>
{:else}
	<div class="min-h-screen flex flex-col">
		<header class="bg-white shadow-sm border-b">
			<div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
				<a href="/dashboard" class="text-xl font-bold text-purple-600">Wisekeep</a>
				<nav class="flex items-center gap-6">
					<a
						href="/dashboard"
						class="transition-colors {$page.url.pathname === '/dashboard'
							? 'text-purple-600 font-medium'
							: 'text-gray-600 hover:text-gray-900'}"
					>
						Dashboard
					</a>
					<a
						href="/transcribe"
						class="transition-colors {$page.url.pathname === '/transcribe'
							? 'text-purple-600 font-medium'
							: 'text-gray-600 hover:text-gray-900'}"
					>
						Transcribe
					</a>
					<a
						href="/transcripts"
						class="transition-colors {$page.url.pathname === '/transcripts'
							? 'text-purple-600 font-medium'
							: 'text-gray-600 hover:text-gray-900'}"
					>
						Transcripts
					</a>
					<a
						href="/playlists"
						class="transition-colors {$page.url.pathname === '/playlists'
							? 'text-purple-600 font-medium'
							: 'text-gray-600 hover:text-gray-900'}"
					>
						Playlists
					</a>
				</nav>
				<div class="flex items-center gap-4">
					<div class="flex items-center gap-2">
						<span class="w-2 h-2 rounded-full {$isConnected ? 'bg-green-500' : 'bg-red-500'}"></span>
						<span class="text-sm text-gray-500">
							{$isConnected ? 'Connected' : 'Disconnected'}
						</span>
					</div>
					{#if authStore.user}
						<span class="text-sm text-gray-600 hidden sm:block">
							{authStore.user.email}
						</span>
					{/if}
					<button
						onclick={handleSignOut}
						class="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
					>
						Abmelden
					</button>
				</div>
			</div>
		</header>

		<main class="flex-1">
			{@render children()}
		</main>

		<footer class="bg-gray-100 border-t py-4">
			<div class="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
				Wisekeep - AI-powered wisdom extraction from video
			</div>
		</footer>
	</div>
{/if}
