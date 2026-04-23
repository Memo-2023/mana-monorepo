<!--
  Garment detail page. Renders the primary photo + a compact metadata
  card that flips to edit mode via GarmentForm. "Heute getragen"
  increments wearCount + stamps lastWornAt. Archive and delete both
  sit in an overflow row below — visible but unobtrusive.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft, CheckCircle, PencilSimple, Archive, Trash } from '@mana/shared-icons';
	import { useGarment } from '../queries';
	import { wardrobeGarmentsStore } from '../stores/garments.svelte';
	import { garmentPhotoUrl } from '../api/media-url';
	import { CATEGORY_LABELS } from '../constants';
	import GarmentForm from '../components/GarmentForm.svelte';
	import GarmentTryOnButton from '../components/GarmentTryOnButton.svelte';

	interface Props {
		id: string;
	}

	let { id }: Props = $props();

	// id is stable for this component instance — the route file wraps
	// us in `{#key id}` so a navigation to a different garment re-mounts.
	// svelte-ignore state_referenced_locally
	const garment$ = useGarment(id);
	const garment = $derived(garment$.value);

	let editing = $state(false);
	let saving = $state(false);
	let markingWorn = $state(false);

	async function handleMarkWorn() {
		if (!garment) return;
		markingWorn = true;
		try {
			await wardrobeGarmentsStore.markWornToday(garment.id);
		} finally {
			markingWorn = false;
		}
	}

	async function handleArchive() {
		if (!garment) return;
		await wardrobeGarmentsStore.archiveGarment(garment.id, !garment.isArchived);
	}

	async function handleDelete() {
		if (!garment) return;
		if (!confirm(`"${garment.name}" wirklich löschen?`)) return;
		await wardrobeGarmentsStore.deleteGarment(garment.id);
		goto('/wardrobe');
	}

	type SavePatch = Parameters<typeof wardrobeGarmentsStore.updateGarment>[1];

	async function handleSave(patch: SavePatch) {
		if (!garment) return;
		saving = true;
		try {
			await wardrobeGarmentsStore.updateGarment(garment.id, patch);
			editing = false;
		} finally {
			saving = false;
		}
	}
</script>

<div class="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
	<nav class="flex items-center gap-2 text-sm">
		<a
			href="/wardrobe"
			class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
			aria-label="Zurück zum Kleiderschrank"
		>
			<ArrowLeft size={16} />
		</a>
		<span class="text-muted-foreground">Kleiderschrank</span>
	</nav>

	{#if !garment}
		{#if garment$.loading}
			<p class="text-sm text-muted-foreground">Lädt…</p>
		{:else}
			<div class="rounded-2xl border border-dashed border-border bg-background/50 p-8 text-center">
				<p class="text-sm font-medium text-foreground">Nicht gefunden.</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Das Kleidungsstück wurde gelöscht oder gehört zu einem anderen Space.
				</p>
			</div>
		{/if}
	{:else}
		<div class="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
			<!-- Photo -->
			<div class="overflow-hidden rounded-2xl border border-border bg-muted">
				{#if garment.mediaIds[0]}
					<img
						src={garmentPhotoUrl(garment.mediaIds[0], 'large')}
						alt={garment.name}
						class="h-full w-full object-cover"
					/>
				{/if}
			</div>

			<!-- Metadata / Edit -->
			<div class="space-y-4">
				{#if editing}
					<GarmentForm {garment} {saving} onSave={handleSave} onCancel={() => (editing = false)} />
				{:else}
					<div class="space-y-4 rounded-2xl border border-border bg-card p-5">
						<header class="flex items-start justify-between gap-2">
							<div>
								<h1 class="text-lg font-semibold text-foreground">{garment.name}</h1>
								<p class="text-sm text-muted-foreground">{CATEGORY_LABELS[garment.category]}</p>
							</div>
							<button
								type="button"
								onclick={() => (editing = true)}
								aria-label="Bearbeiten"
								title="Bearbeiten"
								class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
							>
								<PencilSimple size={16} />
							</button>
						</header>

						<dl class="grid grid-cols-2 gap-3 text-sm">
							{#if garment.brand}
								<div>
									<dt class="text-xs uppercase tracking-wider text-muted-foreground">Marke</dt>
									<dd class="text-foreground">{garment.brand}</dd>
								</div>
							{/if}
							{#if garment.color}
								<div>
									<dt class="text-xs uppercase tracking-wider text-muted-foreground">Farbe</dt>
									<dd class="text-foreground">{garment.color}</dd>
								</div>
							{/if}
							{#if garment.size}
								<div>
									<dt class="text-xs uppercase tracking-wider text-muted-foreground">Größe</dt>
									<dd class="text-foreground">{garment.size}</dd>
								</div>
							{/if}
							{#if garment.material}
								<div>
									<dt class="text-xs uppercase tracking-wider text-muted-foreground">Material</dt>
									<dd class="text-foreground">{garment.material}</dd>
								</div>
							{/if}
							{#if garment.priceCents}
								<div>
									<dt class="text-xs uppercase tracking-wider text-muted-foreground">Preis</dt>
									<dd class="text-foreground">
										{(garment.priceCents / 100).toFixed(2)}
										{garment.currency ?? ''}
									</dd>
								</div>
							{/if}
							{#if garment.wearCount && garment.wearCount > 0}
								<div>
									<dt class="text-xs uppercase tracking-wider text-muted-foreground">Getragen</dt>
									<dd class="text-foreground">
										{garment.wearCount}×{garment.lastWornAt
											? ` · zuletzt ${garment.lastWornAt}`
											: ''}
									</dd>
								</div>
							{/if}
						</dl>

						{#if garment.tags.length > 0}
							<div class="flex flex-wrap gap-1.5">
								{#each garment.tags as tag}
									<span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
										{tag}
									</span>
								{/each}
							</div>
						{/if}

						{#if garment.notes}
							<p class="whitespace-pre-wrap text-sm text-foreground">{garment.notes}</p>
						{/if}
					</div>

					<!-- Try-on — "wie sähe das an mir aus" -->
					<GarmentTryOnButton {garment} />

					<!-- Wear-tracking -->
					<button
						type="button"
						onclick={handleMarkWorn}
						disabled={markingWorn}
						class="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-50"
					>
						<CheckCircle size={14} />
						{markingWorn ? 'Gespeichert…' : 'Heute getragen'}
					</button>

					<!-- Secondary actions -->
					<div class="flex gap-2">
						<button
							type="button"
							onclick={handleArchive}
							class="flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
						>
							<Archive size={14} />
							{garment.isArchived ? 'Wieder aktiv' : 'Archivieren'}
						</button>
						<button
							type="button"
							onclick={handleDelete}
							class="flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-error transition-colors hover:bg-error/10"
						>
							<Trash size={14} />
							Löschen
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
