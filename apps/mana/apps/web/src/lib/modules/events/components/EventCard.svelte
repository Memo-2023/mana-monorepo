<script lang="ts">
	import { formatDate, formatTime } from '$lib/i18n/format';
	import type { SocialEvent, RsvpSummary } from '../types';

	interface Props {
		event: SocialEvent;
		summary?: RsvpSummary | null;
		onclick?: () => void;
	}

	let { event, summary = null, onclick }: Props = $props();

	const startDate = $derived(new Date(event.startTime));
	const dateLabel = $derived(
		formatDate(startDate, {
			weekday: 'short',
			day: '2-digit',
			month: 'short',
		})
	);
	const timeLabel = $derived(
		event.isAllDay ? 'Ganztägig' : formatTime(startDate, { hour: '2-digit', minute: '2-digit' })
	);
</script>

<button class="event-card" {onclick}>
	<div class="date-block" style:background={event.color ?? '#6366F1'}>
		<div class="date">{dateLabel}</div>
		<div class="time">{timeLabel}</div>
	</div>
	<div class="event-body">
		<div class="title-row">
			<h3 class="title">{event.title}</h3>
			{#if event.status === 'draft'}
				<span class="status-badge draft">Entwurf</span>
			{:else if event.status === 'cancelled'}
				<span class="status-badge cancelled">Abgesagt</span>
			{:else if event.isPublished}
				<span class="status-badge published">Geteilt</span>
			{/if}
		</div>
		{#if event.location}
			<div class="location">📍 {event.location}</div>
		{/if}
		{#if summary}
			<div class="summary-row">
				<span class="yes-count">{summary.totalAttending} kommen</span>
				{#if summary.pending > 0}
					<span class="pending-count">· {summary.pending} offen</span>
				{/if}
			</div>
		{/if}
	</div>
</button>

<style>
	.event-card {
		display: flex;
		align-items: stretch;
		gap: 0;
		padding: 0;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.625rem;
		background: hsl(var(--color-card));
		text-align: left;
		cursor: pointer;
		overflow: hidden;
		transition:
			transform 0.1s ease,
			box-shadow 0.15s;
		width: 100%;
	}
	.event-card:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}
	.date-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-width: 5rem;
		padding: 0.75rem 0.5rem;
		color: white;
	}
	.date {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		opacity: 0.95;
	}
	.time {
		font-size: 0.875rem;
		font-weight: 700;
		margin-top: 0.125rem;
	}
	.event-body {
		flex: 1;
		padding: 0.75rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}
	.title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.title {
		flex: 1;
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.status-badge {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
	}
	.status-badge.draft {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
	}
	.status-badge.cancelled {
		background: rgba(239, 68, 68, 0.15);
		color: rgb(220, 38, 38);
	}
	.status-badge.published {
		background: rgba(99, 102, 241, 0.15);
		color: rgb(79, 70, 229);
	}
	.location {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
	.summary-row {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
	.yes-count {
		font-weight: 600;
		color: rgb(22, 163, 74);
	}
</style>
