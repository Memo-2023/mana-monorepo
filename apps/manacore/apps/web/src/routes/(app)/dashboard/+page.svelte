<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { Card, PageHeader } from '@manacore/shared-ui';
	import { creditsService } from '$lib/api/credits';
	import type { CreditBalance, CreditTransaction } from '$lib/api/credits';
	import { authStore } from '$lib/stores/auth.svelte';
	import { dashboardStore } from '$lib/stores/dashboard.svelte';
	import DashboardGrid from '$lib/components/dashboard/DashboardGrid.svelte';

	onMount(() => {
		dashboardStore.initialize();
	});
</script>

<div>
	<div class="mb-6 flex items-center justify-between">
		<PageHeader
			title={$_('dashboard.title')}
			description="{$_('dashboard.welcome')}, {authStore.user?.email || 'User'}"
			size="lg"
		/>
		<button
			type="button"
			onclick={() => dashboardStore.toggleEditing()}
			class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {dashboardStore.isEditing
				? 'bg-primary text-primary-foreground'
				: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
		>
			{#if dashboardStore.isEditing}
				<span class="flex items-center gap-2">
					<svg
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M5 13l4 4L19 7" />
					</svg>
					{$_('dashboard.done')}
				</span>
			{:else}
				<span class="flex items-center gap-2">
					<svg
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
						<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
					</svg>
					{$_('dashboard.customize')}
				</span>
			{/if}
		</button>
	</div>

	<DashboardGrid />
</div>
