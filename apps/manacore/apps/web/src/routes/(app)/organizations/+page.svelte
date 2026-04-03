<script lang="ts">
	import { Card, Button, PageHeader } from '@manacore/shared-ui';
	import { Plus } from '@manacore/shared-icons';
</script>

<div>
	<PageHeader
		title="Organizations"
		description="Manage your organizations and allocate credits"
		size="lg"
	>
		{#snippet actions()}
			<Button variant="primary">
				<Plus size={20} class="mr-2" />
				Create Organization
			</Button>
		{/snippet}
	</PageHeader>

	<Card>
		<div class="py-12 text-center">
			<span class="mb-4 block text-6xl">🏢</span>
			<h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">No organizations yet</h3>
			<p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
				Create your first organization to get started
			</p>
			<Button variant="primary">Create Organization</Button>
		</div>
	</Card>
</div>
