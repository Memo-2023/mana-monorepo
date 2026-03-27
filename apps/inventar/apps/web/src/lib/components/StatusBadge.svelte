<script lang="ts">
	import type { ItemStatus } from '@inventar/shared';
	import { _ } from 'svelte-i18n';

	interface Props {
		status: ItemStatus;
		size?: 'sm' | 'md';
	}

	let { status, size = 'sm' }: Props = $props();

	const statusColors: Record<ItemStatus, string> = {
		owned: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
		lent: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
		stored: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
		for_sale: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
		disposed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
	};
</script>

<span
	class="inline-block rounded-full font-medium {statusColors[status]} {size === 'sm'
		? 'px-2 py-0.5 text-xs'
		: 'px-3 py-1 text-sm'}"
>
	{$_(`status.${status}`)}
</span>
