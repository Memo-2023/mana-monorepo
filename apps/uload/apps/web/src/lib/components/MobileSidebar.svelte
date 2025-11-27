<script lang="ts">
	import { page } from '$app/stores';
	import * as m from '$paraglide/messages';
	import WorkspaceSwitcher from './WorkspaceSwitcher.svelte';

	interface Props {
		user?: {
			email: string;
			username?: string;
		} | null;
		open?: boolean;
		onClose?: () => void;
	}

	let { user, open = false, onClose }: Props = $props();

	function isActive(path: string): boolean {
		const currentPath = $page.url.pathname;
		const cleanPath = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath;
		const cleanHref = path.endsWith('/') ? path.slice(0, -1) : path;
		return cleanPath === cleanHref;
	}

	function handleLinkClick() {
		if (onClose) onClose();
	}
</script>

{#if user && open}
	<!-- Backdrop -->
	<div class="fixed inset-0 z-50 bg-black/50 lg:hidden" onclick={onClose}></div>

	<!-- Sidebar -->
	<aside
		class="slide-in fixed bottom-0 left-0 top-0 z-50 w-72 bg-theme-surface shadow-2xl lg:hidden"
	>
		<div class="flex h-full flex-col p-4">
			<!-- Header -->
			<div class="mb-8 flex items-center justify-between">
				<div class="flex items-center gap-3">
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
				</div>
				<button
					onclick={onClose}
					class="rounded-lg p-2 text-theme-text-muted transition-colors hover:bg-theme-surface-hover"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Workspace Switcher -->
			<div class="mb-6">
				<WorkspaceSwitcher />
			</div>

			<!-- Navigation -->
			<nav class="flex-1 space-y-1">
				<a
					href="/my"
					onclick={handleLinkClick}
					class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-theme-surface-hover {isActive(
						'/my'
					)
						? 'bg-theme-surface-hover text-theme-primary'
						: 'text-theme-text'}"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
						/>
					</svg>
					<span class="font-medium">{m.nav_dashboard()}</span>
				</a>

				<a
					href="/my/links"
					onclick={handleLinkClick}
					class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-theme-surface-hover {isActive(
						'/my/links'
					)
						? 'bg-theme-surface-hover text-theme-primary'
						: 'text-theme-text'}"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
						/>
					</svg>
					<span class="font-medium">Links</span>
				</a>

				<a
					href="/my/cards"
					onclick={handleLinkClick}
					class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-theme-surface-hover {isActive(
						'/my/cards'
					)
						? 'bg-theme-surface-hover text-theme-primary'
						: 'text-theme-text'}"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
					</svg>
					<span class="font-medium">Cards</span>
				</a>

				<a
					href="/my/tags"
					onclick={handleLinkClick}
					class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-theme-surface-hover {isActive(
						'/my/tags'
					)
						? 'bg-theme-surface-hover text-theme-primary'
						: 'text-theme-text'}"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
						/>
					</svg>
					<span class="font-medium">Tags</span>
				</a>

				<a
					href="/template-store"
					onclick={handleLinkClick}
					class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-theme-surface-hover {isActive(
						'/template-store'
					)
						? 'bg-theme-surface-hover text-theme-primary'
						: 'text-theme-text'}"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
						/>
					</svg>
					<span class="font-medium">Templates</span>
				</a>

				<div class="border-theme-border/30 my-2 border-t"></div>

				<a
					href="/pricing"
					onclick={handleLinkClick}
					class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-theme-surface-hover {isActive(
						'/pricing'
					)
						? 'bg-theme-surface-hover text-theme-primary'
						: 'text-theme-text'}"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span class="font-medium">{m.nav_pricing() || 'Pricing'}</span>
				</a>

				{#if user.username}
					<a
						href="/p/{user.username}"
						onclick={handleLinkClick}
						target="_blank"
						class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-theme-text transition-all hover:bg-theme-surface-hover"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							/>
						</svg>
						<span class="font-medium">{m.nav_profile()}</span>
					</a>
				{/if}
			</nav>

			<!-- Bottom Section -->
			<div class="border-theme-border/30 mt-auto space-y-2 border-t pt-4">
				<a
					href="/settings"
					onclick={handleLinkClick}
					class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-theme-surface-hover {isActive(
						'/settings'
					)
						? 'bg-theme-surface-hover text-theme-primary'
						: 'text-theme-text'}"
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
					<span class="font-medium">Settings</span>
				</a>

				<a
					href="/settings/team"
					onclick={handleLinkClick}
					class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-theme-surface-hover {isActive(
						'/settings/team'
					)
						? 'bg-theme-surface-hover text-theme-primary'
						: 'text-theme-text'}"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
						/>
					</svg>
					<span class="font-medium">Team</span>
				</a>

				<div class="px-3 py-2 text-sm text-theme-text-muted">
					{user.email}
				</div>

				<form method="POST" action="/login?/logout" class="w-full">
					<button
						type="submit"
						class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-red-600 transition-all hover:bg-red-600/10"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
							/>
						</svg>
						<span class="font-medium">{m.nav_logout()}</span>
					</button>
				</form>
			</div>
		</div>
	</aside>
{/if}

<style>
	@keyframes slideInLeft {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(0);
		}
	}

	.slide-in {
		animation: slideInLeft 0.3s ease-out;
	}
</style>
