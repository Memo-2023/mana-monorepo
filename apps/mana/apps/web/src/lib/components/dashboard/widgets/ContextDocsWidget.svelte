<script lang="ts">
	/**
	 * ContextDocsWidget - Recent documents and spaces (local-first)
	 */

	import { _ } from 'svelte-i18n';
	import { useRecentDocuments, useSpaces } from '$lib/data/cross-app-queries';

	const docs = useRecentDocuments(5);
	const spaces = useSpaces();

	function getSpaceName(spaceId: string | null | undefined): string {
		if (!spaceId) return '';
		const space = (spaces.value ?? []).find((s) => s.id === spaceId);
		return space?.name ?? '';
	}

	function formatDate(dateStr?: string): string {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
	}

	const typeIcons: Record<string, string> = {
		text: '📝',
		context: '📋',
		prompt: '💡',
	};
</script>

<div>
	<div class="mb-3">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>📝</span>
			{$_('dashboard.widgets.context.title')}
		</h3>
	</div>

	{#if docs.loading}
		<div class="space-y-2">
			{#each Array(3) as _}
				<div class="h-8 animate-pulse rounded bg-surface-hover"></div>
			{/each}
		</div>
	{:else if (docs.value ?? []).length === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">📝</div>
			<p class="text-sm text-muted-foreground">{$_('dashboard.widgets.context.empty')}</p>
		</div>
	{:else}
		<div class="space-y-1">
			{#each docs.value ?? [] as doc (doc.id)}
				<a
					href="/context/documents/{doc.id}"
					class="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-hover"
				>
					<span>{typeIcons[doc.type ?? 'text'] ?? '📄'}</span>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{doc.title}</p>
						{#if getSpaceName(doc.contextSpaceId)}
							<p class="truncate text-xs text-muted-foreground">
								{getSpaceName(doc.contextSpaceId)}
							</p>
						{/if}
					</div>
					<span class="flex-shrink-0 text-xs text-muted-foreground">
						{formatDate(doc.updatedAt)}
					</span>
				</a>
			{/each}
		</div>
	{/if}
</div>
