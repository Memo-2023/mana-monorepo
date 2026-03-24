<script lang="ts">
	import type { KeyboardShortcutsProps } from '../types.js';

	let { items, translations }: KeyboardShortcutsProps = $props();

	const allShortcuts = $derived(() => {
		return items.flatMap((item) =>
			item.shortcuts.map((shortcut) => ({
				...shortcut,
				category: item.category,
				title: item.title,
			}))
		);
	});

	const hasItems = $derived(allShortcuts().length > 0);
</script>

{#if !hasItems}
	<p class="py-8 text-center text-gray-500 dark:text-gray-400">
		{translations.shortcuts.noItems}
	</p>
{:else}
	<div class="overflow-x-auto">
		<table class="w-full text-left text-sm">
			<thead>
				<tr class="border-b border-gray-200 dark:border-gray-700">
					<th class="pb-3 pr-4 font-semibold text-gray-900 dark:text-gray-100"
						>{translations.shortcuts.columns.shortcut}</th
					>
					<th class="pb-3 pr-4 font-semibold text-gray-900 dark:text-gray-100"
						>{translations.shortcuts.columns.action}</th
					>
					<th class="pb-3 font-semibold text-gray-900 dark:text-gray-100"
						>{translations.shortcuts.columns.description}</th
					>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100 dark:divide-gray-800">
				{#each allShortcuts() as shortcut}
					<tr>
						<td class="py-3 pr-4">
							<kbd
								class="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-200"
							>
								{shortcut.shortcut}
							</kbd>
						</td>
						<td class="py-3 pr-4 text-gray-900 dark:text-gray-100">
							{shortcut.action}
						</td>
						<td class="py-3 text-gray-600 dark:text-gray-400">
							{shortcut.description || '-'}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
