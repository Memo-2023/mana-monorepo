<!--
  ReactionBar — Slack-style emoji-row for a single feedback item.

  Renders one chip per whitelisted emoji with its current count plus a
  highlighted state if `myReactions` includes that emoji. Click toggles
  the user's own reaction for that emoji.

  Disabled mode: when `readOnly={true}` (e.g. on the public SSR mirror
  for non-logged-in visitors) the buttons render as static badges.
-->
<script lang="ts">
	import { REACTION_EMOJIS, REACTION_LABELS, type ReactionEmoji } from './feedback';

	interface Props {
		reactions: Partial<Record<string, number>>;
		myReactions?: string[];
		readOnly?: boolean;
		readOnlyTooltip?: string;
		onToggle?: (emoji: ReactionEmoji) => void | Promise<void>;
		size?: 'sm' | 'md';
	}

	let {
		reactions,
		myReactions = [],
		readOnly = false,
		readOnlyTooltip = 'Login zum Reagieren',
		onToggle,
		size = 'md',
	}: Props = $props();

	let pendingEmoji = $state<string | null>(null);

	async function handleClick(e: MouseEvent, emoji: ReactionEmoji) {
		// Reaction-bars sit inside clickable cards (feedback feed, /me/reacted,
		// detail page). Without stopPropagation, every reaction-click also
		// triggers the card's onClick — user reacts and lands in detail-view.
		e.stopPropagation();
		if (readOnly || !onToggle) return;
		pendingEmoji = emoji;
		try {
			await onToggle(emoji);
		} finally {
			pendingEmoji = null;
		}
	}

	function countFor(emoji: string): number {
		return reactions[emoji] ?? 0;
	}
</script>

<div class="reaction-bar" class:sm={size === 'sm'}>
	{#each REACTION_EMOJIS as emoji (emoji)}
		{@const count = countFor(emoji)}
		{@const mine = myReactions.includes(emoji)}
		{@const isPending = pendingEmoji === emoji}
		<button
			type="button"
			class="chip"
			class:active={mine}
			class:zero={count === 0}
			class:read-only={readOnly}
			class:pending={isPending}
			disabled={readOnly || isPending}
			title={readOnly ? readOnlyTooltip : `${REACTION_LABELS[emoji]} (${count})`}
			aria-pressed={mine}
			aria-label={`${REACTION_LABELS[emoji]}: ${count}`}
			onclick={(e) => handleClick(e, emoji)}
		>
			<span class="emoji">{emoji}</span>
			{#if count > 0}<span class="count">{count}</span>{/if}
		</button>
	{/each}
</div>

<style>
	.reaction-bar {
		display: inline-flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-card));
		color: hsl(var(--color-foreground));
		border-radius: 999px;
		font-size: 0.875rem;
		line-height: 1;
		cursor: pointer;
		transition:
			background 0.15s ease,
			border-color 0.15s ease,
			transform 0.15s ease,
			opacity 0.15s ease;
	}

	.reaction-bar.sm .chip {
		padding: 0.125rem 0.375rem;
		font-size: 0.75rem;
	}

	.chip:hover:not(:disabled) {
		background: hsl(var(--color-surface-hover, var(--color-muted)));
		border-color: hsl(var(--color-primary) / 0.4);
		transform: translateY(-1px);
	}

	.chip.active {
		background: hsl(var(--color-primary) / 0.12);
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
	}

	.chip.zero {
		opacity: 0.55;
	}

	.chip.zero:hover:not(:disabled) {
		opacity: 1;
	}

	.chip.read-only {
		cursor: not-allowed;
	}

	.chip.read-only:hover {
		transform: none;
		background: hsl(var(--color-card));
		border-color: hsl(var(--color-border));
	}

	.chip.pending {
		opacity: 0.6;
	}

	.emoji {
		font-size: 1em;
	}

	.count {
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}
</style>
