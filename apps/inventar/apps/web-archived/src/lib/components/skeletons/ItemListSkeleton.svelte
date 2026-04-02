<script lang="ts">
	interface Props {
		count?: number;
	}

	let { count = 8 }: Props = $props();
</script>

<div class="space-y-2">
	{#each Array(count) as _}
		<div
			class="animate-pulse flex items-center gap-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3"
		>
			<div class="flex-1 space-y-2">
				<div class="flex items-center gap-2">
					<div class="h-4 w-40 rounded bg-[hsl(var(--muted))]"></div>
					<div class="h-5 w-16 rounded-full bg-[hsl(var(--muted))]"></div>
				</div>
				<div class="flex gap-3">
					<div class="h-3 w-24 rounded bg-[hsl(var(--muted))]"></div>
					<div class="h-3 w-20 rounded bg-[hsl(var(--muted))]"></div>
				</div>
			</div>
		</div>
	{/each}
</div>
