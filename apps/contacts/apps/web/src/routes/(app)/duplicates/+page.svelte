<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { duplicatesApi, type DuplicateGroup } from '$lib/api/duplicates';
	import MergeModal from '$lib/components/duplicates/MergeModal.svelte';
	import { DuplicateListSkeleton } from '$lib/components/skeletons';
	import { toastStore } from '@manacore/shared-ui';
	import { ArrowsClockwise } from '@manacore/shared-icons';

	let duplicates = $state<DuplicateGroup[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let selectedGroup = $state<DuplicateGroup | null>(null);
	let showMergeModal = $state(false);

	async function loadDuplicates() {
		loading = true;
		error = null;
		try {
			const result = await duplicatesApi.findDuplicates();
			duplicates = result.duplicates;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Laden der Duplikate';
			console.error('Failed to load duplicates:', e);
		} finally {
			loading = false;
		}
	}

	function getMatchTypeLabel(type: 'email' | 'phone' | 'name') {
		switch (type) {
			case 'email':
				return 'E-Mail';
			case 'phone':
				return 'Telefon';
			case 'name':
				return 'Name';
		}
	}

	function getMatchTypeIcon(type: 'email' | 'phone' | 'name') {
		switch (type) {
			case 'email':
				return '✉️';
			case 'phone':
				return '📞';
			case 'name':
				return '👤';
		}
	}

	function getInitials(contact: DuplicateGroup['contacts'][0]) {
		const first = contact.firstName?.[0] || '';
		const last = contact.lastName?.[0] || '';
		return (first + last).toUpperCase() || contact.email?.[0]?.toUpperCase() || '?';
	}

	function getDisplayName(contact: DuplicateGroup['contacts'][0]) {
		if (contact.displayName) return contact.displayName;
		if (contact.firstName || contact.lastName) {
			return [contact.firstName, contact.lastName].filter(Boolean).join(' ');
		}
		return contact.email || 'Unbekannt';
	}

	function handleOpenMerge(group: DuplicateGroup) {
		selectedGroup = group;
		showMergeModal = true;
	}

	function handleCloseMergeModal() {
		showMergeModal = false;
		selectedGroup = null;
	}

	async function handleMerge(primaryId: string, mergeIds: string[]) {
		try {
			await duplicatesApi.mergeContacts(primaryId, mergeIds);
			toastStore.success(`${mergeIds.length + 1} Kontakte wurden zusammengeführt`);
			// Remove the merged group from the list
			if (selectedGroup) {
				duplicates = duplicates.filter((d) => d.id !== selectedGroup!.id);
			}
			handleCloseMergeModal();
		} catch (e) {
			toastStore.error(e instanceof Error ? e.message : 'Fehler beim Zusammenführen');
		}
	}

	async function handleDismiss() {
		if (!selectedGroup) return;
		try {
			await duplicatesApi.dismissDuplicate(selectedGroup.id);
			duplicates = duplicates.filter((d) => d.id !== selectedGroup!.id);
			toastStore.info('Duplikat-Gruppe wurde ignoriert');
			handleCloseMergeModal();
		} catch (e) {
			toastStore.error('Fehler beim Ignorieren');
		}
	}

	onMount(() => {
		loadDuplicates();
	});
</script>

<svelte:head>
	<title>Duplikate - Contacts</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-foreground">Duplikate finden</h1>
			<p class="text-muted-foreground mt-1">Finde und führe doppelte Kontakte zusammen</p>
		</div>
		<button type="button" onclick={loadDuplicates} class="btn btn-secondary" disabled={loading}>
			{#if loading}
				<span class="animate-spin mr-2">⏳</span>
			{:else}
				<ArrowsClockwise size={20} class="mr-2" />
			{/if}
			Erneut suchen
		</button>
	</div>

	<!-- Loading state -->
	{#if loading}
		<DuplicateListSkeleton count={3} />
	{:else if error}
		<!-- Error state -->
		<div class="text-center py-12">
			<div class="text-6xl mb-4">❌</div>
			<h2 class="text-xl font-semibold text-foreground mb-2">Fehler beim Laden</h2>
			<p class="text-muted-foreground mb-4">{error}</p>
			<button type="button" onclick={loadDuplicates} class="btn btn-primary">
				Erneut versuchen
			</button>
		</div>
	{:else if duplicates.length === 0}
		<!-- Empty state -->
		<div class="text-center py-12">
			<div class="text-6xl mb-4">✨</div>
			<h2 class="text-xl font-semibold text-foreground mb-2">Keine Duplikate gefunden</h2>
			<p class="text-muted-foreground">
				Deine Kontakte sehen sauber aus! Es wurden keine potenziellen Duplikate erkannt.
			</p>
		</div>
	{:else}
		<!-- Stats -->
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<div class="bg-card border border-border rounded-lg p-4">
				<div class="text-2xl font-bold text-foreground">{duplicates.length}</div>
				<div class="text-sm text-muted-foreground">Duplikat-Gruppen</div>
			</div>
			<div class="bg-card border border-border rounded-lg p-4">
				<div class="text-2xl font-bold text-foreground">
					{duplicates.reduce((sum, d) => sum + d.contacts.length, 0)}
				</div>
				<div class="text-sm text-muted-foreground">Betroffene Kontakte</div>
			</div>
			<div class="bg-card border border-border rounded-lg p-4">
				<div class="text-2xl font-bold text-green-600">
					{duplicates.reduce((sum, d) => sum + d.contacts.length - 1, 0)}
				</div>
				<div class="text-sm text-muted-foreground">Mögliche Einsparung</div>
			</div>
		</div>

		<!-- Duplicates list -->
		<div class="space-y-4">
			{#each duplicates as group (group.id)}
				<div class="bg-card border border-border rounded-lg overflow-hidden">
					<!-- Group header -->
					<div class="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
						<div class="flex items-center gap-3">
							<span class="text-2xl">{getMatchTypeIcon(group.matchType)}</span>
							<div>
								<div class="font-medium text-foreground">
									{group.contacts.length} Kontakte mit gleicher {getMatchTypeLabel(group.matchType)}
								</div>
								<div class="text-sm text-muted-foreground">
									{group.matchValue}
								</div>
							</div>
						</div>
						<button
							type="button"
							onclick={() => handleOpenMerge(group)}
							class="btn btn-primary btn-sm"
						>
							Zusammenführen
						</button>
					</div>

					<!-- Contacts preview -->
					<div class="p-4">
						<div class="flex flex-wrap gap-4">
							{#each group.contacts as contact (contact.id)}
								<div class="flex items-center gap-3 bg-muted/20 rounded-lg p-3 min-w-[200px]">
									<div
										class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium"
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
									<div class="min-w-0">
										<div class="font-medium text-foreground truncate">
											{getDisplayName(contact)}
										</div>
										{#if contact.company}
											<div class="text-xs text-muted-foreground truncate">
												{contact.company}
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Merge Modal -->
{#if selectedGroup}
	<MergeModal
		isOpen={showMergeModal}
		contacts={selectedGroup.contacts}
		matchType={selectedGroup.matchType}
		matchValue={selectedGroup.matchValue}
		onMerge={handleMerge}
		onDismiss={handleDismiss}
		onClose={handleCloseMergeModal}
	/>
{/if}
