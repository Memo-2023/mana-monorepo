<script lang="ts">
	import type { FeatureItem } from './content';

	interface Props {
		item: FeatureItem;
		learnMoreLabel?: string;
		comingSoonLabel?: string;
	}

	let { item, learnMoreLabel = 'Learn more', comingSoonLabel = 'Coming soon' }: Props = $props();
</script>

<div
	class="relative rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
>
	{#if item.comingSoon}
		<span
			class="absolute right-3 top-3 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
		>
			{comingSoonLabel}
		</span>
	{/if}

	<div class="mb-3 flex items-center gap-3">
		{#if item.icon}
			<span class="text-2xl">{item.icon}</span>
		{/if}
		<h3 class="font-semibold text-gray-900 dark:text-gray-100">
			{item.title}
		</h3>
	</div>

	<p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
		{item.description}
	</p>

	{#if item.highlights && item.highlights.length > 0}
		<ul class="mb-3 space-y-1">
			{#each item.highlights as highlight}
				<li class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
					<svg
						class="text-primary-500 mt-0.5 h-4 w-4 flex-shrink-0"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					{highlight}
				</li>
			{/each}
		</ul>
	{/if}

	{#if item.learnMoreUrl}
		<a
			href={item.learnMoreUrl}
			class="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline"
		>
			{learnMoreLabel} →
		</a>
	{/if}
</div>
