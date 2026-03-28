<script lang="ts">
	import type { FeedbackStatus } from './feedback';
	import { FEEDBACK_STATUS_CONFIG } from './feedback';

	interface Props {
		status: FeedbackStatus;
	}

	let { status }: Props = $props();

	const config = $derived(FEEDBACK_STATUS_CONFIG[status]);
</script>

<span class="status-badge" style="--badge-color: {config.color};">
	{config.label}
</span>

<style>
	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		background: color-mix(in srgb, var(--badge-color) 15%, transparent);
		color: var(--badge-color);
		white-space: nowrap;
	}
</style>
