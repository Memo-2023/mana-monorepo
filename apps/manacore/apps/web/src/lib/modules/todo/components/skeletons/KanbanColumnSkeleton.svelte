<div class="flex min-w-[260px] max-w-[340px] flex-shrink-0 flex-col rounded-xl bg-muted/30 p-2">
	<div class="mb-2 flex items-center gap-2 px-2 py-2">
		<div class="h-2.5 w-2.5 animate-pulse rounded-full bg-muted"></div>
		<div class="h-4 w-20 animate-pulse rounded bg-muted"></div>
		<div class="h-4 w-6 animate-pulse rounded-full bg-muted"></div>
	</div>
	{#each Array(3) as _}
		<div class="mb-1.5 rounded-lg border border-border bg-card p-2.5">
			<div class="mb-2 h-4 w-4/5 animate-pulse rounded bg-muted"></div>
			<div class="flex gap-2">
				<div class="h-3 w-14 animate-pulse rounded bg-muted"></div>
				<div class="h-3 w-10 animate-pulse rounded bg-muted"></div>
			</div>
		</div>
	{/each}
</div>
