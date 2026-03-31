<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { toastStore as toast } from '@manacore/shared-ui';
	import { Plus } from '@manacore/shared-icons';
	import type { Calendar } from '@calendar/shared';

	interface Props {
		calendars: Calendar[];
		onCalendarUpdated?: () => void;
	}

	let { calendars, onCalendarUpdated }: Props = $props();

	// Calendar management state
	let editingCalendar = $state<Calendar | null>(null);
	let editName = $state('');
	let editColor = $state('');
	let editIsDefault = $state(false);
	let showNewCalendarForm = $state(false);
	let newCalendarName = $state('');
	let newCalendarColor = $state('#3b82f6');

	function startEditing(calendar: Calendar) {
		editingCalendar = calendar;
		editName = calendar.name;
		editColor = calendar.color || '#3b82f6';
		editIsDefault = calendar.isDefault || false;
	}

	function cancelEditing() {
		editingCalendar = null;
		editName = '';
		editColor = '';
		editIsDefault = false;
	}

	async function handleCreateCalendar() {
		if (!newCalendarName.trim()) return;

		const result = await calendarsStore.createCalendar({
			name: newCalendarName.trim(),
			color: newCalendarColor,
		});

		if (result.error) {
			toast.error(`${$_('common.error')}: ${result.error.message}`);
			return;
		}

		toast.success($_('settings.calendarCreated'));
		newCalendarName = '';
		showNewCalendarForm = false;
		onCalendarUpdated?.();
	}

	async function handleDeleteCalendar(calendar: Calendar) {
		if (!confirm($_('settings.confirmDeleteCalendar', { values: { name: calendar.name } }))) {
			return;
		}

		const result = await calendarsStore.deleteCalendar(calendar.id);

		if (result.error) {
			toast.error(`${$_('common.error')}: ${result.error.message}`);
			return;
		}

		toast.success($_('settings.calendarDeleted'));
		onCalendarUpdated?.();
	}

	async function handleUpdateCalendar() {
		if (!editingCalendar || !editName.trim()) return;

		// If setting as default and it wasn't before, use setAsDefault
		if (editIsDefault && !editingCalendar.isDefault) {
			const defaultResult = await calendarsStore.setAsDefault(editingCalendar.id, calendars);
			if (defaultResult?.error) {
				toast.error(`${$_('common.error')}: ${defaultResult.error.message}`);
				return;
			}
		}

		// Update name and color
		const result = await calendarsStore.updateCalendar(editingCalendar.id, {
			name: editName.trim(),
			color: editColor,
		});

		if (result.error) {
			toast.error(`${$_('common.error')}: ${result.error.message}`);
			return;
		}

		toast.success($_('settings.calendarUpdated'));
		cancelEditing();
		onCalendarUpdated?.();
	}
</script>

<div class="calendar-management">
	<div class="calendars-toolbar">
		<button
			class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
			onclick={() => (showNewCalendarForm = true)}
		>
			<Plus size={16} />
			{$_('settings.newCalendar')}
		</button>
	</div>

	{#if showNewCalendarForm}
		<div class="new-calendar-form">
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleCreateCalendar();
				}}
			>
				<div class="calendar-form-row">
					<input
						type="text"
						class="input"
						placeholder={$_('settings.calendarName')}
						bind:value={newCalendarName}
					/>
					<input type="color" class="color-input" bind:value={newCalendarColor} />
				</div>
				<div class="calendar-form-actions">
					<button type="button" class="btn btn-ghost" onclick={() => (showNewCalendarForm = false)}>
						{$_('common.cancel')}
					</button>
					<button type="submit" class="btn btn-primary" disabled={!newCalendarName.trim()}>
						{$_('common.create')}
					</button>
				</div>
			</form>
		</div>
	{/if}

	<div class="calendar-list">
		{#each calendars as calendar}
			{#if editingCalendar?.id === calendar.id}
				<div class="calendar-edit-form">
					<form
						onsubmit={(e) => {
							e.preventDefault();
							handleUpdateCalendar();
						}}
					>
						<div class="edit-form-row">
							<div class="edit-form-group edit-form-group--name">
								<label for="edit-name" class="edit-label">{$_('settings.name')}</label>
								<input
									type="text"
									id="edit-name"
									class="edit-input"
									placeholder={$_('settings.calendarName')}
									bind:value={editName}
								/>
							</div>

							<div class="edit-form-group edit-form-group--color">
								<label for="edit-color" class="edit-label">{$_('settings.color')}</label>
								<div class="edit-color-wrapper">
									<input
										type="color"
										id="edit-color"
										class="edit-color-input"
										bind:value={editColor}
									/>
									<span class="edit-color-value">{editColor}</span>
								</div>
							</div>
						</div>

						<label class="edit-checkbox">
							<input
								type="checkbox"
								bind:checked={editIsDefault}
								disabled={editingCalendar.isDefault}
							/>
							<span class="edit-checkbox-text">
								{$_('settings.setAsDefault')}
								{#if editingCalendar.isDefault}
									<span class="edit-checkbox-hint">({$_('settings.currentDefault')})</span>
								{/if}
							</span>
						</label>

						<div class="edit-form-actions">
							<button type="button" class="btn btn-ghost" onclick={cancelEditing}>
								{$_('common.cancel')}
							</button>
							<button type="submit" class="btn btn-primary" disabled={!editName.trim()}>
								{$_('common.save')}
							</button>
						</div>
					</form>
				</div>
			{:else}
				<div class="calendar-card">
					<div class="calendar-info">
						<span class="color-dot" style="background-color: {calendar.color}"></span>
						<span class="calendar-name">{calendar.name}</span>
						{#if calendar.isDefault}
							<span class="badge badge-primary">{$_('settings.default')}</span>
						{/if}
					</div>
					<div class="calendar-actions">
						<button class="btn btn-ghost btn-sm" onclick={() => startEditing(calendar)}>
							{$_('common.edit')}
						</button>
						{#if !calendar.isDefault}
							<button
								class="btn btn-ghost btn-sm text-destructive"
								onclick={() => handleDeleteCalendar(calendar)}
							>
								{$_('common.delete')}
							</button>
						{/if}
					</div>
				</div>
			{/if}
		{/each}

		{#if calendars.length === 0}
			<div class="empty-state">
				<p>{$_('settings.noCalendars')}</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.calendars-toolbar {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 1rem;
	}

	.new-calendar-form {
		margin-bottom: 1rem;
		padding: 1rem;
		background: hsl(var(--color-muted) / 0.3);
		border-radius: var(--radius-md);
	}

	.calendar-form-row {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.calendar-form-row .input {
		flex: 1;
	}

	.color-input {
		width: 48px;
		height: 42px;
		padding: 4px;
		border: 2px solid hsl(var(--color-border));
		border-radius: var(--radius-md);
		cursor: pointer;
	}

	.calendar-form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.calendar-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.calendar-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem;
		background: hsl(var(--color-muted) / 0.2);
		border-radius: var(--radius-md);
	}

	/* Edit form styles */
	.calendar-edit-form {
		padding: 1.25rem;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-lg);
		box-shadow: 0 2px 8px hsl(var(--color-foreground) / 0.08);
	}

	.edit-form-row {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.edit-form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.edit-form-group--name {
		flex: 1;
	}

	.edit-form-group--color {
		flex-shrink: 0;
	}

	.edit-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.edit-input {
		width: 100%;
		padding: 0.625rem 0.875rem;
		font-size: 0.9375rem;
		color: hsl(var(--color-foreground));
		background: hsl(var(--color-background));
		border: 2px solid hsl(var(--color-border));
		border-radius: var(--radius-md);
		outline: none;
		transition:
			border-color 150ms ease,
			box-shadow 150ms ease;
	}

	.edit-input:hover {
		border-color: hsl(var(--color-muted-foreground) / 0.5);
	}

	.edit-input:focus {
		border-color: hsl(var(--color-primary));
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.15);
	}

	.edit-input::placeholder {
		color: hsl(var(--color-muted-foreground) / 0.7);
	}

	.edit-color-wrapper {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.375rem 0.625rem 0.375rem 0.375rem;
		background: hsl(var(--color-background));
		border: 2px solid hsl(var(--color-border));
		border-radius: var(--radius-md);
		transition: border-color 150ms ease;
	}

	.edit-color-wrapper:hover {
		border-color: hsl(var(--color-muted-foreground) / 0.5);
	}

	.edit-color-wrapper:focus-within {
		border-color: hsl(var(--color-primary));
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.15);
	}

	.edit-color-input {
		width: 32px;
		height: 32px;
		padding: 0;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		background: transparent;
	}

	.edit-color-input::-webkit-color-swatch-wrapper {
		padding: 0;
	}

	.edit-color-input::-webkit-color-swatch {
		border: none;
		border-radius: var(--radius-sm);
	}

	.edit-color-input::-moz-color-swatch {
		border: none;
		border-radius: var(--radius-sm);
	}

	.edit-color-value {
		font-size: 0.8125rem;
		font-family: monospace;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
	}

	.edit-checkbox {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		margin-bottom: 1rem;
		background: hsl(var(--color-muted) / 0.3);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: background 150ms ease;
	}

	.edit-checkbox:hover {
		background: hsl(var(--color-muted) / 0.5);
	}

	.edit-checkbox input[type='checkbox'] {
		width: 1.125rem;
		height: 1.125rem;
		accent-color: hsl(var(--color-primary));
		cursor: pointer;
	}

	.edit-checkbox input[type='checkbox']:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.edit-checkbox-text {
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
	}

	.edit-checkbox-hint {
		color: hsl(var(--color-muted-foreground));
		font-style: italic;
		margin-left: 0.25rem;
	}

	.edit-form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--color-border));
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
		background: hsl(var(--color-muted));
		border-radius: var(--radius-sm);
		color: hsl(var(--color-muted-foreground));
	}

	.badge-primary {
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
		font-weight: 500;
	}

	.calendar-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-sm {
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
	}

	.empty-state {
		text-align: center;
		padding: 1.5rem;
		color: hsl(var(--color-muted-foreground));
	}

	.text-destructive {
		color: hsl(var(--color-error));
	}
</style>
