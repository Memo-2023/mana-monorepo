<script lang="ts">
	import { getContext } from 'svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { externalCalendarsStore } from '$lib/stores/external-calendars.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import type { Calendar } from '@calendar/shared';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Get calendars from layout context (live query)
	const calendarsCtx: { readonly value: Calendar[] } = getContext('calendars');

	function handleToggle(calendarId: string) {
		calendarsStore.toggleVisibility(calendarId, calendarsCtx.value);
	}

	function handleExternalToggle(id: string, currentVisible: boolean) {
		externalCalendarsStore.update(id, { isVisible: !currentVisible });
	}

	function handleAddCalendar() {
		goto('/settings');
	}

	onMount(() => {
		if (authStore.isAuthenticated && externalCalendarsStore.calendars.length === 0) {
			externalCalendarsStore.fetchCalendars();
		}
	});
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

	<div class="calendar-list" role="group" aria-label="Kalender Sichtbarkeit">
		{#each calendarsCtx.value as calendar}
			<label class="calendar-item">
				<input
					type="checkbox"
					checked={calendar.isVisible}
					onchange={() => handleToggle(calendar.id)}
					style="accent-color: {calendar.color}"
					aria-label="{calendar.name} {calendar.isVisible ? 'sichtbar' : 'ausgeblendet'}"
				/>
				<span class="color-dot" style="background-color: {calendar.color}" aria-hidden="true"
				></span>
				<span class="calendar-name">{calendar.name}</span>
			</label>
		{/each}

		{#if calendarsCtx.value.length === 0}
			<p class="empty-message">Keine Kalender vorhanden</p>
		{/if}
	</div>

	{#if externalCalendarsStore.calendars.length > 0}
		<div class="section-header external-header">
			<h3 class="section-title">Externe Kalender</h3>
			<button class="add-btn" onclick={() => goto('/settings/sync')} aria-label="Sync verwalten">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					/>
				</svg>
			</button>
		</div>

		<div class="calendar-list" role="group" aria-label="Externe Kalender Sichtbarkeit">
			{#each externalCalendarsStore.calendars as cal}
				<label class="calendar-item">
					<input
						type="checkbox"
						checked={cal.isVisible}
						onchange={() => handleExternalToggle(cal.id, cal.isVisible)}
						style="accent-color: {cal.color}"
						aria-label="{cal.name} {cal.isVisible ? 'sichtbar' : 'ausgeblendet'}"
					/>
					<span class="color-dot" style="background-color: {cal.color}" aria-hidden="true"></span>
					<span class="calendar-name">{cal.name}</span>
					{#if cal.lastSyncError}
						<span class="sync-error-dot" title="Sync-Fehler"></span>
					{/if}
				</label>
			{/each}
		</div>
	{/if}
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

	.external-header {
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid hsl(var(--color-border));
	}

	.sync-error-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: hsl(0 84% 60%);
		flex-shrink: 0;
		margin-left: auto;
	}
</style>
