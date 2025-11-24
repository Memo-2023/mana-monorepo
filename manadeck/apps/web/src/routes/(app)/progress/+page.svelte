<script lang="ts">
	import { Card } from '@manacore/shared-ui';
</script>

<svelte:head>
	<title>Progress - Manadeck</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold">Progress</h1>
		<p class="text-muted-foreground mt-1">
			Track your learning progress and statistics
		</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<Card>
			<div class="text-center">
				<div class="text-3xl font-bold">0</div>
				<div class="text-sm text-muted-foreground">Cards Studied</div>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<div class="text-3xl font-bold">0</div>
				<div class="text-sm text-muted-foreground">Current Streak</div>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<div class="text-3xl font-bold">0%</div>
				<div class="text-sm text-muted-foreground">Average Accuracy</div>
			</div>
		</Card>
	</div>

	<Card>
		<div class="text-center py-12">
			<div class="text-6xl mb-4">📊</div>
			<h3 class="text-xl font-semibold mb-2">Progress Tracking</h3>
			<p class="text-muted-foreground">
				Detailed statistics and heatmap - Coming soon!
			</p>
		</div>
	</Card>
</div>
