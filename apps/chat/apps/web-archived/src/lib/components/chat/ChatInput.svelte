<script lang="ts">
	import { PaperPlaneTilt, FileText, CaretDown } from '@manacore/shared-icons';
	import type { AIModel } from '@chat/types';

	interface Props {
		onSend: (message: string) => void;
		disabled?: boolean;
		placeholder?: string;
		models?: AIModel[];
		selectedModelId?: string;
		onModelSelect?: (modelId: string) => void;
		documentMode?: boolean;
		onDocumentModeToggle?: () => void;
	}

	let {
		onSend,
		disabled = false,
		placeholder = 'Nachricht eingeben...',
		models = [],
		selectedModelId = '',
		onModelSelect,
		documentMode = false,
		onDocumentModeToggle,
	}: Props = $props();

	let inputValue = $state('');
	let textareaEl: HTMLTextAreaElement | undefined = $state();

	// Focus input on mount
	let hasFocused = false;
	$effect(() => {
		if (textareaEl && !disabled && !hasFocused) {
			textareaEl.focus();
			hasFocused = true;
		}
	});

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

<div class="relative">
	<div
		class="flex flex-col gap-2 rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-black/10 dark:border-white/20 p-2 shadow-lg"
	>
		<!-- Input Row -->
		<div class="flex items-end gap-3">
			<div class="flex-1 relative">
				<textarea
					bind:this={textareaEl}
					bind:value={inputValue}
					onkeydown={handleKeyDown}
					oninput={handleInput}
					{placeholder}
					{disabled}
					rows="1"
					class="w-full resize-none rounded-xl border-0 bg-transparent
	               px-4 py-3 text-sm text-foreground
	               focus:outline-none focus:ring-0
	               disabled:opacity-50 disabled:cursor-not-allowed
	               placeholder:text-muted-foreground"
				></textarea>
			</div>
			<button
				onclick={handleSubmit}
				disabled={disabled || !inputValue.trim()}
				aria-label="Nachricht senden"
				class="flex-shrink-0 p-3 rounded-xl bg-white/90 dark:bg-white/20 backdrop-blur-sm
	             border border-black/10 dark:border-white/20 text-primary
	             hover:bg-white dark:hover:bg-white/30 hover:shadow-lg
	             disabled:opacity-50 disabled:cursor-not-allowed
	             transition-all duration-200 shadow-md"
			>
				<PaperPlaneTilt size={20} weight="bold" />
			</button>
		</div>

		<!-- Options Row -->
		{#if models.length > 0 || onDocumentModeToggle}
			<div class="flex items-center gap-2 px-2">
				<!-- Model Selector -->
				{#if models.length > 0 && onModelSelect}
					<div class="relative">
						<select
							value={selectedModelId}
							onchange={(e) => onModelSelect?.((e.target as HTMLSelectElement).value)}
							{disabled}
							class="appearance-none bg-white/50 dark:bg-white/10 text-foreground text-xs font-medium rounded-lg pl-3 pr-7 py-1.5 border border-black/5 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50 cursor-pointer transition-colors hover:bg-white/80 dark:hover:bg-white/20"
						>
							{#each models as model (model.id)}
								<option value={model.id}>{model.name}</option>
							{/each}
						</select>
						<div class="absolute inset-y-0 right-1.5 flex items-center pointer-events-none">
							<CaretDown size={12} weight="bold" class="text-muted-foreground" />
						</div>
					</div>
				{/if}

				<!-- Spacer -->
				<div class="flex-1"></div>

				<!-- Document Mode Toggle -->
				{#if onDocumentModeToggle}
					<button
						onclick={onDocumentModeToggle}
						{disabled}
						class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 disabled:opacity-50
                     {documentMode
							? 'bg-primary/20 text-primary border border-primary/30'
							: 'bg-white/50 dark:bg-white/10 text-muted-foreground border border-black/5 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/20 hover:text-foreground'}"
						title="Dokumentmodus aktivieren"
					>
						<FileText size={14} weight={documentMode ? 'fill' : 'bold'} />
						<span>Dokument</span>
					</button>
				{/if}
			</div>
		{/if}
	</div>
	<p class="text-xs text-muted-foreground text-center mt-2 opacity-70">
		Enter zum Senden, Shift+Enter für neue Zeile
	</p>
</div>
