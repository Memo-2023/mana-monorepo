<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowSquareOut } from '@mana/shared-icons';
	import QuickLinks from '$lib/components/admin/QuickLinks.svelte';

	interface ServiceHealth {
		name: string;
		status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
		url: string;
		lastCheck?: string;
	}

	let services = $state<ServiceHealth[]>([]);
	let loading = $state(true);

	const monitoringLinks = [
		{
			name: 'Grafana - System Overview',
			url: 'https://grafana.mana.how/d/system-overview',
			description: 'CPU, Memory, Disk, Network',
			icon: 'grafana' as const,
		},
		{
			name: 'Grafana - Backends & Docker',
			url: 'https://grafana.mana.how/d/backends-docker',
			description: 'Container metrics & API performance',
			icon: 'docker' as const,
		},
		{
			name: 'Prometheus',
			url: 'https://grafana.mana.how/explore',
			description: 'Raw metrics & queries',
			icon: 'api' as const,
		},
		{
			name: 'Umami Analytics',
			url: 'https://stats.mana.how',
			description: 'Web analytics dashboard',
			icon: 'analytics' as const,
		},
	];

	const statusColors = {
		healthy: 'bg-green-500',
		degraded: 'bg-yellow-500',
		unhealthy: 'bg-red-500',
		unknown: 'bg-gray-400',
	};

	const statusLabels = {
		healthy: 'Healthy',
		degraded: 'Degraded',
		unhealthy: 'Unhealthy',
		unknown: 'Unknown',
	};

	onMount(async () => {
		// TODO: Replace with actual health check API
		await new Promise((resolve) => setTimeout(resolve, 500));

		services = [
			{ name: 'Mana Core Auth', status: 'healthy', url: 'https://auth.mana.how' },
			{ name: 'Mana Web', status: 'healthy', url: 'https://mana.how' },
			{ name: 'Chat Backend', status: 'healthy', url: 'https://chat-api.mana.how' },
			{ name: 'Chat Web', status: 'healthy', url: 'https://chat.mana.how' },
			{ name: 'Todo Backend', status: 'healthy', url: 'https://todo-api.mana.how' },
			{ name: 'Todo Web', status: 'healthy', url: 'https://todo.mana.how' },
			{ name: 'Calendar Backend', status: 'healthy', url: 'https://calendar-api.mana.how' },
			{ name: 'Calendar Web', status: 'healthy', url: 'https://calendar.mana.how' },
			{ name: 'Clock Backend', status: 'healthy', url: 'https://clock-api.mana.how' },
			{ name: 'Clock Web', status: 'healthy', url: 'https://clock.mana.how' },
			{ name: 'Contacts Backend', status: 'healthy', url: 'https://contacts-api.mana.how' },
			{ name: 'Contacts Web', status: 'healthy', url: 'https://contacts.mana.how' },
			{ name: 'PostgreSQL', status: 'healthy', url: '-' },
			{ name: 'Redis', status: 'healthy', url: '-' },
			{ name: 'Grafana', status: 'healthy', url: 'https://grafana.mana.how' },
			{ name: 'Umami', status: 'healthy', url: 'https://stats.mana.how' },
		];

		loading = false;
	});

	let healthyCount = $derived(services.filter((s) => s.status === 'healthy').length);
	let totalCount = $derived(services.length);
</script>

<div class="space-y-6">
	<!-- System Status Overview -->
	<div class="rounded-lg border bg-card p-6 shadow-sm">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-lg font-semibold">System Status</h3>
			{#if !loading}
				<div class="flex items-center gap-2">
					<div
						class="h-2.5 w-2.5 rounded-full {healthyCount === totalCount
							? 'bg-green-500'
							: 'bg-yellow-500'}"
					></div>
					<span class="text-sm font-medium">
						{healthyCount}/{totalCount} Services Healthy
					</span>
				</div>
			{/if}
		</div>

		{#if loading}
			<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
				{#each Array(8) as _}
					<div class="animate-pulse h-12 bg-muted rounded-lg"></div>
				{/each}
			</div>
		{:else}
			<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
				{#each services as service}
					<div class="flex items-center gap-3 p-3 rounded-lg border bg-background">
						<div class="h-2.5 w-2.5 rounded-full {statusColors[service.status]}"></div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium truncate">{service.name}</p>
							<p class="text-xs text-muted-foreground">{statusLabels[service.status]}</p>
						</div>
						{#if service.url !== '-'}
							<a
								href={service.url}
								target="_blank"
								rel="noopener noreferrer"
								class="text-muted-foreground hover:text-foreground"
							>
								<ArrowSquareOut size={16} />
							</a>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Monitoring Links -->
	<QuickLinks links={monitoringLinks} />

	<!-- Environment Info -->
	<div class="rounded-lg border bg-card p-6 shadow-sm">
		<h3 class="text-lg font-semibold mb-4">Environment</h3>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="space-y-3">
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Server</span>
					<span class="font-mono">Mac Mini (mana.how)</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Domain</span>
					<span class="font-mono">*.mana.how</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">SSL</span>
					<span class="font-mono text-green-600">Caddy (Auto)</span>
				</div>
			</div>
			<div class="space-y-3">
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Database</span>
					<span class="font-mono">PostgreSQL 16</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Cache</span>
					<span class="font-mono">Redis 7</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Tunnel</span>
					<span class="font-mono">Cloudflare</span>
				</div>
			</div>
		</div>
	</div>
</div>
