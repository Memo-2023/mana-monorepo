<script lang="ts">
	import { REMINDER_PRESETS, type Reminder } from '@calendar/shared';
	import * as api from '$lib/api/reminders';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { Bell, Plus, Trash, Envelope, DeviceMobile } from '@manacore/shared-icons';

	interface ReminderDraft {
		minutesBefore: number;
		notifyPush: boolean;
		notifyEmail: boolean;
	}

	interface Props {
		/** Event ID (null for unsaved events) */
		eventId: string | null;
		/** Existing reminders (for edit mode) */
		reminders?: Reminder[];
		/** For create mode: callback with draft reminders to create after event save */
		onDraftsChange?: (drafts: ReminderDraft[]) => void;
		/** Called after a reminder is added/removed on a saved event */
		onRemindersChange?: () => void;
	}

	let { eventId, reminders = [], onDraftsChange, onRemindersChange }: Props = $props();

	// Draft reminders for unsaved events
	let drafts = $state<ReminderDraft[]>([
		{
			minutesBefore: settingsStore.defaultReminder,
			notifyPush: true,
			notifyEmail: false,
		},
	]);

	let isAdding = $state(false);

	// German labels for presets
	const PRESET_LABELS: Record<number, string> = {
		0: 'Zum Zeitpunkt',
		5: '5 Minuten vorher',
		10: '10 Minuten vorher',
		15: '15 Minuten vorher',
		30: '30 Minuten vorher',
		60: '1 Stunde vorher',
		120: '2 Stunden vorher',
		1440: '1 Tag vorher',
		2880: '2 Tage vorher',
		10080: '1 Woche vorher',
	};

	function getLabel(minutes: number): string {
		return PRESET_LABELS[minutes] || `${minutes} Min. vorher`;
	}

	// ==================== Draft Mode (for new events) ====================

	function addDraft() {
		drafts = [
			...drafts,
			{
				minutesBefore: settingsStore.defaultReminder,
				notifyPush: true,
				notifyEmail: false,
			},
		];
		onDraftsChange?.(drafts);
	}

	function removeDraft(index: number) {
		drafts = drafts.filter((_, i) => i !== index);
		onDraftsChange?.(drafts);
	}

	function updateDraft(index: number, field: keyof ReminderDraft, value: number | boolean) {
		drafts = drafts.map((d, i) => (i === index ? { ...d, [field]: value } : d));
		onDraftsChange?.(drafts);
	}

	// ==================== Saved Event Mode ====================

	async function addReminder(minutes: number) {
		if (!eventId) return;
		isAdding = true;

		const result = await api.createReminder(eventId, {
			eventId,
			minutesBefore: minutes,
			notifyPush: true,
			notifyEmail: false,
		});

		isAdding = false;
		if (!result.error) {
			onRemindersChange?.();
		}
	}

	async function removeReminder(id: string) {
		const result = await api.deleteReminder(id);
		if (!result.error) {
			onRemindersChange?.();
		}
	}

	// Which mode?
	const isSavedEvent = $derived(!!eventId && eventId !== '__draft__');
	const displayReminders = $derived(isSavedEvent ? reminders : []);
</script>

<div class="reminder-section">
	<div class="section-header">
		<Bell size={16} class="text-muted-foreground" />
		<span class="text-sm font-medium text-foreground">Erinnerungen</span>
	</div>

	{#if isSavedEvent}
		<!-- Saved event: show existing reminders -->
		{#if displayReminders.length === 0}
			<p class="empty-text">Keine Erinnerungen</p>
		{/if}

		{#each displayReminders as reminder (reminder.id)}
			<div class="reminder-item">
				<div class="reminder-info">
					<span class="reminder-time">{getLabel(reminder.minutesBefore)}</span>
					<div class="reminder-channels">
						{#if reminder.notifyPush}
							<span class="channel-badge" title="Push-Benachrichtigung">
								<DeviceMobile size={12} />
							</span>
						{/if}
						{#if reminder.notifyEmail}
							<span class="channel-badge" title="E-Mail">
								<Envelope size={12} />
							</span>
						{/if}
					</div>
					{#if reminder.status === 'sent'}
						<span class="status-sent">Gesendet</span>
					{:else if reminder.status === 'failed'}
						<span class="status-failed">Fehlgeschlagen</span>
					{/if}
				</div>
				<button
					class="remove-btn"
					onclick={() => removeReminder(reminder.id)}
					title="Erinnerung entfernen"
				>
					<Trash size={14} />
				</button>
			</div>
		{/each}

		<!-- Add reminder for saved event -->
		<div class="add-section">
			<select
				class="preset-select"
				onchange={(e) => {
					const val = parseInt((e.target as HTMLSelectElement).value, 10);
					if (!isNaN(val)) addReminder(val);
					(e.target as HTMLSelectElement).value = '';
				}}
				disabled={isAdding}
			>
				<option value="">+ Erinnerung hinzufügen</option>
				{#each REMINDER_PRESETS as preset}
					<option value={preset.minutes}>{getLabel(preset.minutes)}</option>
				{/each}
			</select>
		</div>
	{:else}
		<!-- Draft mode: reminders for unsaved events -->
		{#each drafts as draft, index}
			<div class="reminder-item">
				<div class="reminder-config">
					<select
						class="preset-select"
						value={draft.minutesBefore}
						onchange={(e) =>
							updateDraft(
								index,
								'minutesBefore',
								parseInt((e.target as HTMLSelectElement).value, 10)
							)}
					>
						{#each REMINDER_PRESETS as preset}
							<option value={preset.minutes}>{getLabel(preset.minutes)}</option>
						{/each}
					</select>
					<label class="channel-toggle" title="Push-Benachrichtigung">
						<input
							type="checkbox"
							checked={draft.notifyPush}
							onchange={() => updateDraft(index, 'notifyPush', !draft.notifyPush)}
						/>
						<DeviceMobile size={14} />
					</label>
					<label class="channel-toggle" title="E-Mail">
						<input
							type="checkbox"
							checked={draft.notifyEmail}
							onchange={() => updateDraft(index, 'notifyEmail', !draft.notifyEmail)}
						/>
						<Envelope size={14} />
					</label>
				</div>
				<button class="remove-btn" onclick={() => removeDraft(index)} title="Erinnerung entfernen">
					<Trash size={14} />
				</button>
			</div>
		{/each}

		<button class="add-btn" onclick={addDraft}>
			<Plus size={14} />
			<span>Erinnerung hinzufügen</span>
		</button>
	{/if}
</div>

<style>
	.reminder-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.empty-text {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		padding-left: 1.5rem;
	}

	.reminder-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.375rem 0.5rem 0.375rem 1.5rem;
		border-radius: 0.375rem;
		transition: background 0.15s ease;
	}

	.reminder-item:hover {
		background: hsl(var(--muted) / 0.3);
	}

	.reminder-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}

	.reminder-time {
		font-size: 0.8125rem;
		color: hsl(var(--foreground));
	}

	.reminder-channels {
		display: flex;
		gap: 0.25rem;
	}

	.channel-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 0.25rem;
		background: hsl(var(--muted));
		color: hsl(var(--muted-foreground));
	}

	.status-sent {
		font-size: 0.6875rem;
		color: hsl(142 71% 45%);
		font-weight: 500;
	}

	.status-failed {
		font-size: 0.6875rem;
		color: hsl(0 84% 60%);
		font-weight: 500;
	}

	.reminder-config {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
	}

	.preset-select {
		flex: 1;
		padding: 0.375rem 0.5rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.375rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.preset-select:focus {
		outline: none;
		border-color: hsl(var(--primary));
	}

	.channel-toggle {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		cursor: pointer;
		color: hsl(var(--muted-foreground));
		font-size: 0.75rem;
	}

	.channel-toggle input {
		width: 0.875rem;
		height: 0.875rem;
		accent-color: hsl(var(--primary));
	}

	.channel-toggle:has(input:checked) {
		color: hsl(var(--foreground));
	}

	.remove-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.25rem;
		border: none;
		background: transparent;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		opacity: 0;
		transition: all 0.15s ease;
	}

	.reminder-item:hover .remove-btn {
		opacity: 1;
	}

	.remove-btn:hover {
		color: hsl(0 84% 60%);
		background: hsl(0 84% 60% / 0.1);
	}

	.add-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.5rem;
		margin-left: 1.5rem;
		border: none;
		background: transparent;
		color: hsl(var(--primary));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		border-radius: 0.375rem;
		transition: background 0.15s ease;
	}

	.add-btn:hover {
		background: hsl(var(--primary) / 0.1);
	}

	.add-section {
		padding-left: 1.5rem;
	}
</style>
