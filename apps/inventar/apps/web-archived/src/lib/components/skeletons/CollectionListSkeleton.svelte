<script lang="ts">
	interface Props {
		count?: number;
	}

	let { count = 6 }: Props = $props();
</script>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
	{#each Array(count) as _}
		<div
			class="animate-pulse rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
		>
			<div class="flex items-center gap-3">
				<div class="h-10 w-10 rounded-lg bg-[hsl(var(--muted))]"></div>
				<div class="flex-1 space-y-2">
					<div class="h-4 w-32 rounded bg-[hsl(var(--muted))]"></div>
					<div class="h-3 w-48 rounded bg-[hsl(var(--muted))]"></div>
				</div>
			</div>
			<div class="mt-4 flex items-center justify-between">
				<div class="h-3 w-16 rounded bg-[hsl(var(--muted))]"></div>
				<div class="flex gap-1">
					<div class="h-4 w-12 rounded bg-[hsl(var(--muted))]"></div>
					<div class="h-4 w-12 rounded bg-[hsl(var(--muted))]"></div>
				</div>
			</div>
		</div>
	{/each}
</div>
