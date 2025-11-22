<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';

	let { data } = $props();

	const stats = $derived([
		{
			name: 'Available Mana',
			value: data.profile?.credits || 0,
			icon: '💰',
			showProgress: false
		},
		{
			name: 'Organizations',
			value: data.organizationCount || 0,
			icon: '🏢',
			showProgress: false
		},
		{
			name: 'Teams',
			value: data.teamCount || 0,
			icon: '👥',
			showProgress: false
		}
	]);
</script>

<div>
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
		<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
			Welcome back, {data.profile?.first_name || data.user?.email}
		</p>
	</div>

	<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
		{#each stats as stat}
			<Card>
				<div class="flex items-center">
					<div class="text-4xl">{stat.icon}</div>
					<div class="ml-4 flex-1">
						<p class="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
						<p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
							{stat.value}
						</p>
					</div>
				</div>
			</Card>
		{/each}
	</div>

	<div class="mt-8 grid gap-6 lg:grid-cols-2">
		<Card>
			<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
			<div class="space-y-2">
				<a
					href="/organizations"
					class="block rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
				>
					<div class="flex items-center">
						<span class="text-2xl">🏢</span>
						<div class="ml-3">
							<p class="font-medium text-gray-900 dark:text-white">Manage Organizations</p>
							<p class="text-sm text-gray-500 dark:text-gray-400">View and create organizations</p>
						</div>
					</div>
				</a>
				<a
					href="/teams"
					class="block rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
				>
					<div class="flex items-center">
						<span class="text-2xl">👥</span>
						<div class="ml-3">
							<p class="font-medium text-gray-900 dark:text-white">Manage Teams</p>
							<p class="text-sm text-gray-500 dark:text-gray-400">View and create teams</p>
						</div>
					</div>
				</a>
			</div>
		</Card>

		<Card>
			<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
			<p class="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
		</Card>
	</div>
</div>
