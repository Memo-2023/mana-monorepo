<script lang="ts">
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { goto } from '$app/navigation';

	function handleToggle(calendarId: string) {
		calendarsStore.toggleVisibility(calendarId);
	}

	function handleAddCalendar() {
		goto('/settings');
	}
</script>

<div class="calendar-sidebar-section">
	<div class="section-header">
		<h3 class="section-title">Meine Kalender</h3>
		<button class="add-btn" onclick={handleAddCalendar} aria-label="Kalender hinzufügen">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
		</button>
	</div>

	<div class="calendar-list">
		{#each calendarsStore.calendars as calendar}
			<label class="calendar-item">
				<input
					type="checkbox"
					checked={calendar.isVisible}
					onchange={() => handleToggle(calendar.id)}
					style="accent-color: {calendar.color}"
				/>
				<span class="color-dot" style="background-color: {calendar.color}"></span>
				<span class="calendar-name">{calendar.name}</span>
			</label>
		{/each}

		{#if calendarsStore.calendars.length === 0}
			<p class="empty-message">Keine Kalender vorhanden</p>
		{/if}
	</div>
</div>

<style>
	.calendar-sidebar-section {
		background: hsl(var(--color-surface));
		border-radius: var(--radius-lg);
		border: 1px solid hsl(var(--color-border));
		padding: 1rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.section-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0;
	}

	.add-btn {
		padding: 0.25rem;
		border: none;
		background: transparent;
		border-radius: var(--radius-sm);
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
	}

	.add-btn:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.calendar-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.calendar-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: var(--radius-sm);
	}

	.calendar-item:hover {
		background: hsl(var(--color-muted) / 0.5);
	}

	.calendar-item input {
		width: 16px;
		height: 16px;
		cursor: pointer;
	}

	.color-dot {
		width: 12px;
		height: 12px;
		border-radius: var(--radius-full);
	}

	.calendar-name {
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
	}

	.empty-message {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		text-align: center;
		padding: 1rem;
	}
</style>
