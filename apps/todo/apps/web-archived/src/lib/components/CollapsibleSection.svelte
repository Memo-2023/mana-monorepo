<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Warning, CalendarBlank, CalendarDots, CheckCircle } from '@manacore/shared-icons';

	interface Props {
		title: string;
		count?: number;
		icon?: 'warning' | 'today' | 'upcoming' | 'completed';
		variant?: 'default' | 'warning' | 'success';
		defaultOpen?: boolean;
		children: Snippet;
	}

	let { title, icon, variant = 'default', children }: Props = $props();

	// Icon colors based on variant
	const iconColors = {
		default: 'text-muted-foreground',
		warning: 'text-red-500',
		success: 'text-green-600 dark:text-green-500',
	};

	// Header text colors
	const headerColors = {
		default: 'text-foreground',
		warning: 'text-red-600 dark:text-red-400',
		success: 'text-green-700 dark:text-green-400',
	};
</script>

<div class="section mb-3">
	<div class="section-header flex items-center gap-2 py-2">
		<!-- Icon -->
		<span class="icon-wrapper {iconColors[variant]}">
			{#if icon === 'warning'}
				<Warning size={18} weight="bold" />
			{:else if icon === 'today'}
				<CalendarBlank size={18} weight="bold" />
			{:else if icon === 'upcoming'}
				<CalendarDots size={18} weight="bold" />
			{:else if icon === 'completed'}
				<CheckCircle size={18} weight="bold" />
			{/if}
		</span>

		<!-- Title -->
		<span class="title text-sm font-semibold {headerColors[variant]}">{title}</span>
	</div>

	<div class="section-content pl-1">
		{@render children()}
	</div>
</div>

<style>
	.icon-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
</style>
