<!--
  Admin — workbench card with tabs.

  One card, four tabs: Overview / Users / System / User Data. Having all
  admin surfaces under one id keeps the scene-picker uncluttered while
  letting power-users arrange them inside the workbench like any other
  card. The `initialTab` prop lets the /admin/* route wrappers deep-link
  directly to a tab.

  Admin-role guard lives here at the container level so a non-admin
  sees one gate-screen, not four.
-->
<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { ShieldWarning } from '@mana/shared-icons';
	import OverviewTab from './tabs/OverviewTab.svelte';
	import UsersTab from './tabs/UsersTab.svelte';
	import SystemTab from './tabs/SystemTab.svelte';
	import UserDataTab from './tabs/UserDataTab.svelte';

	type TabId = 'overview' | 'users' | 'system' | 'user-data';

	interface Props {
		initialTab?: TabId;
	}

	let { initialTab = 'overview' }: Props = $props();

	let activeTab = $state<TabId>(initialTab);
	let isAdmin = $derived(authStore.user?.role === 'admin');

	const tabs: { id: TabId; label: string }[] = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'users', label: 'Users' },
		{ id: 'system', label: 'System' },
		{ id: 'user-data', label: 'User Data' },
	];
</script>

{#if !isAdmin}
	<div class="admin-gate">
		<ShieldWarning size={40} />
		<h3>Admin-only</h3>
		<p>Das Admin-Dashboard ist nur für Admin-Nutzer sichtbar.</p>
	</div>
{:else}
	<div class="admin-card">
		<div class="tabs" role="tablist" aria-label="Admin sections">
			{#each tabs as tab}
				<button
					type="button"
					role="tab"
					class="tab"
					class:active={activeTab === tab.id}
					aria-selected={activeTab === tab.id}
					onclick={() => (activeTab = tab.id)}
				>
					{tab.label}
				</button>
			{/each}
		</div>

		<div class="tab-content">
			{#if activeTab === 'overview'}
				<OverviewTab />
			{:else if activeTab === 'users'}
				<UsersTab />
			{:else if activeTab === 'system'}
				<SystemTab />
			{:else if activeTab === 'user-data'}
				<UserDataTab />
			{/if}
		</div>
	</div>
{/if}

<style>
	.admin-gate {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 2rem;
		text-align: center;
		height: 100%;
		color: hsl(var(--color-muted-foreground));
	}

	.admin-gate h3 {
		font-size: 1rem;
		font-weight: 500;
		margin: 0;
		color: hsl(var(--color-foreground));
	}

	.admin-gate p {
		font-size: 0.875rem;
		max-width: 24rem;
		margin: 0;
	}

	.admin-card {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 1rem;
		gap: 1rem;
		color: hsl(var(--color-foreground));
	}

	.tabs {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid hsl(var(--color-border));
		padding-bottom: 0;
		overflow-x: auto;
	}

	.tab {
		padding: 0.5rem 0.875rem;
		background: transparent;
		border: 0;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		color: hsl(var(--color-muted-foreground));
		font: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			color 120ms ease,
			border-color 120ms ease;
		white-space: nowrap;
	}

	.tab:hover {
		color: hsl(var(--color-foreground));
	}

	.tab.active {
		color: hsl(var(--color-foreground));
		border-bottom-color: var(--pill-primary-color, hsl(var(--color-primary, 230 80% 55%)));
	}

	.tab-content {
		flex: 1;
		min-height: 0;
	}
</style>
