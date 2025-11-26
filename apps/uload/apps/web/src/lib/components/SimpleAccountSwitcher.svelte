<script lang="ts">
	import { ChevronDown, User, Users, Check } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { User as UserType, SharedAccess } from '$lib/types/accounts';
	
	interface Props {
		user: UserType | null;
		sharedAccounts?: SharedAccess[];
	}
	
	let { user, sharedAccounts = [] }: Props = $props();
	
	let isOpen = $state(false);
	let currentAccount = $state<string>(user?.id || '');
	
	// Get current viewing context from URL params or session
	$effect(() => {
		const viewingAs = $page.url.searchParams.get('viewing_as');
		if (viewingAs) {
			currentAccount = viewingAs;
		} else {
			currentAccount = user?.id || '';
		}
	});
	
	async function switchAccount(accountId: string) {
		if (accountId === currentAccount) {
			isOpen = false;
			return;
		}
		
		// Update URL with viewing context
		const url = new URL($page.url);
		if (accountId === user?.id) {
			url.searchParams.delete('viewing_as');
		} else {
			url.searchParams.set('viewing_as', accountId);
		}
		
		await goto(url.toString());
		isOpen = false;
	}
	
	// Get display name for current account
	const currentAccountName = $derived(() => {
		if (currentAccount === user?.id) {
			return user?.name || user?.username || 'My Account';
		}
		
		const shared = sharedAccounts.find(s => s.owner === currentAccount);
		if (shared?.expand?.owner) {
			return shared.expand.owner.name || shared.expand.owner.username || shared.expand.owner.email;
		}
		
		return 'Unknown Account';
	});
	
	// Check if viewing a shared account
	const isViewingShared = $derived(currentAccount !== user?.id);
</script>

{#if user && sharedAccounts.length > 0}
	<div class="relative">
		<button
			onclick={() => isOpen = !isOpen}
			class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-theme-text hover:bg-theme-surface-hover transition-colors"
		>
			<div class="flex items-center gap-2">
				{#if isViewingShared}
					<Users class="h-4 w-4 text-theme-primary" />
				{:else}
					<User class="h-4 w-4" />
				{/if}
				<span>{currentAccountName()}</span>
			</div>
			<ChevronDown class="h-4 w-4 {isOpen ? 'rotate-180' : ''} transition-transform" />
		</button>
		
		{#if isOpen}
			<!-- Backdrop -->
			<button
				onclick={() => isOpen = false}
				class="fixed inset-0 z-40"
				aria-label="Close menu"
			></button>
			
			<!-- Dropdown -->
			<div class="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800">
				<div class="p-2">
					<!-- My Account -->
					<button
						onclick={() => switchAccount(user.id)}
						class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-theme-surface-hover transition-colors"
					>
						<div class="flex items-center gap-3">
							<User class="h-4 w-4 text-theme-text-muted" />
							<div>
								<p class="text-sm font-medium text-theme-text">My Account</p>
								<p class="text-xs text-theme-text-muted">{user.email}</p>
							</div>
						</div>
						{#if currentAccount === user.id}
							<Check class="h-4 w-4 text-theme-primary" />
						{/if}
					</button>
					
					{#if sharedAccounts.length > 0}
						<div class="my-2 border-t border-theme-border"></div>
						
						<!-- Shared Accounts -->
						<div class="mb-1 px-3 py-1">
							<p class="text-xs font-medium text-theme-text-muted">Team Accounts</p>
						</div>
						
						{#each sharedAccounts as shared}
							{#if shared.invitation_status === 'accepted'}
								<button
									onclick={() => switchAccount(shared.owner)}
									class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-theme-surface-hover transition-colors"
								>
									<div class="flex items-center gap-3">
										<Users class="h-4 w-4 text-theme-text-muted" />
										<div>
											<p class="text-sm font-medium text-theme-text">
												{shared.expand?.owner?.name || shared.expand?.owner?.username || 'Team Account'}
											</p>
											<p class="text-xs text-theme-text-muted">
												{shared.expand?.owner?.email}
											</p>
										</div>
									</div>
									{#if currentAccount === shared.owner}
										<Check class="h-4 w-4 text-theme-primary" />
									{/if}
								</button>
							{/if}
						{/each}
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}