<script lang="ts">
	export interface CostItem {
		action: string;
		actionKey?: string;
		cost: number;
		icon: string;
	}

	interface Props {
		costs: CostItem[];
	}

	let { costs }: Props = $props();

	// Icon mapping
	const iconPaths: Record<string, string> = {
		'mic-outline':
			'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
		'chatbubble-outline':
			'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
		'add-circle-outline':
			'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z',
		'copy-outline':
			'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
	};
</script>

<div class="rounded-xl p-4 bg-content border border-theme">
	<h3 class="mb-4 text-xl font-bold text-theme">Mana-Kosten</h3>

	<div class="space-y-3">
		{#each costs as item}
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<svg
						class="mr-2 h-[18px] w-[18px]"
						fill="none"
						stroke="#4287f5"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d={iconPaths[item.icon] || iconPaths['mic-outline']} />
					</svg>
					<p class="text-sm text-theme-secondary">
						{item.action}
					</p>
				</div>
				<p class="text-base font-semibold text-theme">
					{item.cost} Mana
				</p>
			</div>
		{/each}
	</div>
</div>
