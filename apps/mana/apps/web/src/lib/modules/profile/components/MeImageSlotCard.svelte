<!--
  Primary-slot card for Face / Fullbody. When the slot is filled it
  renders a big preview with the slot holder's controls (AI toggle,
  "neues Bild setzen", delete). When empty it collapses to a drop-zone.

  Replacing the slot is a single gesture: dropping a file on a filled
  card uploads, creates a new meImage with the slot's kind, and claims
  the slot — the previous holder stays in the grid below (minus its
  primary-star), so the user can delete or re-promote if they prefer.
-->
<script lang="ts">
	import { Robot, Trash } from '@mana/shared-icons';
	import { Toggle } from '@mana/shared-ui';
	import MeImageUploadZone from './MeImageUploadZone.svelte';
	import type { MeImage, MeImageKind, MeImagePrimarySlot } from '../types';

	interface Props {
		title: string;
		kind: MeImageKind;
		slot: MeImagePrimarySlot;
		image: MeImage | null;
		emptyLabel?: string;
		emptyHint?: string;
		uploading?: boolean;
		onFiles: (files: File[], kind: MeImageKind, slot: MeImagePrimarySlot) => void;
		onToggleAi: (id: string, enabled: boolean) => void;
		onDelete: (id: string) => void;
	}

	let {
		title,
		kind,
		slot,
		image,
		emptyLabel,
		emptyHint,
		uploading = false,
		onFiles,
		onToggleAi,
		onDelete,
	}: Props = $props();
</script>

<article class="rounded-2xl border border-border bg-card p-4 shadow-sm">
	<header class="mb-3 flex items-center justify-between">
		<h3 class="text-sm font-semibold text-foreground">{title}</h3>
		{#if image}
			<span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
				Primär
			</span>
		{/if}
	</header>

	{#if image}
		<div class="relative overflow-hidden rounded-xl bg-muted">
			<img
				src={image.publicUrl}
				alt={image.label ?? title}
				class="aspect-[4/5] w-full object-cover"
			/>
		</div>

		<div class="mt-3 flex items-center justify-between gap-2">
			<label class="flex items-center gap-2 text-xs text-foreground">
				<Robot size={14} weight="regular" class="text-muted-foreground" />
				<span>KI darf nutzen</span>
				<Toggle
					isOn={image.usage.aiReference}
					onToggle={(v) => onToggleAi(image.id, v)}
					size="sm"
				/>
			</label>
			<button
				type="button"
				onclick={() => onDelete(image.id)}
				aria-label="Bild löschen"
				title="Bild löschen"
				class="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
			>
				<Trash size={15} weight="regular" />
			</button>
		</div>

		<!-- Compact "replace" zone -->
		<div class="mt-3">
			<MeImageUploadZone
				variant="compact"
				label="Neues Bild setzen"
				hint="Ersetzt das aktuelle Primärbild"
				disabled={uploading}
				onFiles={(files) => onFiles(files, kind, slot)}
			/>
		</div>
	{:else}
		<MeImageUploadZone
			variant="large"
			label={emptyLabel ?? `${title} hochladen`}
			hint={emptyHint ?? 'Ziehe ein Bild hierher oder klicke'}
			disabled={uploading}
			onFiles={(files) => onFiles(files, kind, slot)}
		/>
	{/if}
</article>
