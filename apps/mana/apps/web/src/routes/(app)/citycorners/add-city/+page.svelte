<script lang="ts">
	import { goto } from '$app/navigation';
	import { CaretLeft } from '@mana/shared-icons';
	import { _ } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import { cityTable, useAllCities } from '$lib/modules/citycorners';
	import type { LocalCity } from '$lib/modules/citycorners/types';
	import { RoutePage } from '$lib/components/shell';
	import { searchAddress } from '$lib/geocoding';

	const allCities = useAllCities();

	let name = $state('');
	let country = $state('');
	let stateRegion = $state('');
	let description = $state('');
	let imageUrl = $state('');
	let latitude = $state<number | undefined>(undefined);
	let longitude = $state<number | undefined>(undefined);
	let submitting = $state(false);
	let error = $state('');
	let geocoding = $state(false);
	let imageError = $state(false);

	let slug = $derived(
		name
			.trim()
			.toLowerCase()
			.replace(/[äÄ]/g, 'ae')
			.replace(/[öÖ]/g, 'oe')
			.replace(/[üÜ]/g, 'ue')
			.replace(/ß/g, 'ss')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '')
	);

	let slugExists = $derived(allCities.value.some((c) => c.slug === slug));

	let isValid = $derived(name.trim().length > 0 && country.trim().length > 0 && !slugExists);

	async function geocodeCityName() {
		const q = name.trim();
		if (!q) return;

		geocoding = true;
		try {
			const searchQ = country.trim() ? `${q}, ${country.trim()}` : q;
			const results = await searchAddress(searchQ, { limit: 1 });
			if (results.length > 0) {
				latitude = results[0].latitude;
				longitude = results[0].longitude;
			}
		} catch {
			// best-effort
		} finally {
			geocoding = false;
		}
	}

	let geocodeTimeout: ReturnType<typeof setTimeout> | undefined;
	function handleNameInput() {
		clearTimeout(geocodeTimeout);
		geocodeTimeout = setTimeout(() => {
			if (name.trim().length > 2) {
				geocodeCityName();
			}
		}, 1000);
	}

	async function handleSubmit() {
		if (!isValid || submitting) return;

		submitting = true;
		error = '';

		try {
			// Geocode if we don't have coordinates yet
			if (latitude === undefined || longitude === undefined) {
				await geocodeCityName();
			}

			if (latitude === undefined || longitude === undefined) {
				// Default to 0,0 — user can update later
				latitude = 0;
				longitude = 0;
			}

			const cityData: Omit<LocalCity, 'createdAt' | 'updatedAt' | 'deletedAt'> = {
				id: `city-${slug}-${Date.now()}`,
				name: name.trim(),
				slug,
				country: country.trim(),
				state: stateRegion.trim() || null,
				description: description.trim() || null,
				latitude,
				longitude,
				imageUrl: imageUrl.trim() && !imageError ? imageUrl.trim() : null,
				createdBy: authStore.user?.id || null,
			};

			await cityTable.add(cityData);
			goto(`/citycorners/cities/${slug}`);
		} catch {
			error = $_('cityAdd.error');
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{$_('cityAdd.title')} - CityCorners</title>
</svelte:head>

<RoutePage appId="citycorners" backHref="/citycorners">
	<header class="mb-6">
		<div class="flex items-center gap-2 mb-1">
			<a href="/citycorners" class="text-foreground-secondary hover:text-primary transition-colors">
				<CaretLeft size={16} />
			</a>
			<h1 class="text-2xl font-bold text-foreground">{$_('cityAdd.title')}</h1>
		</div>
		<p class="text-foreground-secondary">{$_('cityAdd.subtitle')}</p>
	</header>

	{#if !authStore.isAuthenticated}
		<div class="rounded-xl border border-border bg-background-card p-8 text-center">
			<span class="mb-2 block text-4xl">🏙️</span>
			<p class="mb-4 text-foreground-secondary">{$_('cityAdd.loginRequired')}</p>
			<a
				href="/login?redirectTo=/citycorners/add-city"
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
					>{$_('cityAdd.name')}</label
				>
				<input
					id="name"
					type="text"
					bind:value={name}
					oninput={handleNameInput}
					placeholder={$_('cityAdd.namePlaceholder')}
					class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
				/>
				{#if slug && slugExists}
					<p class="mt-1 text-xs text-red-500">{$_('cityAdd.slugExists')}</p>
				{:else if slug}
					<p class="mt-1 text-xs text-foreground-secondary/60">/{slug}</p>
				{/if}
			</div>

			<div>
				<label for="country" class="mb-1 block text-sm font-medium text-foreground"
					>{$_('cityAdd.country')}</label
				>
				<input
					id="country"
					type="text"
					bind:value={country}
					placeholder={$_('cityAdd.countryPlaceholder')}
					class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
				/>
			</div>

			<div>
				<label for="state" class="mb-1 block text-sm font-medium text-foreground"
					>{$_('cityAdd.state')}</label
				>
				<input
					id="state"
					type="text"
					bind:value={stateRegion}
					placeholder={$_('cityAdd.statePlaceholder')}
					class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
				/>
			</div>

			<div>
				<label for="description" class="mb-1 block text-sm font-medium text-foreground"
					>{$_('cityAdd.description')}</label
				>
				<textarea
					id="description"
					bind:value={description}
					placeholder={$_('cityAdd.descriptionPlaceholder')}
					rows="3"
					class="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
				></textarea>
			</div>

			<div>
				<label for="imageUrl" class="mb-1 block text-sm font-medium text-foreground"
					>{$_('cityAdd.imageUrl')}</label
				>
				<input
					id="imageUrl"
					type="url"
					bind:value={imageUrl}
					oninput={() => (imageError = false)}
					placeholder={$_('cityAdd.imageUrlPlaceholder')}
					class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
				/>
				{#if imageUrl.trim() && !imageError}
					<div class="mt-2 overflow-hidden rounded-lg border border-border">
						<img
							src={imageUrl}
							alt="Preview"
							class="h-40 w-full object-cover"
							onerror={() => (imageError = true)}
						/>
					</div>
				{/if}
			</div>

			{#if geocoding}
				<p class="text-xs text-foreground-secondary/60">{$_('cityAdd.geocoding')}</p>
			{:else if latitude !== undefined && longitude !== undefined}
				<p class="text-xs text-green-600 dark:text-green-400">{$_('cityAdd.coordinatesFound')}</p>
			{/if}

			<div class="flex gap-3">
				<a
					href="/citycorners"
					class="rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground-secondary transition-colors hover:bg-background-card-hover"
				>
					{$_('edit.cancel')}
				</a>
				<button
					type="submit"
					disabled={!isValid || submitting}
					class="flex-1 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{submitting ? $_('cityAdd.submitting') : $_('cityAdd.submit')}
				</button>
			</div>
		</form>
	{/if}
</RoutePage>
