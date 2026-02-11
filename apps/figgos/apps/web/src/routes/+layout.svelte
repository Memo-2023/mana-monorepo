<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';

	let { children } = $props();

	let path = $derived(page.url.pathname);
</script>

<svelte:head>
	<title>Figgos</title>
</svelte:head>

<div class="min-h-dvh bg-background text-foreground">
	<!-- Tab Navigation (hidden on card detail) -->
	{#if !path.startsWith('/card/')}
		<nav class="fixed bottom-0 left-0 right-0 z-50 border-t-3 border-border bg-surface">
			<div class="mx-auto flex max-w-lg items-center justify-around py-2">
				<a
					href="/"
					class="flex flex-col items-center gap-0.5 px-3 py-2 transition-opacity hover:opacity-80 {path === '/'
						? 'text-primary'
						: 'text-muted-foreground hover:text-primary'}"
				>
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
						/>
					</svg>
					<span class="text-[10px] font-black uppercase tracking-wider">Create</span>
				</a>
				<a
					href="/collection"
					class="flex flex-col items-center gap-0.5 px-3 py-2 transition-opacity hover:opacity-80 {path === '/collection'
						? 'text-primary'
						: 'text-muted-foreground hover:text-primary'}"
				>
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"
						/>
					</svg>
					<span class="text-[10px] font-black uppercase tracking-wider">Collection</span>
				</a>
				<a
					href="/showcase"
					class="flex flex-col items-center gap-0.5 px-3 py-2 transition-opacity hover:opacity-80 {path === '/showcase'
						? 'text-primary'
						: 'text-muted-foreground hover:text-primary'}"
				>
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M2 6h4v11H2zm5-1h4v13H7zm5-1h4v15h-4zm5-1h4v17h-4z" />
					</svg>
					<span class="text-[10px] font-black uppercase tracking-wider">Showcase</span>
				</a>
			</div>
		</nav>
	{/if}

	<!-- Page Content -->
	<main class={path.startsWith('/card/') ? '' : 'pb-24'}>
		{@render children()}
	</main>
</div>
