<script lang="ts">
	import { onMount } from 'svelte';
	import { GDPRManager, acceptAllCookies, acceptNecessaryOnly, type GDPRConsent } from '$lib/gdpr/compliance';
	import { slide } from 'svelte/transition';

	// State
	let showBanner = $state(false);
	let showDetails = $state(false);
	let consent = $state<GDPRConsent | null>(null);
	let customConsent = $state({
		necessary: true,
		analytics: false,
		marketing: false,
		preferences: false
	});

	onMount(() => {
		// Prüfe ob Banner gezeigt werden muss
		showBanner = GDPRManager.needsConsent();
		consent = GDPRManager.getConsent();
		
		// Event Listener für Consent-Updates
		const handleConsentUpdate = (event: CustomEvent) => {
			consent = event.detail;
			showBanner = false;
		};
		
		window.addEventListener('gdpr:consent-updated', handleConsentUpdate as EventListener);
		
		return () => {
			window.removeEventListener('gdpr:consent-updated', handleConsentUpdate as EventListener);
		};
	});

	function handleAcceptAll() {
		acceptAllCookies();
		showBanner = false;
	}

	function handleAcceptNecessary() {
		acceptNecessaryOnly();
		showBanner = false;
	}

	function handleSaveCustom() {
		GDPRManager.setConsent(customConsent);
		showBanner = false;
	}

	function toggleDetails() {
		showDetails = !showDetails;
	}

	function handleCustomChange(type: keyof typeof customConsent, value: boolean) {
		customConsent = { ...customConsent, [type]: value };
	}
</script>

{#if showBanner}
	<div 
		class="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-xl"
		transition:slide={{ duration: 300 }}
	>
		<div class="max-w-7xl mx-auto p-4 md:p-6">
			{#if !showDetails}
				<!-- Basis Cookie Banner -->
				<div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
					<!-- Content -->
					<div class="flex-1">
						<div class="flex items-start space-x-3">
							<!-- Cookie Icon -->
							<div class="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
								<svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							
							<!-- Text -->
							<div class="flex-1">
								<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
									Cookies & Datenschutz
								</h3>
								<p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
									Wir verwenden Cookies und ähnliche Technologien, um Ihnen die bestmögliche Erfahrung zu bieten. 
									Einige sind technisch notwendig, andere helfen uns die Website zu verbessern und zu analysieren.
								</p>
								
								<!-- Links -->
								<div class="mt-2 flex items-center space-x-4 text-xs">
									<a href="/datenschutz" class="text-blue-600 dark:text-blue-400 hover:underline">
										Datenschutzerklärung
									</a>
									<a href="/impressum" class="text-blue-600 dark:text-blue-400 hover:underline">
										Impressum
									</a>
									<button 
										onclick={toggleDetails}
										class="text-blue-600 dark:text-blue-400 hover:underline"
									>
										Details anzeigen
									</button>
								</div>
							</div>
						</div>
					</div>

					<!-- Buttons -->
					<div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
						<button 
							onclick={handleAcceptNecessary}
							class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
						>
							Nur notwendige
						</button>
						<button 
							onclick={toggleDetails}
							class="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
						>
							Anpassen
						</button>
						<button 
							onclick={handleAcceptAll}
							class="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
						>
							Alle akzeptieren
						</button>
					</div>
				</div>

			{:else}
				<!-- Detaillierte Cookie-Einstellungen -->
				<div class="space-y-6">
					<!-- Header -->
					<div class="flex items-center justify-between">
						<h3 class="text-xl font-semibold text-gray-900 dark:text-white">
							Cookie-Einstellungen
						</h3>
						<button 
							onclick={toggleDetails}
							class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
							aria-label="Schließen"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					<!-- Cookie Categories -->
					<div class="grid gap-4">
						<!-- Notwendige Cookies -->
						<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
							<div class="flex items-center justify-between mb-3">
								<div>
									<h4 class="font-medium text-gray-900 dark:text-white">
										Notwendige Cookies
									</h4>
									<p class="text-sm text-gray-600 dark:text-gray-300">
										Technisch erforderlich für die Grundfunktionen der Website
									</p>
								</div>
								<div class="flex items-center">
									<span class="text-sm text-gray-500 mr-2">Immer aktiv</span>
									<div class="w-10 h-6 bg-green-600 rounded-full relative">
										<div class="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
									</div>
								</div>
							</div>
							<p class="text-xs text-gray-500 dark:text-gray-400">
								Speichern von Login-Status, Spracheinstellungen und technischen Präferenzen
							</p>
						</div>

						<!-- Analytics Cookies -->
						<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
							<div class="flex items-center justify-between mb-3">
								<div>
									<h4 class="font-medium text-gray-900 dark:text-white">
										Analytics Cookies
									</h4>
									<p class="text-sm text-gray-600 dark:text-gray-300">
										Helfen uns die Website zu verbessern
									</p>
								</div>
								<button 
									onclick={() => handleCustomChange('analytics', !customConsent.analytics)}
									class="relative"
								>
									<div class="w-10 h-6 rounded-full transition-colors {customConsent.analytics ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}">
										<div class="w-4 h-4 bg-white rounded-full absolute top-1 transition-transform {customConsent.analytics ? 'translate-x-4' : 'translate-x-1'}"></div>
									</div>
								</button>
							</div>
							<p class="text-xs text-gray-500 dark:text-gray-400">
								Anonyme Nutzungsstatistiken, Seitenaufrufe und Klick-Verhalten
							</p>
						</div>

						<!-- Marketing Cookies -->
						<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
							<div class="flex items-center justify-between mb-3">
								<div>
									<h4 class="font-medium text-gray-900 dark:text-white">
										Marketing Cookies
									</h4>
									<p class="text-sm text-gray-600 dark:text-gray-300">
										Für personalisierte Inhalte und Werbung
									</p>
								</div>
								<button 
									onclick={() => handleCustomChange('marketing', !customConsent.marketing)}
									class="relative"
								>
									<div class="w-10 h-6 rounded-full transition-colors {customConsent.marketing ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}">
										<div class="w-4 h-4 bg-white rounded-full absolute top-1 transition-transform {customConsent.marketing ? 'translate-x-4' : 'translate-x-1'}"></div>
									</div>
								</button>
							</div>
							<p class="text-xs text-gray-500 dark:text-gray-400">
								Newsletter-Präferenzen und zielgerichtete Kommunikation
							</p>
						</div>

						<!-- Preferences Cookies -->
						<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
							<div class="flex items-center justify-between mb-3">
								<div>
									<h4 class="font-medium text-gray-900 dark:text-white">
										Präferenz Cookies
									</h4>
									<p class="text-sm text-gray-600 dark:text-gray-300">
										Speichern Ihre persönlichen Einstellungen
									</p>
								</div>
								<button 
									onclick={() => handleCustomChange('preferences', !customConsent.preferences)}
									class="relative"
								>
									<div class="w-10 h-6 rounded-full transition-colors {customConsent.preferences ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}">
										<div class="w-4 h-4 bg-white rounded-full absolute top-1 transition-transform {customConsent.preferences ? 'translate-x-4' : 'translate-x-1'}"></div>
									</div>
								</button>
							</div>
							<p class="text-xs text-gray-500 dark:text-gray-400">
								Theme-Einstellungen, Layout-Präferenzen und Benutzeroberfläche
							</p>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
						<button 
							onclick={handleAcceptNecessary}
							class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
						>
							Nur notwendige Cookies
						</button>
						<button 
							onclick={handleSaveCustom}
							class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
						>
							Auswahl speichern
						</button>
						<button 
							onclick={handleAcceptAll}
							class="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
						>
							Alle akzeptieren
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Custom animations */
	.toggle-switch {
		transition: all 0.2s ease-in-out;
	}
	
	/* Focus styles for accessibility */
	button:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}
</style>