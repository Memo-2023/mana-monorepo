<!--
  Contacts — Workbench ListView
  Contact list with search + quick create.
  Clicking a contact opens the detail view.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
	import { db } from '$lib/data/database';
	import type { LocalContact } from './types';
	import { contactsStore } from './stores/contacts.svelte';
	import { Plus, Star, PencilSimple, Trash, StarFour } from '@manacore/shared-icons';
	import type { ViewProps } from '$lib/app-registry';
	import { ContextMenu, type ContextMenuItem } from '@manacore/shared-ui';
	import { dropTarget, dragSource } from '@manacore/shared-ui/dnd';
	import type { TagDragData } from '@manacore/shared-ui/dnd';
	import { useAllTags, getTagsByIds } from '$lib/stores/tags.svelte';

	let { navigate, goBack, params }: ViewProps = $props();

	const tagsQuery = useAllTags();
	let allTags = $derived(tagsQuery.value ?? []);

	function handleTagDrop(contactId: string, tagData: TagDragData) {
		const contact = contacts.find((c) => c.id === contactId);
		if (!contact) return;
		const current = contact.tagIds ?? [];
		if (!current.includes(tagData.id)) {
			contactsStore.updateTagIds(contactId, [...current, tagData.id]);
		}
	}

	let contacts$ = useLiveQueryWithDefault(async () => {
		return db
			.table<LocalContact>('contacts')
			.toArray()
			.then((all) => all.filter((c) => !c.deletedAt && !c.isArchived));
	}, [] as LocalContact[]);
	let contacts = $derived(contacts$.value);
	let search = $state('');

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

	// Context menu
	let ctxMenu = $state<{ visible: boolean; x: number; y: number; contact: LocalContact | null }>({
		visible: false,
		x: 0,
		y: 0,
		contact: null,
	});

	function handleItemContextMenu(e: MouseEvent, contact: LocalContact) {
		e.preventDefault();
		ctxMenu = { visible: true, x: e.clientX, y: e.clientY, contact };
	}

	let ctxMenuItems = $derived<ContextMenuItem[]>(
		ctxMenu.contact
			? [
					{
						id: 'open',
						label: 'Öffnen',
						icon: PencilSimple,
						action: () => {
							if (ctxMenu.contact) {
								navigate('detail', { contactId: ctxMenu.contact.id });
							}
						},
					},
					{
						id: 'favorite',
						label: ctxMenu.contact.isFavorite ? 'Favorit entfernen' : 'Als Favorit',
						icon: Star,
						action: () => {
							if (ctxMenu.contact) {
								contactsStore.toggleFavorite(ctxMenu.contact.id);
							}
						},
					},
					{ id: 'div', label: '', type: 'divider' as const },
					{
						id: 'delete',
						label: 'Löschen',
						icon: Trash,
						variant: 'danger' as const,
						action: () => {
							if (ctxMenu.contact) {
								contactsStore.deleteContact(ctxMenu.contact.id);
							}
						},
					},
				]
			: []
	);

	// Quick create
	let newName = $state('');

	async function createContact() {
		const name = newName.trim();
		if (!name) return;
		const parts = name.split(/\s+/);
		const firstName = parts[0];
		const lastName = parts.length > 1 ? parts.slice(1).join(' ') : undefined;
		await contactsStore.createContact({
			firstName,
			lastName,
		});
		newName = '';
	}
</script>

<div class="app-view">
	<input bind:value={search} placeholder="Kontakt suchen..." class="search-input" />

	<form
		onsubmit={(e) => {
			e.preventDefault();
			createContact();
		}}
		class="quick-add"
	>
		<span class="add-icon"><Plus size={16} /></span>
		<input bind:value={newName} placeholder="Neuer Kontakt..." class="add-input" />
	</form>

	<p class="count">{filtered().length} Kontakte</p>

	<div class="contact-list">
		{#each filtered() as contact (contact.id)}
			{@const contactTags = getTagsByIds(allTags, contact.tagIds ?? [])}
			<button
				class="contact-item"
				onclick={() =>
					navigate('detail', {
						contactId: contact.id,
						_siblingIds: filtered().map((c) => c.id),
						_siblingKey: 'contactId',
					})}
				oncontextmenu={(e) => handleItemContextMenu(e, contact)}
				use:dragSource={{
					type: 'contact',
					data: () => ({
						id: contact.id,
						firstName: contact.firstName,
						lastName: contact.lastName,
						company: contact.company,
						email: contact.email,
					}),
				}}
				use:dropTarget={{
					accepts: ['tag'],
					onDrop: (p) => handleTagDrop(contact.id, p.data as unknown as TagDragData),
					canDrop: (p) => !(contact.tagIds ?? []).includes((p.data as unknown as TagDragData).id),
				}}
			>
				<div class="avatar">{initials(contact)}</div>
				<div class="contact-info">
					<p class="contact-name">{displayName(contact)}</p>
					{#if contact.company}
						<p class="contact-company">{contact.company}</p>
					{/if}
					{#if contactTags.length > 0}
						<div class="contact-tags">
							{#each contactTags as tag (tag.id)}
								<span class="tag-pill" style="--tag-color: {tag.color}">
									<span class="tag-dot" style="background: {tag.color}"></span>
									{tag.name}
								</span>
							{/each}
						</div>
					{/if}
				</div>
				{#if contact.isFavorite}
					<span class="fav"><Star size={12} weight="fill" /></span>
				{/if}
			</button>
		{/each}

		{#if filtered().length === 0}
			<p class="empty">Keine Kontakte gefunden</p>
		{/if}
	</div>

	<ContextMenu
		visible={ctxMenu.visible}
		x={ctxMenu.x}
		y={ctxMenu.y}
		items={ctxMenuItems}
		onClose={() => (ctxMenu = { ...ctxMenu, visible: false, contact: null })}
	/>
</div>

<style>
	.app-view {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		height: 100%;
	}
	.search-input {
		padding: 0.375rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: transparent;
		font-size: 0.8125rem;
		color: #374151;
		outline: none;
		width: 100%;
	}
	.search-input::placeholder {
		color: #c0bfba;
	}
	.search-input:focus {
		border-color: rgba(0, 0, 0, 0.15);
	}
	:global(.dark) .search-input {
		border-color: rgba(255, 255, 255, 0.08);
		color: #f3f4f6;
	}
	:global(.dark) .search-input::placeholder {
		color: #4b5563;
	}
	:global(.dark) .search-input:focus {
		border-color: rgba(255, 255, 255, 0.15);
	}
	.quick-add {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: transparent;
	}
	:global(.dark) .quick-add {
		border-color: rgba(255, 255, 255, 0.08);
	}
	.add-icon {
		color: #d1d5db;
		display: flex;
	}
	:global(.dark) .add-icon {
		color: #4b5563;
	}
	.add-input {
		flex: 1;
		border: none;
		background: transparent;
		outline: none;
		font-size: 0.8125rem;
		color: #374151;
	}
	.add-input::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .add-input {
		color: #f3f4f6;
	}
	:global(.dark) .add-input::placeholder {
		color: #4b5563;
	}
	.count {
		font-size: 0.6875rem;
		color: #9ca3af;
	}
	.contact-list {
		flex: 1;
		overflow-y: auto;
	}
	.contact-item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		width: 100%;
		padding: 0.375rem 0.25rem;
		border-radius: 0.25rem;
		border: none;
		background: transparent;
		cursor: pointer;
		text-align: left;
		transition: background 0.15s;
	}
	.contact-item:hover {
		background: rgba(0, 0, 0, 0.03);
	}
	:global(.dark) .contact-item:hover {
		background: rgba(255, 255, 255, 0.04);
	}
	.avatar {
		width: 32px;
		height: 32px;
		border-radius: 9999px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.06);
		font-size: 0.6875rem;
		font-weight: 600;
		color: #6b7280;
	}
	:global(.dark) .avatar {
		background: rgba(255, 255, 255, 0.08);
		color: #9ca3af;
	}
	.contact-info {
		min-width: 0;
		flex: 1;
	}
	.contact-name {
		font-size: 0.8125rem;
		color: #374151;
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	:global(.dark) .contact-name {
		color: #e5e7eb;
	}
	.contact-company {
		font-size: 0.6875rem;
		color: #9ca3af;
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.contact-tags {
		display: flex;
		gap: 0.25rem;
		margin-top: 0.125rem;
	}
	.tag-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.1875rem;
		padding: 0 0.325rem;
		border-radius: 9999px;
		background: color-mix(in srgb, var(--tag-color) 12%, transparent);
		font-size: 0.5625rem;
		color: #6b7280;
		line-height: 1.25rem;
		white-space: nowrap;
	}
	:global(.dark) .tag-pill {
		background: color-mix(in srgb, var(--tag-color) 18%, transparent);
		color: #9ca3af;
	}
	.tag-dot {
		width: 5px;
		height: 5px;
		border-radius: 9999px;
		flex-shrink: 0;
	}
	:global(.contact-item.mana-drop-target-hover) {
		outline: 2px solid rgba(34, 197, 94, 0.4);
		outline-offset: -2px;
		background: rgba(34, 197, 94, 0.06) !important;
	}
	.fav {
		color: #f59e0b;
		display: flex;
	}
	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: #9ca3af;
	}

	/* Mobile: larger touch targets */
	@media (max-width: 640px) {
		.contact-item {
			padding: 0.625rem 0.375rem;
			min-height: 44px;
		}
	}
</style>
