<script lang="ts">
	import { trackAuth } from '$lib/analytics';
	import ThemeDropdown from '$lib/components/ThemeDropdown.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import WorkspaceSwitcher from '$lib/components/WorkspaceSwitcher.svelte';
	import * as m from '$paraglide/messages';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { themeStore } from '$lib/themes/theme-store';
	import { themes } from '$lib/themes/presets';
	import { toastMessages } from '$lib/services/toast';

	interface Props {
		user?: {
			email: string;
			username?: string;
		} | null;
		currentPath?: string;
	}

	let { user, currentPath = '' }: Props = $props();
	let mobileMenuOpen = $state(false);
	let scrollProgress = $state(0);
	let isInFooter = $state(false);
	let showThemeMenu = $state(false);

	function handleLogout() {
		trackAuth('logout');
		toastMessages.logoutSuccess();
	}

	function toggleThemeMenu() {
		showThemeMenu = !showThemeMenu;
	}

	function selectTheme(themeId: string) {
		themeStore.setPreset(themeId);
		showThemeMenu = false;
	}

	function toggleDarkMode() {
		themeStore.toggle();
	}

	function isActive(path: string): boolean {
		const cleanPath = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath;
		const cleanHref = path.endsWith('/') ? path.slice(0, -1) : path;
		return cleanPath === cleanHref;
	}

	function updateScrollProgress() {
		const footer = document.querySelector('footer');
		const footerHeight = footer ? footer.offsetHeight : 0;
		const totalHeight = document.documentElement.scrollHeight;
		const scrollableHeight = totalHeight - window.innerHeight - footerHeight;
		const scrollPosition = window.scrollY;
		scrollProgress = scrollableHeight > 0 ? Math.min(scrollPosition / scrollableHeight, 1) : 0;

		const footerTop = footer ? footer.getBoundingClientRect().top : Infinity;
		isInFooter = footerTop <= window.innerHeight;
	}

	function getProgressColor(): string {
		if (isInFooter) {
			return 'rgba(148, 163, 184, 0.3)';
		} else if (scrollProgress < 0.25) {
			const t = scrollProgress / 0.25;
			return `rgba(${Math.round(255)}, ${Math.round(0 + 165 * t)}, 0, 0.4)`;
		} else if (scrollProgress < 0.5) {
			const t = (scrollProgress - 0.25) / 0.25;
			return `rgba(255, ${Math.round(165 + 90 * t)}, 0, 0.4)`;
		} else if (scrollProgress < 0.75) {
			const t = (scrollProgress - 0.5) / 0.25;
			return `rgba(${Math.round(255 - 82 * t)}, 255, ${Math.round(47 * t)}, 0.4)`;
		} else {
			const t = (scrollProgress - 0.75) / 0.25;
			return `rgba(${Math.round(173 - 173 * t)}, 255, ${Math.round(47 - 47 * t)}, 0.4)`;
		}
	}

	onMount(() => {
		updateScrollProgress();
		window.addEventListener('scroll', updateScrollProgress);
		return () => window.removeEventListener('scroll', updateScrollProgress);
	});

	$effect(() => {
		if (mobileMenuOpen) {
			if (typeof document !== 'undefined') {
				document.body.style.overflow = 'hidden';
				const main = document.querySelector('main');
				const footer = document.querySelector('footer');
				if (main) main.classList.add('brightness-[0.3]', 'transition-all', 'duration-200');
				if (footer) footer.classList.add('brightness-[0.3]', 'transition-all', 'duration-200');
			}
		} else {
			if (typeof document !== 'undefined') {
				document.body.style.overflow = '';
				const main = document.querySelector('main');
				const footer = document.querySelector('footer');
				if (main) main.classList.remove('brightness-[0.3]');
				if (footer) footer.classList.remove('brightness-[0.3]');
			}
		}
	});
</script>

<!-- Desktop Navigation -->
<nav
	class="bg-theme-surface/80 sticky top-0 z-50 hidden border-b border-theme-border shadow-sm backdrop-blur-xl md:block"
>
	<div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			<!-- Logo -->
			<div class="z-10 flex-shrink-0">
				<a href="/" class="flex items-center space-x-2 transition-opacity hover:opacity-80">
					<svg
						class="h-8 w-8 text-theme-primary"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
						/>
					</svg>
					<span class="text-xl font-bold text-theme-text">uload</span>
				</a>
			</div>

			<!-- Desktop Navigation - Absolutely Centered -->
			<div class="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 xl:flex">
				<div class="flex items-center gap-6">
					{#if user}
						<a
							href="/my/links"
							class="transition-all {isActive('/my/links')
								? 'text-theme-text underline'
								: 'text-theme-text-muted hover:text-theme-text hover:underline'}"
						>
							Links
						</a>
						<a
							href="/my/cards"
							class="transition-all {isActive('/my/cards')
								? 'text-theme-text underline'
								: 'text-theme-text-muted hover:text-theme-text hover:underline'}"
						>
							Cards
						</a>
						<a
							href="/my/tags"
							class="transition-all {isActive('/my/tags')
								? 'text-theme-text underline'
								: 'text-theme-text-muted hover:text-theme-text hover:underline'}"
						>
							Tags
						</a>
						<a
							href="/template-store"
							class="transition-all {isActive('/template-store')
								? 'text-theme-text underline'
								: 'text-theme-text-muted hover:text-theme-text hover:underline'}"
						>
							Templates
						</a>
						<a
							href="/pricing"
							class="transition-all {isActive('/pricing')
								? 'text-theme-text underline'
								: 'text-theme-text-muted hover:text-theme-text hover:underline'}"
						>
							{m.nav_pricing ? m.nav_pricing() : 'Pricing'}
						</a>
						{#if user.username}
							<a
								href="/p/{user.username}"
								target="_blank"
								class="text-theme-text-muted transition-all hover:text-theme-text hover:underline"
							>
								{m.nav_profile()}
							</a>
						{/if}
					{:else}
						<a
							href="/features"
							class="transition-all {isActive('/features')
								? 'text-theme-text underline'
								: 'text-theme-text-muted hover:text-theme-text hover:underline'}"
						>
							Features
						</a>
						<a
							href="/pricing"
							class="transition-all {isActive('/pricing')
								? 'text-theme-text underline'
								: 'text-theme-text-muted hover:text-theme-text hover:underline'}"
						>
							{m.nav_pricing ? m.nav_pricing() : 'Pricing'}
						</a>
						<a
							href="/blog"
							class="transition-all {isActive('/blog')
								? 'text-theme-text underline'
								: 'text-theme-text-muted hover:text-theme-text hover:underline'}"
						>
							Blog
						</a>
						<a
							href="/about"
							class="transition-all {isActive('/about')
								? 'text-theme-text underline'
								: 'text-theme-text-muted hover:text-theme-text hover:underline'}"
						>
							About
						</a>
					{/if}
				</div>
			</div>

			<!-- Right side: Actions -->
			<div class="z-10 flex flex-shrink-0 items-center gap-2">
				{#if !user}
					<a
						href="/login"
						class="rounded-lg px-4 py-2 text-theme-text-muted transition-colors hover:bg-theme-surface-hover hover:text-theme-text"
					>
						{m.nav_login()}
					</a>
					<a
						href="/register"
						class="rounded-lg bg-theme-primary px-6 py-2 font-medium text-theme-background transition-colors hover:bg-theme-primary-hover"
					>
						{m.nav_register()}
					</a>
				{:else}
					<!-- Account Switcher for logged-in users -->
					<WorkspaceSwitcher />
				{/if}

				<LanguageSwitcher />
				<ThemeDropdown />

				<!-- Menu Button -->
				<button
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					class="rounded-lg p-2 text-theme-text-muted transition-colors hover:bg-theme-surface-hover hover:text-theme-text xl:hidden"
					aria-label="Menu"
					aria-expanded={mobileMenuOpen}
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{#if mobileMenuOpen}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						{:else}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h16M4 18h16"
							/>
						{/if}
					</svg>
				</button>
			</div>
		</div>
	</div>
</nav>

<!-- Mobile Navigation - Bottom Pill -->
<nav
	class="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 md:hidden"
	style="--scroll-progress: {scrollProgress}; --progress-color: {getProgressColor()}"
>
	<!-- Progress border layer -->
	<div class="absolute -inset-[5px] z-[-1] overflow-hidden rounded-full p-[5px]">
		<div
			class="scroll-progress-indicator absolute inset-0 rounded-full"
			style="--scroll-progress: {scrollProgress}"
		></div>
	</div>

	<!-- Main navigation content -->
	<div
		class="border-theme-border/20 bg-theme-surface/95 relative z-20 flex overflow-hidden rounded-full border-2 shadow-2xl backdrop-blur-xl transition-all duration-300 before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-t before:from-black/20 before:to-transparent"
	>
		<!-- Left Half: Logo -->
		<a
			href="/"
			class="hover:bg-theme-surface-hover/50 relative z-10 flex flex-1 items-center justify-center gap-2 px-6 py-4 transition-colors"
		>
			<svg class="h-6 w-6 text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
				/>
			</svg>
			<span class="text-lg font-semibold text-theme-text">uload</span>
		</a>

		<!-- Divider -->
		<div class="bg-theme-border/30 relative z-10 w-px"></div>

		<!-- Right Half: Menu -->
		<button
			onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
			class="hover:bg-theme-surface-hover/50 relative z-10 flex flex-1 items-center justify-center gap-2 px-6 py-4 transition-colors"
			aria-label="Menu"
			aria-expanded={mobileMenuOpen}
		>
			<span class="text-lg font-medium text-theme-text">Menu</span>
			<svg class="h-6 w-6 text-theme-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				{#if mobileMenuOpen}
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				{:else}
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				{/if}
			</svg>
		</button>
	</div>
</nav>

<!-- Mobile Menu Backdrop -->
{#if mobileMenuOpen}
	<button
		class="z-35 fixed inset-0 bg-black/40 md:hidden"
		onclick={() => (mobileMenuOpen = false)}
		onkeydown={(e) => e.key === 'Escape' && (mobileMenuOpen = false)}
		aria-label="Close mobile menu"
		style="top: 0;"
	></button>
{/if}

<!-- Mobile Menu - Dropdown from bottom on mobile, from top on tablet/desktop -->
{#if mobileMenuOpen}
	<div
		class="animate-slide-up md:animate-slide-down fixed bottom-[80px] left-1/2 z-40 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 px-4 md:bottom-auto md:top-[65px] md:max-w-md"
	>
		<div
			class="border-theme-border/30 bg-theme-surface/95 flex max-h-[60vh] w-full flex-col overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl"
		>
			<div class="flex-1 overflow-y-auto p-3">
				{#if user}
					<!-- Main Navigation -->
					<div class="pb-1">
						<h3 class="text-theme-text-muted/50 px-3 pb-1 pt-1 text-xs font-normal">Navigation</h3>
						<a
							href="/my/links"
							onclick={() => (mobileMenuOpen = false)}
							class="group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-theme-surface-hover"
						>
							<svg
								class="h-5 w-5 text-theme-text-muted"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
								/>
							</svg>
							<span
								class="text-lg font-medium text-theme-text transition-all duration-300 {isActive(
									'/my/links'
								)
									? 'underline'
									: 'group-hover:underline'}"
							>
								Links
							</span>
						</a>
						<a
							href="/my/cards"
							onclick={() => (mobileMenuOpen = false)}
							class="group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-theme-surface-hover"
						>
							<svg
								class="h-5 w-5 text-theme-text-muted"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
								/>
							</svg>
							<span
								class="text-lg font-medium text-theme-text transition-all duration-300 {isActive(
									'/my/cards'
								)
									? 'underline'
									: 'group-hover:underline'}"
							>
								Profile Cards
							</span>
						</a>
						<a
							href="/my/tags"
							onclick={() => (mobileMenuOpen = false)}
							class="group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-theme-surface-hover"
						>
							<svg
								class="h-5 w-5 text-theme-text-muted"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
								/>
							</svg>
							<span
								class="text-lg font-medium text-theme-text transition-all duration-300 {isActive(
									'/my/tags'
								)
									? 'underline'
									: 'group-hover:underline'}"
							>
								Tags
							</span>
						</a>
						<a
							href="/template-store"
							onclick={() => (mobileMenuOpen = false)}
							class="group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-theme-surface-hover"
						>
							<svg
								class="h-5 w-5 text-theme-text-muted"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
								/>
							</svg>
							<span
								class="text-lg font-medium text-theme-text transition-all duration-300 {isActive(
									'/template-store'
								)
									? 'underline'
									: 'group-hover:underline'}"
							>
								Templates
							</span>
						</a>
						<a
							href="/pricing"
							onclick={() => (mobileMenuOpen = false)}
							class="group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-theme-surface-hover"
						>
							<svg
								class="h-5 w-5 text-theme-text-muted"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<span
								class="text-lg font-medium text-theme-text transition-all duration-300 {isActive(
									'/pricing'
								)
									? 'underline'
									: 'group-hover:underline'}"
							>
								{m.nav_pricing ? m.nav_pricing() : 'Pricing'}
							</span>
						</a>
						{#if user.username}
							<a
								href="/p/{user.username}"
								onclick={() => (mobileMenuOpen = false)}
								target="_blank"
								class="group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-theme-surface-hover"
							>
								<svg
									class="h-5 w-5 text-theme-text-muted"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
									/>
								</svg>
								<span
									class="text-lg font-medium text-theme-text transition-all duration-300 group-hover:underline"
								>
									{m.nav_profile()}
								</span>
							</a>
						{/if}
					</div>

					<!-- Account Section -->
					<div class="pb-1 pt-2">
						<h3 class="text-theme-text-muted/50 px-3 pb-1 pt-1 text-xs font-normal">Account</h3>
						<a
							href="/settings"
							onclick={() => (mobileMenuOpen = false)}
							class="group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-theme-surface-hover"
						>
							<svg
								class="h-5 w-5 text-theme-text-muted"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
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
							<span
								class="text-lg font-medium text-theme-text transition-all duration-300 {isActive(
									'/settings'
								)
									? 'underline'
									: 'group-hover:underline'}"
							>
								Settings
							</span>
						</a>

						<a
							href="/settings/team"
							onclick={() => (mobileMenuOpen = false)}
							class="group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-theme-surface-hover"
						>
							<svg
								class="h-5 w-5 text-theme-text-muted"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
								/>
							</svg>
							<span
								class="text-lg font-medium text-theme-text transition-all duration-300 {isActive(
									'/settings/team'
								)
									? 'underline'
									: 'group-hover:underline'}"
							>
								Team
							</span>
						</a>
					</div>

					<!-- Settings Section -->
					<div class="border-theme-border/30 border-t pb-1 pt-2">
						<h3 class="text-theme-text-muted/50 px-3 pb-1 pt-1 text-xs font-normal">Preferences</h3>
						<div
							class="group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-theme-surface-hover"
						>
							<svg
								class="h-5 w-5 text-theme-text-muted"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9m12 0v6m0 6v4"
								/>
							</svg>
							<span class="flex-1 text-lg font-medium text-theme-text">Theme</span>
							<ThemeDropdown />
						</div>
						<div
							class="group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-theme-surface-hover"
						>
							<svg
								class="h-5 w-5 text-theme-text-muted"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
								/>
							</svg>
							<span class="flex-1 text-lg font-medium text-theme-text">Language</span>
							<LanguageSwitcher />
						</div>
					</div>
				{:else}
					<!-- Guest Navigation -->
					<div class="pb-1">
						<h3 class="text-theme-text-muted/50 px-3 pb-1 pt-1 text-xs font-normal">Navigation</h3>
						<a
							href="/features"
							onclick={() => (mobileMenuOpen = false)}
							class="group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-theme-surface-hover"
						>
							<svg
								class="h-5 w-5 text-theme-text-muted"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
								/>
							</svg>
							<span
								class="text-lg font-medium text-theme-text transition-all duration-300 {isActive(
									'/features'
								)
									? 'underline'
									: 'group-hover:underline'}"
							>
								Features
							</span>
						</a>
						<a
							href="/pricing"
							onclick={() => (mobileMenuOpen = false)}
							class="group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-theme-surface-hover"
						>
							<svg
								class="h-5 w-5 text-theme-text-muted"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<span
								class="text-lg font-medium text-theme-text transition-all duration-300 {isActive(
									'/pricing'
								)
									? 'underline'
									: 'group-hover:underline'}"
							>
								{m.nav_pricing ? m.nav_pricing() : 'Pricing'}
							</span>
						</a>
						<a
							href="/about"
							onclick={() => (mobileMenuOpen = false)}
							class="group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-theme-surface-hover"
						>
							<svg
								class="h-5 w-5 text-theme-text-muted"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<span
								class="text-lg font-medium text-theme-text transition-all duration-300 {isActive(
									'/about'
								)
									? 'underline'
									: 'group-hover:underline'}"
							>
								About
							</span>
						</a>
					</div>

					<!-- Settings Section -->
					<div class="border-theme-border/30 border-t pb-1 pt-2">
						<h3 class="text-theme-text-muted/50 px-3 pb-1 pt-1 text-xs font-normal">Preferences</h3>
						<div
							class="group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-theme-surface-hover"
						>
							<svg
								class="h-5 w-5 text-theme-text-muted"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9m12 0v6m0 6v4"
								/>
							</svg>
							<span class="flex-1 text-lg font-medium text-theme-text">Theme</span>
							<ThemeDropdown />
						</div>
						<div
							class="group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-theme-surface-hover"
						>
							<svg
								class="h-5 w-5 text-theme-text-muted"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
								/>
							</svg>
							<span class="flex-1 text-lg font-medium text-theme-text">Language</span>
							<LanguageSwitcher />
						</div>
					</div>
				{/if}
			</div>

			<!-- Sticky Buttons at bottom -->
			<div class="border-theme-border/30 space-y-2 border-t p-3">
				{#if !user}
					<a
						href="/login"
						class="block w-full rounded-lg bg-theme-surface-hover px-4 py-2 text-center font-medium text-theme-text transition-colors hover:bg-theme-border"
					>
						{m.nav_login()}
					</a>
					<a
						href="/register"
						class="block w-full rounded-lg bg-theme-primary px-4 py-2 text-center font-medium text-theme-background transition-colors hover:bg-theme-primary-hover"
					>
						{m.nav_register()}
					</a>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.scroll-progress-indicator {
		background: conic-gradient(
			from -90deg at 50% 50%,
			var(--progress-color, #ef4444) calc(var(--scroll-progress, 0) * 360deg),
			transparent calc(var(--scroll-progress, 0) * 360deg)
		);
		transition: --progress-color 0.3s ease;
	}

	@keyframes slide-up {
		from {
			transform: translateX(-50%) translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateX(-50%) translateY(0);
			opacity: 1;
		}
	}

	@keyframes slide-down {
		from {
			transform: translateX(-50%) translateY(-20px);
			opacity: 0;
		}
		to {
			transform: translateX(-50%) translateY(0);
			opacity: 1;
		}
	}

	.animate-slide-up {
		animation: slide-up 0.2s ease-out;
	}

	.animate-slide-down {
		animation: slide-down 0.2s ease-out;
	}
</style>
