<script lang="ts">
	import { chatStore } from '$lib/stores/chat.svelte';
	import { comparisonStore } from '$lib/stores/comparison.svelte';

	let input = $state('');
	let textareaEl: HTMLTextAreaElement | undefined = $state();

	const isComparisonReady = $derived(
		comparisonStore.comparisonMode && comparisonStore.selectedModels.length >= 2
	);

	function handleSubmit() {
		if (!input.trim() || chatStore.isStreaming) return;

		if (isComparisonReady) {
			chatStore.sendComparisonMessage(input);
		} else {
			chatStore.sendMessage(input);
		}

		input = '';
		if (textareaEl) {
			textareaEl.style.height = 'auto';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	}

	function autoResize() {
		if (textareaEl) {
			textareaEl.style.height = 'auto';
			textareaEl.style.height = Math.min(textareaEl.scrollHeight, 200) + 'px';
		}
	}
</script>

<div class="border-t p-4" style="border-color: var(--color-border);">
	<div
		class="flex items-end gap-3 rounded-xl border p-2"
		style="background-color: var(--color-surface); border-color: var(--color-border);"
	>
		<textarea
			bind:this={textareaEl}
			bind:value={input}
			onkeydown={handleKeydown}
			oninput={autoResize}
			placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
			disabled={chatStore.isStreaming}
			rows="1"
			class="max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-gray-500 disabled:opacity-50"
		></textarea>

		{#if chatStore.isStreaming}
			<button
				onclick={() => chatStore.stopStreaming()}
				aria-label="Stop streaming"
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors"
				style="background-color: var(--color-error);"
			>
				<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
					<rect x="6" y="6" width="12" height="12" rx="1" />
				</svg>
			</button>
		{:else}
			<button
				onclick={handleSubmit}
				disabled={!input.trim()}
				aria-label="Send message"
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
				style="background-color: var(--color-primary);"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
					/>
				</svg>
			</button>
		{/if}
	</div>
</div>
