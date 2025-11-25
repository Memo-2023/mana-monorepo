<script lang="ts">
	import { page } from '$app/stores';
	import * as m from '$paraglide/messages';
	import { onMount } from 'svelte';
	import { themeStore } from '$lib/themes/theme-store';
	import { themes } from '$lib/themes/presets';
	import WorkspaceSwitcher from './WorkspaceSwitcher.svelte';
	import NotificationBell from './NotificationBell.svelte';
	import { activeWorkspace } from '$lib/stores/activeWorkspace';

	interface Props {
		user?: {
			email: string;
			username?: string;
		} | null;
	}

	let { user }: Props = $props();
	let collapsed = $state(false);
	let mounted = $state(false);
	let showThemeDropdown = $state(false);
	
	// Subscribe to workspace stores for reactive URL updates
	let currentWorkspaceId = $state(activeWorkspace.getId());
	let currentWorkspaceData = $state(activeWorkspace.getData());
	
	// Subscribe to changes
	$effect(() => {
		const unsubId = activeWorkspace.id.subscribe(id => {
			currentWorkspaceId = id;
		});
		const unsubData = activeWorkspace.data.subscribe(data => {
			currentWorkspaceData = data;
		});
		
		return () => {
			unsubId();
			unsubData();
		};
	});
	
	// Reactive URL builder
	function buildUrl(path: string): string {
		if (currentWorkspaceId && !path.includes('workspace=')) {
			const separator = path.includes('?') ? '&' : '?';
			return `${path}${separator}workspace=${currentWorkspaceId}`;
		}
		return path;
	}
	
	let themeDropdownElement: HTMLDivElement;

	function isActive(path: string): boolean {
		const currentPath = $page.url.pathname;
		const cleanPath = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath;
		const cleanHref = path.endsWith('/') ? path.slice(0, -1) : path;
		return cleanPath === cleanHref;
	}

	function toggleCollapse() {
		collapsed = !collapsed;
		if (typeof window !== 'undefined') {
			localStorage.setItem('sidebar-collapsed', collapsed.toString());
			// Dispatch storage event for other components
			window.dispatchEvent(new Event('storage'));
		}
	}

	function toggleThemeDropdown(event: MouseEvent) {
		event.stopPropagation();
		showThemeDropdown = !showThemeDropdown;
	}

	function selectTheme(themeId: string, event: MouseEvent) {
		event.stopPropagation();
		themeStore.setPreset(themeId);
		showThemeDropdown = false;
	}

	function toggleDarkMode(event: MouseEvent) {
		event.stopPropagation();
		themeStore.toggle();
	}

	function handleClickOutside(event: MouseEvent) {
		if (themeDropdownElement && !themeDropdownElement.contains(event.target as Node)) {
			showThemeDropdown = false;
		}
	}

	$effect(() => {
		if (showThemeDropdown) {
			const timer = setTimeout(() => {
				document.addEventListener('click', handleClickOutside);
			}, 0);

			return () => {
				clearTimeout(timer);
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});

	onMount(() => {
		mounted = true;
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('sidebar-collapsed');
			if (stored !== null) {
				collapsed = stored === 'true';
			}
		}
	});
</script>

{#if user && mounted}
	<aside
		class="sidebar-transition animate-slide-in fixed top-4 bottom-4 left-4 z-40 hidden flex-col lg:flex"
		class:w-64={!collapsed}
		class:w-20={collapsed}
	>
		<!-- Glassmorphism Background -->
		<div
			class="absolute inset-0 rounded-2xl border transition-all duration-300 {collapsed
				? 'border-transparent bg-transparent shadow-none backdrop-blur-none'
				: 'border-theme-border/30 bg-theme-surface/80 shadow-2xl backdrop-blur-xl'}"
		></div>

		<!-- Content Container -->
		<div class="relative flex h-full flex-col p-4">
			<!-- Logo Section -->
			<div class="mb-8" class:flex={!collapsed} class:flex-col={collapsed} class:items-center={collapsed} class:justify-between={!collapsed}>
				<a
					href="/"
					class="flex items-center gap-3 transition-opacity hover:opacity-80"
					class:justify-center={collapsed}
					class:mb-4={collapsed}
					title="uload"
				>
					<svg
						class="h-8 w-8 flex-shrink-0 text-theme-primary"
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
					{#if !collapsed}
						<span class="text-transition text-xl font-bold text-theme-text">uload</span>
					{/if}
				</a>

				<!-- Collapse Toggle -->
				<button
					onclick={toggleCollapse}
					class="rounded-lg p-2 text-theme-text-muted transition-colors hover:bg-theme-surface-hover hover:text-theme-text"
					class:mx-auto={collapsed}
					aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				>
					<svg
						class="icon-transition h-5 w-5"
						class:rotate-180={collapsed}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
						/>
					</svg>
				</button>
			</div>

			<!-- Notifications & Account Switcher -->
			{#if !collapsed}
				<div class="mb-6 space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-xs font-medium text-theme-text-muted uppercase tracking-wider">Benachrichtigungen</span>
						<NotificationBell position="left-outside" />
					</div>
					<WorkspaceSwitcher position="left-outside" />
				</div>
			{:else}
				<div class="mb-6 flex justify-center">
					<NotificationBell position="left-outside" />
				</div>
			{/if}

			<!-- Navigation Items -->
			<nav class="flex-1 space-y-1">
				<a
					href={buildUrl('/my/links')}
					class="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-theme-surface-hover {isActive(
						'/my/links'
					)
						? 'active bg-theme-surface-hover'
						: ''}"
					title={collapsed ? 'Links' : undefined}
				>
					<span class="active-indicator"></span>
					<svg
						class="h-5 w-5 flex-shrink-0 text-theme-text-muted group-hover:text-theme-text"
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
					{#if !collapsed}
						<span class="text-transition font-medium text-theme-text">Links</span>
					{/if}
				</a>

				<a
					href={buildUrl('/my/cards')}
					class="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-theme-surface-hover {isActive(
						'/my/cards'
					)
						? 'active bg-theme-surface-hover'
						: ''}"
					title={collapsed ? 'Cards' : undefined}
				>
					<span class="active-indicator"></span>
					<svg
						class="h-5 w-5 flex-shrink-0 text-theme-text-muted group-hover:text-theme-text"
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
					{#if !collapsed}
						<span class="text-transition font-medium text-theme-text">Cards</span>
					{/if}
				</a>

				<a
					href={buildUrl('/my/tags')}
					class="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-theme-surface-hover {isActive(
						'/my/tags'
					)
						? 'active bg-theme-surface-hover'
						: ''}"
					title={collapsed ? 'Tags' : undefined}
				>
					<span class="active-indicator"></span>
					<svg
						class="h-5 w-5 flex-shrink-0 text-theme-text-muted group-hover:text-theme-text"
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
					{#if !collapsed}
						<span class="text-transition font-medium text-theme-text">Tags</span>
					{/if}
				</a>

				<a
					href="/template-store"
					class="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-theme-surface-hover {isActive(
						'/template-store'
					)
						? 'active bg-theme-surface-hover'
						: ''}"
					title={collapsed ? 'Templates' : undefined}
				>
					<span class="active-indicator"></span>
					<svg
						class="h-5 w-5 flex-shrink-0 text-theme-text-muted group-hover:text-theme-text"
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
					{#if !collapsed}
						<span class="text-transition font-medium text-theme-text">Templates</span>
					{/if}
				</a>

			</nav>

			<!-- Bottom Section -->
			<div class="mt-auto space-y-2 border-t border-theme-border/30 pt-4">
				<!-- Theme Toggle -->
				<div class="relative" bind:this={themeDropdownElement}>
					<button
						onclick={(e) => toggleThemeDropdown(e)}
						class="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-theme-surface-hover"
						title={collapsed ? 'Theme' : undefined}
					>
						<svg
							class="h-5 w-5 flex-shrink-0 text-theme-text-muted group-hover:text-theme-text"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							{#if themeStore.isDark}
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
								/>
							{:else}
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
								/>
							{/if}
						</svg>
						{#if !collapsed}
							<span class="text-transition font-medium text-theme-text">Theme</span>
						{/if}
					</button>

					{#if showThemeDropdown}
						<div
							class="absolute bottom-0 left-full z-50 ml-2 w-64 rounded-lg border border-theme-border bg-theme-surface shadow-lg"
						>
							<!-- Dark Mode Toggle -->
							<div class="border-b border-theme-border p-3">
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-theme-text">Dark Mode</span>
									<button
										onclick={(e) => toggleDarkMode(e)}
										class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {themeStore.isDark
											? 'bg-theme-accent'
											: 'bg-theme-border'}"
										aria-label="Toggle dark mode"
									>
										<span
											class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {themeStore.isDark
												? 'translate-x-6'
												: 'translate-x-1'}"
										/>
									</button>
								</div>
							</div>

							<!-- Theme Selection -->
							<div class="p-2">
								<p class="mb-2 px-2 text-xs font-medium text-theme-text-muted">Choose Theme</p>
								<div class="space-y-1">
									{#each Object.values(themes) as theme}
										<button
											onclick={(e) => selectTheme(theme.id, e)}
											class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors hover:bg-theme-surface-hover {themeStore.preset ===
											theme.id
												? 'bg-theme-surface-hover'
												: ''}"
										>
											<div class="flex items-center gap-3">
												<!-- Theme Preview Colors -->
												<div class="flex gap-1">
													<div
														class="h-4 w-4 rounded-full border border-theme-border"
														style="background-color: {themeStore.isDark
															? theme.colors.dark.primary
															: theme.colors.light.primary}"
													/>
													<div
														class="h-4 w-4 rounded-full border border-theme-border"
														style="background-color: {themeStore.isDark
															? theme.colors.dark.accent
															: theme.colors.light.accent}"
													/>
												</div>
												<div>
													<span class="block text-sm font-medium text-theme-text">{theme.name}</span
													>
													<span class="block text-xs text-theme-text-muted"
														>{theme.description}</span
													>
												</div>
											</div>
											{#if themeStore.preset === theme.id}
												<svg
													class="h-4 w-4 text-theme-accent"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path
														fill-rule="evenodd"
														d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
														clip-rule="evenodd"
													></path>
												</svg>
											{/if}
										</button>
									{/each}
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Settings -->
				<a
					href="/settings"
					class="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-theme-surface-hover {isActive(
						'/settings'
					)
						? 'active bg-theme-surface-hover'
						: ''}"
					title={collapsed ? 'Settings' : undefined}
				>
					<span class="active-indicator"></span>
					<svg
						class="h-5 w-5 flex-shrink-0 text-theme-text-muted group-hover:text-theme-text"
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
					{#if !collapsed}
						<span class="text-transition font-medium text-theme-text">Settings</span>
					{/if}
				</a>

				<!-- Team -->
				<a
					href="/settings/team"
					class="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-theme-surface-hover {isActive(
						'/settings/team'
					)
						? 'active bg-theme-surface-hover'
						: ''}"
					title={collapsed ? 'Team' : undefined}
				>
					<span class="active-indicator"></span>
					<svg
						class="h-5 w-5 flex-shrink-0 text-theme-text-muted group-hover:text-theme-text"
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
					{#if !collapsed}
						<span class="text-transition font-medium text-theme-text">Team</span>
					{/if}
				</a>

				<!-- Pricing -->
				<a
					href="/pricing"
					class="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-theme-surface-hover {isActive(
						'/pricing'
					)
						? 'active bg-theme-surface-hover'
						: ''}"
					title={collapsed ? m.nav_pricing() : undefined}
				>
					<span class="active-indicator"></span>
					<svg
						class="h-5 w-5 flex-shrink-0 text-theme-text-muted group-hover:text-theme-text"
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
					{#if !collapsed}
						<span class="text-transition font-medium text-theme-text"
							>{m.nav_pricing() || 'Pricing'}</span
						>
					{/if}
				</a>

				<!-- Profile -->
				{#if user.username}
					<a
						href="/p/{user.username}"
						target="_blank"
						class="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-theme-surface-hover"
						title={collapsed ? m.nav_profile() : undefined}
					>
						<span class="active-indicator"></span>
						<svg
							class="h-5 w-5 flex-shrink-0 text-theme-text-muted group-hover:text-theme-text"
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
						{#if !collapsed}
							<span class="text-transition font-medium text-theme-text">{m.nav_profile()}</span>
						{/if}
					</a>
				{/if}

				<!-- User Info -->
				{#if !collapsed}
					<div class="truncate px-3 py-2 text-xs text-theme-text-muted">
						{user.email}
					</div>
				{/if}

				<!-- Logout -->
				<form method="POST" action="/login?/logout" class="w-full">
					<button
						type="submit"
						class="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-red-600 transition-all hover:bg-red-600/10 dark:text-red-500"
						title={collapsed ? m.nav_logout() : undefined}
					>
						<svg
							class="h-5 w-5 flex-shrink-0"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
							/>
						</svg>
						{#if !collapsed}
							<span class="text-transition font-medium">{m.nav_logout()}</span>
						{/if}
					</button>
				</form>
			</div>
		</div>
	</aside>
{/if}

<style>
	.sidebar-transition {
		transition:
			width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.icon-transition {
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.text-transition {
		transition:
			opacity 0.2s ease-in-out,
			transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.active-indicator {
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 4px;
		height: 70%;
		background: var(--theme-primary);
		border-radius: 0 4px 4px 0;
		opacity: 0;
		transition: opacity 0.2s ease-in-out;
	}

	.active .active-indicator {
		opacity: 1;
	}

	@keyframes slideIn {
		from {
			transform: translateX(-100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.animate-slide-in {
		animation: slideIn 0.4s ease-out;
	}
</style>
