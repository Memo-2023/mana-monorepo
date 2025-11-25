<script lang="ts">
	import type { Card } from './types';
	import CardRenderer from './CardRenderer.svelte';
	import Dropdown from '$lib/components/Dropdown.svelte';

	interface Props {
		card: Card;
		index: number;
		isDragging: boolean;
		dropTargetIndex: number | null;
		onDragStart: (event: DragEvent, index: number) => void;
		onDragOver: (event: DragEvent, index: number) => void;
		onDragLeave: () => void;
		onDrop: (event: DragEvent, index: number) => void;
		onDragEnd: () => void;
		onEdit: (card: Card) => void;
		onDuplicate: (card: Card) => void;
		onToggleVisibility: (card: Card) => void;
		onToggleProfileDisplay: (card: Card) => void;
		onDelete: (cardId: string) => void;
	}

	let {
		card,
		index,
		isDragging,
		dropTargetIndex,
		onDragStart,
		onDragOver,
		onDragLeave,
		onDrop,
		onDragEnd,
		onEdit,
		onDuplicate,
		onToggleVisibility,
		onToggleProfileDisplay,
		onDelete
	}: Props = $props();

	// Generate dropdown items based on card state
	let dropdownItems = $derived([
		{
			label: 'Duplicate',
			icon: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>',
			color: '#2563eb',
			action: () => onDuplicate(card)
		},
		{
			divider: true
		},
		{
			label: card.metadata?.is_active !== false ? 'Hide Card' : 'Show Card',
			icon: card.metadata?.is_active !== false 
				? '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>'
				: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>',
			color: '#ea580c',
			action: () => onToggleVisibility(card)
		},
		{
			divider: true
		},
		{
			label: 'Delete',
			icon: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>',
			color: '#dc2626',
			action: () => card.id && onDelete(card.id)
		}
	]);
</script>

<div
	role="listitem"
	draggable="true"
	ondragstart={(e) => onDragStart(e, index)}
	ondragover={(e) => onDragOver(e, index)}
	ondragleave={onDragLeave}
	ondrop={(e) => onDrop(e, index)}
	ondragend={onDragEnd}
	class="group relative cursor-move transition-all {dropTargetIndex === index
		? 'scale-105 opacity-50'
		: ''}"
>
	<!-- Card Number Badge -->
	<div
		class="absolute -top-2 -left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-theme-primary text-sm font-bold text-white"
	>
		{index + 1}
	</div>

	<!-- Card Preview -->
	<div class="rounded-xl border border-theme-border bg-theme-surface p-6 shadow-lg transition-colors hover:bg-theme-surface-hover">
		<!-- Card Info -->
		<div class="mb-3">
			<h3 class="font-semibold text-theme-text">
				{card.metadata?.name || `Card ${index + 1}`}
			</h3>
			<p class="text-sm text-theme-text-muted">
				Aspect: {card.constraints?.aspectRatio || 'auto'}
			</p>
		</div>

		<!-- Mini Preview -->
		<div class="mb-3 max-h-48 overflow-hidden rounded border border-theme-border">
			<CardRenderer {card} />
		</div>

		<!-- Profile Display Toggle -->
		<div class="mb-3 flex items-center justify-between rounded bg-theme-surface-hover p-2">
			<label class="flex items-center gap-2 text-sm font-medium text-theme-text">
				<input
					type="checkbox"
					checked={card.page === 'profile'}
					onchange={() => onToggleProfileDisplay(card)}
					class="rounded border-theme-border"
				/>
				Show on Profile
			</label>
			{#if card.visibility !== 'public' && card.page === 'profile'}
				<span class="text-xs text-orange-600">⚠️ Set to public to display</span>
			{/if}
		</div>

		<!-- Card Actions -->
		<div class="flex gap-2">
			<button
				onclick={() => onEdit(card)}
				class="flex-1 rounded bg-theme-primary/10 px-3 py-1.5 text-sm font-medium text-theme-primary transition hover:bg-theme-primary/20"
			>
				Edit Card
			</button>
			<Dropdown
				items={dropdownItems}
				buttonText="Actions"
				size="sm"
			/>
		</div>
	</div>

	<!-- Drag Handle -->
	<div
		class="absolute top-4 right-4 opacity-0 transition-opacity group-hover:opacity-100"
	>
		<svg
			class="h-6 w-6 text-theme-text-muted"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4 8h16M4 16h16"
			/>
		</svg>
	</div>
</div>