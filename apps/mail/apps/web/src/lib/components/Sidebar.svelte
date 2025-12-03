<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { foldersStore } from '$lib/stores/folders.svelte';
	import { accountsStore } from '$lib/stores/accounts.svelte';
	import { emailsStore } from '$lib/stores/emails.svelte';
	import { composeStore } from '$lib/stores/compose.svelte';

	interface Props {
		onCompose: () => void;
	}

	let { onCompose }: Props = $props();

	// Quick access items (routes)
	const quickAccessItems = [
		{ path: '/', icon: '📥', label: 'Inbox', type: 'inbox' },
		{ path: '/starred', icon: '⭐', label: 'Starred', type: 'starred' },
		{ path: '/sent', icon: '📤', label: 'Sent', type: 'sent' },
		{ path: '/drafts', icon: '📝', label: 'Drafts', type: 'drafts' },
	];

	// Current path for active state
	let currentPath = $derived($page.url.pathname);

	// Get unread count for inbox
	let inboxUnread = $derived(foldersStore.inboxFolder?.unreadCount || 0);

	// Get drafts count
	let draftsCount = $derived(composeStore.drafts.length);

	function handleAccountChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		accountsStore.setSelectedAccount(select.value);
		foldersStore.fetchFolders(select.value);
	}

	function handleNavClick(path: string) {
		goto(path);
	}
</script>

<aside class="w-60 flex-shrink-0 flex flex-col gap-4">
	<!-- Compose Button -->
	<button class="compose-button" onclick={onCompose}>
		<span class="text-lg">✏️</span>
		<span>Compose</span>
	</button>

	<!-- Account Selector -->
	{#if accountsStore.accounts.length > 1}
		<select class="input" value={accountsStore.selectedAccountId} onchange={handleAccountChange}>
			{#each accountsStore.accounts as account}
				<option value={account.id}>{account.name}</option>
			{/each}
		</select>
	{/if}

	<!-- Quick Access Navigation -->
	<nav class="flex flex-col gap-1">
		<div class="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
			Mail
		</div>

		{#each quickAccessItems as item}
			<button
				class="folder-item"
				class:active={currentPath === item.path}
				onclick={() => handleNavClick(item.path)}
			>
				<span class="mr-3">{item.icon}</span>
				<span class="flex-1 text-left">{item.label}</span>
				{#if item.type === 'inbox' && inboxUnread > 0}
					<span class="folder-badge">{inboxUnread}</span>
				{/if}
				{#if item.type === 'drafts' && draftsCount > 0}
					<span class="folder-badge">{draftsCount}</span>
				{/if}
			</button>
		{/each}

		<!-- Custom Folders -->
		{#if foldersStore.customFolders.length > 0}
			<div
				class="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 mt-4"
			>
				Labels
			</div>
			{#each foldersStore.customFolders as folder}
				<button
					class="folder-item"
					onclick={() => {
						foldersStore.setSelectedFolder(folder.id);
						if (accountsStore.selectedAccountId) {
							emailsStore.fetchEmails({
								accountId: accountsStore.selectedAccountId,
								folderId: folder.id,
							});
							goto('/');
						}
					}}
				>
					<span class="mr-3">📁</span>
					<span class="flex-1 text-left">{folder.name}</span>
					{#if folder.unreadCount > 0}
						<span class="folder-badge">{folder.unreadCount}</span>
					{/if}
				</button>
			{/each}
		{/if}

		<!-- Settings Link -->
		<div
			class="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 mt-4"
		>
			More
		</div>
		<button
			class="folder-item"
			class:active={currentPath === '/settings'}
			onclick={() => handleNavClick('/settings')}
		>
			<span class="mr-3">⚙️</span>
			<span class="flex-1 text-left">Settings</span>
		</button>
	</nav>

	<!-- Account Info -->
	{#if accountsStore.selectedAccount}
		<div class="mt-auto p-3 rounded-lg bg-muted/30 text-sm">
			<div class="font-medium truncate">{accountsStore.selectedAccount.name}</div>
			<div class="text-muted-foreground truncate text-xs">
				{accountsStore.selectedAccount.email}
			</div>
		</div>
	{/if}
</aside>
