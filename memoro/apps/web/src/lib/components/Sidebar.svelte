<script lang="ts">
	import { page } from '$app/stores';
	import { user } from '$lib/stores/auth';
	import { theme } from '$lib/stores/theme';
	import { Text } from '@manacore/shared-ui';

	interface Props {
		onLogout: () => void;
	}

	let { onLogout }: Props = $props();

	// Load minimized state from localStorage, default to true (minimized)
	let isMinimized = $state(
		typeof localStorage !== 'undefined'
			? (localStorage.getItem('sidebar-minimized') ?? 'true') === 'true'
			: true
	);
	let showShortcuts = $state(false);
	const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
	const modKey = isMac ? '⌘' : 'Ctrl';

	function toggleSidebar() {
		isMinimized = !isMinimized;
		// Save state to localStorage
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('sidebar-minimized', String(isMinimized));
		}
	}

	function isActive(path: string) {
		return $page.url.pathname === path;
	}

	function handleMouseEnter(e: MouseEvent) {
		if (!isMinimized) return;
		const target = e.currentTarget as HTMLElement;
		const tooltip = target.querySelector('.tooltip') as HTMLElement;
		if (tooltip) {
			const rect = target.getBoundingClientRect();
			// Center tooltip vertically - use transform for perfect centering
			tooltip.style.top = `${rect.top + rect.height / 2}px`;
			tooltip.style.transform = 'translateY(-50%)';
		}
	}

	function toggleTheme() {
		theme.toggleMode();
	}

	let currentTheme = $derived($theme);
</script>

<aside
	class="sidebar transition-all duration-300 ease-in-out"
	class:minimized={isMinimized}
>
	<div class="flex h-full flex-col bg-menu border-r border-theme">
		<!-- Logo -->
		<div class="flex items-center p-4 border-b border-theme">
			{#if !isMinimized}
				<a href="/record" class="flex items-center gap-2">
					<svg width="28" height="28" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path fill-rule="evenodd" clip-rule="evenodd" d="M280 140C280 217.32 217.32 280 140 280C62.6801 280 0 217.32 0 140C0 62.6801 62.6801 0 140 0C217.32 0 280 62.6801 280 140ZM247.988 140C247.988 199.64 199.64 241.988 140 241.988C80.3598 241.988 32.0118 199.64 32.0118 140C32.0118 111.918 36.7308 95.3397 54.3005 76.1331C58.5193 71.5212 70.5 63 79.3937 74.511L119.781 131.788C134.5 149 149 147 160.218 131.788L200.605 74.5101C208 64 221.48 71.5203 225.699 76.1321C243.269 95.3388 247.988 111.918 247.988 140Z" fill="#F7D44C"/>
					</svg>
					<Text variant="large" weight="bold" class="text-xl text-white">Memoro</Text>
				</a>
			{:else}
				<a href="/record" class="flex items-center justify-center w-full">
					<svg width="28" height="28" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path fill-rule="evenodd" clip-rule="evenodd" d="M280 140C280 217.32 217.32 280 140 280C62.6801 280 0 217.32 0 140C0 62.6801 62.6801 0 140 0C217.32 0 280 62.6801 280 140ZM247.988 140C247.988 199.64 199.64 241.988 140 241.988C80.3598 241.988 32.0118 199.64 32.0118 140C32.0118 111.918 36.7308 95.3397 54.3005 76.1331C58.5193 71.5212 70.5 63 79.3937 74.511L119.781 131.788C134.5 149 149 147 160.218 131.788L200.605 74.5101C208 64 221.48 71.5203 225.699 76.1321C243.269 95.3388 247.988 111.918 247.988 140Z" fill="#F7D44C"/>
					</svg>
				</a>
			{/if}
		</div>

		<!-- Navigation Links -->
		<nav class="flex-1 overflow-y-auto p-2">
			<div class="space-y-1">
				<a
					href="/record"
					class="nav-item"
					class:active={isActive('/record')}
					title="Aufnehmen"
					onmouseenter={handleMouseEnter}
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
						/>
					</svg>
					{#if !isMinimized}
						<span>Aufnehmen</span>
					{:else}
						<span class="tooltip">Aufnehmen</span>
					{/if}
				</a>

				<a
					href="/memos"
					class="nav-item"
					class:active={isActive('/memos')}
					title="Memos"
					onmouseenter={handleMouseEnter}
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
						/>
					</svg>
					{#if !isMinimized}
						<span>Memos</span>
					{:else}
						<span class="tooltip">Memos</span>
					{/if}
				</a>

			<a
				href="/upload"
				class="nav-item"
				class:active={isActive('/upload')}
				title="Upload"
				onmouseenter={handleMouseEnter}
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
					/>
				</svg>
				{#if !isMinimized}
					<span>Upload</span>
				{:else}
					<span class="tooltip">Upload</span>
				{/if}
			</a>

			<a
				href="/audio-archive"
				class="nav-item"
				class:active={isActive('/audio-archive')}
				title="Audio-Archiv"
				onmouseenter={handleMouseEnter}
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
					/>
				</svg>
				{#if !isMinimized}
					<span>Audio-Archiv</span>
				{:else}
					<span class="tooltip">Audio-Archiv</span>
				{/if}
			</a>

				<a
					href="/tags"
					class="nav-item"
					class:active={isActive('/tags')}
					title="Tags"
					onmouseenter={handleMouseEnter}
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
						/>
					</svg>
					{#if !isMinimized}
						<span>Tags</span>
					{:else}
						<span class="tooltip">Tags</span>
					{/if}
				</a>

				<!-- Spaces temporarily hidden -->
				<!-- <a
					href="/spaces"
					class="nav-item"
					class:active={isActive('/spaces')}
					title="Spaces"
					onmouseenter={handleMouseEnter}
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
						/>
					</svg>
					{#if !isMinimized}
						<span>Spaces</span>
					{:else}
						<span class="tooltip">Spaces</span>
					{/if}
				</a> -->

				<a
					href="/subscription"
					class="nav-item"
					class:active={isActive('/subscription')}
					title="Mana"
					onmouseenter={handleMouseEnter}
				>
					<!-- Mana Icon SVG (from mobile/assets/icons/mana-icon.svg) -->
					<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
						<path d="M12.3047 1C12.3392 1.04573 19.608 10.6706 19.6084 14.6953C19.6084 18.7293 16.3386 21.9998 12.3047 22C8.27061 22 5 18.7294 5 14.6953C5.00041 10.661 12.3047 1 12.3047 1ZM12.3047 7.3916C12.2811 7.42276 8.65234 12.2288 8.65234 14.2393C8.65241 16.2562 10.2877 17.8916 12.3047 17.8916C14.3217 17.8916 15.957 16.2562 15.957 14.2393C15.957 12.2301 12.3331 7.42917 12.3047 7.3916Z" />
					</svg>
					{#if !isMinimized}
						<span>Mana</span>
					{:else}
						<span class="tooltip">Mana</span>
					{/if}
				</a>

				<a
					href="/blueprints"
					class="nav-item"
					class:active={isActive('/blueprints')}
					title="Blueprints"
					onmouseenter={handleMouseEnter}
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					{#if !isMinimized}
						<span>Blueprints</span>
					{:else}
						<span class="tooltip">Blueprints</span>
					{/if}
				</a>

				<a
					href="/statistics"
					class="nav-item"
					class:active={isActive('/statistics')}
					title="Statistics"
					onmouseenter={handleMouseEnter}
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
					{#if !isMinimized}
						<span>Statistics</span>
					{:else}
						<span class="tooltip">Statistics</span>
					{/if}
				</a>

				<a
					href="/settings"
					class="nav-item"
					class:active={isActive('/settings')}
					title="Settings"
					onmouseenter={handleMouseEnter}
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
					{#if !isMinimized}
						<span>Settings</span>
					{:else}
						<span class="tooltip">Settings</span>
					{/if}
				</a>
			</div>
		</nav>

		<!-- Keyboard Shortcuts Panel -->
		<div class="border-t border-theme">
			<button
				onclick={() => showShortcuts = !showShortcuts}
				class="nav-item w-full"
				title="Keyboard Shortcuts"
				onmouseenter={handleMouseEnter}
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
				</svg>
				{#if !isMinimized}
					<span class="flex-1 text-left">Shortcuts</span>
					<svg class="h-4 w-4 transition-transform {showShortcuts ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				{:else}
					<span class="tooltip">Shortcuts</span>
				{/if}
			</button>

			{#if showShortcuts && !isMinimized}
				<div class="px-3 py-2 space-y-3 text-xs bg-content">
					<!-- Tab Navigation -->
					<div>
						<Text variant="muted" weight="semibold" class="mb-2 uppercase tracking-wide text-[10px]">Tab Navigation</Text>
						<div class="space-y-1.5">
							<div class="flex items-center justify-between">
								<span class="text-theme-secondary">Close Tab</span>
								<kbd class="kbd">{modKey} W</kbd>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-theme-secondary">Previous Tab</span>
								<kbd class="kbd">{modKey} [</kbd>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-theme-secondary">Next Tab</span>
								<kbd class="kbd">{modKey} ]</kbd>
							</div>
						</div>
					</div>

					<!-- Split Navigation -->
					<div>
						<Text variant="muted" weight="semibold" class="mb-2 uppercase tracking-wide text-[10px]">Split Navigation</Text>
						<div class="space-y-1.5">
							<div class="flex items-center justify-between">
								<span class="text-theme-secondary">Focus Split 1-4</span>
								<kbd class="kbd">{modKey} 1-4</kbd>
							</div>
						</div>
					</div>

					<!-- Mouse Shortcuts -->
					<div>
						<Text variant="muted" weight="semibold" class="mb-2 uppercase tracking-wide text-[10px]">Mouse Shortcuts</Text>
						<div class="space-y-1.5">
							<div class="flex items-center justify-between">
								<span class="text-theme-secondary">Open Memo</span>
								<kbd class="kbd">Click</kbd>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-theme-secondary">Open in Split</span>
								<kbd class="kbd">Shift Click</kbd>
							</div>
						</div>
					</div>
				</div>
			{/if}

			{#if showShortcuts && isMinimized}
				<div class="shortcuts-panel">
					<div class="space-y-3">
						<!-- Tab Navigation -->
						<div>
							<Text variant="muted" weight="semibold" class="mb-2 uppercase tracking-wide text-[10px]">Tab Navigation</Text>
							<div class="space-y-1.5">
								<div class="flex items-center justify-between gap-4">
									<span class="text-theme-secondary">Close Tab</span>
									<kbd class="kbd">{modKey} W</kbd>
								</div>
								<div class="flex items-center justify-between gap-4">
									<span class="text-theme-secondary">Previous Tab</span>
									<kbd class="kbd">{modKey} [</kbd>
								</div>
								<div class="flex items-center justify-between gap-4">
									<span class="text-theme-secondary">Next Tab</span>
									<kbd class="kbd">{modKey} ]</kbd>
								</div>
							</div>
						</div>

						<!-- Split Navigation -->
						<div>
							<Text variant="muted" weight="semibold" class="mb-2 uppercase tracking-wide text-[10px]">Split Navigation</Text>
							<div class="space-y-1.5">
								<div class="flex items-center justify-between gap-4">
									<span class="text-theme-secondary">Focus Split 1-4</span>
									<kbd class="kbd">{modKey} 1-4</kbd>
								</div>
							</div>
						</div>

						<!-- Mouse Shortcuts -->
						<div>
							<Text variant="muted" weight="semibold" class="mb-2 uppercase tracking-wide text-[10px]">Mouse Shortcuts</Text>
							<div class="space-y-1.5">
								<div class="flex items-center justify-between gap-4">
									<span class="text-theme-secondary">Open Memo</span>
									<kbd class="kbd">Click</kbd>
								</div>
								<div class="flex items-center justify-between gap-4">
									<span class="text-theme-secondary">Open in Split</span>
									<kbd class="kbd">Shift Click</kbd>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- User Section -->
		<div class="border-t border-theme p-2">
			<!-- Theme Toggle -->
			<button
				onclick={toggleTheme}
				class="nav-item w-full mb-2"
				title={currentTheme.effectiveMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
				onmouseenter={handleMouseEnter}
			>
				{#if currentTheme.effectiveMode === 'light'}
					<!-- Moon Icon (Dark Mode) -->
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
						/>
					</svg>
				{:else}
					<!-- Sun Icon (Light Mode) -->
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
						/>
					</svg>
				{/if}
				{#if !isMinimized}
					<span>{currentTheme.effectiveMode === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
				{:else}
					<span class="tooltip">{currentTheme.effectiveMode === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
				{/if}
			</button>

			{#if !isMinimized}
				<!-- User Email -->
				<div class="mb-2 px-3 py-2 text-xs text-theme-muted truncate">
					{$user?.email || ''}
				</div>
			{/if}

			<!-- Logout Button -->
			<button
				onclick={onLogout}
				class="nav-item logout-button w-full"
				title="Logout"
				onmouseenter={handleMouseEnter}
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
					/>
				</svg>
				{#if !isMinimized}
					<span>Logout</span>
				{:else}
					<span class="tooltip">Logout</span>
				{/if}
			</button>

			<!-- Toggle Sidebar Button -->
			<button
				onclick={toggleSidebar}
				class="nav-item w-full mt-2"
				title={isMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
				onmouseenter={handleMouseEnter}
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					{#if isMinimized}
						<!-- Menu icon (expand) -->
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					{:else}
						<!-- Arrow left icon (minimize) -->
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					{/if}
				</svg>
				{#if !isMinimized}
					<span>Minimize</span>
				{:else}
					<span class="tooltip">Expand</span>
				{/if}
			</button>
		</div>
	</div>
</aside>

<style>
	.sidebar {
		width: 240px;
		flex-shrink: 0;
		height: 100vh;
		position: sticky;
		top: 0;
		left: 0;
		overflow: visible;
		z-index: 100;
	}

	.sidebar.minimized {
		width: 64px;
		overflow: visible;
	}

	/* Ensure inner container allows tooltips to overflow */
	.sidebar > div {
		overflow-x: visible;
		overflow-y: auto;
	}

	/* Only the nav section should scroll */
	.sidebar nav {
		overflow-y: auto;
		overflow-x: visible;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		transition: all 0.2s;
		text-decoration: none;
		/* Normal text color */
		color: #6b7280;
	}

	.dark .nav-item {
		color: #d1d5db;
	}

	/* Remove opacity reduction - we use direct colors instead */
	a.nav-item {
		opacity: 1;
	}

	/* Hover state */
	.nav-item:hover {
		background-color: #f5f5f5;
		opacity: 1;
	}

	.dark .nav-item:hover {
		background-color: #333333;
		opacity: 1;
	}

	/* Active state */
	.nav-item.active {
		background-color: rgba(248, 214, 43, 0.1);
		color: #f8d62b;
		font-weight: 600;
		opacity: 1;
	}

	.dark .nav-item.active {
		background-color: rgba(248, 214, 43, 0.15);
		color: #f8d62b;
	}

	.nav-item.active svg {
		stroke: #f8d62b;
	}

	/* Minimized layout */
	.minimized .nav-item {
		justify-content: center;
		padding: 0.75rem;
		position: relative;
		overflow: visible;
	}

	/* Tooltip for minimized sidebar */
	.tooltip {
		display: block;
		position: fixed;
		left: 80px;
		padding: 0.625rem 1rem;
		background-color: #1E1E1E;
		color: #ffffff;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 0.5rem;
		white-space: nowrap;
		pointer-events: none;
		opacity: 0;
		visibility: hidden;
		transition: opacity 0.15s ease-out, visibility 0.15s ease-out;
		z-index: 2147483647;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
	}

	/* Tooltip arrow */
	.tooltip::before {
		content: '';
		position: absolute;
		right: 100%;
		top: 50%;
		transform: translateY(-50%);
		border: 5px solid transparent;
		border-right-color: #1E1E1E;
	}

	:global(.dark) .tooltip {
		background-color: #ffffff;
		color: #1E1E1E;
	}

	:global(.dark) .tooltip::before {
		border-right-color: #ffffff;
	}

	.minimized .nav-item:hover .tooltip {
		opacity: 1 !important;
		visibility: visible !important;
	}

	/* Logout button specific styling */
	.logout-button {
		color: #dc2626;
		opacity: 0.8;
	}

	.dark .logout-button {
		color: #ef4444;
	}

	.logout-button:hover {
		opacity: 1;
	}

	/* Smooth transitions */
	.sidebar * {
		transition: opacity 0.2s ease-in-out;
	}

	/* Keyboard shortcut badge */
	.kbd {
		display: inline-block;
		padding: 0.2rem 0.4rem;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 0.65rem;
		font-weight: 600;
		line-height: 1;
		background-color: #f3f4f6;
		border: 1px solid #d1d5db;
		border-radius: 0.25rem;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		color: #374151;
	}

	.dark .kbd {
		background-color: #374151;
		border-color: #4b5563;
		color: #e5e7eb;
	}

	/* Shortcuts panel for minimized sidebar */
	.shortcuts-panel {
		position: fixed;
		left: 80px;
		bottom: 120px;
		width: 280px;
		padding: 1rem;
		background-color: #1E1E1E;
		color: #ffffff;
		font-size: 0.75rem;
		border-radius: 0.5rem;
		z-index: 2147483647;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
		animation: slideIn 0.2s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	:global(.dark) .shortcuts-panel {
		background-color: #ffffff;
		color: #1E1E1E;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}

	.shortcuts-panel .text-theme-secondary {
		color: rgba(255, 255, 255, 0.8);
	}

	:global(.dark) .shortcuts-panel .text-theme-secondary {
		color: rgba(0, 0, 0, 0.7);
	}

	.shortcuts-panel .kbd {
		background-color: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);
		color: #ffffff;
	}

	:global(.dark) .shortcuts-panel .kbd {
		background-color: #f3f4f6;
		border-color: #d1d5db;
		color: #374151;
	}

	.shortcuts-panel h4 {
		color: rgba(255, 255, 255, 0.6);
	}

	:global(.dark) .shortcuts-panel h4 {
		color: rgba(0, 0, 0, 0.5);
		font-weight: 600;
	}

	.shortcuts-panel::before {
		content: '';
		position: absolute;
		right: 100%;
		bottom: 20px;
		border: 8px solid transparent;
		border-right-color: #1E1E1E;
	}

	:global(.dark) .shortcuts-panel::before {
		border-right-color: #ffffff;
	}
</style>
