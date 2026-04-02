<script lang="ts">
	import type { TaskPriority } from '../../types';
	import { getPriorityLabel, getPriorityColor } from '../../queries';
	import { Flag } from '@manacore/shared-icons';

	interface Props {
		value: TaskPriority;
		onChange: (priority: TaskPriority) => void;
	}

	let { value, onChange }: Props = $props();

	const priorities: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];
</script>

<div class="flex gap-1">
	{#each priorities as p}
		<button
			type="button"
			onclick={() => onChange(p)}
			class="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors
				{value === p ? 'ring-1 ring-current' : 'opacity-50 hover:opacity-80'}"
			style="color: {getPriorityColor(p)}; background: color-mix(in srgb, {getPriorityColor(
				p
			)} {value === p ? '15%' : '5%'}, transparent)"
			title={getPriorityLabel(p)}
		>
			<Flag size={12} weight={value === p ? 'fill' : 'regular'} />
			<span class="hidden sm:inline">{getPriorityLabel(p)}</span>
		</button>
	{/each}
</div>
