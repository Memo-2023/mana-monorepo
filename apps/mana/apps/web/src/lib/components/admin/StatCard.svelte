<script lang="ts">
	interface Props {
		title: string;
		value: string | number;
		change?: number;
		changeLabel?: string;
		icon?: 'users' | 'activity' | 'chart' | 'clock' | 'shield' | 'alert';
		loading?: boolean;
	}

	let { title, value, change, changeLabel, icon = 'chart', loading = false }: Props = $props();

	const icons = {
		users: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />`,
		activity: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />`,
		chart: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />`,
		clock: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />`,
		shield: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />`,
		alert: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />`,
	};
</script>

<div class="rounded-lg border bg-card p-6 shadow-sm">
	{#if loading}
		<div class="flex items-center gap-4 animate-pulse">
			<div class="rounded-full bg-muted p-3 h-12 w-12"></div>
			<div class="flex-1">
				<div class="h-4 bg-muted rounded w-24 mb-2"></div>
				<div class="h-8 bg-muted rounded w-16"></div>
			</div>
		</div>
	{:else}
		<div class="flex items-center gap-4">
			<div class="rounded-full bg-primary/10 p-3">
				<svg class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					{@html icons[icon]}
				</svg>
			</div>
			<div>
				<p class="text-sm text-muted-foreground">{title}</p>
				<p class="text-2xl font-bold">{value}</p>
				{#if change !== undefined}
					<p class="text-sm {change >= 0 ? 'text-green-500' : 'text-red-500'}">
						{change >= 0 ? '+' : ''}{change}%
						{#if changeLabel}
							<span class="text-muted-foreground">{changeLabel}</span>
						{/if}
					</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
