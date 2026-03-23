<script lang="ts">
	/**
	 * TaskListSkeleton - Skeleton matching the notepad list view with CollapsibleSections
	 */

	import { SkeletonBox } from '@manacore/shared-ui';
	import TaskItemSkeleton from './TaskItemSkeleton.svelte';

	interface Props {
		sections?: number;
		tasksPerSection?: number;
	}

	let { sections = 2, tasksPerSection = 3 }: Props = $props();

	// Section widths to vary the title lengths
	const sectionTitleWidths = [60, 80, 100, 70, 90];
</script>

<div class="task-list-skeleton" role="status" aria-label="Aufgaben werden geladen...">
	<div class="notepad">
		<!-- Spiral binding holes -->
		<div class="notepad-holes" aria-hidden="true">
			<span class="hole"></span>
			<span class="hole"></span>
			<span class="hole"></span>
			<span class="hole"></span>
			<span class="hole"></span>
			<span class="hole"></span>
		</div>

		<div class="notepad-content">
			<div class="sections">
				{#each Array(sections) as _, sectionIndex}
					<div class="section" style="opacity: {Math.max(0.5, 1 - sectionIndex * 0.2)};">
						<!-- CollapsibleSection header: icon + title + (count) + chevron -->
						<button class="section-header">
							<!-- Section icon -->
							<SkeletonBox width="20px" height="20px" borderRadius="4px" />
							<!-- Section title -->
							<SkeletonBox
								width="{sectionTitleWidths[sectionIndex % sectionTitleWidths.length]}px"
								height="16px"
								borderRadius="4px"
							/>
							<!-- Count in parentheses -->
							<SkeletonBox width="24px" height="14px" borderRadius="4px" />
							<!-- Chevron (right-aligned) -->
							<div class="chevron-spacer"></div>
							<SkeletonBox width="18px" height="18px" borderRadius="4px" />
						</button>

						<!-- Task items -->
						<div class="tasks">
							{#each Array(tasksPerSection) as _, taskIndex}
								<div style="opacity: {Math.max(0.4, 1 - taskIndex * 0.15)};">
									<TaskItemSkeleton />
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.task-list-skeleton {
		padding-bottom: 100px;
	}

	/* Notepad container - matches +page.svelte .notepad */
	.notepad {
		max-width: 560px;
		margin: 0 auto;
		background: #fffef5;
		border-radius: 0.5rem 0.5rem 0.75rem 0.75rem;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.08),
			0 1px 2px rgba(0, 0, 0, 0.04);
		position: relative;
		padding-top: 1.25rem;
	}

	:global(.dark) .notepad {
		background: #2a2520;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.3),
			0 1px 2px rgba(0, 0, 0, 0.2);
	}

	/* Spiral binding holes */
	.notepad-holes {
		position: absolute;
		top: -6px;
		left: 10%;
		right: 10%;
		display: flex;
		justify-content: space-evenly;
		pointer-events: none;
		z-index: 2;
	}

	.hole {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: hsl(var(--color-background, 0 0% 100%));
		border: 2px solid #c4c4c4;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .hole {
		background: hsl(var(--color-background, 0 0% 7%));
		border-color: #555;
	}

	/* Notepad content with red margin line */
	.notepad-content {
		position: relative;
		padding: 0.75rem 1rem 1.5rem 3.25rem;
		min-height: 200px;
	}

	.notepad-content::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: 2.5rem;
		width: 2px;
		background: #e8b4b8;
		z-index: 1;
	}

	:global(.dark) .notepad-content::before {
		background: rgba(232, 180, 184, 0.4);
	}

	.sections {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section {
		margin-bottom: 0.75rem;
	}

	/* CollapsibleSection header style */
	.section-header {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0;
		cursor: default;
		background: none;
		border: none;
	}

	.chevron-spacer {
		flex: 1;
	}

	.tasks {
		display: flex;
		flex-direction: column;
		margin-top: 0.75rem;
		padding-left: 0.25rem;
	}

	@media (max-width: 640px) {
		.notepad {
			max-width: 100%;
			border-radius: 0;
		}

		.notepad-content {
			padding-left: 2.75rem;
		}

		.notepad-content::before {
			left: 2rem;
		}
	}
</style>
