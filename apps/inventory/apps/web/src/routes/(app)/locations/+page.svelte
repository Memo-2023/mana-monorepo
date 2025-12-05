<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { locationsStore } from '$lib/stores';
	import { PageHeader, Button, Input } from '@manacore/shared-ui';
	import type { Location } from '@inventory/shared';

	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let formData = $state({ name: '', description: '', parentLocationId: '' });

	function startCreate(parentId?: string) {
		editingId = null;
		formData = { name: '', description: '', parentLocationId: parentId || '' };
		showForm = true;
	}

	function startEdit(location: Location & { level?: number }) {
		editingId = location.id;
		formData = {
			name: location.name,
			description: location.description || '',
			parentLocationId: location.parentLocationId || '',
		};
		showForm = true;
	}

	function cancelForm() {
		showForm = false;
		editingId = null;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (editingId) {
			await locationsStore.updateLocation(editingId, formData);
		} else {
			await locationsStore.createLocation(formData);
		}
		cancelForm();
	}

	async function handleDelete(id: string) {
		if (confirm($_('locations.confirmDelete'))) {
			await locationsStore.deleteLocation(id);
		}
	}
</script>

<svelte:head>
	<title>{$_('locations.title')} - {$_('app.name')}</title>
</svelte:head>

<div class="p-6 max-w-2xl mx-auto">
	<PageHeader title={$_('locations.title')}>
		{#snippet actions()}
			<Button onclick={() => startCreate()}>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				{$_('locations.new')}
			</Button>
		{/snippet}
	</PageHeader>

	<!-- Form -->
	{#if showForm}
		<form
			onsubmit={handleSubmit}
			class="mt-6 p-4 rounded-xl border border-theme bg-surface space-y-4"
		>
			<h3 class="font-medium text-theme">
				{editingId ? $_('locations.edit') : $_('locations.new')}
			</h3>

			<div>
				<label class="block text-sm font-medium text-theme mb-1">{$_('locations.name')} *</label>
				<Input bind:value={formData.name} required />
			</div>

			<div>
				<label class="block text-sm font-medium text-theme mb-1"
					>{$_('locations.description')}</label
				>
				<textarea
					bind:value={formData.description}
					rows={2}
					class="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm focus:border-primary focus:outline-none"
				></textarea>
			</div>

			<div>
				<label class="block text-sm font-medium text-theme mb-1">{$_('locations.parent')}</label>
				<select
					bind:value={formData.parentLocationId}
					class="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm"
				>
					<option value="">{$_('common.none')}</option>
					{#each locationsStore.flatLocations.filter((l) => l.id !== editingId) as loc}
						<option value={loc.id}>{'  '.repeat(loc.level)}{loc.name}</option>
					{/each}
				</select>
			</div>

			<div class="flex gap-3 justify-end">
				<Button variant="outline" onclick={cancelForm}>{$_('common.cancel')}</Button>
				<Button type="submit" disabled={!formData.name}>{$_('common.save')}</Button>
			</div>
		</form>
	{/if}

	<!-- Locations List -->
	<div class="mt-6 space-y-2">
		{#if locationsStore.loading}
			<div class="flex items-center justify-center py-12">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
				></div>
			</div>
		{:else if locationsStore.flatLocations.length === 0}
			<div class="text-center py-12">
				<p class="text-theme-secondary">{$_('locations.empty')}</p>
			</div>
		{:else}
			{#each locationsStore.flatLocations as location}
				<div
					class="flex items-center justify-between p-3 rounded-lg border border-theme hover:border-primary transition-colors"
					style="margin-left: {location.level * 1.5}rem"
				>
					<div class="flex items-center gap-3">
						<svg
							class="w-5 h-5 text-theme-secondary"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
						<div>
							<span class="font-medium text-theme">{location.name}</span>
							{#if location.description}
								<p class="text-xs text-theme-secondary">{location.description}</p>
							{/if}
						</div>
					</div>
					<div class="flex items-center gap-2">
						<button
							onclick={() => startCreate(location.id)}
							class="p-1 text-theme-secondary hover:text-primary transition-colors"
							title="Unterstandort hinzufügen"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 4v16m8-8H4"
								/>
							</svg>
						</button>
						<button
							onclick={() => startEdit(location)}
							class="p-1 text-theme-secondary hover:text-primary transition-colors"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
						</button>
						<button
							onclick={() => handleDelete(location.id)}
							class="p-1 text-theme-secondary hover:text-red-500 transition-colors"
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
				</div>
			{/each}
		{/if}
	</div>
</div>
