<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { toast } from '$lib/stores/toast';
	import type { Calendar } from '@calendar/shared';

	let editingCalendar = $state<Calendar | null>(null);
	let showNewForm = $state(false);
	let newCalendarName = $state('');
	let newCalendarColor = $state('#3b82f6');

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}
	});

	async function handleCreateCalendar() {
		if (!newCalendarName.trim()) return;

		const result = await calendarsStore.createCalendar({
			name: newCalendarName.trim(),
			color: newCalendarColor,
		});

		if (result.error) {
			toast.error(`Fehler: ${result.error.message}`);
			return;
		}

		toast.success('Kalender erstellt');
		newCalendarName = '';
		showNewForm = false;
	}

	async function handleDeleteCalendar(calendar: Calendar) {
		if (!confirm(`Möchten Sie "${calendar.name}" wirklich löschen?`)) {
			return;
		}

		const result = await calendarsStore.deleteCalendar(calendar.id);

		if (result.error) {
			toast.error(`Fehler: ${result.error.message}`);
			return;
		}

		toast.success('Kalender gelöscht');
	}

	async function handleUpdateCalendar(calendar: Calendar, name: string, color: string) {
		const result = await calendarsStore.updateCalendar(calendar.id, { name, color });

		if (result.error) {
			toast.error(`Fehler: ${result.error.message}`);
			return;
		}

		toast.success('Kalender aktualisiert');
		editingCalendar = null;
	}
</script>

<svelte:head>
	<title>Meine Kalender | Kalender</title>
</svelte:head>

<div class="calendars-page">
	<header class="page-header">
		<h1>Meine Kalender</h1>
		<button class="btn btn-primary" onclick={() => (showNewForm = true)}>
			Neuer Kalender
		</button>
	</header>

	{#if showNewForm}
		<div class="card new-calendar-form">
			<h2>Neuer Kalender</h2>
			<form onsubmit={(e) => { e.preventDefault(); handleCreateCalendar(); }}>
				<div class="form-row">
					<input
						type="text"
						class="input"
						placeholder="Kalender Name"
						bind:value={newCalendarName}
					/>
					<input
						type="color"
						class="color-input"
						bind:value={newCalendarColor}
					/>
				</div>
				<div class="form-actions">
					<button type="button" class="btn btn-ghost" onclick={() => (showNewForm = false)}>
						Abbrechen
					</button>
					<button type="submit" class="btn btn-primary" disabled={!newCalendarName.trim()}>
						Erstellen
					</button>
				</div>
			</form>
		</div>
	{/if}

	<div class="calendar-list">
		{#each calendarsStore.calendars as calendar}
			<div class="calendar-card card">
				{#if editingCalendar?.id === calendar.id}
					<form
						onsubmit={(e) => {
							e.preventDefault();
							const form = e.target as HTMLFormElement;
							const name = (form.elements.namedItem('name') as HTMLInputElement).value;
							const color = (form.elements.namedItem('color') as HTMLInputElement).value;
							handleUpdateCalendar(calendar, name, color);
						}}
					>
						<div class="form-row">
							<input
								type="text"
								name="name"
								class="input"
								value={calendar.name}
							/>
							<input
								type="color"
								name="color"
								class="color-input"
								value={calendar.color}
							/>
						</div>
						<div class="form-actions">
							<button type="button" class="btn btn-ghost" onclick={() => (editingCalendar = null)}>
								Abbrechen
							</button>
							<button type="submit" class="btn btn-primary">
								Speichern
							</button>
						</div>
					</form>
				{:else}
					<div class="calendar-info">
						<span class="color-dot" style="background-color: {calendar.color}"></span>
						<span class="calendar-name">{calendar.name}</span>
						{#if calendar.isDefault}
							<span class="badge">Standard</span>
						{/if}
					</div>
					<div class="calendar-actions">
						<button
							class="btn btn-ghost btn-sm"
							onclick={() => (editingCalendar = calendar)}
						>
							Bearbeiten
						</button>
						{#if !calendar.isDefault}
							<button
								class="btn btn-ghost btn-sm text-destructive"
								onclick={() => handleDeleteCalendar(calendar)}
							>
								Löschen
							</button>
						{/if}
					</div>
				{/if}
			</div>
		{/each}

		{#if calendarsStore.calendars.length === 0}
			<div class="empty-state card">
				<p>Keine Kalender vorhanden</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.calendars-page {
		max-width: 600px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	.page-header h1 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
	}

	.new-calendar-form {
		margin-bottom: 1.5rem;
	}

	.new-calendar-form h2 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
	}

	.form-row {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.form-row .input {
		flex: 1;
	}

	.color-input {
		width: 48px;
		height: 42px;
		padding: 4px;
		border: 2px solid hsl(var(--border));
		border-radius: var(--radius-md);
		cursor: pointer;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.calendar-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.calendar-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
	}

	.calendar-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.color-dot {
		width: 16px;
		height: 16px;
		border-radius: var(--radius-full);
	}

	.calendar-name {
		font-weight: 500;
	}

	.badge {
		font-size: 0.75rem;
		padding: 0.125rem 0.5rem;
		background: hsl(var(--muted));
		border-radius: var(--radius-sm);
		color: hsl(var(--muted-foreground));
	}

	.calendar-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-sm {
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
	}

	.text-destructive {
		color: hsl(var(--destructive));
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: hsl(var(--muted-foreground));
	}
</style>
