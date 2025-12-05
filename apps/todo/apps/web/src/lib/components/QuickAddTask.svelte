<script lang="ts">
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { viewStore } from '$lib/stores/view.svelte';

	let inputValue = $state('');
	let isLoading = $state(false);
	let inputRef: HTMLInputElement;

	async function handleSubmit(event: Event) {
		event.preventDefault();

		const title = inputValue.trim();
		if (!title || isLoading) return;

		isLoading = true;

		try {
			// Create task with current project if in project view
			const projectId =
				viewStore.currentView === 'project' ? viewStore.currentProjectId : undefined;

			await tasksStore.createTask({
				title,
				projectId: projectId || undefined,
			});

			inputValue = '';
			inputRef?.focus();
		} catch (error) {
			console.error('Failed to create task:', error);
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			inputValue = '';
			inputRef?.blur();
		}
	}
</script>

<form onsubmit={handleSubmit} class="mb-6">
	<div class="relative">
		<div class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
			<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
		</div>
		<input
			bind:this={inputRef}
			bind:value={inputValue}
			onkeydown={handleKeydown}
			type="text"
			placeholder="Neue Aufgabe hinzufügen..."
			class="quick-add-input w-full pl-12 pr-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none"
			disabled={isLoading}
		/>
		{#if isLoading}
			<div class="absolute right-4 top-1/2 -translate-y-1/2">
				<div
					class="animate-spin h-5 w-5 border-2 border-primary border-r-transparent rounded-full"
				></div>
			</div>
		{/if}
	</div>
</form>
