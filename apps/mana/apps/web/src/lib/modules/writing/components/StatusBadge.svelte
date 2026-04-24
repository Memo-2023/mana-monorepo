<script lang="ts">
	import { STATUS_LABELS, STATUS_COLORS } from '../constants';
	import type { DraftStatus } from '../types';

	let { status }: { status: DraftStatus } = $props();
	const color = $derived(STATUS_COLORS[status]);
	const label = $derived(STATUS_LABELS[status].de);
</script>

<span class="badge" style:--badge={color}>
	<span class="dot" aria-hidden="true"></span>
	{label}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		font-size: 0.75rem;
		color: var(--badge);
		background: color-mix(in srgb, var(--badge) 12%, transparent);
		border: 1px solid color-mix(in srgb, var(--badge) 25%, transparent);
		white-space: nowrap;
	}
	.dot {
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 999px;
		background: var(--badge);
	}
</style>
