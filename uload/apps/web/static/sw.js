// uLoad Service Worker für PWA-Funktionalität
const CACHE_NAME = 'uload-v1';
const OFFLINE_URL = '/offline';

// Assets die gecacht werden sollen
const CACHE_ASSETS = [
	'/',
	'/my',
	'/offline',
	'/manifest.json'
];

// Install Event - Cache initialisieren
self.addEventListener('install', (event) => {
	console.log('Service Worker: Installing');
	
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then((cache) => {
				console.log('Service Worker: Caching assets');
				return cache.addAll(CACHE_ASSETS);
			})
			.then(() => self.skipWaiting())
	);
});

// Activate Event - Alte Caches löschen
self.addEventListener('activate', (event) => {
	console.log('Service Worker: Activating');
	
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME) {
						console.log('Service Worker: Deleting old cache', cacheName);
						return caches.delete(cacheName);
					}
				})
			);
		}).then(() => self.clients.claim())
	);
});

// Fetch Event - Network-first mit Cache-Fallback
self.addEventListener('fetch', (event) => {
	// Nur GET Requests handhaben
	if (event.request.method !== 'GET') return;

	// Spezielle Behandlung für Navigation Requests
	if (event.request.mode === 'navigate') {
		event.respondWith(handleNavigate(event.request));
		return;
	}

	// API Requests - Network-first
	if (event.request.url.includes('/api/')) {
		event.respondWith(handleApiRequest(event.request));
		return;
	}

	// Static Assets - Cache-first
	if (isStaticAsset(event.request.url)) {
		event.respondWith(handleStaticAsset(event.request));
		return;
	}

	// Default: Network-first
	event.respondWith(handleDefault(event.request));
});

// Navigation Requests handhaben
async function handleNavigate(request) {
	try {
		// Versuche Network Request
		const response = await fetch(request);
		
		// Bei Erfolg: Response cachen und zurückgeben
		if (response.status === 200) {
			const cache = await caches.open(CACHE_NAME);
			cache.put(request, response.clone());
		}
		
		return response;
	} catch (error) {
		// Bei Netzwerk-Fehler: Cache prüfen
		const cachedResponse = await caches.match(request);
		if (cachedResponse) {
			return cachedResponse;
		}
		
		// Offline-Seite anzeigen
		return caches.match(OFFLINE_URL);
	}
}

// API Requests handhaben
async function handleApiRequest(request) {
	try {
		// API Requests immer vom Netzwerk
		const response = await fetch(request);
		
		// Bei Erfolg: kurzzeitig cachen (für Read-only Endpoints)
		if (response.status === 200 && request.method === 'GET') {
			const cache = await caches.open(CACHE_NAME);
			// Clone erstellen da Response nur einmal gelesen werden kann
			cache.put(request, response.clone());
		}
		
		return response;
	} catch (error) {
		// Bei Offline: gecachte Response zurückgeben (falls vorhanden)
		const cachedResponse = await caches.match(request);
		if (cachedResponse) {
			return cachedResponse;
		}
		
		// Offline-Antwort für API
		return new Response(
			JSON.stringify({ error: 'Offline - Please try again when online' }),
			{
				status: 503,
				statusText: 'Service Unavailable',
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
}

// Static Assets handhaben
async function handleStaticAsset(request) {
	// Cache-first für statische Assets
	const cachedResponse = await caches.match(request);
	if (cachedResponse) {
		return cachedResponse;
	}
	
	try {
		const response = await fetch(request);
		
		// Bei Erfolg: Cache aktualisieren
		if (response.status === 200) {
			const cache = await caches.open(CACHE_NAME);
			cache.put(request, response.clone());
		}
		
		return response;
	} catch (error) {
		// Bei Offline und nicht im Cache: Default-Response
		return new Response('Asset not available offline', { status: 404 });
	}
}

// Default Request handhaben
async function handleDefault(request) {
	try {
		const response = await fetch(request);
		return response;
	} catch (error) {
		const cachedResponse = await caches.match(request);
		return cachedResponse || new Response('Offline', { status: 503 });
	}
}

// Prüfen ob URL ein statisches Asset ist
function isStaticAsset(url) {
	const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'];
	return staticExtensions.some(ext => url.includes(ext));
}

// Background Sync für Offline-Aktionen
self.addEventListener('sync', (event) => {
	if (event.tag === 'background-sync') {
		event.waitUntil(handleBackgroundSync());
	}
});

async function handleBackgroundSync() {
	// Hier können Offline-Aktionen synchronisiert werden
	console.log('Service Worker: Background sync triggered');
	
	// Beispiel: Gespeicherte Links hochladen
	try {
		const pendingLinks = await getPendingLinks();
		for (const link of pendingLinks) {
			await syncLink(link);
		}
	} catch (error) {
		console.error('Background sync failed:', error);
	}
}

// Push Notifications (für zukünftige Features)
self.addEventListener('push', (event) => {
	if (event.data) {
		const data = event.data.json();
		
		const options = {
			body: data.body,
			icon: '/icons/icon-192x192.png',
			badge: '/icons/icon-72x72.png',
			tag: 'uload-notification',
			renotify: true,
			actions: [
				{
					action: 'view',
					title: 'View'
				},
				{
					action: 'dismiss',
					title: 'Dismiss'
				}
			]
		};
		
		event.waitUntil(
			self.registration.showNotification(data.title || 'uLoad', options)
		);
	}
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	
	if (event.action === 'view') {
		event.waitUntil(
			clients.openWindow('/')
		);
	}
});

// Helper Funktionen für IndexedDB (für Offline-Speicher)
function getPendingLinks() {
	// Implementierung für IndexedDB
	return Promise.resolve([]);
}

function syncLink(link) {
	// Implementierung für Link-Synchronisation
	return Promise.resolve();
}