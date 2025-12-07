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
		<div class="bg-card border border-border rounded-lg p-2 shadow-sm">
			<input
				bind:this={inputRef}
				bind:value={title}
				onkeydown={handleKeydown}
				onblur={handleBlur}
				{placeholder}
				class="w-full px-2 py-1.5 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
				autofocus
			/>
			<div class="flex justify-between items-center mt-2">
				<button
					class="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
					onmousedown={(e) => e.preventDefault()}
					onclick={handleSubmit}
				>
					Hinzufügen
				</button>
				<button
					class="p-1 text-muted-foreground hover:text-foreground transition-colors"
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
			class="w-full p-2 text-sm text-muted-foreground hover:text-foreground hover:bg-card/50 rounded-lg transition-colors flex items-center gap-2"
			onclick={() => (isAdding = true)}
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Aufgabe hinzufügen
		</button>
	{/if}
</div>
