<!--
  Inline edit form for a single garment. Hosted on the detail view.
  Presentational — the parent owns the `onSave` callback that writes
  through `wardrobeGarmentsStore.updateGarment`. Creation is not done
  here: new garments come from the upload flow with default values,
  and the detail view immediately opens in edit mode.
-->
<script lang="ts">
	import { CATEGORY_LABELS, CATEGORY_ORDER } from '../constants';
	import type { Garment, GarmentCategory } from '../types';

	interface Props {
		garment: Garment;
		onSave: (patch: {
			name: string;
			category: GarmentCategory;
			brand?: string | null;
			color?: string | null;
			size?: string | null;
			material?: string | null;
			tags: string[];
			notes?: string | null;
			priceCents?: number | null;
			currency?: string | null;
		}) => Promise<void> | void;
		onCancel?: () => void;
		saving?: boolean;
	}

	let { garment, onSave, onCancel, saving = false }: Props = $props();

	// Form state captures the garment's initial values. The parent
	// (DetailGarmentView) wraps us under `{#key id}` in the route so a
	// navigation to a different garment remounts us and these initializers
	// re-run — the captures are intentional, not a bug.
	/* svelte-ignore state_referenced_locally */
	let name = $state(garment.name);
	/* svelte-ignore state_referenced_locally */
	let category = $state<GarmentCategory>(garment.category);
	/* svelte-ignore state_referenced_locally */
	let brand = $state(garment.brand ?? '');
	/* svelte-ignore state_referenced_locally */
	let color = $state(garment.color ?? '');
	/* svelte-ignore state_referenced_locally */
	let size = $state(garment.size ?? '');
	/* svelte-ignore state_referenced_locally */
	let material = $state(garment.material ?? '');
	/* svelte-ignore state_referenced_locally */
	let tagsText = $state((garment.tags ?? []).join(', '));
	/* svelte-ignore state_referenced_locally */
	let notes = $state(garment.notes ?? '');
	/* svelte-ignore state_referenced_locally */
	let priceEuros = $state(
		garment.priceCents !== undefined && garment.priceCents !== null
			? (garment.priceCents / 100).toFixed(2)
			: ''
	);
	/* svelte-ignore state_referenced_locally */
	let currency = $state(garment.currency ?? 'EUR');
	let error = $state<string | null>(null);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!name.trim()) {
			error = 'Name darf nicht leer sein';
			return;
		}
		error = null;
		const parsedPrice = priceEuros.trim() ? Math.round(parseFloat(priceEuros) * 100) : null;
		const tagList = tagsText
			.split(',')
			.map((t) => t.trim())
			.filter((t) => t.length > 0);
		try {
			await onSave({
				name: name.trim(),
				category,
				brand: brand.trim() || null,
				color: color.trim() || null,
				size: size.trim() || null,
				material: material.trim() || null,
				tags: tagList,
				notes: notes.trim() || null,
				priceCents: parsedPrice !== null && !Number.isNaN(parsedPrice) ? parsedPrice : null,
				currency: currency.trim() || null,
			});
		} catch (e) {
			error = e instanceof Error ? e.message : 'Speichern fehlgeschlagen';
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	<div class="grid gap-3 sm:grid-cols-2">
		<div class="sm:col-span-2">
			<label for="garment-name" class="mb-1.5 block text-sm font-medium text-foreground">
				Name <span class="text-error">*</span>
			</label>
			<input
				id="garment-name"
				type="text"
				bind:value={name}
				disabled={saving}
				required
				placeholder="z.B. Blau-weiß gestreiftes Hemd"
				class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
			/>
		</div>

		<div>
			<label for="garment-category" class="mb-1.5 block text-sm font-medium text-foreground">
				Kategorie
			</label>
			<select
				id="garment-category"
				bind:value={category}
				disabled={saving}
				class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
			>
				{#each CATEGORY_ORDER as c}
					<option value={c}>{CATEGORY_LABELS[c]}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="garment-brand" class="mb-1.5 block text-sm font-medium text-foreground">
				Marke
			</label>
			<input
				id="garment-brand"
				type="text"
				bind:value={brand}
				disabled={saving}
				placeholder="z.B. Uniqlo"
				class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
			/>
		</div>

		<div>
			<label for="garment-color" class="mb-1.5 block text-sm font-medium text-foreground">
				Farbe
			</label>
			<input
				id="garment-color"
				type="text"
				bind:value={color}
				disabled={saving}
				placeholder="z.B. navy"
				class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
			/>
		</div>

		<div>
			<label for="garment-size" class="mb-1.5 block text-sm font-medium text-foreground">
				Größe
			</label>
			<input
				id="garment-size"
				type="text"
				bind:value={size}
				disabled={saving}
				placeholder="z.B. M oder 42"
				class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
			/>
		</div>

		<div>
			<label for="garment-material" class="mb-1.5 block text-sm font-medium text-foreground">
				Material
			</label>
			<input
				id="garment-material"
				type="text"
				bind:value={material}
				disabled={saving}
				placeholder="z.B. Baumwolle"
				class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
			/>
		</div>

		<div class="sm:col-span-2">
			<label for="garment-tags" class="mb-1.5 block text-sm font-medium text-foreground">
				Tags <span class="text-muted-foreground">(komma-getrennt)</span>
			</label>
			<input
				id="garment-tags"
				type="text"
				bind:value={tagsText}
				disabled={saving}
				placeholder="formal, sommer, lieblingsstück"
				class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
			/>
		</div>

		<div>
			<label for="garment-price" class="mb-1.5 block text-sm font-medium text-foreground">
				Preis
			</label>
			<div class="flex gap-2">
				<input
					id="garment-price"
					type="number"
					step="0.01"
					min="0"
					bind:value={priceEuros}
					disabled={saving}
					placeholder="0.00"
					class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
				/>
				<input
					type="text"
					bind:value={currency}
					disabled={saving}
					maxlength="3"
					aria-label="Währung"
					class="w-16 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
				/>
			</div>
		</div>

		<div class="sm:col-span-2">
			<label for="garment-notes" class="mb-1.5 block text-sm font-medium text-foreground">
				Notizen
			</label>
			<textarea
				id="garment-notes"
				bind:value={notes}
				disabled={saving}
				rows="2"
				placeholder="Anlass, Tragevorschriften, …"
				class="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
			></textarea>
		</div>
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
			disabled={saving || !name.trim()}
			class="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{saving ? 'Speichere…' : 'Speichern'}
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
</form>
