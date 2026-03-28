<script lang="ts">
	import type { Feedback } from './feedback';
	import StatusBadge from './StatusBadge.svelte';
	import VoteButton from './VoteButton.svelte';

	interface Props {
		feedback: Feedback;
		onVote: (feedbackId: string, hasVoted: boolean) => void;
		showStatus?: boolean;
		isOwner?: boolean;
		votingDisabled?: boolean;
	}

	let {
		feedback,
		onVote,
		showStatus = true,
		isOwner = false,
		votingDisabled = false,
	}: Props = $props();

	function handleVote() {
		onVote(feedback.id, feedback.userHasVoted);
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}
</script>

<div class="feedback-card" class:feedback-card--owner={isOwner}>
	<div class="feedback-card__vote">
		<VoteButton
			count={feedback.voteCount}
			hasVoted={feedback.userHasVoted}
			onToggle={handleVote}
			disabled={votingDisabled || !feedback.isPublic}
		/>
	</div>

	<div class="feedback-card__content">
		<div class="feedback-card__header">
			{#if feedback.title}
				<h3 class="feedback-card__title">{feedback.title}</h3>
			{/if}
			{#if showStatus}
				<StatusBadge status={feedback.status} />
			{/if}
		</div>

		<p class="feedback-card__text">{feedback.feedbackText}</p>

		{#if feedback.adminResponse}
			<div class="feedback-card__response">
				<span class="feedback-card__response-label">Admin-Antwort:</span>
				<p class="feedback-card__response-text">{feedback.adminResponse}</p>
			</div>
		{/if}

		<div class="feedback-card__footer">
			<span class="feedback-card__date">{formatDate(feedback.createdAt)}</span>
			{#if isOwner}
				<span class="feedback-card__owner-badge">Dein Feedback</span>
			{/if}
		</div>
	</div>
</div>

<style>
	.feedback-card {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-surface, 0 0% 100%));
		border: 1px solid hsl(var(--color-border, 0 0% 90%));
		transition: all 0.2s ease;
	}

	.feedback-card:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.feedback-card--owner {
		border-left: 3px solid hsl(var(--color-primary, 47 95% 58%));
	}

	.feedback-card__vote {
		flex-shrink: 0;
	}

	.feedback-card__content {
		flex: 1;
		min-width: 0;
	}

	.feedback-card__header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 0.5rem;
	}

	.feedback-card__title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--color-foreground, 0 0% 17%));
	}

	.feedback-card__text {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground, 0 0% 17%));
		line-height: 1.5;
	}

	.feedback-card__response {
		padding: 0.75rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary, 47 95% 58%) / 0.1);
		margin-bottom: 0.75rem;
	}

	.feedback-card__response-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-primary, 47 95% 58%));
		margin-bottom: 0.25rem;
	}

	.feedback-card__response-text {
		margin: 0;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground, 0 0% 17%));
	}

	.feedback-card__footer {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.feedback-card__date {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground, 0 0% 40%));
	}

	.feedback-card__owner-badge {
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.625rem;
		font-weight: 600;
		background: hsl(var(--color-primary, 47 95% 58%) / 0.1);
		color: hsl(var(--color-primary, 47 95% 58%));
	}
</style>
