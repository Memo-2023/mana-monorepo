<script lang="ts">
	import type { ContentNode } from '$lib/types/content';

	interface Props {
		node: ContentNode;
		href: string;
	}

	let { node, href }: Props = $props();

	// Get the primary image from attachments or fallback to image_url
	let primaryImage = $derived(node.image_url);

	// For character portraits, use object-top to show faces
	let imageObjectPosition = $derived(node.kind === 'character' ? 'object-top' : 'object-center');

	// Get aspect ratio class based on node kind
	let aspectClass = $derived(() => {
		switch (node.kind) {
			case 'world':
			case 'place':
				return 'aspect-[21/9]'; // Ultrawide for worlds and places
			case 'character':
				return 'aspect-[9/16]'; // Portrait for characters
			case 'object':
			case 'story':
			default:
				return 'aspect-square'; // Square for objects and stories
		}
	});
</script>

<a
	{href}
	class="overflow-hidden rounded-lg bg-theme-surface shadow transition-all hover:shadow-md hover:-translate-y-0.5"
>
	{#if primaryImage}
		<div class="{aspectClass} w-full bg-theme-elevated">
			<img
				src={primaryImage}
				alt={node.title}
				class="h-full w-full object-cover {imageObjectPosition}"
				loading="lazy"
			/>
		</div>
	{/if}

	<div class="px-4 py-5 sm:p-6">
		<h3 class="text-lg font-medium text-theme-text-primary">{node.title}</h3>
		{#if node.summary}
			<p class="mt-1 line-clamp-2 text-sm text-theme-text-secondary">{node.summary}</p>
		{/if}
		<div class="mt-3 flex items-center justify-between">
			<span
				class="inline-flex items-center rounded-full bg-theme-elevated px-2.5 py-0.5 text-xs font-medium text-theme-text-primary"
			>
				{node.visibility}
			</span>
			{#if node.tags && node.tags.length > 0}
				<div class="flex space-x-1">
					{#each node.tags.slice(0, 2) as tag}
						<span
							class="bg-theme-primary-100/50 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-theme-primary-800"
						>
							{tag}
						</span>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</a>
