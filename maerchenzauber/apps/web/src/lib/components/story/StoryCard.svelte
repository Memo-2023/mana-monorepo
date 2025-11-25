<script lang="ts">
	import type { Story } from '$lib/types/story';

	interface Props {
		story: Story;
	}

	let { story }: Props = $props();

	// Get cover image (first page or character image)
	let coverImage = $derived(
		story.pages?.[0]?.image || story.characterImageUrl || '/images/placeholder-story.png'
	);

	// Format date
	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: 'short',
		});
	}
</script>

<a
	href="/stories/{story.id}"
	class="group relative overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:shadow-xl dark:bg-gray-800"
>
	<!-- Cover Image -->
	<div class="aspect-[4/3] overflow-hidden">
		<img
			src={coverImage}
			alt={story.title || 'Geschichte'}
			class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
			loading="lazy"
		/>

		<!-- Favorite Badge -->
		{#if story.is_favorite}
			<div class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md">
				<svg class="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
					<path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
				</svg>
			</div>
		{/if}

		<!-- Gradient Overlay -->
		<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
	</div>

	<!-- Content -->
	<div class="absolute bottom-0 left-0 right-0 p-3">
		<h3 class="line-clamp-1 text-sm font-semibold text-white">
			{story.title || 'Unbekannte Geschichte'}
		</h3>
		<div class="mt-1 flex items-center gap-2 text-xs text-white/80">
			{#if story.characterName}
				<span class="flex items-center gap-1">
					<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
					{story.characterName}
				</span>
				<span>•</span>
			{/if}
			<span>{formatDate(story.createdAt)}</span>
			{#if story.pages?.length}
				<span>•</span>
				<span>{story.pages.length} Seiten</span>
			{/if}
		</div>
	</div>
</a>
