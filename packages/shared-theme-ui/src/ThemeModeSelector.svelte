<script lang="ts">
	import type { ThemeStore, ThemeMode } from '@mana/shared-theme';
	import { Sun, Moon, Desktop } from '@mana/shared-icons';

	interface Props {
		/** Theme store instance */
		theme: ThemeStore;
		/** Additional CSS classes */
		class?: string;
	}

	let { theme, class: className = '' }: Props = $props();

	const modes: { mode: ThemeMode; label: string }[] = [
		{ mode: 'light', label: 'Light' },
		{ mode: 'dark', label: 'Dark' },
		{ mode: 'system', label: 'System' },
	];
</script>

<div class="mode-selector {className}" role="radiogroup" aria-label="Theme mode">
	{#each modes as { mode, label }}
		{@const isActive = theme.mode === mode}
		<button
			type="button"
			onclick={() => theme.setMode(mode)}
			class="mode-button"
			class:active={isActive}
			role="radio"
			aria-checked={isActive}
			aria-label="{label} mode"
		>
			{#if mode === 'light'}
				<Sun size={16} weight="bold" />
			{:else if mode === 'dark'}
				<Moon size={16} weight="bold" />
			{:else}
				<Desktop size={16} weight="bold" />
			{/if}
			<span class="label">{label}</span>
		</button>
	{/each}
</div>

<style>
	.mode-selector {
		display: inline-flex;
		padding: 0.25rem;
		gap: 0.25rem;
		background-color: hsl(var(--color-muted));
		border-radius: 0.5rem;
	}

	.mode-button {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		background: transparent;
		border: none;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.mode-button:hover:not(.active) {
		color: hsl(var(--color-foreground));
	}

	.mode-button.active {
		background-color: hsl(var(--color-surface));
		color: hsl(var(--color-foreground));
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.mode-button:focus-visible {
		outline: 2px solid hsl(var(--color-ring));
		outline-offset: 2px;
	}

	.label {
		display: none;
	}

	@media (min-width: 640px) {
		.label {
			display: inline;
		}
	}
</style>
