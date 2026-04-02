<script lang="ts">
	import { onMount } from 'svelte';
	import { Card } from '@manacore/shared-ui';
	import { progressStore } from '$lib/stores/progressStore.svelte';

	onMount(() => {
		progressStore.fetchStudySessions();
		progressStore.fetchStatistics();
	});
</script>

<svelte:head>
	<title>Progress - Cards</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold">Progress</h1>
		<p class="text-muted-foreground mt-1">Track your learning progress and statistics</p>
	</div>

	{#if progressStore.loading}
		<div class="flex justify-center py-8">
			<div
				class="inline-block animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"
			></div>
		</div>
	{:else}
		<!-- Stats Overview -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
			<Card>
				<div class="text-center">
					<div class="text-3xl font-bold">
						{progressStore.statistics?.totalCardsStudied || 0}
					</div>
					<div class="text-sm text-muted-foreground">Cards Studied</div>
				</div>
			</Card>
			<Card>
				<div class="text-center">
					<div class="text-3xl font-bold text-orange-500">
						🔥 {progressStore.streakInfo?.currentStreak || 0}
					</div>
					<div class="text-sm text-muted-foreground">Current Streak</div>
				</div>
			</Card>
			<Card>
				<div class="text-center">
					<div class="text-3xl font-bold">
						{progressStore.statistics?.averageAccuracy || 0}%
					</div>
					<div class="text-sm text-muted-foreground">Average Accuracy</div>
				</div>
			</Card>
			<Card>
				<div class="text-center">
					<div class="text-3xl font-bold">
						{progressStore.statistics?.totalStudyTimeMinutes || 0}
					</div>
					<div class="text-sm text-muted-foreground">Minutes Studied</div>
				</div>
			</Card>
		</div>

		<!-- Streak Info -->
		<Card>
			<h2 class="text-xl font-semibold mb-4">📊 Study Streak</h2>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div class="text-center p-4 bg-surface rounded-lg">
					<div class="text-2xl font-bold text-orange-500">
						{progressStore.streakInfo?.currentStreak || 0}
					</div>
					<div class="text-sm text-muted-foreground">Current Streak</div>
				</div>
				<div class="text-center p-4 bg-surface rounded-lg">
					<div class="text-2xl font-bold text-yellow-500">
						{progressStore.streakInfo?.longestStreak || 0}
					</div>
					<div class="text-sm text-muted-foreground">Longest Streak</div>
				</div>
				<div class="text-center p-4 bg-surface rounded-lg">
					<div class="text-2xl font-bold">
						{progressStore.streakInfo?.totalStudyDays || 0}
					</div>
					<div class="text-sm text-muted-foreground">Total Study Days</div>
				</div>
				<div class="text-center p-4 bg-surface rounded-lg">
					<div class="text-2xl font-bold">
						{progressStore.statistics?.totalSessions || 0}
					</div>
					<div class="text-sm text-muted-foreground">Total Sessions</div>
				</div>
			</div>
		</Card>

		<!-- Recent Sessions -->
		<Card>
			<h2 class="text-xl font-semibold mb-4">📚 Recent Study Sessions</h2>
			{#if progressStore.studySessions.length === 0}
				<div class="text-center py-8">
					<div class="text-4xl mb-4">🎯</div>
					<p class="text-muted-foreground">No study sessions yet.</p>
					<p class="text-muted-foreground text-sm mt-2">
						Start studying a deck to see your progress here!
					</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each progressStore.studySessions.slice(0, 10) as session}
						<div class="flex items-center justify-between p-3 bg-surface rounded-lg">
							<div>
								<div class="font-medium">
									{new Date(session.started_at).toLocaleDateString('de-DE', {
										weekday: 'short',
										day: 'numeric',
										month: 'short',
									})}
								</div>
								<div class="text-sm text-muted-foreground">
									{session.completed_cards} cards • {Math.round(session.time_spent_seconds / 60)} min
								</div>
							</div>
							<div class="text-right">
								<div class="font-semibold">
									{session.completed_cards > 0
										? Math.round((session.correct_cards / session.completed_cards) * 100)
										: 0}%
								</div>
								<div class="text-sm text-muted-foreground">accuracy</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card>
	{/if}
</div>
