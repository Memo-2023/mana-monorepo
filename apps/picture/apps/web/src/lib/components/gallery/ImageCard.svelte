<script lang="ts">
	import type { Database } from '@picture/shared/types';
	import type { ViewMode } from '$lib/stores/view';
	import { showContextMenu } from '$lib/stores/contextMenu';

	type Image = Database['public']['Tables']['images']['Row'];

	interface Props {
		image: Image;
		onclick?: () => void;
		viewMode?: ViewMode;
	}

	let { image, onclick, viewMode = 'grid3' }: Props = $props();
	let imageLoaded = $state(false);

	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		showContextMenu(e.clientX, e.clientY, image);
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('de-DE', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		}).format(date);
	}

	function handleImageLoad() {
		imageLoaded = true;
	}

	// Different aspect ratios based on view mode
	const aspectClass = $derived(viewMode === 'single' ? 'aspect-[4/3]' : 'aspect-square');

	// Text size based on view mode
	const textSizeClass = $derived(
		viewMode === 'single' ? 'text-base' : viewMode === 'grid3' ? 'text-sm' : 'text-xs'
	);
</script>

<button
	class="group relative overflow-hidden rounded-lg bg-gray-100 transition-all hover:shadow-xl dark:bg-gray-800"
	{onclick}
	oncontextmenu={handleContextMenu}
	type="button"
>
	<div class="w-full {aspectClass}">
		<img
			src={image.public_url}
			alt={image.prompt}
			class="h-full w-full object-cover transition-opacity duration-300 {imageLoaded
				? 'opacity-100'
				: 'opacity-15'}"
			loading="lazy"
			onload={handleImageLoad}
		/>
	</div>

	<div
		class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
	>
		<div class="absolute bottom-0 left-0 right-0 p-4 text-left">
			<p class="mb-1 text-base font-medium text-white">
				{image.prompt}
			</p>
			{#if viewMode !== 'grid5'}
				<p class="text-sm text-white/80">
					{formatDate(image.created_at)}
				</p>
			{/if}
		</div>
	</div>

	{#if image.archived_at}
		<div class="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
			Archived
		</div>
	{/if}
</button>
