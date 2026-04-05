<script lang="ts">
	import { Modal } from '../organisms';
	import { Keyboard, Hash, X } from '@mana/shared-icons';
	import KeyboardShortcutsPanel from './KeyboardShortcutsPanel.svelte';
	import SyntaxHelpPanel from './SyntaxHelpPanel.svelte';
	import type { HelpModalConfig } from './types';

	interface Props {
		/** Whether the modal is open */
		open: boolean;
		/** Close handler */
		onClose: () => void;
		/** Configuration for the modal content */
		config: HelpModalConfig;
	}

	let { open, onClose, config }: Props = $props();

	// Determine which tabs to show
	const hasShortcuts = $derived((config.shortcuts?.length ?? 0) > 0);
	const hasSyntax = $derived((config.syntax?.length ?? 0) > 0);
	const showTabs = $derived(config.showTabs ?? (hasShortcuts && hasSyntax));

	// Active tab state
	let activeTab = $state<'shortcuts' | 'syntax'>(config.defaultTab ?? 'shortcuts');

	// Reset to default tab when modal opens
	$effect(() => {
		if (open) {
			activeTab = config.defaultTab ?? 'shortcuts';
		}
	});

	// If only one type is available, show that one
	const effectiveTab = $derived(() => {
		if (!hasShortcuts) return 'syntax';
		if (!hasSyntax) return 'shortcuts';
		return activeTab;
	});
</script>

<Modal visible={open} {onClose} title="" showHeader={false} maxWidth="md">
	<div class="help-modal">
		<!-- Header with Tabs -->
		<div class="modal-header">
			{#if showTabs}
				<div class="tabs">
					{#if hasShortcuts}
						<button
							class="tab"
							class:active={effectiveTab() === 'shortcuts'}
							onclick={() => (activeTab = 'shortcuts')}
						>
							<Keyboard size={16} weight="bold" />
							<span>Tastenkürzel</span>
						</button>
					{/if}
					{#if hasSyntax}
						<button
							class="tab"
							class:active={effectiveTab() === 'syntax'}
							onclick={() => (activeTab = 'syntax')}
						>
							<Hash size={16} weight="bold" />
							<span>Syntax</span>
						</button>
					{/if}
				</div>
			{:else}
				<div class="header-title">
					{#if hasShortcuts}
						<Keyboard size={18} weight="bold" />
						<span>Tastenkürzel</span>
					{:else if hasSyntax}
						<Hash size={18} weight="bold" />
						<span>Syntax-Hilfe</span>
					{/if}
				</div>
			{/if}
			<button class="close-btn" onclick={onClose} aria-label="Schließen">
				<X size={18} weight="bold" />
			</button>
		</div>

		<!-- Content -->
		<div class="modal-content">
			{#if effectiveTab() === 'shortcuts' && config.shortcuts}
				<KeyboardShortcutsPanel categories={config.shortcuts} />
			{:else if effectiveTab() === 'syntax' && config.syntax}
				<SyntaxHelpPanel
					groups={config.syntax}
					showLiveExample={!!config.liveExample}
					liveExample={config.liveExample}
				/>
			{/if}
		</div>
	</div>
</Modal>

<style>
	.help-modal {
		margin: -1.5rem;
	}

	/* Header */
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-muted) / 0.3);
	}

	.header-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	/* Tabs */
	.tabs {
		display: flex;
		gap: 0.25rem;
		padding: 0.25rem;
		background: hsl(var(--color-muted) / 0.5);
		border-radius: var(--radius-lg);
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.tab:hover {
		color: hsl(var(--color-foreground));
	}

	.tab.active {
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		box-shadow: 0 1px 3px hsl(var(--color-foreground) / 0.1);
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.close-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	/* Content */
	.modal-content {
		padding: 1.25rem;
		max-height: 70vh;
		overflow-y: auto;
	}
</style>
