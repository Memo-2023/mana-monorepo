<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { itemsStore, categoriesStore, locationsStore } from '$lib/stores';
	import { PageHeader, Button, Input } from '@manacore/shared-ui';
	import type { CreateItemInput } from '@inventory/shared';

	let formData = $state<CreateItemInput>({
		name: '',
		description: '',
		condition: 'good',
		currency: 'EUR',
		quantity: 1,
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const item = await itemsStore.createItem(formData);
		if (item) {
			goto(`/items/${item.id}`);
		}
	}
</script>

<svelte:head>
	<title>{$_('items.new')} - {$_('app.name')}</title>
</svelte:head>

<div class="p-6 max-w-2xl mx-auto">
	<PageHeader title={$_('items.new')} backHref="/items" />

	<form onsubmit={handleSubmit} class="mt-6 space-y-6">
		<div class="space-y-4">
			<div>
				<label class="block text-sm font-medium text-theme mb-1">{$_('item.name')} *</label>
				<Input bind:value={formData.name} required />
			</div>

			<div>
				<label class="block text-sm font-medium text-theme mb-1">{$_('item.description')}</label>
				<textarea
					bind:value={formData.description}
					rows={3}
					class="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm focus:border-primary focus:outline-none"
				></textarea>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium text-theme mb-1">{$_('item.category')}</label>
					<select
						bind:value={formData.categoryId}
						class="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm"
					>
						<option value="">{$_('common.none')}</option>
						{#each categoriesStore.flatCategories as category}
							<option value={category.id}>{'  '.repeat(category.level)}{category.name}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="block text-sm font-medium text-theme mb-1">{$_('item.location')}</label>
					<select
						bind:value={formData.locationId}
						class="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm"
					>
						<option value="">{$_('common.none')}</option>
						{#each locationsStore.flatLocations as location}
							<option value={location.id}>{'  '.repeat(location.level)}{location.name}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium text-theme mb-1">{$_('item.purchasePrice')}</label
					>
					<input
						type="number"
						step="0.01"
						bind:value={formData.purchasePrice}
						class="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm focus:border-primary focus:outline-none"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-theme mb-1">{$_('item.currency')}</label>
					<select
						bind:value={formData.currency}
						class="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm"
					>
						<option value="EUR">EUR</option>
						<option value="USD">USD</option>
						<option value="GBP">GBP</option>
						<option value="CHF">CHF</option>
					</select>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium text-theme mb-1">{$_('item.purchaseDate')}</label>
					<input
						type="date"
						bind:value={formData.purchaseDate}
						class="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm focus:border-primary focus:outline-none"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-theme mb-1">{$_('item.condition')}</label>
					<select
						bind:value={formData.condition}
						class="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm"
					>
						<option value="new">{$_('conditions.new')}</option>
						<option value="like_new">{$_('conditions.like_new')}</option>
						<option value="good">{$_('conditions.good')}</option>
						<option value="fair">{$_('conditions.fair')}</option>
						<option value="poor">{$_('conditions.poor')}</option>
					</select>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium text-theme mb-1"
						>{$_('item.warrantyExpires')}</label
					>
					<input
						type="date"
						bind:value={formData.warrantyExpires}
						class="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm focus:border-primary focus:outline-none"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-theme mb-1">{$_('item.quantity')}</label>
					<input
						type="number"
						min="1"
						bind:value={formData.quantity}
						class="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm focus:border-primary focus:outline-none"
					/>
				</div>
			</div>

			<div>
				<label class="block text-sm font-medium text-theme mb-1">{$_('item.notes')}</label>
				<textarea
					bind:value={formData.notes}
					rows={3}
					class="w-full rounded-lg border border-theme bg-theme px-3 py-2 text-sm focus:border-primary focus:outline-none"
				></textarea>
			</div>
		</div>

		{#if itemsStore.error}
			<div class="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
				{itemsStore.error}
			</div>
		{/if}

		<div class="flex gap-3 justify-end">
			<Button variant="outline" onclick={() => goto('/items')}>
				{$_('common.cancel')}
			</Button>
			<Button type="submit" disabled={itemsStore.loading || !formData.name}>
				{itemsStore.loading ? $_('common.loading') : $_('common.create')}
			</Button>
		</div>
	</form>
</div>
