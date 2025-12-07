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

<div class="column-header flex items-center justify-between p-3 pb-2">
	<div class="flex items-center gap-2 min-w-0 flex-1">
		<!-- Color indicator -->
		<div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: {column.color}"></div>

		<!-- Name (editable) -->
		{#if isEditing}
			<input
				type="text"
				bind:value={editName}
				onblur={handleSubmit}
				onkeydown={handleKeydown}
				class="text-sm font-semibold bg-transparent border-b border-primary outline-none text-foreground flex-1 min-w-0"
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

		<!-- Task count -->
		<span class="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full flex-shrink-0">
			{taskCount}
		</span>
	</div>

	<!-- Menu button -->
	{#if onUpdate || onDelete}
		<div class="relative">
			<button
				class="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
				onclick={() => (showMenu = !showMenu)}
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
					class="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 z-50 min-w-[150px]"
				>
					{#if onUpdate}
						<button
							class="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent flex items-center gap-2"
							onclick={() => {
								isEditing = true;
								showMenu = false;
							}}
						>
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
							class="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent flex items-center gap-2"
							onclick={() => (showColorPicker = !showColorPicker)}
						>
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
							<div class="px-3 py-2 flex flex-wrap gap-1 border-t border-border mt-1 pt-2">
								{#each colors as color}
									<button
										class="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
										class:border-primary={color === column.color}
										class:border-transparent={color !== column.color}
										style="background-color: {color}"
										onclick={() => handleColorSelect(color)}
									></button>
								{/each}
							</div>
						{/if}
					{/if}

					{#if onDelete && !column.isDefault}
						<button
							class="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
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
	></button>
{/if}
