<script lang="ts">
	import { Warning, ArrowsClockwise } from '@manacore/shared-icons';

	interface Props {
		serviceName: string;
		available: boolean;
		error?: string | null;
		onRetry?: () => void;
	}

	let { serviceName, available, error = null, onRetry }: Props = $props();
</script>

{#if !available}
	<div class="service-banner" role="alert">
		<div class="banner-content">
			<Warning size={16} />
			<span>
				{serviceName} ist nicht erreichbar
				{#if error}
					<span class="error-detail">({error})</span>
				{/if}
			</span>
		</div>
		{#if onRetry}
			<button class="retry-btn" onclick={onRetry}>
				<ArrowsClockwise size={14} />
				Erneut versuchen
			</button>
		{/if}
	</div>
{/if}

<style>
	.service-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: hsl(38 92% 50% / 0.1);
		border: 1px solid hsl(38 92% 50% / 0.3);
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		color: hsl(38 92% 50%);
	}

	.banner-content {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.error-detail {
		opacity: 0.7;
		font-size: 0.75rem;
	}

	.retry-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		border: 1px solid hsl(38 92% 50% / 0.3);
		background: transparent;
		color: hsl(38 92% 50%);
		font-size: 0.75rem;
		cursor: pointer;
		white-space: nowrap;
	}

	.retry-btn:hover {
		background: hsl(38 92% 50% / 0.15);
	}
</style>
