<script lang="ts">
	const plans = [
		{
			name: 'Free',
			price: '0',
			features: ['50 Links', 'Basis-Analytics', 'QR-Codes'],
			current: true,
		},
		{
			name: 'Pro',
			price: '4.99',
			features: ['Unbegrenzte Links', 'Erweiterte Analytics', 'Custom Domains', 'Team-Features'],
			current: false,
		},
	];
</script>

<div class="mx-auto max-w-4xl">
	<h1 class="mb-8 text-center text-3xl font-bold">Preise</h1>

	<div class="grid gap-6 md:grid-cols-2">
		{#each plans as plan}
			<div
				class="rounded-xl border-2 p-6 {plan.current
					? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
					: 'border-gray-200 dark:border-gray-700'}"
			>
				<h2 class="text-xl font-bold">{plan.name}</h2>
				<p class="mt-2 text-3xl font-bold">
					{plan.price === '0' ? 'Kostenlos' : `${plan.price}€/Monat`}
				</p>
				<ul class="mt-4 space-y-2">
					{#each plan.features as feature}
						<li class="flex items-center gap-2 text-sm">
							<span class="text-green-500">✓</span>
							{feature}
						</li>
					{/each}
				</ul>
				{#if plan.current}
					<p class="mt-4 text-center text-sm font-medium text-indigo-600">Aktueller Plan</p>
				{:else}
					<button
						class="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700"
					>
						Upgrade
					</button>
				{/if}
			</div>
		{/each}
	</div>
</div>
