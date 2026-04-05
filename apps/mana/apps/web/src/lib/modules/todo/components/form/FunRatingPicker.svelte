<script lang="ts">
	import { Smiley, SmileyMeh, SmileySad } from '@mana/shared-icons';

	interface Props {
		value: number | null;
		onChange: (rating: number | null) => void;
	}

	let { value, onChange }: Props = $props();

	const ratings = [1, 2, 3, 4, 5];

	function getColor(r: number): string {
		if (r <= 2) return '#ef4444';
		if (r === 3) return '#f59e0b';
		return '#22c55e';
	}
</script>

<div class="flex gap-0.5">
	{#each ratings as r}
		<button
			type="button"
			onclick={() => onChange(value === r ? null : r)}
			class="flex h-6 w-6 items-center justify-center rounded transition-colors
				{value === r ? 'ring-1' : 'opacity-40 hover:opacity-70'}"
			style={value === r
				? `color: ${getColor(r)}; --tw-ring-color: ${getColor(r)}`
				: `color: ${getColor(r)}`}
			title="Spaß-Faktor {r}/5"
		>
			{#if r <= 2}
				<SmileySad size={16} weight={value === r ? 'fill' : 'regular'} />
			{:else if r === 3}
				<SmileyMeh size={16} weight={value === r ? 'fill' : 'regular'} />
			{:else}
				<Smiley size={16} weight={value === r ? 'fill' : 'regular'} />
			{/if}
		</button>
	{/each}
</div>
