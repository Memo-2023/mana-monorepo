<script lang="ts">
	import { getContext } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { settingsCollection } from '$lib/data/local-store';
	import type { TimesSettings } from '@times/shared';
	import { CURRENCIES, ROUNDING_INCREMENTS } from '@times/shared/constants';

	const settings = getContext<{ value: TimesSettings | null }>('settings');

	// Local edit state, synced from settings
	let workingHoursPerDay = $state(8);
	let workingDaysPerWeek = $state(5);
	let roundingIncrement = $state(0);
	let roundingMethod = $state<'none' | 'up' | 'down' | 'nearest'>('none');
	let defaultRate = $state(0);
	let defaultCurrency = $state('EUR');
	let weekStartsOn = $state<0 | 1>(1);
	let timerReminderMinutes = $state(0);
	let autoStopTimerHours = $state(0);
	let defaultVisibility = $state<'private' | 'guild'>('private');
	let initialized = $state(false);

	$effect(() => {
		const s = settings.value;
		if (s && !initialized) {
			workingHoursPerDay = s.workingHoursPerDay;
			workingDaysPerWeek = s.workingDaysPerWeek;
			roundingIncrement = s.roundingIncrement;
			roundingMethod = s.roundingMethod;
			defaultRate = s.defaultBillingRate?.amount ?? 0;
			defaultCurrency = s.defaultBillingRate?.currency ?? 'EUR';
			weekStartsOn = s.weekStartsOn;
			timerReminderMinutes = s.timerReminderMinutes;
			autoStopTimerHours = s.autoStopTimerHours;
			defaultVisibility = s.defaultVisibility;
			initialized = true;
		}
	});

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	function save(updates: Record<string, unknown>) {
		if (!settings.value) return;
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			settingsCollection.update(settings.value!.id, updates);
		}, 500);
	}
</script>

<svelte:head>
	<title>{$_('settings.title')} | Times</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">{$_('settings.title')}</h1>

	<!-- Working Time -->
	<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-4">
		<h2 class="text-sm font-semibold text-[hsl(var(--foreground))]">Arbeitszeit</h2>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label class="mb-1 block text-sm text-[hsl(var(--foreground))]"
					>{$_('settings.workingHours')}</label
				>
				<input
					type="number"
					value={workingHoursPerDay}
					min="1"
					max="24"
					step="0.5"
					oninput={(e) => {
						workingHoursPerDay = parseFloat((e.target as HTMLInputElement).value) || 8;
						save({ workingHoursPerDay });
					}}
					class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
				/>
			</div>
			<div>
				<label class="mb-1 block text-sm text-[hsl(var(--foreground))]"
					>{$_('settings.workingDays')}</label
				>
				<input
					type="number"
					value={workingDaysPerWeek}
					min="1"
					max="7"
					oninput={(e) => {
						workingDaysPerWeek = parseInt((e.target as HTMLInputElement).value) || 5;
						save({ workingDaysPerWeek });
					}}
					class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
				/>
			</div>
		</div>

		<div>
			<label class="mb-1 block text-sm text-[hsl(var(--foreground))]"
				>{$_('settings.weekStart')}</label
			>
			<div class="flex gap-2">
				<button
					onclick={() => {
						weekStartsOn = 1;
						save({ weekStartsOn: 1 });
					}}
					class="rounded-lg px-4 py-2 text-sm transition-colors {weekStartsOn === 1
						? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
						: 'border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'}"
					>{$_('settings.monday')}</button
				>
				<button
					onclick={() => {
						weekStartsOn = 0;
						save({ weekStartsOn: 0 });
					}}
					class="rounded-lg px-4 py-2 text-sm transition-colors {weekStartsOn === 0
						? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
						: 'border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'}"
					>{$_('settings.sunday')}</button
				>
			</div>
		</div>
	</div>

	<!-- Rounding -->
	<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-4">
		<h2 class="text-sm font-semibold text-[hsl(var(--foreground))]">{$_('settings.rounding')}</h2>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label class="mb-1 block text-sm text-[hsl(var(--foreground))]">Intervall</label>
				<select
					value={roundingIncrement}
					onchange={(e) => {
						roundingIncrement = parseInt((e.target as HTMLSelectElement).value);
						save({ roundingIncrement });
					}}
					class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
				>
					{#each ROUNDING_INCREMENTS as inc}
						<option value={inc}>{inc === 0 ? $_('settings.none') : `${inc} min`}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="mb-1 block text-sm text-[hsl(var(--foreground))]"
					>{$_('settings.roundingMethod')}</label
				>
				<select
					value={roundingMethod}
					onchange={(e) => {
						roundingMethod = (e.target as HTMLSelectElement).value as any;
						save({ roundingMethod });
					}}
					class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
				>
					<option value="none">{$_('settings.none')}</option>
					<option value="up">{$_('settings.up')}</option>
					<option value="down">{$_('settings.down')}</option>
					<option value="nearest">{$_('settings.nearest')}</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Billing -->
	<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-4">
		<h2 class="text-sm font-semibold text-[hsl(var(--foreground))]">
			{$_('settings.billingRate')}
		</h2>

		<div class="flex items-end gap-2">
			<div class="flex-1">
				<label class="mb-1 block text-sm text-[hsl(var(--foreground))]"
					>{$_('settings.billingRate')}</label
				>
				<input
					type="number"
					value={defaultRate}
					min="0"
					step="5"
					oninput={(e) => {
						defaultRate = parseFloat((e.target as HTMLInputElement).value) || 0;
						save({
							defaultBillingRate:
								defaultRate > 0
									? { amount: defaultRate, currency: defaultCurrency, per: 'hour' }
									: null,
						});
					}}
					class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
				/>
			</div>
			<div>
				<label class="mb-1 block text-sm text-[hsl(var(--foreground))]"
					>{$_('settings.currency')}</label
				>
				<select
					value={defaultCurrency}
					onchange={(e) => {
						defaultCurrency = (e.target as HTMLSelectElement).value;
						if (defaultRate > 0)
							save({
								defaultBillingRate: { amount: defaultRate, currency: defaultCurrency, per: 'hour' },
							});
					}}
					class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
				>
					{#each CURRENCIES as curr}
						<option value={curr.code}>{curr.symbol} {curr.code}</option>
					{/each}
				</select>
			</div>
			<span class="pb-2 text-sm text-[hsl(var(--muted-foreground))]">/h</span>
		</div>
	</div>

	<!-- Timer -->
	<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-4">
		<h2 class="text-sm font-semibold text-[hsl(var(--foreground))]">Timer</h2>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label class="mb-1 block text-sm text-[hsl(var(--foreground))]"
					>{$_('settings.timerReminder')}</label
				>
				<p class="mb-1.5 text-xs text-[hsl(var(--muted-foreground))]">0 = aus</p>
				<input
					type="number"
					value={timerReminderMinutes}
					min="0"
					step="5"
					oninput={(e) => {
						timerReminderMinutes = parseInt((e.target as HTMLInputElement).value) || 0;
						save({ timerReminderMinutes });
					}}
					class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
				/>
			</div>
			<div>
				<label class="mb-1 block text-sm text-[hsl(var(--foreground))]"
					>{$_('settings.autoStop')}</label
				>
				<p class="mb-1.5 text-xs text-[hsl(var(--muted-foreground))]">0 = aus</p>
				<input
					type="number"
					value={autoStopTimerHours}
					min="0"
					step="1"
					oninput={(e) => {
						autoStopTimerHours = parseInt((e.target as HTMLInputElement).value) || 0;
						save({ autoStopTimerHours });
					}}
					class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
				/>
			</div>
		</div>
	</div>

	<!-- Visibility -->
	<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-4">
		<h2 class="text-sm font-semibold text-[hsl(var(--foreground))]">{$_('settings.visibility')}</h2>
		<p class="text-xs text-[hsl(var(--muted-foreground))]">{$_('settings.visibilityDesc')}</p>

		<div class="flex gap-2">
			<button
				onclick={() => {
					defaultVisibility = 'private';
					save({ defaultVisibility: 'private' });
				}}
				class="rounded-lg px-4 py-2 text-sm transition-colors {defaultVisibility === 'private'
					? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
					: 'border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'}"
				>{$_('settings.private')}</button
			>
			<button
				onclick={() => {
					defaultVisibility = 'guild';
					save({ defaultVisibility: 'guild' });
				}}
				class="rounded-lg px-4 py-2 text-sm transition-colors {defaultVisibility === 'guild'
					? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
					: 'border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'}"
				>{$_('settings.guild')}</button
			>
		</div>
	</div>
</div>
