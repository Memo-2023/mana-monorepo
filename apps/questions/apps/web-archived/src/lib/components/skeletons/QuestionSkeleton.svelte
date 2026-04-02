<script lang="ts">
	interface Props {
		count?: number;
	}

	let { count = 5 }: Props = $props();
</script>

<div class="space-y-3">
	{#each Array(count) as _, i}
		<div class="rounded-xl border border-border bg-card p-4 animate-pulse">
			<div class="flex items-start gap-4">
				<!-- Status Icon -->
				<div class="mt-1">
					<div class="h-5 w-5 rounded-full bg-muted"></div>
				</div>

				<!-- Content -->
				<div class="flex-1">
					<div class="h-5 w-3/4 rounded bg-muted"></div>
					<div class="mt-2 h-4 w-1/2 rounded bg-muted"></div>

					<div class="mt-3 flex items-center gap-3">
						<div class="h-5 w-16 rounded-full bg-muted"></div>
						<div class="h-5 w-16 rounded-full bg-muted"></div>
						<div class="h-4 w-20 rounded bg-muted"></div>
					</div>
				</div>
			</div>
		</div>
	{/each}
</div>
