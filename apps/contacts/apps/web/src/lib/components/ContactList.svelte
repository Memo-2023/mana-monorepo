<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { contactsStore } from '$lib/stores/contacts.svelte';
	import { goto } from '$app/navigation';
	import ExportModal from '$lib/components/export/ExportModal.svelte';

	let searchQuery = $state('');
	let searchTimeout: ReturnType<typeof setTimeout>;
	let showExportModal = $state(false);

	function handleSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			contactsStore.setSearch(searchQuery);
			contactsStore.loadContacts();
		}, 300);
	}

	function getInitials(contact: (typeof contactsStore.contacts)[0]) {
		const first = contact.firstName?.[0] || '';
		const last = contact.lastName?.[0] || '';
		return (first + last).toUpperCase() || contact.email?.[0]?.toUpperCase() || '?';
	}

	function getDisplayName(contact: (typeof contactsStore.contacts)[0]) {
		if (contact.displayName) return contact.displayName;
		if (contact.firstName || contact.lastName) {
			return [contact.firstName, contact.lastName].filter(Boolean).join(' ');
		}
		return contact.email || 'Unbekannt';
	}

	async function handleToggleFavorite(e: MouseEvent, id: string) {
		e.stopPropagation();
		await contactsStore.toggleFavorite(id);
	}

	function handleContactClick(id: string) {
		goto(`/contacts/${id}`);
	}

	onMount(async () => {
		// Only load if not already loaded
		if (contactsStore.contacts.length === 0) {
			await contactsStore.loadContacts();
		}
	});
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-foreground">{$_('contacts.title')}</h1>
		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={() => (showExportModal = true)}
				class="btn btn-secondary flex items-center gap-2"
				title={$_('export.title')}
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
					/>
				</svg>
				<span class="hidden sm:inline">{$_('export.button')}</span>
			</button>
			<a href="/contacts/new" class="btn btn-primary flex items-center gap-2">
				<span>+</span>
				<span>{$_('contacts.new')}</span>
			</a>
		</div>
	</div>

	<!-- Search -->
	<div class="relative">
		<input
			type="text"
			placeholder={$_('contacts.search')}
			bind:value={searchQuery}
			oninput={handleSearch}
			class="input w-full pl-10"
		/>
		<svg
			class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
			/>
		</svg>
	</div>

	<!-- Loading state -->
	{#if contactsStore.loading}
		<div class="flex justify-center py-12">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
			></div>
		</div>
	{:else if contactsStore.contacts.length === 0}
		<!-- Empty state -->
		<div class="text-center py-12">
			<div class="text-6xl mb-4">👤</div>
			<h2 class="text-xl font-semibold text-foreground mb-2">{$_('contacts.noContacts')}</h2>
			<p class="text-muted-foreground mb-4">{$_('contacts.addFirst')}</p>
			<a href="/contacts/new" class="btn btn-primary">
				{$_('contacts.new')}
			</a>
		</div>
	{:else}
		<!-- Contacts List -->
		<div class="space-y-2">
			{#each contactsStore.contacts as contact (contact.id)}
				<div
					role="button"
					tabindex="0"
					onclick={() => handleContactClick(contact.id)}
					onkeydown={(e) => e.key === 'Enter' && handleContactClick(contact.id)}
					class="contact-card w-full text-left cursor-pointer"
				>
					<!-- Avatar -->
					<div class="avatar">
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

					<!-- Contact Info -->
					<div class="flex-1 min-w-0">
						<div class="font-medium text-foreground truncate">
							{getDisplayName(contact)}
						</div>
						{#if contact.company || contact.jobTitle}
							<div class="text-sm text-muted-foreground truncate">
								{[contact.jobTitle, contact.company].filter(Boolean).join(' @ ')}
							</div>
						{/if}
						{#if contact.email}
							<div class="text-sm text-muted-foreground truncate">
								{contact.email}
							</div>
						{/if}
					</div>

					<!-- Favorite button -->
					<button
						onclick={(e) => handleToggleFavorite(e, contact.id)}
						class="p-2 rounded-full hover:bg-accent transition-colors"
					>
						{#if contact.isFavorite}
							<svg class="h-5 w-5 text-red-500 fill-current" viewBox="0 0 24 24">
								<path
									d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
								/>
							</svg>
						{:else}
							<svg
								class="h-5 w-5 text-muted-foreground"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
								/>
							</svg>
						{/if}
					</button>
				</div>
			{/each}
		</div>

		<!-- Total count -->
		<p class="text-sm text-muted-foreground text-center">
			{contactsStore.total} Kontakte
		</p>
	{/if}
</div>

<!-- Export Modal -->
<ExportModal isOpen={showExportModal} onClose={() => (showExportModal = false)} />
