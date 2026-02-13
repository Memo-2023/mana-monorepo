<script lang="ts">
	/**
	 * StorageUsageWidget - Displays storage usage and recent files
	 */

	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { storageService, type StorageStats } from '$lib/api/services/storage';
	import WidgetSkeleton from '../WidgetSkeleton.svelte';
	import WidgetError from '../WidgetError.svelte';

	let state = $state<'loading' | 'success' | 'error'>('loading');
	let data = $state<StorageStats | null>(null);
	let error = $state<string | null>(null);
	let retrying = $state(false);

	async function load() {
		state = 'loading';
		retrying = true;

		try {
			const result = await storageService.getStats();

			if (result.error) {
				throw new Error(result.error);
			}

			data = result.data;
			state = 'success';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load storage stats';
			state = 'error';
		} finally {
			retrying = false;
		}
	}

	onMount(load);

	function formatSize(bytes: number): string {
		return storageService.formatSize(bytes);
	}

	function getFileIcon(mimeType: string): string {
		if (mimeType.startsWith('image/')) return '🖼️';
		if (mimeType.startsWith('video/')) return '🎬';
		if (mimeType.startsWith('audio/')) return '🎵';
		if (mimeType.includes('pdf')) return '📄';
		if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar'))
			return '📦';
		if (mimeType.includes('text') || mimeType.includes('document')) return '📝';
		if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
		return '📁';
	}
</script>

<div>
	<h3 class="mb-3 flex items-center gap-2 text-lg font-semibold">
		<span>💾</span>
		{$_('dashboard.widgets.storage.title')}
	</h3>

	{#if state === 'loading'}
		<WidgetSkeleton lines={4} />
	{:else if state === 'error'}
		<WidgetError {error} onRetry={load} {retrying} />
	{:else if data}
		<div class="space-y-4">
			<!-- Storage Stats -->
			<div class="grid grid-cols-2 gap-3">
				<div class="rounded-lg bg-muted/50 p-3">
					<p class="text-muted-foreground text-xs">{$_('dashboard.widgets.storage.total_size')}</p>
					<p class="text-xl font-bold">{formatSize(data.totalSize)}</p>
				</div>
				<div class="rounded-lg bg-muted/50 p-3">
					<p class="text-muted-foreground text-xs">{$_('dashboard.widgets.storage.files')}</p>
					<p class="text-xl font-bold">{data.totalFiles}</p>
				</div>
			</div>

			<!-- Recent Files -->
			{#if data.recentFiles && data.recentFiles.length > 0}
				<div>
					<p class="text-muted-foreground mb-2 text-sm font-medium">
						{$_('dashboard.widgets.storage.recent')}
					</p>
					<ul class="space-y-2">
						{#each data.recentFiles.slice(0, 3) as file}
							<li class="flex items-center gap-2 text-sm">
								<span>{getFileIcon(file.mimeType)}</span>
								<span class="flex-1 truncate">{file.name}</span>
								<span class="text-muted-foreground text-xs">{formatSize(file.size)}</span>
							</li>
						{/each}
					</ul>
				</div>
			{:else}
				<p class="text-muted-foreground text-sm">{$_('dashboard.widgets.storage.empty')}</p>
			{/if}

			<a
				href="https://storage.mana.how"
				target="_blank"
				rel="noopener"
				class="mt-2 block w-full rounded-lg bg-primary/10 py-2 text-center text-sm font-medium text-primary hover:bg-primary/20"
			>
				{$_('dashboard.widgets.storage.open')}
			</a>
		</div>
	{/if}
</div>
