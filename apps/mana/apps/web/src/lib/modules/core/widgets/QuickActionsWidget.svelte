<script lang="ts">
	/**
	 * QuickActionsWidget — Schnellzugriff-Buttons für häufige Aktionen.
	 *
	 * Navigiert direkt zu den jeweiligen App-Routen innerhalb der Unified App.
	 * Thin wrapper around <QuickActionsList> in compact mode.
	 */
	import QuickActionsList from '$lib/components/QuickActionsList.svelte';

	const actions = [
		{
			href: '/todo',
			icon: '&#9989;',
			label: 'Neue Aufgabe',
			description: 'Aufgabe erstellen',
		},
		{
			href: '/calendar',
			icon: '&#128197;',
			label: 'Neuer Termin',
			description: 'Termin erstellen',
		},
		{
			href: '/contacts',
			icon: '&#128100;',
			label: 'Neuer Kontakt',
			description: 'Kontakt anlegen',
		},
		{
			href: '/context',
			icon: '&#128221;',
			label: 'Neue Notiz',
			description: 'Dokument erstellen',
		},
		{
			href: '/times',
			icon: '&#9201;',
			label: 'Timer starten',
			description: 'Zeiterfassung starten',
		},
	];
</script>

<QuickActionsList title="Schnellzugriff" {actions} compact />
