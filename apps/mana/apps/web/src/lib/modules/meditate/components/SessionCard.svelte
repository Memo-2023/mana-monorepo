<!--
  SessionCard — displays a completed meditation session.
-->
<script lang="ts">
	import type { MeditateSession, MeditatePreset } from '../types';
	import { CATEGORY_LABELS } from '../types';
	import { formatDuration } from '../queries';

	interface Props {
		session: MeditateSession;
		presets: MeditatePreset[];
	}

	let { session, presets }: Props = $props();

	const preset = $derived(presets.find((p) => p.id === session.presetId));
	const name = $derived(preset?.name ?? CATEGORY_LABELS[session.category].de);
	const duration = $derived(formatDuration(session.durationSec));
	const date = $derived(
		new Date(session.startedAt).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		})
	);

	const moodEmojis = ['', '😔', '😕', '😐', '🙂', '😊'];
</script>

<div class="session-card">
	<div class="session-main">
		<div class="session-name">{name}</div>
		<div class="session-meta">
			<span>{date}</span>
			<span class="dot">·</span>
			<span>{duration}</span>
			{#if !session.completed}
				<span class="dot">·</span>
				<span class="incomplete">abgebrochen</span>
			{/if}
		</div>
	</div>
	{#if session.moodBefore || session.moodAfter}
		<div class="session-mood">
			{#if session.moodBefore}
				<span title="Vorher">{moodEmojis[session.moodBefore]}</span>
			{/if}
			{#if session.moodBefore && session.moodAfter}
				<span class="mood-arrow">→</span>
			{/if}
			{#if session.moodAfter}
				<span title="Nachher">{moodEmojis[session.moodAfter]}</span>
			{/if}
		</div>
	{/if}
</div>

<style>
	.session-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
	}

	.session-main {
		flex: 1;
		min-width: 0;
	}

	.session-name {
		font-weight: 500;
		color: hsl(var(--color-foreground));
		font-size: 0.9rem;
	}

	.session-meta {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.1rem;
	}

	.dot {
		opacity: 0.5;
	}

	.incomplete {
		color: hsl(var(--color-destructive));
	}

	.session-mood {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 1.1rem;
	}

	.mood-arrow {
		font-size: 0.7rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
