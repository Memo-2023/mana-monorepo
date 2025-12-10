<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		googleApi,
		type GoogleContact,
		type GoogleStatus,
		type GoogleImportResult,
	} from '$lib/api/google';
	import { contactsStore } from '$lib/stores/contacts.svelte';
	import { GoogleImportSkeleton } from '$lib/components/skeletons';

	type Step = 'connect' | 'select' | 'result';

	let step = $state<Step>('connect');
	let isLoading = $state(true);
	let isImporting = $state(false);
	let error = $state<string | null>(null);
	let status = $state<GoogleStatus | null>(null);
	let contacts = $state<GoogleContact[]>([]);
	let selectedContacts = $state<Set<string>>(new Set());
	let nextPageToken = $state<string | undefined>(undefined);
	let result = $state<GoogleImportResult | null>(null);

	// Handle OAuth callback
	onMount(async () => {
		const code = $page.url.searchParams.get('code');

		if (code) {
			try {
				await googleApi.handleCallback(code);
				// Remove code from URL
				goto('/data?tab=import&source=google', { replaceState: true });
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to connect';
			}
		}

		await loadStatus();
	});

	async function loadStatus() {
		isLoading = true;
		error = null;

		try {
			status = await googleApi.getStatus();
			if (status.connected) {
				step = 'select';
				await loadContacts();
			} else {
				step = 'connect';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load status';
		} finally {
			isLoading = false;
		}
	}

	async function loadContacts(pageToken?: string) {
		try {
			const response = await googleApi.fetchContacts(pageToken);
			if (pageToken) {
				contacts = [...contacts, ...response.contacts];
			} else {
				contacts = response.contacts;
				// Select all by default
				selectedContacts = new Set(response.contacts.map((c) => c.resourceName));
			}
			nextPageToken = response.nextPageToken;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load contacts';
		}
	}

	async function handleConnect() {
		try {
			const url = await googleApi.getAuthUrl();
			window.location.href = url;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to get auth URL';
		}
	}

	async function handleDisconnect() {
		try {
			await googleApi.disconnect();
			status = null;
			contacts = [];
			selectedContacts = new Set();
			step = 'connect';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to disconnect';
		}
	}

	async function handleLoadMore() {
		if (nextPageToken) {
			await loadContacts(nextPageToken);
		}
	}

	function toggleContact(resourceName: string) {
		const newSet = new Set(selectedContacts);
		if (newSet.has(resourceName)) {
			newSet.delete(resourceName);
		} else {
			newSet.add(resourceName);
		}
		selectedContacts = newSet;
	}

	function selectAll() {
		selectedContacts = new Set(contacts.map((c) => c.resourceName));
	}

	function deselectAll() {
		selectedContacts = new Set();
	}

	async function handleImport() {
		isImporting = true;
		error = null;

		try {
			result = await googleApi.importContacts(Array.from(selectedContacts));
			step = 'result';
			// Refresh contacts list
			await contactsStore.loadContacts();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to import';
		} finally {
			isImporting = false;
		}
	}

	function handleDone() {
		goto('/');
	}

	function handleImportMore() {
		step = 'select';
		result = null;
		selectedContacts = new Set(contacts.map((c) => c.resourceName));
	}

	function getContactName(contact: GoogleContact): string {
		return contact.names?.[0]?.displayName || contact.emailAddresses?.[0]?.value || 'Unknown';
	}

	function getContactSubtitle(contact: GoogleContact): string {
		const parts: string[] = [];
		if (contact.emailAddresses?.[0]?.value) {
			parts.push(contact.emailAddresses[0].value);
		}
		if (contact.organizations?.[0]?.name) {
			parts.push(contact.organizations[0].name);
		}
		return parts.join(' • ');
	}
</script>

<div class="space-y-6">
	{#if error}
		<div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
			{error}
		</div>
	{/if}

	{#if isLoading}
		<GoogleImportSkeleton />
	{:else if step === 'connect'}
		<!-- Connect Step -->
		<div class="bg-card rounded-xl p-8 text-center space-y-6">
			<div class="w-20 h-20 mx-auto rounded-full bg-[#4285f4]/10 flex items-center justify-center">
				<svg class="w-10 h-10" viewBox="0 0 24 24" fill="none">
					<path
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
						fill="#4285F4"
					/>
					<path
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						fill="#34A853"
					/>
					<path
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						fill="#FBBC05"
					/>
					<path
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						fill="#EA4335"
					/>
				</svg>
			</div>

			<div>
				<h2 class="text-xl font-bold text-foreground">{$_('google.connect.title')}</h2>
				<p class="text-muted-foreground mt-2">{$_('google.connect.subtitle')}</p>
			</div>

			<button type="button" onclick={handleConnect} class="btn btn-primary">
				{$_('google.connect.button')}
			</button>
		</div>
	{:else if step === 'select'}
		<!-- Select Step -->
		<div class="space-y-4">
			<!-- Connected Account Info -->
			<div class="bg-card rounded-lg p-4 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-full bg-[#4285f4]/10 flex items-center justify-center">
						<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
							<path
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								fill="#4285F4"
							/>
							<path
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								fill="#34A853"
							/>
							<path
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								fill="#FBBC05"
							/>
							<path
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								fill="#EA4335"
							/>
						</svg>
					</div>
					<div>
						<div class="font-medium text-foreground">{$_('google.connected')}</div>
						<div class="text-sm text-muted-foreground">{status?.account?.providerEmail || ''}</div>
					</div>
				</div>
				<button
					type="button"
					onclick={handleDisconnect}
					class="text-sm text-red-500 hover:underline"
				>
					{$_('google.disconnect')}
				</button>
			</div>

			<!-- Contact List -->
			<div class="bg-card rounded-lg overflow-hidden">
				<div class="flex items-center justify-between p-4 border-b border-border">
					<h3 class="font-medium text-foreground">
						{$_('google.contacts')} ({contacts.length})
					</h3>
					<div class="flex gap-2">
						<button type="button" onclick={selectAll} class="text-sm text-primary hover:underline">
							{$_('import.preview.selectAll')}
						</button>
						<span class="text-muted-foreground">|</span>
						<button
							type="button"
							onclick={deselectAll}
							class="text-sm text-primary hover:underline"
						>
							{$_('import.preview.deselectAll')}
						</button>
					</div>
				</div>

				<div class="max-h-[400px] overflow-y-auto divide-y divide-border">
					{#each contacts as contact}
						{@const isSelected = selectedContacts.has(contact.resourceName)}

						<label
							class="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors {!isSelected
								? 'opacity-50'
								: ''}"
						>
							<input
								type="checkbox"
								checked={isSelected}
								onchange={() => toggleContact(contact.resourceName)}
								class="w-5 h-5 rounded border-border text-primary focus:ring-primary"
							/>

							{#if contact.photos?.[0]?.url}
								<img
									src={contact.photos[0].url}
									alt=""
									class="w-10 h-10 rounded-full object-cover"
								/>
							{:else}
								<div
									class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium"
								>
									{getContactName(contact).charAt(0).toUpperCase()}
								</div>
							{/if}

							<div class="flex-1 min-w-0">
								<div class="font-medium text-foreground truncate">
									{getContactName(contact)}
								</div>
								<div class="text-sm text-muted-foreground truncate">
									{getContactSubtitle(contact)}
								</div>
							</div>
						</label>
					{/each}
				</div>

				{#if nextPageToken}
					<div class="p-4 border-t border-border text-center">
						<button type="button" onclick={handleLoadMore} class="text-primary hover:underline">
							{$_('google.loadMore')}
						</button>
					</div>
				{/if}
			</div>

			<!-- Actions -->
			<div class="flex justify-end gap-3">
				<button
					type="button"
					onclick={handleImport}
					class="btn btn-primary"
					disabled={isImporting || selectedContacts.size === 0}
				>
					{#if isImporting}
						<span class="inline-flex items-center gap-2">
							<span
								class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
							></span>
							{$_('import.importing')}
						</span>
					{:else}
						{$_('import.preview.importButton', { values: { count: selectedContacts.size } })}
					{/if}
				</button>
			</div>
		</div>
	{:else if step === 'result' && result}
		<!-- Result Step -->
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

			<div class="grid grid-cols-2 gap-4 max-w-xs mx-auto">
				<div class="bg-green-500/10 rounded-lg p-4">
					<div class="text-3xl font-bold text-green-500">{result.imported}</div>
					<div class="text-sm text-muted-foreground">{$_('import.result.imported')}</div>
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
							<li>{err.error}</li>
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
</div>
