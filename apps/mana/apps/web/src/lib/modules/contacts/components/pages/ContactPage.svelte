<!--
  ContactPage — A single page in the contacts carousel.
  Shows a filtered/sorted contact list inside a PageShell.
-->
<script lang="ts">
	import { isToday, differenceInDays, startOfDay, setYear } from 'date-fns';
	import { dropTarget } from '@mana/shared-ui/dnd';
	import { FavoriteButton } from '@mana/shared-ui';
	import type { DragPayload, TagDragData } from '@mana/shared-ui/dnd';
	import {
		Star,
		Users,
		User,
		Cake,
		Heart,
		Envelope,
		Phone,
		Briefcase,
		MapPin,
		Clock,
	} from '@mana/shared-icons';
	import { PageShell } from '$lib/components/page-carousel';
	import type { Contact } from '../../types';
	import { SELF_CONTACT_ID } from '../../collections';
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
		| 'recent'
		| 'my-profile';

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
		'my-profile': {
			title: 'Mein Profil',
			color: '#8B5CF6',
			icon: User,
			filterFn: (c) => c.id === SELF_CONTACT_ID,
		},
	};

	let meta = $derived(PAGE_META[pageId]);

	let selfContact = $derived(allContacts.find((c) => c.id === SELF_CONTACT_ID && !c.isArchived));

	let filtered = $derived.by(() => {
		const active = allContacts.filter((c) => !c.isArchived);
		const byPage = active.filter(meta.filterFn);
		const searched = searchContacts(byPage, searchQuery);

		// My-profile: just show the self contact
		if (pageId === 'my-profile') return searched;

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

		// Default: sort alphabetically, pin self-contact to top
		const sorted = sortContacts(searched, 'firstName');
		const selfIdx = sorted.findIndex((c) => c.id === SELF_CONTACT_ID);
		if (selfIdx > 0) {
			const [self] = sorted.splice(selfIdx, 1);
			sorted.unshift(self);
		}
		return sorted;
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
		{#if pageId === 'my-profile' && selfContact}
			<!-- Profile card -->
			{@render profileCard(selfContact)}
		{:else if filtered.length === 0}
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

{#snippet profileCard(contact: Contact)}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="profile-card" onclick={() => onOpenContact?.(contact)}>
		<div class="profile-avatar">
			{#if contact.photoUrl}
				<img src={contact.photoUrl} alt={getDisplayName(contact)} class="profile-avatar-img" />
			{:else}
				{getInitials(contact)}
			{/if}
		</div>
		<div class="profile-name">{getDisplayName(contact)}</div>
		{#if contact.email}
			<div class="profile-detail">
				<Envelope size={14} />
				<span>{contact.email}</span>
			</div>
		{/if}
		{#if contact.phone || contact.mobile}
			<div class="profile-detail">
				<Phone size={14} />
				<span>{contact.mobile || contact.phone}</span>
			</div>
		{/if}
		{#if contact.company}
			<div class="profile-detail">
				<Briefcase size={14} />
				<span>{[contact.jobTitle, contact.company].filter(Boolean).join(' @ ')}</span>
			</div>
		{/if}
		{#if contact.city}
			<div class="profile-detail">
				<MapPin size={14} />
				<span>{[contact.street, contact.postalCode, contact.city].filter(Boolean).join(', ')}</span>
			</div>
		{/if}
		{#if contact.birthday}
			<div class="profile-detail">
				<Cake size={14} />
				<span>{contact.birthday}</span>
			</div>
		{/if}
		<div class="profile-hint">Tippe zum Bearbeiten</div>
	</div>
{/snippet}

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
				{#if contact.id === SELF_CONTACT_ID}
					<span class="self-badge">Du</span>
				{/if}
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
		color: hsl(var(--color-muted-foreground));
		background: hsl(var(--color-surface-hover));
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
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
		color: hsl(var(--color-muted-foreground));
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
		color: hsl(var(--color-muted-foreground));
		padding: 0.25rem 0.5rem;
		position: sticky;
		top: 0;
		background: hsl(var(--color-card));
		z-index: 1;
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
		background: hsl(var(--color-surface-hover));
	}
	.avatar {
		width: 2rem;
		height: 2rem;
		border-radius: 9999px;
		background: hsl(var(--color-primary) / 0.12);
		color: hsl(var(--color-primary));
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
		color: hsl(var(--color-foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	:global(.favorite-star) {
		color: hsl(var(--color-warning));
		flex-shrink: 0;
	}
	.contact-subtitle {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
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

	/* Self badge */
	.self-badge {
		font-size: 0.5625rem;
		font-weight: 600;
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		background: hsl(var(--color-primary) / 0.12);
		color: hsl(var(--color-primary));
		flex-shrink: 0;
	}

	/* Profile card */
	.profile-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem 1rem;
		cursor: pointer;
		border-radius: 0.375rem;
		transition: background 0.15s;
	}
	.profile-card:hover {
		background: hsl(var(--color-surface-hover));
	}
	.profile-avatar {
		width: 4.5rem;
		height: 4.5rem;
		border-radius: 9999px;
		background: hsl(var(--color-primary) / 0.12);
		color: hsl(var(--color-primary));
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		font-weight: 600;
		overflow: hidden;
		margin-bottom: 0.75rem;
	}
	.profile-avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.profile-name {
		font-size: 1.125rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
		margin-bottom: 0.75rem;
	}
	.profile-detail {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		padding: 0.25rem 0;
	}
	.profile-hint {
		margin-top: 1rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
