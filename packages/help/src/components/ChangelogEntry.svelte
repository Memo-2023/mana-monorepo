<script lang="ts">
	import type { ChangelogEntryProps } from '../ui-types';

	let { item, translations }: ChangelogEntryProps = $props();

	let expanded = $state(false);

	function getTypeColor(type: string): string {
		switch (type) {
			case 'major':
				return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
			case 'minor':
				return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
			case 'patch':
				return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
			case 'beta':
				return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
			default:
				return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
		}
	}

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	}

	// svelte-ignore state_referenced_locally
	const typeLabels = translations.changelog.types;
	// svelte-ignore state_referenced_locally
	const changeLabels = translations.changelog.labels;
</script>

<div class="border-b border-gray-200 py-4 dark:border-gray-700">
	<button
		type="button"
		class="flex w-full items-start justify-between text-left"
		onclick={() => (expanded = !expanded)}
	>
		<div>
			<div class="flex flex-wrap items-center gap-2">
				<span class="font-mono text-lg font-semibold text-gray-900 dark:text-gray-100">
					v{item.version}
				</span>
				<span class={`rounded-full px-2 py-0.5 text-xs font-medium ${getTypeColor(item.type)}`}>
					{typeLabels[item.type] ?? item.type}
				</span>
				{#if item.highlighted}
					<span
						class="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
					>
						Featured
					</span>
				{/if}
			</div>
			<h4 class="mt-1 font-medium text-gray-800 dark:text-gray-200">
				{item.title}
			</h4>
			<p class="text-sm text-gray-500 dark:text-gray-400">
				{formatDate(item.releaseDate)}
			</p>
		</div>
		<span
			class="mt-1 text-gray-500 transition-transform duration-200 dark:text-gray-400"
			class:rotate-180={expanded}
		>
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</span>
	</button>

	{#if expanded}
		<div class="mt-4 space-y-4">
			{#if item.summary}
				<p class="text-gray-600 dark:text-gray-400">{item.summary}</p>
			{/if}

			{#if item.changes}
				{#if item.changes.features && item.changes.features.length > 0}
					<div>
						<h5 class="mb-2 text-sm font-semibold text-green-600 dark:text-green-400">
							{changeLabels.features}
						</h5>
						<ul class="space-y-1">
							{#each item.changes.features as change}
								<li class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
									<span class="text-green-500">+</span>
									<span>
										<strong>{change.title}</strong>
										{#if change.description}
											- {change.description}
										{/if}
									</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if item.changes.improvements && item.changes.improvements.length > 0}
					<div>
						<h5 class="mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
							{changeLabels.improvements}
						</h5>
						<ul class="space-y-1">
							{#each item.changes.improvements as change}
								<li class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
									<span class="text-blue-500">↑</span>
									<span>
										<strong>{change.title}</strong>
										{#if change.description}
											- {change.description}
										{/if}
									</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if item.changes.bugfixes && item.changes.bugfixes.length > 0}
					<div>
						<h5 class="mb-2 text-sm font-semibold text-red-600 dark:text-red-400">
							{changeLabels.bugFixes}
						</h5>
						<ul class="space-y-1">
							{#each item.changes.bugfixes as change}
								<li class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
									<span class="text-red-500">×</span>
									<span>
										<strong>{change.title}</strong>
										{#if change.description}
											- {change.description}
										{/if}
									</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			{/if}

			{#if item.content}
				<div class="prose prose-sm dark:prose-invert max-w-none">
					{@html item.content}
				</div>
			{/if}
		</div>
	{/if}
</div>
