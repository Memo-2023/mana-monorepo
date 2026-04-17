<script lang="ts">
	import { STATUS_LABELS, STATUS_COLORS } from '../constants';
	import type { LibraryStatus } from '../types';

	let { status, size = 'sm' }: { status: LibraryStatus; size?: 'sm' | 'md' } = $props();
</script>

<span class="badge" class:md={size === 'md'} style:--badge-color={STATUS_COLORS[status]}>
	{STATUS_LABELS[status].de}
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
