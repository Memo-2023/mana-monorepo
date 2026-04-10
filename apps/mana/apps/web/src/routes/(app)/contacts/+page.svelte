<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { getContext, onMount } from 'svelte';

	import type { DragPayload, TagDragData } from '@mana/shared-ui/dnd';
	import { useAllTags } from '@mana/shared-stores';
	import {
		type Contact,
		contactsStore,
		contactModalStore,
		contactsFilterStore,
	} from '$lib/modules/contacts';
	import { Plus, MagnifyingGlass, X } from '@mana/shared-icons';
	import { PageCarousel, type CarouselPage } from '$lib/components/page-carousel';
	import ContactPage from '$lib/modules/contacts/components/pages/ContactPage.svelte';
	import type { ContactPageId } from '$lib/modules/contacts/components/pages/ContactPage.svelte';
	import ContactPagePicker from '$lib/modules/contacts/components/pages/ContactPagePicker.svelte';

	// Get contacts from layout context (useLiveQueryWithDefault wrapper)
	const allContactsCtx: { readonly value: Contact[] } = getContext('contacts');
	let allContacts = $derived(allContactsCtx.value);

	// Tags for DnD
	const globalTags = useAllTags();
	const tagMap = $derived(new Map((globalTags.value ?? []).map((t) => [t.id, t])));

	function handleTagDrop(contact: Contact, payload: DragPayload) {
		const tagData = payload.data as unknown as TagDragData;
		const current = contact.tagIds ?? [];
		if (!current.includes(tagData.id)) {
			contactsStore.updateTagIds(contact.id, [...current, tagData.id]);
		}
	}

	// Register passive handler for tag→contact direction
	const tagDropCtx = getContext<{
		set: (handler: (tagId: string, payload: DragPayload) => void) => void;
		clear: () => void;
	}>('tagDropHandler');

	onMount(() => {
		tagDropCtx?.set(async (tagId: string, payload: DragPayload) => {
			const data = payload.data as { id: string };
			if (payload.type === 'contact') {
				const contact = allContacts.find((c) => c.id === data.id);
				if (!contact) return;
				const current = contact.tagIds ?? [];
				if (!current.includes(tagId)) {
					contactsStore.updateTagIds(data.id, [...current, tagId]);
				}
			}
		});
		return () => tagDropCtx?.clear();
	});

	// ── Page state ──────────────────────────────────────────
	const DEFAULT_WIDTH = 420;
	let showPicker = $state(false);
	let openPages = $state<
		{ id: string; minimized: boolean; maximized?: boolean; widthPx?: number }[]
	>([
		{ id: 'all', minimized: false },
		{ id: 'favorites', minimized: false },
	]);

	const PAGE_META: Record<string, { title: string; color: string }> = {
		'my-profile': { title: 'Mein Profil', color: '#8B5CF6' },
		all: { title: 'Alle Kontakte', color: '#3B82F6' },
		favorites: { title: 'Favoriten', color: '#F59E0B' },
		'birthday-soon': { title: 'Bald Geburtstag', color: '#EC4899' },
		'has-email': { title: 'Mit E-Mail', color: '#6366F1' },
		'has-phone': { title: 'Mit Telefon', color: '#22C55E' },
		'with-company': { title: 'Mit Unternehmen', color: '#8B5CF6' },
		'with-address': { title: 'Mit Adresse', color: '#F97316' },
		recent: { title: 'Kürzlich hinzugefügt', color: '#6B7280' },
	};

	let carouselPages = $derived<CarouselPage[]>(
		openPages.map((p) => {
			const meta = PAGE_META[p.id];
			return {
				id: p.id,
				minimized: p.minimized,
				maximized: p.maximized,
				widthPx: p.widthPx ?? DEFAULT_WIDTH,
				title: meta?.title ?? p.id,
				color: meta?.color ?? '#6B7280',
			};
		})
	);

	function handleAddPage(pageId: string) {
		if (!openPages.some((p) => p.id === pageId)) {
			openPages = [...openPages, { id: pageId, minimized: false }];
		} else {
			openPages = openPages.map((p) => (p.id === pageId ? { ...p, minimized: false } : p));
		}
		showPicker = false;
	}

	function handleRemovePage(id: string) {
		openPages = openPages.filter((p) => p.id !== id);
	}

	function handleMinimizePage(id: string) {
		openPages = openPages.map((p) => (p.id === id ? { ...p, minimized: true } : p));
	}

	function handleRestorePage(id: string) {
		openPages = openPages.map((p) => (p.id === id ? { ...p, minimized: false } : p));
	}

	function handleMaximizePage(id: string) {
		openPages = openPages.map((p) =>
			p.id === id ? { ...p, maximized: !p.maximized, minimized: false } : p
		);
	}

	function handleResize(id: string, widthPx: number) {
		openPages = openPages.map((p) => (p.id === id ? { ...p, widthPx } : p));
	}

	function navigateToContact(contact: Contact) {
		window.location.href = `/contacts/${contact.id}`;
	}
</script>

<svelte:head>
	<title>Kontakte - Mana</title>
</svelte:head>

<div class="contacts-board">
	<!-- Header -->
	<header class="contacts-header">
		<div>
			<h1 class="contacts-title">Kontakte</h1>
			<p class="contacts-stats">
				{allContacts.filter((c) => !c.isArchived).length} Kontakte
			</p>
		</div>
		<div class="header-actions">
			<!-- Search -->
			<div class="search-bar">
				<MagnifyingGlass size={16} class="search-icon" />
				<input
					type="text"
					placeholder="Suchen..."
					value={contactsFilterStore.searchQuery}
					oninput={(e) => contactsFilterStore.setSearchQuery(e.currentTarget.value)}
					class="search-input"
				/>
				{#if contactsFilterStore.searchQuery}
					<button class="search-clear" onclick={() => contactsFilterStore.setSearchQuery('')}>
						<X size={14} />
					</button>
				{/if}
			</div>
			<button class="new-btn" onclick={() => contactModalStore.open()}>
				<Plus size={16} />
				Neu
			</button>
		</div>
	</header>

	<!-- Page carousel -->
	<PageCarousel
		pages={carouselPages}
		defaultWidth={DEFAULT_WIDTH}
		{showPicker}
		onRestore={handleRestorePage}
		onMaximize={handleMaximizePage}
		onRemove={handleRemovePage}
		onTogglePicker={() => (showPicker = !showPicker)}
		addLabel="Seite hinzufügen"
	>
		{#snippet page(p)}
			<ContactPage
				pageId={p.id as ContactPageId}
				{allContacts}
				widthPx={p.widthPx}
				maximized={p.maximized}
				searchQuery={contactsFilterStore.searchQuery}
				onClose={() => handleRemovePage(p.id)}
				onMinimize={() => handleMinimizePage(p.id)}
				onMaximize={() => handleMaximizePage(p.id)}
				onResize={(w) => handleResize(p.id, w)}
				onOpenContact={navigateToContact}
				onTagDrop={handleTagDrop}
				{tagMap}
			/>
		{/snippet}
		{#snippet picker()}
			<ContactPagePicker
				onSelect={handleAddPage}
				onClose={() => (showPicker = false)}
				activePageIds={openPages.map((p) => p.id)}
			/>
		{/snippet}
	</PageCarousel>
</div>

<!-- New/Edit Contact Modal (preserved from original) -->
{#if contactModalStore.isOpen}
	{@const isEditing = !!contactModalStore.editContactId}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={(e) => e.target === e.currentTarget && contactModalStore.close()}
		onkeydown={(e) => e.key === 'Escape' && contactModalStore.close()}
		tabindex="-1"
		role="presentation"
	>
		<div
			class="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card shadow-xl"
			role="dialog"
			aria-modal="true"
		>
			<div
				class="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-3"
			>
				<h2 class="text-lg font-bold text-foreground">
					{isEditing ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}
				</h2>
				<button
					onclick={() => contactModalStore.close()}
					class="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
				>
					<X size={20} />
				</button>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					const fd = new FormData(e.currentTarget);
					const val = (name: string) => (fd.get(name) as string) || undefined;
					contactsStore.createContact({
						firstName: val('firstName'),
						lastName: val('lastName'),
						email: val('email'),
						phone: val('phone'),
						mobile: val('mobile'),
						company: val('company'),
						jobTitle: val('jobTitle'),
						street: val('street'),
						city: val('city'),
						postalCode: val('postalCode'),
						country: val('country'),
						notes: val('notes'),
						birthday: val('birthday'),
						linkedin: val('linkedin'),
						twitter: val('twitter'),
						instagram: val('instagram'),
						github: val('github'),
						website: val('website'),
					});
					contactModalStore.close();
				}}
				class="space-y-0"
			>
				<div class="contact-section">
					<div class="section-icon-row">
						<span class="section-label">Name</span>
					</div>
					<div class="grid grid-cols-2 gap-2">
						<input
							name="firstName"
							type="text"
							placeholder="Vorname"
							value={contactModalStore.prefillData?.firstName ?? ''}
							class="contact-input"
						/>
						<input
							name="lastName"
							type="text"
							placeholder="Nachname"
							value={contactModalStore.prefillData?.lastName ?? ''}
							class="contact-input"
						/>
					</div>
				</div>

				<div class="contact-section">
					<div class="section-icon-row"><span class="section-label">Kontakt</span></div>
					<input
						name="email"
						type="email"
						placeholder="E-Mail"
						value={contactModalStore.prefillData?.email ?? ''}
						class="contact-input"
					/>
					<div class="grid grid-cols-2 gap-2">
						<input name="mobile" type="tel" placeholder="Mobil" class="contact-input" />
						<input
							name="phone"
							type="tel"
							placeholder="Telefon"
							value={contactModalStore.prefillData?.phone ?? ''}
							class="contact-input"
						/>
					</div>
				</div>

				<div class="contact-section">
					<div class="section-icon-row"><span class="section-label">Arbeit</span></div>
					<input
						name="company"
						type="text"
						placeholder="Unternehmen"
						value={contactModalStore.prefillData?.company ?? ''}
						class="contact-input"
					/>
					<input name="jobTitle" type="text" placeholder="Position" class="contact-input" />
					<input name="website" type="url" placeholder="Website" class="contact-input" />
				</div>

				<div class="contact-section">
					<div class="section-icon-row"><span class="section-label">Adresse</span></div>
					<input
						name="street"
						type="text"
						placeholder="Straße & Hausnummer"
						class="contact-input"
					/>
					<div class="grid grid-cols-[5rem_1fr] gap-2">
						<input name="postalCode" type="text" placeholder="PLZ" class="contact-input" />
						<input name="city" type="text" placeholder="Stadt" class="contact-input" />
					</div>
					<input name="country" type="text" placeholder="Land" class="contact-input" />
				</div>

				<div class="contact-section">
					<div class="section-icon-row"><span class="section-label">🎂 Geburtstag</span></div>
					<input name="birthday" type="date" class="contact-input" />
				</div>

				<div class="contact-section">
					<div class="section-icon-row"><span class="section-label">Notizen</span></div>
					<textarea
						name="notes"
						rows="3"
						placeholder="Notizen zum Kontakt..."
						class="contact-input resize-none"
					></textarea>
				</div>

				<details class="contact-section">
					<summary class="section-icon-row cursor-pointer select-none">
						<span class="section-label">🔗 Social Media</span>
					</summary>
					<div class="mt-2 space-y-2">
						<input name="linkedin" type="url" placeholder="LinkedIn URL" class="contact-input" />
						<input name="twitter" type="text" placeholder="Twitter / X" class="contact-input" />
						<input name="instagram" type="text" placeholder="Instagram" class="contact-input" />
						<input name="github" type="text" placeholder="GitHub" class="contact-input" />
					</div>
				</details>

				<div class="flex justify-end gap-2 border-t border-border px-5 py-3">
					<button
						type="button"
						onclick={() => contactModalStore.close()}
						class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
					>
						Abbrechen
					</button>
					<button
						type="submit"
						class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					>
						Speichern
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.contacts-board {
		min-height: calc(100vh - 140px);
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.contacts-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 0 1rem;
		margin-bottom: 0.75rem;
	}

	.contacts-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
	}

	.contacts-stats {
		margin-top: 0.25rem;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.search-bar {
		position: relative;
		display: flex;
		align-items: center;
	}
	:global(.search-icon) {
		position: absolute;
		left: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		pointer-events: none;
	}
	.search-input {
		width: 180px;
		padding: 0.375rem 0.5rem 0.375rem 2rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-card));
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
		outline: none;
		transition: border-color 0.15s;
	}
	.search-input:focus {
		border-color: hsl(var(--color-primary));
	}
	.search-input::placeholder {
		color: hsl(var(--color-muted-foreground) / 0.5);
	}
	.search-clear {
		position: absolute;
		right: 0.375rem;
		display: flex;
		align-items: center;
		padding: 0.125rem;
		border: none;
		background: none;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		border-radius: 0.25rem;
	}
	.search-clear:hover {
		color: hsl(var(--color-foreground));
	}

	.new-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: 0.5rem;
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.15s;
	}
	.new-btn:hover {
		opacity: 0.9;
	}

	/* Contact Modal Form Styles */
	.contact-section {
		padding: 0.75rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
	}

	.section-icon-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.section-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.contact-input {
		width: 100%;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-background));
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
		outline: none;
		transition: border-color 0.15s;
	}

	.contact-input:focus {
		border-color: hsl(var(--color-primary));
		box-shadow: 0 0 0 2px hsl(var(--color-primary) / 0.15);
	}

	.contact-input::placeholder {
		color: hsl(var(--color-muted-foreground) / 0.5);
	}

	:global(.mana-drop-target-hover) {
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: -2px;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary) / 0.06) !important;
	}

	:global(.mana-drop-target-success) {
		animation: drop-success 400ms ease-out;
	}

	@keyframes drop-success {
		0% {
			outline-color: hsl(var(--color-success));
			background: hsl(var(--color-success) / 0.1);
		}
		100% {
			outline-color: transparent;
			background: transparent;
		}
	}
</style>
