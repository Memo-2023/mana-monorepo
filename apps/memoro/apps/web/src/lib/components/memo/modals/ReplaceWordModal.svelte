<script lang="ts">
	import { Modal } from '@manacore/shared-ui';

	interface Props {
		visible: boolean;
		transcript: string;
		onClose: () => void;
		onReplace: (searchTerm: string, replaceTerm: string, replaceAll: boolean) => void;
		isReplacing?: boolean;
	}

	let { visible, transcript, onClose, onReplace, isReplacing = false }: Props = $props();

	let searchTerm = $state('');
	let replaceTerm = $state('');
	let caseSensitive = $state(false);
	let matchCount = $state(0);
	let previewMatches = $state<{ context: string; index: number }[]>([]);

	// Search for matches whenever search term changes
	$effect(() => {
		if (searchTerm.trim() && transcript) {
			findMatches();
		} else {
			matchCount = 0;
			previewMatches = [];
		}
	});

	function findMatches() {
		const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();
		const text = caseSensitive ? transcript : transcript.toLowerCase();

		const matches: { context: string; index: number }[] = [];
		let index = text.indexOf(term);

		while (index !== -1) {
			const start = Math.max(0, index - 50);
			const end = Math.min(transcript.length, index + term.length + 50);
			const context = transcript.substring(start, end);

			matches.push({
				context: (start > 0 ? '...' : '') + context + (end < transcript.length ? '...' : ''),
				index,
			});

			index = text.indexOf(term, index + 1);
		}

		matchCount = matches.length;
		previewMatches = matches.slice(0, 5); // Show first 5 matches
	}

	function handleReplace(replaceAll: boolean) {
		if (searchTerm.trim() && replaceTerm.trim()) {
			onReplace(searchTerm, replaceTerm, replaceAll);
		}
	}

	function handleReset() {
		searchTerm = '';
		replaceTerm = '';
		caseSensitive = false;
		matchCount = 0;
		previewMatches = [];
	}

	// Reset when modal closes
	$effect(() => {
		if (!visible) {
			handleReset();
		}
	});
</script>

<Modal {visible} {onClose} title="Find and Replace" maxWidth="2xl">
	{#snippet children()}
		<div class="space-y-4">
			<!-- Description -->
			<p class="text-sm text-theme-secondary">
				Search and replace words or phrases in your transcript. Use this to fix transcription errors
				or update terminology.
			</p>

			<!-- Search Input -->
			<div class="space-y-2">
				<label class="text-sm font-medium text-theme-secondary">Find</label>
				<input
					type="text"
					bind:value={searchTerm}
					placeholder="Enter word or phrase to find..."
					disabled={isReplacing}
					class="w-full rounded-lg border border-theme bg-content px-4 py-2.5 text-theme placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
				/>
			</div>

			<!-- Replace Input -->
			<div class="space-y-2">
				<label class="text-sm font-medium text-theme-secondary">Replace with</label>
				<input
					type="text"
					bind:value={replaceTerm}
					placeholder="Enter replacement word or phrase..."
					disabled={isReplacing}
					class="w-full rounded-lg border border-theme bg-content px-4 py-2.5 text-theme placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
				/>
			</div>

			<!-- Options -->
			<div class="flex items-center gap-2">
				<input
					type="checkbox"
					id="caseSensitive"
					bind:checked={caseSensitive}
					disabled={isReplacing}
					class="h-4 w-4 rounded border-theme text-primary focus:ring-2 focus:ring-primary disabled:opacity-50"
				/>
				<label for="caseSensitive" class="text-sm text-theme-secondary cursor-pointer">
					Case sensitive
				</label>
			</div>

			<!-- Match Count -->
			{#if searchTerm.trim()}
				<div class="rounded-lg bg-content border border-theme p-3">
					<div class="flex items-center gap-2">
						<svg
							class="h-5 w-5 text-theme-secondary"
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
						<span class="text-sm text-theme">
							{#if matchCount === 0}
								No matches found
							{:else if matchCount === 1}
								1 match found
							{:else}
								{matchCount} matches found
							{/if}
						</span>
					</div>
				</div>
			{/if}

			<!-- Preview Matches -->
			{#if previewMatches.length > 0}
				<div class="space-y-2">
					<h4 class="text-sm font-medium text-theme-secondary">Preview (first 5 matches)</h4>
					<div class="max-h-64 space-y-2 overflow-y-auto">
						{#each previewMatches as match (match.index)}
							<div class="rounded-lg bg-content border border-theme p-3">
								<p class="text-sm text-theme-secondary">
									{match.context}
								</p>
							</div>
						{/each}

						{#if matchCount > 5}
							<p class="text-xs text-center text-theme-muted">
								+ {matchCount - 5} more matches
							</p>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Warning -->
			{#if matchCount > 0}
				<div class="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3">
					<div class="flex items-start gap-2">
						<svg
							class="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
						<div class="flex-1">
							<p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
								Replacement cannot be undone
							</p>
							<p class="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
								Make sure to review the matches before replacing. This action will permanently
								modify your transcript.
							</p>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet footer()}
		<div class="flex justify-between">
			<button onclick={handleReset} disabled={isReplacing} class="btn-secondary">Reset</button>
			<div class="flex gap-3">
				<button onclick={onClose} disabled={isReplacing} class="btn-secondary">Cancel</button>
				<button
					onclick={() => handleReplace(false)}
					disabled={matchCount === 0 || !replaceTerm.trim() || isReplacing}
					class="btn-secondary disabled:opacity-50"
				>
					{#if isReplacing}
						<svg
							class="h-4 w-4 animate-spin"
							fill="none"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							/>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
					{:else}
						<span>Replace First</span>
					{/if}
				</button>
				<button
					onclick={() => handleReplace(true)}
					disabled={matchCount === 0 || !replaceTerm.trim() || isReplacing}
					class="btn-primary disabled:opacity-50"
				>
					{#if isReplacing}
						<svg
							class="h-4 w-4 animate-spin"
							fill="none"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							/>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
					{:else}
						<span>Replace All ({matchCount})</span>
					{/if}
				</button>
			</div>
		</div>
	{/snippet}
</Modal>
