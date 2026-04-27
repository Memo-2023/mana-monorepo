<!--
  CharacterPicker — selects the reference-image set that every panel
  in the story renders against. At minimum: primary face-ref from the
  active space's meImages. Optional add-ons:
    - primary body-ref (for full-body framing)
    - up to 3 wardrobe-garment photos (costume setup)

  Mirrors wardrobe's try-on composition (face + body + garments) but
  here the list is chosen ONCE at story-create time and fixed on the
  story row — every panel uses the same refs for visual continuity.

  Outputs: `value: string[]` (mediaIds, face-ref at [0]). Emits via
  `onChange` on every add/remove.
-->
<script lang="ts">
	import { Plus, X, UserCircle, TShirt } from '@mana/shared-icons';
	import { useImageByPrimary } from '$lib/modules/profile/queries';
	import { useAllGarments } from '$lib/modules/wardrobe/queries';
	import { garmentPhotoUrl } from '$lib/modules/wardrobe/api/media-url';
	import type { Garment } from '$lib/modules/wardrobe/types';
	import { _ } from 'svelte-i18n';

	interface Props {
		value: string[];
		onChange: (next: string[]) => void;
		disabled?: boolean;
	}

	let { value, onChange, disabled = false }: Props = $props();

	const face$ = useImageByPrimary('face-ref');
	const body$ = useImageByPrimary('body-ref');
	const garments$ = useAllGarments();

	const face = $derived(face$.value);
	const body = $derived(body$.value);
	const allGarments = $derived(garments$.value ?? []);

	// Auto-seed face-ref at position [0] the first time it becomes
	// available and value is still empty. After that, mutations go
	// through the Add/Remove buttons.
	let seeded = false;
	$effect(() => {
		if (!seeded && face?.mediaId && value.length === 0) {
			seeded = true;
			onChange([face.mediaId]);
		}
	});

	const hasFace = $derived(Boolean(face?.mediaId));
	const hasBody = $derived(Boolean(body?.mediaId));

	const bodyInValue = $derived(body?.mediaId ? value.includes(body.mediaId) : false);

	// Garment slots = everything beyond [face, body] if present.
	const garmentIdsInValue = $derived.by<string[]>(() => {
		const exclude = new Set<string>();
		if (face?.mediaId) exclude.add(face.mediaId);
		if (body?.mediaId) exclude.add(body.mediaId);
		return value.filter((id) => !exclude.has(id));
	});

	const garmentPicks = $derived.by<Garment[]>(() => {
		const out: Garment[] = [];
		for (const id of garmentIdsInValue) {
			const g = allGarments.find((g) => g.mediaIds[0] === id);
			if (g) out.push(g);
		}
		return out;
	});

	// Garments the user can still add (not already picked, has a photo,
	// not archived). Max 3 slots.
	const MAX_GARMENTS = 3;
	const canAddGarment = $derived(garmentIdsInValue.length < MAX_GARMENTS);
	const availableGarments = $derived(
		allGarments.filter(
			(g) => !g.isArchived && g.mediaIds[0] && !garmentIdsInValue.includes(g.mediaIds[0])
		)
	);

	let showGarmentPicker = $state(false);

	function toggleBody() {
		if (!body?.mediaId) return;
		if (bodyInValue) {
			onChange(value.filter((id) => id !== body.mediaId));
		} else {
			// Insert body at [1] (right after face), before garments.
			const next = [...value];
			const insertAt = face?.mediaId && next[0] === face.mediaId ? 1 : 0;
			next.splice(insertAt, 0, body.mediaId);
			onChange(next);
		}
	}

	function addGarment(g: Garment) {
		const mediaId = g.mediaIds[0];
		if (!mediaId || value.includes(mediaId)) return;
		onChange([...value, mediaId]);
		showGarmentPicker = false;
	}

	function removeGarment(mediaId: string) {
		onChange(value.filter((id) => id !== mediaId));
	}
</script>

<div class="space-y-3">
	<div>
		<h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
			{$_('comic.picker.section_title')}
		</h3>
		<p class="mt-0.5 text-xs text-muted-foreground">
			{$_('comic.picker.section_hint', { values: { max: MAX_GARMENTS } })}
		</p>
	</div>

	<div class="flex flex-wrap items-start gap-2">
		<!-- Face ref tile — mandatory, not deselectable. -->
		<div class="flex flex-col items-center gap-1">
			{#if face?.publicUrl}
				<div
					class="relative h-20 w-20 overflow-hidden rounded-md border-2 border-primary/40"
					title={$_('comic.picker.face_required_title')}
				>
					<img
						src={face.thumbnailUrl ?? face.publicUrl}
						alt={$_('comic.picker.face_alt')}
						class="h-full w-full object-cover"
					/>
					<span
						class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1 py-0.5 text-center text-[9px] font-semibold uppercase tracking-wider text-white"
					>
						{$_('comic.picker.face_required_badge')}
					</span>
				</div>
			{:else}
				<div
					class="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-muted/50 text-[10px] text-muted-foreground"
				>
					<UserCircle size={20} />
					<span>{$_('comic.picker.face_missing')}</span>
				</div>
			{/if}
			<span class="text-[10px] font-medium text-muted-foreground"
				>{$_('comic.picker.face_label')}</span
			>
		</div>

		<!-- Body ref tile — optional toggle. Two states need clear visual
		     differentiation:
		       - inactive: dimmed image + Plus overlay → "click to add"
		       - active:   primary border + on-hover X overlay → "click to remove"
		     The X-on-hover when active is the part the user was missing
		     (previously nothing changed on hover when picked). -->
		<div class="flex flex-col items-center gap-1">
			{#if body?.publicUrl}
				<button
					type="button"
					{disabled}
					onclick={toggleBody}
					class="group relative h-20 w-20 overflow-hidden rounded-md border-2 transition-all active:translate-y-px
						{bodyInValue
						? 'border-primary shadow-sm shadow-primary/20'
						: 'border-border opacity-60 hover:border-primary/50 hover:opacity-100 hover:shadow-sm'}"
					aria-pressed={bodyInValue}
					title={bodyInValue ? $_('comic.picker.toggle_remove') : $_('comic.picker.toggle_add')}
				>
					<img
						src={body.thumbnailUrl ?? body.publicUrl}
						alt={$_('comic.picker.body_alt')}
						class="h-full w-full object-cover"
					/>
					{#if !bodyInValue}
						<div
							class="absolute inset-0 flex items-center justify-center bg-background/50 text-foreground"
						>
							<Plus size={20} weight="bold" />
						</div>
					{:else}
						<div
							class="absolute inset-0 flex items-center justify-center bg-error/0 text-white opacity-0 transition-all group-hover:bg-error/60 group-hover:opacity-100"
						>
							<X size={20} weight="bold" />
						</div>
					{/if}
				</button>
			{:else}
				<div
					class="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-muted/30 text-[10px] text-muted-foreground"
					title={$_('comic.picker.body_no_in_space')}
				>
					<UserCircle size={18} />
					<span>{$_('comic.picker.body_missing')}</span>
				</div>
			{/if}
			<span class="text-[10px] font-medium text-muted-foreground"
				>{$_('comic.picker.body_label')}</span
			>
		</div>

		<!-- Garment tiles (picked). Whole tile is also clickable to
		     remove — easier to hit on touch. Plus a dedicated X badge
		     in the corner that's bigger + higher contrast than before
		     so it reads as a control even at a glance. -->
		{#each garmentPicks as g (g.id)}
			{@const mediaId = g.mediaIds[0]}
			<div class="flex flex-col items-center gap-1">
				<button
					type="button"
					{disabled}
					onclick={() => mediaId && removeGarment(mediaId)}
					class="group relative h-20 w-20 overflow-hidden rounded-md border-2 border-primary/40 shadow-sm transition-all active:translate-y-px hover:border-error/60"
					aria-label={$_('comic.picker.garment_remove_aria', { values: { name: g.name } })}
					title={$_('comic.picker.toggle_remove')}
				>
					{#if mediaId}
						<img
							src={garmentPhotoUrl(mediaId, 'thumb')}
							alt={g.name}
							class="h-full w-full object-cover"
						/>
					{/if}
					<!-- Always-visible X badge -->
					<span
						class="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background text-foreground shadow ring-1 ring-border transition-all group-hover:bg-error group-hover:text-white group-hover:ring-error"
					>
						<X size={12} weight="bold" />
					</span>
				</button>
				<span class="max-w-20 truncate text-[10px] font-medium text-muted-foreground">
					{g.name}
				</span>
			</div>
		{/each}

		<!-- Add-garment button -->
		{#if canAddGarment}
			<div class="flex flex-col items-center gap-1">
				<button
					type="button"
					{disabled}
					onclick={() => (showGarmentPicker = !showGarmentPicker)}
					class="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-background text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-foreground hover:shadow-sm active:translate-y-px"
					class:!border-primary={showGarmentPicker}
					class:!bg-primary={showGarmentPicker}
					class:bg-opacity-10={showGarmentPicker}
					aria-expanded={showGarmentPicker}
				>
					<Plus size={16} />
					<span class="text-[10px] font-medium">{$_('comic.picker.garment_label')}</span>
				</button>
				<span class="text-[10px] text-muted-foreground">
					{garmentIdsInValue.length}/{MAX_GARMENTS}
				</span>
			</div>
		{/if}
	</div>

	<!-- Garment picker (collapsible). Only shows when toggled open. -->
	{#if showGarmentPicker}
		<div class="rounded-lg border border-border bg-muted/30 p-3">
			<div class="mb-2 flex items-center justify-between">
				<h4 class="text-xs font-semibold text-foreground">
					{$_('comic.picker.garment_picker_title')}
				</h4>
				<button
					type="button"
					onclick={() => (showGarmentPicker = false)}
					class="text-xs text-muted-foreground hover:text-foreground"
				>
					{$_('comic.picker.garment_picker_close')}
				</button>
			</div>
			{#if availableGarments.length === 0}
				<p class="text-xs text-muted-foreground">
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html $_('comic.picker.garment_picker_empty_html')}
				</p>
			{:else}
				<div class="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
					{#each availableGarments as g (g.id)}
						{@const mediaId = g.mediaIds[0]}
						<button
							type="button"
							onclick={() => addGarment(g)}
							class="group flex flex-col items-center gap-1 overflow-hidden rounded-md border border-border bg-background text-left hover:border-primary/50"
							title={g.name}
						>
							<div class="aspect-square w-full bg-muted">
								{#if mediaId}
									<img
										src={garmentPhotoUrl(mediaId, 'thumb')}
										alt={g.name}
										class="h-full w-full object-cover"
									/>
								{/if}
							</div>
							<span class="w-full truncate px-1 pb-1 text-[10px] text-foreground">
								{g.name}
							</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	{#if !hasFace}
		<div class="rounded-md border border-error/30 bg-error/5 p-3 text-xs text-error" role="alert">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html $_('comic.picker.no_face_alert_html')}
		</div>
	{:else if !hasBody}
		<p class="text-xs text-muted-foreground">
			<TShirt size={12} class="inline" />
			{$_('comic.picker.body_tip')}
		</p>
	{/if}
</div>
