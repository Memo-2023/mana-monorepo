<script lang="ts">
	/**
	 * RecentContactsWidget — Zuletzt aktualisierte Kontakte.
	 *
	 * Liest direkt aus der unified IndexedDB (contacts table).
	 */

	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { BaseRecord } from '@mana/local-store';

	interface Contact extends BaseRecord {
		firstName?: string;
		lastName?: string;
		email?: string;
		company?: string;
		isFavorite?: boolean;
		isArchived?: boolean;
	}

	let contacts: Contact[] = $state([]);
	let loading = $state(true);

	$effect(() => {
		const sub = liveQuery(async () => {
			const all = await db.table<Contact>('contacts').toArray();
			return all
				.filter((c) => !c.deletedAt && !c.isArchived)
				.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
				.slice(0, 5);
		}).subscribe({
			next: (val) => {
				contacts = val;
				loading = false;
			},
			error: () => {
				loading = false;
			},
		});
		return () => sub.unsubscribe();
	});

	function getDisplayName(c: Contact): string {
		const parts = [c.firstName, c.lastName].filter(Boolean);
		return parts.length > 0 ? parts.join(' ') : c.email || 'Unbekannt';
	}

	function getInitials(c: Contact): string {
		const name = getDisplayName(c);
		const parts = name.split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
		}
		return name.slice(0, 2).toUpperCase();
	}
</script>

<div>
	<div class="mb-3">
		<h3 class="flex items-center gap-2 text-lg font-semibold">Kontakte</h3>
	</div>

	{#if loading}
		<div class="space-y-2">
			{#each Array(4) as _}
				<div class="h-10 animate-pulse rounded bg-surface-hover"></div>
			{/each}
		</div>
	{:else if contacts.length === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">&#128100;</div>
			<p class="text-sm text-muted-foreground">Noch keine Kontakte vorhanden.</p>
			<a
				href="/contacts"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				Kontakt hinzufügen
			</a>
		</div>
	{:else}
		<div class="space-y-2">
			{#each contacts as contact (contact.id)}
				<a
					href="/contacts"
					class="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface-hover"
				>
					<div
						class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
					>
						{getInitials(contact)}
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{getDisplayName(contact)}</p>
						{#if contact.company}
							<p class="truncate text-xs text-muted-foreground">{contact.company}</p>
						{:else if contact.email}
							<p class="truncate text-xs text-muted-foreground">{contact.email}</p>
						{/if}
					</div>
				</a>
			{/each}
		</div>

		<a href="/contacts" class="mt-3 block text-center text-sm text-primary hover:underline">
			Alle Kontakte anzeigen
		</a>
	{/if}
</div>
