<script lang="ts">
	import { _ } from 'svelte-i18n';
	import '$lib/i18n';
</script>

<svelte:head>
	<title>{$_('offline.title')} - CityCorners</title>
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center p-6">
	<div class="text-center max-w-md">
		<span class="mb-4 block text-6xl">📡</span>
		<h1 class="text-2xl font-bold text-foreground mb-2">{$_('offline.title')}</h1>
		<p class="text-foreground-secondary mb-6">{$_('offline.message')}</p>
		<button
			class="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
			onclick={() => window.location.reload()}
		>
			{$_('offline.retry')}
		</button>
	</div>
</div>
