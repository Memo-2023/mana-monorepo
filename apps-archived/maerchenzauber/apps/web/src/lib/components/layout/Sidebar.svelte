<script lang="ts">
	import { StorytellerLogo } from '@manacore/shared-branding';

	interface Props {
		isCollapsed?: boolean;
		currentPath?: string;
		onToggle?: () => void;
		onLogout?: () => void;
		isMobile?: boolean;
	}

	let {
		isCollapsed = false,
		currentPath = '/',
		onToggle,
		onLogout,
		isMobile = false,
	}: Props = $props();

	interface NavItem {
		path: string;
		label: string;
		icon: string;
		shortcut?: string;
	}

	const navItems: NavItem[] = [
		{ path: '/dashboard', label: 'Start', icon: 'home', shortcut: '⌘1' },
		{ path: '/stories', label: 'Geschichten', icon: 'book', shortcut: '⌘2' },
		{ path: '/characters', label: 'Charaktere', icon: 'users', shortcut: '⌘3' },
		{ path: '/discover', label: 'Entdecken', icon: 'compass', shortcut: '⌘4' },
		{ path: '/settings', label: 'Einstellungen', icon: 'settings', shortcut: '⌘5' },
	];

	const bottomNavItems: NavItem[] = [
		{ path: '/subscription', label: 'Abonnement', icon: 'sparkles' },
		{ path: '/help', label: 'Hilfe', icon: 'help-circle' },
	];

	function isActive(path: string): boolean {
		if (path === '/') {
			return currentPath === '/';
		}
		return currentPath.startsWith(path);
	}

	// Icon paths (simplified SVG paths)
	const iconPaths: Record<string, string> = {
		home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
		book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
		users:
			'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
		compass:
			'M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM12 15.75h.008v.008H12v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
		settings:
			'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
		sparkles:
			'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z',
		'help-circle':
			'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z',
		logout:
			'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75',
		'chevron-left': 'M15.75 19.5L8.25 12l7.5-7.5',
		'chevron-right': 'M8.25 4.5l7.5 7.5-7.5 7.5',
	};
</script>

<aside
	class="fixed inset-y-0 left-0 z-30 flex flex-col border-r border-pink-200/50 bg-white/80 backdrop-blur-xl transition-all duration-300 dark:border-gray-700/50 dark:bg-gray-900/80"
	class:w-64={!isCollapsed || isMobile}
	class:w-20={isCollapsed && !isMobile}
>
	<!-- Logo -->
	<div
		class="flex h-16 items-center justify-between border-b border-pink-200/50 px-4 dark:border-gray-700/50"
	>
		{#if !isCollapsed || isMobile}
			<a href="/" class="flex items-center gap-3">
				<StorytellerLogo size={32} />
				<span class="text-lg font-bold text-pink-600 dark:text-pink-400">Märchenzauber</span>
			</a>
		{:else}
			<a href="/" class="mx-auto">
				<StorytellerLogo size={32} />
			</a>
		{/if}

		<!-- Collapse Toggle (Desktop only) -->
		{#if !isMobile}
			<button
				onclick={onToggle}
				class="hidden rounded-lg p-1.5 text-gray-500 hover:bg-pink-100 hover:text-pink-600 lg:block dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-pink-400"
				aria-label={isCollapsed ? 'Sidebar erweitern' : 'Sidebar einklappen'}
			>
				<svg
					class="h-5 w-5 transition-transform"
					class:rotate-180={isCollapsed}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d={iconPaths['chevron-left']}
					/>
				</svg>
			</button>
		{/if}
	</div>

	<!-- Navigation -->
	<nav class="flex-1 overflow-y-auto p-3">
		<ul class="space-y-1">
			{#each navItems as item}
				<li>
					<a
						href={item.path}
						class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all {isActive(
							item.path
						)
							? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25'
							: 'text-gray-700 hover:bg-pink-50 dark:text-gray-300 dark:hover:bg-gray-800'} {isCollapsed &&
						!isMobile
							? 'justify-center'
							: ''}"
						title={isCollapsed && !isMobile ? item.label : undefined}
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
								d={iconPaths[item.icon]}
							/>
						</svg>
						{#if !isCollapsed || isMobile}
							<span class="flex-1">{item.label}</span>
							{#if item.shortcut}
								<kbd
									class="hidden rounded bg-pink-100/50 px-1.5 py-0.5 text-xs text-pink-600 lg:inline dark:bg-gray-800 dark:text-pink-400"
								>
									{item.shortcut}
								</kbd>
							{/if}
						{/if}
					</a>
				</li>
			{/each}
		</ul>

		<!-- Divider -->
		<hr class="my-4 border-pink-200/50 dark:border-gray-700/50" />

		<!-- Bottom Nav -->
		<ul class="space-y-1">
			{#each bottomNavItems as item}
				<li>
					<a
						href={item.path}
						class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-pink-50 dark:text-gray-400 dark:hover:bg-gray-800"
						class:bg-pink-50={isActive(item.path)}
						class:text-pink-600={isActive(item.path)}
						class:dark:bg-gray-800={isActive(item.path)}
						class:dark:text-pink-400={isActive(item.path)}
						class:justify-center={isCollapsed && !isMobile}
						title={isCollapsed && !isMobile ? item.label : undefined}
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
								d={iconPaths[item.icon]}
							/>
						</svg>
						{#if !isCollapsed || isMobile}
							<span>{item.label}</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<!-- Logout Button -->
	<div class="border-t border-pink-200/50 p-3 dark:border-gray-700/50">
		<button
			onclick={onLogout}
			class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
			class:justify-center={isCollapsed && !isMobile}
			title={isCollapsed && !isMobile ? 'Abmelden' : undefined}
		>
			<svg class="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d={iconPaths.logout}
				/>
			</svg>
			{#if !isCollapsed || isMobile}
				<span>Abmelden</span>
			{/if}
		</button>
	</div>
</aside>
