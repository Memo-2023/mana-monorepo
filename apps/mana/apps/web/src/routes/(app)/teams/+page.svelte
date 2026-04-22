<script lang="ts">
	import { Card, Button, PageHeader } from '@mana/shared-ui';
	import { Plus } from '@mana/shared-icons';
	import { RoutePage } from '$lib/components/shell';
</script>

<RoutePage appId="teams">
	<div>
		<PageHeader
			title="Teams"
			description="Manage your teams and collaborate with members"
			size="lg"
		>
			{#snippet actions()}
				<Button variant="primary">
					<Plus size={20} class="mr-2" />
					Create Team
				</Button>
			{/snippet}
		</PageHeader>

		<Card>
			<div class="py-12 text-center">
				<span class="mb-4 block text-6xl">👥</span>
				<h3 class="mb-2 text-lg font-semibold text-foreground dark:text-white">No teams yet</h3>
				<p class="mb-6 text-sm text-muted-foreground dark:text-muted-foreground">
					Create or join a team to start collaborating
				</p>
				<Button variant="primary">Create Team</Button>
			</div>
		</Card>
	</div>
</RoutePage>
