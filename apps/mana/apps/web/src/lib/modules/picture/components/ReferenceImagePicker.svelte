<!--
  Reference-picker for the Picture generator. Lists every me-image the
  user has explicitly flagged with `usage.aiReference=true` (plan M2)
  and lets the caller pick up to 4 to feed into /generate-with-reference.

  The component holds no identity of its own — parents own the
  selectedIds via `bind:` so the generator page can switch its fetch
  endpoint + persist the ids on the resulting LocalImage.
-->
<script lang="ts">
	import { Check, UserCircle } from '@mana/shared-icons';
	import { useReferenceImages } from '$lib/modules/profile/queries';
	import type { MeImage } from '$lib/modules/profile/types';

	interface Props {
		selectedIds: string[];
		maxSelection?: number;
	}

	let { selectedIds = $bindable([]), maxSelection = 4 }: Props = $props();

	const referenceImages$ = useReferenceImages();
	const referenceImages = $derived(referenceImages$.value ?? []);
	const loading = $derived(referenceImages$.loading);

	const KIND_LABELS: Record<string, string> = {
		face: 'Gesicht',
		fullbody: 'Ganzkörper',
		halfbody: 'Halbkörper',
		hands: 'Hände',
		reference: 'Referenz',
	};

	function isSelected(id: string): boolean {
		return selectedIds.includes(id);
	}

	function toggle(img: MeImage) {
		if (isSelected(img.id)) {
			selectedIds = selectedIds.filter((id) => id !== img.id);
			return;
		}
		// At the cap: silently ignore rather than shuffling the earliest
		// pick out — easier to reason about than a "rolling window" and
		// matches the visual "disabled" hint we show below.
		if (selectedIds.length >= maxSelection) return;
		selectedIds = [...selectedIds, img.id];
	}

	function clear() {
		selectedIds = [];
	}
</script>

{#if loading && referenceImages.length === 0}
	<p class="text-xs text-muted-foreground">Lade Referenz-Bilder…</p>
{:else if referenceImages.length === 0}
	<div
		class="flex items-start gap-3 rounded-md border border-dashed border-border bg-background/50 p-3 text-xs text-muted-foreground"
	>
		<UserCircle size={18} weight="regular" class="mt-0.5 flex-shrink-0" />
		<div class="space-y-1">
			<p class="text-foreground">Noch keine Referenzbilder freigegeben.</p>
			<p>
				Lade ein Gesichts- oder Ganzkörperbild hoch und aktiviere "KI darf nutzen" unter
				<a href="/profile/me-images" class="font-medium text-primary hover:underline">
					Meine Bilder
				</a>.
			</p>
		</div>
	</div>
{:else}
	<div class="space-y-2">
		<div class="flex items-center justify-between text-xs">
			<span class="text-muted-foreground">
				{selectedIds.length} von {maxSelection} ausgewählt
			</span>
			{#if selectedIds.length > 0}
				<button
					type="button"
					onclick={clear}
					class="font-medium text-muted-foreground hover:text-foreground"
				>
					Zurücksetzen
				</button>
			{/if}
		</div>

		<div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
			{#each referenceImages as img (img.id)}
				{@const selected = isSelected(img.id)}
				{@const disabled = !selected && selectedIds.length >= maxSelection}
				<button
					type="button"
					onclick={() => toggle(img)}
					{disabled}
					aria-pressed={selected}
					aria-label={selected ? 'Auswahl aufheben' : 'Auswählen'}
					class="group relative aspect-square overflow-hidden rounded-md border bg-muted transition-all {selected
						? 'border-primary ring-2 ring-primary'
						: 'border-border hover:border-primary/50'} {disabled
						? 'cursor-not-allowed opacity-40'
						: 'cursor-pointer'}"
				>
					{#if img.thumbnailUrl || img.publicUrl}
						<img
							src={img.thumbnailUrl ?? img.publicUrl}
							alt={img.label ?? KIND_LABELS[img.kind]}
							class="h-full w-full object-cover"
							loading="lazy"
						/>
					{/if}
					<span
						class="absolute left-1 top-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm"
					>
						{KIND_LABELS[img.kind] ?? img.kind}
					</span>
					{#if selected}
						<span
							class="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
						>
							<Check size={12} weight="bold" />
						</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>
{/if}
