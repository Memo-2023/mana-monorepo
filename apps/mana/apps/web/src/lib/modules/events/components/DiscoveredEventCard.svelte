<script lang="ts">
	import type { DiscoveredEvent } from '../discovery/types';

	interface Props {
		event: DiscoveredEvent;
		onSave?: () => void;
		onDismiss?: () => void;
	}

	let { event, onSave, onDismiss }: Props = $props();

	const startDate = $derived(new Date(event.startAt));
	const dateLabel = $derived(
		startDate.toLocaleDateString('de-DE', {
			weekday: 'short',
			day: '2-digit',
			month: 'short',
		})
	);
	const timeLabel = $derived(
		event.allDay
			? 'Ganztag'
			: startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
	);

	const isSaved = $derived(event.userAction === 'save');
</script>

<div class="discovered-card">
	<div class="date-block">
		<div class="date">{dateLabel}</div>
		<div class="time">{timeLabel}</div>
	</div>
	<div class="card-body">
		<div class="title-row">
			<h3 class="title">{event.title}</h3>
			{#if event.category}
				<span class="category-badge">{event.category}</span>
			{/if}
		</div>
		{#if event.location}
			<div class="meta-line">{event.location}</div>
		{/if}
		{#if event.priceInfo}
			<div class="meta-line">{event.priceInfo}</div>
		{/if}
		{#if event.description}
			<div class="description">
				{event.description.slice(0, 150)}{event.description.length > 150 ? '...' : ''}
			</div>
		{/if}
		<div class="footer">
			{#if event.sourceName}
				<a class="source-link" href={event.sourceUrl} target="_blank" rel="noopener">
					{event.sourceName}
				</a>
			{:else}
				<a class="source-link" href={event.sourceUrl} target="_blank" rel="noopener"> Quelle </a>
			{/if}
			<div class="actions">
				{#if isSaved}
					<span class="saved-label">Gespeichert</span>
				{:else}
					<button class="action-btn save" onclick={onSave}>Merken</button>
					<button class="action-btn dismiss" onclick={onDismiss}>Ausblenden</button>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.discovered-card {
		display: flex;
		align-items: stretch;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.625rem;
		background: hsl(var(--color-card));
		overflow: hidden;
		transition:
			transform 0.1s ease,
			box-shadow 0.15s;
	}
	.discovered-card:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}
	.date-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-width: 4.5rem;
		padding: 0.75rem 0.5rem;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}
	.date {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		opacity: 0.9;
	}
	.time {
		font-size: 0.8125rem;
		font-weight: 700;
		margin-top: 0.125rem;
	}
	.card-body {
		flex: 1;
		padding: 0.625rem 0.875rem;
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
	.category-badge {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
		white-space: nowrap;
	}
	.meta-line {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.description {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		line-height: 1.4;
	}
	.footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 0.25rem;
		gap: 0.5rem;
	}
	.source-link {
		font-size: 0.75rem;
		color: hsl(var(--color-primary));
		text-decoration: none;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.source-link:hover {
		text-decoration: underline;
	}
	.actions {
		display: flex;
		gap: 0.375rem;
		flex-shrink: 0;
	}
	.action-btn {
		padding: 0.25rem 0.625rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.375rem;
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		font-size: 0.75rem;
		cursor: pointer;
		font-family: inherit;
	}
	.action-btn.save {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: transparent;
	}
	.action-btn.dismiss {
		opacity: 0.7;
	}
	.action-btn.dismiss:hover {
		opacity: 1;
	}
	.saved-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: rgb(22, 163, 74);
	}
</style>
