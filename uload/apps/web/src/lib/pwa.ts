// PWA Installation und Service Worker Management
import { browser } from '$app/environment';
import { writable, get } from 'svelte/store';

// PWA Installation State - using Svelte stores for SSR compatibility
export const deferredPromptStore = writable<any>(null);
export const isInstallableStore = writable(false);
export const isInstalledStore = writable(false);
export const isStandaloneStore = writable(false);

// Service Worker Registration
export const serviceWorkerRegistrationStore = writable<ServiceWorkerRegistration | null>(null);
export const isOfflineStore = writable(false);

// Export getters for convenience
export const getDeferredPrompt = () => get(deferredPromptStore);
export const getIsInstallable = () => get(isInstallableStore);
export const getIsInstalled = () => get(isInstalledStore);
export const getIsStandalone = () => get(isStandaloneStore);
export const getServiceWorkerRegistration = () => get(serviceWorkerRegistrationStore);
export const getIsOffline = () => get(isOfflineStore);

if (browser) {
	// Check if app is already installed (standalone mode)
	const standalone = window.matchMedia('(display-mode: standalone)').matches ||
		(window.navigator as any).standalone ||
		document.referrer.includes('android-app://');
	isStandaloneStore.set(standalone);

	// Listen for beforeinstallprompt event
	window.addEventListener('beforeinstallprompt', (e) => {
		console.log('PWA: Install prompt available');
		e.preventDefault();
		deferredPromptStore.set(e);
		isInstallableStore.set(true);
	});

	// Listen for app installation
	window.addEventListener('appinstalled', () => {
		console.log('PWA: App installed');
		isInstalledStore.set(true);
		isInstallableStore.set(false);
		deferredPromptStore.set(null);
	});

	// Online/Offline status tracking
	const updateOnlineStatus = () => {
		isOfflineStore.set(!navigator.onLine);
	};

	window.addEventListener('online', updateOnlineStatus);
	window.addEventListener('offline', updateOnlineStatus);
	updateOnlineStatus();
}

// Install PWA function
export async function installPWA(): Promise<boolean> {
	const deferredPrompt = get(deferredPromptStore);
	
	if (!deferredPrompt) {
		console.log('PWA: No install prompt available');
		return false;
	}

	// Show the install prompt
	deferredPrompt.prompt();

	// Wait for the user's response
	const { outcome } = await deferredPrompt.userChoice;

	console.log(`PWA: User response to install prompt: ${outcome}`);

	// Clear the deferred prompt
	deferredPromptStore.set(null);
	isInstallableStore.set(false);

	if (outcome === 'accepted') {
		isInstalledStore.set(true);
		return true;
	}

	return false;
}

// Register Service Worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
	if (!browser || !('serviceWorker' in navigator)) {
		console.log('PWA: Service Worker not supported');
		return null;
	}

	try {
		const registration = await navigator.serviceWorker.register('/sw.js', {
			scope: '/'
		});

		console.log('PWA: Service Worker registered', registration);
		serviceWorkerRegistrationStore.set(registration);

		// Check for updates on focus
		document.addEventListener('visibilitychange', () => {
			if (!document.hidden) {
				registration.update();
			}
		});

		// Handle updates
		registration.addEventListener('updatefound', () => {
			const newWorker = registration.installing;
			if (newWorker) {
				newWorker.addEventListener('statechange', () => {
					if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
						// New content available
						console.log('PWA: New content available');
						// You might want to show a notification to the user
					}
				});
			}
		});

		return registration;
	} catch (error) {
		console.error('PWA: Service Worker registration failed:', error);
		return null;
	}
}

// Initialize PWA features
export function initializePWA() {
	if (!browser) return;

	// Register service worker
	registerServiceWorker();

	// Additional PWA features can be initialized here
	console.log('PWA: Initialized');
}

// Check if update is available
export async function checkForUpdates(): Promise<boolean> {
	const registration = get(serviceWorkerRegistrationStore);
	
	if (!registration) {
		return false;
	}

	try {
		await registration.update();
		return registration.waiting !== null;
	} catch (error) {
		console.error('PWA: Error checking for updates:', error);
		return false;
	}
}

// Skip waiting and activate new service worker
export async function activateUpdate(): Promise<void> {
	const registration = get(serviceWorkerRegistrationStore);
	
	if (!registration || !registration.waiting) {
		return;
	}

	// Tell the waiting service worker to activate
	registration.waiting.postMessage({ type: 'SKIP_WAITING' });

	// Reload the page once the new service worker is activated
	navigator.serviceWorker.addEventListener('controllerchange', () => {
		window.location.reload();
	});
}