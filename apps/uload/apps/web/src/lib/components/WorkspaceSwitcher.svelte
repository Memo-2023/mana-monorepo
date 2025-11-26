<script lang="ts">
	import { ChevronDown, Building2, Check, Users, Plus, User } from 'lucide-svelte';
	import { workspacesStore, currentWorkspace, allWorkspaces } from '$lib/stores/workspaces';
	import { activeWorkspace } from '$lib/stores/activeWorkspace';
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
	let workspaces = $derived($allWorkspaces);
	let workspacesState = $derived($workspacesStore);
	
	// Use activeWorkspace store as the primary source
	let activeWorkspaceId = $state(activeWorkspace.getId());
	let activeWorkspaceData = $state(activeWorkspace.getData());
	
	// Subscribe to activeWorkspace changes
	$effect(() => {
		const unsubId = activeWorkspace.id.subscribe(id => {
			activeWorkspaceId = id;
		});
		const unsubData = activeWorkspace.data.subscribe(data => {
			activeWorkspaceData = data;
		});
		
		return () => {
			unsubId();
			unsubData();
		};
	});
	
	// Derive current workspace from activeWorkspace or fallback to old store
	let current = $derived(activeWorkspaceData || $currentWorkspace);
	
	function toggleDropdown() {
		showDropdown = !showDropdown;
	}

	function handleClickOutside() {
		showDropdown = false;
	}

	async function switchToWorkspace(workspaceId: string) {
		// Find the workspace data
		const workspace = workspaces.find(w => w.id === workspaceId);
		if (workspace) {
			// Set in the new active workspace store
			activeWorkspace.set(workspace);
			// Also update the old store for compatibility
			await workspacesStore.switchWorkspace(workspaceId);
			showDropdown = false;
			// Navigate to maintain workspace context in URL
			const currentPath = $page.url.pathname;
			const searchParams = new URLSearchParams($page.url.search);
			searchParams.set('workspace', workspaceId);
			await goto(`${currentPath}?${searchParams.toString()}`);
		}
	}

	function getWorkspaceDisplayName(workspace: any): string {
		if (!workspace) return 'Unknown';
		return workspace.name || 'Unnamed Workspace';
	}
	
	function createWorkspace() {
		showDropdown = false;
		// Navigate to workspace creation page with current workspace context
		activeWorkspace.goto('/settings/workspaces/new');
	}
</script>

<div class="relative" use:clickOutside={handleClickOutside}>
	<button
		onclick={toggleDropdown}
		class="flex items-center gap-2 rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-sm font-medium text-theme-text transition-colors hover:bg-theme-surface-hover"
		aria-expanded={showDropdown}
		aria-haspopup="true"
	>
		{#if activeWorkspaceData || current}
			{#if (activeWorkspaceData || current).type === 'team'}
				<Users class="h-4 w-4 text-purple-500" />
			{:else}
				<User class="h-4 w-4 text-theme-text-muted" />
			{/if}
			<span class="max-w-[150px] truncate">
				{getWorkspaceDisplayName(activeWorkspaceData || current)}
			</span>
			<ChevronDown class="h-4 w-4 text-theme-text-muted transition-transform {showDropdown ? 'rotate-180' : ''}" />
		{:else}
			<Building2 class="h-4 w-4 text-theme-text-muted" />
			<span class="max-w-[150px] truncate">
				Select Workspace
			</span>
			<ChevronDown class="h-4 w-4 text-theme-text-muted transition-transform {showDropdown ? 'rotate-180' : ''}" />
		{/if}
	</button>

	{#if showDropdown}
		<div
			transition:scale={{ duration: 200, start: 0.95 }}
			class="absolute z-50 {position === 'left-outside' ? 'left-0 top-full mt-2' : 'right-0 mt-2'} w-72 {position === 'left-outside' ? 'origin-top-left' : 'origin-top-right'} rounded-lg border border-theme-border bg-theme-surface shadow-xl"
		>
			<!-- Personal Workspace Section -->
			{#if workspacesState.personalWorkspace}
				<div class="border-b border-theme-border p-2">
					<div class="px-2 py-1 text-xs font-medium uppercase text-theme-text-muted">
						Personal Workspace
					</div>
					<button
						onclick={() => workspacesState.personalWorkspace && switchToWorkspace(workspacesState.personalWorkspace.id)}
						class="group relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-theme-surface-hover"
					>
						<User class="h-5 w-5 text-theme-text-muted" />
						<div class="flex-1 min-w-0">
							<div class="text-sm font-medium text-theme-text">
								{getWorkspaceDisplayName(workspacesState.personalWorkspace)}
							</div>
							<div class="text-xs text-theme-text-muted">
								Your personal workspace
							</div>
						</div>
						{#if activeWorkspaceId === workspacesState.personalWorkspace.id}
							<Check class="h-4 w-4 text-theme-primary" />
						{/if}
					</button>
				</div>
			{/if}
			
			<!-- Team Workspaces Section -->
			{#if workspacesState.teamWorkspaces && workspacesState.teamWorkspaces.length > 0}
				<div class="border-b border-theme-border p-2">
					<div class="px-2 py-1 text-xs font-medium uppercase text-theme-text-muted">
						Team Workspaces
					</div>
					{#each workspacesState.teamWorkspaces as workspace}
						<button
							onclick={() => switchToWorkspace(workspace.id)}
							class="group relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-theme-surface-hover"
						>
							<Users class="h-5 w-5 text-purple-500" />
							<div class="flex-1 min-w-0">
								<div class="text-sm font-medium text-theme-text">
									{getWorkspaceDisplayName(workspace)}
								</div>
								{#if workspace.description}
									<div class="text-xs text-theme-text-muted">
										{workspace.description}
									</div>
								{/if}
							</div>
							{#if activeWorkspaceId === workspace.id}
								<Check class="h-4 w-4 text-theme-primary" />
							{/if}
						</button>
					{/each}
				</div>
			{:else}
				<!-- Empty State for Team Workspaces -->
				<div class="border-b border-theme-border p-4">
					<p class="text-center text-xs text-theme-text-muted">
						No team workspaces yet
					</p>
					<p class="mt-1 text-center text-xs text-theme-text-muted">
						Create or join a team workspace to collaborate
					</p>
				</div>
			{/if}
			
			<!-- Create Workspace Button -->
			<div class="border-t border-theme-border p-2">
				<button
					onclick={createWorkspace}
					class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-theme-primary/10"
				>
					<div class="flex h-5 w-5 items-center justify-center rounded-full bg-theme-primary/10">
						<Plus class="h-3.5 w-3.5 text-theme-primary" />
					</div>
					<span class="text-theme-text">Create Workspace</span>
				</button>
			</div>

		</div>
	{/if}
</div>

<style>
	/* Custom styles if needed */
</style>