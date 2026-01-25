<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { PageHeader } from '@manacore/shared-ui';
	import { alarmsStore } from '$lib/stores/alarms.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { toast } from '$lib/stores/toast';
	import type { CreateAlarmInput, Alarm } from '@clock/shared';
	import { ALARM_SOUNDS, DEFAULT_ALARM_PRESETS } from '@clock/shared';
	import { AlarmsSkeleton } from '$lib/components/skeletons';

	// Quick create form (inline)
	let newTime = $state('07:00');
	let newLabel = $state('');
	let newRepeatDays = $state<number[]>([]);
	let showOptions = $state(false);

	// Edit modal state
	let showEditModal = $state(false);
	let editingId = $state<string | null>(null);
	let editTime = $state('07:00');
	let editLabel = $state('');
	let editRepeatDays = $state<number[]>([]);
	let editSound = $state('default');
	let editSnoozeMinutes = $state(5);

	const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

	// Find existing alarm for a preset time
	function findAlarmForPreset(presetTime: string): Alarm | undefined {
		return alarmsStore.alarms.find((a) => a.time.slice(0, 5) === presetTime);
	}

	// Toggle a preset alarm
	async function togglePreset(presetTime: string, presetLabel: string) {
		const existingAlarm = findAlarmForPreset(presetTime);

		if (existingAlarm) {
			await alarmsStore.toggleAlarm(existingAlarm.id);
		} else {
			const result = await alarmsStore.createAlarm({
				time: presetTime + ':00',
				label: presetLabel,
				enabled: true,
			});
			if (result.success) {
				toast.success('Wecker erstellt');
			} else {
				toast.error(result.error || 'Fehler beim Erstellen');
			}
		}
	}

	// Quick create new alarm
	async function handleQuickCreate() {
		const result = await alarmsStore.createAlarm({
			time: newTime + ':00',
			label: newLabel || undefined,
			repeatDays: newRepeatDays.length > 0 ? newRepeatDays : undefined,
			enabled: true,
		});

		if (result.success) {
			toast.success('Wecker erstellt');
			// Reset form
			newTime = '07:00';
			newLabel = '';
			newRepeatDays = [];
			showOptions = false;
		} else {
			toast.error(result.error || 'Fehler beim Erstellen');
		}
	}

	function toggleNewDay(day: number) {
		if (newRepeatDays.includes(day)) {
			newRepeatDays = newRepeatDays.filter((d) => d !== day);
		} else {
			newRepeatDays = [...newRepeatDays, day];
		}
	}

	onMount(async () => {
		// Load alarms - works for both authenticated and guest mode
		await alarmsStore.fetchAlarms();
	});

	function openEditModal(alarm: Alarm) {
		editingId = alarm.id;
		editTime = alarm.time.slice(0, 5);
		editLabel = alarm.label || '';
		editRepeatDays = alarm.repeatDays || [];
		editSound = alarm.sound || 'default';
		editSnoozeMinutes = alarm.snoozeMinutes || 5;
		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
		editingId = null;
	}

	function toggleEditDay(day: number) {
		if (editRepeatDays.includes(day)) {
			editRepeatDays = editRepeatDays.filter((d) => d !== day);
		} else {
			editRepeatDays = [...editRepeatDays, day];
		}
	}

	async function handleEditSubmit() {
		if (!editingId) return;

		const result = await alarmsStore.updateAlarm(editingId, {
			time: editTime + ':00',
			label: editLabel || undefined,
			repeatDays: editRepeatDays.length > 0 ? editRepeatDays : undefined,
			sound: editSound,
			snoozeMinutes: editSnoozeMinutes,
		});

		if (result.success) {
			toast.success('Wecker aktualisiert');
			closeEditModal();
		} else {
			toast.error(result.error || 'Fehler beim Speichern');
		}
	}

	async function handleDelete(id: string) {
		const result = await alarmsStore.deleteAlarm(id);
		if (result.success) {
			toast.success('Wecker gelöscht');
		} else {
			toast.error(result.error || 'Fehler beim Löschen');
		}
	}

	async function handleToggle(id: string) {
		await alarmsStore.toggleAlarm(id);
	}

	function getRepeatText(days: number[] | null) {
		if (!days || days.length === 0) return 'Einmalig';
		if (days.length === 7) return 'Täglich';
		if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return 'Wochentags';
		if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Am Wochenende';
		return days.map((d) => dayNames[d]).join(', ');
	}
</script>

<PageHeader title={$_('alarm.title')} size="md" centered />

<div class="space-y-4">
	<!-- Quick Create Form -->
	<div class="quick-create">
		<input type="time" class="time-input-inline" bind:value={newTime} />
		<input type="text" class="label-input" placeholder="Bezeichnung" bind:value={newLabel} />
		<button
			class="text-xs text-muted-foreground hover:text-foreground transition-colors px-2"
			onclick={() => (showOptions = !showOptions)}
			title="Wiederholung"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4"
				class:text-primary={newRepeatDays.length > 0}
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
					clip-rule="evenodd"
				/>
			</svg>
		</button>
		<button class="btn btn-primary btn-sm" onclick={handleQuickCreate}> + </button>
	</div>

	{#if showOptions}
		<div class="day-selector-compact">
			{#each dayNames as day, i}
				<button
					type="button"
					class:active={newRepeatDays.includes(i)}
					onclick={() => toggleNewDay(i)}
				>
					{day}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Loading State -->
	{#if alarmsStore.loading}
		<AlarmsSkeleton />
	{:else}
		<!-- Default Alarm Presets (Grid) -->
		<div class="alarm-grid">
			{#each DEFAULT_ALARM_PRESETS as preset}
				{@const existingAlarm = findAlarmForPreset(preset.time)}
				{@const isActive = existingAlarm?.enabled ?? false}
				<div
					class="alarm-tile"
					class:active={isActive}
					role="button"
					tabindex="0"
					onclick={() => togglePreset(preset.time, preset.label)}
					onkeydown={(e) => e.key === 'Enter' && togglePreset(preset.time, preset.label)}
				>
					<div class="text-xl font-light text-foreground tabular-nums text-center">
						{preset.time}
					</div>
					<div class="text-[10px] text-muted-foreground text-center truncate mt-0.5">
						{existingAlarm?.label || preset.label}
					</div>
				</div>
			{/each}
		</div>

		<!-- Custom Alarms (Grid) -->
		{@const customAlarms = alarmsStore.alarms.filter(
			(a) => !DEFAULT_ALARM_PRESETS.some((p) => p.time === a.time.slice(0, 5))
		)}
		{#if customAlarms.length > 0}
			<div class="mt-4">
				<h2 class="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
					{$_('alarm.custom')}
				</h2>
				<div class="alarm-grid">
					{#each customAlarms as alarm (alarm.id)}
						<div
							class="alarm-tile"
							class:active={alarm.enabled}
							role="button"
							tabindex="0"
							onclick={() => handleToggle(alarm.id)}
							onkeydown={(e) => e.key === 'Enter' && handleToggle(alarm.id)}
						>
							<div class="text-xl font-light text-foreground tabular-nums text-center">
								{alarm.time.slice(0, 5)}
							</div>
							<div class="text-[10px] text-muted-foreground text-center truncate mt-0.5">
								{alarm.label || getRepeatText(alarm.repeatDays)}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}

	<!-- Edit Modal -->
	{#if showEditModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div class="card w-full max-w-md">
				<h2 class="mb-4 text-xl font-semibold">{$_('alarm.edit')}</h2>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleEditSubmit();
					}}
				>
					<!-- Time -->
					<div class="mb-4">
						<label class="mb-1 block text-sm font-medium">{$_('alarm.time')}</label>
						<input type="time" class="input time-input" bind:value={editTime} />
					</div>

					<!-- Label -->
					<div class="mb-4">
						<label class="mb-1 block text-sm font-medium">{$_('alarm.label')}</label>
						<input
							type="text"
							class="input"
							placeholder="Arbeit, Sport, etc."
							bind:value={editLabel}
						/>
					</div>

					<!-- Repeat Days -->
					<div class="mb-4">
						<label class="mb-2 block text-sm font-medium">{$_('alarm.repeat')}</label>
						<div class="day-selector">
							{#each dayNames as day, i}
								<button
									type="button"
									class:active={editRepeatDays.includes(i)}
									onclick={() => toggleEditDay(i)}
								>
									{day}
								</button>
							{/each}
						</div>
					</div>

					<!-- Sound -->
					<div class="mb-4">
						<label class="mb-1 block text-sm font-medium">{$_('alarm.sound')}</label>
						<select class="input" bind:value={editSound}>
							{#each ALARM_SOUNDS as sound}
								<option value={sound.id}>{sound.nameDE}</option>
							{/each}
						</select>
					</div>

					<!-- Snooze -->
					<div class="mb-6">
						<label class="mb-1 block text-sm font-medium">{$_('alarm.snooze')}</label>
						<select class="input" bind:value={editSnoozeMinutes}>
							<option value={5}>5 Minuten</option>
							<option value={10}>10 Minuten</option>
							<option value={15}>15 Minuten</option>
							<option value={30}>30 Minuten</option>
						</select>
					</div>

					<!-- Actions -->
					<div class="flex gap-3">
						<button type="button" class="btn btn-secondary flex-1" onclick={closeEditModal}>
							{$_('common.cancel')}
						</button>
						<button type="submit" class="btn btn-primary flex-1">
							{$_('common.save')}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>
