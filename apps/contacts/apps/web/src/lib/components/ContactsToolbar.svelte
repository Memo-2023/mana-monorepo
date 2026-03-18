<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { ExpandableToolbar } from '@manacore/shared-ui';
	import ContactsToolbarContent from './ContactsToolbarContent.svelte';
	import { contactsFilterStore } from '$lib/stores/filter.svelte';
	import { viewModeStore } from '$lib/stores/view-mode.svelte';
	import type { Contact } from '$lib/api/contacts';

	interface Props {
		contacts: Contact[];
	}

	let { contacts }: Props = $props();

	// Use store for collapsed state
	let isCollapsed = $derived(contactsFilterStore.isToolbarCollapsed);

	function handleCollapsedChange(collapsed: boolean) {
		contactsFilterStore.setToolbarCollapsed(collapsed);
	}
</script>

<!-- Main Expandable Toolbar (uses its own fixed positioning) -->
<ExpandableToolbar
	{isCollapsed}
	onCollapsedChange={handleCollapsedChange}
	collapsedTitle="Filter & Optionen"
	expandedTitle="Schließen"
>
	<ContactsToolbarContent {contacts} />
</ExpandableToolbar>

<!-- View Mode Pill - positioned to the LEFT of the FAB -->
<div class="view-mode-pill" class:toolbar-expanded={!isCollapsed}>
	<button
		type="button"
		class="view-btn"
		class:active={viewModeStore.mode === 'grid'}
		onclick={() => viewModeStore.setMode('grid')}
		title={$_('views.grid')}
	>
		<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
			/>
		</svg>
	</button>
	<button
		type="button"
		class="view-btn"
		class:active={viewModeStore.mode === 'alphabet'}
		onclick={() => viewModeStore.setMode('alphabet')}
		title={$_('views.alphabet')}
	>
		<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
			/>
		</svg>
	</button>
</div>

<style>
	/* View Mode Pill - positioned to the LEFT of the FAB (which is at right: calc(50% - 350px - 70px)) */
	.view-mode-pill {
		position: fixed;
		/* Same vertical alignment as FAB: bottom offset + 9px + safe-area */
		bottom: calc(70px + 9px + env(safe-area-inset-bottom, 0px));
		/* Position to the left of the FAB: FAB is at right: calc(50% - 350px - 70px), FAB width is 54px, gap is 8px */
		right: calc(50% - 350px - 70px + 54px + 8px);
		z-index: 91;
		display: flex;
		align-items: center;
		gap: 0.125rem;
		padding: 0.375rem;
		background: hsl(var(--color-surface) / 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid hsl(var(--color-border));
		border-radius: 9999px;
		box-shadow: 0 2px 8px hsl(var(--color-foreground) / 0.08);
		transition: bottom 0.2s ease;
	}

	/* When toolbar is expanded, move pill up with FAB */
	.view-mode-pill.toolbar-expanded {
		bottom: calc(70px + 70px + 9px + env(safe-area-inset-bottom, 0px));
	}

	/* Responsive - on smaller screens, position relative to viewport edge */
	@media (max-width: 900px) {
		.view-mode-pill {
			right: calc(1rem + 54px + 8px); /* FAB at right: 1rem, FAB width 54px, gap 8px */
		}
	}

	.view-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		background: transparent;
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
		transition: all 0.15s ease;
	}

	.view-btn:hover {
		background: hsl(var(--color-muted) / 0.5);
		color: hsl(var(--color-foreground));
	}

	.view-btn.active {
		background: color-mix(in srgb, #3b82f6 15%, transparent 85%);
		color: #3b82f6;
	}

	.view-btn :global(svg) {
		width: 1.125rem;
		height: 1.125rem;
	}
</style>
