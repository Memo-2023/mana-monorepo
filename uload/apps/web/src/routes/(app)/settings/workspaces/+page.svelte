<script lang="ts">
	import { goto } from '$app/navigation';
	import { Building2, Plus, Users, User, Settings, ExternalLink } from 'lucide-svelte';
	import type { PageData } from './$types';
	import { activeWorkspace } from '$lib/stores/activeWorkspace';

	let { data }: { data: PageData } = $props();
	
	function openWorkspace(workspace: any) {
		// Set the active workspace in the store
		activeWorkspace.set(workspace);
		// Navigate using the store's navigation helper
		activeWorkspace.goto('/my');
	}
</script>

<div class="mx-auto max-w-4xl">
	<!-- Header -->
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-theme-text">Workspaces</h1>
			<p class="mt-2 text-theme-text-muted">
				Manage your workspaces and switch between different contexts
			</p>
			<!-- Workspace count display -->
			<p class="mt-1 text-sm text-theme-text-muted">
				{data.teamWorkspaces.length} von {data.user?.subscription_tier === 'pro' ? '10' : data.user?.subscription_tier === 'business' ? 'unbegrenzt' : '1'} Team-Workspaces erstellt
			</p>
		</div>
		<button
			onclick={() => goto('/settings/workspaces/new')}
			class="flex items-center gap-2 rounded-lg bg-theme-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-theme-primary-hover"
		>
			<Plus class="h-4 w-4" />
			Create Workspace
		</button>
	</div>

	<!-- Workspace Grid -->
	<div class="grid gap-4 md:grid-cols-2">
		<!-- Personal Workspace -->
		{#if data.personalWorkspace}
			<div class="rounded-lg border border-theme-border bg-white p-6 shadow-sm transition-all hover:shadow-md dark:bg-gray-800">
				<div class="mb-4 flex items-start justify-between">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-theme-primary/10">
							<User class="h-5 w-5 text-theme-primary" />
						</div>
						<div>
							<h3 class="font-semibold text-theme-text">
								{data.personalWorkspace.name}
							</h3>
							<p class="text-sm text-theme-text-muted">Personal Workspace</p>
						</div>
					</div>
					<span class="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
						Active
					</span>
				</div>

				{#if data.personalWorkspace.description}
					<p class="mb-4 text-sm text-theme-text-muted">
						{data.personalWorkspace.description}
					</p>
				{/if}

				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4 text-sm text-theme-text-muted">
						<span>{data.personalStats?.links || 0} links</span>
						<span>{data.personalStats?.clicks || 0} clicks</span>
					</div>
					<div class="flex gap-2">
						<button
							onclick={() => openWorkspace(data.personalWorkspace)}
							class="rounded p-2 text-theme-text-muted transition-colors hover:bg-theme-surface-hover hover:text-theme-text"
							title="Open workspace"
						>
							<ExternalLink class="h-4 w-4" />
						</button>
						<button
							onclick={() => goto(`/settings/workspaces/${data.personalWorkspace?.id}`)}
							class="rounded p-2 text-theme-text-muted transition-colors hover:bg-theme-surface-hover hover:text-theme-text"
							title="Settings"
						>
							<Settings class="h-4 w-4" />
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Team Workspaces -->
		{#each data.teamWorkspaces as workspace}
			<div class="rounded-lg border border-theme-border bg-white p-6 shadow-sm transition-all hover:shadow-md dark:bg-gray-800">
				<div class="mb-4 flex items-start justify-between">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
							<Users class="h-5 w-5 text-purple-600 dark:text-purple-400" />
						</div>
						<div>
							<h3 class="font-semibold text-theme-text">
								{workspace.name}
							</h3>
							<p class="text-sm text-theme-text-muted">Team Workspace</p>
						</div>
					</div>
					{#if workspace.owner === data.user?.id}
						<span class="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
							Owner
						</span>
					{:else}
						<span class="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
							Member
						</span>
					{/if}
				</div>

				{#if workspace.description}
					<p class="mb-4 text-sm text-theme-text-muted">
						{workspace.description}
					</p>
				{/if}

				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4 text-sm text-theme-text-muted">
						<span>{workspace.memberCount || 0} members</span>
					</div>
					<div class="flex gap-2">
						<button
							onclick={() => openWorkspace(workspace)}
							class="rounded p-2 text-theme-text-muted transition-colors hover:bg-theme-surface-hover hover:text-theme-text"
							title="Open workspace"
						>
							<ExternalLink class="h-4 w-4" />
						</button>
						<button
							onclick={() => goto(`/settings/workspaces/${workspace.id}`)}
							class="rounded p-2 text-theme-text-muted transition-colors hover:bg-theme-surface-hover hover:text-theme-text"
							title="Settings"
						>
							<Settings class="h-4 w-4" />
						</button>
					</div>
				</div>
			</div>
		{/each}

		<!-- Workspace Invitations -->
		{#each data.invitations as invitation}
			<div class="rounded-lg border-2 border-dashed border-theme-border bg-theme-surface/50 p-6">
				<div class="mb-4 flex items-start justify-between">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
							<Users class="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
						</div>
						<div>
							<h3 class="font-semibold text-theme-text">
								{invitation.expand?.workspace?.name || 'Workspace Invitation'}
							</h3>
							<p class="text-sm text-theme-text-muted">Pending Invitation</p>
						</div>
					</div>
					<span class="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
						Pending
					</span>
				</div>

				<p class="mb-4 text-sm text-theme-text-muted">
					You've been invited to join this workspace
				</p>

				<div class="flex gap-2">
					<button
						onclick={() => goto(`/team/accept-invite?token=${invitation.invitation_token}`)}
						class="flex-1 rounded-lg bg-theme-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-theme-primary-hover"
					>
						Accept Invitation
					</button>
					<button
						class="flex-1 rounded-lg border border-theme-border px-3 py-2 text-sm font-medium text-theme-text transition-colors hover:bg-theme-surface-hover"
					>
						Decline
					</button>
				</div>
			</div>
		{/each}
	</div>

	<!-- Empty State -->
	{#if !data.personalWorkspace && data.teamWorkspaces.length === 0 && data.invitations.length === 0}
		<div class="rounded-lg border-2 border-dashed border-theme-border p-12 text-center">
			<Building2 class="mx-auto mb-4 h-12 w-12 text-theme-text-muted" />
			<h3 class="mb-2 text-lg font-medium text-theme-text">No workspaces yet</h3>
			<p class="mb-6 text-sm text-theme-text-muted">
				Create your first workspace to start organizing your links
			</p>
			<button
				onclick={() => goto('/settings/workspaces/new')}
				class="inline-flex items-center gap-2 rounded-lg bg-theme-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-theme-primary-hover"
			>
				<Plus class="h-4 w-4" />
				Create Workspace
			</button>
		</div>
	{/if}
</div>