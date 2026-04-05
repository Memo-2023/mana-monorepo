<script lang="ts">
	import { Bell, BellSlash } from '@mana/shared-icons';

	/**
	 * Reusable reminder time picker dropdown.
	 * Lets user select "X minutes before" for reminders on tasks, events, etc.
	 */

	interface ReminderOption {
		value: number | null;
		label: string;
	}

	interface Props {
		/** Selected value in minutes (null = no reminder) */
		value: number | null;
		/** Called when selection changes */
		onChange: (minutes: number | null) => void;
		/** Custom options (defaults to standard set) */
		options?: ReminderOption[];
		/** Disable the picker */
		disabled?: boolean;
	}

	const DEFAULT_OPTIONS: ReminderOption[] = [
		{ value: null, label: 'Keine Erinnerung' },
		{ value: 5, label: '5 Minuten vorher' },
		{ value: 15, label: '15 Minuten vorher' },
		{ value: 30, label: '30 Minuten vorher' },
		{ value: 60, label: '1 Stunde vorher' },
		{ value: 1440, label: '1 Tag vorher' },
	];

	let { value, onChange, options = DEFAULT_OPTIONS, disabled = false }: Props = $props();

	function handleChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		const raw = target.value;
		onChange(raw === '' ? null : parseInt(raw, 10));
	}

	const displayLabel = $derived(
		options.find((o) => o.value === value)?.label ?? 'Keine Erinnerung'
	);

	const hasReminder = $derived(value !== null);
</script>

<div class="inline-flex items-center gap-1.5">
	{#if hasReminder}
		<Bell size={14} weight="fill" class="text-primary flex-shrink-0" />
	{:else}
		<BellSlash size={14} class="text-muted-foreground flex-shrink-0" />
	{/if}
	<select
		class="appearance-none bg-transparent text-xs cursor-pointer
			{hasReminder ? 'text-primary font-medium' : 'text-muted-foreground'}
			focus:outline-none"
		{disabled}
		onchange={handleChange}
	>
		{#each options as option}
			<option value={option.value ?? ''} selected={option.value === value}>
				{option.label}
			</option>
		{/each}
	</select>
</div>
