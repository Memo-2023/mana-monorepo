<script lang="ts">
	import { STATUS_LABELS, STATUS_COLORS } from '../constants';
	import type { InvoiceStatus } from '../types';

	interface Props {
		status: InvoiceStatus;
	}

	let { status }: Props = $props();
</script>

<span class="badge" style="--dot: {STATUS_COLORS[status]}">
	<span class="dot"></span>
	{STATUS_LABELS[status].de}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
		color: var(--color-text, #0f172a);
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--dot);
		flex-shrink: 0;
	}
</style>
