<!--
  Two-column outfit composer. Left: library of all non-archived
  garments in the active space, grouped by category. Right: the
  outfit being built — name + description + occasion/season/tags +
  the selected garment chips. Click a library tile to add, click a
  chip's × to remove, hit Save to persist.

  Create vs. edit: the parent passes an `outfit` prop (new or
  existing). Save-handler is onSave — it receives the patch and
  resolves with the saved outfit id. Parent handles redirect.

  No drag-drop in M3 (plan mentions it but click-to-add covers 100%
  of the workflow and is keyboard-accessible for free).
-->
<script lang="ts">
	import { Check, Plus, X } from '@mana/shared-icons';
	import { garmentPhotoUrl } from '../api/media-url';
	import {
		CATEGORY_LABELS,
		CATEGORY_ORDER,
		OCCASION_LABELS,
		OCCASION_ORDER,
		SEASON_LABELS,
	} from '../constants';
	import type { Garment, GarmentCategory, Outfit, OutfitOccasion, OutfitSeason } from '../types';

	interface Props {
		/** Full library of garments available in the active space. */
		garments: Garment[];
		/** null → compose mode (creating); Outfit → edit mode. */
		outfit?: Outfit | null;
		saving?: boolean;
		onSave: (patch: {
			name: string;
			description?: string | null;
			garmentIds: string[];
			occasion?: OutfitOccasion | null;
			season?: OutfitSeason[];
			tags: string[];
		}) => Promise<void> | void;
		onCancel?: () => void;
	}

	let { garments, outfit = null, saving = false, onSave, onCancel }: Props = $props();

	// svelte-ignore state_referenced_locally
	let name = $state(outfit?.name ?? '');
	// svelte-ignore state_referenced_locally
	let description = $state(outfit?.description ?? '');
	// svelte-ignore state_referenced_locally
	let selectedIds = $state<string[]>([...(outfit?.garmentIds ?? [])]);
	// svelte-ignore state_referenced_locally
	let occasion = $state<OutfitOccasion | ''>(outfit?.occasion ?? '');
	// svelte-ignore state_referenced_locally
	let selectedSeasons = $state<OutfitSeason[]>([...(outfit?.season ?? [])]);
	// svelte-ignore state_referenced_locally
	let tagsText = $state((outfit?.tags ?? []).join(', '));
	let error = $state<string | null>(null);

	const garmentsById = $derived.by<Record<string, Garment>>(() => {
		const map: Record<string, Garment> = {};
		for (const g of garments) map[g.id] = g;
		return map;
	});

	const selectedGarments = $derived(
		selectedIds.map((id) => garmentsById[id]).filter((g): g is Garment => Boolean(g))
	);

	const grouped = $derived.by(() => {
		const map: Record<GarmentCategory, Garment[]> = {
			top: [],
			bottom: [],
			dress: [],
			outerwear: [],
			shoes: [],
			bag: [],
			accessory: [],
			glasses: [],
			jewelry: [],
			hat: [],
			other: [],
		};
		for (const g of garments) map[g.category].push(g);
		return map;
	});

	function toggleGarment(id: string) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((x) => x !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	function removeGarment(id: string) {
		selectedIds = selectedIds.filter((x) => x !== id);
	}

	function toggleSeason(s: OutfitSeason) {
		if (selectedSeasons.includes(s)) {
			selectedSeasons = selectedSeasons.filter((x) => x !== s);
		} else {
			selectedSeasons = [...selectedSeasons, s];
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!name.trim()) {
			error = 'Gib dem Outfit einen Namen.';
			return;
		}
		if (selectedIds.length === 0) {
			error = 'Wähle mindestens ein Kleidungsstück aus.';
			return;
		}
		error = null;
		const tagList = tagsText
			.split(',')
			.map((t) => t.trim())
			.filter((t) => t.length > 0);
		try {
			await onSave({
				name: name.trim(),
				description: description.trim() || null,
				garmentIds: [...selectedIds],
				occasion: occasion === '' ? null : occasion,
				season: selectedSeasons.length > 0 ? [...selectedSeasons] : undefined,
				tags: tagList,
			});
		} catch (e) {
			error = e instanceof Error ? e.message : 'Speichern fehlgeschlagen';
		}
	}
</script>

<form onsubmit={handleSubmit} class="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
	<!-- LEFT: garment library -->
	<section class="space-y-4">
		<header class="flex items-center justify-between">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
				Kleiderschrank
			</h2>
			<span class="text-xs text-muted-foreground">
				{garments.length}
				{garments.length === 1 ? 'Stück' : 'Stücke'} verfügbar
			</span>
		</header>

		{#if garments.length === 0}
			<div class="rounded-xl border border-dashed border-border bg-background/50 p-6 text-center">
				<p class="text-sm font-medium text-foreground">Nichts zum Kombinieren.</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Lade zuerst ein paar Kleidungsstücke im Tab
					<a href="/wardrobe" class="font-medium text-primary hover:underline">Kleidung</a>
					hoch.
				</p>
			</div>
		{:else}
			<div
				class="space-y-5 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-background/50 p-3"
			>
				{#each CATEGORY_ORDER as category}
					{@const list = grouped[category]}
					{#if list.length > 0}
						<div>
							<h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								{CATEGORY_LABELS[category]}
								<span class="text-border"> · {list.length}</span>
							</h3>
							<div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
								{#each list as g (g.id)}
									{@const mediaId = g.mediaIds[0]}
									{@const selected = selectedIds.includes(g.id)}
									<button
										type="button"
										onclick={() => toggleGarment(g.id)}
										aria-pressed={selected}
										title={g.name}
										class="relative aspect-square overflow-hidden rounded-md border bg-muted transition-all {selected
											? 'border-primary ring-2 ring-primary'
											: 'border-border hover:border-primary/50'}"
									>
										{#if mediaId}
											<img
												src={garmentPhotoUrl(mediaId, 'thumb')}
												alt={g.name}
												loading="lazy"
												class="h-full w-full object-cover"
											/>
										{/if}
										<span
											class="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full {selected
												? 'bg-primary text-primary-foreground'
												: 'bg-background/90 text-muted-foreground'} shadow-sm backdrop-blur-sm"
										>
											{#if selected}
												<Check size={12} weight="bold" />
											{:else}
												<Plus size={12} weight="bold" />
											{/if}
										</span>
									</button>
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</section>

	<!-- RIGHT: outfit editor -->
	<section class="space-y-4">
		<div class="space-y-3 rounded-2xl border border-border bg-card p-4">
			<div>
				<label for="outfit-name" class="mb-1.5 block text-sm font-medium text-foreground">
					Name <span class="text-error">*</span>
				</label>
				<input
					id="outfit-name"
					type="text"
					bind:value={name}
					required
					disabled={saving}
					placeholder="z.B. Bürooutfit Juni"
					class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
				/>
			</div>

			<div>
				<label for="outfit-description" class="mb-1.5 block text-sm font-medium text-foreground">
					Beschreibung
				</label>
				<textarea
					id="outfit-description"
					bind:value={description}
					disabled={saving}
					rows="2"
					placeholder="Für welchen Anlass? Besonderheiten?"
					class="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
				></textarea>
			</div>

			<div>
				<label for="outfit-occasion" class="mb-1.5 block text-sm font-medium text-foreground">
					Anlass
				</label>
				<select
					id="outfit-occasion"
					bind:value={occasion}
					disabled={saving}
					class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
				>
					<option value="">— kein Anlass —</option>
					{#each OCCASION_ORDER as o}
						<option value={o}>{OCCASION_LABELS[o]}</option>
					{/each}
				</select>
			</div>

			<fieldset>
				<legend class="mb-1.5 text-sm font-medium text-foreground">Jahreszeit</legend>
				<div class="flex flex-wrap gap-1.5">
					{#each Object.entries(SEASON_LABELS) as [season, label]}
						{@const s = season as OutfitSeason}
						{@const on = selectedSeasons.includes(s)}
						<button
							type="button"
							onclick={() => toggleSeason(s)}
							disabled={saving}
							aria-pressed={on}
							class="rounded-full border px-3 py-1 text-xs transition-colors {on
								? 'border-primary bg-primary text-primary-foreground'
								: 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'} disabled:opacity-50"
						>
							{label}
						</button>
					{/each}
				</div>
			</fieldset>

			<div>
				<label for="outfit-tags" class="mb-1.5 block text-sm font-medium text-foreground">
					Tags <span class="text-muted-foreground">(komma-getrennt)</span>
				</label>
				<input
					id="outfit-tags"
					type="text"
					bind:value={tagsText}
					disabled={saving}
					placeholder="minimal, layering, meeting"
					class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
				/>
			</div>
		</div>

		<div class="space-y-3 rounded-2xl border border-border bg-card p-4">
			<header class="flex items-center justify-between">
				<h3 class="text-sm font-medium text-foreground">
					Zusammenstellung
					<span class="ml-1 text-xs text-muted-foreground">
						· {selectedGarments.length}
						{selectedGarments.length === 1 ? 'Stück' : 'Stücke'}
					</span>
				</h3>
			</header>
			{#if selectedGarments.length === 0}
				<p
					class="rounded-md border border-dashed border-border bg-background/50 p-3 text-xs text-muted-foreground"
				>
					Klicke links auf Kleidungsstücke, um sie dem Outfit hinzuzufügen.
				</p>
			{:else}
				<div class="flex flex-wrap gap-2">
					{#each selectedGarments as g (g.id)}
						{@const mediaId = g.mediaIds[0]}
						<div
							class="group relative overflow-hidden rounded-md border border-border bg-muted"
							style:width="72px"
							style:height="72px"
						>
							{#if mediaId}
								<img
									src={garmentPhotoUrl(mediaId, 'thumb')}
									alt={g.name}
									class="h-full w-full object-cover"
								/>
							{/if}
							<button
								type="button"
								onclick={() => removeGarment(g.id)}
								aria-label="Aus Outfit entfernen"
								title="Aus Outfit entfernen"
								class="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-error group-hover:opacity-100"
							>
								<X size={12} weight="bold" />
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		{#if error}
			<div
				class="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
				role="alert"
			>
				{error}
			</div>
		{/if}

		<div class="flex gap-2">
			<button
				type="submit"
				disabled={saving || !name.trim() || selectedIds.length === 0}
				class="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{saving ? 'Speichere…' : outfit ? 'Änderungen speichern' : 'Outfit anlegen'}
			</button>
			{#if onCancel}
				<button
					type="button"
					onclick={onCancel}
					disabled={saving}
					class="rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-50"
				>
					Abbrechen
				</button>
			{/if}
		</div>
	</section>
</form>
