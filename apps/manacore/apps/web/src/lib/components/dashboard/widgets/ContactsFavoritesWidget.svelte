<script lang="ts">
	/**
	 * ContactsFavoritesWidget - Favorite contacts
	 */

	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { contactsService, type Contact } from '$lib/api/services';
	import { APP_URLS } from '@manacore/shared-branding';
	import WidgetSkeleton from '../WidgetSkeleton.svelte';
	import WidgetError from '../WidgetError.svelte';

	let state = $state<'loading' | 'success' | 'error'>('loading');
	let data = $state<Contact[]>([]);
	let error = $state<string | null>(null);
	let retrying = $state(false);
	let retryCount = $state(0);

	const MAX_DISPLAY = 5;

	// Determine app URL based on environment
	const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
	const contactsUrl = isDev ? APP_URLS.contacts.dev : APP_URLS.contacts.prod;

	async function load() {
		state = 'loading';
		retrying = true;

		const result = await contactsService.getFavoriteContacts(MAX_DISPLAY);

		if (result.data) {
			data = result.data;
			state = 'success';
			retryCount = 0;
		} else {
			error = result.error;
			state = 'error';

			if (retryCount < 3) {
				retryCount++;
				setTimeout(load, 5000 * retryCount);
			}
		}

		retrying = false;
	}

	onMount(load);

	function getDisplayName(contact: Contact): string {
		return contactsService.getDisplayName(contact);
	}

	function getInitials(contact: Contact): string {
		const name = getDisplayName(contact);
		const parts = name.split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
		}
		return name.slice(0, 2).toUpperCase();
	}
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>=e</span>
			{$_('dashboard.widgets.contacts.title')}
		</h3>
	</div>

	{#if state === 'loading'}
		<WidgetSkeleton lines={4} />
	{:else if state === 'error'}
		<WidgetError {error} onRetry={load} {retrying} />
	{:else if data.length === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">=Ç</div>
			<p class="text-sm text-muted-foreground">
				{$_('dashboard.widgets.contacts.empty')}
			</p>
			<a
				href={contactsUrl}
				target="_blank"
				rel="noopener"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				{$_('dashboard.widgets.contacts.add_favorites')}
			</a>
		</div>
	{:else}
		<div class="space-y-2">
			{#each data as contact}
				<a
					href="{contactsUrl}/contacts/{contact.id}"
					target="_blank"
					rel="noopener"
					class="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface-hover"
				>
					<div
						class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
					>
						{getInitials(contact)}
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">
							{getDisplayName(contact)}
						</p>
						{#if contact.email}
							<p class="truncate text-xs text-muted-foreground">
								{contact.email}
							</p>
						{:else if contact.company}
							<p class="truncate text-xs text-muted-foreground">
								{contact.company}
							</p>
						{/if}
					</div>
					<span class="text-amber-500">P</span>
				</a>
			{/each}
		</div>

		<a
			href={contactsUrl}
			target="_blank"
			rel="noopener"
			class="mt-3 block text-center text-sm text-primary hover:underline"
		>
			{$_('dashboard.widgets.contacts.view_all')} ’
		</a>
	{/if}
</div>
