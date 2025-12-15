<script lang="ts">
	import { TagBadge, type Tag } from '@manacore/shared-ui';
	import { CaretDown, CaretRight, Pencil, FolderSimple } from '@manacore/shared-icons';
	import type { EventTag, EventTagGroup } from '@calendar/shared';

	interface Props {
		groups: EventTagGroup[];
		tags: EventTag[];
		ungroupedLabel?: string;
		onEditTag: (tag: EventTag) => void;
		onEditGroup?: (group: EventTagGroup) => void;
		loading?: boolean;
		emptyMessage?: string;
	}

	let {
		groups,
		tags,
		ungroupedLabel = 'Ohne Gruppe',
		onEditTag,
		onEditGroup,
		loading = false,
		emptyMessage = 'Keine Tags vorhanden',
	}: Props = $props();

	// Track collapsed state (inverted - we track what's collapsed, not expanded)
	// This way new groups are automatically expanded
	let collapsedGroups = $state<Set<string | null>>(new Set());

	function toggleGroup(groupId: string | null) {
		const newSet = new Set(collapsedGroups);
		if (newSet.has(groupId)) {
			newSet.delete(groupId);
		} else {
			newSet.add(groupId);
		}
		collapsedGroups = newSet;
	}

	function isExpanded(groupId: string | null): boolean {
		return !collapsedGroups.has(groupId);
	}

	// Get tags for a specific group
	function getTagsForGroup(groupId: string | null): EventTag[] {
		return tags.filter((t) => (t.groupId ?? null) === groupId);
	}

	// Convert EventTag to Tag for TagBadge
	function toTag(eventTag: EventTag): Tag {
		return {
			id: eventTag.id,
			name: eventTag.name,
			color: eventTag.color,
		};
	}

	// Get ungrouped tags
	const ungroupedTags = $derived(getTagsForGroup(null));
	const hasUngroupedTags = $derived(ungroupedTags.length > 0);
	const totalTags = $derived(tags.length);
</script>

{#if loading}
	<div class="flex justify-center py-8">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
	</div>
{:else if totalTags === 0}
	<div class="text-center py-12">
		<div class="text-muted-foreground mb-2">{emptyMessage}</div>
	</div>
{:else}
	<div class="space-y-2">
		<!-- Groups with their tags -->
		{#each groups as group (group.id)}
			{@const groupTags = getTagsForGroup(group.id)}
			{#if groupTags.length > 0}
				<div class="group-section">
					<!-- Group Header -->
					<button type="button" onclick={() => toggleGroup(group.id)} class="group-header">
						<div class="flex items-center gap-2">
							{#if isExpanded(group.id)}
								<CaretDown size={16} weight="bold" class="text-muted-foreground" />
							{:else}
								<CaretRight size={16} weight="bold" class="text-muted-foreground" />
							{/if}
							<div
								class="w-3 h-3 rounded-full flex-shrink-0"
								style="background-color: {group.color}"
							></div>
							<span class="font-medium">{group.name}</span>
							<span class="text-xs text-muted-foreground">({groupTags.length})</span>
						</div>
						{#if onEditGroup}
							<button
								type="button"
								onclick={(e) => {
									e.stopPropagation();
									onEditGroup(group);
								}}
								class="edit-group-btn"
								aria-label="Gruppe bearbeiten"
							>
								<Pencil size={14} />
							</button>
						{/if}
					</button>

					<!-- Tags in this group -->
					{#if isExpanded(group.id)}
						<div class="tags-container">
							{#each groupTags as tag (tag.id)}
								<button type="button" class="tag-pill" onclick={() => onEditTag(tag)}>
									<TagBadge tag={toTag(tag)} />
									<span class="edit-icon">
										<Pencil size={12} />
									</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		{/each}

		<!-- Ungrouped tags -->
		{#if hasUngroupedTags}
			<div class="group-section">
				<!-- Ungrouped Header -->
				<button type="button" onclick={() => toggleGroup(null)} class="group-header">
					<div class="flex items-center gap-2">
						{#if isExpanded(null)}
							<CaretDown size={16} weight="bold" class="text-muted-foreground" />
						{:else}
							<CaretRight size={16} weight="bold" class="text-muted-foreground" />
						{/if}
						<FolderSimple size={14} class="text-muted-foreground" />
						<span class="font-medium text-muted-foreground">{ungroupedLabel}</span>
						<span class="text-xs text-muted-foreground">({ungroupedTags.length})</span>
					</div>
				</button>

				<!-- Ungrouped Tags -->
				{#if isExpanded(null)}
					<div class="tags-container">
						{#each ungroupedTags as tag (tag.id)}
							<button type="button" class="tag-pill" onclick={() => onEditTag(tag)}>
								<TagBadge tag={toTag(tag)} />
								<span class="edit-icon">
									<Pencil size={12} />
								</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.group-section {
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		overflow: hidden;
		background: hsl(var(--card));
	}

	.group-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.75rem 1rem;
		background: hsl(var(--muted) / 0.3);
		border: none;
		cursor: pointer;
		transition: background 0.2s ease;
		text-align: left;
	}

	.group-header:hover {
		background: hsl(var(--muted) / 0.5);
	}

	.edit-group-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.375rem;
		border-radius: 0.375rem;
		color: hsl(var(--muted-foreground));
		background: transparent;
		border: none;
		cursor: pointer;
		opacity: 0;
		transition: all 0.2s ease;
	}

	.group-header:hover .edit-group-btn {
		opacity: 1;
	}

	.edit-group-btn:hover {
		color: hsl(var(--primary));
		background: hsl(var(--primary) / 0.1);
	}

	.tags-container {
		padding: 0.75rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0;
		padding-right: 0.5rem;
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: 9999px;
		transition: all 0.15s ease;
	}

	.tag-pill:hover {
		background: hsl(var(--muted) / 0.5);
	}

	.edit-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: hsl(var(--muted-foreground));
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.tag-pill:hover .edit-icon {
		opacity: 1;
	}
</style>
