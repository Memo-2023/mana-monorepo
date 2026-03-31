<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import type { ShortcutGroup } from '$lib/utils/keyboardShortcuts';
	import { formatShortcut } from '$lib/utils/keyboardShortcuts';

	interface Props {
		visible: boolean;
		shortcutGroups: ShortcutGroup[];
		onClose: () => void;
	}

	let { visible, shortcutGroups, onClose }: Props = $props();
</script>

<Modal {visible} {onClose} title="Keyboard Shortcuts" maxWidth="lg">
	{#snippet children()}
		<div class="space-y-6">
			<!-- Description -->
			<p class="text-sm text-theme-secondary">
				Use these keyboard shortcuts to navigate and interact with your memos more efficiently.
			</p>

			<!-- Shortcut Groups -->
			{#each shortcutGroups as group (group.name)}
				<div class="space-y-2">
					<h4 class="text-sm font-semibold uppercase text-theme-secondary">{group.name}</h4>
					<div class="space-y-1">
						{#each group.shortcuts as shortcut}
							<div
								class="flex items-center justify-between rounded-lg border border-theme bg-content p-3"
							>
								<span class="text-sm text-theme">{shortcut.description}</span>
								<kbd class="kbd">{formatShortcut(shortcut)}</kbd>
							</div>
						{/each}
					</div>
				</div>
			{/each}

			<!-- Pro Tip -->
			<div class="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
				<div class="flex items-start gap-2">
					<svg
						class="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<div class="flex-1">
						<p class="text-sm font-medium text-blue-800 dark:text-blue-200">Pro Tip</p>
						<p class="text-xs text-blue-700 dark:text-blue-300 mt-1">
							Press <kbd class="kbd inline text-xs">?</kbd> to toggle this shortcuts panel at any time.
						</p>
					</div>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet footer()}
		<div class="flex justify-end">
			<button onclick={onClose} class="btn-primary">Got it!</button>
		</div>
	{/snippet}
</Modal>

<style>
	.kbd {
		@apply inline-flex items-center gap-1 rounded border border-theme bg-menu-hover px-2 py-1 font-mono text-xs font-semibold text-theme;
	}
</style>
