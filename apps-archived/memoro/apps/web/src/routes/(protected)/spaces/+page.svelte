<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Spaces - Memoro</title>
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Content Area -->
	<div class="flex-1 overflow-y-auto">
		<div class="mx-auto max-w-5xl space-y-6 pb-12">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold">Collaborative Spaces</h1>
					<p class="mt-1 text-theme-secondary">Work together with your team on shared memos</p>
				</div>
				<button class="btn-primary">+ Create Space</button>
			</div>

			<div class="card text-center py-12">
				<div class="text-6xl mb-4">🚀</div>
				<h2 class="text-2xl font-semibold mb-2">Spaces Coming Soon</h2>
				<p class="text-theme-secondary mb-6">
					Collaborative workspace features are under development. You'll soon be able to:
				</p>
				<ul class="text-left max-w-md mx-auto space-y-2 text-gray-700 dark:text-gray-300">
					<li>✓ Create shared workspaces for teams</li>
					<li>✓ Invite team members to collaborate</li>
					<li>✓ Share memos within spaces</li>
					<li>✓ Manage permissions and access</li>
					<li>✓ Track team activity and insights</li>
				</ul>
			</div>
		</div>
	</div>
</div>
