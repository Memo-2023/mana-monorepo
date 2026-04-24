<script lang="ts">
	import { getDateFnsLocale } from '$lib/i18n/format';
	import {
		format,
		startOfMonth,
		endOfMonth,
		startOfWeek,
		endOfWeek,
		eachDayOfInterval,
		isSameMonth,
		isToday,
		isSameDay,
		addMonths,
		subMonths,
	} from 'date-fns';
	import { CaretLeft, CaretRight } from '@mana/shared-icons';

	interface Props {
		selectedDate: Date;
		onDateSelect: (date: Date) => void;
	}

	let { selectedDate, onDateSelect }: Props = $props();

	let currentMonth = $state(new Date());

	let calendarDays = $derived.by(() => {
		const monthStart = startOfMonth(currentMonth);
		const monthEnd = endOfMonth(currentMonth);
		const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
		const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
		return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
	});

	const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
</script>

<div class="mini-calendar">
	<div class="calendar-header">
		<button
			class="nav-btn"
			onclick={() => (currentMonth = subMonths(currentMonth, 1))}
			aria-label="Vorheriger Monat"
		>
			<CaretLeft size={16} />
		</button>
		<span class="month-label"
			>{format(currentMonth, 'MMMM yyyy', { locale: getDateFnsLocale() })}</span
		>
		<button
			class="nav-btn"
			onclick={() => (currentMonth = addMonths(currentMonth, 1))}
			aria-label="Nächster Monat"
		>
			<CaretRight size={16} />
		</button>
	</div>

	<div class="weekday-row">
		{#each weekDays as day}
			<span class="weekday">{day}</span>
		{/each}
	</div>

	<div class="days-grid">
		{#each calendarDays as day}
			<button
				class="day"
				class:other-month={!isSameMonth(day, currentMonth)}
				class:today={isToday(day)}
				class:selected={isSameDay(day, selectedDate)}
				onclick={() => onDateSelect(day)}
			>
				{format(day, 'd')}
			</button>
		{/each}
	</div>
</div>

<style>
	.mini-calendar {
		padding: 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-lg, 12px);
		background: hsl(var(--color-card));
	}

	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.month-label {
		font-weight: 600;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
	}

	.nav-btn {
		padding: 0.25rem;
		border: none;
		background: transparent;
		border-radius: var(--radius-sm, 4px);
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
	}

	.nav-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.weekday-row {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		margin-bottom: 0.25rem;
	}

	.weekday {
		text-align: center;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		font-weight: 500;
	}

	.days-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2px;
	}

	.day {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 9999px;
		cursor: pointer;
		font-size: 0.75rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-foreground));
		transition: all 0.15s ease;
	}

	.day:hover {
		background: hsl(var(--color-muted));
	}

	.day.other-month {
		color: hsl(var(--color-muted-foreground));
		opacity: 0.5;
	}

	.day.today {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.day.selected {
		border: 2px solid hsl(var(--color-primary));
	}
</style>
