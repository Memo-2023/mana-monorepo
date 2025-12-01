<script lang="ts">
	import type { Space } from '@chat/types';

	interface Props {
		space?: Space;
		onSubmit: (data: { name: string; description?: string }) => void;
		onCancel: () => void;
	}

	let { space, onSubmit, onCancel }: Props = $props();

	let name = $state(space?.name ?? '');
	let description = $state(space?.description ?? '');
	let errors = $state<{ name?: string }>({});

	const isEditMode = !!space?.id;

	function validateForm(): boolean {
		const newErrors: { name?: string } = {};

		if (!name.trim()) {
			newErrors.name = 'Bitte gib einen Namen ein.';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	function handleSubmit() {
		if (!validateForm()) return;

		onSubmit({
			name: name.trim(),
			description: description.trim() || undefined,
		});
	}
</script>

<div class="bg-surface p-6 rounded-xl max-w-lg mx-auto">
	<h2 class="text-xl font-bold text-foreground mb-6">
		{isEditMode ? 'Space bearbeiten' : 'Neuen Space erstellen'}
	</h2>

	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
		class="space-y-5"
	>
		<!-- Name -->
		<div>
			<label for="name" class="block text-sm font-medium text-foreground mb-1"> Name * </label>
			<input
				type="text"
				id="name"
				bind:value={name}
				maxlength={100}
				placeholder="Name des Spaces"
				class="w-full px-3 py-2 border rounded-lg bg-muted
               text-foreground placeholder-muted-foreground
               {errors.name ? 'border-destructive' : 'border-border'}
               focus:ring-2 focus:ring-primary focus:border-transparent"
			/>
			{#if errors.name}
				<p class="mt-1 text-sm text-destructive">{errors.name}</p>
			{/if}
		</div>

		<!-- Description -->
		<div>
			<label for="description" class="block text-sm font-medium text-foreground mb-1">
				Beschreibung (optional)
			</label>
			<textarea
				id="description"
				bind:value={description}
				maxlength={500}
				rows={3}
				placeholder="Worum geht es in diesem Space?"
				class="w-full px-3 py-2 border border-border rounded-lg
               bg-muted text-foreground placeholder-muted-foreground
               focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
			></textarea>
		</div>

		<!-- Buttons -->
		<div class="flex gap-3 pt-4">
			<button
				type="button"
				onclick={onCancel}
				class="flex-1 px-4 py-2.5 border border-border text-foreground
               rounded-lg font-medium hover:bg-muted transition-colors"
			>
				Abbrechen
			</button>
			<button
				type="submit"
				class="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium
               hover:bg-primary/90 transition-colors"
			>
				{isEditMode ? 'Speichern' : 'Erstellen'}
			</button>
		</div>
	</form>
</div>
