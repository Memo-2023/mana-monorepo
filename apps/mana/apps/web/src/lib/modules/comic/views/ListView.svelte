<!--
  Comic stories list view — grid of stories in the active space.
  The face-ref upload banner lives one level up in the module-root
  ListView (above the tabs), so we don't repeat it here per tab.
-->
<script lang="ts">
	import { Plus } from '@mana/shared-icons';
	import { getActiveSpace } from '$lib/data/scope';
	import { useAllStories } from '../queries';
	import StoryCard from '../components/StoryCard.svelte';

	const stories$ = useAllStories();
	const stories = $derived(stories$.value ?? []);

	const activeSpace = $derived(getActiveSpace());
</script>

<div class="space-y-4">
	<header class="flex items-center justify-between gap-3">
		<div>
			<h2 class="text-sm font-semibold text-foreground">Deine Comics</h2>
			<p class="text-xs text-muted-foreground">
				{stories.length}
				{stories.length === 1 ? 'Story' : 'Stories'} in
				<strong class="text-foreground">{activeSpace?.name ?? 'diesem Space'}</strong>
			</p>
		</div>
		<a
			href="/comic/new"
			class="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
		>
			<Plus size={12} />
			Neue Story
		</a>
	</header>

	{#if stories.length > 0}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
			{#each stories as story (story.id)}
				<StoryCard {story} />
			{/each}
		</div>
	{:else if !stories$.loading}
		<div class="rounded-2xl border border-dashed border-border bg-background/50 p-8 text-center">
			<p class="text-sm font-medium text-foreground">Noch keine Comics.</p>
			<p class="mt-1 text-sm text-muted-foreground">
				Starte deine erste Geschichte — aus einem Gedanken, einem Tagebuch-Eintrag oder einfach
				einer Idee.
			</p>
			<a
				href="/comic/new"
				class="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
			>
				<Plus size={14} />
				Erste Story anlegen
			</a>
		</div>
	{/if}
</div>
