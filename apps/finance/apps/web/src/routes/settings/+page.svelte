<script lang="ts">
	import { onMount } from 'svelte';
	import { settingsStore } from '$lib/stores';
	import { CURRENCIES, DATE_FORMATS, WEEK_START_OPTIONS } from '@finance/shared';
	import type { UpdateUserSettingsInput } from '@finance/shared';

	let isSaving = $state(false);
	let successMessage = $state<string | null>(null);

	onMount(async () => {
		await settingsStore.fetchSettings();
	});

	async function saveSettings(e: Event) {
		e.preventDefault();
		isSaving = true;
		successMessage = null;

		try {
			const data: UpdateUserSettingsInput = {
				defaultCurrency: settingsStore.settings.defaultCurrency,
				locale: settingsStore.settings.locale,
				dateFormat: settingsStore.settings.dateFormat,
				weekStartsOn: settingsStore.settings.weekStartsOn,
			};
			await settingsStore.updateSettings(data);
			successMessage = 'Einstellungen gespeichert!';
			setTimeout(() => (successMessage = null), 3000);
		} catch (e) {
			// Error handled by store
		} finally {
			isSaving = false;
		}
	}
</script>

<svelte:head>
	<title>Einstellungen | Finance</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<h1 class="text-2xl font-bold">Einstellungen</h1>

	{#if settingsStore.isLoading}
		<div class="flex items-center justify-center py-12">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
		</div>
	{:else}
		<form onsubmit={saveSettings} class="space-y-6">
			<div class="rounded-lg border border-border bg-card p-6">
				<h2 class="mb-4 text-lg font-semibold">Regionale Einstellungen</h2>

				<div class="space-y-4">
					<div>
						<label for="currency" class="mb-1 block text-sm font-medium">Standard-Währung</label>
						<select
							id="currency"
							bind:value={settingsStore.settings.defaultCurrency}
							class="w-full rounded-lg border border-border bg-background px-3 py-2"
						>
							{#each CURRENCIES as currency}
								<option value={currency.code}
									>{currency.code} - {currency.name.de} ({currency.symbol})</option
								>
							{/each}
						</select>
					</div>

					<div>
						<label for="locale" class="mb-1 block text-sm font-medium">Sprache / Region</label>
						<select
							id="locale"
							bind:value={settingsStore.settings.locale}
							class="w-full rounded-lg border border-border bg-background px-3 py-2"
						>
							<option value="de-DE">Deutsch (Deutschland)</option>
							<option value="de-AT">Deutsch (Österreich)</option>
							<option value="de-CH">Deutsch (Schweiz)</option>
							<option value="en-US">English (US)</option>
							<option value="en-GB">English (UK)</option>
						</select>
					</div>

					<div>
						<label for="dateFormat" class="mb-1 block text-sm font-medium">Datumsformat</label>
						<select
							id="dateFormat"
							bind:value={settingsStore.settings.dateFormat}
							class="w-full rounded-lg border border-border bg-background px-3 py-2"
						>
							{#each DATE_FORMATS as format}
								<option value={format.value}>{format.label}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="weekStart" class="mb-1 block text-sm font-medium">Woche beginnt am</label>
						<select
							id="weekStart"
							bind:value={settingsStore.settings.weekStartsOn}
							class="w-full rounded-lg border border-border bg-background px-3 py-2"
						>
							{#each WEEK_START_OPTIONS as option}
								<option value={option.value}>{option.label.de}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>

			{#if settingsStore.error}
				<div class="rounded-lg bg-destructive/10 p-4 text-destructive">{settingsStore.error}</div>
			{/if}

			{#if successMessage}
				<div class="rounded-lg bg-green-500/10 p-4 text-green-600">{successMessage}</div>
			{/if}

			<div class="flex justify-end">
				<button
					type="submit"
					disabled={isSaving}
					class="rounded-lg bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
				>
					{isSaving ? 'Speichern...' : 'Speichern'}
				</button>
			</div>
		</form>

		<!-- Danger Zone -->
		<div class="rounded-lg border border-destructive bg-destructive/5 p-6">
			<h2 class="mb-4 text-lg font-semibold text-destructive">Gefahrenzone</h2>
			<p class="mb-4 text-sm text-muted-foreground">
				Diese Aktionen können nicht rückgängig gemacht werden.
			</p>
			<button
				class="rounded-lg border border-destructive px-4 py-2 text-destructive hover:bg-destructive/10"
			>
				Alle Daten löschen
			</button>
		</div>
	{/if}
</div>
