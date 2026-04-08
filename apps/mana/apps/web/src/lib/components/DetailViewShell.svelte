<!--
  DetailViewShell — shared visual scaffold for module DetailView screens.

  Encodes the workbench DetailView convention every Mana module shares:
    outer flex column with scroll → loading/not-found state →
    consumer body (title input, property rows, sections) → danger zone with
    confirm-delete flow.

  All inner classes (`.title-input`, `.properties`, `.prop-row`,
  `.section`, `.section-label`, `.description-input`, `.prop-input`,
  `.prop-value`, `.prop-label`, `.meta`, `.toggle-btn`, `.fav-btn`) are
  exported as `:global` so consumers can use them inside the snippet body
  without redefining the styles.

  Pair with `useDetailEntity` from `$lib/data/detail-entity.svelte` for the
  matching JS plumbing (livequery + decrypt + focused/confirmDelete state +
  delete-with-undo).
-->
<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import { Trash } from '@mana/shared-icons';

	interface Props {
		entity: T | null;
		loading?: boolean;
		notFoundLabel?: string;
		confirmDelete: boolean;
		onAskDelete: () => void;
		onCancelDelete: () => void;
		onConfirmDelete: () => void;
		confirmDeleteLabel?: string;
		confirmDeleteAction?: string;
		body: Snippet<[T]>;
		/** Optional snippet rendered inside the body slot when entity is null but not loading. */
		notFound?: Snippet;
	}

	let {
		entity,
		loading = false,
		notFoundLabel = 'Nicht gefunden',
		confirmDelete,
		onAskDelete,
		onCancelDelete,
		onConfirmDelete,
		confirmDeleteLabel = 'Wirklich löschen?',
		confirmDeleteAction = 'Löschen',
		body,
		notFound,
	}: Props = $props();
</script>

<div class="detail-view">
	{#if loading && !entity}
		<p class="empty">Lade…</p>
	{:else if !entity}
		{#if notFound}
			{@render notFound()}
		{:else}
			<p class="empty">{notFoundLabel}</p>
		{/if}
	{:else}
		{@render body(entity)}

		<div class="danger-zone">
			{#if confirmDelete}
				<p class="confirm-text">{confirmDeleteLabel}</p>
				<div class="confirm-actions">
					<button class="action-btn danger" onclick={onConfirmDelete}>{confirmDeleteAction}</button>
					<button class="action-btn" onclick={onCancelDelete}>Abbrechen</button>
				</div>
			{:else}
				<button class="action-btn danger-subtle" onclick={onAskDelete}>
					<Trash size={14} /> Löschen
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.detail-view {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		height: 100%;
		overflow-y: auto;
	}
	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: #9ca3af;
	}

	/* Title input — used by consumer body via :global */
	:global(.detail-view .title-input) {
		font-size: 1.125rem;
		font-weight: 600;
		border: 1px solid transparent;
		background: transparent;
		outline: none;
		color: #374151;
		padding: 0.125rem 0;
		border-radius: 0.25rem;
		transition: border-color 0.15s;
		width: 100%;
	}
	:global(.detail-view .title-input:hover),
	:global(.detail-view .title-input:focus) {
		border-color: rgba(0, 0, 0, 0.1);
	}
	:global(.dark .detail-view .title-input) {
		color: #f3f4f6;
	}
	:global(.dark .detail-view .title-input:hover),
	:global(.dark .detail-view .title-input:focus) {
		border-color: rgba(255, 255, 255, 0.1);
	}

	:global(.detail-view .title-row) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	:global(.detail-view .title-icon) {
		font-size: 1.25rem;
	}

	/* Properties */
	:global(.detail-view .properties) {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	:global(.detail-view .prop-row) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.25rem 0;
		gap: 0.5rem;
	}
	:global(.detail-view .prop-label) {
		font-size: 0.75rem;
		color: #9ca3af;
	}
	:global(.detail-view .prop-value) {
		font-size: 0.8125rem;
		color: #374151;
		max-width: 60%;
		text-align: right;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	:global(.detail-view .prop-value.mono) {
		font-family: monospace;
		font-size: 0.75rem;
	}
	:global(.dark .detail-view .prop-value) {
		color: #e5e7eb;
	}

	:global(.detail-view .prop-input) {
		flex: 1;
		min-width: 0;
		max-width: 60%;
		text-align: right;
		font-size: 0.8125rem;
		color: #374151;
		background: transparent;
		border: 1px solid transparent;
		outline: none;
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		transition: border-color 0.15s;
	}
	:global(.detail-view .prop-input:hover),
	:global(.detail-view .prop-input:focus) {
		border-color: rgba(0, 0, 0, 0.1);
	}
	:global(.dark .detail-view .prop-input) {
		color: #f3f4f6;
	}
	:global(.dark .detail-view .prop-input:hover),
	:global(.dark .detail-view .prop-input:focus) {
		border-color: rgba(255, 255, 255, 0.1);
	}

	:global(.detail-view .prop-select) {
		flex: 1;
		min-width: 0;
		max-width: 60%;
		text-align: right;
		font-size: 0.8125rem;
		color: #374151;
		background: transparent;
		border: 1px solid transparent;
		outline: none;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		transition: border-color 0.15s;
	}
	:global(.detail-view .prop-select:hover),
	:global(.detail-view .prop-select:focus) {
		border-color: rgba(0, 0, 0, 0.1);
	}
	:global(.dark .detail-view .prop-select) {
		color: #f3f4f6;
	}
	:global(.dark .detail-view .prop-select:hover),
	:global(.dark .detail-view .prop-select:focus) {
		border-color: rgba(255, 255, 255, 0.1);
	}

	:global(.detail-view .color-input) {
		width: 28px;
		height: 24px;
		border: 1px solid transparent;
		border-radius: 0.25rem;
		padding: 0;
		cursor: pointer;
	}
	:global(.detail-view .color-input:hover) {
		border-color: rgba(0, 0, 0, 0.1);
	}
	:global(.dark .detail-view .color-input:hover) {
		border-color: rgba(255, 255, 255, 0.1);
	}

	:global(.detail-view .toggle-btn) {
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		background: transparent;
		border: 1px solid rgba(0, 0, 0, 0.1);
		font-size: 0.75rem;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.15s;
	}
	:global(.detail-view .toggle-btn.active) {
		background: rgba(99, 102, 241, 0.1);
		color: #6366f1;
		border-color: rgba(99, 102, 241, 0.3);
	}
	:global(.dark .detail-view .toggle-btn) {
		border-color: rgba(255, 255, 255, 0.1);
		color: #9ca3af;
	}

	:global(.detail-view .fav-btn) {
		border: none;
		background: transparent;
		cursor: pointer;
		padding: 0.125rem;
		color: #9ca3af;
		display: flex;
		align-items: center;
		transition: color 0.15s;
	}
	:global(.detail-view .fav-btn:hover),
	:global(.detail-view .fav-btn.active) {
		color: #ef4444;
	}

	/* Sections (description, etc.) */
	:global(.detail-view .section) {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	:global(.detail-view .section-label) {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #9ca3af;
	}
	:global(.detail-view .description-input) {
		width: 100%;
		font-size: 0.8125rem;
		color: #374151;
		background: transparent;
		border: 1px solid rgba(0, 0, 0, 0.08);
		outline: none;
		padding: 0.5rem;
		border-radius: 0.375rem;
		resize: vertical;
		font-family: inherit;
		transition: border-color 0.15s;
	}
	:global(.detail-view .description-input:focus) {
		border-color: rgba(0, 0, 0, 0.15);
	}
	:global(.dark .detail-view .description-input) {
		color: #f3f4f6;
		border-color: rgba(255, 255, 255, 0.08);
	}
	:global(.dark .detail-view .description-input:focus) {
		border-color: rgba(255, 255, 255, 0.15);
	}

	/* Meta footer */
	:global(.detail-view .meta) {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		font-size: 0.6875rem;
		color: #9ca3af;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}
	:global(.dark .detail-view .meta) {
		border-color: rgba(255, 255, 255, 0.06);
	}

	/* Danger zone */
	.danger-zone {
		padding-top: 0.5rem;
	}
	.confirm-text {
		font-size: 0.8125rem;
		color: #ef4444;
		margin: 0 0 0.5rem;
	}
	.confirm-actions {
		display: flex;
		gap: 0.5rem;
	}
	.action-btn {
		padding: 0.25rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: transparent;
		font-size: 0.75rem;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.15s;
	}
	.action-btn:hover {
		background: rgba(0, 0, 0, 0.04);
		color: #374151;
	}
	.action-btn.danger {
		background: #ef4444;
		border-color: #ef4444;
		color: white;
	}
	.action-btn.danger-subtle {
		color: #ef4444;
		border-color: transparent;
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	:global(.dark) .action-btn {
		border-color: rgba(255, 255, 255, 0.1);
		color: #9ca3af;
	}
	:global(.dark) .action-btn:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #e5e7eb;
	}

	@media (max-width: 640px) {
		.detail-view {
			padding: 0.75rem;
		}
		.action-btn {
			min-height: 44px;
		}
	}
</style>
