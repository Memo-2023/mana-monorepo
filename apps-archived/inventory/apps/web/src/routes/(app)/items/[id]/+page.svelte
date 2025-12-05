<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { itemsStore } from '$lib/stores';
	import { PageHeader, Button } from '@manacore/shared-ui';

	let activeTab = $state<'details' | 'photos' | 'documents'>('details');
	let fileInput: HTMLInputElement | undefined;

	const item = $derived(itemsStore.selectedItem);

	onMount(() => {
		const id = $page.params.id;
		if (id) {
			itemsStore.fetchItem(id);
		}
	});

	function formatPrice(price: string | null | undefined, currency: string): string {
		if (!price) return '-';
		return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(Number(price));
	}

	function formatDate(date: string | null | undefined): string {
		if (!date) return '-';
		return new Date(date).toLocaleDateString('de-DE');
	}

	async function handleToggleFavorite() {
		if (item) {
			await itemsStore.toggleFavorite(item.id);
		}
	}

	async function handleToggleArchive() {
		if (item) {
			await itemsStore.toggleArchive(item.id);
			goto('/items');
		}
	}

	async function handleDelete() {
		if (item && confirm($_('items.confirmDelete'))) {
			await itemsStore.deleteItem(item.id);
			goto('/items');
		}
	}

	async function handlePhotoUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files?.length && item) {
			await itemsStore.uploadPhotos(item.id, Array.from(input.files));
			input.value = '';
		}
	}

	async function handleDeletePhoto(photoId: string) {
		if (item) {
			await itemsStore.deletePhoto(item.id, photoId);
		}
	}
</script>

<svelte:head>
	<title>{item?.name || $_('common.loading')} - {$_('app.name')}</title>
</svelte:head>

<div class="p-6">
	{#if itemsStore.loading && !item}
		<div class="flex items-center justify-center py-12">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
		</div>
	{:else if item}
		<PageHeader title={item.name} backHref="/items">
			{#snippet actions()}
				<Button variant="outline" onclick={handleToggleFavorite}>
					<svg
						class="w-4 h-4 {item.isFavorite ? 'text-yellow-500 fill-current' : ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
						/>
					</svg>
				</Button>
				<Button onclick={() => goto(`/items/${item.id}/edit`)}>
					{$_('items.edit')}
				</Button>
			{/snippet}
		</PageHeader>

		<!-- Tabs -->
		<div class="mt-6 border-b border-theme">
			<nav class="flex gap-4">
				{#each ['details', 'photos', 'documents'] as tab}
					<button
						onclick={() => (activeTab = tab as typeof activeTab)}
						class="px-3 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === tab
							? 'border-primary text-primary'
							: 'border-transparent text-theme-secondary hover:text-theme'}"
					>
						{$_(`items.${tab}`)}
					</button>
				{/each}
			</nav>
		</div>

		<div class="mt-6">
			{#if activeTab === 'details'}
				<div class="grid gap-6 md:grid-cols-2">
					<div class="space-y-4">
						<div>
							<label class="text-xs text-theme-secondary">{$_('item.description')}</label>
							<p class="text-theme">{item.description || '-'}</p>
						</div>
						<div>
							<label class="text-xs text-theme-secondary">{$_('item.category')}</label>
							<p class="text-theme">{item.category?.name || '-'}</p>
						</div>
						<div>
							<label class="text-xs text-theme-secondary">{$_('item.location')}</label>
							<p class="text-theme">{item.location?.name || '-'}</p>
						</div>
						<div>
							<label class="text-xs text-theme-secondary">{$_('item.condition')}</label>
							<p class="text-theme">{$_(`conditions.${item.condition}`)}</p>
						</div>
						<div>
							<label class="text-xs text-theme-secondary">{$_('item.quantity')}</label>
							<p class="text-theme">{item.quantity}</p>
						</div>
					</div>

					<div class="space-y-4">
						<div>
							<label class="text-xs text-theme-secondary">{$_('item.purchasePrice')}</label>
							<p class="text-theme">{formatPrice(item.purchasePrice, item.currency)}</p>
						</div>
						<div>
							<label class="text-xs text-theme-secondary">{$_('item.purchaseDate')}</label>
							<p class="text-theme">{formatDate(item.purchaseDate)}</p>
						</div>
						<div>
							<label class="text-xs text-theme-secondary">{$_('item.currentValue')}</label>
							<p class="text-theme">{formatPrice(item.currentValue, item.currency)}</p>
						</div>
						<div>
							<label class="text-xs text-theme-secondary">{$_('item.warrantyExpires')}</label>
							<p class="text-theme">{formatDate(item.warrantyExpires)}</p>
						</div>
						<div>
							<label class="text-xs text-theme-secondary">{$_('item.notes')}</label>
							<p class="text-theme whitespace-pre-wrap">{item.notes || '-'}</p>
						</div>
					</div>
				</div>

				<div class="mt-8 pt-6 border-t border-theme flex gap-3">
					<Button variant="outline" onclick={handleToggleArchive}>
						{item.isArchived ? $_('item.unarchive') : $_('item.archive')}
					</Button>
					<Button variant="outline" class="text-red-500 hover:bg-red-500/10" onclick={handleDelete}>
						{$_('items.delete')}
					</Button>
				</div>
			{:else if activeTab === 'photos'}
				<div class="space-y-4">
					<input
						bind:this={fileInput}
						type="file"
						accept="image/*"
						multiple
						class="hidden"
						onchange={handlePhotoUpload}
					/>
					<Button onclick={() => fileInput?.click()}>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
							/>
						</svg>
						{$_('photos.upload')}
					</Button>

					{#if item.photos?.length}
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
							{#each item.photos as photo}
								<div
									class="relative group aspect-square rounded-lg overflow-hidden bg-theme-secondary/10"
								>
									<img
										src={photo.storageKey}
										alt={photo.caption || item.name}
										class="w-full h-full object-cover"
									/>
									<div
										class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
									>
										<button
											onclick={() => handleDeletePhoto(photo.id)}
											class="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
												/>
											</svg>
										</button>
									</div>
									{#if photo.isPrimary}
										<div
											class="absolute top-2 left-2 px-2 py-1 rounded text-xs bg-primary text-white"
										>
											Primary
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-theme-secondary text-center py-8">{$_('photos.empty')}</p>
					{/if}
				</div>
			{:else if activeTab === 'documents'}
				<div class="space-y-4">
					{#if item.documents?.length}
						<div class="space-y-2">
							{#each item.documents as doc}
								<div class="flex items-center justify-between p-3 rounded-lg border border-theme">
									<div class="flex items-center gap-3">
										<svg
											class="w-8 h-8 text-theme-secondary"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
											/>
										</svg>
										<div>
											<p class="text-sm font-medium text-theme">{doc.filename}</p>
											<p class="text-xs text-theme-secondary">
												{$_(`documents.types.${doc.documentType}`)}
											</p>
										</div>
									</div>
									<Button variant="outline" size="sm">
										{$_('documents.download')}
									</Button>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-theme-secondary text-center py-8">{$_('documents.empty')}</p>
					{/if}
				</div>
			{/if}
		</div>
	{:else}
		<p class="text-center text-theme-secondary py-12">{$_('common.error')}</p>
	{/if}
</div>
