<script lang="ts">
	import { goto } from '$app/navigation';

	// Syntax highlighting patterns for command keywords
	interface HighlightPattern {
		pattern: RegExp;
		className: string;
	}

	const HIGHLIGHT_PATTERNS: HighlightPattern[] = [
		// Priority keywords (Todo)
		{
			pattern: /(!{1,3}|!?dringend|!?wichtig|!?normal|!?später|!?späer)\b/gi,
			className: 'hl-priority',
		},
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

	export interface CommandBarItem {
		id: string;
		title: string;
		subtitle?: string;
		icon?: string;
		imageUrl?: string;
		isFavorite?: boolean;
	}

	export interface QuickAction {
		id: string;
		label: string;
		href?: string;
		icon: string;
		shortcut?: string;
		onclick?: () => void;
	}

	export interface CreatePreview {
		title: string;
		subtitle: string;
	}

	interface Props {
		open: boolean;
		onClose: () => void;
		onSearch: (query: string) => Promise<CommandBarItem[]>;
		onSelect: (item: CommandBarItem) => void;
		quickActions?: QuickAction[];
		placeholder?: string;
		emptyText?: string;
		searchingText?: string;
		// New: Task creation support
		onCreate?: (query: string) => Promise<void>;
		onParseCreate?: (query: string) => CreatePreview | null;
		createText?: string;
		createShortcut?: string;
	}

	let {
		open = $bindable(),
		onClose,
		onSearch,
		onSelect,
		quickActions = [],
		placeholder = 'Suchen...',
		emptyText = 'Keine Ergebnisse gefunden',
		searchingText = 'Suche...',
		onCreate,
		onParseCreate,
		createText = 'Als Eintrag erstellen',
		createShortcut = '⌘↵',
	}: Props = $props();

	let searchQuery = $state('');
	let results = $state<CommandBarItem[]>([]);
	let loading = $state(false);
	let creating = $state(false);
	let selectedIndex = $state(0);
	let searchTimeout: ReturnType<typeof setTimeout>;
	let inputElement: HTMLInputElement;

	// Computed create preview
	let createPreview = $derived(
		searchQuery.trim() && onParseCreate ? onParseCreate(searchQuery) : null
	);

	// Highlighted text for overlay
	let highlightedQuery = $derived(highlightText(searchQuery));

	// Check if create option is selected (it's always first when available)
	let isCreateSelected = $derived(selectedIndex === 0 && createPreview !== null);

	// Reset state when modal opens
	$effect(() => {
		if (open) {
			searchQuery = '';
			results = [];
			selectedIndex = 0;
			creating = false;
			setTimeout(() => inputElement?.focus(), 50);
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
			onClose();
		} catch (error) {
			console.error('Create error:', error);
		} finally {
			creating = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			onClose();
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
					onClose();
				} else if (action.onclick) {
					action.onclick();
					onClose();
				}
			}
			return;
		}
	}

	function selectItem(item: CommandBarItem) {
		onSelect(item);
		onClose();
	}

	function getInitials(item: CommandBarItem): string {
		const parts = item.title.split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return item.title.substring(0, 2).toUpperCase();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleQuickAction(action: QuickAction) {
		if (action.href) {
			goto(action.href);
		} else if (action.onclick) {
			action.onclick();
		}
		onClose();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="command-backdrop"
		role="dialog"
		aria-modal="true"
		aria-label="Suchen"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
	>
		<div class="command-modal">
			<!-- Search Input with Syntax Highlighting -->
			<div class="command-input-wrapper">
				<svg class="command-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
				<div class="input-highlight-container">
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
						class="command-input"
					/>
				</div>
				<kbd class="command-shortcut">ESC</kbd>
			</div>

			<!-- Results -->
			{#if searchQuery.trim()}
				<div class="command-results">
					<!-- Create option (always first when available) -->
					{#if createPreview && onCreate}
						<button
							type="button"
							class="command-result create-option"
							class:selected={selectedIndex === 0}
							onclick={handleCreate}
							onmouseenter={() => (selectedIndex = 0)}
							disabled={creating}
						>
							<div class="result-avatar create-avatar">
								{#if creating}
									<div class="loading-spinner-small"></div>
								{:else}
									<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
									<div class="result-details">
										<span>{createPreview.subtitle}</span>
									</div>
								{/if}
							</div>
							<kbd class="create-shortcut">{createShortcut}</kbd>
						</button>
					{/if}

					{#if loading}
						<div class="command-loading">
							<div class="loading-spinner"></div>
							<span>{searchingText}</span>
						</div>
					{:else if results.length === 0 && !createPreview}
						<div class="command-empty">
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
								class="command-result"
								class:selected={adjustedIndex === selectedIndex}
								onclick={() => selectItem(item)}
								onmouseenter={() => (selectedIndex = adjustedIndex)}
							>
								<div class="result-avatar">
									{#if item.imageUrl}
										<img
											src={item.imageUrl}
											alt={item.title}
											class="w-full h-full rounded-full object-cover"
										/>
									{:else}
										{getInitials(item)}
									{/if}
								</div>
								<div class="result-info">
									<div class="result-name">{item.title}</div>
									{#if item.subtitle}
										<div class="result-details">
											<span>{item.subtitle}</span>
										</div>
									{/if}
								</div>
								{#if item.isFavorite}
									<svg class="result-favorite" fill="currentColor" viewBox="0 0 24 24">
										<path
											d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
										/>
									</svg>
								{/if}
							</button>
						{/each}
					{/if}
				</div>
			{:else if quickActions.length > 0}
				<!-- Quick Actions when no search -->
				<div class="quick-actions-list">
					{#each quickActions as action, index (action.id)}
						<button
							type="button"
							class="quick-action"
							class:selected={index === selectedIndex}
							onclick={() => handleQuickAction(action)}
							onmouseenter={() => (selectedIndex = index)}
						>
							<svg class="quick-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								{#if action.icon === 'plus'}
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4v16m8-8H4"
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
								{:else if action.icon === 'upload'}
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
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
								{:else if action.icon === 'check'}
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
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
								{:else if action.icon === 'list'}
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 6h16M4 10h16M4 14h16M4 18h16"
									/>
								{/if}
							</svg>
							<span>{action.label}</span>
							{#if action.shortcut}
								<kbd>{action.shortcut}</kbd>
							{/if}
						</button>
					{/each}
				</div>
			{/if}

			<!-- Footer -->
			<div class="command-footer">
				<div class="footer-hints">
					<span><kbd>↑↓</kbd> Navigation</span>
					<span><kbd>↵</kbd> Öffnen</span>
					{#if onCreate}
						<span><kbd>{createShortcut}</kbd> Erstellen</span>
					{/if}
					<span><kbd>ESC</kbd> Schließen</span>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.command-backdrop {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 15vh;
		background: hsl(var(--color-background) / 0.8);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		animation: fadeIn 0.15s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.command-modal {
		width: 100%;
		max-width: 560px;
		margin: 0 1rem;
		background: hsl(var(--color-surface-elevated));
		border: 1px solid hsl(var(--color-border));
		border-radius: 12px;
		box-shadow:
			0 25px 50px -12px hsl(var(--color-background) / 0.5),
			0 0 0 1px hsl(var(--color-border) / 0.5);
		overflow: hidden;
		animation: slideIn 0.2s ease;
		color: hsl(var(--color-foreground));
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.command-input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.command-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
	}

	/* Input with syntax highlighting overlay */
	.input-highlight-container {
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
	}

	.command-input {
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
	}

	.command-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	/* Syntax highlighting colors */
	.input-highlight-backdrop :global(.hl-priority) {
		color: hsl(var(--color-warning, 38 92% 50%));
		font-weight: 600;
	}

	.input-highlight-backdrop :global(.hl-tag) {
		color: hsl(var(--color-primary));
		font-weight: 500;
	}

	.input-highlight-backdrop :global(.hl-reference) {
		color: hsl(var(--color-success));
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

	.command-shortcut {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-family: inherit;
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 4px;
		color: hsl(var(--color-muted-foreground));
	}

	.command-results {
		max-height: 320px;
		overflow-y: auto;
	}

	.command-loading,
	.command-empty {
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
		border-top-color: hsl(var(--color-primary));
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.loading-spinner-small {
		width: 1rem;
		height: 1rem;
		border: 2px solid hsl(var(--color-border));
		border-top-color: hsl(var(--color-success));
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Create option styles */
	.create-option {
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.create-option.selected,
	.create-option:hover {
		background: hsl(var(--color-success) / 0.1);
	}

	.create-avatar {
		background: hsl(var(--color-success));
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
		padding: 0.5rem 1.25rem 0.25rem;
		font-size: 0.6875rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}

	.command-result {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1.25rem;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background 0.1s ease;
		color: hsl(var(--color-foreground));
	}

	.command-result:hover,
	.command-result.selected {
		background: hsl(var(--color-surface-hover));
	}

	.result-avatar {
		width: 40px;
		height: 40px;
		min-width: 40px;
		border-radius: 9999px;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.875rem;
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

	.result-details {
		display: flex;
		gap: 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	.result-details span {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.result-favorite {
		width: 1rem;
		height: 1rem;
		color: hsl(var(--color-error));
		flex-shrink: 0;
	}

	.quick-actions-list {
		padding: 0.5rem;
	}

	.quick-action {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		color: hsl(var(--color-foreground));
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background 0.1s ease;
	}

	.quick-action:hover,
	.quick-action.selected {
		background: hsl(var(--color-surface-hover));
	}

	.quick-action-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: hsl(var(--color-muted-foreground));
	}

	.quick-action span {
		flex: 1;
		font-size: 0.9375rem;
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

	.command-footer {
		padding: 0.75rem 1.25rem;
		border-top: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
	}

	.footer-hints {
		display: flex;
		gap: 1rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.footer-hints kbd {
		padding: 0.125rem 0.25rem;
		font-family: inherit;
		background: hsl(var(--color-surface-elevated));
		border: 1px solid hsl(var(--color-border));
		border-radius: 3px;
		margin-right: 0.25rem;
	}

	@media (max-width: 640px) {
		.command-backdrop {
			padding-top: 5vh;
		}

		.footer-hints {
			flex-wrap: wrap;
			gap: 0.5rem;
		}
	}
</style>
