<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import type { QuickInputItem, QuickAction, CreatePreview } from './types';

	// Syntax highlighting patterns for command keywords
	interface HighlightPattern {
		pattern: RegExp;
		className: string;
	}

	const HIGHLIGHT_PATTERNS: HighlightPattern[] = [
		// Priority keywords (Todo) - with specific colors per level
		{ pattern: /(!{3,}|!?dringend)\b/gi, className: 'hl-priority-urgent' },
		{ pattern: /(!{2}|!?wichtig)\b/gi, className: 'hl-priority-high' },
		{ pattern: /!?normal\b/gi, className: 'hl-priority-medium' },
		{ pattern: /!?sp[aä]ter\b/gi, className: 'hl-priority-low' },
		// Tags
		{ pattern: /#\w+/g, className: 'hl-tag' },
		// Projects/Calendars/Companies (@reference)
		{ pattern: /@\w+/g, className: 'hl-reference' },
		// Date keywords
		{
			pattern:
				/\b(heute|morgen|übermorgen|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|nächsten?\s+\w+|in\s+\d+\s+tagen?)\b/gi,
			className: 'hl-date',
		},
		// Time patterns
		{ pattern: /\b(\d{1,2}:\d{2}|um\s+\d{1,2}(\s*uhr)?|\d{1,2}\s*uhr)\b/gi, className: 'hl-time' },
	];

	function highlightText(text: string): string {
		if (!text) return '';

		let result = text;
		// Escape HTML first
		result = result.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

		// Apply highlights (process in order, avoiding double-highlighting)
		for (const { pattern, className } of HIGHLIGHT_PATTERNS) {
			result = result.replace(pattern, (match) => `<span class="${className}">${match}</span>`);
		}

		return result;
	}

	interface Props {
		onSearch: (query: string) => Promise<QuickInputItem[]>;
		onSelect: (item: QuickInputItem) => void;
		onParseCreate?: (query: string) => CreatePreview | null;
		onCreate?: (query: string) => Promise<void>;
		quickActions?: QuickAction[];
		placeholder?: string;
		emptyText?: string;
		searchingText?: string;
		createText?: string;
		appIcon?: string;
		primaryColor?: string;
		autoFocus?: boolean;
	}

	let {
		onSearch,
		onSelect,
		onParseCreate,
		onCreate,
		quickActions = [],
		placeholder = 'Suchen oder erstellen...',
		emptyText = 'Keine Ergebnisse gefunden',
		searchingText = 'Suche...',
		createText = 'Erstellen',
		appIcon = 'search',
		primaryColor = '#8b5cf6',
		autoFocus = true,
	}: Props = $props();

	let searchQuery = $state('');
	let results = $state<QuickInputItem[]>([]);
	let loading = $state(false);
	let creating = $state(false);
	let selectedIndex = $state(0);
	let showPanel = $state(false);
	let isFocused = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout>;
	let inputElement = $state<HTMLInputElement | null>(null);

	// Computed create preview
	let createPreview = $derived(
		searchQuery.trim() && onParseCreate ? onParseCreate(searchQuery) : null
	);

	// Highlighted text for overlay
	let highlightedQuery = $derived(highlightText(searchQuery));

	// Check if create option is selected (it's always first when available)
	let isCreateSelected = $derived(selectedIndex === 0 && createPreview !== null);

	// Show panel when focused or has results
	$effect(() => {
		showPanel =
			isFocused && (searchQuery.trim().length > 0 || quickActions.length > 0 || results.length > 0);
	});

	// Auto-focus on mount
	onMount(() => {
		if (autoFocus) {
			setTimeout(() => inputElement?.focus(), 100);
		}
	});

	async function handleSearch() {
		clearTimeout(searchTimeout);

		if (!searchQuery.trim()) {
			results = [];
			loading = false;
			return;
		}

		loading = true;

		searchTimeout = setTimeout(async () => {
			try {
				results = await onSearch(searchQuery);
				selectedIndex = 0;
			} catch (e) {
				console.error('Search error:', e);
				results = [];
			} finally {
				loading = false;
			}
		}, 150);
	}

	async function handleCreate() {
		if (!onCreate || !searchQuery.trim() || creating) return;

		creating = true;
		try {
			await onCreate(searchQuery);
			searchQuery = '';
			results = [];
			selectedIndex = 0;
			// Keep focus for rapid entry
			inputElement?.focus();
		} catch (error) {
			console.error('Create error:', error);
		} finally {
			creating = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			searchQuery = '';
			results = [];
			inputElement?.blur();
			return;
		}

		// Cmd/Ctrl+Enter to create directly
		if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			if (onCreate && searchQuery.trim()) {
				handleCreate();
			}
			return;
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			// Calculate max index including create option
			const hasCreate = createPreview !== null;
			const maxIndex = searchQuery.trim()
				? (hasCreate ? 1 : 0) + results.length - 1
				: quickActions.length - 1;
			selectedIndex = Math.min(selectedIndex + 1, Math.max(0, maxIndex));
			return;
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
			return;
		}

		if (event.key === 'Enter') {
			event.preventDefault();
			if (searchQuery.trim()) {
				// If create option is selected
				if (isCreateSelected && onCreate) {
					handleCreate();
				} else if (results.length > 0) {
					// Adjust index for results (subtract 1 if create option exists)
					const resultIndex = createPreview !== null ? selectedIndex - 1 : selectedIndex;
					if (resultIndex >= 0 && resultIndex < results.length) {
						selectItem(results[resultIndex]);
					}
				}
			} else if (!searchQuery.trim() && quickActions.length > 0) {
				const action = quickActions[selectedIndex];
				if (action.href) {
					goto(action.href);
					inputElement?.blur();
				} else if (action.onclick) {
					action.onclick();
					inputElement?.blur();
				}
			}
			return;
		}
	}

	function selectItem(item: QuickInputItem) {
		onSelect(item);
		searchQuery = '';
		results = [];
		inputElement?.blur();
	}

	function getInitials(item: QuickInputItem): string {
		const parts = item.title.split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return item.title.substring(0, 2).toUpperCase();
	}

	function handleQuickAction(action: QuickAction) {
		if (action.href) {
			goto(action.href);
		} else if (action.onclick) {
			action.onclick();
		}
		inputElement?.blur();
	}

	function handleFocus() {
		isFocused = true;
	}

	function handleBlur(event: FocusEvent) {
		// Check if the new focus target is within our component
		const relatedTarget = event.relatedTarget as HTMLElement | null;
		const container = (event.currentTarget as HTMLElement)?.closest('.quick-input-bar');
		if (container && relatedTarget && container.contains(relatedTarget)) {
			return; // Don't close if clicking within the component
		}

		// Delay blur to allow click events to fire
		setTimeout(() => {
			isFocused = false;
		}, 150);
	}
</script>

<div class="quick-input-bar" style="--primary-color: {primaryColor}">
	<!-- Results Panel (above input) -->
	{#if showPanel}
		<div class="results-panel" transition:slide={{ duration: 150 }}>
			{#if !searchQuery.trim() && quickActions.length > 0}
				<!-- Quick Actions when no search -->
				<div class="quick-actions-grid">
					{#each quickActions as action, index (action.id)}
						<button
							type="button"
							class="quick-action"
							class:selected={index === selectedIndex}
							onclick={() => handleQuickAction(action)}
							onmouseenter={() => (selectedIndex = index)}
						>
							<div class="quick-action-icon">
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									{#if action.icon === 'plus'}
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 4v16m8-8H4"
										/>
									{:else if action.icon === 'columns' || action.icon === 'kanban'}
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
										/>
									{:else if action.icon === 'chart' || action.icon === 'stats'}
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
										/>
									{:else if action.icon === 'settings'}
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
									{:else if action.icon === 'calendar'}
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									{:else if action.icon === 'clock'}
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									{:else if action.icon === 'users'}
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
										/>
									{:else if action.icon === 'list'}
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 6h16M4 10h16M4 14h16M4 18h16"
										/>
									{:else if action.icon === 'check'}
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									{:else if action.icon === 'heart'}
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
										/>
									{:else if action.icon === 'tag'}
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
										/>
									{:else}
										<!-- Default search icon -->
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
										/>
									{/if}
								</svg>
							</div>
							<span class="quick-action-label">{action.label}</span>
							{#if action.shortcut}
								<kbd>{action.shortcut}</kbd>
							{/if}
						</button>
					{/each}
				</div>
			{:else if searchQuery.trim()}
				<!-- Create option (always first when available) -->
				{#if createPreview && onCreate}
					<button
						type="button"
						class="result-item create-option"
						class:selected={selectedIndex === 0}
						onclick={handleCreate}
						onmouseenter={() => (selectedIndex = 0)}
						disabled={creating}
					>
						<div class="result-avatar create-avatar">
							{#if creating}
								<div class="loading-spinner-small"></div>
							{:else}
								<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4v16m8-8H4"
									/>
								</svg>
							{/if}
						</div>
						<div class="result-info">
							<div class="result-name">{createPreview.title}</div>
							{#if createPreview.subtitle}
								<div class="result-subtitle">{createPreview.subtitle}</div>
							{/if}
						</div>
						<kbd class="create-shortcut">↵</kbd>
					</button>
				{/if}

				{#if loading}
					<div class="loading-state">
						<div class="loading-spinner"></div>
						<span>{searchingText}</span>
					</div>
				{:else if results.length === 0 && !createPreview}
					<div class="empty-state">
						<span>{emptyText}</span>
					</div>
				{:else if results.length > 0}
					<div class="results-divider">
						<span>Suchergebnisse</span>
					</div>
					{#each results as item, index (item.id)}
						{@const adjustedIndex = createPreview ? index + 1 : index}
						<button
							type="button"
							class="result-item"
							class:selected={adjustedIndex === selectedIndex}
							onclick={() => selectItem(item)}
							onmouseenter={() => (selectedIndex = adjustedIndex)}
						>
							<div class="result-avatar">
								{#if item.imageUrl}
									<img src={item.imageUrl} alt={item.title} />
								{:else}
									{getInitials(item)}
								{/if}
							</div>
							<div class="result-info">
								<div class="result-name">{item.title}</div>
								{#if item.subtitle}
									<div class="result-subtitle">{item.subtitle}</div>
								{/if}
							</div>
							{#if item.isFavorite}
								<svg class="favorite-icon" fill="currentColor" viewBox="0 0 24 24">
									<path
										d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
									/>
								</svg>
							{/if}
						</button>
					{/each}
				{/if}
			{/if}
		</div>
	{/if}

	<!-- Input Bar (always visible) -->
	<div class="input-container">
		<div class="app-icon">
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				{#if appIcon === 'check-square' || appIcon === 'todo'}
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
					/>
				{:else if appIcon === 'calendar'}
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
					/>
				{:else if appIcon === 'users' || appIcon === 'contacts'}
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
					/>
				{:else}
					<!-- Default search icon -->
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				{/if}
			</svg>
		</div>

		<div class="input-wrapper">
			<!-- Highlight backdrop (shows colored keywords) -->
			<div class="input-highlight-backdrop" aria-hidden="true">
				{@html highlightedQuery}&nbsp;
			</div>
			<!-- Actual input (transparent text, visible caret) -->
			<input
				bind:this={inputElement}
				type="text"
				{placeholder}
				bind:value={searchQuery}
				oninput={handleSearch}
				onkeydown={handleKeydown}
				onfocus={handleFocus}
				onblur={handleBlur}
				class="input-field"
			/>
		</div>

		{#if searchQuery.trim() && onCreate}
			<button
				type="button"
				class="submit-btn"
				onclick={handleCreate}
				disabled={creating}
				title={createText}
			>
				{#if creating}
					<div class="loading-spinner-small"></div>
				{:else}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M14 5l7 7m0 0l-7 7m7-7H3"
						/>
					</svg>
				{/if}
			</button>
		{/if}
	</div>
</div>

<style>
	.quick-input-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 90;
		padding: 0.75rem 1rem;
		padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
		pointer-events: none;
	}

	.input-container,
	.results-panel,
	.submit-btn,
	.result-item,
	.quick-action {
		pointer-events: auto;
	}

	.input-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: hsl(var(--color-surface) / 0.85);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid hsl(var(--color-border) / 0.5);
		border-radius: 9999px;
		max-width: 600px;
		margin: 0 auto;
		box-shadow:
			0 4px 20px hsl(var(--color-background) / 0.3),
			0 0 0 1px hsl(var(--color-border) / 0.2);
		transition: all 0.2s ease;
	}

	.input-container:focus-within {
		border-color: var(--primary-color);
		box-shadow:
			0 4px 20px hsl(var(--color-background) / 0.3),
			0 0 0 2px color-mix(in srgb, var(--primary-color) 30%, transparent);
	}

	.app-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
	}

	.app-icon svg {
		width: 100%;
		height: 100%;
	}

	.input-wrapper {
		position: relative;
		flex: 1;
		min-width: 0;
	}

	.input-highlight-backdrop {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		font-size: 1rem;
		font-family: inherit;
		white-space: pre;
		pointer-events: none;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		line-height: 1.5;
	}

	.input-field {
		position: relative;
		width: 100%;
		border: none;
		background: transparent;
		font-size: 1rem;
		font-family: inherit;
		color: transparent;
		caret-color: hsl(var(--color-foreground));
		outline: none;
		z-index: 1;
		line-height: 1.5;
	}

	.input-field::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	/* Syntax highlighting colors */
	.input-highlight-backdrop :global(.hl-priority-urgent) {
		color: #ef4444;
		font-weight: 600;
	}

	.input-highlight-backdrop :global(.hl-priority-high) {
		color: #f97316;
		font-weight: 600;
	}

	.input-highlight-backdrop :global(.hl-priority-medium) {
		color: #eab308;
		font-weight: 600;
	}

	.input-highlight-backdrop :global(.hl-priority-low) {
		color: #22c55e;
		font-weight: 600;
	}

	.input-highlight-backdrop :global(.hl-tag) {
		color: var(--primary-color);
		font-weight: 500;
	}

	.input-highlight-backdrop :global(.hl-reference) {
		color: hsl(var(--color-success, 142 71% 45%));
		font-weight: 500;
	}

	.input-highlight-backdrop :global(.hl-date) {
		color: hsl(262 83% 58%);
		font-weight: 500;
	}

	.input-highlight-backdrop :global(.hl-time) {
		color: hsl(262 83% 58%);
		font-weight: 500;
	}

	.submit-btn {
		width: 2rem;
		height: 2rem;
		border-radius: 9999px;
		background: var(--primary-color);
		color: white;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: all 0.15s ease;
	}

	.submit-btn:hover {
		transform: scale(1.05);
		filter: brightness(1.1);
	}

	.submit-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	.submit-btn svg {
		width: 1rem;
		height: 1rem;
	}

	/* Results Panel */
	.results-panel {
		position: absolute;
		bottom: 100%;
		left: 1rem;
		right: 1rem;
		max-width: 600px;
		margin: 0 auto 0.5rem;
		max-height: 320px;
		overflow-y: auto;
		background: hsl(var(--color-surface) / 0.95);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-radius: 1rem;
		border: 1px solid hsl(var(--color-border));
		box-shadow:
			0 -4px 20px hsl(var(--color-background) / 0.3),
			0 0 0 1px hsl(var(--color-border) / 0.2);
	}

	/* Quick Actions Grid */
	.quick-actions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 0.5rem;
		padding: 0.75rem;
	}

	.quick-action {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 0.75rem;
		border-radius: 0.75rem;
		color: hsl(var(--color-foreground));
		background: transparent;
		border: 1px solid transparent;
		cursor: pointer;
		text-align: center;
		transition: all 0.15s ease;
	}

	.quick-action:hover,
	.quick-action.selected {
		background: hsl(var(--color-surface-hover));
		border-color: hsl(var(--color-border));
	}

	.quick-action-icon {
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.5rem;
		background: color-mix(in srgb, var(--primary-color) 15%, transparent);
		color: var(--primary-color);
	}

	.quick-action-icon svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.quick-action-label {
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.quick-action kbd {
		padding: 0.125rem 0.375rem;
		font-size: 0.6875rem;
		font-family: inherit;
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 4px;
		color: hsl(var(--color-muted-foreground));
	}

	/* Result Items */
	.result-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background 0.1s ease;
		color: hsl(var(--color-foreground));
	}

	.result-item:hover,
	.result-item.selected {
		background: hsl(var(--color-surface-hover));
	}

	.result-item.create-option {
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.result-item.create-option:hover,
	.result-item.create-option.selected {
		background: hsl(var(--color-success) / 0.1);
	}

	.result-avatar {
		width: 36px;
		height: 36px;
		min-width: 36px;
		border-radius: 9999px;
		background: var(--primary-color);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.8125rem;
	}

	.result-avatar img {
		width: 100%;
		height: 100%;
		border-radius: 9999px;
		object-fit: cover;
	}

	.result-avatar.create-avatar {
		background: hsl(var(--color-success));
	}

	.result-avatar.create-avatar svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.result-info {
		flex: 1;
		min-width: 0;
	}

	.result-name {
		font-weight: 500;
		color: hsl(var(--color-foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.result-subtitle {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.favorite-icon {
		width: 1rem;
		height: 1rem;
		color: hsl(var(--color-error, 0 84% 60%));
		flex-shrink: 0;
	}

	.create-shortcut {
		padding: 0.25rem 0.5rem;
		font-size: 0.6875rem;
		font-family: inherit;
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 4px;
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
	}

	.results-divider {
		padding: 0.5rem 1rem 0.25rem;
		font-size: 0.6875rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}

	/* Loading & Empty States */
	.loading-state,
	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 2rem;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
	}

	.loading-spinner {
		width: 1.25rem;
		height: 1.25rem;
		border: 2px solid hsl(var(--color-border));
		border-top-color: var(--primary-color);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.loading-spinner-small {
		width: 1rem;
		height: 1rem;
		border: 2px solid hsl(var(--color-border));
		border-top-color: currentColor;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Mobile: Above PillNav */
	@media (max-width: 768px) {
		.quick-input-bar {
			bottom: 70px;
			padding-bottom: 0.75rem;
		}

		.quick-actions-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
