<!--
  /uload/settings — uLoad data overview, JSON export, clear-local-data.
  Reached via the ⚙ button in the uLoad module; not a workbench card.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { Trash, DownloadSimple } from '@mana/shared-icons';
	import { linkTable, uloadTagTable, uloadFolderTable, linkTagTable } from '$lib/modules/uload';
	import { decryptRecords } from '$lib/data/crypto';
	import { useAllLinks, useAllTags, useAllFolders } from '$lib/modules/uload';
	import { toast } from 'svelte-sonner';
	import { RoutePage } from '$lib/components/shell';

	const links = useAllLinks();
	const tags = useAllTags();
	const folders = useAllFolders();

	async function clearAllData() {
		if (!confirm($_('uload.settings_route.confirm_clear'))) return;

		await linkTable.clear();
		await uloadTagTable.clear();
		await uloadFolderTable.clear();
		await linkTagTable.clear();
		toast.success($_('uload.settings_route.toast_cleared'));
	}

	async function exportData() {
		const rawLinks = await linkTable.toArray();
		const allLinks = await decryptRecords('links', rawLinks);
		const allTags = await uloadTagTable.toArray();
		const allFolders = await uloadFolderTable.toArray();
		const allLinkTags = await linkTagTable.toArray();

		const data = {
			exportedAt: new Date().toISOString(),
			links: allLinks,
			tags: allTags,
			folders: allFolders,
			linkTags: allLinkTags,
		};

		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `uload-export-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success($_('uload.settings_route.toast_exported'));
	}
</script>

<svelte:head>
	<title>{$_('uload.settings_route.title')}</title>
</svelte:head>

<RoutePage appId="uload" backHref="/uload">
	<div class="pane">
		<header class="bar">
			<div class="title">
				<strong>{$_('uload.settings_route.heading')}</strong>
				<span class="sub">{$_('uload.settings_route.subtitle')}</span>
			</div>
		</header>

		<section class="panel">
			<h2>{$_('uload.settings_route.section_data')}</h2>
			<div class="stats">
				<div class="stat">
					<p class="stat-value">{links.value?.length ?? 0}</p>
					<p class="stat-label">{$_('uload.settings_route.stat_links')}</p>
				</div>
				<div class="stat">
					<p class="stat-value">{tags.value?.length ?? 0}</p>
					<p class="stat-label">{$_('uload.settings_route.stat_tags')}</p>
				</div>
				<div class="stat">
					<p class="stat-value">{folders.value?.length ?? 0}</p>
					<p class="stat-label">{$_('uload.settings_route.stat_folders')}</p>
				</div>
			</div>
		</section>

		<section class="panel">
			<h2>{$_('uload.settings_route.section_export')}</h2>
			<p class="hint">{$_('uload.settings_route.export_hint')}</p>
			<button type="button" class="btn" onclick={exportData}>
				<DownloadSimple size={16} />
				{$_('uload.settings_route.action_export')}
			</button>
		</section>

		<section class="panel danger">
			<h2>{$_('uload.settings_route.section_danger')}</h2>
			<p class="hint">
				{$_('uload.settings_route.danger_hint')}
			</p>
			<button type="button" class="btn danger" onclick={clearAllData}>
				<Trash size={16} />
				{$_('uload.settings_route.action_clear')}
			</button>
		</section>
	</div>
</RoutePage>

<style>
	.pane {
		max-width: 720px;
		margin: 0 auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		color: hsl(var(--color-foreground));
	}

	.bar .title strong {
		font-size: 1rem;
		font-weight: 600;
	}

	.bar .sub {
		margin-left: 0.5rem;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	.panel {
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 12px;
		padding: 1.125rem;
	}

	.panel.danger {
		border-color: hsl(0 70% 55% / 0.3);
		background: hsl(0 70% 55% / 0.04);
	}

	.panel h2 {
		font-size: 0.9375rem;
		font-weight: 600;
		margin: 0 0 0.5rem;
	}

	.panel.danger h2 {
		color: hsl(0 70% 55%);
	}

	.hint {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0 0 0.875rem;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		text-align: center;
		gap: 1rem;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
	}

	.stat-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0.25rem 0 0;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.875rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 8px;
		background: hsl(var(--color-background, var(--color-card)));
		color: hsl(var(--color-foreground));
		font: inherit;
		font-size: 0.875rem;
		cursor: pointer;
		transition:
			background 120ms ease,
			color 120ms ease;
	}

	.btn:hover {
		background: hsl(var(--color-muted) / 0.5);
	}

	.btn.danger {
		background: hsl(0 70% 55%);
		color: white;
		border-color: hsl(0 70% 45%);
	}

	.btn.danger:hover {
		background: hsl(0 70% 50%);
	}
</style>
