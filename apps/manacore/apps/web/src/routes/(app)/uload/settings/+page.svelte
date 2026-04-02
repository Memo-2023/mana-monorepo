<script lang="ts">
	import { ArrowLeft, Trash, DownloadSimple } from '@manacore/shared-icons';
	import { linkTable, uloadTagTable, uloadFolderTable, linkTagTable } from '$lib/modules/uload';
	import { useAllLinks, useAllTags, useAllFolders } from '$lib/modules/uload';
	import { toast } from 'svelte-sonner';

	const links = useAllLinks();
	const tags = useAllTags();
	const folders = useAllFolders();

	async function clearAllData() {
		if (!confirm('Alle lokalen uLoad-Daten loeschen? Dies kann nicht rueckgaengig gemacht werden.'))
			return;

		await linkTable.clear();
		await uloadTagTable.clear();
		await uloadFolderTable.clear();
		await linkTagTable.clear();
		toast.success('Alle uLoad-Daten geloescht');
	}

	async function exportData() {
		const allLinks = await linkTable.toArray();
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
		toast.success('Export heruntergeladen');
	}
</script>

<svelte:head>
	<title>Settings - uLoad - ManaCore</title>
</svelte:head>

<div class="mx-auto max-w-2xl p-4">
	<div class="mb-6 flex items-center gap-3">
		<a href="/uload" class="rounded-lg p-2 transition-colors hover:bg-white/5">
			<ArrowLeft size={20} class="text-white/60" />
		</a>
		<h1 class="text-2xl font-bold text-white">uLoad Einstellungen</h1>
	</div>

	<!-- Data Overview -->
	<div class="mb-6 rounded-xl border border-white/10 bg-white/5 p-6">
		<h2 class="mb-4 text-lg font-semibold text-white">Daten</h2>
		<div class="grid grid-cols-3 gap-4 text-center">
			<div>
				<p class="text-2xl font-bold text-white">{links.value?.length ?? 0}</p>
				<p class="text-sm text-white/40">Links</p>
			</div>
			<div>
				<p class="text-2xl font-bold text-white">{tags.value?.length ?? 0}</p>
				<p class="text-sm text-white/40">Tags</p>
			</div>
			<div>
				<p class="text-2xl font-bold text-white">{folders.value?.length ?? 0}</p>
				<p class="text-sm text-white/40">Ordner</p>
			</div>
		</div>
	</div>

	<!-- Export -->
	<div class="mb-4 rounded-xl border border-white/10 bg-white/5 p-6">
		<h2 class="mb-2 text-lg font-semibold text-white">Daten exportieren</h2>
		<p class="mb-4 text-sm text-white/40">Exportiere alle Links, Tags und Ordner als JSON-Datei.</p>
		<button
			onclick={exportData}
			class="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
		>
			<DownloadSimple size={18} />
			JSON exportieren
		</button>
	</div>

	<!-- Danger Zone -->
	<div class="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
		<h2 class="mb-2 text-lg font-semibold text-red-400">Gefahrenzone</h2>
		<p class="mb-4 text-sm text-white/40">
			Loescht alle lokalen uLoad-Daten (Links, Tags, Ordner). Synchronisierte Daten auf dem Server
			bleiben erhalten.
		</p>
		<button
			onclick={clearAllData}
			class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
		>
			<Trash size={18} />
			Alle Daten loeschen
		</button>
	</div>
</div>
