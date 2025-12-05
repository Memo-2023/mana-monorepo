<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import FileUploader from '$lib/components/import/FileUploader.svelte';
	import ImportPreview from '$lib/components/import/ImportPreview.svelte';
	import GoogleImport from '$lib/components/import/GoogleImport.svelte';
	import { importApi, type ImportPreviewResponse, type DuplicateAction } from '$lib/api/import';
	import { contactsStore } from '$lib/stores/contacts.svelte';
	import '$lib/i18n';

	type Tab = 'file' | 'google';
	type Step = 'upload' | 'preview' | 'result';

	// Get initial tab from URL
	let activeTab = $state<Tab>(($page.url.searchParams.get('tab') as Tab) || 'file');

	let step = $state<Step>('upload');
	let isLoading = $state(false);
	let isImporting = $state(false);
	let error = $state<string | null>(null);
	let selectedFile = $state<File | null>(null);
	let preview = $state<ImportPreviewResponse | null>(null);
	let result = $state<{
		imported: number;
		skipped: number;
		merged: number;
		errors: { index: number; contactName: string; error: string }[];
	} | null>(null);

	function setActiveTab(tab: Tab) {
		activeTab = tab;
		// Reset file import state when switching tabs
		step = 'upload';
		preview = null;
		selectedFile = null;
		result = null;
		error = null;
		// Update URL without navigation
		const url = new URL(window.location.href);
		url.searchParams.set('tab', tab);
		window.history.replaceState({}, '', url.toString());
	}

	async function handleFileSelect(file: File) {
		selectedFile = file;
		error = null;
		isLoading = true;

		try {
			preview = await importApi.preview(file);
			step = 'preview';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Verarbeiten der Datei';
		} finally {
			isLoading = false;
		}
	}

	async function handleImport(duplicateAction: DuplicateAction, skipIndices: number[]) {
		if (!preview) return;

		isImporting = true;
		error = null;

		try {
			result = await importApi.execute(preview.contacts, duplicateAction, skipIndices);
			step = 'result';
			// Refresh contacts list
			await contactsStore.loadContacts();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Importieren';
		} finally {
			isImporting = false;
		}
	}

	function handleCancel() {
		step = 'upload';
		preview = null;
		selectedFile = null;
		error = null;
	}

	function handleDone() {
		goto('/');
	}

	function handleImportMore() {
		step = 'upload';
		preview = null;
		selectedFile = null;
		result = null;
		error = null;
	}

	async function handleDownloadTemplate() {
		try {
			await importApi.downloadTemplate();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Herunterladen';
		}
	}
</script>

<svelte:head>
	<title>{$_('import.title')} - Contacts</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-foreground">{$_('import.title')}</h1>
			<p class="text-muted-foreground mt-1">{$_('import.subtitle')}</p>
		</div>
		<a href="/" class="btn btn-secondary">
			{$_('common.back')}
		</a>
	</div>

	<!-- Tabs -->
	<div class="flex gap-2 border-b border-border">
		<button
			type="button"
			onclick={() => setActiveTab('file')}
			class="px-4 py-2 font-medium transition-colors border-b-2 -mb-px
				{activeTab === 'file'
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
				{$_('import.tabs.file')}
			</span>
		</button>
		<button
			type="button"
			onclick={() => setActiveTab('google')}
			class="px-4 py-2 font-medium transition-colors border-b-2 -mb-px
				{activeTab === 'google'
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
				{$_('import.tabs.google')}
			</span>
		</button>
	</div>

	<!-- Error message (only for file import) -->
	{#if error && activeTab === 'file'}
		<div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
			{error}
		</div>
	{/if}

	<!-- File Import Tab -->
	{#if activeTab === 'file'}
		<!-- Step: Upload -->
		{#if step === 'upload'}
			<div class="space-y-6">
				{#if isLoading}
					<div class="flex flex-col items-center justify-center py-12">
						<div
							class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
						></div>
						<p class="mt-4 text-muted-foreground">{$_('import.processing')}</p>
					</div>
				{:else}
					<FileUploader onFileSelect={handleFileSelect} />

					<div class="text-center">
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
							{$_('import.downloadTemplate')}
						</button>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Step: Preview -->
		{#if step === 'preview' && preview}
			<ImportPreview {preview} onImport={handleImport} onCancel={handleCancel} {isImporting} />
		{/if}

		<!-- Step: Result -->
		{#if step === 'result' && result}
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
					<h2 class="text-2xl font-bold text-foreground">{$_('import.result.title')}</h2>
					<p class="text-muted-foreground mt-2">{$_('import.result.subtitle')}</p>
				</div>

				<div class="grid grid-cols-3 gap-4 max-w-md mx-auto">
					<div class="bg-green-500/10 rounded-lg p-4">
						<div class="text-3xl font-bold text-green-500">{result.imported}</div>
						<div class="text-sm text-muted-foreground">{$_('import.result.imported')}</div>
					</div>
					<div class="bg-blue-500/10 rounded-lg p-4">
						<div class="text-3xl font-bold text-blue-500">{result.merged}</div>
						<div class="text-sm text-muted-foreground">{$_('import.result.merged')}</div>
					</div>
					<div class="bg-gray-500/10 rounded-lg p-4">
						<div class="text-3xl font-bold text-gray-500">{result.skipped}</div>
						<div class="text-sm text-muted-foreground">{$_('import.result.skipped')}</div>
					</div>
				</div>

				{#if result.errors.length > 0}
					<div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-left">
						<h3 class="font-medium text-red-500 mb-2">{$_('import.result.errors')}</h3>
						<ul class="text-sm text-red-400 space-y-1">
							{#each result.errors as err}
								<li>{err.contactName}: {err.error}</li>
							{/each}
						</ul>
					</div>
				{/if}

				<div class="flex justify-center gap-3">
					<button type="button" onclick={handleImportMore} class="btn btn-secondary">
						{$_('import.result.importMore')}
					</button>
					<button type="button" onclick={handleDone} class="btn btn-primary">
						{$_('import.result.done')}
					</button>
				</div>
			</div>
		{/if}
	{/if}

	<!-- Google Import Tab -->
	{#if activeTab === 'google'}
		<GoogleImport />
	{/if}
</div>
