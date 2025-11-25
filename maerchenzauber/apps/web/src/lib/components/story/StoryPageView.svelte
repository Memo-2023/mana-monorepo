<script lang="ts">
	import type { StoryPage } from '$lib/types/story';

	interface Props {
		page: StoryPage;
		pageNumber: number;
		totalPages: number;
	}

	let { page, pageNumber, totalPages }: Props = $props();
</script>

<div class="relative flex h-full w-full flex-col items-center justify-center p-4 sm:p-8">
	<!-- Image Container -->
	<div class="relative w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl">
		<!-- Story Image -->
		<img
			src={page.image}
			alt="Seite {pageNumber}"
			class="aspect-[4/3] w-full object-cover"
			loading="eager"
		/>

		<!-- Text Overlay -->
		<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 sm:p-6">
			<p class="text-base leading-relaxed text-white sm:text-lg lg:text-xl">
				{page.story}
			</p>
		</div>

		<!-- Page Number Badge -->
		<div class="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1 text-sm font-medium text-white backdrop-blur">
			{pageNumber} / {totalPages}
		</div>
	</div>
</div>
