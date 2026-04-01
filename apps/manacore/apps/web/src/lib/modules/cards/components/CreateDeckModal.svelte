<script lang="ts">
	import { deckStore } from '../stores/decks.svelte';

	interface Props {
		open?: boolean;
		onClose?: () => void;
	}

	let { open = $bindable(false), onClose }: Props = $props();

	let title = $state('');
	let description = $state('');
	let isPublic = $state(false);
	let submitting = $state(false);

	async function handleSubmit() {
		if (!title.trim()) return;

		submitting = true;

		const deck = await deckStore.createDeck({
			title: title.trim(),
			description: description.trim() || undefined,
			isPublic,
		});

		submitting = false;

		if (deck) {
			title = '';
			description = '';
			isPublic = false;
			open = false;
			onClose?.();
		}
	}

	function handleClose() {
		open = false;
		onClose?.();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		onclick={handleClose}
	>
		<div
			class="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
			onclick={(e) => e.stopPropagation()}
		>
			<h2 class="mb-4 text-xl font-semibold text-foreground">Neues Deck erstellen</h2>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="space-y-4"
			>
				<div>
					<label for="deck-title" class="mb-1 block text-sm font-medium text-foreground">
						Titel
					</label>
					<input
						id="deck-title"
						type="text"
						bind:value={title}
						placeholder="z.B. Spanisch Vokabeln"
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
						required
					/>
				</div>

				<div>
					<label for="deck-desc" class="mb-1 block text-sm font-medium text-foreground">
						Beschreibung
					</label>
					<textarea
						id="deck-desc"
						bind:value={description}
						placeholder="Worum geht es in diesem Deck?"
						class="min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
					></textarea>
				</div>

				<div class="flex items-center gap-2">
					<input
						type="checkbox"
						id="deck-public"
						bind:checked={isPublic}
						class="h-4 w-4 rounded border-border"
					/>
					<label for="deck-public" class="cursor-pointer text-sm text-foreground">
						Offentlich machen
					</label>
				</div>

				{#if deckStore.error}
					<div class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
						{deckStore.error}
					</div>
				{/if}

				<div class="flex justify-end gap-3">
					<button
						type="button"
						class="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
						onclick={handleClose}
					>
						Abbrechen
					</button>
					<button
						type="submit"
						class="rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
						disabled={submitting || !title.trim()}
					>
						{submitting ? 'Erstelle...' : 'Deck erstellen'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
