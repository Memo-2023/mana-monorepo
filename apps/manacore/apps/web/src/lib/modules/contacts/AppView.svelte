<!--
  Contacts — Split-Screen AppView
  Contact list with search.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { LocalContact } from './types';

	let contacts = $state<LocalContact[]>([]);
	let search = $state('');

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalContact>('contacts')
				.toArray()
				.then((all) => all.filter((c) => !c.deletedAt && !c.isArchived));
		}).subscribe((val) => {
			contacts = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	const filtered = $derived(() => {
		if (!search.trim()) return contacts;
		const q = search.toLowerCase();
		return contacts.filter(
			(c) =>
				c.firstName?.toLowerCase().includes(q) ||
				c.lastName?.toLowerCase().includes(q) ||
				c.email?.toLowerCase().includes(q) ||
				c.company?.toLowerCase().includes(q)
		);
	});

	function displayName(c: LocalContact): string {
		const parts = [c.firstName, c.lastName].filter(Boolean);
		return parts.length > 0 ? parts.join(' ') : (c.email ?? 'Unbenannt');
	}

	function initials(c: LocalContact): string {
		const f = c.firstName?.[0] ?? '';
		const l = c.lastName?.[0] ?? '';
		return (f + l).toUpperCase() || '?';
	}
</script>

<div class="flex h-full flex-col gap-3 p-4">
	<input
		bind:value={search}
		placeholder="Kontakt suchen..."
		class="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
	/>

	<p class="text-xs text-white/40">{filtered().length} Kontakte</p>

	<div class="flex-1 overflow-auto">
		{#each filtered() as contact (contact.id)}
			<div class="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-white/5">
				<div
					class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white/60"
				>
					{initials(contact)}
				</div>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm text-white/80">{displayName(contact)}</p>
					{#if contact.company}
						<p class="truncate text-xs text-white/40">{contact.company}</p>
					{/if}
				</div>
				{#if contact.isFavorite}
					<span class="text-yellow-400 text-xs">&#9733;</span>
				{/if}
			</div>
		{/each}

		{#if filtered().length === 0}
			<p class="py-8 text-center text-sm text-white/30">Keine Kontakte gefunden</p>
		{/if}
	</div>
</div>
