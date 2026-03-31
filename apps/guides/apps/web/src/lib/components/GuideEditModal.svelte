<script lang="ts">
	import type { LocalGuide, Difficulty } from '$lib/data/local-store.js';

	type GuideInput = Omit<LocalGuide, keyof import('@manacore/local-store').BaseRecord>;

	interface Props {
		open: boolean;
		guide?: LocalGuide;
		onClose: () => void;
		onSave: (data: GuideInput) => Promise<void>;
		onDelete?: (id: string) => Promise<void>;
	}

	let { open, guide, onClose, onSave, onDelete }: Props = $props();

	// Form state
	let title = $state(guide?.title ?? '');
	let description = $state(guide?.description ?? '');
	let coverEmoji = $state(guide?.coverEmoji ?? '📖');
	let category = $state(guide?.category ?? 'Allgemein');
	let difficulty = $state<Difficulty>(guide?.difficulty ?? 'easy');
	let estimatedMinutes = $state(guide?.estimatedMinutes ?? 0);
	let tagsInput = $state((guide?.tags ?? []).join(', '));
	let saving = $state(false);

	// Re-init when guide prop changes
	$effect(() => {
		if (guide) {
			title = guide.title;
			description = guide.description ?? '';
			coverEmoji = guide.coverEmoji ?? '📖';
			category = guide.category;
			difficulty = guide.difficulty;
			estimatedMinutes = guide.estimatedMinutes ?? 0;
			tagsInput = guide.tags.join(', ');
		}
	});

	const COVER_COLORS = [
		'#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b',
		'#ef4444', '#ec4899', '#10b981', '#f97316',
	];
	let coverColor = $state(guide?.coverColor ?? COVER_COLORS[0]);

	const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; color: string }[] = [
		{ value: 'easy', label: '⭐ Einfach', color: 'border-green-400 bg-green-50 text-green-700' },
		{ value: 'medium', label: '⭐⭐ Mittel', color: 'border-amber-400 bg-amber-50 text-amber-700' },
		{ value: 'hard', label: '⭐⭐⭐ Schwer', color: 'border-red-400 bg-red-50 text-red-700' },
	];

	const CATEGORY_SUGGESTIONS = ['Technik', 'Kochen', 'Sport', 'Lernen', 'Arbeit', 'Haushalt', 'Hobby', 'Allgemein'];

	async function handleSave() {
		if (!title.trim()) return;
		saving = true;
		try {
			const tags = tagsInput
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean);
			await onSave({
				title: title.trim(),
				description: description.trim() || undefined,
				coverEmoji,
				coverColor,
				category,
				difficulty,
				estimatedMinutes: estimatedMinutes > 0 ? estimatedMinutes : undefined,
				tags,
				collectionId: guide?.collectionId,
				orderInCollection: guide?.orderInCollection,
				xpReward: guide?.xpReward,
				skillId: guide?.skillId,
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
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
		onmousedown={handleBackdrop}
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			role="dialog"
			aria-modal="true"
			aria-label={guide ? 'Anleitung bearbeiten' : 'Neue Anleitung'}
			class="w-full max-w-lg overflow-hidden rounded-t-2xl bg-background shadow-xl sm:rounded-2xl"
			onkeydown={handleKeydown}
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border px-5 py-4">
				<h2 class="font-semibold text-foreground">
					{guide ? 'Anleitung bearbeiten' : 'Neue Anleitung'}
				</h2>
				<button onclick={onClose} class="text-muted-foreground hover:text-foreground">✕</button>
			</div>

			<!-- Body -->
			<div class="max-h-[70vh] overflow-y-auto p-5 space-y-4">
				<!-- Emoji + Color picker row -->
				<div class="flex items-center gap-4">
					<div class="flex-shrink-0">
						<p class="mb-1 text-xs text-muted-foreground">Emoji</p>
						<input
							type="text"
							bind:value={coverEmoji}
							maxlength="2"
							class="h-12 w-16 rounded-xl border border-border bg-surface text-center text-2xl focus:outline-none focus:ring-2 focus:ring-primary/30"
						/>
					</div>
					<div class="flex-1">
						<p class="mb-1 text-xs text-muted-foreground">Farbe</p>
						<div class="flex gap-2 flex-wrap">
							{#each COVER_COLORS as color}
								<button
									onclick={() => (coverColor = color)}
									class="h-7 w-7 rounded-full transition-transform hover:scale-110 {coverColor === color ? 'ring-2 ring-offset-2 ring-foreground' : ''}"
									style="background-color: {color}"
									aria-label={color}
								></button>
							{/each}
						</div>
					</div>
				</div>

				<!-- Title -->
				<div>
					<label class="mb-1 block text-xs font-medium text-muted-foreground">Titel *</label>
					<input
						type="text"
						bind:value={title}
						placeholder="z.B. Server deployen, Pasta Rezept..."
						class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
						autofocus
					/>
				</div>

				<!-- Description -->
				<div>
					<label class="mb-1 block text-xs font-medium text-muted-foreground">Beschreibung</label>
					<textarea
						bind:value={description}
						placeholder="Kurze Beschreibung..."
						rows="2"
						class="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
					></textarea>
				</div>

				<!-- Category + Difficulty -->
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="mb-1 block text-xs font-medium text-muted-foreground">Kategorie</label>
						<input
							type="text"
							bind:value={category}
							list="category-suggestions"
							class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
						/>
						<datalist id="category-suggestions">
							{#each CATEGORY_SUGGESTIONS as cat}
								<option value={cat}></option>
							{/each}
						</datalist>
					</div>
					<div>
						<label class="mb-1 block text-xs font-medium text-muted-foreground">Zeitaufwand (min)</label>
						<input
							type="number"
							bind:value={estimatedMinutes}
							min="0"
							step="5"
							class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
						/>
					</div>
				</div>

				<!-- Difficulty -->
				<div>
					<label class="mb-1 block text-xs font-medium text-muted-foreground">Schwierigkeit</label>
					<div class="flex gap-2">
						{#each DIFFICULTY_OPTIONS as opt}
							<button
								onclick={() => (difficulty = opt.value)}
								class="flex-1 rounded-lg border py-2 text-xs font-medium transition-colors
								{difficulty === opt.value ? opt.color : 'border-border text-muted-foreground hover:bg-accent'}"
							>
								{opt.label}
							</button>
						{/each}
					</div>
				</div>

				<!-- Tags -->
				<div>
					<label class="mb-1 block text-xs font-medium text-muted-foreground">
						Tags <span class="font-normal">(kommagetrennt)</span>
					</label>
					<input
						type="text"
						bind:value={tagsInput}
						placeholder="setup, mac, developer"
						class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
					/>
				</div>
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-between border-t border-border px-5 py-4">
				<div>
					{#if guide && onDelete}
						<button
							onclick={() => onDelete(guide!.id)}
							class="text-sm text-red-500 hover:text-red-600"
						>
							Löschen
						</button>
					{/if}
				</div>
				<div class="flex gap-3">
					<button
						onclick={onClose}
						class="rounded-xl border border-border px-4 py-2 text-sm text-foreground hover:bg-accent"
					>
						Abbrechen
					</button>
					<button
						onclick={handleSave}
						disabled={!title.trim() || saving}
						class="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
					>
						{saving ? 'Speichern...' : guide ? 'Speichern' : 'Erstellen'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
