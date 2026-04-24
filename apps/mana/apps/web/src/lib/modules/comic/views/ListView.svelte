<!--
  Comic list view — grid of stories in the active space, with a "+"
  CTA at the top to jump into the create flow. Empty-state nudges
  first-time users to check their face-ref first (comics can't
  render without a Protagonist).
-->
<script lang="ts">
	import { Plus, UserCircle } from '@mana/shared-icons';
	import { getActiveSpace } from '$lib/data/scope';
	import { useImageByPrimary } from '$lib/modules/profile/queries';
	import { useAllStories } from '../queries';
	import StoryCard from '../components/StoryCard.svelte';

	const stories$ = useAllStories();
	const stories = $derived(stories$.value ?? []);

	const activeSpace = $derived(getActiveSpace());
	const face$ = useImageByPrimary('face-ref');
	const hasFace = $derived(Boolean(face$.value?.mediaId));
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

	{#if !hasFace && !face$.loading}
		<div class="rounded-xl border border-dashed border-border bg-background/50 p-4">
			<div class="flex items-start gap-3 text-sm">
				<UserCircle size={18} class="mt-0.5 flex-shrink-0 text-primary" />
				<div class="space-y-1">
					<p class="font-medium text-foreground">Lade erst dein Gesichtsbild hoch</p>
					<p class="text-xs text-muted-foreground">
						Ohne Face-Ref im aktiven Space kann kein Comic-Panel generiert werden. Hochladen in
						<a href="/profile/me-images" class="text-primary hover:underline">Profil → Bilder</a>.
					</p>
				</div>
			</div>
		</div>
	{/if}

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
