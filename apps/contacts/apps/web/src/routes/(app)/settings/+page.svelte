<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { APP_VERSION } from '$lib/version';
	import {
		contactsSettings,
		type ContactView,
		type ContactSortBy,
		type ContactSortOrder,
		type DateFormat,
	} from '$lib/stores/settings.svelte';
	import {
		SettingsPage,
		SettingsSection,
		SettingsCard,
		SettingsRow,
		SettingsToggle,
		SettingsSelect,
		SettingsNumberInput,
		SettingsDangerZone,
		SettingsDangerButton,
		GlobalSettingsSection,
	} from '@manacore/shared-ui';
	import {
		User,
		Envelope,
		ShieldCheck,
		Layout,
		List,
		SortAscending,
		ArrowsDownUp,
		Image,
		Buildings,
		Hash,
		AddressBook,
		Calendar,
		Cake,
		Bell,
		ArrowsLeftRight,
		Upload,
		Download,
		Archive,
		Copy,
		ClipboardText,
		Sliders,
		Lock,
		EyeSlash,
		ShareNetwork,
		Trash,
		Info,
		Tag,
		ArrowCounterClockwise,
		SignOut,
	} from '@manacore/shared-icons';

	// Options for selects
	const viewOptions = [
		{ value: 'grid', label: 'Kacheln' },
		{ value: 'alphabet', label: 'Alphabetisch' },
	];

	const sortByOptions = [
		{ value: 'name', label: 'Name' },
		{ value: 'company', label: 'Firma' },
		{ value: 'created', label: 'Erstellt' },
		{ value: 'updated', label: 'Aktualisiert' },
	];

	const sortOrderOptions = [
		{ value: 'asc', label: 'Aufsteigend (A-Z)' },
		{ value: 'desc', label: 'Absteigend (Z-A)' },
	];

	const nameFormatOptions = [
		{ value: 'first-last', label: 'Vorname Nachname' },
		{ value: 'last-first', label: 'Nachname, Vorname' },
	];

	const dateFormatOptions = [
		{ value: 'dd.MM.yyyy', label: 'TT.MM.JJJJ (deutsch)' },
		{ value: 'MM/dd/yyyy', label: 'MM/TT/JJJJ (US)' },
		{ value: 'yyyy-MM-dd', label: 'JJJJ-MM-TT (ISO)' },
	];

	const duplicateSensitivityOptions = [
		{ value: 'strict', label: 'Streng' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'loose', label: 'Locker' },
	];

	// Translation function for start page labels
	const startPageLabels: Record<string, string> = {
		'nav.contacts': 'Kontakte',
		'nav.groups': 'Gruppen',
	};

	function translateLabel(key: string): string {
		return startPageLabels[key] || key;
	}

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Load user settings from server
		await userSettings.load();

		// Initialize contacts settings from localStorage
		contactsSettings.initialize();
	});

	async function handleLogout() {
		await authStore.signOut();
		goto('/login');
	}

	function handleResetSettings() {
		if (confirm('Alle Einstellungen auf Standardwerte zurücksetzen?')) {
			contactsSettings.reset();
		}
	}
</script>

<svelte:head>
	<title>Einstellungen - Kontakte</title>
</svelte:head>

<SettingsPage title="Einstellungen" subtitle="Passe die App an deine Vorlieben an.">
	<!-- Account Section -->
	<SettingsSection title="Konto">
		{#snippet icon()}
			<User size={20} />
		{/snippet}

		<SettingsCard>
			<SettingsRow label="E-Mail" description={authStore.user?.email || 'Nicht angemeldet'}>
				{#snippet icon()}
					<Envelope size={20} />
				{/snippet}
			</SettingsRow>

			<SettingsRow label="Konto-Status" description="Dein aktueller Kontostatus" border={false}>
				{#snippet icon()}
					<ShieldCheck size={20} />
				{/snippet}
				<span
					class="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400"
				>
					Aktiv
				</span>
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<!-- Global Settings Section (synced across all apps) -->
	<GlobalSettingsSection {userSettings} appId="contacts" t={translateLabel} />

	<!-- Display Settings Section -->
	<SettingsSection title="Anzeige">
		{#snippet icon()}
			<Layout size={20} />
		{/snippet}

		<SettingsCard>
			<SettingsSelect
				label="Standard-Ansicht"
				description="Ansicht beim Öffnen der App"
				options={viewOptions}
				value={contactsSettings.defaultView}
				onchange={(v: string | number | null) =>
					contactsSettings.set('defaultView', v as ContactView)}
			>
				{#snippet icon()}
					<List size={20} />
				{/snippet}
			</SettingsSelect>

			<SettingsSelect
				label="Sortierung"
				description="Standard-Sortierung der Kontakte"
				options={sortByOptions}
				value={contactsSettings.sortBy}
				onchange={(v: string | number | null) => contactsSettings.set('sortBy', v as ContactSortBy)}
			>
				{#snippet icon()}
					<SortAscending size={20} />
				{/snippet}
			</SettingsSelect>

			<SettingsSelect
				label="Sortierreihenfolge"
				description="Aufsteigende oder absteigende Sortierung"
				options={sortOrderOptions}
				value={contactsSettings.sortOrder}
				onchange={(v: string | number | null) =>
					contactsSettings.set('sortOrder', v as ContactSortOrder)}
			>
				{#snippet icon()}
					<ArrowsDownUp size={20} />
				{/snippet}
			</SettingsSelect>

			<SettingsToggle
				label="Fotos anzeigen"
				description="Kontaktfotos in der Liste anzeigen"
				isOn={contactsSettings.showPhotos}
				onToggle={(v) => contactsSettings.set('showPhotos', v)}
			>
				{#snippet icon()}
					<Image size={20} />
				{/snippet}
			</SettingsToggle>

			<SettingsToggle
				label="Firma anzeigen"
				description="Firmenname in der Kontaktliste anzeigen"
				isOn={contactsSettings.showCompany}
				onToggle={(v) => contactsSettings.set('showCompany', v)}
			>
				{#snippet icon()}
					<Buildings size={20} />
				{/snippet}
			</SettingsToggle>

			<SettingsNumberInput
				label="Kontakte pro Seite"
				description="Anzahl der Kontakte pro Seite"
				value={contactsSettings.contactsPerPage}
				onchange={(v: number | null) => contactsSettings.set('contactsPerPage', v ?? 50)}
				min={10}
				max={200}
				border={false}
			>
				{#snippet icon()}
					<Hash size={20} />
				{/snippet}
			</SettingsNumberInput>
		</SettingsCard>
	</SettingsSection>

	<!-- Contact Format Section -->
	<SettingsSection title="Kontakt-Darstellung">
		{#snippet icon()}
			<AddressBook size={20} />
		{/snippet}

		<SettingsCard>
			<SettingsSelect
				label="Namensformat"
				description="Reihenfolge von Vor- und Nachname"
				options={nameFormatOptions}
				value={contactsSettings.nameFormat}
				onchange={(v: string | number | null) =>
					contactsSettings.set('nameFormat', v as 'first-last' | 'last-first')}
			>
				{#snippet icon()}
					<User size={20} />
				{/snippet}
			</SettingsSelect>

			<SettingsSelect
				label="Datumsformat"
				description="Format für Geburtstage und andere Daten"
				options={dateFormatOptions}
				value={contactsSettings.dateFormat}
				onchange={(v: string | number | null) =>
					contactsSettings.set('dateFormat', v as DateFormat)}
			>
				{#snippet icon()}
					<Calendar size={20} />
				{/snippet}
			</SettingsSelect>

			<SettingsToggle
				label="Geburtstags-Erinnerungen"
				description="Benachrichtigungen bei bevorstehenden Geburtstagen"
				isOn={contactsSettings.showBirthdayReminders}
				onToggle={(v) => contactsSettings.set('showBirthdayReminders', v)}
			>
				{#snippet icon()}
					<Cake size={20} />
				{/snippet}
			</SettingsToggle>

			<SettingsNumberInput
				label="Erinnerung X Tage vorher"
				description="Tage vor dem Geburtstag erinnern"
				value={contactsSettings.birthdayReminderDays}
				onchange={(v: number | null) => contactsSettings.set('birthdayReminderDays', v ?? 7)}
				min={1}
				max={30}
				border={false}
			>
				{#snippet icon()}
					<Bell size={20} />
				{/snippet}
			</SettingsNumberInput>
		</SettingsCard>
	</SettingsSection>

	<!-- Import/Export Section -->
	<SettingsSection title="Daten">
		{#snippet icon()}
			<ArrowsLeftRight size={20} />
		{/snippet}

		<SettingsCard>
			<SettingsRow
				label="Kontakte importieren"
				description="Aus Datei oder Google importieren"
				href="/data?tab=import"
			>
				{#snippet icon()}
					<Upload size={20} />
				{/snippet}
			</SettingsRow>

			<SettingsRow
				label="Kontakte exportieren"
				description="Als vCard oder CSV herunterladen"
				href="/data?tab=export"
			>
				{#snippet icon()}
					<Download size={20} />
				{/snippet}
			</SettingsRow>

			<SettingsRow
				label="Archiv"
				description="Archivierte Kontakte anzeigen und verwalten"
				href="/archive"
				border={false}
			>
				{#snippet icon()}
					<Archive size={20} />
				{/snippet}
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<!-- Duplicates Section -->
	<SettingsSection title="Duplikate">
		{#snippet icon()}
			<Copy size={20} />
		{/snippet}

		<SettingsCard>
			<SettingsToggle
				label="Automatische Erkennung"
				description="Duplikate automatisch beim Import erkennen"
				isOn={contactsSettings.autoDetectDuplicates}
				onToggle={(v) => contactsSettings.set('autoDetectDuplicates', v)}
			>
				{#snippet icon()}
					<ClipboardText size={20} />
				{/snippet}
			</SettingsToggle>

			<SettingsSelect
				label="Erkennungs-Empfindlichkeit"
				description="Wie streng sollen Duplikate erkannt werden?"
				options={duplicateSensitivityOptions}
				value={contactsSettings.duplicateSensitivity}
				onchange={(v: string | number | null) =>
					contactsSettings.set('duplicateSensitivity', v as 'strict' | 'normal' | 'loose')}
				border={false}
			>
				{#snippet icon()}
					<Sliders size={20} />
				{/snippet}
			</SettingsSelect>
		</SettingsCard>
	</SettingsSection>

	<!-- Privacy Section -->
	<SettingsSection title="Datenschutz">
		{#snippet icon()}
			<Lock size={20} />
		{/snippet}

		<SettingsCard>
			<SettingsToggle
				label="Datenschutz-Modus"
				description="Kontaktfotos und sensible Daten unkenntlich machen"
				isOn={contactsSettings.privacyMode}
				onToggle={(v) => contactsSettings.set('privacyMode', v)}
			>
				{#snippet icon()}
					<EyeSlash size={20} />
				{/snippet}
			</SettingsToggle>

			<SettingsToggle
				label="Teilen bestätigen"
				description="Bestätigung vor dem Teilen von Kontakten"
				isOn={contactsSettings.confirmBeforeSharing}
				onToggle={(v) => contactsSettings.set('confirmBeforeSharing', v)}
			>
				{#snippet icon()}
					<ShareNetwork size={20} />
				{/snippet}
			</SettingsToggle>

			<SettingsToggle
				label="Löschen bestätigen"
				description="Bestätigung vor dem Löschen von Kontakten"
				isOn={userSettings.general?.confirmOnDelete ?? true}
				onToggle={(v) => userSettings.updateGeneral({ confirmOnDelete: v })}
				border={false}
			>
				{#snippet icon()}
					<Trash size={20} />
				{/snippet}
			</SettingsToggle>
		</SettingsCard>
	</SettingsSection>

	<!-- About Section -->
	<SettingsSection title="Über">
		{#snippet icon()}
			<Info size={20} />
		{/snippet}

		<SettingsCard>
			<SettingsRow label="Version" border={false}>
				{#snippet icon()}
					<Tag size={20} />
				{/snippet}
				<span class="text-[hsl(var(--muted-foreground))]">1.0.0</span>
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<!-- Danger Zone -->
	<SettingsDangerZone title="Gefahrenzone">
		<SettingsDangerButton
			label="Einstellungen zurücksetzen"
			description="Alle App-Einstellungen auf Standardwerte zurücksetzen"
			buttonText="Zurücksetzen"
			onclick={handleResetSettings}
		>
			{#snippet icon()}
				<ArrowCounterClockwise size={20} />
			{/snippet}
		</SettingsDangerButton>

		<SettingsDangerButton
			label="Abmelden"
			description="Von deinem Konto abmelden"
			buttonText="Abmelden"
			onclick={handleLogout}
			border={false}
		>
			{#snippet icon()}
				<SignOut size={20} />
			{/snippet}
		</SettingsDangerButton>
	</SettingsDangerZone>

	<p class="mt-8 pb-4 text-center text-xs text-gray-400 dark:text-gray-600">v{APP_VERSION}</p>
</SettingsPage>
