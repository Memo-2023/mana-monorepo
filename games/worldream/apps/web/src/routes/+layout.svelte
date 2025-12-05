<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import { createClient } from '$lib/supabase/client';
	import { invalidateAll, goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { currentWorld } from '$lib/stores/worldContext';
	import { theme } from '$lib/themes/themeStore';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
	import GlobalAiAuthorBar from '$lib/components/GlobalAiAuthorBar.svelte';

	let { children, data } = $props();

	const supabase = createClient();
	let navHidden = $state(false);

	// Check if we're on a world or place detail page that needs transparent background
	let isTransparentPage = $derived(
		(() => {
			const path = $page.url.pathname;
			// Check for world detail pages: /worlds/[slug]
			if (path.match(/^\/worlds\/[^\/]+$/)) {
				return true;
			}
			// Check for place detail pages: /worlds/[world]/places/[slug]
			if (path.match(/^\/worlds\/[^\/]+\/places\/[^\/]+$/)) {
				return true;
			}
			return false;
		})()
	);

	$effect(() => {
		// Set transparent background on body for world/place detail pages
		if (typeof document !== 'undefined') {
			if (isTransparentPage) {
				document.body.style.backgroundColor = 'transparent';
				document.documentElement.style.backgroundColor = 'transparent';
			} else {
				document.body.style.backgroundColor = '';
				document.documentElement.style.backgroundColor = '';
			}
		}
	});

	$effect(() => {
		// Extract world slug from URL if present
		const pathSegments = $page.url.pathname.split('/');
		if (pathSegments[1] === 'worlds' && pathSegments[2] && pathSegments[2] !== 'new') {
			// We're in a world context, ensure it's set
			const worldSlug = pathSegments[2];
			if (!$currentWorld || $currentWorld.slug !== worldSlug) {
				// Load world data if not in store
				loadWorld(worldSlug);
			}
		}
	});

	async function loadWorld(slug: string) {
		const response = await fetch(`/api/nodes/${slug}`);
		if (response.ok) {
			const world = await response.json();
			if (world.kind === 'world') {
				currentWorld.setWorld(world);
			}
		}
	}

	function exitWorld() {
		currentWorld.clearWorld();
		goto('/');
	}

	onMount(() => {
		theme.init();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(() => {
			invalidateAll();
		});

		// Auto-hide navigation on scroll for all pages
		let lastScrollY = window.scrollY;
		let ticking = false;
		let mouseTimer: number | null = null;

		function handleScroll() {
			if (!ticking) {
				window.requestAnimationFrame(() => {
					const currentScrollY = window.scrollY;

					// Different behavior for transparent vs normal pages
					if (isTransparentPage) {
						// Hide nav when at top of page (to show full image)
						if (currentScrollY < 100) {
							navHidden = true;
						} else {
							navHidden = false;
						}
					} else {
						// Hide nav when scrolling down, show when scrolling up
						if (currentScrollY > lastScrollY && currentScrollY > 100) {
							navHidden = true;
						} else {
							navHidden = false;
						}
					}

					lastScrollY = currentScrollY;
					ticking = false;
				});
				ticking = true;
			}
		}

		function handleMouseMove(e: MouseEvent) {
			// Show nav when mouse is near top of screen
			if (e.clientY < 100) {
				navHidden = false;

				// Clear existing timer
				if (mouseTimer) {
					clearTimeout(mouseTimer);
				}

				// Hide again after 3 seconds if conditions are met
				mouseTimer = window.setTimeout(() => {
					const currentScrollY = window.scrollY;
					if (isTransparentPage && currentScrollY < 100) {
						navHidden = true;
					} else if (!isTransparentPage && currentScrollY > 100) {
						navHidden = true;
					}
				}, 3000);
			}
		}

		window.addEventListener('scroll', handleScroll);
		window.addEventListener('mousemove', handleMouseMove);

		return () => {
			subscription.unsubscribe();
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('mousemove', handleMouseMove);
			if (mouseTimer) {
				clearTimeout(mouseTimer);
			}
		};
	});

	onDestroy(() => {
		// Reset background when component is destroyed
		if (typeof document !== 'undefined') {
			document.body.style.backgroundColor = '';
			document.documentElement.style.backgroundColor = '';
		}
	});

	// Navigation changes based on world context
	let navigation = $derived(
		$currentWorld
			? [
					{ name: 'Stories', href: `/worlds/${$currentWorld.slug}/stories`, kind: 'story' },
					{
						name: 'Charaktere',
						href: `/worlds/${$currentWorld.slug}/characters`,
						kind: 'character',
					},
					{ name: 'Orte', href: `/worlds/${$currentWorld.slug}/places`, kind: 'place' },
					{ name: 'Objekte', href: `/worlds/${$currentWorld.slug}/objects`, kind: 'object' },
					{ name: 'Welt', href: `/worlds/${$currentWorld.slug}`, kind: 'world' },
				]
			: [{ name: 'Welten', href: '/', kind: 'world' }]
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div
	class="min-h-screen {isTransparentPage ? 'bg-transparent' : 'bg-theme-base'} transition-colors"
>
	<nav
		class="fixed top-0 left-0 right-0 z-50 border-b border-theme-border-subtle bg-theme-surface shadow-sm transition-all duration-300 {navHidden
			? '-translate-y-full'
			: 'translate-y-0'}"
	>
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 justify-between">
				<div class="flex">
					<div class="flex flex-shrink-0 items-center">
						<a href="/" class="text-xl font-bold text-theme-primary-600">Worldream</a>
						{#if $currentWorld}
							<span class="ml-2 text-theme-text-tertiary">/</span>
							<span class="ml-2 text-lg font-semibold text-theme-text-primary"
								>{$currentWorld.title}</span
							>
						{/if}
					</div>
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
						{#each navigation as item}
							<a
								href={item.href}
								class="inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium {// Exact match
								$page.url.pathname === item.href ||
								// For non-world items, check if path starts with href
								(item.kind !== 'world' && $page.url.pathname.startsWith(item.href + '/'))
									? 'border-theme-primary-500 text-theme-text-primary'
									: 'border-transparent text-theme-text-secondary hover:border-theme-border-subtle hover:text-theme-text-primary'}"
							>
								{item.name}
							</a>
						{/each}
					</div>
				</div>
				<div class="flex items-center space-x-4">
					{#if $currentWorld}
						<button
							onclick={exitWorld}
							class="border-theme-border-default inline-flex items-center rounded-md border bg-theme-surface px-3 py-1 text-sm font-medium text-theme-text-primary hover:bg-theme-interactive-hover"
						>
							<svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
								/>
							</svg>
							Welt verlassen
						</button>
					{/if}
					<!-- Theme Switcher -->
					<ThemeSwitcher />

					{#if data.user}
						<a
							href="/database"
							class="rounded-lg p-2 text-theme-text-secondary transition-colors hover:bg-theme-interactive-hover hover:text-theme-text-primary"
							aria-label="Datenbankstruktur"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
								/>
							</svg>
						</a>
						<a
							href="/settings"
							class="rounded-lg p-2 text-theme-text-secondary transition-colors hover:bg-theme-interactive-hover hover:text-theme-text-primary"
							aria-label="Einstellungen"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
						</a>
					{:else}
						<a
							href="/auth/login"
							class="text-sm text-theme-primary-600 hover:text-theme-primary-500"
						>
							Anmelden
						</a>
					{/if}
				</div>
			</div>
		</div>
	</nav>

	<!-- Nav spacer for all pages since nav is fixed -->
	<div class="h-16"></div>

	<main class={isTransparentPage ? '' : 'mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'}>
		{@render children?.()}
	</main>

	<LoadingOverlay />
	<GlobalAiAuthorBar />
</div>
