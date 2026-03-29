<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { _ } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import { api } from '$lib/api';
	import type { LocalCity } from '$lib/data/local-store';

	const cityCtx = getContext<{ value: LocalCity | undefined }>('currentCity');
	let city = $derived(cityCtx.value);
	let citySlug = $derived($page.params.slug);

	let loading = $state(true);
	let name = $state('');
	let category = $state('sight');
	let description = $state('');
	let address = $state('');
	let imageUrl = $state('');
	let website = $state('');
	let phone = $state('');
	let imageError = $state(false);
	let submitting = $state(false);
	let error = $state('');
	let forbidden = $state(false);

	const categories = [
		{ value: 'sight', labelKey: 'category.sight' },
		{ value: 'restaurant', labelKey: 'category.restaurant' },
		{ value: 'shop', labelKey: 'category.shop' },
		{ value: 'museum', labelKey: 'category.museum' },
		{ value: 'cafe', labelKey: 'category.cafe' },
		{ value: 'bar', labelKey: 'category.bar' },
		{ value: 'park', labelKey: 'category.park' },
		{ value: 'beach', labelKey: 'category.beach' },
		{ value: 'hotel', labelKey: 'category.hotel' },
		{ value: 'event_venue', labelKey: 'category.event_venue' },
		{ value: 'viewpoint', labelKey: 'category.viewpoint' },
	];

	let isValid = $derived(name.trim().length > 0 && description.trim().length > 10);

	onMount(async () => {
		try {
			const res = await fetch(api(`/locations/${$page.params.id}`));
			const data = await res.json();
			const loc = data.location;

			if (loc.createdBy && loc.createdBy !== authStore.user?.id) {
				forbidden = true;
				return;
			}

			name = loc.name || '';
			category = loc.category || 'sight';
			description = loc.description || '';
			address = loc.address || '';
			imageUrl = loc.imageUrl || '';
			website = loc.website || '';
			phone = loc.phone || '';
		} catch {
			error = $_('edit.loadError');
		} finally {
			loading = false;
		}
	});

	async function handleSubmit() {
		if (!isValid || submitting) return;

		submitting = true;
		error = '';

		try {
			const token = await authStore.getValidToken();
			if (!token) {
				error = $_('add.loginRequired');
				return;
			}

			const body: Record<string, unknown> = {
				name: name.trim(),
				category,
				description: description.trim(),
				address: address.trim() || undefined,
				imageUrl: imageUrl.trim() || undefined,
				website: website.trim() || undefined,
				phone: phone.trim() || undefined,
			};

			const res = await fetch(api(`/locations/${$page.params.id}`), {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(body),
			});

			if (res.ok) {
				goto(`/cities/${citySlug}/locations/${$page.params.id}`);
			} else {
				const data = await res.json().catch(() => ({}));
				error = data.message || $_('edit.error');
			}
		} catch {
			error = $_('edit.error');
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{$_('edit.title')} - {city?.name || 'CityCorners'}</title>
</svelte:head>

<header class="mb-6">
	<div class="flex items-center gap-2 mb-1">
		<a
			href="/cities/{citySlug}/locations/{$page.params.id}"
			class="text-foreground-secondary hover:text-primary transition-colors"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
			</svg>
		</a>
		<h1 class="text-2xl font-bold text-foreground">{$_('edit.title')}</h1>
	</div>
	<p class="text-foreground-secondary">{$_('edit.subtitle')}</p>
</header>

{#if loading}
	<div class="flex items-center justify-center py-12">
		<div
			class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
		></div>
	</div>
{:else if forbidden}
	<div class="rounded-xl border border-border bg-background-card p-8 text-center">
		<span class="mb-2 block text-4xl">🔒</span>
		<p class="text-foreground-secondary">{$_('edit.forbidden')}</p>
		<a
			href="/cities/{citySlug}/locations/{$page.params.id}"
			class="mt-4 inline-block text-sm text-primary hover:underline"
		>
			{$_('detail.back')}
		</a>
	</div>
{:else}
	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
		class="space-y-5"
	>
		{#if error}
			<div class="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">{error}</div>
		{/if}

		<div>
			<label for="name" class="mb-1 block text-sm font-medium text-foreground"
				>{$_('add.name')}</label
			>
			<input
				id="name"
				type="text"
				bind:value={name}
				placeholder={$_('add.namePlaceholder')}
				class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
			/>
		</div>

		<div>
			<label for="category" class="mb-1 block text-sm font-medium text-foreground"
				>{$_('add.category')}</label
			>
			<div class="flex flex-wrap gap-2">
				{#each categories as cat}
					<button
						type="button"
						class="rounded-full px-4 py-2 text-sm transition-colors {category === cat.value
							? 'bg-primary text-white'
							: 'bg-background-card text-foreground-secondary hover:bg-background-card-hover border border-border'}"
						onclick={() => (category = cat.value)}
					>
						{$_(cat.labelKey)}
					</button>
				{/each}
			</div>
		</div>

		<div>
			<label for="description" class="mb-1 block text-sm font-medium text-foreground"
				>{$_('add.description')}</label
			>
			<textarea
				id="description"
				bind:value={description}
				placeholder={$_('add.descriptionPlaceholder')}
				rows="4"
				class="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
			></textarea>
			<p class="mt-1 text-xs text-foreground-secondary/60">{$_('add.minChars')}</p>
		</div>

		<div>
			<label for="address" class="mb-1 block text-sm font-medium text-foreground"
				>{$_('add.address')}</label
			>
			<input
				id="address"
				type="text"
				bind:value={address}
				placeholder={$_('add.addressPlaceholder')}
				class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
			/>
		</div>

		<div>
			<label for="imageUrl" class="mb-1 block text-sm font-medium text-foreground"
				>{$_('add.imageUrl')}</label
			>
			<input
				id="imageUrl"
				type="url"
				bind:value={imageUrl}
				oninput={() => (imageError = false)}
				placeholder={$_('add.imageUrlPlaceholder')}
				class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
			/>
			{#if imageUrl.trim() && !imageError}
				<div class="mt-2 overflow-hidden rounded-lg border border-border">
					<img
						src={imageUrl}
						alt={$_('add.imagePreview')}
						class="h-40 w-full object-cover"
						onerror={() => (imageError = true)}
					/>
				</div>
			{:else if imageError}
				<div class="mt-2 flex items-center gap-2 rounded-lg bg-red-500/10 p-3">
					<p class="flex-1 text-xs text-red-500">{$_('add.imageLoadError')}</p>
					<button
						type="button"
						onclick={() => (imageError = false)}
						class="text-xs font-medium text-red-500 hover:text-red-400"
					>
						{$_('add.imageRetry')}
					</button>
				</div>
			{/if}
		</div>

		<div>
			<label for="website" class="mb-1 block text-sm font-medium text-foreground"
				>{$_('add.website')}</label
			>
			<input
				id="website"
				type="url"
				bind:value={website}
				placeholder={$_('add.websitePlaceholder')}
				class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
			/>
		</div>

		<div>
			<label for="phone" class="mb-1 block text-sm font-medium text-foreground"
				>{$_('add.phone')}</label
			>
			<input
				id="phone"
				type="tel"
				bind:value={phone}
				placeholder={$_('add.phonePlaceholder')}
				class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
			/>
		</div>

		<div class="flex gap-3">
			<a
				href="/cities/{citySlug}/locations/{$page.params.id}"
				class="rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground-secondary transition-colors hover:bg-background-card-hover"
			>
				{$_('edit.cancel')}
			</a>
			<button
				type="submit"
				disabled={!isValid || submitting}
				class="flex-1 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{submitting ? $_('edit.saving') : $_('edit.save')}
			</button>
		</div>
	</form>
{/if}
