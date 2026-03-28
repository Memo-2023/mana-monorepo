<script lang="ts">
	import type { Feedback } from './feedback';
	import FeedbackCard from './FeedbackCard.svelte';

	interface Props {
		items: Feedback[];
		currentUserId?: string;
		onVote: (feedbackId: string, hasVoted: boolean) => void;
		votingDisabled?: boolean;
		emptyMessage?: string;
	}

	let {
		items,
		currentUserId,
		onVote,
		votingDisabled = false,
		emptyMessage = 'Noch kein Feedback vorhanden',
	}: Props = $props();
</script>

<div class="feedback-list">
	{#if items.length === 0}
		<div class="feedback-list__empty">
			<p>{emptyMessage}</p>
		</div>
	{:else}
		{#each items as feedback (feedback.id)}
			<FeedbackCard
				{feedback}
				{onVote}
				{votingDisabled}
				isOwner={currentUserId === feedback.userId}
			/>
		{/each}
	{/if}
</div>

<style>
	.feedback-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.feedback-list__empty {
		padding: 2rem;
		text-align: center;
		border-radius: 0.75rem;
		background: hsl(var(--color-surface, 0 0% 100%) / 0.5);
		border: 1px dashed hsl(var(--color-border, 0 0% 90%));
	}

	.feedback-list__empty p {
		margin: 0;
		color: hsl(var(--color-muted-foreground, 0 0% 40%));
	}
</style>
