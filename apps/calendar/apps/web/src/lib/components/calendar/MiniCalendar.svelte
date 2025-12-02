<script lang="ts">
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
	import { de } from 'date-fns/locale';

	interface Props {
		selectedDate: Date;
		onDateSelect: (date: Date) => void;
	}

	let { selectedDate, onDateSelect }: Props = $props();

	let currentMonth = $state(new Date());

	// Get all days to display
	let calendarDays = $derived.by(() => {
		const monthStart = startOfMonth(currentMonth);
		const monthEnd = endOfMonth(currentMonth);
		const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
		const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

		return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
	});

	const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

	function previousMonth() {
		currentMonth = subMonths(currentMonth, 1);
	}

	function nextMonth() {
		currentMonth = addMonths(currentMonth, 1);
	}

	function handleDayClick(day: Date) {
		onDateSelect(day);
	}
</script>

<div class="mini-calendar card">
	<div class="calendar-header">
		<button class="nav-btn" onclick={previousMonth} aria-label="Vorheriger Monat">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</button>
		<span class="month-label">{format(currentMonth, 'MMMM yyyy', { locale: de })}</span>
		<button class="nav-btn" onclick={nextMonth} aria-label="Nächster Monat">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
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
				onclick={() => handleDayClick(day)}
			>
				{format(day, 'd')}
			</button>
		{/each}
	</div>
</div>

<style>
	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.month-label {
		font-weight: 600;
		font-size: 0.875rem;
	}

	.nav-btn {
		padding: 0.25rem;
		border: none;
		background: transparent;
		border-radius: var(--radius-sm);
		cursor: pointer;
		color: hsl(var(--muted-foreground));
	}

	.nav-btn:hover {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
	}

	.weekday-row {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		margin-bottom: 0.25rem;
	}

	.weekday {
		text-align: center;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
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
		border-radius: var(--radius-full);
		cursor: pointer;
		font-size: 0.75rem;
		border: none;
		background: transparent;
		color: hsl(var(--foreground));
		transition: all var(--transition-fast);
	}

	.day:hover {
		background: hsl(var(--muted));
	}

	.day.other-month {
		color: hsl(var(--muted-foreground));
		opacity: 0.5;
	}

	.day.today {
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
	}

	.day.selected {
		border: 2px solid hsl(var(--primary));
	}
</style>
