<div class="flex min-h-screen animate-pulse">
	<!-- Sidebar -->
	<aside class="w-64 border-r border-border bg-card">
		<!-- Header -->
		<div class="flex h-16 items-center border-b border-border px-4">
			<div class="h-6 w-28 rounded bg-muted"></div>
		</div>

		<!-- New Question Button -->
		<div class="p-4">
			<div class="h-10 w-full rounded-lg bg-muted"></div>
		</div>

		<!-- Navigation -->
		<nav class="space-y-1 px-2">
			<div class="h-10 w-full rounded-lg bg-muted"></div>

			<div class="my-4 px-3">
				<div class="h-3 w-20 rounded bg-muted"></div>
			</div>

			{#each Array(4) as _}
				<div class="h-10 w-full rounded-lg bg-muted"></div>
			{/each}
		</nav>
	</aside>

	<!-- Main Content -->
	<main class="flex-1 p-6">
		<div class="mb-6">
			<div class="h-8 w-48 rounded bg-muted"></div>
			<div class="mt-2 h-4 w-32 rounded bg-muted"></div>
		</div>

		<div class="mb-6 flex gap-4">
			<div class="h-10 flex-1 rounded-lg bg-muted"></div>
			<div class="h-10 w-32 rounded-lg bg-muted"></div>
			<div class="h-10 w-24 rounded-lg bg-muted"></div>
		</div>

		<div class="space-y-3">
			{#each Array(5) as _}
				<div class="h-24 rounded-xl bg-muted"></div>
			{/each}
		</div>
	</main>
</div>
