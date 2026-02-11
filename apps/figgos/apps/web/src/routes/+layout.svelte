<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';

	let { children } = $props();

	let isCreate = $derived(page.url.pathname === '/');
	let isCollection = $derived(page.url.pathname === '/collection');
</script>

<svelte:head>
	<title>Figgos</title>
</svelte:head>

<div class="min-h-dvh bg-background text-foreground">
	<!-- Tab Navigation -->
	<nav class="fixed bottom-0 left-0 right-0 z-50 border-t-3 border-border bg-surface">
		<div class="mx-auto flex max-w-md items-center justify-around py-2">
			<a
				href="/"
				class="flex flex-col items-center gap-1 px-6 py-2 transition-opacity hover:opacity-80 {isCreate
					? 'text-primary'
					: 'text-muted-foreground hover:text-primary'}"
			>
				<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
					<path
						d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
					/>
				</svg>
				<span class="text-xs font-black uppercase tracking-wider">Create</span>
			</a>
			<a
				href="/collection"
				class="flex flex-col items-center gap-1 px-6 py-2 transition-opacity hover:opacity-80 {isCollection
					? 'text-primary'
					: 'text-muted-foreground hover:text-primary'}"
			>
				<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
					<path
						d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"
					/>
				</svg>
				<span class="text-xs font-black uppercase tracking-wider">Collection</span>
			</a>
		</div>
	</nav>

	<!-- Page Content -->
	<main class="pb-24">
		{@render children()}
	</main>
</div>
