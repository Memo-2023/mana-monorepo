<script lang="ts">
	interface Props {
		onAdd: (title: string) => void;
		placeholder?: string;
	}

	let { onAdd, placeholder = 'Neue Aufgabe...' }: Props = $props();

	let isAdding = $state(false);
	let title = $state('');
	let inputRef = $state<HTMLInputElement | null>(null);

	function handleSubmit() {
		if (title.trim()) {
			onAdd(title.trim());
			title = '';
			// Keep input open for rapid adding
			inputRef?.focus();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		} else if (event.key === 'Escape') {
			title = '';
			isAdding = false;
		}
	}

	function handleBlur() {
		if (!title.trim()) {
			isAdding = false;
		}
	}
</script>

<div class="quick-add-inline">
	{#if isAdding}
		<div class="add-form p-3">
			<input
				bind:this={inputRef}
				bind:value={title}
				onkeydown={handleKeydown}
				onblur={handleBlur}
				{placeholder}
				class="w-full px-0 py-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
				autofocus
			/>
			<div class="flex justify-between items-center mt-2 pt-2 border-t border-border/50">
				<button
					class="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1.5"
					onmousedown={(e) => e.preventDefault()}
					onclick={handleSubmit}
				>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Hinzufügen
				</button>
				<button
					class="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
					onmousedown={(e) => e.preventDefault()}
					onclick={() => {
						title = '';
						isAdding = false;
					}}
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
	{:else}
		<button
			class="add-trigger group w-full p-2.5 text-sm text-muted-foreground hover:text-foreground transition-all flex items-center gap-2"
			onclick={() => (isAdding = true)}
		>
			<div
				class="w-5 h-5 rounded-full border-2 border-dashed border-current group-hover:border-primary group-hover:text-primary flex items-center justify-center transition-colors"
			>
				<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
			</div>
			<span class="group-hover:text-foreground transition-colors">Aufgabe hinzufügen</span>
		</button>
	{/if}
</div>

<style>
	/* Glass-Pill add form */
	.add-form {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 1rem;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .add-form {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	/* Trigger button with subtle glass effect */
	.add-trigger {
		border-radius: 9999px;
	}

	.add-trigger:hover {
		background: rgba(255, 255, 255, 0.5);
	}

	:global(.dark) .add-trigger:hover {
		background: rgba(255, 255, 255, 0.1);
	}
</style>
