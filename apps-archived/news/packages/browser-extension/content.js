// Content script to sync localStorage with Chrome storage
console.log('🥥 Kokon content script loaded on:', window.location.href);

// Function to sync localStorage to Chrome storage
function syncToChrome(key, value) {
	if (chrome && chrome.storage) {
		chrome.storage.local
			.set({ [key]: value })
			.then(() => {
				console.log('Content script: Successfully synced to Chrome storage:', key);
			})
			.catch((error) => {
				console.error('Content script: Failed to sync to Chrome storage:', error);
			});
	}
}

// Function to sync removal from localStorage to Chrome storage
function removeFromChrome(key) {
	if (chrome && chrome.storage) {
		chrome.storage.local
			.remove([key])
			.then(() => {
				console.log('Content script: Successfully removed from Chrome storage:', key);
			})
			.catch((error) => {
				console.error('Content script: Failed to remove from Chrome storage:', error);
			});
	}
}

// Listen for localStorage changes and sync to Chrome storage
function setupStorageSync() {
	console.log('🥥 Setting up storage sync...');

	// The actual Supabase auth token key
	const SUPABASE_AUTH_KEY = 'sb-hepsjdbvpkumaoabbycd-auth-token';

	// Override localStorage.setItem to sync
	const originalSetItem = localStorage.setItem;
	localStorage.setItem = function (key, value) {
		console.log('🥥 localStorage.setItem called:', key);
		originalSetItem.call(this, key, value);
		if (key === SUPABASE_AUTH_KEY) {
			console.log('🥥 Detected supabase token change, syncing...');
			// Store with standardized key for extension
			syncToChrome('supabase.auth.token', value);
		}
	};

	// Override localStorage.removeItem to sync
	const originalRemoveItem = localStorage.removeItem;
	localStorage.removeItem = function (key) {
		console.log('🥥 localStorage.removeItem called:', key);
		originalRemoveItem.call(this, key);
		if (key === SUPABASE_AUTH_KEY) {
			console.log('🥥 Detected supabase token removal, syncing...');
			removeFromChrome('supabase.auth.token');
		}
	};

	// Check for existing token on page load
	const existingToken = localStorage.getItem(SUPABASE_AUTH_KEY);
	console.log('🥥 Checking for existing token:', existingToken ? 'Found' : 'Not found');
	if (existingToken) {
		console.log('🥥 Found existing token, syncing...');
		syncToChrome('supabase.auth.token', existingToken);
	}

	// Also check all localStorage keys
	console.log('🥥 All localStorage keys:', Object.keys(localStorage));
}

// Set up the sync when the page loads
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', setupStorageSync);
} else {
	setupStorageSync();
}

// Also listen for storage events (in case other tabs make changes)
window.addEventListener('storage', (e) => {
	if (e.key === 'sb-hepsjdbvpkumaoabbycd-auth-token') {
		console.log('🥥 Storage event detected for supabase token');
		if (e.newValue) {
			syncToChrome('supabase.auth.token', e.newValue);
		} else {
			removeFromChrome('supabase.auth.token');
		}
	}
});
