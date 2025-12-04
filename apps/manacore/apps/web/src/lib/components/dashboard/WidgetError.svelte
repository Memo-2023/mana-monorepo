<script lang="ts">
	/**
	 * WidgetError - Error state for widgets
	 *
	 * Displays error message with retry button.
	 */

	import { _ } from 'svelte-i18n';

	interface Props {
		/** Error message to display */
		error: string | null;
		/** Callback when retry is clicked */
		onRetry: () => void;
		/** Whether a retry is currently in progress */
		retrying?: boolean;
	}

	let { error, onRetry, retrying = false }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center py-6 text-center">
	<div class="mb-3 text-3xl">⚠️</div>
	<p class="mb-4 text-sm text-muted-foreground">
		{error || $_('dashboard.widget_error')}
	</p>
	<button
		type="button"
		onclick={onRetry}
		disabled={retrying}
		class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
	>
		{#if retrying}
			<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
			{$_('common.loading')}
		{:else}
			<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M1 4v6h6" />
				<path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
			</svg>
			{$_('dashboard.retry')}
		{/if}
	</button>
</div>
