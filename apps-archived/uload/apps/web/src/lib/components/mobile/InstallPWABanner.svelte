<script lang="ts">
	import { onMount } from 'svelte';
	import { installPWA, isInstallableStore, isStandaloneStore } from '$lib/pwa';
	import { ripple } from '$lib/actions/touch';

	let showBanner = $state(false);
	let isInstalling = $state(false);
	let isInstallable = $state(false);
	let isStandalone = $state(false);

	onMount(() => {
		// Subscribe to stores
		const unsubInstallable = isInstallableStore.subscribe((value) => {
			isInstallable = value;
		});

		const unsubStandalone = isStandaloneStore.subscribe((value) => {
			isStandalone = value;
		});

		// Zeige Banner nur wenn app installierbar ist und nicht bereits im standalone modus
		const checkShowBanner = () => {
			showBanner = isInstallable && !isStandalone;
		};

		// Initial check
		checkShowBanner();

		// Warte auf beforeinstallprompt event
		const handleBeforeInstallPrompt = () => {
			setTimeout(checkShowBanner, 100);
		};

		window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

		return () => {
			window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
			unsubInstallable();
			unsubStandalone();
		};
	});

	async function handleInstall() {
		if (isInstalling) return;

		isInstalling = true;

		try {
			const installed = await installPWA();
			if (installed) {
				showBanner = false;
			}
		} catch (error) {
			console.error('Installation failed:', error);
		} finally {
			isInstalling = false;
		}
	}

	function dismissBanner() {
		showBanner = false;
		// Merke dass User Banner dismissed hat (für diese Session)
		sessionStorage.setItem('pwa-banner-dismissed', 'true');
	}

	// Prüfe ob Banner bereits dismissed wurde
	onMount(() => {
		const dismissed = sessionStorage.getItem('pwa-banner-dismissed');
		if (dismissed) {
			showBanner = false;
		}
	});
</script>

{#if showBanner}
	<!-- PWA Install Banner -->
	<div class="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
		<div
			class="rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-800"
		>
			<!-- Header -->
			<div class="mb-3 flex items-start justify-between">
				<div class="flex items-center space-x-3">
					<!-- App Icon -->
					<div
						class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600"
					>
						<svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
							/>
						</svg>
					</div>

					<!-- Content -->
					<div class="min-w-0 flex-1">
						<h3 class="text-sm font-semibold text-gray-900 dark:text-white">Install uLoad</h3>
						<p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
							Add to home screen for quick access
						</p>
					</div>
				</div>

				<!-- Dismiss Button -->
				<button
					onclick={dismissBanner}
					class="rounded-lg p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
					aria-label="Dismiss install banner"
				>
					<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Benefits -->
			<div class="mb-4 space-y-1">
				<div class="flex items-center text-xs text-gray-600 dark:text-gray-300">
					<svg
						class="mr-2 h-3 w-3 flex-shrink-0 text-green-500"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>Works offline</span>
				</div>
				<div class="flex items-center text-xs text-gray-600 dark:text-gray-300">
					<svg
						class="mr-2 h-3 w-3 flex-shrink-0 text-green-500"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>Fast loading</span>
				</div>
				<div class="flex items-center text-xs text-gray-600 dark:text-gray-300">
					<svg
						class="mr-2 h-3 w-3 flex-shrink-0 text-green-500"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>Native app feel</span>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex space-x-2">
				<button
					onclick={handleInstall}
					disabled={isInstalling}
					use:ripple={{ color: 'rgba(59, 130, 246, 0.3)' }}
					class="relative flex-1 overflow-hidden rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if isInstalling}
						<span class="flex items-center justify-center">
							<svg
								class="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Installing...
						</span>
					{:else}
						Install
					{/if}
				</button>

				<button
					onclick={dismissBanner}
					class="px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
				>
					Not now
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Smooth animations for banner */
	@keyframes slideUp {
		from {
			transform: translateY(100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	div[class*='fixed bottom-4'] > div {
		animation: slideUp 0.3s ease-out;
	}
</style>
