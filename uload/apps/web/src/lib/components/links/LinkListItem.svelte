<script lang="ts">
	import { enhance } from '$app/forms';
	import TagBadge from '$lib/components/TagBadge.svelte';
	import Dropdown from '$lib/components/Dropdown.svelte';
	import { trackEvent, trackLinkClick, EVENTS } from '$lib/analytics';
	import { toastMessages } from '$lib/services/toast';
	import { MousePointer, Calendar, Lock, Link as LinkIcon } from 'lucide-svelte';
	import type { Tag } from '$lib/pocketbase';

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
		last_clicked_at?: string;
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
		isSelectMode?: boolean;
		isSelected?: boolean;
		onToggleSelect?: () => void;
	}

	let { 
		link, 
		username, 
		onCopy = () => {}, 
		copiedStates = {},
		isSelectMode = false,
		isSelected = false,
		onToggleSelect = () => {}
	}: Props = $props();
	
	const isExpired = link.expires_at ? new Date(link.expires_at) < new Date() : false;
	const isNearLimit = link.max_clicks ? link.clicks >= link.max_clicks * 0.8 : false;

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
</script>

<!-- Desktop View -->
<div class="hidden lg:grid {isSelectMode ? 'grid-cols-[40px_200px_200px_1fr_100px_120px_180px]' : 'grid-cols-[200px_200px_1fr_100px_120px_180px]'} items-center gap-4 border-b border-theme-border {isSelected ? 'bg-theme-primary/5' : 'bg-theme-surface'} px-6 py-4 transition-colors hover:bg-theme-surface-hover">
	<!-- Checkbox Column -->
	{#if isSelectMode}
		<div>
			<input
				type="checkbox"
				checked={isSelected}
				onchange={onToggleSelect}
				class="h-4 w-4 rounded border-theme-border text-theme-primary focus:ring-theme-primary cursor-pointer"
			/>
		</div>
	{/if}
	<!-- Title Column -->
	<div class="font-medium text-theme-text">
		<div class="truncate" title={link.title || link.short_code}>
			{link.title || link.short_code}
		</div>
	</div>

	<!-- Short URL Column -->
	<div>
		<a 
			href={formatUrl(link.short_code)}
			target="_blank"
			class="text-sm text-theme-primary hover:underline truncate block"
			onclick={() => trackLinkClick({
				shortCode: link.short_code,
				username: username || 'direct',
				hasPassword: !!link.password,
				isExpiring: !!link.expires_at
			})}
			title="ulo.ad/{link.short_code}"
		>
			ulo.ad/{link.short_code}
		</a>
	</div>

	<!-- Destination Column -->
	<div class="min-w-0">
		<div class="text-sm text-theme-text-muted flex items-center gap-2">
			<span class="truncate" title={link.original_url}>
				{link.original_url}
			</span>
			{#if !link.is_active}
				<span class="text-xs text-red-600 font-medium flex-shrink-0">Inactive</span>
			{/if}
			{#if link.password}
				<Lock class="h-3 w-3 text-yellow-600 flex-shrink-0" title="Password protected" />
			{/if}
		</div>
	</div>

	<!-- Clicks Column -->
	<div class="text-sm text-theme-text-muted">
		<div class="flex items-center gap-1">
			<MousePointer class="h-3 w-3" />
			<span class="{isNearLimit ? 'text-orange-600 font-medium' : ''}">
				{link.clicks || 0}
			</span>
		</div>
	</div>

	<!-- Created Column -->
	<div class="text-xs text-theme-text-muted">
		<div>{new Date(link.created).toLocaleDateString('de-DE')}</div>
		{#if link.last_clicked_at}
			<div class="text-theme-accent text-xs mt-1">
				Last: {new Date(link.last_clicked_at).toLocaleDateString('de-DE')}
			</div>
		{/if}
	</div>

	<!-- Actions Column -->
	<div class="flex items-center gap-2 justify-end">
		<button
			onclick={() => copyToClipboard(formatUrl(link.short_code), link.id, link.short_code)}
			class="rounded-lg bg-theme-primary/10 px-3 py-1.5 text-sm font-medium text-theme-primary transition hover:bg-theme-primary/20"
			title="Copy URL"
		>
			{#if copiedStates[link.id]}
				✓ Copied
			{:else}
				Copy URL
			{/if}
		</button>

		<Dropdown
			items={[
				{
					label: 'Analytics',
					href: `/my/analytics/${link.short_code}`,
					icon: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>',
					color: '#2563eb'
				},
				{
					label: 'QR Code',
					icon: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h8m-4 0v8m-4-8h.01M8 8h8M4 20h2m0-4v4m12-4v4" /></svg>',
					color: '#16a34a',
					action: () => {
						window.dispatchEvent(new CustomEvent('show-qr-modal', { detail: link }));
					}
				},
				{
					label: 'Edit',
					icon: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>',
					color: '#9333ea',
					action: () => {
						window.dispatchEvent(new CustomEvent('edit-link', { detail: link }));
					}
				},
				{
					label: link.is_active ? 'Deactivate' : 'Activate',
					type: 'form',
					formAction: '?/toggle',
					formData: { id: link.id, is_active: String(link.is_active) },
					icon: link.is_active 
						? '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
						: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
					color: link.is_active ? '#ea580c' : '#16a34a'
				},
				{
					divider: true
				},
				{
					label: 'Delete',
					icon: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>',
					color: '#dc2626',
					type: 'form',
					formAction: '?/delete',
					formData: { id: link.id },
					enhanceOptions: () => {
						return async ({ update, result, cancel }) => {
							if (!confirm('Möchtest du diesen Link wirklich löschen?')) {
								cancel();
								return;
							}
							await update();
							if (result.type === 'success') {
								trackEvent(EVENTS.LINK_DELETED, {
									short_code: link.short_code
								});
								toastMessages.linkDeleted();
							}
						};
					}
				}
			]}
			buttonText="Actions"
			size="sm"
		/>
	</div>
</div>

<!-- Tablet View -->
<div class="hidden md:grid lg:hidden {isSelectMode ? 'grid-cols-[40px_minmax(200px,1fr)_200px_100px_140px]' : 'grid-cols-[minmax(200px,1fr)_200px_100px_140px]'} items-center gap-4 border-b border-theme-border {isSelected ? 'bg-theme-primary/5' : 'bg-theme-surface'} px-4 py-4 transition-colors hover:bg-theme-surface-hover">
	<!-- Checkbox Column -->
	{#if isSelectMode}
		<div>
			<input
				type="checkbox"
				checked={isSelected}
				onchange={onToggleSelect}
				class="h-4 w-4 rounded border-theme-border text-theme-primary focus:ring-theme-primary cursor-pointer"
			/>
		</div>
	{/if}
	<!-- Title Column -->
	<div class="font-medium text-theme-text">
		<div class="truncate" title={link.title || link.short_code}>
			{link.title || link.short_code}
		</div>
		{#if link.expand?.['link_tags(link_id)']?.length > 0}
			<div class="flex flex-wrap gap-1 mt-1">
				{#each link.expand['link_tags(link_id)'].slice(0, 2) as linkTag}
					{#if linkTag.expand?.tag_id}
						<TagBadge tag={linkTag.expand.tag_id} size="xs" />
					{/if}
				{/each}
			</div>
		{/if}
	</div>

	<!-- Short URL Column -->
	<div>
		<a 
			href={formatUrl(link.short_code)}
			target="_blank"
			class="text-sm text-theme-primary hover:underline truncate block"
			onclick={() => trackLinkClick({
				shortCode: link.short_code,
				username: username || 'direct',
				hasPassword: !!link.password,
				isExpiring: !!link.expires_at
			})}
			title="ulo.ad/{link.short_code}"
		>
			ulo.ad/{link.short_code}
		</a>
	</div>

	<!-- Clicks Column -->
	<div class="text-sm text-theme-text-muted">
		<div class="flex items-center gap-1">
			<MousePointer class="h-3 w-3" />
			<span class="{isNearLimit ? 'text-orange-600 font-medium' : ''}">
				{link.clicks || 0}
			</span>
		</div>
	</div>

	<!-- Actions Column -->
	<div class="flex items-center gap-2 justify-end">
		<button
			onclick={() => copyToClipboard(formatUrl(link.short_code), link.id, link.short_code)}
			class="rounded-lg bg-theme-primary/10 px-3 py-1.5 text-sm font-medium text-theme-primary transition hover:bg-theme-primary/20"
			title="Copy URL"
		>
			{#if copiedStates[link.id]}
				✓
			{:else}
				Copy
			{/if}
		</button>

		<Dropdown
			items={[
				{
					label: 'Analytics',
					href: `/my/analytics/${link.short_code}`,
					icon: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>',
					color: '#2563eb'
				},
				{
					label: 'QR Code',
					icon: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h8m-4 0v8m-4-8h.01M8 8h8M4 20h2m0-4v4m12-4v4" /></svg>',
					color: '#16a34a',
					action: () => {
						window.dispatchEvent(new CustomEvent('show-qr-modal', { detail: link }));
					}
				},
				{
					label: 'Edit',
					icon: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>',
					color: '#9333ea',
					action: () => {
						window.dispatchEvent(new CustomEvent('edit-link', { detail: link }));
					}
				},
				{
					label: link.is_active ? 'Deactivate' : 'Activate',
					type: 'form',
					formAction: '?/toggle',
					formData: { id: link.id, is_active: String(link.is_active) },
					icon: link.is_active 
						? '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
						: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
					color: link.is_active ? '#ea580c' : '#16a34a'
				},
				{
					divider: true
				},
				{
					label: 'Delete',
					icon: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>',
					color: '#dc2626',
					type: 'form',
					formAction: '?/delete',
					formData: { id: link.id },
					enhanceOptions: () => {
						return async ({ update, result, cancel }) => {
							if (!confirm('Möchtest du diesen Link wirklich löschen?')) {
								cancel();
								return;
							}
							await update();
							if (result.type === 'success') {
								trackEvent(EVENTS.LINK_DELETED, {
									short_code: link.short_code
								});
								toastMessages.linkDeleted();
							}
						};
					}
				}
			]}
			buttonText="•••"
			size="sm"
		/>
	</div>
</div>

<!-- Mobile View -->
<div class="md:hidden border-b border-theme-border {isSelected ? 'bg-theme-primary/5' : 'bg-theme-surface'} p-4 transition-colors hover:bg-theme-surface-hover">
	<div class="space-y-3">
		<!-- Checkbox for mobile -->
		{#if isSelectMode}
			<div class="flex items-center justify-between">
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						checked={isSelected}
						onchange={onToggleSelect}
						class="h-4 w-4 rounded border-theme-border text-theme-primary focus:ring-theme-primary"
					/>
					<span class="text-sm text-theme-text">Select</span>
				</label>
			</div>
		{/if}
		<!-- Title and URL -->
		<div>
			<div class="font-medium text-theme-text mb-1">
				{link.title || link.short_code}
			</div>
			<a 
				href={formatUrl(link.short_code)}
				target="_blank"
				class="text-sm text-theme-primary hover:underline"
				onclick={() => trackLinkClick({
					shortCode: link.short_code,
					username: username || 'direct',
					hasPassword: !!link.password,
					isExpiring: !!link.expires_at
				})}
			>
				ulo.ad/{link.short_code}
			</a>
		</div>

		<!-- Destination -->
		<div class="text-sm text-theme-text-muted">
			<div class="truncate">{link.original_url}</div>
		</div>

		<!-- Tags -->
		{#if link.expand?.['link_tags(link_id)']?.length > 0}
			<div class="flex flex-wrap gap-1">
				{#each link.expand['link_tags(link_id)'] as linkTag}
					{#if linkTag.expand?.tag_id}
						<TagBadge tag={linkTag.expand.tag_id} size="xs" />
					{/if}
				{/each}
			</div>
		{/if}

		<!-- Stats -->
		<div class="flex items-center justify-between text-sm text-theme-text-muted">
			<div class="flex items-center gap-4">
				<span class="flex items-center gap-1">
					<MousePointer class="h-3 w-3" />
					{link.clicks || 0} clicks
				</span>
				<span>
					<Calendar class="h-3 w-3 inline" />
					{new Date(link.created).toLocaleDateString('de-DE')}
				</span>
			</div>
			<div class="flex items-center gap-2">
				{#if !link.is_active}
					<span class="text-xs text-red-600 font-medium">Inactive</span>
				{/if}
				{#if link.password}
					<Lock class="h-3 w-3 text-yellow-600" title="Password protected" />
				{/if}
			</div>
		</div>

		<!-- Actions -->
		<div class="flex gap-2">
			<button
				onclick={() => copyToClipboard(formatUrl(link.short_code), link.id, link.short_code)}
				class="flex-1 rounded-lg bg-theme-primary/10 px-3 py-2 text-sm font-medium text-theme-primary transition hover:bg-theme-primary/20"
			>
				{#if copiedStates[link.id]}
					✓ Copied
				{:else}
					Copy URL
				{/if}
			</button>
			<a
				href="/my/analytics/{link.short_code}"
				class="flex-1 rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-sm font-medium text-theme-text text-center transition hover:bg-theme-surface-hover"
			>
				Analytics
			</a>
			<Dropdown
				items={[
					{
						label: 'QR Code',
						icon: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h8m-4 0v8m-4-8h.01M8 8h8M4 20h2m0-4v4m12-4v4" /></svg>',
						color: '#16a34a',
						action: () => {
							window.dispatchEvent(new CustomEvent('show-qr-modal', { detail: link }));
						}
					},
					{
						label: 'Edit',
						icon: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>',
						color: '#9333ea',
						action: () => {
							window.dispatchEvent(new CustomEvent('edit-link', { detail: link }));
						}
					},
					{
						label: link.is_active ? 'Deactivate' : 'Activate',
						type: 'form',
						formAction: '?/toggle',
						formData: { id: link.id, is_active: String(link.is_active) },
						icon: link.is_active 
							? '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
							: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
						color: link.is_active ? '#ea580c' : '#16a34a'
					},
					{
						divider: true
					},
					{
						label: 'Delete',
						icon: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>',
						color: '#dc2626',
						type: 'form',
						formAction: '?/delete',
						formData: { id: link.id },
						enhanceOptions: () => {
							return async ({ update, result, cancel }) => {
								if (!confirm('Möchtest du diesen Link wirklich löschen?')) {
									cancel();
									return;
								}
								await update();
								if (result.type === 'success') {
									trackEvent(EVENTS.LINK_DELETED, {
										short_code: link.short_code
									});
									toastMessages.linkDeleted();
								}
							};
						}
					}
				]}
				buttonText="•••"
				size="sm"
			/>
		</div>
	</div>
</div>