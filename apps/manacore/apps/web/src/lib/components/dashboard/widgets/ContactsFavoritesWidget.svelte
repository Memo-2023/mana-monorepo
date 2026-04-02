<script lang="ts">
	/**
	 * ContactsFavoritesWidget - Favorite contacts (local-first)
	 *
	 * Reads directly from Contacts' IndexedDB via cross-app reader.
	 * Reactive: auto-updates when contacts change (sync, other tabs).
	 */

	import { _ } from 'svelte-i18n';
	import { useFavoriteContacts } from '$lib/data/cross-app-queries';

	const MAX_DISPLAY = 5;
	const contacts = useFavoriteContacts(MAX_DISPLAY);

	function getDisplayName(contact: any): string {
		const parts = [contact.firstName, contact.lastName].filter(Boolean);
		return parts.length > 0 ? parts.join(' ') : contact.email || 'Unbekannt';
	}

	function getInitials(contact: any): string {
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
			<span>👥</span>
			{$_('dashboard.widgets.contacts.title')}
		</h3>
	</div>

	{#if contacts.loading}
		<div class="space-y-2">
			{#each Array(4) as _}
				<div class="h-10 animate-pulse rounded bg-surface-hover"></div>
			{/each}
		</div>
	{:else if (contacts.value ?? []).length === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">👤</div>
			<p class="text-sm text-muted-foreground">
				{$_('dashboard.widgets.contacts.empty')}
			</p>
			<a
				href="/contacts"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				{$_('dashboard.widgets.contacts.add_favorites')}
			</a>
		</div>
	{:else}
		<div class="space-y-2">
			{#each contacts.value ?? [] as contact (contact.id)}
				<a
					href="/contacts/{contact.id}"
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
					<span class="text-amber-500">⭐</span>
				</a>
			{/each}
		</div>

		<a href="/contacts" class="mt-3 block text-center text-sm text-primary hover:underline">
			{$_('dashboard.widgets.contacts.view_all')} →
		</a>
	{/if}
</div>
