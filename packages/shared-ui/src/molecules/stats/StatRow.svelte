<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Text } from '../../atoms';

	interface Props {
		/** Title/label for the stat */
		title: string;
		/** Value to display */
		value: string;
		/** Optional subtitle/description */
		subtitle?: string;
		/** Icon snippet - allows custom icon rendering */
		icon?: Snippet;
	}

	let { title, value, subtitle, icon }: Props = $props();
</script>

<div
	class="flex items-center gap-3 border border-theme bg-black/[0.03] dark:bg-white/[0.06] px-3 py-2.5 transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.12] first:rounded-t-xl last:rounded-b-xl"
>
	<!-- Icon slot -->
	{#if icon}
		<div class="flex-shrink-0 text-theme-secondary">
			{@render icon()}
		</div>
	{/if}

	<!-- Content -->
	<div class="flex-1">
		<Text variant="small" weight="medium">{title}</Text>
		{#if subtitle}
			<Text variant="muted" class="mt-0.5">{subtitle}</Text>
		{/if}
	</div>

	<!-- Value -->
	<Text variant="body" weight="bold" class="text-right">{value}</Text>
</div>
