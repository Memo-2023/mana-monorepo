<script lang="ts">
	interface Props {
		visible: boolean;
		query: string;
		results: Array<{ id: string; text: string; context: string; type: 'transcript' | 'memory' }>;
		currentIndex: number;
		onClose: () => void;
		onSearch: (query: string) => void;
		onNext: () => void;
		onPrevious: () => void;
	}

	let { visible, query, results, currentIndex, onClose, onSearch, onNext, onPrevious }: Props =
		$props();

	let inputRef: HTMLInputElement;

	// Auto-focus input when overlay becomes visible
	$effect(() => {
		if (visible && inputRef) {
			inputRef.focus();
		}
	});

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		} else if (e.key === 'Enter') {
			if (e.shiftKey) {
				onPrevious();
			} else {
				onNext();
			}
		}
	}
</script>

{#if visible}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
		onclick={onClose}
	></div>

	<!-- Overlay Content -->
	<div class="fixed top-0 left-0 right-0 z-50 mx-auto max-w-2xl p-4">
		<div class="rounded-lg border border-theme bg-menu shadow-2xl">
			<!-- Search Bar -->
			<div class="flex items-center gap-3 border-b border-theme p-4">
				<!-- Search Icon -->
				<svg
					class="h-5 w-5 flex-shrink-0 text-theme-secondary"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>

				<!-- Input -->
				<input
					bind:this={inputRef}
					type="text"
					value={query}
					oninput={(e) => onSearch((e.target as HTMLInputElement).value)}
					onkeydown={handleKeyDown}
					placeholder="Search in memo..."
					class="flex-1 bg-transparent text-theme focus:outline-none"
				/>

				<!-- Navigation & Close -->
				<div class="flex items-center gap-2">
					{#if results.length > 0}
						<!-- Results Counter -->
						<span class="text-sm text-theme-secondary">
							{currentIndex + 1} / {results.length}
						</span>

						<!-- Previous Button -->
						<button
							onclick={onPrevious}
							disabled={results.length === 0}
							class="rounded-lg p-1.5 transition-colors hover:bg-menu-hover disabled:opacity-50"
							title="Previous (Shift+Enter)"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 15l7-7 7 7"
								/>
							</svg>
						</button>

						<!-- Next Button -->
						<button
							onclick={onNext}
							disabled={results.length === 0}
							class="rounded-lg p-1.5 transition-colors hover:bg-menu-hover disabled:opacity-50"
							title="Next (Enter)"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</button>

						<!-- Divider -->
						<div class="h-6 w-px bg-theme"></div>
					{/if}

					<!-- Close Button -->
					<button
						onclick={onClose}
						class="rounded-lg p-1.5 transition-colors hover:bg-menu-hover"
						title="Close (Esc)"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			</div>

			<!-- Results Preview (optional) -->
			{#if query && results.length > 0}
				<div class="max-h-64 overflow-y-auto border-b border-theme">
					{#each results.slice(0, 5) as result, index (result.id)}
						<button
							onclick={() => {
								// Scroll to this result
								// You can implement navigation logic here
							}}
							class="w-full border-b border-theme-light p-3 text-left transition-colors hover:bg-menu-hover {index ===
							currentIndex
								? 'bg-menu'
								: ''}"
						>
							<div class="flex items-start gap-2">
								<!-- Type Badge -->
								<span
									class="rounded px-1.5 py-0.5 text-xs font-medium {result.type === 'transcript'
										? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
										: 'bg-purple-500/20 text-purple-600 dark:text-purple-400'}"
								>
									{result.type}
								</span>

								<!-- Context -->
								<p class="flex-1 text-sm text-theme-secondary">
									{result.context}
								</p>
							</div>
						</button>
					{/each}

					{#if results.length > 5}
						<div class="p-2 text-center text-xs text-theme-secondary">
							+ {results.length - 5} more results
						</div>
					{/if}
				</div>
			{:else if query && results.length === 0}
				<div class="p-8 text-center">
					<svg
						class="mx-auto mb-3 h-12 w-12 text-theme-secondary"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<p class="text-theme-secondary">No results found for "{query}"</p>
				</div>
			{/if}

			<!-- Help Text -->
			<div class="flex items-center justify-between p-3 text-xs text-theme-muted">
				<span>Press <kbd class="kbd">Enter</kbd> to navigate</span>
				<span>Press <kbd class="kbd">Esc</kbd> to close</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.kbd {
		border-radius: 0.25rem;
		border-width: 1px;
		padding: 0.125rem 0.375rem;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
			'Courier New', monospace;
		font-size: 0.75rem;
		line-height: 1rem;
		border-color: var(--color-border);
		background-color: var(--color-menu-bg-hover);
	}
</style>
