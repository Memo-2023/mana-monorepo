<!--
  Grid tile for a single me-image. Shows thumbnail, kind badge, and
  the three hot controls: AI opt-in toggle, primary-star toggle, and
  delete. The parent owns the store-write callbacks so this component
  stays presentational.
-->
<script lang="ts">
	import { Star, Trash, Robot } from '@mana/shared-icons';
	import { Toggle } from '@mana/shared-ui';
	import type { MeImage, MeImagePrimarySlot } from '../types';

	interface Props {
		image: MeImage;
		primarySlotForKind: MeImagePrimarySlot | null;
		onToggleAi: (enabled: boolean) => void;
		onTogglePrimary: () => void;
		onDelete: () => void;
	}

	let { image, primarySlotForKind, onToggleAi, onTogglePrimary, onDelete }: Props = $props();

	const KIND_LABELS: Record<string, string> = {
		face: 'Gesicht',
		fullbody: 'Ganzkörper',
		halfbody: 'Halbkörper',
		hands: 'Hände',
		reference: 'Referenz',
	};

	const isPrimary = $derived(image.primaryFor !== null && image.primaryFor !== undefined);
	const canBePrimary = $derived(primarySlotForKind !== null);
</script>

<article
	class="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
>
	<!-- Thumbnail -->
	<div class="relative aspect-square bg-muted">
		{#if image.thumbnailUrl || image.publicUrl}
			<img
				src={image.thumbnailUrl ?? image.publicUrl}
				alt={image.label ?? KIND_LABELS[image.kind]}
				class="h-full w-full object-cover"
				loading="lazy"
			/>
		{/if}

		<!-- Kind badge -->
		<span
			class="absolute left-2 top-2 rounded-md bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm"
		>
			{KIND_LABELS[image.kind] ?? image.kind}
		</span>

		<!-- Primary star (top-right) -->
		{#if canBePrimary}
			<button
				type="button"
				onclick={onTogglePrimary}
				aria-label={isPrimary ? 'Primär aufheben' : 'Als primär setzen'}
				title={isPrimary ? 'Primär aufheben' : 'Als primär setzen'}
				class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background
          {isPrimary ? 'text-primary' : 'text-muted-foreground'}"
			>
				<Star size={16} weight={isPrimary ? 'fill' : 'regular'} />
			</button>
		{/if}
	</div>

	<!-- Footer: AI opt-in + delete -->
	<div class="flex items-center justify-between gap-2 px-3 py-2">
		<label class="flex min-w-0 flex-1 items-center gap-2 text-xs text-foreground">
			<Robot size={14} weight="regular" class="flex-shrink-0 text-muted-foreground" />
			<span class="truncate">KI darf nutzen</span>
			<Toggle isOn={image.usage.aiReference} onToggle={(v) => onToggleAi(v)} size="sm" />
		</label>
		<button
			type="button"
			onclick={onDelete}
			aria-label="Bild löschen"
			title="Bild löschen"
			class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
		>
			<Trash size={14} weight="regular" />
		</button>
	</div>
</article>
