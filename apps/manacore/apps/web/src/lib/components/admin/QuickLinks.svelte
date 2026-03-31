<script lang="ts">
	import { CaretRight } from '@manacore/shared-icons';

	interface Link {
		name: string;
		url: string;
		description: string;
		icon: 'grafana' | 'analytics' | 'docker' | 'api' | 'external';
	}

	let { links }: { links: Link[] } = $props();

	const icons = {
		grafana: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />`,
		analytics: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />`,
		docker: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />`,
		api: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />`,
		external: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />`,
	};
</script>

<div class="rounded-lg border bg-card p-6 shadow-sm">
	<h3 class="text-lg font-semibold mb-4">Quick Links</h3>
	<div class="grid gap-3">
		{#each links as link}
			<a
				href={link.url}
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors group"
			>
				<div class="rounded-md bg-primary/10 p-2">
					<svg class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						{@html icons[link.icon]}
					</svg>
				</div>
				<div class="flex-1 min-w-0">
					<p class="font-medium text-sm truncate">{link.name}</p>
					<p class="text-xs text-muted-foreground truncate">{link.description}</p>
				</div>
				<CaretRight
					size={20}
					class="text-muted-foreground group-hover:text-foreground transition-colors"
				/>
			</a>
		{/each}
	</div>
</div>
