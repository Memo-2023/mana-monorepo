<script lang="ts">
	import { Card, Button, PageHeader } from '@manacore/shared-ui';
	import { Plus } from '@manacore/shared-icons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function getAvailableCredits(team: any) {
		return team.allocated_credits - team.used_credits;
	}

	function getRoleBadgeColor(role: string) {
		switch (role) {
			case 'team_admin':
				return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
		}
	}
</script>

<div>
	<PageHeader title="Teams" description="Manage your teams and collaborate with members" size="lg">
		{#snippet actions()}
			<Button variant="primary">
				<Plus size={20} class="mr-2" />
				Create Team
			</Button>
		{/snippet}
	</PageHeader>

	{#if data.teams && data.teams.length > 0}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each data.teams as team}
				<a href="/teams/{team.id}" class="block transition-transform hover:scale-[1.02]">
					<Card>
						<div class="mb-4 flex items-start justify-between">
							<div class="flex-1">
								<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
									{team.name}
								</h3>
								{#if team.organization}
									<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
										{team.organization.name}
									</p>
								{/if}
								{#if team.user_role}
									<span
										class="mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium {getRoleBadgeColor(
											team.user_role
										)}"
									>
										{team.user_role.replace('_', ' ')}
									</span>
								{/if}
							</div>
							<span class="text-2xl">👥</span>
						</div>

						<div class="space-y-3">
							<div>
								<div class="mb-1 flex items-center justify-between text-sm">
									<span class="text-gray-600 dark:text-gray-400">Credits</span>
									<span class="font-medium text-gray-900 dark:text-white">
										{getAvailableCredits(team)} / {team.allocated_credits}
									</span>
								</div>
								<div class="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
									<div
										class="h-full rounded-full bg-primary-600 transition-all"
										style="width: {(getAvailableCredits(team) / team.allocated_credits) * 100}%"
									></div>
								</div>
							</div>

							<div class="flex items-center justify-between text-sm">
								<span class="text-gray-600 dark:text-gray-400">Members</span>
								<span class="font-medium text-gray-900 dark:text-white">
									{team.member_count || 0}
								</span>
							</div>

							<div class="text-xs text-gray-500 dark:text-gray-400">
								Created {new Date(team.created_at).toLocaleDateString()}
							</div>
						</div>
					</Card>
				</a>
			{/each}
		</div>
	{:else}
		<Card>
			<div class="py-12 text-center">
				<span class="mb-4 block text-6xl">👥</span>
				<h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">No teams yet</h3>
				<p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
					Create or join a team to start collaborating
				</p>
				<Button variant="primary">Create Team</Button>
			</div>
		</Card>
	{/if}
</div>
