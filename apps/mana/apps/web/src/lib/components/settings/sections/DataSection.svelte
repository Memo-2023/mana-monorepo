<script lang="ts">
	import { Cloud, FileText, CaretRight } from '@mana/shared-icons';
	import SettingsPanel from '../SettingsPanel.svelte';
	import SettingsSectionHeader from '../SettingsSectionHeader.svelte';
</script>

<SettingsPanel id="cloud-sync">
	<SettingsSectionHeader
		icon={Cloud}
		title="Cloud Sync"
		description="Synchronisiere deine Daten über alle Geräte"
		tone="blue"
	>
		{#snippet action()}
			<a href="/settings/sync" class="text-sm text-primary hover:underline">Einstellungen</a>
		{/snippet}
	</SettingsSectionHeader>
</SettingsPanel>

<SettingsPanel id="my-data">
	<SettingsSectionHeader
		icon={FileText}
		title="Meine Daten (DSGVO)"
		description="Datenschutz und Datenexport"
		tone="purple"
	/>

	<div class="space-y-4">
		<div class="flex items-center justify-between border-b border-border py-3">
			<div>
				<p class="font-medium">Daten ansehen & exportieren</p>
				<p class="text-sm text-muted-foreground">
					Sieh alle deine gespeicherten Daten ein und exportiere sie als JSON
				</p>
			</div>
			<a
				href="/settings/my-data"
				class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
			>
				Meine Daten
				<CaretRight size={16} />
			</a>
		</div>

		<div
			class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium text-red-600 dark:text-red-400">Konto löschen</p>
					<p class="text-sm text-muted-foreground">
						Das Löschen deines Kontos kann nicht rückgängig gemacht werden.
					</p>
				</div>
				<a
					href="/settings/my-data"
					class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
				>
					Verwalten
				</a>
			</div>
		</div>
	</div>
</SettingsPanel>
