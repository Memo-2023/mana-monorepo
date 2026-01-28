const CACHE_NAME = 'todo-v3';
const OFFLINE_URL = '/offline.html';

// Assets, die immer gecacht werden sollen
const STATIC_CACHE_URLS = ['/', '/offline.html', '/icons/icon.svg', '/manifest.json'];

// Cache-Strategien für verschiedene Ressourcen
const CACHE_STRATEGIES = {
	// Netzwerk zuerst, dann Cache (für HTML/Navigation)
	networkFirst: [/\/$/, /\.html$/, /^\/kanban/, /^\/settings/, /^\/mana/, /^\/feedback/],
	// Cache zuerst, dann Netzwerk (für Assets) - nur für gebaute Assets, nicht /src/
	cacheFirst: [
		/\/_app\//, // SvelteKit gebaute Assets
		/\.woff2?$/,
		/\.ttf$/,
		/\.otf$/,
		/\.ico$/,
	],
	// Nur Netzwerk (für API-Calls und Dev-Server)
	networkOnly: [/\/api\//, /^\/src\//, /^\/@/, /^\/node_modules\//],
};

// Service Worker Installation
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => {
				console.log('Todo Service Worker: Caching static assets');
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
						.filter((cacheName) => cacheName.startsWith('todo-') && cacheName !== CACHE_NAME)
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

	// Ignoriere Cross-Origin Requests (z.B. Backend API)
	if (url.origin !== self.location.origin) {
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
		console.error('Todo SW: Fetch failed:', error);
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

// Message Handler für Updates
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});
