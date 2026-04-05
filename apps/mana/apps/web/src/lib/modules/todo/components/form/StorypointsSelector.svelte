<script lang="ts">
	import { Lightning } from '@mana/shared-icons';

	interface Props {
		value: number | null;
		onChange: (points: number | null) => void;
	}

	let { value, onChange }: Props = $props();

	const points = [1, 2, 3, 5, 8, 13];
</script>

<div class="flex items-center gap-1.5">
	<Lightning size={14} class="text-muted-foreground" />
	<div class="flex gap-0.5">
		{#each points as p}
			<button
				type="button"
				onclick={() => onChange(value === p ? null : p)}
				class="flex h-6 w-6 items-center justify-center rounded text-[0.625rem] font-bold transition-colors
					{value === p
					? 'bg-primary/15 text-primary'
					: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
			>
				{p}
			</button>
		{/each}
	</div>
</div>
