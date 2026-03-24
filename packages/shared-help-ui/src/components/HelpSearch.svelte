<script lang="ts">
	import type { HelpSearchProps } from '../types.js';
	import type { SearchResult } from '@manacore/shared-help-types';
	import { createSearcher } from '@manacore/shared-help-content';

	let { content, translations, placeholder, onResultSelect }: HelpSearchProps = $props();

	let query = $state('');
	let results = $state<SearchResult[]>([]);
	let isSearching = $state(false);
	let showResults = $state(false);
	let selectedIndex = $state(-1);

	const searcher = $derived(createSearcher(content));

	let debounceTimer: ReturnType<typeof setTimeout>;

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		query = target.value;
		selectedIndex = -1;

		clearTimeout(debounceTimer);

		if (query.trim().length < 2) {
			results = [];
			showResults = false;
			return;
		}

		isSearching = true;
		debounceTimer = setTimeout(() => {
			results = searcher(query, { limit: 8 });
			isSearching = false;
			showResults = true;
		}, 300);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (!showResults || results.length === 0) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, -1);
				break;
			case 'Enter':
				event.preventDefault();
				if (selectedIndex >= 0 && results[selectedIndex]) {
					selectResult(results[selectedIndex]);
				}
				break;
			case 'Escape':
				showResults = false;
				selectedIndex = -1;
				break;
		}
	}

	function selectResult(result: SearchResult) {
		onResultSelect(result);
		query = '';
		results = [];
		showResults = false;
		selectedIndex = -1;
	}

	function handleBlur(event: FocusEvent) {
		// Only close if focus moves outside the search container
		const relatedTarget = event.relatedTarget as HTMLElement | null;
		if (relatedTarget?.closest('[data-help-search]')) return;
		showResults = false;
	}

	function getTypeIcon(type: string): string {
		switch (type) {
			case 'faq':
				return '?';
			case 'feature':
				return '★';
			case 'guide':
				return '📖';
			case 'changelog':
				return '📋';
			default:
				return '•';
		}
	}

	function getTypeLabel(type: string): string {
		switch (type) {
			case 'faq':
				return 'FAQ';
			case 'feature':
				return 'Feature';
			case 'guide':
				return 'Guide';
			case 'changelog':
				return 'Changelog';
			default:
				return type;
		}
	}
</script>

<div class="relative" data-help-search>
	<div class="relative">
		<input
			type="text"
			value={query}
			oninput={handleInput}
			onkeydown={handleKeyDown}
			onfocus={() => query.length >= 2 && (showResults = true)}
			onblur={handleBlur}
			placeholder={placeholder ?? translations.search.noResults}
			class="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
			aria-label={placeholder ?? translations.search.noResults}
			role="combobox"
			aria-expanded={showResults}
			aria-haspopup="listbox"
		/>
		<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
			{#if isSearching}
				<svg
					class="h-5 w-5 animate-spin text-gray-400"
					fill="none"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			{:else}
				<svg
					class="h-5 w-5 text-gray-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			{/if}
		</div>
	</div>

	{#if showResults}
		<div
			class="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
			role="listbox"
		>
			{#if results.length === 0}
				<div class="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
					{translations.search.noResults.replace('{query}', query)}
				</div>
			{:else}
				<ul class="max-h-96 overflow-auto py-2">
					{#each results as result, index (result.id)}
						<li role="option" aria-selected={selectedIndex === index}>
							<button
								type="button"
								class="flex w-full items-start gap-3 px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 {selectedIndex ===
								index
									? 'bg-primary-50 dark:bg-primary-900/20'
									: ''}"
								onmousedown={(e) => {
									e.preventDefault();
									selectResult(result);
								}}
							>
								<span
									class="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-gray-100 text-xs dark:bg-gray-700"
									aria-label={getTypeLabel(result.type)}
								>
									{getTypeIcon(result.type)}
								</span>
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<span class="truncate font-medium text-gray-900 dark:text-gray-100">
											{@html result.highlight ?? result.title}
										</span>
										<span
											class="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
										>
											{getTypeLabel(result.type)}
										</span>
									</div>
									<p class="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
										{result.excerpt}
									</p>
								</div>
							</button>
						</li>
					{/each}
				</ul>
				<div
					class="border-t border-gray-200 px-4 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400"
				>
					{translations.search.resultsCount.replace('{count}', String(results.length))}
				</div>
			{/if}
		</div>
	{/if}
</div>
