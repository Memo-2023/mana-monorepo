<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Bell, BellSlash } from '@manacore/shared-icons';

	interface Props {
		value: number | null;
		onChange: (minutes: number | null) => void;
		disabled?: boolean;
	}

	let { value, onChange, disabled = false }: Props = $props();

	const options: { minutes: number | null; labelKey: string }[] = [
		{ minutes: null, labelKey: 'reminders.none' },
		{ minutes: 0, labelKey: 'reminders.atTime' },
		{ minutes: 5, labelKey: 'reminders.5min' },
		{ minutes: 15, labelKey: 'reminders.15min' },
		{ minutes: 30, labelKey: 'reminders.30min' },
		{ minutes: 60, labelKey: 'reminders.1hour' },
		{ minutes: 120, labelKey: 'reminders.2hours' },
		{ minutes: 1440, labelKey: 'reminders.1day' },
		{ minutes: 2880, labelKey: 'reminders.2days' },
		{ minutes: 10080, labelKey: 'reminders.1week' },
	];

	function handleChange(e: Event) {
		const raw = (e.target as HTMLSelectElement).value;
		onChange(raw === '' ? null : Number(raw));
	}
</script>

<div class="reminder-selector">
	<div class="reminder-icon" class:active={value !== null}>
		{#if value !== null}
			<Bell size={14} weight="fill" />
		{:else}
			<BellSlash size={14} />
		{/if}
	</div>
	<select
		class="reminder-select"
		value={value === null ? '' : String(value)}
		onchange={handleChange}
		{disabled}
	>
		{#each options as opt}
			<option value={opt.minutes === null ? '' : String(opt.minutes)}>
				{$t(opt.labelKey)}
			</option>
		{/each}
	</select>
</div>

<style>
	.reminder-selector {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.reminder-icon {
		display: flex;
		align-items: center;
		color: var(--color-muted-foreground);
		transition: color 0.15s;
	}

	.reminder-icon.active {
		color: var(--color-primary);
	}

	.reminder-select {
		border: none;
		background: transparent;
		font-size: 0.8125rem;
		color: var(--color-foreground);
		font-family: inherit;
		padding: 0;
		outline: none;
		cursor: pointer;
		min-width: 0;
	}

	.reminder-select:focus {
		color: var(--color-primary);
	}

	:global(.dark) .reminder-select {
		color-scheme: dark;
	}
</style>
