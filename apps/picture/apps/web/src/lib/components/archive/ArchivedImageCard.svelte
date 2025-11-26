<script lang="ts">
	import type { Database } from '@picture/shared/types';
	import { showContextMenu } from '$lib/stores/contextMenu';

	type Image = Database['public']['Tables']['images']['Row'];

	interface Props {
		image: Image;
		onclick: () => void;
	}

	let { image, onclick }: Props = $props();
	let imageLoaded = $state(false);

	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		showContextMenu(e.clientX, e.clientY, image);
	}

	function handleImageLoad() {
		imageLoaded = true;
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('de-DE', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(date);
	}
</script>

<button
	{onclick}
	oncontextmenu={handleContextMenu}
	class="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
	type="button"
>
	<img
		src={image.public_url}
		alt={image.prompt}
		class="h-full w-full object-cover transition-opacity duration-300 {imageLoaded ? 'opacity-100' : 'opacity-15'}"
		loading="lazy"
		onload={handleImageLoad}
	/>

	<!-- Overlay on hover -->
	<div
		class="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100"
	>
		<p class="text-base text-white font-medium">{image.prompt}</p>
		<p class="mt-1 text-sm text-gray-300">{formatDate(image.created_at)}</p>
	</div>

	<!-- Archived badge - always visible -->
	<div class="absolute right-2 top-2 rounded-full bg-gray-800/90 px-2 py-1">
		<span class="text-xs font-medium text-white">Archived</span>
	</div>
</button>
