<!--
  ReferenceInputPicker — tabs over the three content-richest modules
  (Journal / Notes / Library) and picks one entry as the seed for the
  AI-Storyboard flow. On select, resolves the decrypted plaintext
  (title + content / review) and emits it to the parent so
  `suggestPanels` can post it to the server.

  Writing-Drafts and Calendar-Events are intentionally left out of the
  first cut — writing drafts need version-chain resolution and
  calendar events rarely carry enough prose to drive a panel sequence.
  Adding them is a follow-up (tabs + hook + resolver wiring).
-->
<script lang="ts">
	import { useAllJournalEntries } from '$lib/modules/journal/queries';
	import { useAllNotes } from '$lib/modules/notes/queries';
	import { useAllEntries as useAllLibraryEntries } from '$lib/modules/library/queries';
	import { MagnifyingGlass, Book, NotePencil, BookOpen } from '@mana/shared-icons';
	import type { StoryboardSourceModule } from '../api/storyboard';

	export interface ReferenceSelection {
		module: StoryboardSourceModule;
		entryId: string;
		/** Human-readable label — shown in the "seeded from…"-chip on the
		 *  story detail once panels are generated. */
		label: string;
		/** Decrypted plaintext that gets posted to /comic/storyboard. */
		sourceText: string;
	}

	interface Props {
		onSelect: (sel: ReferenceSelection) => void;
	}

	let { onSelect }: Props = $props();

	type Tab = 'journal' | 'notes' | 'library';
	let activeTab = $state<Tab>('journal');
	let search = $state('');

	const journal$ = useAllJournalEntries();
	const notes$ = useAllNotes();
	const library$ = useAllLibraryEntries();

	const journal = $derived(journal$.value ?? []);
	const notes = $derived(notes$.value ?? []);
	const library = $derived(library$.value ?? []);

	const q = $derived(search.trim().toLowerCase());

	const journalFiltered = $derived(
		q.length === 0
			? journal.slice(0, 30)
			: journal
					.filter((e) => {
						const hay = `${e.title ?? ''} ${e.content}`.toLowerCase();
						return hay.includes(q);
					})
					.slice(0, 30)
	);
	const notesFiltered = $derived(
		q.length === 0
			? notes.slice(0, 30)
			: notes.filter((n) => `${n.title} ${n.content}`.toLowerCase().includes(q)).slice(0, 30)
	);
	const libraryFiltered = $derived(
		q.length === 0
			? library.slice(0, 30)
			: library
					.filter((e) => {
						const review = e.review ?? '';
						return `${e.title} ${review}`.toLowerCase().includes(q);
					})
					.slice(0, 30)
	);

	function shortPreview(text: string, maxLen = 100): string {
		const clean = text.replace(/\s+/g, ' ').trim();
		return clean.length > maxLen ? clean.slice(0, maxLen) + '…' : clean;
	}

	const TABS: { key: Tab; label: string; count: number }[] = $derived([
		{ key: 'journal', label: 'Tagebuch', count: journal.length },
		{ key: 'notes', label: 'Notizen', count: notes.length },
		{ key: 'library', label: 'Bibliothek', count: library.length },
	]);
</script>

<div class="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
	<header class="space-y-1">
		<h3 class="text-sm font-semibold text-foreground">Quelle wählen</h3>
		<p class="text-xs text-muted-foreground">
			Aus welchem Text soll die KI eine Panel-Folge bauen? Alles bleibt lokal — erst der
			verschlüsselte Klartext wird an das Modell gesendet, nur für diesen einen Call.
		</p>
	</header>

	<nav class="flex gap-1 border-b border-border" aria-label="Quelle">
		{#each TABS as tab (tab.key)}
			<button
				type="button"
				class="-mb-px border-b-2 px-2.5 py-1.5 text-xs font-medium transition-colors
					{activeTab === tab.key
					? 'border-primary text-foreground'
					: 'border-transparent text-muted-foreground hover:text-foreground'}"
				aria-pressed={activeTab === tab.key}
				onclick={() => (activeTab = tab.key)}
			>
				{tab.label}
				<span class="ml-1 text-[10px] text-muted-foreground">{tab.count}</span>
			</button>
		{/each}
	</nav>

	<div class="relative">
		<MagnifyingGlass
			size={14}
			class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
		/>
		<input
			type="search"
			bind:value={search}
			placeholder="Suchen…"
			class="block w-full rounded-md border border-border bg-background py-1.5 pl-7 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
		/>
	</div>

	<div class="max-h-80 space-y-1.5 overflow-y-auto">
		{#if activeTab === 'journal'}
			{#if journalFiltered.length === 0}
				<p class="py-4 text-center text-xs text-muted-foreground">
					{journal.length === 0
						? 'Noch keine Tagebuch-Einträge in diesem Space.'
						: 'Keine Einträge passen zur Suche.'}
				</p>
			{:else}
				{#each journalFiltered as entry (entry.id)}
					<button
						type="button"
						onclick={() =>
							onSelect({
								module: 'journal',
								entryId: entry.id,
								label: entry.title?.trim() || entry.entryDate || 'Tagebuch-Eintrag',
								sourceText: entry.title ? `${entry.title}\n\n${entry.content}` : entry.content,
							})}
						class="flex w-full items-start gap-2 rounded-md border border-border bg-background p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-muted"
					>
						<Book size={14} class="mt-0.5 flex-shrink-0 text-muted-foreground" />
						<div class="min-w-0 flex-1">
							<p class="flex items-center gap-1.5 text-xs font-medium text-foreground">
								<span class="truncate">{entry.title?.trim() || entry.entryDate || 'Eintrag'}</span>
							</p>
							<p class="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
								{shortPreview(entry.content)}
							</p>
						</div>
					</button>
				{/each}
			{/if}
		{:else if activeTab === 'notes'}
			{#if notesFiltered.length === 0}
				<p class="py-4 text-center text-xs text-muted-foreground">
					{notes.length === 0
						? 'Noch keine Notizen in diesem Space.'
						: 'Keine Notizen passen zur Suche.'}
				</p>
			{:else}
				{#each notesFiltered as note (note.id)}
					<button
						type="button"
						onclick={() =>
							onSelect({
								module: 'notes',
								entryId: note.id,
								label: note.title.trim() || 'Notiz',
								sourceText: note.title ? `${note.title}\n\n${note.content}` : note.content,
							})}
						class="flex w-full items-start gap-2 rounded-md border border-border bg-background p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-muted"
					>
						<NotePencil size={14} class="mt-0.5 flex-shrink-0 text-muted-foreground" />
						<div class="min-w-0 flex-1">
							<p class="truncate text-xs font-medium text-foreground">
								{note.title.trim() || 'Ohne Titel'}
							</p>
							<p class="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
								{shortPreview(note.content)}
							</p>
						</div>
					</button>
				{/each}
			{/if}
		{:else if activeTab === 'library'}
			{#if libraryFiltered.length === 0}
				<p class="py-4 text-center text-xs text-muted-foreground">
					{library.length === 0
						? 'Noch keine Bibliotheks-Einträge in diesem Space.'
						: 'Keine Einträge passen zur Suche.'}
				</p>
			{:else}
				{#each libraryFiltered as entry (entry.id)}
					{@const hasReview = entry.review && entry.review.trim().length > 0}
					<button
						type="button"
						disabled={!hasReview}
						onclick={() => {
							if (!hasReview || !entry.review) return;
							onSelect({
								module: 'library',
								entryId: entry.id,
								label: entry.title,
								sourceText: `${entry.title}\n\n${entry.review}`,
							});
						}}
						class="flex w-full items-start gap-2 rounded-md border border-border bg-background p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-background"
						title={hasReview ? '' : 'Kein Review hinterlegt — kein Text zum Rendern'}
					>
						<BookOpen size={14} class="mt-0.5 flex-shrink-0 text-muted-foreground" />
						<div class="min-w-0 flex-1">
							<p class="flex items-center gap-1.5 text-xs font-medium text-foreground">
								<span class="truncate">{entry.title}</span>
								<span
									class="flex-shrink-0 rounded-sm bg-muted px-1 py-0 text-[9px] uppercase text-muted-foreground"
								>
									{entry.kind}
								</span>
							</p>
							<p class="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
								{hasReview ? shortPreview(entry.review ?? '') : 'Kein Review'}
							</p>
						</div>
					</button>
				{/each}
			{/if}
		{/if}
	</div>
</div>
