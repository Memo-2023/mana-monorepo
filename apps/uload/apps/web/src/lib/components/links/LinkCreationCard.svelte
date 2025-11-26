<script lang="ts">
	import { enhance } from '$app/forms';
	import LinkCreationForm from './LinkCreationForm.svelte';
	import { toastMessages, notify } from '$lib/services/toast';
	import { trackLinkCreated } from '$lib/analytics';
	import { goto } from '$app/navigation';
	import type { Tag } from '$lib/pocketbase';
	import * as m from '$paraglide/messages';

	interface Props {
		user?: {
			id: string;
			username?: string;
		};
		folders?: Array<{
			id: string;
			icon: string;
			display_name: string;
		}>;
		tags?: Tag[];
		workspace?: any;
		defaultOpen?: boolean;
		editingLink?: any;
		onSuccess?: (link: any, shortUrl: string) => void;
		refreshOnSuccess?: boolean;
	}

	let {
		user,
		folders = [],
		tags = [],
		workspace,
		defaultOpen = true,
		editingLink,
		onSuccess,
		refreshOnSuccess = true
	}: Props = $props();

	let isOpen = $state(defaultOpen);
	
	// Update isOpen when defaultOpen changes
	$effect(() => {
		isOpen = defaultOpen;
	});
	let showBulkCreate = $state(false);
	let isSubmitting = $state(false);
	let bulkUrls = $state('');
	let bulkFolder = $state('');
	let bulkUseUsername = $state(false);
	let createdLinks = $state<Array<{url: string, shortCode: string}>>([]);
	let copiedStates = $state<Record<string, boolean>>({});

	function handleSingleSuccess(link: any, shortUrl: string) {
		console.log('✅ LinkCreationCard: Single link created successfully');
		console.log('Link:', link);
		console.log('Short URL:', shortUrl);
		toastMessages.linkCreated();
		
		if (onSuccess) {
			onSuccess(link, shortUrl);
		}
		
		if (refreshOnSuccess) {
			// Immediately invalidate to refresh the data
			goto(window.location.pathname, { invalidateAll: true });
		}
	}

	function copyToClipboard(text: string, id: string) {
		navigator.clipboard.writeText(text);
		copiedStates[id] = true;
		toastMessages.linkCopied();
		setTimeout(() => (copiedStates[id] = false), 2000);
	}

	function handleBulkSubmit() {
		console.log('📦 LinkCreationCard: Bulk submit initiated');
		console.log('Bulk URLs:', bulkUrls);
		console.log('Bulk Folder:', bulkFolder);
		console.log('Use Username:', bulkUseUsername);
		isSubmitting = true;
		return async ({ result, update }: any) => {
			console.log('📦 LinkCreationCard: Bulk form enhance callback triggered');
			console.log('Result type:', result.type);
			console.log('Result data:', result.data);
			if (result.type === 'success') {
				const urls = bulkUrls.split('\n').filter(line => line.trim());
				console.log('✅ LinkCreationCard: Bulk creation successful');
				console.log('Created links:', result.data?.links);
				notify.success(`${urls.length} Links erfolgreich erstellt!`);
				
				// Store created links for display
				if (result.data?.links) {
					createdLinks = result.data.links.map((link: any) => ({
						url: link.shortUrl,
						shortCode: link.short_code
					}));
				}
				
				// Clear form
				bulkUrls = '';
				bulkFolder = '';
				bulkUseUsername = false;
				
				if (refreshOnSuccess) {
					setTimeout(() => {
						goto(window.location.pathname, { invalidateAll: true });
					}, 2000);
				}
			} else if (result.type === 'failure' && result.data?.error) {
				console.error('❌ LinkCreationCard: Bulk creation failed');
				console.error('Error:', result.data.error);
				notify.error(m.error_link_creation(), result.data.error);
			} else {
				console.warn('⚠️ LinkCreationCard: Unexpected result type');
				console.warn('Full result:', result);
			}
			await update();
			isSubmitting = false;
			console.log('🏁 LinkCreationCard: Bulk submit complete');
		};
	}
</script>

<div class="mb-8 transition-all duration-500 ease-in-out {isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}">
	<div class="rounded-xl border-2 border-theme-accent/30 bg-gradient-to-br from-theme-surface via-theme-surface to-theme-accent/5 p-6 shadow-2xl sm:p-8">
		<!-- Header -->
		<div class="flex items-center justify-between mb-6">
			<div class="flex items-center gap-3">
				<div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
					+
				</div>
				<h2 class="text-2xl font-bold text-theme-text">
					{showBulkCreate ? 'Mehrere Links erstellen' : editingLink ? 'Link bearbeiten' : 'Neuen Link erstellen'}
				</h2>
			</div>
			
			<div class="flex items-center gap-2">
				<!-- Toggle Single/Bulk -->
				<button
					type="button"
					onclick={() => (showBulkCreate = !showBulkCreate)}
					class="px-3 py-1.5 text-sm font-medium rounded-lg transition-all {showBulkCreate ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}"
				>
					{showBulkCreate ? '← Einzelner Link' : 'Mehrere Links →'}
				</button>
				
				<!-- Close Button -->
				<button
					onclick={() => (isOpen = false)}
					class="text-theme-text-muted hover:text-theme-text transition-colors p-1 hover:bg-theme-surface-hover rounded-lg"
					title="Formular ausblenden"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>
		</div>

		<!-- Content -->
		{#if showBulkCreate}
			<!-- Bulk Create Form -->
			<form
				method="POST"
				action="?/bulk_create"
				use:enhance={handleBulkSubmit}
				class="space-y-6"
			>
				<div>
					<label
						for="bulk_urls"
						class="mb-2 block text-lg font-medium text-theme-text"
					>
						<span class="text-theme-accent mr-2">1.</span>
						URLs eingeben (eine pro Zeile)
					</label>
					<textarea
						id="bulk_urls"
						name="bulk_urls"
						rows="6"
						required
						placeholder="https://beispiel.de&#10;https://google.com&#10;https://github.com"
						bind:value={bulkUrls}
						class="w-full rounded-lg border-2 border-theme-border bg-theme-surface px-4 py-3 text-theme-text placeholder-theme-text-muted focus:ring-2 focus:ring-theme-accent focus:outline-none font-mono text-sm"
					></textarea>
					<p class="mt-2 text-sm text-theme-text-muted flex items-center gap-2">
						<svg class="h-4 w-4 text-theme-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						{bulkUrls.split('\n').filter(line => line.trim()).length} URLs erkannt
					</p>
				</div>

				{#if user}
					<div class="space-y-4">
						<label class="block text-lg font-medium text-theme-text">
							<span class="text-theme-accent mr-2">2.</span>
							Optionen für alle Links
						</label>
						
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<!-- Folder Selection -->
							{#if folders.length > 0}
								<div>
									<label
										for="bulk_folder"
										class="mb-1 block text-sm font-medium text-theme-text"
									>
										Ordner zuweisen
									</label>
									<select
										id="bulk_folder"
										name="bulk_folder"
										bind:value={bulkFolder}
										class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text focus:ring-2 focus:ring-theme-accent focus:outline-none"
									>
										<option value="">Kein Ordner</option>
										{#each folders as folder}
											<option value={folder.id}>
												{folder.icon} {folder.display_name}
											</option>
										{/each}
									</select>
								</div>
							{/if}
							
							<!-- Username Prefix -->
							<div>
								<div class="mb-1 block text-sm font-medium text-theme-text">
									URL-Format
								</div>
								<label class="flex cursor-pointer items-center space-x-2 p-3 rounded-lg bg-theme-surface-hover">
									<input
										type="checkbox"
										name="bulk_use_username"
										bind:checked={bulkUseUsername}
										class="h-4 w-4 rounded border-theme-border text-blue-600 focus:ring-blue-500"
									/>
									<span class="text-sm text-theme-text">
										Mit Benutzername: /u/{user.username}/[code]
									</span>
								</label>
							</div>
						</div>
					</div>
				{/if}

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={isSubmitting || !bulkUrls.trim()}
					class="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-6 py-4 font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
				>
					{#if isSubmitting}
						<svg class="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Erstelle Links...
					{:else}
						🚀 Alle Links erstellen
					{/if}
				</button>

				<!-- Created Links Display -->
				{#if createdLinks.length > 0}
					<div class="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800">
						<h3 class="font-semibold text-green-800 dark:text-green-300 mb-3">
							✅ {createdLinks.length} Links erfolgreich erstellt:
						</h3>
						<div class="space-y-2 max-h-60 overflow-y-auto">
							{#each createdLinks as link, i}
								<div class="flex items-center gap-2 p-2 rounded bg-white dark:bg-theme-surface">
									<code class="flex-1 text-sm font-mono text-green-700 dark:text-green-400">
										{link.url}
									</code>
									<button
										type="button"
										onclick={() => copyToClipboard(link.url, `bulk-${i}`)}
										class="px-2 py-1 text-xs font-medium rounded transition-colors {copiedStates[`bulk-${i}`] ? 'bg-green-600 text-white' : 'bg-green-700 text-white hover:bg-green-800'}"
									>
										{copiedStates[`bulk-${i}`] ? '✓' : '📋'}
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</form>
		{:else}
			<!-- Single Link Progressive Form -->
			<LinkCreationForm
				{user}
				{tags}
				{folders}
				{workspace}
				{editingLink}
				mode="advanced"
				onSuccess={handleSingleSuccess}
			/>
		{/if}
	</div>
</div>

