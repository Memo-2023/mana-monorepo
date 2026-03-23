<script lang="ts">
	import { page } from '$app/stores';
	import { Card, Button, PageHeader } from '@manacore/shared-ui';
	import { getOrganization } from '$lib/api/services/landing';
	import { onMount } from 'svelte';

	let { data } = $props();

	let org: any = $state(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	const tabs = [
		{ id: 'overview', label: 'Overview', icon: 'home' },
		{ id: 'landing', label: 'Landing Page', icon: 'globe' },
		{ id: 'members', label: 'Members', icon: 'users' },
	];

	let activeTab = $state('overview');

	const icons: Record<string, string> = {
		home: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />',
		globe:
			'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />',
		users:
			'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />',
	};

	onMount(async () => {
		const result = await getOrganization(data.orgId);
		if (result.data) {
			org = result.data;
		} else {
			error = result.error;
		}
		loading = false;
	});
</script>

{#if loading}
	<div class="flex items-center justify-center py-20">
		<div
			class="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"
		></div>
	</div>
{:else if error}
	<Card>
		<div class="py-12 text-center">
			<p class="text-red-500">{error}</p>
			<a href="/organizations" class="mt-4 inline-block text-sm text-primary-600 hover:underline">
				Back to organizations
			</a>
		</div>
	</Card>
{:else if org}
	<div class="space-y-6">
		<PageHeader title={org.name} description={org.slug ? `${org.slug}.mana.how` : 'Organization'}>
			{#snippet actions()}
				<a
					href="/organizations"
					class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
				>
					Back
				</a>
			{/snippet}
		</PageHeader>

		<!-- Tabs -->
		<nav class="flex gap-1 border-b pb-px">
			{#each tabs as tab}
				{@const active = activeTab === tab.id}
				<button
					onclick={() => {
						if (tab.id === 'landing') {
							window.location.href = `/organizations/${data.orgId}/landing`;
						} else {
							activeTab = tab.id;
						}
					}}
					class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
						{active
						? 'text-primary border-b-2 border-primary -mb-px bg-primary/5'
						: 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						{@html icons[tab.id]}
					</svg>
					{tab.label}
				</button>
			{/each}
		</nav>

		<!-- Tab Content -->
		{#if activeTab === 'overview'}
			<div class="grid gap-6 md:grid-cols-2">
				<Card>
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Details</h3>
					<dl class="space-y-3 text-sm">
						<div>
							<dt class="text-gray-500 dark:text-gray-400">Name</dt>
							<dd class="font-medium text-gray-900 dark:text-white">{org.name}</dd>
						</div>
						{#if org.slug}
							<div>
								<dt class="text-gray-500 dark:text-gray-400">Slug</dt>
								<dd class="font-medium text-gray-900 dark:text-white">{org.slug}</dd>
							</div>
						{/if}
						<div>
							<dt class="text-gray-500 dark:text-gray-400">Created</dt>
							<dd class="font-medium text-gray-900 dark:text-white">
								{new Date(org.createdAt).toLocaleDateString()}
							</dd>
						</div>
					</dl>
				</Card>

				<Card>
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Landing Page</h3>
					{#if org.metadata?.landingPage?.enabled}
						<div class="space-y-2">
							<p class="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
								<span class="h-2 w-2 rounded-full bg-green-500"></span>
								Active
							</p>
							{#if org.metadata.landingPage.publishedUrl}
								<a
									href={org.metadata.landingPage.publishedUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="text-sm text-primary-600 hover:underline"
								>
									{org.metadata.landingPage.publishedUrl}
								</a>
							{/if}
						</div>
					{:else}
						<p class="text-sm text-gray-500 dark:text-gray-400">Not configured yet</p>
					{/if}
					<div class="mt-4">
						<a href="/organizations/{data.orgId}/landing">
							<Button variant="primary" size="sm">Configure Landing Page</Button>
						</a>
					</div>
				</Card>
			</div>
		{:else if activeTab === 'members'}
			<Card>
				<div class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
					Member management coming soon.
				</div>
			</Card>
		{/if}
	</div>
{/if}
