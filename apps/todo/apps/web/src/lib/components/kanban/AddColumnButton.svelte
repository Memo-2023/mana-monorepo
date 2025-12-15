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

<div class="add-column min-w-[300px] max-w-[340px] h-fit">
	{#if isAdding}
		<div class="add-form p-4 animate-in fade-in slide-in-from-left-2 duration-200">
			<div class="flex items-center gap-2 mb-3">
				<div class="w-3 h-3 rounded-full bg-muted-foreground"></div>
				<span class="text-sm font-medium text-foreground">Neue Spalte</span>
			</div>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				type="text"
				bind:value={newName}
				onkeydown={handleKeydown}
				placeholder="Spaltenname eingeben..."
				class="add-input w-full px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
				autofocus
			/>
			<div class="flex gap-2 mt-3">
				<button
					class="flex-1 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
					onclick={handleSubmit}
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
					class="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
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
			class="add-button group w-full min-h-[250px] p-4 text-sm text-muted-foreground hover:text-foreground transition-all flex flex-col items-center justify-center gap-3"
			onclick={() => (isAdding = true)}
		>
			<div
				class="w-12 h-12 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors"
			>
				<svg
					class="w-6 h-6 group-hover:text-primary transition-colors"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
			</div>
			<span class="font-medium">Spalte hinzufügen</span>
		</button>
	{/if}
</div>

<style>
	/* Glass-Pill styles for add form */
	.add-form {
		background: rgba(255, 255, 255, 0.5);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 1.5rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .add-form {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	/* Input with glass style */
	.add-input {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 9999px;
		color: #374151;
	}

	.add-input::placeholder {
		color: #9ca3af;
	}

	:global(.dark) .add-input {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #f3f4f6;
	}

	:global(.dark) .add-input::placeholder {
		color: #9ca3af;
	}

	/* Glass-Pill button to add column */
	.add-button {
		background: rgba(255, 255, 255, 0.3);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 2px dashed rgba(0, 0, 0, 0.15);
		border-radius: 1.5rem;
	}

	:global(.dark) .add-button {
		background: rgba(255, 255, 255, 0.05);
		border: 2px dashed rgba(255, 255, 255, 0.15);
	}

	.add-button:hover {
		background: rgba(255, 255, 255, 0.5);
		border-color: rgba(139, 92, 246, 0.5);
	}

	:global(.dark) .add-button:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(139, 92, 246, 0.5);
	}

	/* Animation utilities */
	.animate-in {
		animation: animateIn 0.2s ease-out;
	}

	.fade-in {
		--tw-enter-opacity: 0;
	}

	.slide-in-from-left-2 {
		--tw-enter-translate-x: -0.5rem;
	}

	@keyframes animateIn {
		from {
			opacity: var(--tw-enter-opacity, 1);
			transform: translateX(var(--tw-enter-translate-x, 0));
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
</style>
