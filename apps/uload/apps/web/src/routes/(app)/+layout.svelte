<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
	import FloatingSidebar from '$lib/components/FloatingSidebar.svelte';
	import MobileSidebar from '$lib/components/MobileSidebar.svelte';
	import AccountSwitcher from '$lib/components/AccountSwitcher.svelte';
	import WorkspaceSwitcher from '$lib/components/WorkspaceSwitcher.svelte';
	import NotificationBell from '$lib/components/NotificationBell.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { accountsStore } from '$lib/stores/accounts';
	import { workspacesStore } from '$lib/stores/workspaces';
	import { activeWorkspace } from '$lib/stores/activeWorkspace';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();
	let sidebarCollapsed = $state(false);
	let mounted = $state(false);
	let mobileMenuOpen = $state(false);

	// Watch for URL workspace parameter changes
	$effect(() => {
		const urlWorkspaceId = $page.url.searchParams.get('workspace');
		if (urlWorkspaceId) {
			// URL parameter takes precedence
			activeWorkspace.initFromUrl(urlWorkspaceId);
		}
	});

	onMount(() => {
		mounted = true;

		// Initialize both stores during migration
		if (data.user) {
			// Old accounts store for backwards compatibility
			accountsStore.init(data.user, data.sharedAccounts || [], data.viewingAs);
			// New workspaces store
			workspacesStore.init(
				data.user,
				data.personalWorkspace,
				data.teamWorkspaces || [],
				data.currentWorkspaceId
			);

			// Initialize active workspace from URL or localStorage
			const urlWorkspaceId = $page.url.searchParams.get('workspace');
			if (urlWorkspaceId) {
				activeWorkspace.initFromUrl(urlWorkspaceId);
				// Try to find workspace data
				const workspace =
					data.teamWorkspaces?.find((w) => w.id === urlWorkspaceId) ||
					(data.personalWorkspace?.id === urlWorkspaceId ? data.personalWorkspace : null);
				if (workspace) {
					activeWorkspace.set(workspace);
				}
			}
		}

		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('sidebar-collapsed');
			if (stored !== null) {
				sidebarCollapsed = stored === 'true';
			}

			// Listen for storage changes to sync sidebar state
			const handleStorageChange = () => {
				const stored = localStorage.getItem('sidebar-collapsed');
				if (stored !== null) {
					sidebarCollapsed = stored === 'true';
				}
			};

			window.addEventListener('storage', handleStorageChange);
			return () => window.removeEventListener('storage', handleStorageChange);
		}
	});
</script>

<!-- Full screen background container -->
<div class="fixed inset-0 -z-10 bg-theme-background"></div>

<!-- Floating Sidebar for authenticated users on desktop -->
<FloatingSidebar user={data.user} />

<!-- Mobile Sidebar (overlay) -->
<MobileSidebar user={data.user} open={mobileMenuOpen} onClose={() => (mobileMenuOpen = false)} />

<!-- Top Navigation Bar with Menu Button for mobile/tablet -->
{#if data.user}
	<nav
		class="bg-theme-surface/80 sticky top-0 z-30 border-b border-theme-border shadow-sm backdrop-blur-xl lg:hidden"
	>
		<div class="mx-auto max-w-7xl px-4 sm:px-6">
			<div class="flex h-16 items-center justify-between">
				<!-- Logo & Menu Button -->
				<div class="flex items-center gap-3">
					<button
						onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
						class="rounded-lg p-2 text-theme-text transition-colors hover:bg-theme-surface-hover"
						aria-label="Menu"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h16M4 18h16"
							/>
						</svg>
					</button>
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

				<!-- Notifications & Workspace Switcher -->
				<div class="flex items-center gap-2">
					<NotificationBell />
					<WorkspaceSwitcher />
				</div>
			</div>
		</div>
	</nav>
{/if}

<!-- Main Content with responsive margin -->
<main
	class="min-h-screen transition-all duration-300 {mounted && data.user
		? sidebarCollapsed
			? 'lg:pl-24'
			: 'lg:pl-72'
		: ''}"
>
	{@render children?.()}
</main>
