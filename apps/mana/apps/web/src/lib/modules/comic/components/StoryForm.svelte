<!--
  StoryForm — create a new comic story. Title + Style + Characters +
  optional Kontext. On submit, createStory() lands the row in Dexie
  and we navigate to /comic/[id] so the user can start adding panels
  immediately.

  No edit mode yet — update-story is a future concern (users who want
  to change the style/characters can just create a new story). The
  form is tuned for the "fresh idea → first panel in <60s"-flow.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { Sparkle } from '@mana/shared-icons';
	import { getActiveSpace } from '$lib/data/scope';
	import { comicStoriesStore } from '../stores/stories.svelte';
	import type { ComicStyle } from '../types';
	import StylePicker from './StylePicker.svelte';
	import CharacterRefPicker from './CharacterRefPicker.svelte';

	let title = $state('');
	let style = $state<ComicStyle>('comic');
	let characterId = $state<string | null>(null);
	let characterMediaIds = $state<string[]>([]);
	let storyContext = $state('');
	let submitting = $state(false);
	let submitError = $state<string | null>(null);

	const activeSpace = $derived(getActiveSpace());
	const canSubmit = $derived(
		title.trim().length > 0 && characterMediaIds.length > 0 && !submitting
	);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!canSubmit) return;
		submitting = true;
		submitError = null;
		try {
			const story = await comicStoriesStore.createStory({
				title: title.trim(),
				style,
				characterId,
				characterMediaIds,
				storyContext: storyContext.trim() || null,
			});
			await goto(`/comic/${story.id}`);
		} catch (err) {
			submitError = err instanceof Error ? err.message : 'Erstellung fehlgeschlagen';
			submitting = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-5">
	<!-- Title -->
	<div class="space-y-1.5">
		<label
			for="comic-title"
			class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
		>
			Titel
		</label>
		<input
			id="comic-title"
			type="text"
			bind:value={title}
			placeholder="Bug-Hunt-Frust, Urlaubs-Abenteuer, …"
			maxlength={120}
			autocomplete="off"
			class="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
			disabled={submitting}
			required
		/>
	</div>

	<!-- Style -->
	<div class="space-y-2">
		<div class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stil</div>
		<StylePicker value={style} onChange={(next) => (style = next)} disabled={submitting} />
		<p class="text-[11px] text-muted-foreground">
			Der Stil gilt für alle Panels der Geschichte. Wechsel ist später nicht möglich — dafür neue
			Story anlegen.
		</p>
	</div>

	<!-- Character refs (Mc3): default is character-mode if any exist,
	     fallback Quick-Mode für Spontan-Stories ohne Setup. -->
	<CharacterRefPicker
		selectedCharacterId={characterId}
		referenceMediaIds={characterMediaIds}
		onChange={({ characterId: nextId, referenceMediaIds: nextRefs }) => {
			characterId = nextId;
			characterMediaIds = nextRefs;
		}}
		disabled={submitting}
	/>

	<!-- Story context (optional) -->
	<div class="space-y-1.5">
		<label
			for="comic-context"
			class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
		>
			Kontext <span class="font-normal normal-case text-muted-foreground">(optional)</span>
		</label>
		<textarea
			id="comic-context"
			bind:value={storyContext}
			rows={3}
			maxlength={800}
			placeholder="Kurze Zusammenfassung, Ton, Ziel der Geschichte. Wird im AI-Storyboard-Flow (M4) als Briefing genutzt."
			class="block w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
			disabled={submitting}
		></textarea>
	</div>

	{#if activeSpace && activeSpace.type !== 'personal'}
		<p class="text-xs text-muted-foreground">
			Diese Story gehört zu <strong class="text-foreground">{activeSpace.name}</strong> — nur Mitglieder
			dieses Space sehen sie.
		</p>
	{/if}

	{#if submitError}
		<div
			class="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
			role="alert"
		>
			{submitError}
		</div>
	{/if}

	<div class="flex items-center gap-2">
		<button
			type="submit"
			disabled={!canSubmit}
			class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
		>
			<Sparkle size={14} />
			{submitting ? 'Wird erstellt…' : 'Story anlegen'}
		</button>
		<a
			href="/comic"
			class="rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
		>
			Abbrechen
		</a>
	</div>
</form>
