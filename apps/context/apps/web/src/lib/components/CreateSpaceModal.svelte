<script lang="ts">
	interface Props {
		open: boolean;
		loading: boolean;
		onSubmit: (name: string, description: string) => void;
		onClose: () => void;
	}

	let { open, loading, onSubmit, onClose }: Props = $props();

	let name = $state('');
	let description = $state('');

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!name.trim()) return;
		onSubmit(name.trim(), description.trim());
		name = '';
		description = '';
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
		<button class="absolute inset-0 bg-black/50" onclick={onClose} aria-label="Schließen"></button>
		<div
			class="relative bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
		>
			<h3 class="text-lg font-semibold text-foreground mb-4">Neuen Space erstellen</h3>
			<form onsubmit={handleSubmit}>
				<div class="space-y-4">
					<div>
						<label for="space-name" class="block text-sm font-medium text-foreground mb-1">
							Name
						</label>
						<input
							id="space-name"
							type="text"
							bind:value={name}
							placeholder="z.B. Projektnotizen"
							class="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
							required
						/>
					</div>
					<div>
						<label for="space-desc" class="block text-sm font-medium text-foreground mb-1">
							Beschreibung (optional)
						</label>
						<textarea
							id="space-desc"
							bind:value={description}
							placeholder="Worum geht es in diesem Space?"
							rows="3"
							class="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
						></textarea>
					</div>
				</div>
				<div class="flex justify-end gap-2 mt-6">
					<button type="button" class="btn btn-secondary text-sm" onclick={onClose}>
						Abbrechen
					</button>
					<button type="submit" class="btn btn-primary text-sm" disabled={!name.trim() || loading}>
						{loading ? 'Erstelle...' : 'Erstellen'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
