<script lang="ts">
	import type { RsvpSummary } from '../types';

	interface Props {
		summary: RsvpSummary;
		capacity?: number | null;
	}

	let { summary, capacity = null }: Props = $props();
</script>

<div class="rsvp-summary">
	<div class="badge yes">
		<span class="count">{summary.yes}</span>
		<span class="label">Ja</span>
	</div>
	<div class="badge maybe">
		<span class="count">{summary.maybe}</span>
		<span class="label">Vielleicht</span>
	</div>
	<div class="badge no">
		<span class="count">{summary.no}</span>
		<span class="label">Nein</span>
	</div>
	<div class="badge pending">
		<span class="count">{summary.pending}</span>
		<span class="label">Offen</span>
	</div>
	<div class="total">
		<strong>{summary.totalAttending}</strong>
		{#if capacity}
			<span class="muted">/ {capacity}</span>
		{/if}
		<span class="muted">kommen</span>
	</div>
</div>

<style>
	.rsvp-summary {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}
	.badge {
		display: flex;
		align-items: baseline;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-muted));
		font-size: 0.8125rem;
	}
	.badge .count {
		font-weight: 700;
	}
	.badge.yes {
		background: rgba(34, 197, 94, 0.15);
		color: rgb(22, 163, 74);
	}
	.badge.maybe {
		background: rgba(245, 158, 11, 0.15);
		color: rgb(202, 138, 4);
	}
	.badge.no {
		background: rgba(239, 68, 68, 0.15);
		color: rgb(220, 38, 38);
	}
	.badge.pending {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
	}
	.total {
		margin-left: auto;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
	}
	.total .muted {
		color: hsl(var(--color-muted-foreground));
		margin-left: 0.25rem;
	}
</style>
