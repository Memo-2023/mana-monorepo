<script lang="ts">
	import { PageHeader } from '@mana/shared-ui';
	import LandingEditor from '$lib/components/landing/LandingEditor.svelte';
	import { getOrganization } from '$lib/api/services/landing';
	import { onMount } from 'svelte';

	let { data } = $props();

	let org: any = $state(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

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
	<div class="py-12 text-center">
		<p class="text-red-500">{error}</p>
		<a
			href="/organizations/{data.orgId}"
			class="mt-4 inline-block text-sm text-primary-600 hover:underline"
		>
			Back to organization
		</a>
	</div>
{:else if org}
	<div class="space-y-6">
		<PageHeader title="Landing Page" description="Configure the public landing page for {org.name}">
			{#snippet actions()}
				<a
					href="/organizations/{data.orgId}"
					class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
				>
					Back to {org.name}
				</a>
			{/snippet}
		</PageHeader>

		<LandingEditor
			orgId={data.orgId}
			orgSlug={org.slug || ''}
			initialConfig={org.metadata?.landingPage}
			existingMetadata={org.metadata || {}}
		/>
	</div>
{/if}
