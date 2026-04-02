<script lang="ts">
	import { onMount } from 'svelte';
	import Text from '$lib/components/atoms/Text.svelte';

	interface Props {
		visible: boolean;
		onSubmit: (prompt: string) => void;
		onClose: () => void;
		placeholder?: string;
		manaCost?: number;
		isLoading?: boolean;
	}

	let {
		visible,
		onSubmit,
		onClose,
		placeholder = 'Ask a question about this memo...',
		manaCost,
		isLoading = false,
	}: Props = $props();

	let prompt = $state('');
	let inputRef: HTMLTextAreaElement;

	function handleSubmit() {
		if (prompt.trim() && !isLoading) {
			onSubmit(prompt.trim());
			prompt = '';
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		} else if (e.key === 'Escape') {
			onClose();
		}
	}

	// Auto-focus input when visible
	$effect(() => {
		if (visible && inputRef) {
			inputRef.focus();
		}
	});

	// Auto-resize textarea
	function handleInput() {
		if (inputRef) {
			inputRef.style.height = 'auto';
			inputRef.style.height = inputRef.scrollHeight + 'px';
		}
	}
</script>

{#if visible}
	<div class="sticky bottom-0 left-0 right-0 z-50 border-t border-theme bg-menu shadow-xl">
		<div class="mx-auto max-w-4xl p-4">
			<div class="flex flex-col gap-2">
				<!-- Header -->
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<Text variant="small" weight="medium">
							{#if isLoading}
								Antwort wird generiert...
							{:else}
								Frage stellen
							{/if}
						</Text>
					</div>

					<button
						onclick={onClose}
						class="rounded-lg p-1 text-theme transition-colors hover:bg-menu-hover"
						title="Schließen (Esc)"
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

				<!-- Input Area -->
				<div class="flex gap-2">
					<textarea
						bind:this={inputRef}
						bind:value={prompt}
						oninput={handleInput}
						onkeydown={handleKeyDown}
						{placeholder}
						disabled={isLoading}
						rows="1"
						class="flex-1 resize-none rounded-lg border border-theme bg-content px-4 py-3 text-theme focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
					/>

					<button
						onclick={handleSubmit}
						disabled={!prompt.trim() || isLoading}
						class="btn-primary self-end px-4 disabled:opacity-50"
					>
						{#if isLoading}
							<svg
								class="h-5 w-5 animate-spin"
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
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
								/>
							</svg>
						{/if}
					</button>
				</div>

				<!-- Footer Info -->
				<div class="flex items-center justify-between">
					<Text variant="muted"
						><kbd class="kbd">Enter</kbd> zum Senden • <kbd class="kbd">Shift+Enter</kbd> für neue Zeile</Text
					>
					{#if manaCost !== undefined}
						<Text variant="muted" class="flex items-center gap-1">
							<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
									clip-rule="evenodd"
								/>
							</svg>
							{manaCost} Mana pro Frage
						</Text>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.kbd {
		@apply rounded border border-theme bg-menu-hover px-1.5 py-0.5 font-mono;
	}
</style>
