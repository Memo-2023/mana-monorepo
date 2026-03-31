<script lang="ts">
	import type { LocalCollection } from '$lib/data/local-store.js';
	import type { BaseRecord } from '@manacore/local-store';

	type CollectionInput = Omit<LocalCollection, keyof BaseRecord>;

	interface Props {
		open: boolean;
		collection?: LocalCollection;
		onClose: () => void;
		onSave: (data: CollectionInput) => Promise<void>;
		onDelete?: (id: string) => Promise<void>;
	}

	let { open, collection, onClose, onSave, onDelete }: Props = $props();

	let title = $state(collection?.title ?? '');
	let description = $state(collection?.description ?? '');
	let coverEmoji = $state(collection?.coverEmoji ?? '📚');
	let coverColor = $state(collection?.coverColor ?? '#0d9488');
	let type = $state<'path' | 'library'>(collection?.type ?? 'path');
	let saving = $state(false);

	$effect(() => {
		if (collection) {
			title = collection.title;
			description = collection.description ?? '';
			coverEmoji = collection.coverEmoji ?? '📚';
			coverColor = collection.coverColor ?? '#0d9488';
			type = collection.type;
		}
	});

	const COVER_COLORS = ['#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#10b981', '#f97316'];

	async function handleSave() {
		if (!title.trim()) return;
		saving = true;
		try {
			await onSave({
				title: title.trim(),
				description: description.trim() || undefined,
				coverEmoji,
				coverColor,
				type,
				guideOrder: collection?.guideOrder ?? [],
			});
		} finally {
			saving = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSave();
	}
	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onmousedown={handleBackdrop}>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div role="dialog" aria-modal="true" class="w-full max-w-md overflow-hidden rounded-t-2xl bg-background shadow-xl sm:rounded-2xl" onkeydown={handleKeydown}>
			<div class="flex items-center justify-between border-b border-border px-5 py-4">
				<h2 class="font-semibold text-foreground">{collection ? 'Sammlung bearbeiten' : 'Neue Sammlung'}</h2>
				<button onclick={onClose} class="text-muted-foreground hover:text-foreground">✕</button>
			</div>

			<div class="p-5 space-y-4">
				<!-- Emoji + Color -->
				<div class="flex items-center gap-4">
					<div>
						<p class="mb-1 text-xs text-muted-foreground">Emoji</p>
						<input type="text" bind:value={coverEmoji} maxlength="2"
							class="h-12 w-16 rounded-xl border border-border bg-surface text-center text-2xl focus:outline-none focus:ring-2 focus:ring-primary/30" />
					</div>
					<div class="flex-1">
						<p class="mb-1 text-xs text-muted-foreground">Farbe</p>
						<div class="flex gap-2 flex-wrap">
							{#each COVER_COLORS as color}
								<button onclick={() => (coverColor = color)}
									class="h-7 w-7 rounded-full transition-transform hover:scale-110 {coverColor === color ? 'ring-2 ring-offset-2 ring-foreground' : ''}"
									style="background-color: {color}"></button>
							{/each}
						</div>
					</div>
				</div>

				<!-- Title -->
				<div>
					<label class="mb-1 block text-xs font-medium text-muted-foreground">Titel *</label>
					<input type="text" bind:value={title} placeholder="z.B. Developer Starter Kit" autofocus
						class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
				</div>

				<!-- Description -->
				<div>
					<label class="mb-1 block text-xs font-medium text-muted-foreground">Beschreibung</label>
					<textarea bind:value={description} rows="2" placeholder="Kurze Beschreibung..."
						class="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"></textarea>
				</div>

				<!-- Type -->
				<div>
					<label class="mb-2 block text-xs font-medium text-muted-foreground">Typ</label>
					<div class="grid grid-cols-2 gap-2">
						<button onclick={() => (type = 'path')}
							class="rounded-xl border p-3 text-left transition-colors {type === 'path' ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'}">
							<div class="text-lg mb-1">🗺</div>
							<div class="text-sm font-medium text-foreground">Lernpfad</div>
							<div class="text-xs text-muted-foreground">Geordnete Sequenz</div>
						</button>
						<button onclick={() => (type = 'library')}
							class="rounded-xl border p-3 text-left transition-colors {type === 'library' ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'}">
							<div class="text-lg mb-1">📚</div>
							<div class="text-sm font-medium text-foreground">Bibliothek</div>
							<div class="text-xs text-muted-foreground">Thematische Gruppe</div>
						</button>
					</div>
				</div>
			</div>

			<div class="flex items-center justify-between border-t border-border px-5 py-4">
				<div>
					{#if collection && onDelete}
						<button onclick={() => onDelete(collection!.id)} class="text-sm text-red-500 hover:text-red-600">Löschen</button>
					{/if}
				</div>
				<div class="flex gap-3">
					<button onclick={onClose} class="rounded-xl border border-border px-4 py-2 text-sm hover:bg-accent">Abbrechen</button>
					<button onclick={handleSave} disabled={!title.trim() || saving}
						class="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
						{saving ? 'Speichern...' : collection ? 'Speichern' : 'Erstellen'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
