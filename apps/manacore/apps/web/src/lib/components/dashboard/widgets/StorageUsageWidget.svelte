<script lang="ts">
	/**
	 * StorageUsageWidget - Storage stats and recent files (local-first)
	 */

	import { _ } from 'svelte-i18n';
	import { useStorageStats } from '$lib/data/cross-app-queries';
	import { APP_URLS } from '@manacore/shared-branding';

	const stats = useStorageStats();

	const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
	const storageUrl = isDev ? APP_URLS.storage.dev : APP_URLS.storage.prod;

	function formatSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const units = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
	}

	function getFileIcon(mimeType?: string): string {
		if (!mimeType) return '📄';
		if (mimeType.startsWith('image/')) return '🖼️';
		if (mimeType.startsWith('video/')) return '🎬';
		if (mimeType.startsWith('audio/')) return '🎵';
		if (mimeType.includes('pdf')) return '📕';
		if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
		if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
		return '📄';
	}
</script>

<div>
	<div class="mb-3">
		<h3 class="flex items-center gap-2 text-lg font-semibold">
			<span>💾</span>
			{$_('dashboard.widgets.storage.title')}
		</h3>
	</div>

	{#if stats.loading}
		<div class="space-y-2">
			{#each Array(3) as _}
				<div class="h-8 animate-pulse rounded bg-surface-hover"></div>
			{/each}
		</div>
	{:else}
		<div class="mb-3 flex gap-4 text-sm">
			<div>
				<span class="font-semibold">{stats.value.totalFiles}</span>
				<span class="text-muted-foreground"> Dateien</span>
			</div>
			<div>
				<span class="font-semibold">{formatSize(stats.value.totalSize)}</span>
				<span class="text-muted-foreground"> gesamt</span>
			</div>
		</div>

		{#if stats.value.recentFiles.length > 0}
			<div class="space-y-1">
				{#each stats.value.recentFiles as file (file.id)}
					<div class="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-hover">
						<span>{getFileIcon(file.mimeType)}</span>
						<span class="min-w-0 flex-1 truncate text-sm">{file.name}</span>
						<span class="flex-shrink-0 text-xs text-muted-foreground">
							{formatSize(file.size || 0)}
						</span>
					</div>
				{/each}
			</div>
		{/if}

		<a
			href={storageUrl}
			target="_blank"
			rel="noopener"
			class="mt-2 block text-center text-sm text-primary hover:underline"
		>
			Storage öffnen →
		</a>
	{/if}
</div>
