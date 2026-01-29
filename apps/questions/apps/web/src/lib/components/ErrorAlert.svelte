<script lang="ts">
	import { AlertCircle, X, RefreshCw } from 'lucide-svelte';

	interface Props {
		message: string;
		onDismiss?: () => void;
		onRetry?: () => void;
	}

	let { message, onDismiss, onRetry }: Props = $props();
</script>

<div
	class="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4"
	role="alert"
>
	<AlertCircle class="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />

	<div class="flex-1">
		<p class="text-sm font-medium text-destructive">Error</p>
		<p class="mt-1 text-sm text-foreground">{message}</p>

		{#if onRetry}
			<button
				onclick={onRetry}
				class="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
			>
				<RefreshCw class="h-4 w-4" />
				Try again
			</button>
		{/if}
	</div>

	{#if onDismiss}
		<button onclick={onDismiss} class="text-muted-foreground hover:text-foreground">
			<X class="h-5 w-5" />
		</button>
	{/if}
</div>
