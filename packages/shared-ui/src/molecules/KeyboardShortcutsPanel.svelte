<script lang="ts">
	/**
	 * KeyboardShortcutsPanel - Collapsible panel showing keyboard shortcuts
	 *
	 * Used in sidebars to show available keyboard shortcuts.
	 * Supports grouping shortcuts by category.
	 *
	 * @example Basic usage
	 * ```svelte
	 * <KeyboardShortcutsPanel
	 *   shortcuts={[
	 *     { keys: ['Ctrl', 'S'], label: 'Save' },
	 *     { keys: ['Ctrl', 'Z'], label: 'Undo' }
	 *   ]}
	 * />
	 * ```
	 *
	 * @example With categories
	 * ```svelte
	 * <KeyboardShortcutsPanel
	 *   shortcuts={[
	 *     { keys: ['Ctrl', 'W'], label: 'Close Tab', category: 'Navigation' },
	 *     { keys: ['Ctrl', '1'], label: 'Go to Record', category: 'Quick Access' }
	 *   ]}
	 *   title="Keyboard Shortcuts"
	 * />
	 * ```
	 */

	import { Text } from '../atoms';

	export interface KeyboardShortcut {
		/** Key combination (e.g., ['Ctrl', 'S'] or ['Cmd', 'Shift', 'P']) */
		keys: string[];
		/** Description of what the shortcut does */
		label: string;
		/** Category for grouping (optional) */
		category?: string;
	}

	interface Props {
		/** List of keyboard shortcuts */
		shortcuts: KeyboardShortcut[];
		/** Panel title */
		title?: string;
		/** Whether panel is initially expanded */
		expanded?: boolean;
		/** Whether panel is collapsible */
		collapsible?: boolean;
		/** Whether to show in compact mode (for minimized sidebar) */
		compact?: boolean;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		shortcuts,
		title = 'Shortcuts',
		expanded = $bindable(false),
		collapsible = true,
		compact = false,
		class: className = ''
	}: Props = $props();

	// Group shortcuts by category
	const groupedShortcuts = $derived(() => {
		const groups: Record<string, KeyboardShortcut[]> = {};

		for (const shortcut of shortcuts) {
			const category = shortcut.category || 'General';
			if (!groups[category]) {
				groups[category] = [];
			}
			groups[category].push(shortcut);
		}

		return groups;
	});

	function toggleExpanded() {
		if (collapsible) {
			expanded = !expanded;
		}
	}
</script>

{#if !compact}
	<div class="keyboard-shortcuts-panel {className}">
		<!-- Header -->
		<button
			type="button"
			class="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-menu-hover rounded-lg transition-colors"
			onclick={toggleExpanded}
			disabled={!collapsible}
		>
			<div class="flex items-center gap-2">
				<svg
					class="w-4 h-4 text-theme-secondary"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"
					/>
				</svg>
				<Text variant="small" weight="medium">{title}</Text>
			</div>
			{#if collapsible}
				<svg
					class="w-4 h-4 text-theme-secondary transition-transform {expanded ? 'rotate-180' : ''}"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			{/if}
		</button>

		<!-- Content -->
		{#if expanded || !collapsible}
			<div class="mt-2 space-y-3 px-3 pb-3">
				{#each Object.entries(groupedShortcuts()) as [category, categoryShortcuts]}
					<div class="shortcut-group">
						{#if Object.keys(groupedShortcuts()).length > 1}
							<Text variant="small" class="text-theme-tertiary mb-1.5 block">
								{category}
							</Text>
						{/if}
						<div class="space-y-1.5">
							{#each categoryShortcuts as shortcut}
								<div class="flex items-center justify-between gap-2">
									<Text variant="small" class="text-theme-secondary truncate">
										{shortcut.label}
									</Text>
									<div class="flex items-center gap-1 flex-shrink-0">
										{#each shortcut.keys as key, i}
											<kbd
												class="px-1.5 py-0.5 text-xs font-mono bg-surface-secondary rounded border border-theme"
											>
												{key}
											</kbd>
											{#if i < shortcut.keys.length - 1}
												<span class="text-theme-tertiary text-xs">+</span>
											{/if}
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<!-- Compact mode: just show icon with tooltip -->
	<button
		type="button"
		class="w-full flex items-center justify-center p-2 hover:bg-menu-hover rounded-lg transition-colors group relative"
		title={title}
	>
		<svg
			class="w-5 h-5 text-theme-secondary"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"
			/>
		</svg>
	</button>
{/if}
