<script lang="ts">
	import { Bell } from '@manacore/shared-icons';

	interface Props {
		value: number | null;
		onChange: (minutes: number | null) => void;
		disabled?: boolean;
	}

	let { value, onChange, disabled = false }: Props = $props();

	const options = [
		{ label: 'Keine', value: null },
		{ label: '5 Min', value: 5 },
		{ label: '15 Min', value: 15 },
		{ label: '30 Min', value: 30 },
		{ label: '1 Std', value: 60 },
		{ label: '1 Tag', value: 1440 },
	];
</script>

<div class="flex items-center gap-1.5">
	<Bell size={14} class="text-muted-foreground" />
	<select
		{disabled}
		value={value ?? ''}
		onchange={(e) => {
			const v = e.currentTarget.value;
			onChange(v === '' ? null : Number(v));
		}}
		class="rounded-md border border-border bg-transparent px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none disabled:opacity-40"
	>
		{#each options as opt}
			<option value={opt.value ?? ''}>{opt.label}</option>
		{/each}
	</select>
</div>
