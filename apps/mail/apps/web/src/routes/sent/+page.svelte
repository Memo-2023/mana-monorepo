<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { accountsStore } from '$lib/stores/accounts.svelte';
	import { foldersStore } from '$lib/stores/folders.svelte';
	import { emailsStore } from '$lib/stores/emails.svelte';
	import { composeStore } from '$lib/stores/compose.svelte';
	import EmailList from '$lib/components/EmailList.svelte';
	import EmailDetail from '$lib/components/EmailDetail.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import ComposeModal from '$lib/components/ComposeModal.svelte';

	let showDetail = $state(false);

	// Redirect if not authenticated
	$effect(() => {
		if (authStore.initialized && !authStore.isAuthenticated) {
			goto('/login');
		}
	});

	// Fetch sent emails when folder changes
	$effect(() => {
		const sentFolder = foldersStore.sentFolder;
		if (sentFolder && accountsStore.selectedAccountId) {
			emailsStore.fetchEmails({
				accountId: accountsStore.selectedAccountId,
				folderId: sentFolder.id,
			});
		}
	});

	function handleEmailSelect(emailId: string) {
		emailsStore.setSelectedEmail(emailId);
		emailsStore.markAsRead(emailId);
		showDetail = true;
	}

	function handleCloseDetail() {
		showDetail = false;
		emailsStore.setSelectedEmail(null);
	}

	function handleCompose() {
		if (accountsStore.selectedAccountId) {
			composeStore.openCompose(accountsStore.selectedAccountId);
		}
	}
</script>

<svelte:head>
	<title>Sent | Mail</title>
</svelte:head>

{#if authStore.isAuthenticated}
	<div class="flex h-[calc(100vh-100px)] gap-4">
		<!-- Sidebar -->
		<Sidebar onCompose={handleCompose} />

		<!-- Email List -->
		<div class="flex-1 flex flex-col min-w-0">
			<div class="flex items-center justify-between mb-4">
				<h1 class="text-2xl font-bold">Sent</h1>
			</div>

			<div class="flex-1 flex gap-4 min-h-0">
				<div class="flex-1 overflow-hidden rounded-lg border border-border bg-surface">
					<EmailList
						emails={emailsStore.emails}
						loading={emailsStore.loading}
						selectedId={emailsStore.selectedEmailId}
						onSelect={handleEmailSelect}
					/>
				</div>

				<!-- Email Detail Panel -->
				{#if showDetail && emailsStore.selectedEmail}
					<div class="w-[450px] flex-shrink-0 overflow-hidden rounded-lg border border-border">
						<EmailDetail
							email={emailsStore.selectedEmail}
							onClose={handleCloseDetail}
							onReply={() => composeStore.createReply(emailsStore.selectedEmailId!)}
							onReplyAll={() => composeStore.createReplyAll(emailsStore.selectedEmailId!)}
							onForward={() => composeStore.createForward(emailsStore.selectedEmailId!)}
						/>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Compose Modal -->
	{#if composeStore.isComposeOpen}
		<ComposeModal />
	{/if}
{:else}
	<div class="flex items-center justify-center h-96">
		<p class="text-muted-foreground">Loading...</p>
	</div>
{/if}
