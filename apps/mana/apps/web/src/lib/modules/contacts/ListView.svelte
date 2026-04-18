<!--
  Contacts — Workbench ListView
  Contact list with search + quick create.
  Clicking a contact opens the detail view.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import type { LocalContact } from './types';
	import { contactsStore } from './stores/contacts.svelte';
	import { Star, PencilSimple, Trash, StarFour } from '@mana/shared-icons';
	import FloatingInputBar from '$lib/components/FloatingInputBar.svelte';
	import type { ViewProps } from '$lib/app-registry';
	import { ContextMenu, type ContextMenuItem } from '@mana/shared-ui';
	import { dropTarget, dragSource } from '@mana/shared-ui/dnd';
	import type { TagDragData } from '@mana/shared-ui/dnd';
	import { useAllTags, getTagsByIds } from '@mana/shared-stores';
	import { addTagId } from '$lib/data/tag-mutations';
	import { useItemContextMenu } from '$lib/data/item-context-menu.svelte';
	import ScopeEmptyState from '$lib/components/workbench/ScopeEmptyState.svelte';
	import { hasActiveSceneScope } from '$lib/stores/scene-scope.svelte';

	let { navigate, goBack, params }: ViewProps = $props();

	const tagsQuery = useAllTags();
	let allTags = $derived(tagsQuery.value ?? []);

	function handleTagDrop(contactId: string, tagData: TagDragData) {
		const contact = contacts.find((c) => c.id === contactId);
		if (!contact) return;
		void addTagId(contact.tagIds ?? [], tagData.id, (next) =>
			contactsStore.updateTagIds(contactId, next)
		);
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

	const ctxMenu = useItemContextMenu<LocalContact>();

	let ctxMenuItems = $derived<ContextMenuItem[]>(
		ctxMenu.state.target
			? [
					{
						id: 'open',
						label: 'Öffnen',
						icon: PencilSimple,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) navigate('detail', { contactId: target.id });
						},
					},
					{
						id: 'favorite',
						label: ctxMenu.state.target.isFavorite ? 'Favorit entfernen' : 'Als Favorit',
						icon: Star,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) contactsStore.toggleFavorite(target.id);
						},
					},
					{ id: 'div', label: '', type: 'divider' as const },
					{
						id: 'delete',
						label: 'Löschen',
						icon: Trash,
						variant: 'danger' as const,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) contactsStore.deleteContact(target.id);
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
				oncontextmenu={(e) => ctxMenu.open(e, contact)}
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
			{#if hasActiveSceneScope()}
				<ScopeEmptyState label="Kontakte" />
			{:else}
				<p class="empty">Keine Kontakte gefunden</p>
			{/if}
		{/if}
	</div>

	<FloatingInputBar bind:value={newName} placeholder="Neuer Kontakt..." onSubmit={createContact} />

	<ContextMenu
		visible={ctxMenu.state.visible}
		x={ctxMenu.state.x}
		y={ctxMenu.state.y}
		items={ctxMenuItems}
		onClose={ctxMenu.close}
	/>
</div>

<style>
	.app-view {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		height: 100%;
		position: relative;
	}
	/* P5: theme-token migration. */
	.search-input {
		padding: 0.375rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		outline: none;
		width: 100%;
	}
	.search-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}
	.search-input:focus {
		border-color: hsl(var(--color-border-strong));
	}
	.count {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.contact-list {
		flex: 1;
		overflow-y: auto;
		padding-bottom: 4rem;
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
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
	}
	.contact-item:hover {
		background: hsl(var(--color-surface-hover));
	}
	.avatar {
		width: 32px;
		height: 32px;
		border-radius: 9999px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: hsl(var(--color-muted));
		font-size: 0.6875rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
	}
	.contact-info {
		min-width: 0;
		flex: 1;
	}
	.contact-name {
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.contact-company {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
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
		color: hsl(var(--color-muted-foreground));
		line-height: 1.25rem;
		white-space: nowrap;
	}
	.tag-dot {
		width: 5px;
		height: 5px;
		border-radius: 9999px;
		flex-shrink: 0;
	}
	:global(.contact-item.mana-drop-target-hover) {
		outline: 2px solid hsl(var(--color-success) / 0.4);
		outline-offset: -2px;
		background: hsl(var(--color-success) / 0.06) !important;
	}
	.fav {
		color: hsl(var(--color-warning));
		display: flex;
	}
	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* Mobile: larger touch targets */
	@media (max-width: 640px) {
		.contact-item {
			padding: 0.625rem 0.375rem;
			min-height: 44px;
		}
	}
</style>
