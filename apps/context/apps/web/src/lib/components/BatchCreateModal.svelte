<script lang="ts">
	import { Plus, Trash, FileText, Notebook, Lightning } from '@manacore/shared-icons';
	import type { DocumentType } from '$lib/types';

	interface BatchItem {
		title: string;
		type: DocumentType;
	}

	interface Props {
		open: boolean;
		loading: boolean;
		onSubmit: (items: BatchItem[]) => void;
		onClose: () => void;
	}

	let { open, loading, onSubmit, onClose }: Props = $props();

	let items = $state<BatchItem[]>([{ title: '', type: 'text' }]);

	function addItem() {
		items = [...items, { title: '', type: 'text' }];
	}

	function removeItem(index: number) {
		items = items.filter((_, i) => i !== index);
	}

	function updateTitle(index: number, title: string) {
		items = items.map((item, i) => (i === index ? { ...item, title } : item));
	}

	function updateType(index: number, type: DocumentType) {
		items = items.map((item, i) => (i === index ? { ...item, type } : item));
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		const validItems = items.filter((i) => i.title.trim());
		if (validItems.length === 0) return;
		onSubmit(validItems);
		items = [{ title: '', type: 'text' }];
	}

	const typeOptions: { value: DocumentType; icon: typeof FileText; label: string }[] = [
		{ value: 'text', icon: FileText, label: 'T' },
		{ value: 'context', icon: Notebook, label: 'K' },
		{ value: 'prompt', icon: Lightning, label: 'P' },
	];
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
		<button class="absolute inset-0 bg-black/50" onclick={onClose} aria-label="Schließen"></button>
		<div
			class="relative bg-card border border-border rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl max-h-[80vh] overflow-y-auto"
		>
			<h3 class="text-lg font-semibold text-foreground mb-4">Mehrere Dokumente erstellen</h3>
			<form onsubmit={handleSubmit}>
				<div class="space-y-3">
					{#each items as item, index}
						<div class="flex items-center gap-2">
							<input
								type="text"
								value={item.title}
								oninput={(e) => updateTitle(index, (e.target as HTMLInputElement).value)}
								placeholder="Dokumenttitel..."
								class="flex-1 px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
							/>

							<div class="flex gap-0.5">
								{#each typeOptions as opt}
									<button
										type="button"
										class="p-1.5 rounded text-xs transition-colors"
										class:bg-primary={item.type === opt.value}
										class:text-primary-foreground={item.type === opt.value}
										class:text-muted-foreground={item.type !== opt.value}
										class:hover:bg-muted={item.type !== opt.value}
										onclick={() => updateType(index, opt.value)}
										title={opt.value}
									>
										<opt.icon size={14} />
									</button>
								{/each}
							</div>

							{#if items.length > 1}
								<button
									type="button"
									class="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
									onclick={() => removeItem(index)}
								>
									<Trash size={14} />
								</button>
							{/if}
						</div>
					{/each}
				</div>

				<button
					type="button"
					class="mt-3 w-full py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center justify-center gap-1"
					onclick={addItem}
				>
					<Plus size={14} />
					Weiteres Dokument
				</button>

				<div class="flex justify-between items-center mt-6">
					<span class="text-xs text-muted-foreground">
						{items.filter((i) => i.title.trim()).length} Dokumente
					</span>
					<div class="flex gap-2">
						<button type="button" class="btn btn-secondary text-sm" onclick={onClose}>
							Abbrechen
						</button>
						<button
							type="submit"
							class="btn btn-primary text-sm"
							disabled={items.filter((i) => i.title.trim()).length === 0 || loading}
						>
							{loading ? 'Erstelle...' : 'Alle erstellen'}
						</button>
					</div>
				</div>
			</form>
		</div>
	</div>
{/if}
