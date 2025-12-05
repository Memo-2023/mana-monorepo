<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { accountsStore } from '$lib/stores/accounts.svelte';
	import { foldersStore } from '$lib/stores/folders.svelte';
	import { composeStore } from '$lib/stores/compose.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import ComposeModal from '$lib/components/ComposeModal.svelte';

	// Redirect if not authenticated
	$effect(() => {
		if (authStore.initialized && !authStore.isAuthenticated) {
			goto('/login');
		}
	});

	// Fetch drafts when account changes
	$effect(() => {
		if (accountsStore.selectedAccountId) {
			composeStore.fetchDrafts(accountsStore.selectedAccountId);
		}
	});

	function handleCompose() {
		if (accountsStore.selectedAccountId) {
			composeStore.openCompose(accountsStore.selectedAccountId);
		}
	}

	function handleDraftClick(draftId: string) {
		composeStore.editDraft(draftId);
	}

	function handleDeleteDraft(draftId: string, event: Event) {
		event.stopPropagation();
		composeStore.deleteDraft(draftId);
	}

	function formatDate(dateString: string | null): string {
		if (!dateString) return '';
		const date = new Date(dateString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) {
			return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
		} else if (days === 1) {
			return 'Yesterday';
		} else if (days < 7) {
			return date.toLocaleDateString('en-US', { weekday: 'short' });
		} else {
			return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		}
	}
</script>

<svelte:head>
	<title>Drafts | Mail</title>
</svelte:head>

{#if authStore.isAuthenticated}
	<div class="flex h-[calc(100vh-100px)] gap-4">
		<!-- Sidebar -->
		<Sidebar onCompose={handleCompose} />

		<!-- Drafts List -->
		<div class="flex-1 flex flex-col min-w-0">
			<div class="flex items-center justify-between mb-4">
				<h1 class="text-2xl font-bold">Drafts</h1>
				<span class="text-sm text-muted-foreground">
					{composeStore.drafts.length} draft{composeStore.drafts.length !== 1 ? 's' : ''}
				</span>
			</div>

			<div class="flex-1 overflow-hidden rounded-lg border border-border bg-surface">
				<div class="h-full overflow-y-auto scrollbar-thin">
					{#if composeStore.loading && composeStore.drafts.length === 0}
						<div class="flex items-center justify-center h-32">
							<div class="text-muted-foreground">Loading drafts...</div>
						</div>
					{:else if composeStore.drafts.length === 0}
						<div class="flex items-center justify-center h-32">
							<div class="text-center">
								<div class="text-4xl mb-2">📝</div>
								<div class="text-muted-foreground">No drafts</div>
							</div>
						</div>
					{:else}
						{#each composeStore.drafts as draft}
							<div
								class="email-row cursor-pointer"
								onclick={() => handleDraftClick(draft.id)}
								role="button"
								tabindex="0"
								onkeydown={(e) => e.key === 'Enter' && handleDraftClick(draft.id)}
							>
								<!-- Draft Icon -->
								<span class="mr-3 text-muted-foreground">📝</span>

								<!-- Content -->
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2">
										<span class="font-medium text-sm truncate">
											{#if draft.toAddresses && draft.toAddresses.length > 0}
												To: {draft.toAddresses.map((a) => a.name || a.email).join(', ')}
											{:else}
												<span class="text-muted-foreground italic">No recipients</span>
											{/if}
										</span>
									</div>
									<div class="text-sm font-medium truncate">
										{draft.subject || '(No Subject)'}
									</div>
									<div class="text-xs text-muted-foreground truncate">
										{draft.bodyHtml?.replace(/<[^>]*>/g, '').slice(0, 100) || 'No content'}
									</div>
								</div>

								<!-- Delete Button -->
								<button
									class="btn btn-ghost btn-sm text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
									onclick={(e) => handleDeleteDraft(draft.id, e)}
									title="Delete draft"
								>
									🗑️
								</button>

								<!-- Date -->
								<div class="text-xs text-muted-foreground ml-2">
									{formatDate(draft.updatedAt)}
								</div>
							</div>
						{/each}
					{/if}
				</div>
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
