<div class="p-6 animate-pulse">
	<!-- Header -->
	<div class="mb-6">
		<div class="mb-4 h-4 w-32 rounded bg-muted"></div>
		<div class="h-8 w-3/4 rounded bg-muted"></div>
		<div class="mt-2 h-5 w-1/2 rounded bg-muted"></div>

		<div class="mt-4 flex items-center gap-3">
			<div class="h-6 w-24 rounded-full bg-muted"></div>
			<div class="h-6 w-20 rounded-full bg-muted"></div>
			<div class="h-6 w-16 rounded-full bg-muted"></div>
		</div>
	</div>

	<!-- Research Results -->
	<div class="mb-8">
		<div class="mb-4 h-6 w-40 rounded bg-muted"></div>
		<div class="rounded-xl border border-border bg-card p-6">
			<div class="mb-4 h-5 w-24 rounded bg-muted"></div>
			<div class="space-y-2">
				<div class="h-4 w-full rounded bg-muted"></div>
				<div class="h-4 w-full rounded bg-muted"></div>
				<div class="h-4 w-3/4 rounded bg-muted"></div>
			</div>

			<div class="mt-6 mb-4 h-5 w-28 rounded bg-muted"></div>
			<div class="space-y-2">
				<div class="h-4 w-2/3 rounded bg-muted"></div>
				<div class="h-4 w-1/2 rounded bg-muted"></div>
				<div class="h-4 w-3/4 rounded bg-muted"></div>
			</div>
		</div>
	</div>

	<!-- Sources -->
	<div>
		<div class="mb-4 h-6 w-32 rounded bg-muted"></div>
		<div class="space-y-3">
			{#each Array(3) as _}
				<div class="rounded-lg border border-border bg-card p-4">
					<div class="flex items-start gap-4">
						<div class="flex-1">
							<div class="h-5 w-3/4 rounded bg-muted"></div>
							<div class="mt-1 h-4 w-1/4 rounded bg-muted"></div>
							<div class="mt-2 h-4 w-full rounded bg-muted"></div>
							<div class="mt-3 flex gap-4">
								<div class="h-4 w-16 rounded bg-muted"></div>
								<div class="h-4 w-20 rounded bg-muted"></div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
