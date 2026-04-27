<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
	import { Folder, FileText, Plus } from '@mana/shared-icons';
	import {
		useAllSpaces,
		useAllDocuments,
		getPinnedSpaces,
		getDocumentStats,
	} from '$lib/modules/context/queries';
	import { documentTable } from '$lib/modules/context/collections';
	import { RoutePage } from '$lib/components/shell';
	import { _ } from 'svelte-i18n';

	const allSpaces = useAllSpaces();
	const allDocuments = useAllDocuments();

	const spaces = $derived(allSpaces.value);
	const documents = $derived(allDocuments.value);
	const pinnedSpaces = $derived(getPinnedSpaces(spaces));
	const stats = $derived(getDocumentStats(documents));
	const recentDocs = $derived(documents.slice(0, 6));

	async function handleDeleteDoc(id: string) {
		if (!confirm($_('context.home.confirm_delete_doc'))) return;
		await documentTable.delete(id);
	}

	async function handleTogglePinDoc(id: string) {
		const doc = documents.find((d) => d.id === id);
		if (doc) {
			await documentTable.update(id, { pinned: !doc.pinned });
		}
	}
</script>

<svelte:head>
	<title>{$_('context.home.page_title_html')}</title>
</svelte:head>

<RoutePage appId="context">
	<div class="mx-auto max-w-5xl">
		<header class="mb-8">
			<h1 class="text-2xl font-bold">{$_('context.home.title')}</h1>
			<p class="mt-1 text-sm opacity-60">{$_('context.home.subtitle')}</p>
		</header>

		<!-- Stats -->
		<div class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
			<div
				class="rounded-xl border border-border-strong bg-white p-4 text-center dark:border-border dark:bg-card"
			>
				<div class="text-2xl font-bold">{spaces.length}</div>
				<div class="mt-1 text-xs opacity-60">{$_('context.home.stat_spaces')}</div>
			</div>
			<div
				class="rounded-xl border border-border-strong bg-white p-4 text-center dark:border-border dark:bg-card"
			>
				<div class="text-2xl font-bold">{stats.total}</div>
				<div class="mt-1 text-xs opacity-60">{$_('context.home.stat_documents')}</div>
			</div>
			<div
				class="rounded-xl border border-border-strong bg-white p-4 text-center dark:border-border dark:bg-card"
			>
				<div class="text-2xl font-bold">{stats.totalWords.toLocaleString()}</div>
				<div class="mt-1 text-xs opacity-60">{$_('context.home.stat_words')}</div>
			</div>
			<div
				class="rounded-xl border border-border-strong bg-white p-4 text-center dark:border-border dark:bg-card"
			>
				<div class="text-2xl font-bold">{stats.text}/{stats.context}/{stats.prompt}</div>
				<div class="mt-1 text-xs opacity-60">{$_('context.home.stat_split_label')}</div>
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="mb-8 flex gap-3">
			<a
				href="/context/spaces"
				class="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
			>
				<Folder size={16} />
				{$_('context.home.action_spaces')}
			</a>
			<a
				href="/context/documents"
				class="flex items-center gap-2 rounded-lg border border-border-strong px-4 py-2 text-sm font-medium transition-colors hover:bg-muted dark:border-border dark:hover:bg-muted"
			>
				<FileText size={16} />
				{$_('context.home.action_all_documents')}
			</a>
		</div>

		<!-- Pinned Spaces -->
		{#if pinnedSpaces.length > 0}
			<section class="mb-8">
				<h2 class="mb-4 text-lg font-semibold">{$_('context.home.section_pinned')}</h2>
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
					{#each pinnedSpaces as space}
						<a
							href="/context/spaces/{space.id}"
							class="rounded-xl border border-border-strong bg-white p-4 transition-colors hover:shadow-md dark:border-border dark:bg-card"
						>
							<div class="flex items-center gap-3">
								<span
									class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-lg font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
								>
									{space.prefix || space.name[0]?.toUpperCase() || 'S'}
								</span>
								<div>
									<h3 class="font-semibold">{space.name}</h3>
									{#if space.description}
										<p class="text-xs opacity-60 line-clamp-1">{space.description}</p>
									{/if}
								</div>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Recent Documents -->
		{#if recentDocs.length > 0}
			<section>
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-lg font-semibold">{$_('context.home.section_recent')}</h2>
					<a href="/context/documents" class="text-sm text-indigo-600 hover:underline"
						>{$_('context.home.action_show_all')}</a
					>
				</div>
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
					{#each recentDocs as doc}
						<a
							href="/context/documents/{doc.id}"
							class="group rounded-xl border border-border-strong bg-white p-4 transition-colors hover:shadow-md dark:border-border dark:bg-card"
						>
							<div class="flex items-start justify-between">
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<span
											class="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase {doc.type ===
											'text'
												? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
												: doc.type === 'context'
													? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
													: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'}"
										>
											{doc.type}
										</span>
										{#if doc.pinned}
											<span class="text-xs opacity-40">{$_('context.home.badge_pinned')}</span>
										{/if}
									</div>
									<h3 class="mt-1 truncate font-semibold">{doc.title}</h3>
									{#if doc.content}
										<p class="mt-0.5 truncate text-xs opacity-50">
											{doc.content.slice(0, 100)}
										</p>
									{/if}
								</div>
								<button
									onclick={(e) => {
										e.preventDefault();
										handleTogglePinDoc(doc.id);
									}}
									class="ml-2 rounded p-1 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 dark:hover:bg-muted"
									title={doc.pinned ? $_('context.common.unpin') : $_('context.common.pin')}
								>
									{doc.pinned ? '&#9733;' : '&#9734;'}
								</button>
							</div>
							<div class="mt-2 flex items-center gap-3 text-xs opacity-40">
								{#if doc.metadata?.tags && doc.metadata.tags.length > 0}
									{#each doc.metadata.tags.slice(0, 3) as tag}
										<span class="rounded bg-muted px-1.5 py-0.5 dark:bg-muted">{tag}</span>
									{/each}
								{/if}
								<span class="ml-auto">
									{formatDate(new Date(doc.updated_at))}
								</span>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{:else}
			<div
				class="rounded-xl border-2 border-dashed border-border-strong p-12 text-center dark:border-border"
			>
				<FileText size={48} class="mx-auto mb-4 opacity-20" />
				<h3 class="text-lg font-medium opacity-60">{$_('context.home.empty_title')}</h3>
				<p class="mt-1 text-sm opacity-40">
					{$_('context.home.empty_hint')}
				</p>
				<a
					href="/context/spaces"
					class="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
				>
					<Plus size={16} />
					{$_('context.home.empty_action')}
				</a>
			</div>
		{/if}
	</div>
</RoutePage>
