<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { getAppConfig } from '$lib/config/apps';
	import type { AppConfig } from '$lib/config/apps';

	let appConfig = $state<AppConfig>();
	let isFirstTime = $state(true);

	onMount(() => {
		// Get app name from query parameter
		const appName = $page.url.searchParams.get('appName');
		appConfig = getAppConfig(appName);

		// Check if this is actually a first-time user
		// You could store this in localStorage or check user profile
		const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
		isFirstTime = !hasSeenWelcome;
	});

	function handleContinue() {
		// Mark that user has seen welcome screen
		localStorage.setItem('hasSeenWelcome', 'true');

		// Redirect to app's dashboard
		goto(appConfig?.dashboardRoute || '/dashboard');
	}

	function handleSkip() {
		localStorage.setItem('hasSeenWelcome', 'true');
		goto(appConfig?.dashboardRoute || '/dashboard');
	}
</script>

<svelte:head>
	<title>Welcome to {appConfig?.displayName || 'Mana'}</title>
</svelte:head>

{#if appConfig}
	<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
		<div class="container mx-auto px-4 py-12">
			<!-- Header -->
			<div class="mb-12 text-center">
				{#if appConfig.logoEmoji}
					<div class="mb-4 text-6xl">
						{appConfig.logoEmoji}
					</div>
				{/if}

				<h1 class="mb-4 text-5xl font-bold tracking-tight" style="color: {appConfig.primaryColor}">
					Welcome to {appConfig.displayName}
				</h1>

				<p class="mb-2 text-2xl font-semibold text-gray-700 dark:text-gray-300">
					{appConfig.tagline}
				</p>

				<p class="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
					{appConfig.description}
				</p>
			</div>

			<!-- Features Grid -->
			<div class="mx-auto mb-12 max-w-6xl">
				<h2 class="mb-8 text-center text-3xl font-bold text-gray-800 dark:text-gray-200">
					{#if appConfig.name === 'mana'}
						What You Can Do
					{:else}
						Key Features
					{/if}
				</h2>

				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each appConfig.features as feature}
						<div
							class="group cursor-default rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
							style="border-left: 4px solid {feature.color}"
						>
							<div class="mb-4 flex items-center gap-3">
								<div
									class="flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-transform duration-300 group-hover:scale-110"
									style="background-color: {feature.color}20"
								>
									{feature.icon}
								</div>
								<h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
									{feature.title}
								</h3>
							</div>
							<p class="text-gray-600 dark:text-gray-400">
								{feature.description}
							</p>
						</div>
					{/each}
				</div>
			</div>

			<!-- Getting Started Section -->
			<div class="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
				<h2 class="mb-6 text-center text-2xl font-bold text-gray-800 dark:text-gray-200">
					Ready to Get Started?
				</h2>

				<div class="mb-6 space-y-4">
					{#if appConfig.name === 'memoro'}
						<div class="flex items-start gap-3">
							<div class="mt-1 text-xl">🎤</div>
							<div>
								<h4 class="font-semibold text-gray-800 dark:text-gray-200">Start Recording</h4>
								<p class="text-gray-600 dark:text-gray-400">Click the record button to capture your first voice memo</p>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<div class="mt-1 text-xl">✨</div>
							<div>
								<h4 class="font-semibold text-gray-800 dark:text-gray-200">AI Processing</h4>
								<p class="text-gray-600 dark:text-gray-400">Watch as AI transcribes and summarizes your recording</p>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<div class="mt-1 text-xl">🏷️</div>
							<div>
								<h4 class="font-semibold text-gray-800 dark:text-gray-200">Organize</h4>
								<p class="text-gray-600 dark:text-gray-400">Add tags and organize your memos for easy retrieval</p>
							</div>
						</div>
					{:else if appConfig.name === 'manadeck'}
						<div class="flex items-start gap-3">
							<div class="mt-1 text-xl">➕</div>
							<div>
								<h4 class="font-semibold text-gray-800 dark:text-gray-200">Create Your First Deck</h4>
								<p class="text-gray-600 dark:text-gray-400">Start with a new deck or import existing flashcards</p>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<div class="mt-1 text-xl">🧠</div>
							<div>
								<h4 class="font-semibold text-gray-800 dark:text-gray-200">Study Smart</h4>
								<p class="text-gray-600 dark:text-gray-400">Let AI optimize your review schedule for maximum retention</p>
							</div>
						</div>
					{:else if appConfig.name === 'storyteller'}
						<div class="flex items-start gap-3">
							<div class="mt-1 text-xl">✍️</div>
							<div>
								<h4 class="font-semibold text-gray-800 dark:text-gray-200">Start Writing</h4>
								<p class="text-gray-600 dark:text-gray-400">Create your first story with AI assistance</p>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<div class="mt-1 text-xl">🎨</div>
							<div>
								<h4 class="font-semibold text-gray-800 dark:text-gray-200">Format & Style</h4>
								<p class="text-gray-600 dark:text-gray-400">Use professional formatting tools to make your story shine</p>
							</div>
						</div>
					{:else}
						<div class="flex items-start gap-3">
							<div class="mt-1 text-xl">🚀</div>
							<div>
								<h4 class="font-semibold text-gray-800 dark:text-gray-200">Explore Your Dashboard</h4>
								<p class="text-gray-600 dark:text-gray-400">Discover all the features available to you</p>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<div class="mt-1 text-xl">⚙️</div>
							<div>
								<h4 class="font-semibold text-gray-800 dark:text-gray-200">Customize Settings</h4>
								<p class="text-gray-600 dark:text-gray-400">Personalize your experience in settings</p>
							</div>
						</div>
					{/if}
				</div>

				<div class="flex flex-col gap-3 sm:flex-row">
					<button
						onclick={handleContinue}
						class="flex-1 rounded-lg px-6 py-3 text-lg font-semibold text-white transition-colors hover:opacity-90"
						style="background-color: {appConfig.primaryColor}"
					>
						Get Started
					</button>
					<button
						onclick={handleSkip}
						class="flex-1 rounded-lg border-2 border-gray-300 px-6 py-3 text-lg font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
					>
						Skip Tutorial
					</button>
				</div>
			</div>

			<!-- Additional Info -->
			<div class="mt-8 text-center">
				<p class="text-gray-600 dark:text-gray-400">
					{#if appConfig.website}
						Need help? Visit <a href={appConfig.website} target="_blank" rel="noopener noreferrer" class="font-medium hover:underline" style="color: {appConfig.primaryColor}">{appConfig.website}</a>
					{:else}
						Need help? Check out the documentation or contact support
					{/if}
				</p>
			</div>
		</div>
	</div>
{:else}
	<!-- Loading state -->
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<div class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
			<p class="text-gray-600 dark:text-gray-400">Loading...</p>
		</div>
	</div>
{/if}

<style>
	:global(body) {
		overflow-x: hidden;
	}
</style>
