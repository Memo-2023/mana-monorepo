<script lang="ts">
	import type { KanbanColumn } from '@todo/shared';

	interface Props {
		column: KanbanColumn;
		taskCount: number;
		onUpdate?: (data: { name?: string; color?: string }) => void;
		onDelete?: () => void;
	}

	let { column, taskCount, onUpdate, onDelete }: Props = $props();

	let isEditing = $state(false);
	let editName = $state(column.name);
	let showMenu = $state(false);
	let showColorPicker = $state(false);

	const colors = [
		'#6B7280', // gray
		'#EF4444', // red
		'#F97316', // orange
		'#EAB308', // yellow
		'#22C55E', // green
		'#14B8A6', // teal
		'#3B82F6', // blue
		'#8B5CF6', // purple
		'#EC4899', // pink
	];

	function handleSubmit() {
		if (editName.trim() && editName !== column.name) {
			onUpdate?.({ name: editName.trim() });
		}
		isEditing = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSubmit();
		} else if (event.key === 'Escape') {
			editName = column.name;
			isEditing = false;
		}
	}

	function handleColorSelect(color: string) {
		onUpdate?.({ color });
		showColorPicker = false;
		showMenu = false;
	}
</script>

<div class="column-header flex items-center justify-between px-3.5 py-3">
	<div class="flex items-center gap-2.5 min-w-0 flex-1">
		<!-- Color indicator with glow -->
		<div
			class="w-3 h-3 rounded-full flex-shrink-0 ring-4 ring-opacity-20"
			style="background-color: {column.color}; --tw-ring-color: {column.color}"
		></div>

		<!-- Name (editable) -->
		{#if isEditing}
			<!-- svelte-ignore a11y_autofocus -->
			<input
				type="text"
				bind:value={editName}
				onblur={handleSubmit}
				onkeydown={handleKeydown}
				class="text-sm font-semibold bg-transparent border-b-2 border-primary outline-none text-foreground flex-1 min-w-0 py-0.5"
				autofocus
			/>
		{:else}
			<button
				class="text-sm font-semibold text-foreground truncate text-left hover:text-primary transition-colors"
				ondblclick={() => {
					if (!column.isDefault || onUpdate) {
						isEditing = true;
					}
				}}
			>
				{column.name}
			</button>
		{/if}

		<!-- Task count badge -->
		<span
			class="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 transition-colors"
			style="background-color: color-mix(in srgb, {column.color} 15%, transparent); color: {column.color}"
		>
			{taskCount}
		</span>
	</div>

	<!-- Menu button -->
	{#if onUpdate || onDelete}
		<div class="relative">
			<button
				class="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
				onclick={() => (showMenu = !showMenu)}
				aria-label="Spaltenmenü öffnen"
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
					/>
				</svg>
			</button>

			{#if showMenu}
				<div
					class="menu-popup absolute right-0 top-full mt-1 rounded-xl py-1.5 z-50 min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-150"
				>
					{#if onUpdate}
						<button
							class="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted rounded-lg mx-1 transition-colors flex items-center gap-2"
							style="width: calc(100% - 0.5rem)"
							onclick={() => {
								isEditing = true;
								showMenu = false;
							}}
						>
							<svg
								class="w-4 h-4 text-muted-foreground"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
							Umbenennen
						</button>

						<button
							class="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted rounded-lg mx-1 transition-colors flex items-center gap-2"
							style="width: calc(100% - 0.5rem)"
							onclick={() => (showColorPicker = !showColorPicker)}
						>
							<svg
								class="w-4 h-4 text-muted-foreground"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
								/>
							</svg>
							Farbe ändern
						</button>

						{#if showColorPicker}
							<div class="px-3 py-2.5 flex flex-wrap gap-1.5 border-t border-border mt-1.5 pt-2.5">
								{#each colors as color}
									<button
										class="w-7 h-7 rounded-full border-2 transition-all hover:scale-110 hover:shadow-md {color ===
										column.color
											? 'border-primary ring-2 ring-primary/30'
											: 'border-transparent'}"
										style="background-color: {color}"
										onclick={() => handleColorSelect(color)}
										aria-label="Farbe {color} auswählen"
									></button>
								{/each}
							</div>
						{/if}
					{/if}

					{#if onDelete && !column.isDefault}
						<div class="border-t border-border mt-1.5 pt-1.5">
							<button
								class="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 rounded-lg mx-1 transition-colors flex items-center gap-2"
								style="width: calc(100% - 0.5rem)"
								onclick={() => {
									onDelete?.();
									showMenu = false;
								}}
							>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
								Löschen
							</button>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Click outside to close menu -->
{#if showMenu}
	<button
		class="fixed inset-0 z-40"
		onclick={() => {
			showMenu = false;
			showColorPicker = false;
		}}
		aria-label="Menü schließen"
	></button>
{/if}

<style>
	/* Glass popup effect */
	.menu-popup {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .menu-popup {
		background: rgba(30, 30, 30, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	/* Animation utilities */
	.animate-in {
		animation: animateIn 0.15s ease-out;
	}

	.fade-in {
		--tw-enter-opacity: 0;
	}

	.slide-in-from-top-2 {
		--tw-enter-translate-y: -0.5rem;
	}

	@keyframes animateIn {
		from {
			opacity: var(--tw-enter-opacity, 1);
			transform: translateY(var(--tw-enter-translate-y, 0));
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
