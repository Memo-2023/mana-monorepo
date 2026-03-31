<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { PageHeader } from '@manacore/shared-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import { tilingStore } from '$lib/stores/tiling.svelte';
	import { ManaCoreEvents } from '@manacore/shared-utils/analytics';
	import TilingLayout from '$lib/components/dashboard/TilingLayout.svelte';
	import { collectLeaves } from '$lib/utils/tiling-tree';
	import TilePanel from '$lib/components/dashboard/TilePanel.svelte';
	import { Check, PencilSimple } from '@manacore/shared-icons';

	let isMobile = $state(false);

	onMount(async () => {
		await tilingStore.initialize();
		isMobile = window.innerWidth < 768;
		const handleResize = () => (isMobile = window.innerWidth < 768);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	function handleToggleEditing() {
		tilingStore.toggleEditing();
		ManaCoreEvents.dashboardEditToggled(tilingStore.isEditing);
	}

	const mobileLeaves = $derived(tilingStore.initialized ? collectLeaves(tilingStore.root) : []);
</script>

<div class="flex h-[calc(100vh-10rem)] flex-col">
	<div class="mb-4 flex flex-shrink-0 items-center justify-between">
		<PageHeader
			title={$_('dashboard.title')}
			description="{$_('dashboard.welcome')}, {authStore.user?.email || 'User'}"
			size="lg"
		/>
		<div class="flex items-center gap-2">
			{#if tilingStore.isEditing}
				<button
					type="button"
					onclick={() => tilingStore.resetToDefault()}
					class="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/80"
				>
					Reset
				</button>
			{/if}
			<button
				type="button"
				onclick={handleToggleEditing}
				class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {tilingStore.isEditing
					? 'bg-primary text-primary-foreground'
					: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
			>
				{#if tilingStore.isEditing}
					<span class="flex items-center gap-2">
						<Check size={20} />
						{$_('dashboard.done')}
					</span>
				{:else}
					<span class="flex items-center gap-2">
						<PencilSimple size={16} />
						{$_('dashboard.customize')}
					</span>
				{/if}
			</button>
		</div>
	</div>

	{#if tilingStore.initialized}
		<div class="min-h-0 flex-1">
			{#if isMobile}
				<!-- Mobile: stacked vertical layout -->
				<div class="space-y-4 overflow-y-auto pb-8">
					{#each mobileLeaves as leaf (leaf.id)}
						<div class="h-72">
							<TilePanel {leaf} />
						</div>
					{/each}
				</div>
			{:else}
				<TilingLayout node={tilingStore.root} />
			{/if}
		</div>
	{/if}
</div>
