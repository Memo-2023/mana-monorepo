<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Building2, Users, Settings, Trash2, ArrowLeft, Mail, UserPlus, Shield, Check, X } from 'lucide-svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	let activeTab = $state<'general' | 'members' | 'danger'>('general');
	let isEditing = $state(false);
	let isSaving = $state(false);
	let inviteEmail = $state('');
	let inviteRole = $state<'admin' | 'member'>('member');
	let isInviting = $state(false);
	
	let workspaceName = $state(data.workspace?.name || '');
	let workspaceDescription = $state(data.workspace?.description || '');
	let workspaceSlug = $state(data.workspace?.slug || '');
	
	const isOwner = $derived(data.workspace?.owner === data.user?.id);
	const canManage = $derived(isOwner || data.currentMember?.role === 'admin');
</script>

<div class="mx-auto max-w-4xl">
	<!-- Header -->
	<div class="mb-8">
		<button
			onclick={() => goto('/settings')}
			class="mb-4 flex items-center gap-2 text-sm text-theme-text-muted hover:text-theme-text"
		>
			<ArrowLeft class="h-4 w-4" />
			Back to Settings
		</button>
		
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-theme-text">{data.workspace?.name}</h1>
				<p class="mt-2 text-theme-text-muted">
					Manage your workspace settings and team members
				</p>
			</div>
			{#if data.workspace?.type === 'team'}
				<div class="rounded-lg bg-purple-100 dark:bg-purple-900/20 px-3 py-1">
					<span class="text-sm font-medium text-purple-700 dark:text-purple-300">
						Team Workspace
					</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Tabs -->
	<div class="mb-6 border-b border-theme-border">
		<nav class="flex gap-6">
			<button
				onclick={() => activeTab = 'general'}
				class="border-b-2 px-1 pb-3 text-sm font-medium transition-colors {activeTab === 'general'
					? 'border-theme-primary text-theme-primary'
					: 'border-transparent text-theme-text-muted hover:text-theme-text'}"
			>
				<div class="flex items-center gap-2">
					<Settings class="h-4 w-4" />
					General
				</div>
			</button>
			<button
				onclick={() => activeTab = 'members'}
				class="border-b-2 px-1 pb-3 text-sm font-medium transition-colors {activeTab === 'members'
					? 'border-theme-primary text-theme-primary'
					: 'border-transparent text-theme-text-muted hover:text-theme-text'}"
			>
				<div class="flex items-center gap-2">
					<Users class="h-4 w-4" />
					Members ({data.members?.length || 0})
				</div>
			</button>
			{#if isOwner}
				<button
					onclick={() => activeTab = 'danger'}
					class="border-b-2 px-1 pb-3 text-sm font-medium transition-colors {activeTab === 'danger'
						? 'border-red-500 text-red-500'
						: 'border-transparent text-theme-text-muted hover:text-red-500'}"
				>
					<div class="flex items-center gap-2">
						<Trash2 class="h-4 w-4" />
						Danger Zone
					</div>
				</button>
			{/if}
		</nav>
	</div>

	<!-- Tab Content -->
	<div class="rounded-lg bg-white shadow-sm dark:bg-gray-800">
		{#if activeTab === 'general'}
			<!-- General Settings -->
			<div class="p-6">
				<h2 class="mb-4 text-lg font-semibold text-theme-text">General Settings</h2>
				
				<form 
					method="POST"
					action="?/update"
					use:enhance={() => {
						isSaving = true;
						return async ({ update }) => {
							await update();
							isSaving = false;
							isEditing = false;
						};
					}}
					class="space-y-4"
				>
					<div>
						<label for="name" class="block text-sm font-medium text-theme-text mb-2">
							Workspace Name
						</label>
						<input
							id="name"
							name="name"
							type="text"
							bind:value={workspaceName}
							disabled={!isEditing || !canManage}
							required
							class="w-full rounded-lg border border-theme-border bg-theme-background px-4 py-2 text-theme-text placeholder-theme-text-muted focus:border-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary/20 disabled:opacity-50"
						/>
					</div>

					<div>
						<label for="slug" class="block text-sm font-medium text-theme-text mb-2">
							Workspace URL Slug
						</label>
						<div class="flex items-center gap-2">
							<span class="text-sm text-theme-text-muted">/w/</span>
							<input
								id="slug"
								name="slug"
								type="text"
								bind:value={workspaceSlug}
								disabled={!isEditing || !canManage}
								pattern="[a-z0-9-]+"
								placeholder="workspace-slug"
								class="flex-1 rounded-lg border border-theme-border bg-theme-background px-4 py-2 text-theme-text placeholder-theme-text-muted focus:border-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary/20 disabled:opacity-50"
							/>
						</div>
						<p class="mt-1 text-xs text-theme-text-muted">
							Used for workspace links: /w/{workspaceSlug || 'workspace-slug'}/shortcode
						</p>
					</div>

					<div>
						<label for="description" class="block text-sm font-medium text-theme-text mb-2">
							Description
						</label>
						<textarea
							id="description"
							name="description"
							bind:value={workspaceDescription}
							disabled={!isEditing || !canManage}
							rows="3"
							class="w-full rounded-lg border border-theme-border bg-theme-background px-4 py-2 text-theme-text placeholder-theme-text-muted focus:border-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary/20 disabled:opacity-50"
						></textarea>
					</div>

					{#if canManage}
						<div class="flex justify-end gap-3 pt-4">
							{#if isEditing}
								<button
									type="button"
									onclick={() => {
										isEditing = false;
										workspaceName = data.workspace?.name || '';
										workspaceDescription = data.workspace?.description || '';
										workspaceSlug = data.workspace?.slug || '';
									}}
									class="rounded-lg px-4 py-2 text-sm font-medium text-theme-text transition-colors hover:bg-theme-surface-hover"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isSaving}
									class="rounded-lg bg-theme-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-theme-primary-hover disabled:opacity-50"
								>
									{isSaving ? 'Saving...' : 'Save Changes'}
								</button>
							{:else}
								<button
									type="button"
									onclick={() => isEditing = true}
									class="rounded-lg bg-theme-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-theme-primary-hover"
								>
									Edit Settings
								</button>
							{/if}
						</div>
					{/if}
				</form>
			</div>
		{:else if activeTab === 'members'}
			<!-- Members -->
			<div class="p-6">
				<div class="mb-6 flex items-center justify-between">
					<h2 class="text-lg font-semibold text-theme-text">Team Members</h2>
					{#if canManage}
						<button
							onclick={() => {/* Open invite modal */}}
							class="flex items-center gap-2 rounded-lg bg-theme-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-theme-primary-hover"
						>
							<UserPlus class="h-4 w-4" />
							Invite Member
						</button>
					{/if}
				</div>

				{#if canManage}
					<!-- Invite Form -->
					<div class="mb-6 rounded-lg bg-theme-surface p-4">
						<form 
							method="POST"
							action="?/invite"
							use:enhance={() => {
								isInviting = true;
								return async ({ update }) => {
									await update();
									isInviting = false;
									inviteEmail = '';
								};
							}}
							class="flex gap-3"
						>
							<input
								type="email"
								name="email"
								bind:value={inviteEmail}
								placeholder="colleague@example.com"
								required
								class="flex-1 rounded-lg border border-theme-border bg-theme-background px-4 py-2 text-theme-text placeholder-theme-text-muted focus:border-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary/20"
							/>
							<select
								name="role"
								bind:value={inviteRole}
								class="rounded-lg border border-theme-border bg-theme-background px-4 py-2 text-theme-text focus:border-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary/20"
							>
								<option value="member">Member</option>
								<option value="admin">Admin</option>
							</select>
							<button
								type="submit"
								disabled={isInviting || !inviteEmail}
								class="flex items-center gap-2 rounded-lg bg-theme-primary px-4 py-2 font-medium text-white hover:bg-theme-primary-hover disabled:opacity-50"
							>
								<Mail class="h-4 w-4" />
								Send Invite
							</button>
						</form>
					</div>
				{/if}

				<!-- Members List -->
				<div class="space-y-3">
					{#each data.members || [] as member}
						<div class="flex items-center justify-between rounded-lg border border-theme-border p-4">
							<div class="flex items-center gap-4">
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-theme-primary/10 text-theme-primary">
									{member.expand?.user?.email?.[0]?.toUpperCase() || 'U'}
								</div>
								<div>
									<p class="font-medium text-theme-text">
										{member.expand?.user?.name || member.expand?.user?.email}
									</p>
									<p class="text-sm text-theme-text-muted">
										{member.expand?.user?.email}
									</p>
								</div>
							</div>
							
							<div class="flex items-center gap-3">
								{#if member.role === 'owner'}
									<span class="rounded-full bg-purple-100 dark:bg-purple-900/20 px-3 py-1 text-xs font-medium text-purple-700 dark:text-purple-400">
										Owner
									</span>
								{:else if member.role === 'admin'}
									<span class="rounded-full bg-blue-100 dark:bg-blue-900/20 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
										Admin
									</span>
								{:else}
									<span class="rounded-full bg-gray-100 dark:bg-gray-900/20 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-400">
										Member
									</span>
								{/if}
								
								{#if member.invitation_status === 'pending'}
									<span class="rounded-full bg-yellow-100 dark:bg-yellow-900/20 px-3 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-400">
										Pending
									</span>
								{/if}
								
								{#if canManage && member.role !== 'owner'}
									<form 
										method="POST" 
										action="?/removeMember"
										use:enhance
									>
										<input type="hidden" name="memberId" value={member.id} />
										<button
											type="submit"
											class="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
											title="Remove member"
										>
											<Trash2 class="h-4 w-4" />
										</button>
									</form>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else if activeTab === 'danger'}
			<!-- Danger Zone -->
			<div class="p-6">
				<h2 class="mb-4 text-lg font-semibold text-red-600">Danger Zone</h2>
				
				<div class="rounded-lg border-2 border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
					<h3 class="mb-2 font-medium text-red-800 dark:text-red-400">
						Delete Workspace
					</h3>
					
					{#if data.workspace?.type === 'personal'}
						<p class="mb-4 text-sm text-red-700 dark:text-red-300">
							Personal workspaces cannot be deleted. They are permanently associated with your account.
						</p>
						<button
							disabled
							class="rounded-lg bg-gray-400 px-4 py-2 text-sm font-medium text-white cursor-not-allowed opacity-50"
						>
							Cannot Delete Personal Workspace
						</button>
					{:else}
						<p class="mb-4 text-sm text-red-700 dark:text-red-300">
							Once you delete a workspace, there is no going back. All links, settings, and team access will be permanently removed.
						</p>
					<form 
						method="POST" 
						action="?/delete"
						use:enhance={() => {
							return async ({ result, update }) => {
								if (result.type === 'success' && result.data?.deleted) {
									// Workspace was deleted successfully, navigate and refresh
									await goto('/settings/workspaces', { invalidateAll: true });
								} else if (result.type === 'redirect') {
									// Handle redirect (shouldn't happen now but keep as fallback)
									await goto('/settings/workspaces', { invalidateAll: true });
								} else {
									// Handle errors
									await update();
								}
							};
						}}
						onsubmit={(e) => {
							if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
								e.preventDefault();
							}
						}}
					>
						<button
							type="submit"
							class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
						>
							Delete Workspace
						</button>
					</form>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- Success/Error Messages -->
	{#if form?.success}
		<div class="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
			<p class="text-sm text-green-700 dark:text-green-400">
				{form.message || 'Changes saved successfully'}
			</p>
		</div>
	{/if}
	
	{#if form?.error}
		<div class="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
			<p class="text-sm text-red-700 dark:text-red-400">
				{form.error}
			</p>
		</div>
	{/if}
</div>