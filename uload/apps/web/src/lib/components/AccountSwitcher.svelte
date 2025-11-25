<script lang="ts">
	import { ChevronDown, User, Check, Users, UserPlus } from 'lucide-svelte';
	import { accountsStore, currentViewingAccount } from '$lib/stores/accounts';
	import { clickOutside } from '$lib/actions/clickOutside';
	import { fade, scale } from 'svelte/transition';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import * as m from '$paraglide/messages';

	interface Props {
		position?: 'right' | 'left-outside';
	}

	let { position = 'right' }: Props = $props();
	let showDropdown = $state(false);
	let accounts = $derived($accountsStore);
	let currentAccount = $derived($currentViewingAccount);
	
	function toggleDropdown() {
		showDropdown = !showDropdown;
	}

	function handleClickOutside() {
		showDropdown = false;
	}

	async function switchToAccount(accountId: string) {
		await accountsStore.switchViewingContext(accountId);
		showDropdown = false;
		// Force page reload to update data
		window.location.reload();
	}

	function getAccountDisplayName(account: any): string {
		if (!account) return 'Unknown';
		return account.name || account.username || account.email;
	}
	
	function addAccount() {
		showDropdown = false;
		// Navigate to login page for adding existing account
		goto('/login?additional=true');
	}
</script>

<div class="relative" use:clickOutside={handleClickOutside}>
	<button
		onclick={toggleDropdown}
		class="flex items-center gap-2 rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-sm font-medium text-theme-text transition-colors hover:bg-theme-surface-hover"
		aria-expanded={showDropdown}
		aria-haspopup="true"
	>
		{#if currentAccount}
			{#if accounts.viewingAs !== accounts.currentUser?.id}
				<Users class="h-4 w-4 text-purple-500" />
			{:else}
				<User class="h-4 w-4 text-theme-text-muted" />
			{/if}
			<span class="max-w-[150px] truncate">
				{getAccountDisplayName(currentAccount)}
			</span>
			<ChevronDown class="h-4 w-4 text-theme-text-muted transition-transform {showDropdown ? 'rotate-180' : ''}" />
		{:else if accounts.currentUser}
			<User class="h-4 w-4 text-theme-text-muted" />
			<span class="max-w-[150px] truncate">
				{getAccountDisplayName(accounts.currentUser)}
			</span>
			<ChevronDown class="h-4 w-4 text-theme-text-muted transition-transform {showDropdown ? 'rotate-180' : ''}" />
		{/if}
	</button>

	{#if showDropdown}
		<div
			transition:scale={{ duration: 200, start: 0.95 }}
			class="absolute z-50 {position === 'left-outside' ? 'left-0 top-full mt-2' : 'right-0 mt-2'} w-72 {position === 'left-outside' ? 'origin-top-left' : 'origin-top-right'} rounded-lg border border-theme-border bg-theme-surface shadow-xl"
		>
			<!-- Personal Account Section -->
			{#if accounts.currentUser}
				<div class="border-b border-theme-border p-2">
					<div class="px-2 py-1 text-xs font-medium uppercase text-theme-text-muted">
						{m.account_my_account()}
					</div>
					<button
						onclick={() => switchToAccount(accounts.currentUser.id)}
						class="group relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-theme-surface-hover"
					>
						<User class="h-5 w-5 text-theme-text-muted" />
						<div class="flex-1 min-w-0">
							<div class="text-sm font-medium text-theme-text">
								{getAccountDisplayName(accounts.currentUser)}
							</div>
							<div class="text-xs text-theme-text-muted">
								@{accounts.currentUser.username}
							</div>
						</div>
						{#if accounts.viewingAs === accounts.currentUser.id}
							<Check class="h-4 w-4 text-theme-primary" />
						{/if}
					</button>
				</div>
			{/if}
			
			<!-- Team Accounts Section -->
			{#if accounts.sharedAccounts && accounts.sharedAccounts.length > 0}
				<div class="border-b border-theme-border p-2">
					<div class="px-2 py-1 text-xs font-medium uppercase text-theme-text-muted">
						{m.account_team_accounts()}
					</div>
					{#each accounts.sharedAccounts as shared}
						{#if shared.expand?.owner}
							<button
								onclick={() => switchToAccount(shared.owner)}
								class="group relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-theme-surface-hover"
							>
								<Users class="h-5 w-5 text-purple-500" />
								<div class="flex-1 min-w-0">
									<div class="text-sm font-medium text-theme-text">
										{getAccountDisplayName(shared.expand.owner)}
									</div>
									<div class="flex items-center gap-2 text-xs">
										<span class="text-theme-text-muted">
											@{shared.expand.owner.username}
										</span>
										<span class="rounded-full bg-purple-100 dark:bg-purple-900/20 px-1.5 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-400">
											{m.account_team_member()}
										</span>
									</div>
								</div>
								{#if accounts.viewingAs === shared.owner}
									<Check class="h-4 w-4 text-theme-primary" />
								{/if}
							</button>
						{/if}
					{/each}
				</div>
			{:else}
				<!-- Empty State for Team Accounts -->
				<div class="border-b border-theme-border p-4">
					<p class="text-center text-xs text-theme-text-muted">
						{m.account_no_team_accounts()}
					</p>
					<p class="mt-1 text-center text-xs text-theme-text-muted">
						{m.account_team_invite_info()}
					</p>
				</div>
			{/if}
			
			<!-- Add Account Button -->
			<div class="border-t border-theme-border p-2">
				<button
					onclick={addAccount}
					class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-theme-primary/10"
				>
					<div class="flex h-5 w-5 items-center justify-center rounded-full bg-theme-primary/10">
						<UserPlus class="h-3.5 w-3.5 text-theme-primary" />
					</div>
					<span class="text-theme-text">{m.account_add_account()}</span>
				</button>
			</div>

		</div>
	{/if}
</div>

<style>
	/* Custom styles if needed */
</style>