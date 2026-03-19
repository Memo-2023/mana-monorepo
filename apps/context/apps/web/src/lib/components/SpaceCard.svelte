<script lang="ts">
	import type { Space } from '$lib/types';
	import { formatDate } from '$lib/utils/text';
	import { PushPin, Trash, PencilSimple, Folder } from '@manacore/shared-icons';

	interface Props {
		space: Space;
		onTogglePin?: (id: string) => void;
		onDelete?: (id: string) => void;
		onEdit?: (space: Space) => void;
	}

	let { space, onTogglePin, onDelete, onEdit }: Props = $props();

	let showActions = $state(false);
</script>

<a
	href="/spaces/{space.id}"
	class="block card p-4 hover:border-primary/50 transition-all group relative"
	onmouseenter={() => (showActions = true)}
	onmouseleave={() => (showActions = false)}
>
	<div class="flex items-start gap-3">
		<div class="p-2 rounded-lg bg-sky-500/10 text-sky-500">
			<Folder size={24} />
		</div>
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2">
				<h3 class="font-semibold text-foreground truncate">{space.name}</h3>
				{#if space.pinned}
					<PushPin size={14} class="text-primary shrink-0" />
				{/if}
			</div>
			{#if space.description}
				<p class="text-sm text-muted-foreground mt-1 line-clamp-2">{space.description}</p>
			{/if}
			<p class="text-xs text-muted-foreground mt-2">{formatDate(space.created_at)}</p>
		</div>
	</div>

	{#if showActions}
		<div class="absolute top-2 right-2 flex gap-1">
			{#if onTogglePin}
				<button
					onclick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						onTogglePin(space.id);
					}}
					class="p-1.5 rounded-md hover:bg-muted transition-colors"
					title={space.pinned ? 'Lösen' : 'Anheften'}
				>
					<PushPin size={14} class={space.pinned ? 'text-primary' : 'text-muted-foreground'} />
				</button>
			{/if}
			{#if onEdit}
				<button
					onclick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						onEdit(space);
					}}
					class="p-1.5 rounded-md hover:bg-muted transition-colors"
					title="Bearbeiten"
				>
					<PencilSimple size={14} class="text-muted-foreground" />
				</button>
			{/if}
			{#if onDelete}
				<button
					onclick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						onDelete(space.id);
					}}
					class="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
					title="Löschen"
				>
					<Trash size={14} class="text-destructive" />
				</button>
			{/if}
		</div>
	{/if}
</a>
