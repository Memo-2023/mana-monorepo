<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import FileUploader from '$lib/components/import/FileUploader.svelte';
	import ImportPreview from '$lib/components/import/ImportPreview.svelte';
	import GoogleImport from '$lib/components/import/GoogleImport.svelte';
	import { importApi, type ImportPreviewResponse, type DuplicateAction } from '$lib/api/import';
	import { exportApi, type ExportFormat } from '$lib/api/export';
	import { contactsStore } from '$lib/stores/contacts.svelte';
	import '$lib/i18n';

	type Tab = 'import' | 'export';
	type ImportSource = 'file' | 'google';
	type ImportStep = 'upload' | 'preview' | 'result';

	// Get initial tab from URL
	let activeTab = $state<Tab>(($page.url.searchParams.get('tab') as Tab) || 'import');
	let importSource = $state<ImportSource>(
		($page.url.searchParams.get('source') as ImportSource) || 'file'
	);

	// Import state
	let importStep = $state<ImportStep>('upload');
	let isLoading = $state(false);
	let isImporting = $state(false);
	let importError = $state<string | null>(null);
	let selectedFile = $state<File | null>(null);
	let preview = $state<ImportPreviewResponse | null>(null);
	let importResult = $state<{
		imported: number;
		skipped: number;
		merged: number;
		errors: { index: number; contactName: string; error: string }[];
	} | null>(null);

	// Export state
	let exportFormat = $state<ExportFormat>('vcard');
	let includeArchived = $state(false);
	let includeNotes = $state(true);
	let includePhotos = $state(true);
	let onlyFavorites = $state(false);
	let isExporting = $state(false);
	let exportError = $state<string | null>(null);
	let exportSuccess = $state(false);

	function setActiveTab(tab: Tab) {
		activeTab = tab;
		updateUrl();
		// Reset states
		if (tab === 'import') {
			resetImportState();
		} else {
			resetExportState();
		}
	}

	function setImportSource(source: ImportSource) {
		importSource = source;
		updateUrl();
		resetImportState();
	}

	function updateUrl() {
		const url = new URL(window.location.href);
		url.searchParams.set('tab', activeTab);
		if (activeTab === 'import') {
			url.searchParams.set('source', importSource);
		} else {
			url.searchParams.delete('source');
		}
		window.history.replaceState({}, '', url.toString());
	}

	function resetImportState() {
		importStep = 'upload';
		preview = null;
		selectedFile = null;
		importResult = null;
		importError = null;
	}

	function resetExportState() {
		exportError = null;
		exportSuccess = false;
	}

	// Import handlers
	async function handleFileSelect(file: File) {
		selectedFile = file;
		importError = null;
		isLoading = true;

		try {
			preview = await importApi.preview(file);
			importStep = 'preview';
		} catch (e) {
			importError = e instanceof Error ? e.message : 'Fehler beim Verarbeiten der Datei';
		} finally {
			isLoading = false;
		}
	}

	async function handleImport(duplicateAction: DuplicateAction, skipIndices: number[]) {
		if (!preview) return;

		isImporting = true;
		importError = null;

		try {
			importResult = await importApi.execute(preview.contacts, duplicateAction, skipIndices);
			importStep = 'result';
			await contactsStore.loadContacts();
		} catch (e) {
			importError = e instanceof Error ? e.message : 'Fehler beim Importieren';
		} finally {
			isImporting = false;
		}
	}

	function handleCancelImport() {
		resetImportState();
	}

	function handleImportDone() {
		goto('/');
	}

	function handleImportMore() {
		resetImportState();
	}

	async function handleDownloadTemplate() {
		try {
			await importApi.downloadTemplate();
		} catch (e) {
			importError = e instanceof Error ? e.message : 'Fehler beim Herunterladen';
		}
	}

	// Export handlers
	async function handleExport() {
		isExporting = true;
		exportError = null;
		exportSuccess = false;

		try {
			await exportApi.exportContacts({
				format: exportFormat,
				includeFavorites: onlyFavorites || undefined,
				includeArchived,
			});
			exportSuccess = true;
		} catch (e) {
			exportError = e instanceof Error ? e.message : 'Export fehlgeschlagen';
		} finally {
			isExporting = false;
		}
	}
</script>

<svelte:head>
	<title>Daten - Kontakte</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-foreground">Daten verwalten</h1>
			<p class="text-muted-foreground mt-1">Kontakte importieren, exportieren und sichern</p>
		</div>
		<a href="/" class="btn btn-secondary">Zurück</a>
	</div>

	<!-- Main Tabs -->
	<div class="flex gap-1 p-1 bg-muted rounded-xl">
		<button
			type="button"
			onclick={() => setActiveTab('import')}
			class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all
				{activeTab === 'import'
				? 'bg-card text-foreground shadow-sm'
				: 'text-muted-foreground hover:text-foreground'}"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
				/>
			</svg>
			Import
		</button>
		<button
			type="button"
			onclick={() => setActiveTab('export')}
			class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all
				{activeTab === 'export'
				? 'bg-card text-foreground shadow-sm'
				: 'text-muted-foreground hover:text-foreground'}"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
				/>
			</svg>
			Export
		</button>
	</div>

	<!-- ==================== IMPORT TAB ==================== -->
	{#if activeTab === 'import'}
		<!-- Import Source Tabs -->
		<div class="flex gap-2 border-b border-border">
			<button
				type="button"
				onclick={() => setImportSource('file')}
				class="px-4 py-2 font-medium transition-colors border-b-2 -mb-px
					{importSource === 'file'
					? 'border-primary text-primary'
					: 'border-transparent text-muted-foreground hover:text-foreground'}"
			>
				<span class="flex items-center gap-2">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					Datei
				</span>
			</button>
			<button
				type="button"
				onclick={() => setImportSource('google')}
				class="px-4 py-2 font-medium transition-colors border-b-2 -mb-px
					{importSource === 'google'
					? 'border-primary text-primary'
					: 'border-transparent text-muted-foreground hover:text-foreground'}"
			>
				<span class="flex items-center gap-2">
					<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
						/>
						<path
							d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						/>
						<path
							d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						/>
						<path
							d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						/>
					</svg>
					Google
				</span>
			</button>
		</div>

		<!-- Import Error -->
		{#if importError && importSource === 'file'}
			<div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
				{importError}
			</div>
		{/if}

		<!-- File Import -->
		{#if importSource === 'file'}
			{#if importStep === 'upload'}
				<div class="space-y-6">
					{#if isLoading}
						<div class="flex flex-col items-center justify-center py-12">
							<div
								class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
							></div>
							<p class="mt-4 text-muted-foreground">Datei wird verarbeitet...</p>
						</div>
					{:else}
						<FileUploader onFileSelect={handleFileSelect} />

						<div class="bg-card rounded-xl p-6 space-y-4">
							<h3 class="font-semibold text-foreground">Unterstützte Formate</h3>
							<div class="grid sm:grid-cols-2 gap-4">
								<div class="flex items-start gap-3">
									<div
										class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0"
											/>
										</svg>
									</div>
									<div>
										<div class="font-medium text-foreground">vCard (.vcf)</div>
										<div class="text-sm text-muted-foreground">
											Standard-Format für Kontakte, kompatibel mit allen gängigen Apps
										</div>
									</div>
								</div>
								<div class="flex items-start gap-3">
									<div
										class="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 flex-shrink-0"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
											/>
										</svg>
									</div>
									<div>
										<div class="font-medium text-foreground">CSV (.csv)</div>
										<div class="text-sm text-muted-foreground">
											Tabellen-Format, ideal für Excel oder Google Sheets
										</div>
									</div>
								</div>
							</div>

							<div class="pt-4 border-t border-border">
								<button
									type="button"
									onclick={handleDownloadTemplate}
									class="text-primary hover:underline text-sm inline-flex items-center gap-2"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
										/>
									</svg>
									CSV-Vorlage herunterladen
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			{#if importStep === 'preview' && preview}
				<ImportPreview
					{preview}
					onImport={handleImport}
					onCancel={handleCancelImport}
					{isImporting}
				/>
			{/if}

			{#if importStep === 'result' && importResult}
				<div class="bg-card rounded-xl p-8 text-center space-y-6">
					<div
						class="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center text-green-500"
					>
						<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>

					<div>
						<h2 class="text-2xl font-bold text-foreground">Import abgeschlossen</h2>
						<p class="text-muted-foreground mt-2">Deine Kontakte wurden erfolgreich importiert</p>
					</div>

					<div class="grid grid-cols-3 gap-4 max-w-md mx-auto">
						<div class="bg-green-500/10 rounded-lg p-4">
							<div class="text-3xl font-bold text-green-500">{importResult.imported}</div>
							<div class="text-sm text-muted-foreground">Importiert</div>
						</div>
						<div class="bg-blue-500/10 rounded-lg p-4">
							<div class="text-3xl font-bold text-blue-500">{importResult.merged}</div>
							<div class="text-sm text-muted-foreground">Zusammengeführt</div>
						</div>
						<div class="bg-gray-500/10 rounded-lg p-4">
							<div class="text-3xl font-bold text-gray-500">{importResult.skipped}</div>
							<div class="text-sm text-muted-foreground">Übersprungen</div>
						</div>
					</div>

					{#if importResult.errors.length > 0}
						<div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-left">
							<h3 class="font-medium text-red-500 mb-2">Fehler</h3>
							<ul class="text-sm text-red-400 space-y-1">
								{#each importResult.errors as err}
									<li>{err.contactName}: {err.error}</li>
								{/each}
							</ul>
						</div>
					{/if}

					<div class="flex justify-center gap-3">
						<button type="button" onclick={handleImportMore} class="btn btn-secondary">
							Weitere importieren
						</button>
						<button type="button" onclick={handleImportDone} class="btn btn-primary">
							Fertig
						</button>
					</div>
				</div>
			{/if}
		{/if}

		<!-- Google Import -->
		{#if importSource === 'google'}
			<GoogleImport />
		{/if}
	{/if}

	<!-- ==================== EXPORT TAB ==================== -->
	{#if activeTab === 'export'}
		<div class="space-y-6">
			<!-- Success Message -->
			{#if exportSuccess}
				<div
					class="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-600 dark:text-green-400 flex items-center gap-3"
				>
					<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					Export erfolgreich! Die Datei wurde heruntergeladen.
				</div>
			{/if}

			<!-- Error Message -->
			{#if exportError}
				<div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
					{exportError}
				</div>
			{/if}

			<!-- Format Selection -->
			<div class="bg-card rounded-xl p-6 space-y-4">
				<h3 class="font-semibold text-foreground">Format wählen</h3>
				<div class="grid sm:grid-cols-2 gap-3">
					<button
						type="button"
						onclick={() => (exportFormat = 'vcard')}
						class="p-4 rounded-lg border-2 transition-colors text-left
							{exportFormat === 'vcard'
							? 'border-primary bg-primary/10'
							: 'border-border hover:border-muted-foreground'}"
					>
						<div class="flex items-center gap-3">
							<div
								class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary"
							>
								<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
									/>
								</svg>
							</div>
							<div>
								<div class="font-medium text-foreground">vCard</div>
								<div class="text-sm text-muted-foreground">.vcf - Universelles Kontaktformat</div>
							</div>
						</div>
					</button>
					<button
						type="button"
						onclick={() => (exportFormat = 'csv')}
						class="p-4 rounded-lg border-2 transition-colors text-left
							{exportFormat === 'csv'
							? 'border-primary bg-primary/10'
							: 'border-border hover:border-muted-foreground'}"
					>
						<div class="flex items-center gap-3">
							<div
								class="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500"
							>
								<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
							</div>
							<div>
								<div class="font-medium text-foreground">CSV</div>
								<div class="text-sm text-muted-foreground">.csv - Für Excel & Tabellen</div>
							</div>
						</div>
					</button>
				</div>
			</div>

			<!-- Filter Options -->
			<div class="bg-card rounded-xl p-6 space-y-4">
				<h3 class="font-semibold text-foreground">Filter</h3>

				<div class="space-y-4">
					<!-- Favorites Only -->
					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={onlyFavorites}
							class="w-5 h-5 rounded border-border text-primary focus:ring-primary"
						/>
						<span class="text-foreground">Nur Favoriten exportieren</span>
					</label>
				</div>
			</div>

			<!-- Export Options -->
			<div class="bg-card rounded-xl p-6 space-y-4">
				<h3 class="font-semibold text-foreground">Optionen</h3>

				<div class="space-y-3">
					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={includeNotes}
							class="w-5 h-5 rounded border-border text-primary focus:ring-primary"
						/>
						<div>
							<span class="text-foreground">Notizen einschließen</span>
							<p class="text-sm text-muted-foreground">Notizen zu Kontakten mit exportieren</p>
						</div>
					</label>

					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={includePhotos}
							class="w-5 h-5 rounded border-border text-primary focus:ring-primary"
						/>
						<div>
							<span class="text-foreground">Fotos einschließen</span>
							<p class="text-sm text-muted-foreground">
								Kontaktfotos mit exportieren (größere Datei)
							</p>
						</div>
					</label>

					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={includeArchived}
							class="w-5 h-5 rounded border-border text-primary focus:ring-primary"
						/>
						<div>
							<span class="text-foreground">Archivierte einschließen</span>
							<p class="text-sm text-muted-foreground">Auch archivierte Kontakte exportieren</p>
						</div>
					</label>
				</div>
			</div>

			<!-- Export Button -->
			<div class="flex justify-end">
				<button
					type="button"
					onclick={handleExport}
					disabled={isExporting}
					class="btn btn-primary px-8"
				>
					{#if isExporting}
						<span class="inline-flex items-center gap-2">
							<span
								class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
							></span>
							Exportiere...
						</span>
					{:else}
						<span class="inline-flex items-center gap-2">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
								/>
							</svg>
							Kontakte exportieren
						</span>
					{/if}
				</button>
			</div>
		</div>
	{/if}
</div>
