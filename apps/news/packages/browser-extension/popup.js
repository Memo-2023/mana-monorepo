// Browser Extension Popup Script for News Hub
document.addEventListener('DOMContentLoaded', async () => {
	const pageTitle = document.getElementById('pageTitle');
	const pageUrl = document.getElementById('pageUrl');
	const saveButton = document.getElementById('saveButton');
	const buttonText = document.getElementById('buttonText');
	const status = document.getElementById('status');
	const loginNotice = document.getElementById('loginNotice');
	const loginLink = document.getElementById('loginLink');

	// API Configuration
	const API_URL = 'http://localhost:3000';
	const APP_URL = 'http://localhost:8081';

	let currentTab = null;
	let authToken = null;

	// Get current tab info
	try {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		currentTab = tab;

		pageTitle.textContent = tab.title || 'Untitled Page';
		pageUrl.textContent = tab.url;
	} catch (error) {
		console.error('Error getting tab info:', error);
		pageTitle.textContent = 'Error loading page info';
		status.textContent = 'Failed to get page information';
		status.className = 'status error';
		return;
	}

	// Check if user is logged in by looking for stored token in Chrome storage
	try {
		const result = await chrome.storage.local.get(['news_hub_auth_token']);
		authToken = result['news_hub_auth_token'];

		console.log('Checking Chrome storage for token...', authToken ? 'Found' : 'Not found');

		if (authToken) {
			// Verify token is still valid by calling session endpoint
			try {
				const response = await fetch(`${API_URL}/auth/session`, {
					headers: {
						Authorization: `Bearer ${authToken}`,
					},
				});

				if (response.ok) {
					saveButton.disabled = false;
					loginNotice.style.display = 'none';
					// Auto-save article immediately
					saveArticle();
				} else {
					// Token is invalid
					await chrome.storage.local.remove(['news_hub_auth_token']);
					authToken = null;
					showLoginNotice();
				}
			} catch (error) {
				console.error('Error verifying token:', error);
				showLoginNotice();
			}
		} else {
			showLoginNotice();
		}
	} catch (error) {
		console.error('Error checking login status:', error);
		showLoginNotice();
	}

	function showLoginNotice() {
		loginNotice.style.display = 'block';
		saveButton.disabled = true;
		status.textContent = 'Please log in to News Hub first';
		status.className = 'status error';
	}

	// Handle login link click
	loginLink.addEventListener('click', (e) => {
		e.preventDefault();
		chrome.tabs.create({ url: APP_URL });
		window.close();
	});

	// Save article function
	async function saveArticle() {
		if (!currentTab || !authToken) {
			status.textContent = 'Please log in first';
			status.className = 'status error';
			return;
		}

		// Validate URL
		const url = currentTab.url;
		if (
			!url ||
			url.startsWith('chrome://') ||
			url.startsWith('chrome-extension://') ||
			url.startsWith('about:')
		) {
			status.textContent = 'Cannot save this type of page';
			status.className = 'status error';
			return;
		}

		// Show loading state
		saveButton.disabled = true;
		buttonText.innerHTML = '<span class="loading"></span>Saving...';
		status.textContent = 'Saving article...';
		status.className = 'status';

		try {
			const response = await fetch(`${API_URL}/extract/save`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${authToken}`,
				},
				body: JSON.stringify({ url: url }),
			});

			const result = await response.json();

			if (response.ok && result.success) {
				status.textContent = 'Article saved!';
				status.className = 'status success';

				// Show success for a moment, then close
				setTimeout(() => {
					window.close();
				}, 1500);
			} else {
				throw new Error(result.message || 'Failed to save article');
			}
		} catch (error) {
			console.error('Error saving article:', error);

			let errorMessage = 'Failed to save article';
			if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
				errorMessage = 'Network error - is the API running?';
			} else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
				errorMessage = 'Session expired - please log in again';
				showLoginNotice();
			} else if (error.message) {
				errorMessage = error.message;
			}

			status.textContent = errorMessage;
			status.className = 'status error';
		} finally {
			// Reset button state
			saveButton.disabled = authToken ? false : true;
			buttonText.textContent = 'Try Again';
		}
	}

	// Handle save button click (manual save if auto-save failed)
	saveButton.addEventListener('click', saveArticle);

	// Listen for storage changes (if user logs in/out in another tab)
	chrome.storage.onChanged.addListener((changes, areaName) => {
		if (areaName === 'local' && changes['news_hub_auth_token']) {
			const newValue = changes['news_hub_auth_token'].newValue;

			if (newValue) {
				authToken = newValue;
				saveButton.disabled = false;
				loginNotice.style.display = 'none';
				status.textContent = '';
				status.className = 'status';
			} else {
				authToken = null;
				showLoginNotice();
			}
		}
	});
});
