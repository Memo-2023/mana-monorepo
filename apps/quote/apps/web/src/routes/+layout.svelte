<script lang="ts">
	import { quotesDE, authorsDE, type EnhancedQuote, type Author } from '@quote/shared';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { isSidebarCollapsed } from '$lib/stores/sidebar';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import { page } from '$app/stores';
	import '../app.css';

	// Make data available to all child routes
	export let data: any;

	onMount(() => {
		theme.init();
	});

	// Check if we're on the homepage
	$: isHomePage = $page.url.pathname === '/';
</script>

<Sidebar />
<ToastContainer />

<div class="app" class:sidebar-open={!$isSidebarCollapsed} class:home-page={isHomePage}>
	<main class="main-content" class:home-content={isHomePage}>
		<slot />
	</main>

	{#if !isHomePage}
		<footer>
			<p>&copy; 2025 Zitare App</p>
		</footer>
	{/if}
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		transition: margin-left 0.3s ease;
	}

	/* Desktop: Add margin when sidebar is open */
	@media (min-width: 1024px) {
		.app.sidebar-open {
			margin-left: 272px; /* 256px sidebar + 16px gap */
		}
	}

	/* Mobile: Add top and bottom padding */
	@media (max-width: 1023px) {
		.app {
			padding-top: 64px; /* Header height */
			padding-bottom: 72px; /* Bottom nav height */
		}
	}

	.main-content {
		flex: 1;
		padding: var(--spacing-xl);
		max-width: 1400px;
		width: 100%;
		margin: 0 auto;
	}

	/* Homepage specific styles - no padding, full height */
	.home-content {
		padding: 0;
		max-width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	footer {
		padding: var(--spacing-md) var(--spacing-xl);
		background: rgb(var(--color-surface));
		text-align: center;
		color: rgb(var(--color-text-secondary));
		border-top: 1px solid rgb(var(--color-border));
		margin-top: auto;
	}
</style>
