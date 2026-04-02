<script lang="ts">
	import { _ } from 'svelte-i18n';

	export type SortField = 'firstName' | 'lastName';

	interface Props {
		value: SortField;
		onchange: (value: SortField) => void;
	}

	let { value, onchange }: Props = $props();
</script>

<div class="sort-toggle">
	<button
		type="button"
		class="sort-btn"
		class:active={value === 'firstName'}
		onclick={() => onchange('firstName')}
	>
		{$_('sort.firstName')}
	</button>
	<button
		type="button"
		class="sort-btn"
		class:active={value === 'lastName'}
		onclick={() => onchange('lastName')}
	>
		{$_('sort.lastName')}
	</button>
</div>

<style>
	.sort-toggle {
		display: flex;
		gap: 0.25rem;
		padding: 0.25rem;
		background: hsl(var(--background) / 0.75);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid hsl(var(--border) / 0.5);
		border-radius: 9999px;
	}

	.sort-btn {
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		background: transparent;
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.sort-btn:hover {
		color: hsl(var(--foreground));
	}

	.sort-btn.active {
		color: hsl(var(--primary-foreground));
		background: hsl(var(--primary));
	}
</style>
