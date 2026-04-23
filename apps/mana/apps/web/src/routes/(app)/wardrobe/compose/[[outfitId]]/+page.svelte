<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { ArrowLeft } from '@mana/shared-icons';
	import { RoutePage } from '$lib/components/shell';
	import OutfitComposer from '$lib/modules/wardrobe/components/OutfitComposer.svelte';
	import { useAllGarments, useOutfit } from '$lib/modules/wardrobe/queries';
	import { wardrobeOutfitsStore } from '$lib/modules/wardrobe/stores/outfits.svelte';

	// `[[outfitId]]` is optional — absent for create, present for edit.
	const outfitId = $derived(page.params.outfitId ?? null);

	const garments$ = useAllGarments();
	const existingOutfit$ = $derived(useOutfit(outfitId));

	const garments = $derived(garments$.value ?? []);
	const outfit = $derived(existingOutfit$.value);

	let saving = $state(false);

	type Patch = Parameters<typeof wardrobeOutfitsStore.updateOutfit>[1] & {
		garmentIds: string[];
	};

	async function handleSave(patch: Patch) {
		saving = true;
		try {
			if (outfitId && outfit) {
				await wardrobeOutfitsStore.updateOutfit(outfitId, patch);
				goto(`/wardrobe/outfit/${outfitId}`);
			} else {
				const created = await wardrobeOutfitsStore.createOutfit({
					name: patch.name!,
					description: patch.description ?? null,
					garmentIds: patch.garmentIds,
					occasion: patch.occasion ?? null,
					season: patch.season,
					tags: patch.tags ?? [],
				});
				goto(`/wardrobe/outfit/${created.id}`);
			}
		} finally {
			saving = false;
		}
	}

	function handleCancel() {
		if (outfitId) {
			goto(`/wardrobe/outfit/${outfitId}`);
		} else {
			goto('/wardrobe');
		}
	}
</script>

<svelte:head>
	<title>{outfitId ? 'Outfit bearbeiten' : 'Neues Outfit'} · Mana</title>
</svelte:head>

<RoutePage appId="wardrobe" backHref="/wardrobe">
	<div class="mx-auto max-w-6xl p-4 sm:p-6">
		<header class="mb-5 flex items-center gap-3">
			<a
				href={outfitId ? `/wardrobe/outfit/${outfitId}` : '/wardrobe'}
				class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
				aria-label="Zurück"
			>
				<ArrowLeft size={16} />
			</a>
			<h1 class="text-xl font-bold text-foreground">
				{outfitId ? 'Outfit bearbeiten' : 'Neues Outfit'}
			</h1>
		</header>

		{#if outfitId && !outfit && !existingOutfit$.loading}
			<div class="rounded-2xl border border-dashed border-border bg-background/50 p-8 text-center">
				<p class="text-sm font-medium text-foreground">Outfit nicht gefunden.</p>
				<p class="mt-1 text-sm text-muted-foreground">Gelöscht oder in einem anderen Space.</p>
			</div>
		{:else}
			<!-- Remount when we switch from /compose (new) to /compose/:id (edit)
			     so the composer's initial state captures the right outfit. -->
			{#key outfitId ?? 'new'}
				<OutfitComposer
					{garments}
					outfit={outfitId ? outfit : null}
					{saving}
					onSave={handleSave}
					onCancel={handleCancel}
				/>
			{/key}
		{/if}
	</div>
</RoutePage>
