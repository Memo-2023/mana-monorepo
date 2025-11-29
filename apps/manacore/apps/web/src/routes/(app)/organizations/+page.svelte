<script lang="ts">
	import { Card, Button, PageHeader } from '@manacore/shared-ui';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function getAvailableCredits(org: any) {
		return org.total_credits - org.used_credits;
	}

	function getRoleBadgeColor(role: string) {
		switch (role) {
			case 'system_admin':
				return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
			case 'org_admin':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
			case 'team_admin':
				return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
		}
	}
</script>

<div>
	<PageHeader
		title="Organizations"
		description="Manage your organizations and allocate credits"
		size="lg"
	>
		{#snippet actions()}
			<Button variant="primary">
				<svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				Create Organization
			</Button>
		{/snippet}
	</PageHeader>

	{#if data.organizations && data.organizations.length > 0}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each data.organizations as org}
				<a href="/organizations/{org.id}" class="block transition-transform hover:scale-[1.02]">
					<Card>
						<div class="mb-4 flex items-start justify-between">
							<div class="flex-1">
								<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
									{org.name}
								</h3>
								{#if org.user_role}
									<span
										class="mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium {getRoleBadgeColor(
											org.user_role
										)}"
									>
										{org.user_role.replace('_', ' ')}
									</span>
								{/if}
							</div>
							<span class="text-2xl">🏢</span>
						</div>

						<div class="space-y-3">
							<div>
								<div class="mb-1 flex items-center justify-between text-sm">
									<span class="text-gray-600 dark:text-gray-400">Credits</span>
									<span class="font-medium text-gray-900 dark:text-white">
										{getAvailableCredits(org)} / {org.total_credits}
									</span>
								</div>
								<div class="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
									<div
										class="h-full rounded-full bg-primary-600 transition-all"
										style="width: {((org.total_credits - org.used_credits) / org.total_credits) *
											100}%"
									></div>
								</div>
							</div>

							<div class="flex items-center justify-between text-sm">
								<span class="text-gray-600 dark:text-gray-400">Teams</span>
								<span class="font-medium text-gray-900 dark:text-white">
									{org.team_count || 0}
								</span>
							</div>

							<div class="text-xs text-gray-500 dark:text-gray-400">
								Created {new Date(org.created_at).toLocaleDateString()}
							</div>
						</div>
					</Card>
				</a>
			{/each}
		</div>
	{:else}
		<Card>
			<div class="py-12 text-center">
				<span class="mb-4 block text-6xl">🏢</span>
				<h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
					No organizations yet
				</h3>
				<p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
					Create your first organization to get started
				</p>
				<Button variant="primary">Create Organization</Button>
			</div>
		</Card>
	{/if}
</div>
