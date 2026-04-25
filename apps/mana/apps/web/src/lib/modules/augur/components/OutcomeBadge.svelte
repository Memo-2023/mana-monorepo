<script lang="ts">
	import { OUTCOME_LABELS, type AugurOutcome } from '../types';

	let { outcome, size = 'sm' }: { outcome: AugurOutcome; size?: 'sm' | 'md' } = $props();

	const COLORS: Record<AugurOutcome, string> = {
		open: '#94a3b8',
		fulfilled: '#10b981',
		partly: '#f59e0b',
		'not-fulfilled': '#ef4444',
	};
</script>

<span class="badge" class:md={size === 'md'} style:--badge-color={COLORS[outcome]}>
	{OUTCOME_LABELS[outcome].de}
</span>

<style>
	.badge {
		display: inline-block;
		font-size: 0.72rem;
		padding: 0.12rem 0.55rem;
		border-radius: 999px;
		color: var(--badge-color);
		background: color-mix(in srgb, var(--badge-color) 15%, transparent);
		font-weight: 500;
		white-space: nowrap;
	}
	.badge.md {
		font-size: 0.85rem;
		padding: 0.25rem 0.75rem;
	}
</style>
