const CACHE_NAME = 'mana-games-v1';
const OFFLINE_URL = '/offline.html';

// Assets, die immer gecacht werden sollen
const STATIC_CACHE_URLS = ['/', '/offline.html', '/favicon.svg', '/manifest.json'];

// Cache-Strategien für verschiedene Ressourcen
const CACHE_STRATEGIES = {
	// Netzwerk zuerst, dann Cache (für HTML)
	networkFirst: [/\/$/, /\.html$/, /\.astro$/],
	// Cache zuerst, dann Netzwerk (für Assets)
	cacheFirst: [
		/\.css$/,
		/\.js$/,
		/\.woff2?$/,
		/\.ttf$/,
		/\.otf$/,
		/\.svg$/,
		/\.png$/,
		/\.jpg$/,
		/\.jpeg$/,
		/\.webp$/,
		/\.ico$/,
	],
	// Nur Netzwerk (für API-Calls)
	networkOnly: [/\/api\//, /\.json$/],
};

// Service Worker Installation
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => {
				console.log('Service Worker: Caching static assets');
				return cache.addAll(STATIC_CACHE_URLS);
			})
			.then(() => self.skipWaiting())
	);
});

// Service Worker Aktivierung
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames
						.filter((cacheName) => cacheName !== CACHE_NAME)
						.map((cacheName) => caches.delete(cacheName))
				);
			})
			.then(() => self.clients.claim())
	);
});

// Fetch-Event Handler
self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Ignoriere Chrome Extension Requests
	if (url.protocol === 'chrome-extension:') {
		return;
	}

	// Bestimme die Cache-Strategie
	const strategy = getStrategy(url.pathname);

	if (strategy === 'networkFirst') {
		event.respondWith(networkFirst(request));
	} else if (strategy === 'cacheFirst') {
		event.respondWith(cacheFirst(request));
	} else if (strategy === 'networkOnly') {
		event.respondWith(networkOnly(request));
	} else {
		// Standard: Network First
		event.respondWith(networkFirst(request));
	}
});

// Cache-Strategien Implementierung
async function networkFirst(request) {
	try {
		const networkResponse = await fetch(request);
		if (networkResponse.ok) {
			const cache = await caches.open(CACHE_NAME);
			cache.put(request, networkResponse.clone());
		}
		return networkResponse;
	} catch (error) {
		const cachedResponse = await caches.match(request);
		if (cachedResponse) {
			return cachedResponse;
		}

		// Wenn es eine Navigation ist und wir offline sind, zeige die Offline-Seite
		if (request.mode === 'navigate') {
			const offlineResponse = await caches.match(OFFLINE_URL);
			if (offlineResponse) {
				return offlineResponse;
			}
		}

		throw error;
	}
}

async function cacheFirst(request) {
	const cachedResponse = await caches.match(request);
	if (cachedResponse) {
		return cachedResponse;
	}

	try {
		const networkResponse = await fetch(request);
		if (networkResponse.ok) {
			const cache = await caches.open(CACHE_NAME);
			cache.put(request, networkResponse.clone());
		}
		return networkResponse;
	} catch (error) {
		console.error('Fetch failed:', error);
		throw error;
	}
}

async function networkOnly(request) {
	return fetch(request);
}

// Hilfsfunktion zur Bestimmung der Cache-Strategie
function getStrategy(pathname) {
	for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
		if (patterns.some((pattern) => pattern.test(pathname))) {
			return strategy;
		}
	}
	return 'networkFirst';
}

// Message Handler für Cache-Updates
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}

	if (event.data && event.data.type === 'CACHE_GAME') {
		const gameUrl = event.data.url;
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.add(gameUrl))
			.then(() => {
				event.ports[0].postMessage({ cached: true });
			})
			.catch((error) => {
				event.ports[0].postMessage({ cached: false, error: error.message });
			});
	}
});
