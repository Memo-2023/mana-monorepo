<script lang="ts">
	interface Props {
		title: string;
		description?: string;
		actionLabel?: string;
		actionHref?: string;
		icon?: 'book' | 'users' | 'search' | 'archive';
	}

	let { title, description, actionLabel, actionHref, icon = 'book' }: Props = $props();

	const iconPaths: Record<string, string> = {
		book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
		users:
			'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
		search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
		archive: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
	};
</script>

<div
	class="flex flex-col items-center justify-center rounded-2xl bg-gray-50 px-6 py-12 text-center dark:bg-gray-800/50"
>
	<!-- Icon -->
	<div
		class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/30"
	>
		<svg
			class="h-8 w-8 text-pink-500 dark:text-pink-400"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={iconPaths[icon]} />
		</svg>
	</div>

	<!-- Title -->
	<h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
		{title}
	</h3>

	<!-- Description -->
	{#if description}
		<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
			{description}
		</p>
	{/if}

	<!-- Action Button -->
	{#if actionLabel && actionHref}
		<a
			href={actionHref}
			class="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-pink-600 hover:to-purple-700 hover:shadow-lg"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			{actionLabel}
		</a>
	{/if}
</div>
