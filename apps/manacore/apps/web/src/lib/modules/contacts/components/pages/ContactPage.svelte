<!--
  ContactPage — A single page in the contacts carousel.
  Shows a filtered/sorted contact list inside a PageShell.
-->
<script lang="ts">
	import { isToday, differenceInDays, startOfDay, setYear } from 'date-fns';
	import { dropTarget } from '@manacore/shared-ui/dnd';
	import { FavoriteButton } from '@manacore/shared-ui';
	import type { DragPayload, TagDragData } from '@manacore/shared-ui/dnd';
	import {
		Star,
		Users,
		Cake,
		Heart,
		Envelope,
		Phone,
		Briefcase,
		MapPin,
		Clock,
	} from '@manacore/shared-icons';
	import { PageShell } from '$lib/components/page-carousel';
	import type { Contact } from '../../types';
	import {
		getDisplayName,
		getInitials,
		searchContacts,
		sortContacts,
		groupByLetter,
	} from '../../queries';
	import { contactsStore } from '../../stores/contacts.svelte';
	import type { Component } from 'svelte';

	export type ContactPageId =
		| 'all'
		| 'favorites'
		| 'birthday-soon'
		| 'has-email'
		| 'has-phone'
		| 'with-company'
		| 'with-address'
		| 'recent';

	interface Props {
		pageId: ContactPageId;
		allContacts: Contact[];
		widthPx: number;
		maximized?: boolean;
		searchQuery?: string;
		onClose: () => void;
		onMinimize?: () => void;
		onMaximize?: () => void;
		onResize?: (widthPx: number) => void;
		onOpenContact?: (contact: Contact) => void;
		onTagDrop?: (contact: Contact, payload: DragPayload) => void;
		tagMap?: Map<string, { id: string; name: string; color: string | null }>;
	}

	let {
		pageId,
		allContacts,
		widthPx,
		maximized = false,
		searchQuery = '',
		onClose,
		onMinimize,
		onMaximize,
		onResize,
		onOpenContact,
		onTagDrop,
		tagMap,
	}: Props = $props();

	const PAGE_META: Record<
		ContactPageId,
		{ title: string; color: string; icon: Component; filterFn: (c: Contact) => boolean }
	> = {
		all: {
			title: 'Alle Kontakte',
			color: '#3B82F6',
			icon: Users,
			filterFn: () => true,
		},
		favorites: {
			title: 'Favoriten',
			color: '#F59E0B',
			icon: Star,
			filterFn: (c) => c.isFavorite,
		},
		'birthday-soon': {
			title: 'Bald Geburtstag',
			color: '#EC4899',
			icon: Cake,
			filterFn: (c) => {
				if (!c.birthday) return false;
				const today = startOfDay(new Date());
				const bday = startOfDay(setYear(new Date(c.birthday), today.getFullYear()));
				const diff = differenceInDays(bday, today);
				// Show birthdays in the next 30 days (or today)
				return diff >= 0 && diff <= 30;
			},
		},
		'has-email': {
			title: 'Mit E-Mail',
			color: '#6366F1',
			icon: Envelope,
			filterFn: (c) => !!c.email,
		},
		'has-phone': {
			title: 'Mit Telefon',
			color: '#22C55E',
			icon: Phone,
			filterFn: (c) => !!c.phone || !!c.mobile,
		},
		'with-company': {
			title: 'Mit Unternehmen',
			color: '#8B5CF6',
			icon: Briefcase,
			filterFn: (c) => !!c.company,
		},
		'with-address': {
			title: 'Mit Adresse',
			color: '#F97316',
			icon: MapPin,
			filterFn: (c) => !!c.city || !!c.street,
		},
		recent: {
			title: 'Kürzlich hinzugefügt',
			color: '#6B7280',
			icon: Clock,
			filterFn: (c) => {
				const days = differenceInDays(new Date(), new Date(c.createdAt));
				return days <= 14;
			},
		},
	};

	let meta = $derived(PAGE_META[pageId]);

	let filtered = $derived.by(() => {
		const active = allContacts.filter((c) => !c.isArchived);
		const byPage = active.filter(meta.filterFn);
		const searched = searchContacts(byPage, searchQuery);

		// Birthday-soon: sort by upcoming birthday
		if (pageId === 'birthday-soon') {
			const today = startOfDay(new Date());
			return [...searched].sort((a, b) => {
				const aDay = startOfDay(setYear(new Date(a.birthday!), today.getFullYear()));
				const bDay = startOfDay(setYear(new Date(b.birthday!), today.getFullYear()));
				return differenceInDays(aDay, today) - differenceInDays(bDay, today);
			});
		}

		// Recent: sort by newest first
		if (pageId === 'recent') {
			return [...searched].sort(
				(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			);
		}

		return sortContacts(searched, 'firstName');
	});

	let groups = $derived(
		pageId === 'birthday-soon' || pageId === 'recent' ? null : groupByLetter(filtered, 'firstName')
	);
	let letters = $derived(groups ? Object.keys(groups).sort() : []);

	function getContactTags(contact: Contact) {
		if (!tagMap) return [];
		return (contact.tagIds ?? [])
			.map((id) => tagMap.get(id))
			.filter((t): t is NonNullable<typeof t> => t != null);
	}

	function tagNotAlreadyOnContact(contact: Contact) {
		return (payload: DragPayload) => {
			const tagData = payload.data as unknown as TagDragData;
			return !(contact.tagIds ?? []).includes(tagData.id);
		};
	}

	function getBirthdayLabel(birthday: string): string {
		const today = startOfDay(new Date());
		const bday = startOfDay(setYear(new Date(birthday), today.getFullYear()));
		const diff = differenceInDays(bday, today);
		if (diff === 0) return 'Heute!';
		if (diff === 1) return 'Morgen';
		return `in ${diff} Tagen`;
	}
</script>

<PageShell
	{widthPx}
	{maximized}
	title={meta.title}
	color={meta.color}
	icon={meta.icon}
	{onClose}
	{onMinimize}
	{onMaximize}
	{onResize}
>
	{#snippet badge()}
		<span class="contact-count">{filtered.length}</span>
	{/snippet}

	<div class="page-content">
		{#if filtered.length === 0}
			<div class="empty-state">
				<meta.icon size={28} />
				<span>Keine Kontakte</span>
			</div>
		{:else if groups}
			<!-- Alphabetical grouping -->
			{#each letters as letter (letter)}
				<div class="letter-group">
					<div class="letter-header">{letter}</div>
					{#each groups[letter] as contact (contact.id)}
						{@render contactRow(contact)}
					{/each}
				</div>
			{/each}
		{:else}
			<!-- Flat list (birthday-soon, recent) -->
			{#each filtered as contact (contact.id)}
				{@render contactRow(contact)}
			{/each}
		{/if}
	</div>
</PageShell>

{#snippet contactRow(contact: Contact)}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="contact-row"
		onclick={() => onOpenContact?.(contact)}
		use:dropTarget={{
			accepts: ['tag'],
			onDrop: (payload) => onTagDrop?.(contact, payload),
			canDrop: tagNotAlreadyOnContact(contact),
		}}
	>
		<!-- Avatar -->
		<div class="avatar">
			{#if contact.photoUrl}
				<img src={contact.photoUrl} alt={getDisplayName(contact)} class="avatar-img" />
			{:else}
				{getInitials(contact)}
			{/if}
		</div>

		<!-- Info -->
		<div class="contact-info">
			<div class="contact-name-row">
				<span class="contact-name">{getDisplayName(contact)}</span>
				{#if contact.isFavorite}
					<Star weight="fill" size={12} class="favorite-star" />
				{/if}
			</div>
			{#if contact.company || contact.jobTitle}
				<div class="contact-subtitle">
					{[contact.jobTitle, contact.company].filter(Boolean).join(' @ ')}
				</div>
			{/if}
			{#if pageId === 'birthday-soon' && contact.birthday}
				<div class="birthday-badge">
					🎂 {getBirthdayLabel(contact.birthday)}
				</div>
			{/if}
			{#if getContactTags(contact).length > 0}
				<div class="tag-row">
					{#each getContactTags(contact).slice(0, 3) as tag (tag.id)}
						<span
							class="tag-pill"
							style="background: color-mix(in srgb, {tag.color} 15%, transparent); color: {tag.color}"
						>
							{tag.name}
						</span>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Favorite toggle -->
		<div class="row-actions">
			<FavoriteButton
				active={contact.isFavorite}
				onclick={() => contactsStore.toggleFavorite(contact.id)}
				variant="star"
				size={14}
				activeColor="#f59e0b"
			/>
		</div>
	</div>
{/snippet}

<style>
	.contact-count {
		font-size: 0.75rem;
		font-weight: 500;
		color: #9ca3af;
		background: rgba(0, 0, 0, 0.05);
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
	}
	:global(.dark) .contact-count {
		background: rgba(255, 255, 255, 0.1);
		color: #6b7280;
	}

	.page-content {
		padding: 0.5rem 0.75rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 200px;
		color: #9ca3af;
		font-size: 0.8125rem;
	}

	.letter-group {
		margin-bottom: 0.5rem;
	}
	.letter-header {
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #9ca3af;
		padding: 0.25rem 0.5rem;
		position: sticky;
		top: 0;
		background: #fffef5;
		z-index: 1;
	}
	:global(.dark) .letter-header {
		background: #252220;
	}

	.contact-row {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: background 0.15s;
	}
	.contact-row:hover {
		background: rgba(0, 0, 0, 0.03);
	}
	:global(.dark) .contact-row:hover {
		background: rgba(255, 255, 255, 0.04);
	}

	.avatar {
		width: 2rem;
		height: 2rem;
		border-radius: 9999px;
		background: color-mix(in srgb, var(--color-primary, #8b5cf6) 12%, transparent);
		color: var(--color-primary, #8b5cf6);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.6875rem;
		font-weight: 600;
		flex-shrink: 0;
		overflow: hidden;
	}
	.avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.contact-info {
		flex: 1;
		min-width: 0;
	}
	.contact-name-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.contact-name {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #374151;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	:global(.dark) .contact-name {
		color: #f3f4f6;
	}
	:global(.favorite-star) {
		color: #f59e0b;
		flex-shrink: 0;
	}
	.contact-subtitle {
		font-size: 0.6875rem;
		color: #9ca3af;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.birthday-badge {
		font-size: 0.6875rem;
		color: #ec4899;
		font-weight: 500;
		margin-top: 0.125rem;
	}
	.tag-row {
		display: flex;
		gap: 0.25rem;
		margin-top: 0.125rem;
	}
	.tag-pill {
		font-size: 0.5625rem;
		font-weight: 500;
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
	}

	.row-actions {
		opacity: 0;
		transition: opacity 0.15s;
		flex-shrink: 0;
	}
	.contact-row:hover .row-actions {
		opacity: 1;
	}
</style>
