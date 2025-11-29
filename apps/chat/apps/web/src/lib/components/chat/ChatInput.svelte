<script lang="ts">
	import { PaperPlaneTilt } from '@manacore/shared-icons';

	interface Props {
		onSend: (message: string) => void;
		disabled?: boolean;
		placeholder?: string;
	}

	let { onSend, disabled = false, placeholder = 'Nachricht eingeben...' }: Props = $props();

	let inputValue = $state('');
	let textareaEl: HTMLTextAreaElement | undefined = $state();

	function handleSubmit() {
		const trimmed = inputValue.trim();
		if (trimmed && !disabled) {
			onSend(trimmed);
			inputValue = '';
			// Reset textarea height
			if (textareaEl) {
				textareaEl.style.height = 'auto';
			}
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	}

	function handleInput() {
		// Auto-resize textarea
		if (textareaEl) {
			textareaEl.style.height = 'auto';
			textareaEl.style.height = Math.min(textareaEl.scrollHeight, 200) + 'px';
		}
	}
</script>

<div class="border-t border-border bg-surface p-4">
	<div class="flex items-end gap-3 max-w-4xl mx-auto">
		<div class="flex-1 relative">
			<textarea
				bind:this={textareaEl}
				bind:value={inputValue}
				onkeydown={handleKeyDown}
				oninput={handleInput}
				{placeholder}
				{disabled}
				rows="1"
				class="w-full resize-none rounded-xl border border-border
               bg-muted text-foreground
               px-4 py-3 text-sm
               focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
               disabled:opacity-50 disabled:cursor-not-allowed
               placeholder:text-muted-foreground"
			></textarea>
		</div>
		<button
			onclick={handleSubmit}
			disabled={disabled || !inputValue.trim()}
			aria-label="Nachricht senden"
			class="flex-shrink-0 p-3 rounded-xl bg-primary text-primary-foreground
             hover:bg-primary/90 active:bg-primary/80
             disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary
             transition-colors"
		>
			<PaperPlaneTilt size={20} weight="bold" />
		</button>
	</div>
	<p class="text-xs text-muted-foreground text-center mt-2">
		Enter zum Senden, Shift+Enter für neue Zeile
	</p>
</div>
