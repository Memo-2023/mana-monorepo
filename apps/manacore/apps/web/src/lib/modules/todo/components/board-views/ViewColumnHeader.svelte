<script lang="ts">
	import type { GroupedColumn } from '../../view-grouping';

	interface Props {
		column: GroupedColumn;
		wipLimit?: number | null;
	}

	let { column, wipLimit = null }: Props = $props();

	let isOverWip = $derived(wipLimit != null && column.tasks.length > wipLimit);
</script>

<div class="flex items-center justify-between px-2 py-2">
	<div class="flex items-center gap-2">
		<span class="h-2.5 w-2.5 rounded-full" style="background-color: {column.color}"></span>
		<span class="text-sm font-semibold text-foreground">{column.name}</span>
		<span
			class="rounded-full bg-muted px-1.5 py-0.5 text-[0.625rem] font-medium {isOverWip
				? 'text-red-500'
				: 'text-muted-foreground'}"
		>
			{column.tasks.length}{wipLimit != null ? `/${wipLimit}` : ''}
		</span>
	</div>
</div>
