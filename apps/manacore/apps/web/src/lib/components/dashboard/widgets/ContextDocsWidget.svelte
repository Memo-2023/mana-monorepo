<script lang="ts">
	/**
	 * ContextDocsWidget - Recent documents and spaces
	 */

	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { contextService, type ContextDocument, type ContextSpace } from '$lib/api/services';
	import { APP_URLS } from '@manacore/shared-branding';
	import WidgetSkeleton from '../WidgetSkeleton.svelte';
	import WidgetError from '../WidgetError.svelte';

	const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
	const contextUrl = isDev ? APP_URLS.context.dev : APP_URLS.context.prod;

	let state = $state<'loading' | 'success' | 'error'>('loading');
	let documents = $state<ContextDocument[]>([]);
	let spaces = $state<ContextSpace[]>([]);
	let error = $state<string | null>(null);
	let retrying = $state(false);
	let retryCount = $state(0);

	const MAX_DISPLAY = 5;

	const typeIcons: Record<string, string> = {
		text: '📝',
		context: '🧠',
		prompt: '💬',
	};

	async function load() {
		state = 'loading';
		retrying = true;

		const [docsResult, spacesResult] = await Promise.all([
			contextService.getRecentDocuments(MAX_DISPLAY),
			contextService.getSpaces(),
		]);

		if (docsResult.data || spacesResult.data) {
			documents = docsResult.data || [];
			spaces = spacesResult.data || [];
			state = 'success';
			retryCount = 0;
		} else {
			error = docsResult.error || spacesResult.error;
			state = 'error';

			const isServiceUnavailable = error?.includes('nicht erreichbar');
			if (!isServiceUnavailable && retryCount < 3) {
				retryCount++;
				setTimeout(load, 5000 * retryCount);
			}
		}

		retrying = false;
	}

	onMount(load);

	function getSpaceName(spaceId: string): string | null {
		return spaces.find((s) => s.id === spaceId)?.name || null;
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('de-DE', {
			day: 'numeric',
			month: 'short',
		});
	}
</script>

<div>
	<div class="mb-3 flex items-center justify-between">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>🧠</span>
			{$_('dashboard.widgets.context.title')}
		</h3>
		{#if spaces.length > 0}
			<span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
				{spaces.length} Spaces
			</span>
		{/if}
	</div>

	{#if state === 'loading'}
		<WidgetSkeleton lines={4} />
	{:else if state === 'error'}
		<WidgetError {error} onRetry={load} {retrying} />
	{:else if documents.length === 0 && spaces.length === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">📚</div>
			<p class="text-sm text-muted-foreground">
				{$_('dashboard.widgets.context.empty')}
			</p>
			<a
				href={contextUrl}
				target="_blank"
				rel="noopener"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				Space erstellen
			</a>
		</div>
	{:else}
		<!-- Recent documents -->
		{#if documents.length > 0}
			<div class="space-y-1">
				{#each documents as doc}
					<a
						href="{contextUrl}/doc/{doc.shortId}"
						target="_blank"
						rel="noopener"
						class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-hover"
					>
						<span class="text-base">{typeIcons[doc.type] || '📄'}</span>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{doc.title}</p>
							{@const spaceName = getSpaceName(doc.spaceId)}
							{#if spaceName}
								<p class="truncate text-xs text-muted-foreground">{spaceName}</p>
							{/if}
						</div>
						<span class="flex-shrink-0 text-xs text-muted-foreground">
							{formatDate(doc.updatedAt)}
						</span>
					</a>
				{/each}
			</div>
		{:else}
			<!-- No documents but has spaces -->
			<div class="mb-3 space-y-1">
				{#each spaces.slice(0, 3) as space}
					<a
						href="{contextUrl}/space/{space.id}"
						target="_blank"
						rel="noopener"
						class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-hover"
					>
						<span class="text-base">{space.pinned ? '📌' : '📁'}</span>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{space.name}</p>
							{#if space.description}
								<p class="truncate text-xs text-muted-foreground">{space.description}</p>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		{/if}

		<div class="mt-3 text-center">
			<a
				href={contextUrl}
				target="_blank"
				rel="noopener"
				class="text-sm text-primary hover:underline"
			>
				Alle Dokumente
			</a>
		</div>
	{/if}
</div>
