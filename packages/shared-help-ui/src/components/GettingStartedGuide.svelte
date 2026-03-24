<script lang="ts">
	import type { GettingStartedGuideProps } from '../types.js';

	let { items, translations }: GettingStartedGuideProps = $props();

	let selectedGuideId = $state<string | null>(items.length > 0 ? items[0].id : null);

	const guide = $derived(items.find((item) => item.id === selectedGuideId) ?? null);

	function getDifficultyLabel(difficulty: string): string {
		return (
			translations.gettingStarted.difficulty[
				difficulty as keyof typeof translations.gettingStarted.difficulty
			] ?? difficulty
		);
	}

	function getDifficultyColor(difficulty: string): string {
		switch (difficulty) {
			case 'beginner':
				return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
			case 'intermediate':
				return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
			case 'advanced':
				return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
			default:
				return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
		}
	}
</script>

{#if items.length === 0}
	<p class="py-8 text-center text-gray-500 dark:text-gray-400">
		{translations.gettingStarted.noItems}
	</p>
{:else}
	<div class="flex flex-col gap-6 lg:flex-row">
		<!-- Guide List -->
		<div class="w-full space-y-2 lg:w-64">
			{#each items as item (item.id)}
				<button
					type="button"
					class="w-full rounded-lg border p-3 text-left transition-colors {selectedGuideId ===
					item.id
						? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
						: 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}"
					onclick={() => (selectedGuideId = item.id)}
				>
					<h4 class="font-medium text-gray-900 dark:text-gray-100">
						{item.title}
					</h4>
					<div class="mt-1 flex flex-wrap items-center gap-2 text-xs">
						<span class={`rounded-full px-2 py-0.5 ${getDifficultyColor(item.difficulty)}`}>
							{getDifficultyLabel(item.difficulty)}
						</span>
						{#if item.estimatedTime}
							<span class="text-gray-500 dark:text-gray-400">
								{item.estimatedTime}
							</span>
						{/if}
					</div>
				</button>
			{/each}
		</div>

		<!-- Guide Content -->
		<div class="flex-1">
			{#if guide}
				<div>
					<h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
						{guide.title}
					</h3>
					<p class="mb-4 text-gray-600 dark:text-gray-400">
						{guide.description}
					</p>

					{#if guide.steps && guide.steps.length > 0}
						<div class="space-y-6">
							{#each guide.steps as step, index}
								<div class="flex gap-4">
									<div
										class="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold"
									>
										{index + 1}
									</div>
									<div class="flex-1">
										<h4 class="mb-2 font-medium text-gray-900 dark:text-gray-100">
											{step.title}
										</h4>
										<div
											class="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400"
										>
											{step.content}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="prose prose-sm dark:prose-invert max-w-none">
							{@html guide.content}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
