<script lang="ts">
	import type { Document } from '$lib/types';
	import { formatDate, truncateText } from '$lib/utils/text';
	import { PushPin, Trash, FileText, Notebook, Lightning } from '@manacore/shared-icons';

	interface Props {
		document: Document;
		onTogglePin?: (id: string) => void;
		onDelete?: (id: string) => void;
	}

	let { document: doc, onTogglePin, onDelete }: Props = $props();

	let showActions = $state(false);

	const typeConfig = {
		text: { icon: FileText, label: 'Text', color: 'text-blue-500 bg-blue-500/10' },
		context: { icon: Notebook, label: 'Kontext', color: 'text-amber-500 bg-amber-500/10' },
		prompt: { icon: Lightning, label: 'Prompt', color: 'text-violet-500 bg-violet-500/10' },
	};

	let config = $derived(typeConfig[doc.type] || typeConfig.text);
</script>

<a
	href="/documents/{doc.id}"
	class="block card p-4 hover:border-primary/50 transition-all group relative"
	onmouseenter={() => (showActions = true)}
	onmouseleave={() => (showActions = false)}
>
	<div class="flex items-start gap-3">
		<div class="p-2 rounded-lg {config.color} shrink-0">
			<config.icon size={20} />
		</div>
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2">
				<h3 class="font-medium text-foreground truncate">{doc.title}</h3>
				{#if doc.pinned}
					<PushPin size={14} class="text-primary shrink-0" />
				{/if}
			</div>
			{#if doc.content}
				<p class="text-sm text-muted-foreground mt-1 line-clamp-2">
					{truncateText(doc.content.replace(/^#.*\n?/, ''), 150)}
				</p>
			{/if}
			<div class="flex items-center gap-3 mt-2">
				<span class="text-xs px-1.5 py-0.5 rounded {config.color} font-medium">
					{config.label}
				</span>
				{#if doc.metadata?.tags?.length}
					{#each doc.metadata.tags.slice(0, 3) as tag}
						<span class="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
							{tag}
						</span>
					{/each}
				{/if}
				<span class="text-xs text-muted-foreground ml-auto">{formatDate(doc.updated_at)}</span>
			</div>
		</div>
	</div>

	{#if showActions}
		<div class="absolute top-2 right-2 flex gap-1">
			{#if onTogglePin}
				<button
					onclick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						onTogglePin(doc.id);
					}}
					class="p-1.5 rounded-md hover:bg-muted transition-colors"
					title={doc.pinned ? 'Lösen' : 'Anheften'}
				>
					<PushPin size={14} class={doc.pinned ? 'text-primary' : 'text-muted-foreground'} />
				</button>
			{/if}
			{#if onDelete}
				<button
					onclick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						onDelete(doc.id);
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
