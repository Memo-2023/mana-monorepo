<script>
	import { onMount } from 'svelte';

	let isOnline = $state(true);

	onMount(() => {
		isOnline = navigator.onLine;

		const updateOnlineStatus = () => {
			isOnline = navigator.onLine;
		};

		window.addEventListener('online', updateOnlineStatus);
		window.addEventListener('offline', updateOnlineStatus);

		return () => {
			window.removeEventListener('online', updateOnlineStatus);
			window.removeEventListener('offline', updateOnlineStatus);
		};
	});

	function retry() {
		if (isOnline) {
			window.location.reload();
		}
	}
</script>

<svelte:head>
	<title>Offline - uLoad</title>
	<meta name="description" content="You are currently offline. Please check your connection." />
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
	<div class="max-w-md w-full text-center">
		<!-- Offline Icon -->
		<div class="mb-8">
			<div class="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
				<svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
						d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
				</svg>
			</div>
		</div>

		<!-- Content -->
		<h1 class="text-3xl font-bold text-gray-900 mb-4">
			You're offline
		</h1>

		<p class="text-gray-600 mb-8">
			It looks like you've lost your internet connection. Don't worry, you can still browse 
			previously visited pages that have been cached.
		</p>

		<!-- Status Indicator -->
		<div class="mb-8">
			<div class="flex items-center justify-center space-x-2">
				<div class="w-3 h-3 rounded-full {isOnline ? 'bg-green-400' : 'bg-red-400'}"></div>
				<span class="text-sm font-medium {isOnline ? 'text-green-600' : 'text-red-600'}">
					{isOnline ? 'Back online!' : 'Offline'}
				</span>
			</div>
		</div>

		<!-- Actions -->
		<div class="space-y-4">
			<button 
				onclick={retry}
				disabled={!isOnline}
				class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
			>
				{isOnline ? 'Retry' : 'Waiting for connection...'}
			</button>

			<a href="/" 
				class="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors">
				Go to Homepage
			</a>
		</div>

		<!-- Tips -->
		<div class="mt-8 text-left">
			<h3 class="font-semibold text-gray-900 mb-3">While you're offline, you can:</h3>
			<ul class="text-sm text-gray-600 space-y-2">
				<li class="flex items-start space-x-2">
					<span class="text-blue-500 mt-1">•</span>
					<span>Browse previously visited pages</span>
				</li>
				<li class="flex items-start space-x-2">
					<span class="text-blue-500 mt-1">•</span>
					<span>View cached link analytics</span>
				</li>
				<li class="flex items-start space-x-2">
					<span class="text-blue-500 mt-1">•</span>
					<span>Check your profile information</span>
				</li>
			</ul>
		</div>

		<!-- Footer -->
		<div class="mt-8 pt-6 border-t border-gray-200">
			<p class="text-xs text-gray-500">
				uLoad works best with a stable internet connection
			</p>
		</div>
	</div>
</div>

<style>
	/* Custom animations for offline state */
	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
	
	.offline-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>