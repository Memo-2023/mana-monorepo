<script lang="ts">
	import { Timer } from '@mana/shared-icons';

	interface Props {
		value: number | null;
		onChange: (minutes: number | null) => void;
	}

	let { value, onChange }: Props = $props();

	const presets = [
		{ label: '-', value: null },
		{ label: '15m', value: 15 },
		{ label: '30m', value: 30 },
		{ label: '1h', value: 60 },
		{ label: '2h', value: 120 },
		{ label: '4h', value: 240 },
		{ label: '8h', value: 480 },
	];

	function formatDuration(mins: number | null): string {
		if (mins == null) return '-';
		if (mins < 60) return `${mins}m`;
		const h = Math.floor(mins / 60);
		const m = mins % 60;
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	}
</script>

<div class="flex items-center gap-1.5">
	<Timer size={14} class="text-muted-foreground" />
	<div class="flex gap-0.5">
		{#each presets as preset}
			<button
				type="button"
				onclick={() => onChange(preset.value)}
				class="rounded px-1.5 py-0.5 text-[0.625rem] font-medium transition-colors
					{value === preset.value
					? 'bg-primary/15 text-primary'
					: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
			>
				{preset.label}
			</button>
		{/each}
	</div>
	{#if value && !presets.some((p) => p.value === value)}
		<span class="text-xs text-primary">{formatDuration(value)}</span>
	{/if}
</div>
