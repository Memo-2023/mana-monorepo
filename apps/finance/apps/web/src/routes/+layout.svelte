<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';

	let { children } = $props();

	let isAppSliderOpen = $state(false);
	let isDark = $state(false);

	const navItems = [
		{ href: '/', label: 'Dashboard', icon: 'home' },
		{ href: '/transactions', label: 'Transaktionen', icon: 'list' },
		{ href: '/accounts', label: 'Konten', icon: 'wallet' },
		{ href: '/categories', label: 'Kategorien', icon: 'tag' },
		{ href: '/budgets', label: 'Budgets', icon: 'pie-chart' },
		{ href: '/reports', label: 'Berichte', icon: 'bar-chart' },
		{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
	];

	onMount(() => {
		authStore.init();
		// Check for dark mode preference
		isDark =
			document.documentElement.classList.contains('dark') ||
			(!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
		if (isDark) {
			document.documentElement.classList.add('dark');
		}
	});

	function toggleTheme() {
		isDark = !isDark;
		if (isDark) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('theme', 'light');
		}
	}

	function isActive(href: string) {
		if (href === '/') {
			return $page.url.pathname === '/';
		}
		return $page.url.pathname.startsWith(href);
	}
</script>

<div class="min-h-screen bg-background text-foreground">
	<!-- Header -->
	<header class="sticky top-0 z-50 border-b border-border bg-card">
		<div class="container mx-auto flex h-16 items-center justify-between px-4">
			<div class="flex items-center gap-4">
				<button
					onclick={() => (isAppSliderOpen = true)}
					class="flex items-center gap-2 rounded-lg p-2 hover:bg-accent"
					aria-label="Open app menu"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="3" y="3" width="7" height="7" />
						<rect x="14" y="3" width="7" height="7" />
						<rect x="14" y="14" width="7" height="7" />
						<rect x="3" y="14" width="7" height="7" />
					</svg>
				</button>

				<a href="/" class="flex items-center gap-2 font-semibold">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="text-primary"
					>
						<line x1="12" y1="1" x2="12" y2="23" />
						<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
					</svg>
					<span>Finance</span>
				</a>
			</div>

			<nav class="hidden md:flex items-center gap-1">
				{#each navItems as item}
					<a
						href={item.href}
						class="px-3 py-2 rounded-md text-sm font-medium transition-colors {isActive(item.href)
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:bg-accent hover:text-foreground'}"
					>
						{item.label}
					</a>
				{/each}
			</nav>

			<div class="flex items-center gap-2">
				<LanguageSelector />
				<button
					onclick={toggleTheme}
					class="rounded-lg p-2 hover:bg-accent"
					aria-label="Toggle theme"
				>
					{#if isDark}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="12" cy="12" r="5"></circle>
							<line x1="12" y1="1" x2="12" y2="3"></line>
							<line x1="12" y1="21" x2="12" y2="23"></line>
							<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
							<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
							<line x1="1" y1="12" x2="3" y2="12"></line>
							<line x1="21" y1="12" x2="23" y2="12"></line>
							<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
							<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
						</svg>
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
						</svg>
					{/if}
				</button>
			</div>
		</div>
	</header>

	<!-- Mobile Navigation -->
	<nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
		<div class="flex justify-around py-2">
			{#each navItems.slice(0, 5) as item}
				<a
					href={item.href}
					class="flex flex-col items-center p-2 text-xs {isActive(item.href)
						? 'text-primary'
						: 'text-muted-foreground'}"
				>
					<span class="mb-1">{item.label}</span>
				</a>
			{/each}
		</div>
	</nav>

	<!-- Main Content -->
	<main class="container mx-auto px-4 py-6 pb-20 md:pb-6">
		{@render children()}
	</main>
</div>

<AppSlider bind:isOpen={isAppSliderOpen} />
