<script lang="ts">
	interface Props {
		onAdd: (name: string) => void;
	}

	let { onAdd }: Props = $props();

	let isAdding = $state(false);
	let newName = $state('');

	function handleSubmit() {
		if (newName.trim()) {
			onAdd(newName.trim());
			newName = '';
			isAdding = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSubmit();
		} else if (event.key === 'Escape') {
			newName = '';
			isAdding = false;
		}
	}
</script>

<div class="add-column min-w-[280px] max-w-[320px] h-fit">
	{#if isAdding}
		<div class="bg-muted/50 rounded-xl p-3">
			<input
				type="text"
				bind:value={newName}
				onkeydown={handleKeydown}
				placeholder="Spaltenname..."
				class="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
				autofocus
			/>
			<div class="flex gap-2 mt-2">
				<button
					class="flex-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
					onclick={handleSubmit}
				>
					Hinzufügen
				</button>
				<button
					class="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
					onclick={() => {
						newName = '';
						isAdding = false;
					}}
				>
					Abbrechen
				</button>
			</div>
		</div>
	{:else}
		<button
			class="w-full p-3 text-sm text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50 rounded-xl border-2 border-dashed border-border hover:border-muted-foreground transition-colors flex items-center justify-center gap-2"
			onclick={() => (isAdding = true)}
		>
			<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Spalte hinzufügen
		</button>
	{/if}
</div>
