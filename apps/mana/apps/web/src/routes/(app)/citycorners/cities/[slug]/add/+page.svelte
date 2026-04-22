<script lang="ts">
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { CaretLeft } from '@mana/shared-icons';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { ccLocationTable, CATEGORY_KEYS } from '$lib/modules/citycorners';
	import type { LocalCity, LocalLocation } from '$lib/modules/citycorners/types';
	import { RoutePage } from '$lib/components/shell';

	const cityCtx = getContext<{ value: LocalCity | undefined }>('currentCity');
	let city = $derived(cityCtx.value);
	let citySlug = $derived($page.params.slug);

	// Lookup state (skip lookup — no backend)
	let lookupDone = $state(true);

	// Form state
	let name = $state('');
	let category = $state<string>('sight');
	let description = $state('');
	let address = $state('');
	let imageUrl = $state('');
	let latitude = $state<number | undefined>(undefined);
	let longitude = $state<number | undefined>(undefined);
	let website = $state('');
	let phone = $state('');
	let submitting = $state(false);
	let error = $state('');
	let geocoding = $state(false);
	let imageError = $state(false);

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

	async function geocodeAddress() {
		const addr = address.trim();
		if (!addr) return;

		geocoding = true;
		try {
			const cityName = city?.name || '';
			const q =
				cityName && !addr.toLowerCase().includes(cityName.toLowerCase())
					? `${addr}, ${cityName}`
					: addr;
			const res = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
				{ headers: { 'User-Agent': 'CityCorners/1.0' } }
			);
			const results = await res.json();
			if (results.length > 0) {
				latitude = parseFloat(results[0].lat);
				longitude = parseFloat(results[0].lon);
			}
		} catch {
			// Geocoding is best-effort
		} finally {
			geocoding = false;
		}
	}

	let geocodeTimeout: ReturnType<typeof setTimeout> | undefined;
	function handleAddressInput() {
		clearTimeout(geocodeTimeout);
		geocodeTimeout = setTimeout(() => {
			if (address.trim().length > 5) {
				geocodeAddress();
			}
		}, 1000);
	}

	async function handleSubmit() {
		if (!isValid || submitting || !city) return;

		submitting = true;
		error = '';

		try {
			const locId = `loc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

			const locData: Omit<LocalLocation, 'createdAt' | 'updatedAt' | 'deletedAt'> = {
				id: locId,
				cityId: city.id,
				name: name.trim(),
				category: category as LocalLocation['category'],
				description: description.trim(),
				address: address.trim() || null,
				imageUrl: imageUrl.trim() && !imageError ? imageUrl.trim() : null,
				latitude: latitude ?? null,
				longitude: longitude ?? null,
				timeline: null,
			};

			await ccLocationTable.add(locData);
			goto(`/citycorners/cities/${citySlug}/locations/${locId}`);
		} catch {
			error = $_('add.error');
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{$_('add.title')} - {city?.name || 'CityCorners'}</title>
</svelte:head>

<RoutePage appId="citycorners" backHref="/citycorners">
	<header class="mb-6">
		<div class="flex items-center gap-2 mb-1">
			<a
				href="/citycorners/cities/{citySlug}"
				class="text-foreground-secondary hover:text-primary transition-colors"
			>
				<CaretLeft size={16} />
			</a>
			<h1 class="text-2xl font-bold text-foreground">{$_('add.title')}</h1>
		</div>
		<p class="text-foreground-secondary">{$_('add.subtitle')} — {city?.name}</p>
	</header>

	{#if !authStore.isAuthenticated}
		<div class="rounded-xl border border-border bg-background-card p-8 text-center">
			<span class="mb-2 block text-4xl">📍</span>
			<p class="mb-4 text-foreground-secondary">{$_('add.loginRequired')}</p>
			<a
				href="/login?redirectTo=/citycorners/cities/{citySlug}/add"
				class="inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
			>
				{$_('settings.login')}
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
					oninput={handleAddressInput}
					placeholder={$_('add.addressPlaceholder')}
					class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
				/>
				{#if geocoding}
					<p class="mt-1 text-xs text-foreground-secondary/60">{$_('add.geocoding')}</p>
				{:else if latitude !== undefined && longitude !== undefined}
					<p class="mt-1 text-xs text-green-600 dark:text-green-400">
						{$_('add.coordinatesFound')}
					</p>
				{/if}
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
							onclick={() => {
								imageError = false;
							}}
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
					href="/citycorners/cities/{citySlug}"
					class="rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground-secondary transition-colors hover:bg-background-card-hover"
				>
					{$_('edit.cancel')}
				</a>
				<button
					type="submit"
					disabled={!isValid || submitting}
					class="flex-1 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{submitting ? $_('add.submitting') : $_('add.submit')}
				</button>
			</div>
		</form>
	{/if}
</RoutePage>
