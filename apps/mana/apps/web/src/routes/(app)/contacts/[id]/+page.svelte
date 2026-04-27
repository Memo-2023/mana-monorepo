<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { type Contact, contactsStore, getDisplayName, getInitials } from '$lib/modules/contacts';
	import {
		CaretLeft,
		Star,
		Archive,
		Trash,
		PencilSimple,
		Envelope,
		Phone,
		DeviceMobile,
		Buildings,
		Briefcase,
		MapPin,
		Cake,
		Note,
		Globe,
		GithubLogo,
		LinkedinLogo,
		TwitterLogo,
		InstagramLogo,
		ShareNetwork,
	} from '@mana/shared-icons';
	import { ShareModal } from '@mana/shared-uload';
	import { TagField } from '@mana/shared-ui';
	import { useAllTags } from '@mana/shared-stores';
	import { RoutePage } from '$lib/components/shell';

	const allTags = useAllTags();

	const allContactsCtx: { readonly value: Contact[] } = getContext('contacts');
	let allContacts = $derived(allContactsCtx.value);

	let contactId = $derived($page.params.id ?? '');
	let contact = $derived(allContacts.find((c) => c.id === contactId));

	// Editing state
	let isEditing = $state(false);
	let editData = $state<Partial<Contact>>({});

	function startEdit() {
		if (!contact) return;
		editData = {
			firstName: contact.firstName,
			lastName: contact.lastName,
			email: contact.email,
			phone: contact.phone,
			mobile: contact.mobile,
			company: contact.company,
			jobTitle: contact.jobTitle,
			street: contact.street,
			city: contact.city,
			postalCode: contact.postalCode,
			country: contact.country,
			notes: contact.notes,
			birthday: contact.birthday,
			website: contact.website,
			linkedin: contact.linkedin,
			twitter: contact.twitter,
			instagram: contact.instagram,
			github: contact.github,
			tagIds: contact.tagIds ?? [],
		};
		isEditing = true;
	}

	async function saveEdit() {
		if (!contact) return;
		await contactsStore.updateContact(contact.id, editData);
		isEditing = false;
	}

	function cancelEdit() {
		isEditing = false;
		editData = {};
	}

	async function handleToggleFavorite() {
		if (!contact) return;
		await contactsStore.toggleFavorite(contact.id);
	}

	async function handleArchive() {
		if (!contact) return;
		await contactsStore.toggleArchive(contact.id);
		goto('/contacts');
	}

	async function handleDelete() {
		if (!contact) return;
		if (
			!confirm($_('contacts.detail.confirm_delete', { values: { name: getDisplayName(contact) } }))
		)
			return;
		await contactsStore.deleteContact(contact.id);
		goto('/contacts');
	}

	// Share modal
	let showShare = $state(false);
	let shareUrl = $derived(
		contact
			? `${typeof window !== 'undefined' ? window.location.origin : ''}/contacts/${contact.id}`
			: ''
	);
	let shareTitle = $derived(contact ? getDisplayName(contact) : '');

	const inputClass =
		'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
</script>

<svelte:head>
	<title
		>{$_('contacts.detail.page_title_html', {
			values: {
				name: contact ? getDisplayName(contact) : $_('contacts.detail.page_title_fallback'),
			},
		})}</title
	>
</svelte:head>

<RoutePage appId="contacts" backHref="/contacts" title={$_('contacts.detail.page_title_fallback')}>
	<div class="mx-auto max-w-2xl">
		<!-- Back Link -->
		<a
			href="/contacts"
			class="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
		>
			<CaretLeft size={16} />
			{$_('contacts.detail.breadcrumb')}
		</a>

		{#if !contact}
			<div class="flex flex-col items-center py-16 text-center">
				<h2 class="text-lg font-semibold text-foreground">
					{$_('contacts.detail.empty_title')}
				</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{$_('contacts.detail.empty_hint')}
				</p>
				<a
					href="/contacts"
					class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
				>
					{$_('contacts.detail.empty_back')}
				</a>
			</div>
		{:else}
			<!-- Profile Header -->
			<div class="mb-6 rounded-xl border border-border bg-card p-6">
				<div class="flex items-start gap-4">
					<!-- Avatar -->
					<div
						class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary"
					>
						{#if contact.photoUrl}
							<img
								src={contact.photoUrl}
								alt={getDisplayName(contact)}
								class="h-full w-full rounded-full object-cover"
							/>
						{:else}
							{getInitials(contact)}
						{/if}
					</div>

					<!-- Name & Title -->
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<h1 class="text-xl font-bold text-foreground">{getDisplayName(contact)}</h1>
							{#if contact.isFavorite}
								<Star weight="fill" size={18} class="text-amber-500" />
							{/if}
						</div>
						{#if contact.company || contact.jobTitle}
							<p class="mt-0.5 text-sm text-muted-foreground">
								{[contact.jobTitle, contact.company].filter(Boolean).join(' @ ')}
							</p>
						{/if}
					</div>

					<!-- Actions -->
					<div class="flex gap-1">
						<button
							onclick={() => (showShare = true)}
							class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							title={$_('contacts.detail.action_share_title')}
						>
							<ShareNetwork size={18} />
						</button>
						<button
							onclick={() => startEdit()}
							class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							title={$_('common.edit')}
						>
							<PencilSimple size={18} />
						</button>
						<button
							onclick={handleToggleFavorite}
							class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-amber-500"
							title={contact.isFavorite
								? $_('contacts.detail.action_unfavorite_title')
								: $_('contacts.detail.action_favorite_title')}
						>
							{#if contact.isFavorite}
								<Star weight="fill" size={18} class="text-amber-500" />
							{:else}
								<Star size={18} />
							{/if}
						</button>
						<button
							onclick={handleArchive}
							class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
							title={$_('contacts.detail.action_archive_title')}
						>
							<Archive size={18} />
						</button>
						<button
							onclick={handleDelete}
							class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-red-500"
							title={$_('contacts.detail.action_delete_title')}
						>
							<Trash size={18} />
						</button>
					</div>
				</div>
			</div>

			<!-- Contact Details -->
			{#if isEditing}
				<!-- Edit Form -->
				<div class="space-y-4">
					<!-- Name -->
					<div class="rounded-xl border border-border bg-card p-5">
						<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
							Name
						</h2>
						<div class="grid grid-cols-2 gap-3">
							<input
								type="text"
								placeholder="Vorname"
								value={editData.firstName ?? ''}
								oninput={(e) => (editData.firstName = e.currentTarget.value || null)}
								class={inputClass}
							/>
							<input
								type="text"
								placeholder="Nachname"
								value={editData.lastName ?? ''}
								oninput={(e) => (editData.lastName = e.currentTarget.value || null)}
								class={inputClass}
							/>
						</div>
					</div>

					<!-- Contact -->
					<div class="rounded-xl border border-border bg-card p-5">
						<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
							Kontakt
						</h2>
						<div class="space-y-3">
							<input
								type="email"
								placeholder="E-Mail"
								value={editData.email ?? ''}
								oninput={(e) => (editData.email = e.currentTarget.value || null)}
								class={inputClass}
							/>
							<div class="grid grid-cols-2 gap-3">
								<input
									type="tel"
									placeholder="Mobil"
									value={editData.mobile ?? ''}
									oninput={(e) => (editData.mobile = e.currentTarget.value || null)}
									class={inputClass}
								/>
								<input
									type="tel"
									placeholder="Telefon"
									value={editData.phone ?? ''}
									oninput={(e) => (editData.phone = e.currentTarget.value || null)}
									class={inputClass}
								/>
							</div>
						</div>
					</div>

					<!-- Work -->
					<div class="rounded-xl border border-border bg-card p-5">
						<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
							Arbeit
						</h2>
						<div class="space-y-3">
							<input
								type="text"
								placeholder="Unternehmen"
								value={editData.company ?? ''}
								oninput={(e) => (editData.company = e.currentTarget.value || null)}
								class={inputClass}
							/>
							<input
								type="text"
								placeholder="Position"
								value={editData.jobTitle ?? ''}
								oninput={(e) => (editData.jobTitle = e.currentTarget.value || null)}
								class={inputClass}
							/>
							<input
								type="url"
								placeholder="Website"
								value={editData.website ?? ''}
								oninput={(e) => (editData.website = e.currentTarget.value || null)}
								class={inputClass}
							/>
						</div>
					</div>

					<!-- Address -->
					<div class="rounded-xl border border-border bg-card p-5">
						<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
							Adresse
						</h2>
						<div class="space-y-3">
							<input
								type="text"
								placeholder="Straße & Hausnummer"
								value={editData.street ?? ''}
								oninput={(e) => (editData.street = e.currentTarget.value || null)}
								class={inputClass}
							/>
							<div class="grid grid-cols-[5rem_1fr] gap-3">
								<input
									type="text"
									placeholder="PLZ"
									value={editData.postalCode ?? ''}
									oninput={(e) => (editData.postalCode = e.currentTarget.value || null)}
									class={inputClass}
								/>
								<input
									type="text"
									placeholder="Stadt"
									value={editData.city ?? ''}
									oninput={(e) => (editData.city = e.currentTarget.value || null)}
									class={inputClass}
								/>
							</div>
							<input
								type="text"
								placeholder="Land"
								value={editData.country ?? ''}
								oninput={(e) => (editData.country = e.currentTarget.value || null)}
								class={inputClass}
							/>
						</div>
					</div>

					<!-- Birthday -->
					<div class="rounded-xl border border-border bg-card p-5">
						<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
							Geburtstag
						</h2>
						<input
							type="date"
							value={editData.birthday ?? ''}
							oninput={(e) => (editData.birthday = e.currentTarget.value || null)}
							class={inputClass}
						/>
					</div>

					<!-- Notes -->
					<div class="rounded-xl border border-border bg-card p-5">
						<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
							Notizen
						</h2>
						<textarea
							placeholder="Notizen zum Kontakt..."
							value={editData.notes ?? ''}
							oninput={(e) => (editData.notes = e.currentTarget.value || null)}
							rows="4"
							class={inputClass}
						></textarea>
					</div>

					<!-- Tags -->
					<div class="rounded-xl border border-border bg-card p-5">
						<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
							Tags
						</h2>
						<TagField
							tags={allTags.value}
							selectedIds={(editData.tagIds as string[]) ?? []}
							onChange={(ids) => (editData = { ...editData, tagIds: ids })}
						/>
					</div>

					<!-- Social Media -->
					<div class="rounded-xl border border-border bg-card p-5">
						<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
							Social Media
						</h2>
						<div class="space-y-3">
							<input
								type="url"
								placeholder="LinkedIn URL"
								value={editData.linkedin ?? ''}
								oninput={(e) => (editData.linkedin = e.currentTarget.value || null)}
								class={inputClass}
							/>
							<input
								type="text"
								placeholder="Twitter / X"
								value={editData.twitter ?? ''}
								oninput={(e) => (editData.twitter = e.currentTarget.value || null)}
								class={inputClass}
							/>
							<input
								type="text"
								placeholder="Instagram"
								value={editData.instagram ?? ''}
								oninput={(e) => (editData.instagram = e.currentTarget.value || null)}
								class={inputClass}
							/>
							<input
								type="text"
								placeholder="GitHub"
								value={editData.github ?? ''}
								oninput={(e) => (editData.github = e.currentTarget.value || null)}
								class={inputClass}
							/>
						</div>
					</div>

					<!-- Actions -->
					<div class="flex justify-end gap-2">
						<button
							type="button"
							onclick={cancelEdit}
							class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
							>{$_('common.cancel')}</button
						>
						<button
							type="button"
							onclick={saveEdit}
							class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
							>{$_('common.save')}</button
						>
					</div>
				</div>
			{:else}
				<!-- Quick Actions -->
				{#if contact.email || contact.phone || contact.mobile}
					<div class="mb-4 flex gap-2">
						{#if contact.phone}
							<a
								href="tel:{contact.phone}"
								class="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
							>
								<Phone size={16} />
								{$_('contacts.detail.quick_call')}
							</a>
						{/if}
						{#if contact.email}
							<a
								href="mailto:{contact.email}"
								class="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
							>
								<Envelope size={16} />
								{$_('contacts.detail.quick_email')}
							</a>
						{/if}
						{#if contact.mobile}
							<a
								href="sms:{contact.mobile}"
								class="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
							>
								<DeviceMobile size={16} />
								{$_('contacts.detail.quick_sms')}
							</a>
						{/if}
					</div>
				{/if}

				<!-- Detail Cards -->
				<div class="space-y-4">
					<!-- Contact Info -->
					<div class="rounded-xl border border-border bg-card p-5">
						<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
							{$_('contacts.detail.section_contact')}
						</h2>
						<div class="space-y-3">
							{#if contact.email}
								<div class="flex items-center gap-3">
									<Envelope size={16} class="flex-shrink-0 text-muted-foreground" />
									<a href="mailto:{contact.email}" class="text-sm text-primary hover:underline"
										>{contact.email}</a
									>
								</div>
							{/if}
							{#if contact.mobile}
								<div class="flex items-center gap-3">
									<DeviceMobile size={16} class="flex-shrink-0 text-muted-foreground" />
									<a href="tel:{contact.mobile}" class="text-sm text-primary hover:underline"
										>{contact.mobile}</a
									>
									<span class="text-xs text-muted-foreground"
										>{$_('contacts.detail.label_mobile')}</span
									>
								</div>
							{/if}
							{#if contact.phone}
								<div class="flex items-center gap-3">
									<Phone size={16} class="flex-shrink-0 text-muted-foreground" />
									<a href="tel:{contact.phone}" class="text-sm text-primary hover:underline"
										>{contact.phone}</a
									>
									<span class="text-xs text-muted-foreground"
										>{$_('contacts.detail.label_phone')}</span
									>
								</div>
							{/if}
						</div>
						{#if !contact.email && !contact.phone && !contact.mobile}
							<p class="text-sm text-muted-foreground">
								{$_('contacts.detail.empty_contact_info')}
							</p>
						{/if}
					</div>

					<!-- Work -->
					{#if contact.company || contact.jobTitle || contact.website}
						<div class="rounded-xl border border-border bg-card p-5">
							<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
								{$_('contacts.detail.section_work')}
							</h2>
							<div class="space-y-3">
								{#if contact.company}
									<div class="flex items-center gap-3">
										<Buildings size={16} class="flex-shrink-0 text-muted-foreground" />
										<span class="text-sm text-foreground">{contact.company}</span>
									</div>
								{/if}
								{#if contact.jobTitle}
									<div class="flex items-center gap-3">
										<Briefcase size={16} class="flex-shrink-0 text-muted-foreground" />
										<span class="text-sm text-foreground">{contact.jobTitle}</span>
									</div>
								{/if}
								{#if contact.website}
									<div class="flex items-center gap-3">
										<Globe size={16} class="flex-shrink-0 text-muted-foreground" />
										<a
											href={contact.website.startsWith('http')
												? contact.website
												: `https://${contact.website}`}
											target="_blank"
											rel="noopener"
											class="text-sm text-primary hover:underline">{contact.website}</a
										>
									</div>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Address -->
					{#if contact.street || contact.city || contact.postalCode || contact.country}
						<div class="rounded-xl border border-border bg-card p-5">
							<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
								{$_('contacts.detail.section_address')}
							</h2>
							<div class="flex items-start gap-3">
								<MapPin size={16} class="mt-0.5 flex-shrink-0 text-muted-foreground" />
								<div class="text-sm text-foreground">
									{#if contact.street}<div>{contact.street}</div>{/if}
									{#if contact.postalCode || contact.city}
										<div>{[contact.postalCode, contact.city].filter(Boolean).join(' ')}</div>
									{/if}
									{#if contact.country}<div>{contact.country}</div>{/if}
								</div>
							</div>
						</div>
					{/if}

					<!-- Birthday -->
					{#if contact.birthday}
						<div class="rounded-xl border border-border bg-card p-5">
							<div class="flex items-center gap-3">
								<Cake size={16} class="flex-shrink-0 text-muted-foreground" />
								<span class="text-sm text-foreground">
									{formatDate(new Date(contact.birthday), {
										day: 'numeric',
										month: 'long',
										year: 'numeric',
									})}
								</span>
							</div>
						</div>
					{/if}

					<!-- Notes -->
					{#if contact.notes}
						<div class="rounded-xl border border-border bg-card p-5">
							<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
								{$_('contacts.detail.section_notes')}
							</h2>
							<p class="whitespace-pre-wrap text-sm text-foreground">{contact.notes}</p>
						</div>
					{/if}

					<!-- Social Media -->
					{#if contact.linkedin || contact.twitter || contact.instagram || contact.github}
						<div class="rounded-xl border border-border bg-card p-5">
							<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
								{$_('contacts.detail.section_social')}
							</h2>
							<div class="space-y-3">
								{#if contact.linkedin}
									<div class="flex items-center gap-3">
										<LinkedinLogo size={16} class="flex-shrink-0 text-muted-foreground" />
										<a
											href={contact.linkedin.startsWith('http')
												? contact.linkedin
												: `https://linkedin.com/in/${contact.linkedin}`}
											target="_blank"
											rel="noopener"
											class="text-sm text-primary hover:underline">{contact.linkedin}</a
										>
									</div>
								{/if}
								{#if contact.twitter}
									<div class="flex items-center gap-3">
										<TwitterLogo size={16} class="flex-shrink-0 text-muted-foreground" />
										<a
											href={contact.twitter.startsWith('http')
												? contact.twitter
												: `https://x.com/${contact.twitter}`}
											target="_blank"
											rel="noopener"
											class="text-sm text-primary hover:underline">{contact.twitter}</a
										>
									</div>
								{/if}
								{#if contact.instagram}
									<div class="flex items-center gap-3">
										<InstagramLogo size={16} class="flex-shrink-0 text-muted-foreground" />
										<a
											href={contact.instagram.startsWith('http')
												? contact.instagram
												: `https://instagram.com/${contact.instagram}`}
											target="_blank"
											rel="noopener"
											class="text-sm text-primary hover:underline">{contact.instagram}</a
										>
									</div>
								{/if}
								{#if contact.github}
									<div class="flex items-center gap-3">
										<GithubLogo size={16} class="flex-shrink-0 text-muted-foreground" />
										<a
											href={contact.github.startsWith('http')
												? contact.github
												: `https://github.com/${contact.github}`}
											target="_blank"
											rel="noopener"
											class="text-sm text-primary hover:underline">{contact.github}</a
										>
									</div>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Tags -->
					{#if contact.tags.length > 0}
						<div class="rounded-xl border border-border bg-card p-5">
							<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
								{$_('contacts.detail.section_tags')}
							</h2>
							<div class="flex flex-wrap gap-2">
								{#each contact.tags as tag (tag.id)}
									<span
										class="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
										>{tag.name}</span
									>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Metadata -->
					<div class="rounded-xl border border-border bg-card p-5">
						<div class="grid grid-cols-2 gap-y-2 text-xs text-muted-foreground">
							<span>{$_('contacts.detail.meta_created')}</span>
							<span
								>{formatDate(new Date(contact.createdAt), {
									day: 'numeric',
									month: 'short',
									year: 'numeric',
								})}</span
							>
							<span>{$_('contacts.detail.meta_updated')}</span>
							<span
								>{formatDate(new Date(contact.updatedAt), {
									day: 'numeric',
									month: 'short',
									year: 'numeric',
								})}</span
							>
						</div>
					</div>
				</div>
			{/if}
		{/if}
	</div>

	<!-- Share Modal (uLoad integration) -->
	<ShareModal
		visible={showShare}
		onClose={() => (showShare = false)}
		url={shareUrl}
		title={shareTitle}
		source="contacts"
		description={contact?.company ? `${contact.jobTitle ?? ''} @ ${contact.company}`.trim() : ''}
	/>
</RoutePage>
