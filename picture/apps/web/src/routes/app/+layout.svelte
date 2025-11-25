<script lang="ts">
	import { user, loading } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import KeyboardShortcutsModal from '$lib/components/ui/KeyboardShortcutsModal.svelte';
	import { currentTheme } from '$lib/stores/theme';
	import { isSidebarCollapsed, toggleSidebar } from '$lib/stores/sidebar';
	import { isUIVisible, toggleUI, showKeyboardShortcuts } from '$lib/stores/ui';
	import { viewMode } from '$lib/stores/view';
	import { page } from '$app/stores';

	let { children } = $props();

	// Client-side auth check
	onMount(() => {
		const unsubscribe = user.subscribe((currentUser) => {
			if (!$loading && !currentUser) {
				goto('/auth/login');
			}
		});

		return unsubscribe;
	});

	// Global keyboard shortcuts
	function handleKeyDown(e: KeyboardEvent) {
		// Ignore if user is typing in an input/textarea
		const target = e.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
			return;
		}

		switch (e.key.toLowerCase()) {
			case 'tab':
				e.preventDefault();
				toggleUI();
				break;
			case '?':
				e.preventDefault();
				showKeyboardShortcuts.set(true);
				break;
			case 'escape':
				showKeyboardShortcuts.set(false);
				break;
			case 'g':
				e.preventDefault();
				goto('/app/gallery');
				break;
			case 'm':
				e.preventDefault();
				goto('/app/board');
				break;
			case 'e':
				e.preventDefault();
				goto('/app/explore');
				break;
			case 'n':
				e.preventDefault();
				goto('/app/generate');
				break;
			case 'u':
				e.preventDefault();
				goto('/app/upload');
				break;
			case 'a':
				e.preventDefault();
				goto('/app/archive');
				break;
			case '1':
				e.preventDefault();
				viewMode.set('single');
				break;
			case '2':
				e.preventDefault();
				viewMode.set('grid3');
				break;
			case '3':
				e.preventDefault();
				viewMode.set('grid5');
				break;
			case 's':
				e.preventDefault();
				toggleSidebar();
				break;
		}
	}
</script>

<svelte:window on:keydown={handleKeyDown} />

{#if $loading}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<div
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"
			></div>
			<p class="text-gray-600">Loading...</p>
		</div>
	</div>
{:else if $user}
	<div class="min-h-screen" style="background-color: {$currentTheme.background};">
		<!-- Sidebar (conditionally visible) -->
		{#if $isUIVisible}
			<Sidebar />
		{/if}

		<!-- Main Content Area -->
		<main
			class="transition-all duration-300 {$isSidebarCollapsed || !$isUIVisible
				? 'lg:pl-0'
				: 'lg:pl-[17rem]'}"
		>
			<!-- Desktop: Left padding when sidebar is open -->
			<!-- Mobile: Top padding for header + Bottom padding for nav -->
			<div class="min-h-screen pb-20 pt-16 lg:pb-0 lg:pt-0">
				{@render children?.()}
			</div>
		</main>

		<!-- Keyboard Shortcuts Modal -->
		<KeyboardShortcutsModal />
	</div>
{/if}
