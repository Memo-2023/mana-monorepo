<script lang="ts">
	let { data } = $props();

	const statusColors = {
		up: 'bg-emerald-500',
		degraded: 'bg-amber-500',
		down: 'bg-red-500',
	} as const;

	const overallColors = {
		operational: 'text-emerald-400',
		degraded: 'text-amber-400',
		outage: 'text-red-400',
	} as const;

	const overallLabels = {
		operational: 'All Systems Operational',
		degraded: 'Partial Degradation',
		outage: 'Major Outage',
	} as const;
</script>

<svelte:head>
	<title>System Status | ManaCore</title>
</svelte:head>

<div class="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-12">
	<div class="max-w-2xl mx-auto">
		<div class="text-center mb-10">
			<h1 class="text-3xl font-bold mb-2">ManaCore Status</h1>
			<p class="text-2xl font-semibold {overallColors[data.overallStatus]}">
				{overallLabels[data.overallStatus]}
			</p>
			<p class="text-sm text-neutral-500 mt-2">
				{data.summary.up}/{data.summary.total} services up
			</p>
		</div>

		<div class="space-y-2">
			{#each data.services as service}
				<div class="flex items-center justify-between px-4 py-3 rounded-lg bg-neutral-900">
					<div class="flex items-center gap-3">
						<span class="h-2.5 w-2.5 rounded-full {statusColors[service.status]}"></span>
						<span class="font-medium">{service.name}</span>
					</div>
					<div class="flex items-center gap-3 text-sm">
						{#if service.status === 'up'}
							<span class="text-neutral-500">{service.responseTimeMs}ms</span>
						{:else if service.status === 'degraded'}
							<span class="text-amber-400">{service.responseTimeMs}ms (slow)</span>
						{:else}
							<span class="text-red-400">{service.details || 'Down'}</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<p class="text-center text-sm text-neutral-600 mt-8">
			Last checked: {new Date(data.checkedAt).toLocaleString()}
		</p>
	</div>
</div>
