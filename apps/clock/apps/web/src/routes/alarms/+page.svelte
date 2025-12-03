<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { alarmsStore } from '$lib/stores/alarms.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { toast } from '$lib/stores/toast';
	import type { CreateAlarmInput } from '@clock/shared';
	import { ALARM_SOUNDS } from '@clock/shared';

	// Form state
	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let formTime = $state('07:00');
	let formLabel = $state('');
	let formRepeatDays = $state<number[]>([]);
	let formSound = $state('default');
	let formSnoozeMinutes = $state(5);

	const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

	onMount(async () => {
		if (authStore.isAuthenticated) {
			await alarmsStore.fetchAlarms();
		}
	});

	function openNewForm() {
		editingId = null;
		formTime = '07:00';
		formLabel = '';
		formRepeatDays = [];
		formSound = 'default';
		formSnoozeMinutes = 5;
		showForm = true;
	}

	function openEditForm(alarm: any) {
		editingId = alarm.id;
		formTime = alarm.time.slice(0, 5); // HH:MM
		formLabel = alarm.label || '';
		formRepeatDays = alarm.repeatDays || [];
		formSound = alarm.sound || 'default';
		formSnoozeMinutes = alarm.snoozeMinutes || 5;
		showForm = true;
	}

	function closeForm() {
		showForm = false;
		editingId = null;
	}

	function toggleDay(day: number) {
		if (formRepeatDays.includes(day)) {
			formRepeatDays = formRepeatDays.filter((d) => d !== day);
		} else {
			formRepeatDays = [...formRepeatDays, day];
		}
	}

	async function handleSubmit() {
		const input: CreateAlarmInput = {
			time: formTime + ':00',
			label: formLabel || undefined,
			repeatDays: formRepeatDays.length > 0 ? formRepeatDays : undefined,
			sound: formSound,
			snoozeMinutes: formSnoozeMinutes,
		};

		let result;
		if (editingId) {
			result = await alarmsStore.updateAlarm(editingId, input);
		} else {
			result = await alarmsStore.createAlarm(input);
		}

		if (result.success) {
			toast.success(editingId ? 'Wecker aktualisiert' : 'Wecker erstellt');
			closeForm();
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
		if (
			days.length === 5 &&
			days.includes(1) &&
			days.includes(2) &&
			days.includes(3) &&
			days.includes(4) &&
			days.includes(5)
		)
			return 'Wochentags';
		if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Am Wochenende';
		return days.map((d) => dayNames[d]).join(', ');
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-foreground">{$_('alarm.title')}</h1>
		<button class="btn btn-primary" onclick={openNewForm}>
			+ {$_('alarm.add')}
		</button>
	</div>

	<!-- Alarm List -->
	{#if alarmsStore.loading}
		<div class="flex justify-center py-12">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"
			></div>
		</div>
	{:else if alarmsStore.alarms.length === 0}
		<div class="card py-12 text-center">
			<p class="text-lg text-muted-foreground">{$_('alarm.noAlarms')}</p>
			<button class="btn btn-primary mt-4" onclick={openNewForm}>
				{$_('alarm.add')}
			</button>
		</div>
	{:else}
		<div class="space-y-3">
			{#each alarmsStore.alarms as alarm (alarm.id)}
				<div class="alarm-card" class:disabled={!alarm.enabled}>
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<button class="text-left w-full" onclick={() => openEditForm(alarm)}>
								<div class="text-3xl font-light text-foreground">
									{alarm.time.slice(0, 5)}
								</div>
								{#if alarm.label}
									<p class="mt-1 text-sm font-medium text-foreground">{alarm.label}</p>
								{/if}
								<p class="mt-1 text-sm text-muted-foreground">
									{getRepeatText(alarm.repeatDays)}
								</p>
							</button>
						</div>
						<div class="flex items-center gap-4">
							<button
								class="text-muted-foreground hover:text-error"
								onclick={() => handleDelete(alarm.id)}
							>
								🗑
							</button>
							<button
								class="toggle"
								class:active={alarm.enabled}
								onclick={() => handleToggle(alarm.id)}
							></button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Form Modal -->
	{#if showForm}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div class="card w-full max-w-md">
				<h2 class="mb-4 text-xl font-semibold">
					{editingId ? $_('alarm.edit') : $_('alarm.add')}
				</h2>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleSubmit();
					}}
				>
					<!-- Time -->
					<div class="mb-4">
						<label class="mb-1 block text-sm font-medium">{$_('alarm.time')}</label>
						<input type="time" class="input time-input" bind:value={formTime} />
					</div>

					<!-- Label -->
					<div class="mb-4">
						<label class="mb-1 block text-sm font-medium">{$_('alarm.label')}</label>
						<input
							type="text"
							class="input"
							placeholder="Arbeit, Sport, etc."
							bind:value={formLabel}
						/>
					</div>

					<!-- Repeat Days -->
					<div class="mb-4">
						<label class="mb-2 block text-sm font-medium">{$_('alarm.repeat')}</label>
						<div class="day-selector">
							{#each dayNames as day, i}
								<button
									type="button"
									class:active={formRepeatDays.includes(i)}
									onclick={() => toggleDay(i)}
								>
									{day}
								</button>
							{/each}
						</div>
					</div>

					<!-- Sound -->
					<div class="mb-4">
						<label class="mb-1 block text-sm font-medium">{$_('alarm.sound')}</label>
						<select class="input" bind:value={formSound}>
							{#each ALARM_SOUNDS as sound}
								<option value={sound.id}>{sound.nameDE}</option>
							{/each}
						</select>
					</div>

					<!-- Snooze -->
					<div class="mb-6">
						<label class="mb-1 block text-sm font-medium">{$_('alarm.snooze')}</label>
						<select class="input" bind:value={formSnoozeMinutes}>
							<option value={5}>5 Minuten</option>
							<option value={10}>10 Minuten</option>
							<option value={15}>15 Minuten</option>
							<option value={30}>30 Minuten</option>
						</select>
					</div>

					<!-- Actions -->
					<div class="flex gap-3">
						<button type="button" class="btn btn-secondary flex-1" onclick={closeForm}>
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
