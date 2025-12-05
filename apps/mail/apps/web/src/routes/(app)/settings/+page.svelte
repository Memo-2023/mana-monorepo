<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { accountsStore } from '$lib/stores/accounts.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import ComposeModal from '$lib/components/ComposeModal.svelte';
	import { composeStore } from '$lib/stores/compose.svelte';

	let showAddAccount = $state(false);
	let newAccountForm = $state({
		name: '',
		email: '',
		imapHost: '',
		imapPort: 993,
		smtpHost: '',
		smtpPort: 587,
		password: '',
	});
	let testing = $state(false);
	let testResult = $state<{ success: boolean; message: string } | null>(null);

	// Redirect if not authenticated
	$effect(() => {
		if (authStore.initialized && !authStore.isAuthenticated) {
			goto('/login');
		}
	});

	function handleCompose() {
		if (accountsStore.selectedAccountId) {
			composeStore.openCompose(accountsStore.selectedAccountId);
		}
	}

	async function handleAddImapAccount() {
		const success = await accountsStore.addImapAccount(newAccountForm);
		if (success) {
			showAddAccount = false;
			newAccountForm = {
				name: '',
				email: '',
				imapHost: '',
				imapPort: 993,
				smtpHost: '',
				smtpPort: 587,
				password: '',
			};
		}
	}

	async function handleTestConnection() {
		testing = true;
		testResult = null;
		const result = await accountsStore.testConnection(newAccountForm);
		testResult = result;
		testing = false;
	}

	async function handleRemoveAccount(accountId: string) {
		if (confirm('Are you sure you want to remove this account?')) {
			await accountsStore.removeAccount(accountId);
		}
	}

	async function handleSetDefault(accountId: string) {
		await accountsStore.setDefaultAccount(accountId);
	}

	async function handleSyncAccount(accountId: string) {
		await accountsStore.syncAccount(accountId);
	}

	function handleGoogleOAuth() {
		accountsStore.initiateGoogleOAuth();
	}

	function handleMicrosoftOAuth() {
		accountsStore.initiateMicrosoftOAuth();
	}
</script>

<svelte:head>
	<title>Settings | Mail</title>
</svelte:head>

{#if authStore.isAuthenticated}
	<div class="flex h-[calc(100vh-100px)] gap-4">
		<!-- Sidebar -->
		<Sidebar onCompose={handleCompose} />

		<!-- Settings Content -->
		<div class="flex-1 flex flex-col min-w-0 overflow-y-auto">
			<h1 class="text-2xl font-bold mb-6">Settings</h1>

			<!-- Email Accounts Section -->
			<div class="bg-surface rounded-lg border border-border p-6 mb-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-semibold">Email Accounts</h2>
					<button class="btn btn-primary" onclick={() => (showAddAccount = true)}>
						+ Add Account
					</button>
				</div>

				{#if accountsStore.accounts.length === 0}
					<div class="text-center py-8">
						<div class="text-4xl mb-2">📧</div>
						<p class="text-muted-foreground">No email accounts connected</p>
						<p class="text-sm text-muted-foreground mt-1">
							Add an account to start receiving emails
						</p>
					</div>
				{:else}
					<div class="space-y-3">
						{#each accountsStore.accounts as account}
							<div class="flex items-center justify-between p-4 rounded-lg bg-muted/30">
								<div class="flex items-center gap-3">
									<div
										class="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
										style="background-color: hsl(217, 91%, 60%)"
									>
										{account.name[0].toUpperCase()}
									</div>
									<div>
										<div class="font-medium flex items-center gap-2">
											{account.name}
											{#if account.isDefault}
												<span class="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
													Default
												</span>
											{/if}
										</div>
										<div class="text-sm text-muted-foreground">{account.email}</div>
										<div class="text-xs text-muted-foreground capitalize">{account.provider}</div>
									</div>
								</div>
								<div class="flex items-center gap-2">
									<button
										class="btn btn-ghost btn-sm"
										onclick={() => handleSyncAccount(account.id)}
										disabled={accountsStore.loading}
										title="Sync now"
									>
										🔄
									</button>
									{#if !account.isDefault}
										<button
											class="btn btn-ghost btn-sm"
											onclick={() => handleSetDefault(account.id)}
											title="Set as default"
										>
											⭐
										</button>
									{/if}
									<button
										class="btn btn-ghost btn-sm text-destructive"
										onclick={() => handleRemoveAccount(account.id)}
										title="Remove account"
									>
										🗑️
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Add Account Modal -->
			{#if showAddAccount}
				<div class="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
					<div class="bg-surface rounded-xl shadow-2xl w-[500px] max-h-[80vh] overflow-y-auto">
						<div class="p-6 border-b border-border">
							<div class="flex items-center justify-between">
								<h3 class="text-lg font-semibold">Add Email Account</h3>
								<button class="btn btn-ghost btn-icon" onclick={() => (showAddAccount = false)}>
									✕
								</button>
							</div>
						</div>

						<div class="p-6">
							<!-- OAuth Options -->
							<div class="mb-6">
								<p class="text-sm text-muted-foreground mb-3">Connect with OAuth:</p>
								<div class="flex gap-3">
									<button class="btn btn-secondary flex-1" onclick={handleGoogleOAuth}>
										<span class="mr-2">📧</span> Google
									</button>
									<button class="btn btn-secondary flex-1" onclick={handleMicrosoftOAuth}>
										<span class="mr-2">📧</span> Microsoft
									</button>
								</div>
							</div>

							<div class="relative my-6">
								<div class="absolute inset-0 flex items-center">
									<div class="w-full border-t border-border"></div>
								</div>
								<div class="relative flex justify-center text-xs uppercase">
									<span class="bg-surface px-2 text-muted-foreground">Or add manually</span>
								</div>
							</div>

							<!-- Manual IMAP/SMTP Form -->
							<div class="space-y-4">
								<div>
									<label class="text-sm font-medium mb-1 block">Account Name</label>
									<input
										type="text"
										class="input w-full"
										bind:value={newAccountForm.name}
										placeholder="Work Email"
									/>
								</div>

								<div>
									<label class="text-sm font-medium mb-1 block">Email Address</label>
									<input
										type="email"
										class="input w-full"
										bind:value={newAccountForm.email}
										placeholder="you@example.com"
									/>
								</div>

								<div>
									<label class="text-sm font-medium mb-1 block">Password</label>
									<input
										type="password"
										class="input w-full"
										bind:value={newAccountForm.password}
										placeholder="••••••••"
									/>
								</div>

								<div class="grid grid-cols-2 gap-4">
									<div>
										<label class="text-sm font-medium mb-1 block">IMAP Host</label>
										<input
											type="text"
											class="input w-full"
											bind:value={newAccountForm.imapHost}
											placeholder="imap.example.com"
										/>
									</div>
									<div>
										<label class="text-sm font-medium mb-1 block">IMAP Port</label>
										<input
											type="number"
											class="input w-full"
											bind:value={newAccountForm.imapPort}
											placeholder="993"
										/>
									</div>
								</div>

								<div class="grid grid-cols-2 gap-4">
									<div>
										<label class="text-sm font-medium mb-1 block">SMTP Host</label>
										<input
											type="text"
											class="input w-full"
											bind:value={newAccountForm.smtpHost}
											placeholder="smtp.example.com"
										/>
									</div>
									<div>
										<label class="text-sm font-medium mb-1 block">SMTP Port</label>
										<input
											type="number"
											class="input w-full"
											bind:value={newAccountForm.smtpPort}
											placeholder="587"
										/>
									</div>
								</div>

								{#if testResult}
									<div
										class="p-3 rounded-lg text-sm {testResult.success
											? 'bg-green-500/10 text-green-600'
											: 'bg-destructive/10 text-destructive'}"
									>
										{testResult.message}
									</div>
								{/if}

								<div class="flex gap-3 pt-4">
									<button
										class="btn btn-secondary flex-1"
										onclick={handleTestConnection}
										disabled={testing}
									>
										{testing ? 'Testing...' : 'Test Connection'}
									</button>
									<button
										class="btn btn-primary flex-1"
										onclick={handleAddImapAccount}
										disabled={accountsStore.loading}
									>
										{accountsStore.loading ? 'Adding...' : 'Add Account'}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- User Info Section -->
			<div class="bg-surface rounded-lg border border-border p-6">
				<h2 class="text-lg font-semibold mb-4">User Information</h2>
				<div class="space-y-2">
					<div class="flex justify-between">
						<span class="text-muted-foreground">Email:</span>
						<span>{authStore.user?.email}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-muted-foreground">User ID:</span>
						<span class="text-sm font-mono">{authStore.user?.id}</span>
					</div>
				</div>

				<button
					class="btn btn-destructive mt-6 w-full"
					onclick={() => authStore.signOut().then(() => goto('/login'))}
				>
					Sign Out
				</button>
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
