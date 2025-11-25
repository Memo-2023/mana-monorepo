<script lang="ts">
	import { enhance } from '$app/forms';
	import TagBadge from '$lib/components/TagBadge.svelte';
	import { trackEvent, trackLinkClick, EVENTS } from '$lib/analytics';
	import type { Tag } from '$lib/pocketbase';
	import { toastMessages } from '$lib/services/toast';

	interface Link {
		id: string;
		short_code: string;
		original_url: string;
		title?: string;
		description?: string;
		clicks: number;
		is_active: boolean;
		expires_at?: string;
		max_clicks?: number;
		password?: string;
		created: string;
		// use_username removed - now handled by short_code format
		folder?: string;
		expand?: {
			folder?: {
				id: string;
				name: string;
				display_name: string;
				icon: string;
				color: string;
			};
			'link_tags(link_id)'?: Array<{
				expand?: {
					tag_id?: Tag;
				};
			}>;
		};
	}

	interface Props {
		link: Link;
		username?: string;
		onCopy?: (text: string, id: string, shortCode?: string) => void;
		copiedStates?: Record<string, boolean>;
	}

	let { link, username, onCopy = () => {}, copiedStates = {} }: Props = $props();

	let dropdownOpen = $state(false);

	function formatUrl(shortCode: string) {
		if (typeof window === 'undefined') return shortCode;
		// Short codes with slashes are already username-prefixed custom codes
		return `${window.location.origin}/${shortCode}`;
	}

	function copyToClipboard(text: string, id: string, shortCode?: string) {
		navigator.clipboard.writeText(text);
		onCopy(text, id, shortCode);
		toastMessages.linkCopied();
	}

	function toggleDropdown() {
		dropdownOpen = !dropdownOpen;
	}
</script>

<div class="group relative rounded-xl border border-theme-border bg-theme-surface p-6 shadow-lg transition-transform hover:scale-105">
	<div class="flex flex-col space-y-3">
		<div class="flex items-start justify-between">
			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-2">
					{#if link.title}
						<h3 class="truncate text-lg font-semibold text-theme-text">{link.title}</h3>
					{:else}
						<h3 class="truncate text-lg font-semibold text-theme-text">Untitled Link</h3>
					{/if}
					{#if !link.is_active}
						<span class="rounded bg-red-100 px-2 py-1 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">Inactive</span>
					{/if}
				</div>
				
				{#if link.expand?.folder}
					<span
						class="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
						style="background-color: {link.expand.folder.color}20; color: {link.expand.folder.color}"
					>
						{link.expand.folder.icon}
						{link.expand.folder.display_name}
					</span>
				{/if}

				{#if link.expand?.['link_tags(link_id)'] && link.expand['link_tags(link_id)'].length > 0}
					<div class="mt-2 flex flex-wrap gap-1">
						{#each link.expand['link_tags(link_id)'] as linkTag}
							{#if linkTag.expand?.tag_id}
								<TagBadge tag={linkTag.expand.tag_id} size="sm" />
							{/if}
						{/each}
					</div>
				{/if}
			</div>

			<div class="relative ml-2">
				<button
					onclick={toggleDropdown}
					class="rounded-lg bg-theme-surface-hover p-2 transition-colors hover:bg-theme-border"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
					</svg>
				</button>

				{#if dropdownOpen}
					<div class="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-theme-border bg-white shadow-lg">
						<a
							href="/my/analytics/{link.short_code}"
							class="block px-4 py-2 text-sm text-blue-600 transition-colors hover:bg-blue-50"
							onclick={toggleDropdown}
						>
							📊 Analytics
						</a>

						<form method="POST" action="?/toggle" use:enhance>
							<input type="hidden" name="id" value={link.id} />
							<input type="hidden" name="is_active" value={link.is_active} />
							<button
								type="submit"
								onclick={toggleDropdown}
								class="w-full px-4 py-2 text-left text-sm {link.is_active
									? 'text-orange-600 hover:bg-orange-50'
									: 'text-green-600 hover:bg-green-50'} transition-colors"
							>
								{link.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
							</button>
						</form>

						<div class="border-t border-theme-border">
							<form
								method="POST"
								action="?/delete"
								use:enhance={() => {
									return async ({ update, result }) => {
										if (confirm('Möchtest du diesen Link wirklich löschen?')) {
											toggleDropdown();
											await update();
											if (result.type === 'success') {
												trackEvent(EVENTS.LINK_DELETED, {
													short_code: link.short_code
												});
												toastMessages.linkDeleted();
											}
										}
									};
								}}
							>
								<input type="hidden" name="id" value={link.id} />
								<button
									type="submit"
									class="w-full px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
								>
									🗑️ Delete
								</button>
							</form>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<div class="space-y-2">
			<div class="flex items-center gap-2">
				<span class="text-sm text-theme-text-muted">Short URL:</span>
				<a
					href="/{link.short_code}"
					target="_blank"
					class="text-sm font-mono text-blue-600 hover:text-blue-800"
					onclick={() =>
						trackLinkClick({
							shortCode: link.short_code,
							username: username || 'direct',
							hasPassword: !!link.password,
							isExpiring: !!link.expires_at
						})}
				>
					{formatUrl(link.short_code)}
				</a>
			</div>
			
			<p class="truncate text-sm text-theme-text-muted">
				→ {link.original_url}
			</p>

			{#if link.description}
				<p class="text-sm text-theme-text">{link.description}</p>
			{/if}
		</div>

		<div class="flex items-center justify-between pt-2">
			<div class="flex items-center gap-4 text-xs text-theme-text-muted">
				<span>Clicks: {link.clicks || 0}</span>
				{#if link.expires_at}
					<span class="text-orange-600">
						Expires: {new Date(link.expires_at).toLocaleDateString()}
					</span>
				{/if}
				{#if link.max_clicks}
					<span class="text-purple-600">Max: {link.max_clicks}</span>
				{/if}
				{#if link.password}
					<span class="text-red-600">🔒</span>
				{/if}
			</div>

			<button
				onclick={() => copyToClipboard(formatUrl(link.short_code), link.id, link.short_code)}
				class="rounded-lg bg-theme-primary px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-theme-primary-hover"
			>
				{copiedStates[link.id] ? '✓ Copied' : '📋 Copy'}
			</button>
		</div>
	</div>
</div>