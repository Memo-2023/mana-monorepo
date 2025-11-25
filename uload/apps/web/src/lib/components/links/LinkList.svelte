<script lang="ts">
	import LinkCard from './LinkCard.svelte';
	import LinkListItem from './LinkListItem.svelte';
	import type { Tag } from '$lib/pocketbase';
	import type { ViewMode } from '$lib/stores/viewModes';
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
		use_username?: boolean;
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

	interface PaginatedLinks {
		items: Link[];
		page: number;
		totalPages: number;
		totalItems: number;
	}

	interface Props {
		links: PaginatedLinks;
		username?: string;
		viewMode: ViewMode;
		onPageChange?: (page: number) => void;
		isSelectMode?: boolean;
		selectedLinks?: Set<string>;
		onToggleSelect?: (linkId: string) => void;
	}

	let { 
		links, 
		username, 
		viewMode, 
		onPageChange = () => {},
		isSelectMode = false,
		selectedLinks = new Set<string>(),
		onToggleSelect = () => {}
	}: Props = $props();

	let copiedStates = $state<Record<string, boolean>>({});

	function handleCopy(text: string, id: string, shortCode?: string) {
		copiedStates[id] = true;
		setTimeout(() => (copiedStates[id] = false), 2000);

		if (shortCode) {
			import('$lib/analytics').then(({ trackEvent, EVENTS }) => {
				trackEvent(EVENTS.LINK_COPIED, { short_code: shortCode });
			});
		}
	}
</script>

{#if links && links.items && links.items.length > 0}
	{#if viewMode === 'cards'}
		<div class="space-y-6">
			<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
				{#each links.items as link}
					<div class="rounded-xl border border-theme-border bg-theme-surface shadow-sm hover:shadow-lg transition-shadow duration-200 overflow-hidden relative {isSelectMode && selectedLinks.has(link.id) ? 'ring-2 ring-theme-primary' : ''}">
						{#if isSelectMode}
							<div class="absolute top-3 left-3 z-10">
								<input
									type="checkbox"
									checked={selectedLinks.has(link.id)}
									onchange={() => onToggleSelect(link.id)}
									class="h-5 w-5 rounded border-theme-border text-theme-primary focus:ring-theme-primary cursor-pointer"
								/>
							</div>
						{/if}
						<LinkCard {link} {username} onCopy={handleCopy} {copiedStates} />
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="rounded-xl border border-theme-border bg-theme-surface shadow-xl overflow-hidden">
			<!-- Desktop Table Header -->
			<div class="hidden lg:grid {isSelectMode ? 'grid-cols-[40px_200px_200px_1fr_100px_120px_180px]' : 'grid-cols-[200px_200px_1fr_100px_120px_180px]'} items-center gap-4 border-b border-theme-border bg-theme-surface-hover px-6 py-3 text-sm font-medium text-theme-text">
				{#if isSelectMode}<div></div>{/if}
				<div>Title</div>
				<div>Short URL</div>
				<div>Destination</div>
				<div>Clicks</div>
				<div>Created</div>
				<div class="text-right">Actions</div>
			</div>
			<!-- Tablet Table Header -->
			<div class="hidden md:grid lg:hidden {isSelectMode ? 'grid-cols-[40px_minmax(200px,1fr)_200px_100px_140px]' : 'grid-cols-[minmax(200px,1fr)_200px_100px_140px]'} items-center gap-4 border-b border-theme-border bg-theme-surface-hover px-4 py-3 text-sm font-medium text-theme-text">
				{#if isSelectMode}<div></div>{/if}
				<div>Title</div>
				<div>Short URL</div>
				<div>Clicks</div>
				<div class="text-right">Actions</div>
			</div>
			<!-- Table Body -->
			<div>
				{#each links.items as link}
					<LinkListItem 
						{link} 
						{username} 
						onCopy={handleCopy} 
						{copiedStates}
						{isSelectMode}
						isSelected={selectedLinks.has(link.id)}
						onToggleSelect={() => onToggleSelect(link.id)}
					/>
				{/each}
			</div>
		</div>
	{/if}

	{#if links.totalPages > 1}
		<div class="mt-6 flex items-center justify-center gap-2">
			{#if links.page > 1}
				<button
					onclick={() => onPageChange(links.page - 1)}
					class="rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-theme-text transition-colors hover:bg-theme-surface-hover"
				>
					Previous
				</button>
			{/if}

			{#each Array(Math.min(5, links.totalPages)) as _, i}
				{@const pageNum = Math.max(1, links.page - 2) + i}
				{#if pageNum <= links.totalPages}
					<button
						onclick={() => onPageChange(pageNum)}
						class="rounded-lg px-3 py-2 transition-colors {pageNum === links.page
							? 'bg-theme-primary text-white'
							: 'border border-theme-border bg-theme-surface text-theme-text hover:bg-theme-surface-hover'}"
					>
						{pageNum}
					</button>
				{/if}
			{/each}

			{#if links.page < links.totalPages}
				<button
					onclick={() => onPageChange(links.page + 1)}
					class="rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-theme-text transition-colors hover:bg-theme-surface-hover"
				>
					Next
				</button>
			{/if}
		</div>
	{/if}
{:else}
	<div class="rounded-lg border border-theme-border bg-theme-surface p-8 text-center shadow-md">
		<p class="text-theme-text">
			Keine Links gefunden. Versuchen Sie Ihre Filter anzupassen oder erstellen Sie Ihren ersten
			Link!
		</p>
		<slot name="empty-action">
			<button
				onclick={() => window.dispatchEvent(new CustomEvent('show-create-form'))}
				class="mt-4 inline-block rounded-lg bg-theme-primary px-6 py-2 font-medium text-white transition-colors hover:bg-theme-primary-hover"
			>
				Ersten Link erstellen
			</button>
		</slot>
	</div>
{/if}
