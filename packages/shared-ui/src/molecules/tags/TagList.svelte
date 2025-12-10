<script lang="ts">
	import { PencilSimple, Trash } from '@manacore/shared-icons';
	import { DEFAULT_TAG_COLOR } from './constants';
	import type { Tag } from './constants';

	interface Props {
		tags: Tag[];
		onEdit?: (tag: Tag) => void;
		onDelete?: (tag: Tag) => void;
		onClick?: (tag: Tag) => void;
		layout?: 'grid' | 'list';
		emptyMessage?: string;
		emptyDescription?: string;
		loading?: boolean;
	}

	let {
		tags,
		onEdit,
		onDelete,
		onClick,
		layout = 'grid',
		emptyMessage = 'Keine Tags vorhanden',
		emptyDescription = 'Erstelle deinen ersten Tag',
		loading = false,
	}: Props = $props();

	function getTagColor(tag: Tag): string {
		return tag.color ?? tag.style?.color ?? DEFAULT_TAG_COLOR;
	}

	function handleKeyDown(e: KeyboardEvent, tag: Tag, action: 'click' | 'edit' | 'delete') {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			if (action === 'click' && onClick) onClick(tag);
			if (action === 'edit' && onEdit) onEdit(tag);
			if (action === 'delete' && onDelete) onDelete(tag);
		}
	}

	const gridClasses = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
	const listClasses = 'flex flex-col gap-3';
</script>

{#if loading}
	<!-- Loading Skeleton -->
	<div class={layout === 'grid' ? gridClasses : listClasses}>
		{#each Array(6) as _, i}
			<div
				class="
					flex items-center gap-3 p-4
					bg-gray-100 dark:bg-gray-800
					rounded-xl animate-pulse
				"
			>
				<div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
				<div class="flex-1">
					<div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
				</div>
			</div>
		{/each}
	</div>
{:else if tags.length === 0}
	<!-- Empty State -->
	<div class="flex flex-col items-center justify-center py-12 text-center">
		<div
			class="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
		>
			<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
				></path>
			</svg>
		</div>
		<h3 class="text-lg font-medium text-foreground mb-1">{emptyMessage}</h3>
		<p class="text-sm text-muted-foreground">{emptyDescription}</p>
	</div>
{:else}
	<!-- Tag Grid/List -->
	<div class={layout === 'grid' ? gridClasses : listClasses}>
		{#each tags as tag (tag.id)}
			{@const color = getTagColor(tag)}
			<div
				class="
					group relative flex items-center gap-3 p-4
					bg-white dark:bg-white/5
					border border-gray-200 dark:border-white/10
					rounded-xl
					transition-all duration-200
					hover:shadow-md hover:border-gray-300 dark:hover:border-white/20
					{onClick ? 'cursor-pointer' : ''}
				"
				onclick={() => onClick?.(tag)}
				onkeydown={(e) => handleKeyDown(e, tag, 'click')}
				role={onClick ? 'button' : undefined}
				tabindex={onClick ? 0 : undefined}
			>
				<!-- Color Icon -->
				<div
					class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
					style="background-color: {color}20"
				>
					<div class="w-4 h-4 rounded-full" style="background-color: {color}"></div>
				</div>

				<!-- Tag Name -->
				<span class="flex-1 font-medium text-foreground min-w-0">
					{tag.name}
				</span>

				<!-- Actions -->
				{#if onEdit || onDelete}
					<div class="flex items-center gap-1 flex-shrink-0">
						{#if onEdit}
							<button
								type="button"
								onclick={(e) => {
									e.stopPropagation();
									onEdit(tag);
								}}
								onkeydown={(e) => {
									e.stopPropagation();
									handleKeyDown(e, tag, 'edit');
								}}
								class="
									p-2 rounded-lg
									text-muted-foreground hover:text-foreground
									hover:bg-gray-100 dark:hover:bg-white/10
									transition-colors
								"
								aria-label="Tag bearbeiten"
							>
								<PencilSimple size={16} />
							</button>
						{/if}
						{#if onDelete}
							<button
								type="button"
								onclick={(e) => {
									e.stopPropagation();
									onDelete(tag);
								}}
								onkeydown={(e) => {
									e.stopPropagation();
									handleKeyDown(e, tag, 'delete');
								}}
								class="
									p-2 rounded-lg
									text-muted-foreground hover:text-red-500
									hover:bg-red-50 dark:hover:bg-red-900/20
									transition-colors
								"
								aria-label="Tag löschen"
							>
								<Trash size={16} />
							</button>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}
