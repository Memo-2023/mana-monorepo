<script lang="ts">
	interface Props {
		count: number;
		hasVoted: boolean;
		onToggle: () => void;
		disabled?: boolean;
	}

	let { count, hasVoted, onToggle, disabled = false }: Props = $props();

	let isAnimating = $state(false);

	function handleClick() {
		if (disabled) return;
		isAnimating = true;
		onToggle();
		setTimeout(() => {
			isAnimating = false;
		}, 300);
	}
</script>

<button
	class="vote-button"
	class:vote-button--voted={hasVoted}
	class:vote-button--animating={isAnimating}
	onclick={handleClick}
	{disabled}
	type="button"
	aria-label={hasVoted ? 'Stimme entfernen' : 'Abstimmen'}
>
	<svg
		class="vote-button__icon"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d="M18 15l-6-6-6 6" />
	</svg>
	<span class="vote-button__count">{count}</span>
</button>

<style>
	.vote-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem;
		border: 1px solid hsl(var(--color-border, 0 0% 90%));
		border-radius: 0.5rem;
		background: transparent;
		cursor: pointer;
		transition: all 0.2s ease;
		color: hsl(var(--color-muted-foreground, 0 0% 40%));
		min-width: 3rem;
	}

	.vote-button:hover:not(:disabled) {
		border-color: hsl(var(--color-primary, 47 95% 58%));
		color: hsl(var(--color-primary, 47 95% 58%));
	}

	.vote-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.vote-button--voted {
		background: hsl(var(--color-primary, 47 95% 58%) / 0.1);
		border-color: hsl(var(--color-primary, 47 95% 58%));
		color: hsl(var(--color-primary, 47 95% 58%));
	}

	.vote-button--animating {
		transform: scale(1.1);
	}

	.vote-button__icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.vote-button__count {
		font-size: 0.875rem;
		font-weight: 600;
	}
</style>
