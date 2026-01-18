<script lang="ts">
	import { showKeyboardShortcuts } from '$lib/stores/ui';
	import { X } from '@manacore/shared-icons';

	interface Shortcut {
		key: string;
		description: string;
		category: string;
	}

	const shortcuts: Shortcut[] = [
		{ key: 'Tab', description: 'UI ein-/ausblenden', category: 'Allgemein' },
		{ key: '?', description: 'Tastaturkürzel anzeigen', category: 'Allgemein' },
		{ key: 'Escape', description: 'Modals/Overlays schließen', category: 'Allgemein' },
		{ key: 'G', description: 'Zur Galerie', category: 'Navigation' },
		{ key: 'E', description: 'Zu Entdecken', category: 'Navigation' },
		{ key: 'N', description: 'Neue Generierung', category: 'Navigation' },
		{ key: 'U', description: 'Zu Upload', category: 'Navigation' },
		{ key: 'A', description: 'Zum Archiv', category: 'Navigation' },
		{ key: '1', description: 'Listen-Ansicht', category: 'Ansicht' },
		{ key: '2', description: 'Grid 3x3 Ansicht', category: 'Ansicht' },
		{ key: '3', description: 'Grid 5x5 Ansicht', category: 'Ansicht' },
		{ key: 'S', description: 'Sidebar öffnen/schließen', category: 'UI' },
	];

	const categories = [...new Set(shortcuts.map((s) => s.category))];

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			showKeyboardShortcuts.set(false);
		}
	}
</script>

<svelte:window on:keydown={handleKeyDown} />

{#if $showKeyboardShortcuts}
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
		onclick={() => showKeyboardShortcuts.set(false)}
		role="presentation"
	>
		<div
			class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-gray-200/50 bg-white/95 p-8 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="shortcuts-title"
		>
			<!-- Header -->
			<div class="mb-6 flex items-center justify-between">
				<h2 id="shortcuts-title" class="text-2xl font-bold text-gray-900 dark:text-gray-100">
					Tastaturkürzel
				</h2>
				<button
					onclick={() => showKeyboardShortcuts.set(false)}
					class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100/80 text-gray-600 backdrop-blur-xl transition-all hover:bg-gray-200/80 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:bg-gray-700/80"
					aria-label="Schließen"
				>
					<X size={20} weight="bold" />
				</button>
			</div>

			<!-- Shortcuts by Category -->
			<div class="space-y-6">
				{#each categories as category}
					<div>
						<h3
							class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
						>
							{category}
						</h3>
						<div class="space-y-2">
							{#each shortcuts.filter((s) => s.category === category) as shortcut}
								<div
									class="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50"
								>
									<span class="text-sm text-gray-700 dark:text-gray-300"
										>{shortcut.description}</span
									>
									<kbd
										class="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600"
									>
										{shortcut.key}
									</kbd>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<!-- Footer -->
			<div class="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
				<p class="text-sm text-blue-800 dark:text-blue-300">
					💡 Tipp: Drücke <kbd
						class="rounded bg-blue-200 px-2 py-0.5 font-mono text-xs font-semibold dark:bg-blue-800"
						>?</kbd
					>
					um diese Hilfe jederzeit anzuzeigen
				</p>
			</div>
		</div>
	</div>
{/if}
