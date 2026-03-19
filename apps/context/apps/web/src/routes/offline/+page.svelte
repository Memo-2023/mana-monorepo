<script lang="ts">
	import { onMount } from 'svelte';

	let isOnline = $state(false);

	onMount(() => {
		isOnline = navigator.onLine;

		const handleOnline = () => {
			isOnline = true;
			setTimeout(() => {
				window.location.href = '/';
			}, 1000);
		};

		const handleOffline = () => {
			isOnline = false;
		};

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});
</script>

<svelte:head>
	<title>Offline - Context</title>
</svelte:head>

<div class="min-h-screen bg-slate-900 flex items-center justify-center px-4">
	<div class="text-center max-w-md">
		<div class="mb-8">
			<svg
				class="w-24 h-24 mx-auto text-slate-500"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a5 5 0 01-.354-7.072L8.95 7.636m1.414 5.657L7.535 16.12m8.485 0a5 5 0 01-7.07 0"
				/>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
			</svg>
		</div>

		<h1 class="text-2xl font-bold text-white mb-4">
			{isOnline ? 'Verbindung wiederhergestellt!' : 'Du bist offline'}
		</h1>

		<p class="text-slate-400 mb-8">
			{#if isOnline}
				Du wirst gleich weitergeleitet...
			{:else}
				Einige Funktionen sind offline nicht verfügbar. Bitte überprüfe deine Internetverbindung.
			{/if}
		</p>

		{#if !isOnline}
			<div class="space-y-4">
				<a
					href="/"
					class="inline-flex items-center justify-center px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-colors"
				>
					Zur Startseite
				</a>

				<button
					onclick={() => window.location.reload()}
					class="block w-full px-6 py-3 text-slate-400 hover:text-white transition-colors"
				>
					Erneut versuchen
				</button>
			</div>
		{:else}
			<div class="flex items-center justify-center text-green-400">
				<svg class="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				Weiterleitung...
			</div>
		{/if}
	</div>
</div>
